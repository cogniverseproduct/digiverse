// Must stay the first import: prepares the isolated test environment (EMPTY database) before the app loads.
import { baseUrl, getDatabase } from './helpers/freshContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { resetReauthLimiterForTests } from '../src/db/superAdminAccounts.js';

const OWNER_PW = 'OwnerPassword@2026!';
const PEER_PW = 'PeerPassword@2026!ab';
const ADMIN_PW = 'AdminPassword@2026!';
const RETIRED = 'cogniverse.digiverse@gmail.com';

async function call(method: string, path: string, body?: unknown, token?: string) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: res.status, body: (await res.json().catch(() => ({}))) as any };
}

async function login(identifier: string, password: string) {
  const r = await call('POST', '/api/auth/login', { identifier, password });
  return { status: r.status, token: r.body.token as string, user: r.body.user, body: r.body };
}

const SA = '/api/super-admins';
const rawUser = (where: string, ...params: any[]) => getDatabase().prepare(`SELECT * FROM users WHERE ${where}`).get(...params) as any;
const auditRows = () => JSON.stringify(getDatabase().prepare('SELECT * FROM audit_logs ORDER BY id').all());
const actions = () => (getDatabase().prepare('SELECT action FROM audit_logs').all() as any[]).map((r) => r.action);

describe('Super Admin Account Management', () => {
  let ownerToken = '';
  let ownerId = '';
  let adminToken = '';
  let adminId = '';
  let peer: { id: string; token: string; email: string; username: string };

  const createRaw = (over: Record<string, unknown> = {}, token = ownerToken) =>
    call('POST', SA, {
      name: 'Second Admin', email: 'second.owner@outlook.com', username: 'second_sa',
      password: PEER_PW, confirmPassword: PEER_PW, status: 'ACTIVE', currentPassword: OWNER_PW, ...over
    }, token);

  // Most tests only need a working second Super Admin, so this settles the "must choose own password" flag the
  // way a person completing it would. Test 21 exercises the real forced-change behaviour without this.
  const create = async (over: Record<string, unknown> = {}, token = ownerToken) => {
    const res = await createRaw(over, token);
    if (res.status === 201) getDatabase().prepare('UPDATE users SET must_change_password = 0 WHERE id = ?').run(res.body.account.id);
    return res;
  };

  before(async () => {
    const setup = await call('POST', '/api/auth/setup', {
      name: 'Owner One', username: 'owner_one', email: 'owner@company.co.in', password: OWNER_PW, confirmPassword: OWNER_PW
    });
    assert.equal(setup.status, 201, JSON.stringify(setup.body));
    ownerToken = setup.body.token;
    ownerId = setup.body.user.id;

    const bcrypt = (await import('bcryptjs')).default;
    const { repository } = await import('../src/db/repository.js');
    const admin = await repository.createUser({
      id: 'acct-admin', email: 'staff@yahoo.com', username: 'acct_admin',
      passwordHash: await bcrypt.hash(ADMIN_PW, 10), name: 'Staff Admin', role: 'ADMIN', isActive: true
    });
    adminId = admin.id;
    adminToken = (await login('acct_admin', ADMIN_PW)).token;
  });

  test('1. First-run setup makes the first Super Admin the Product Owner', async () => {
    assert.equal(rawUser('id = ?', ownerId).is_platform_owner, 1);
    const list = await call('GET', SA, undefined, ownerToken);
    assert.equal(list.status, 200);
    assert.equal(list.body.summary.total, 1);
    assert.equal(list.body.summary.ownerId, ownerId);
    assert.equal(list.body.you.isOwner, true);
    assert.ok(!JSON.stringify(list.body).includes('password'), 'no password material is ever returned');
  });

  test('2. Unauthorized callers cannot reach the module (no token, bad token, ordinary Admin)', async () => {
    for (const [m, p, b] of [
      ['GET', SA, undefined], ['POST', SA, {}], ['PATCH', `${SA}/${ownerId}`, {}], ['POST', `${SA}/${ownerId}/password`, {}],
      ['POST', `${SA}/${ownerId}/status`, {}], ['POST', `${SA}/${ownerId}/revoke`, {}],
      ['POST', `${SA}/transfer`, {}], ['POST', `${SA}/transfer/accept`, {}], ['POST', `${SA}/transfer/cancel`, {}]
    ] as const) {
      assert.equal((await call(m, p, b)).status, 401, `${m} ${p} without token`);
      assert.equal((await call(m, p, b, 'not.a.jwt')).status, 401, `${m} ${p} bad token`);
      assert.equal((await call(m, p, b, adminToken)).status, 403, `${m} ${p} as Admin`);
    }
    // An Admin who tries anyway creates nothing and promotes nothing.
    const attempt = await create({ email: 'sneaky@gmail.com', username: 'sneaky' }, adminToken);
    assert.equal(attempt.status, 403);
    assert.equal(rawUser("email = 'sneaky@gmail.com'"), undefined);
    assert.equal(rawUser('id = ?', adminId).role, 'ADMIN');
    // Public setup cannot be used as a back door once an owner exists.
    assert.equal((await call('POST', '/api/auth/setup', { username: 'backdoor', email: 'b@gmail.com', password: OWNER_PW, confirmPassword: OWNER_PW })).status, 403);
  });

  test('3. Impersonated Admin-view sessions cannot use the module', async () => {
    const imp = await call('POST', `/api/admin/users/${adminId}/impersonate`, { superAdminPassword: OWNER_PW, reason: 'test' }, ownerToken);
    assert.equal(imp.status, 200, JSON.stringify(imp.body));
    assert.equal((await call('GET', SA, undefined, imp.body.token)).status, 403);
  });

  test('4. Creating a second Super Admin needs fresh password confirmation and validates input', async () => {
    const before = auditRows();
    assert.equal((await create({ currentPassword: undefined })).status, 400, 'missing re-auth');
    assert.equal((await create({ currentPassword: 'wrong-password' })).status, 401, 'wrong re-auth');
    assert.equal((await create({ name: 'x' })).status, 400);
    assert.equal((await create({ email: 'not-an-email' })).status, 400);
    assert.equal((await create({ email: 'owner@company' })).status, 400);
    assert.equal((await create({ email: RETIRED })).status, 400, 'retired identity');
    assert.equal((await create({ password: 'short1!', confirmPassword: 'short1!' })).status, 400);
    assert.equal((await create({ confirmPassword: PEER_PW + 'x' })).status, 400);
    assert.equal((await create({ username: 'a b' })).status, 400);
    assert.equal((await create({ status: 'SUDO' })).status, 400);
    assert.equal(rawUser("email = 'second.owner@outlook.com'"), undefined, 'rejected requests create nothing');
    assert.equal(before === auditRows() || actions().includes('SUPER_ADMIN_REAUTH_FAILED'), true);

    const ok = await create();
    assert.equal(ok.status, 201, JSON.stringify(ok.body));
    assert.equal(ok.body.account.isOwner, false);
    assert.equal(ok.body.account.accountStatus, 'ACTIVE');
    assert.equal(ok.body.account.mustChangePassword, true, 'the new person must replace the password the creator chose');
    assert.equal(rawUser("email = 'second.owner@outlook.com'").role, 'SUPER_ADMIN');
    assert.ok(actions().includes('SUPER_ADMIN_CREATED'));

    // Duplicates are refused case-insensitively and never overwrite or promote anything.
    assert.equal((await create({ email: 'SECOND.OWNER@outlook.com', username: 'other_name' })).status, 409);
    assert.equal((await create({ email: 'x1@gmail.com', username: 'SECOND_SA' })).status, 409);
    assert.equal((await create({ email: 'staff@yahoo.com', username: 'promote_me' })).status, 409, 'an existing Admin is not silently promoted');
    assert.equal(rawUser('id = ?', adminId).role, 'ADMIN');
  });

  test('5. Both Super Admins can sign in (email and username) and use the module', async () => {
    const byEmail = await login('second.owner@outlook.com', PEER_PW);
    const byName = await login('second_sa', PEER_PW);
    assert.equal(byEmail.status, 200);
    assert.equal(byEmail.user.role, 'SUPER_ADMIN');
    assert.equal(byName.user.id, byEmail.user.id);
    assert.equal((await login('owner@company.co.in', OWNER_PW)).status, 200);
    assert.equal((await login('owner_one', OWNER_PW)).status, 200);
    assert.equal((await login('second_sa', 'wrong-password-123')).status, 401);

    peer = { id: byEmail.user.id, token: byEmail.token, email: 'second.owner@outlook.com', username: 'second_sa' };
    const list = await call('GET', SA, undefined, peer.token);
    assert.equal(list.status, 200);
    assert.equal(list.body.summary.total, 2);
    assert.equal(list.body.summary.active, 2);
    assert.equal(list.body.you.isOwner, false);
  });

  test('6. Any valid provider or domain works (Gmail, Outlook, Yahoo, .co.in, .com, .org, .edu) and no domain grants rights', async () => {
    const addresses = ['Dev.One@Gmail.com', 'dev.two@outlook.com', 'dev.three@yahoo.com', 'dev@startup.co.in', 'dev@agency.com', 'dev@charity.org', 'dev@college.edu', 'dev@custom-domain.in'];
    for (const [i, email] of addresses.entries()) {
      const res = await create({ email, username: `provider_sa_${i}` });
      assert.equal(res.status, 201, `${email}: ${JSON.stringify(res.body)}`);
      assert.equal(res.body.account.email, email.toLowerCase());
      assert.equal(res.body.account.isOwner, false);
    }
    // Remove the extra accounts so later checks start from a known roster (peer-revoke, then plain delete in the scratch DB).
    getDatabase().prepare("DELETE FROM users WHERE username LIKE 'provider_sa_%'").run();
  });

  test('7. Creating an inactive Super Admin works but that account cannot sign in until activated', async () => {
    const res = await create({ email: 'dormant@gmail.com', username: 'dormant_sa', status: 'DISABLED' });
    assert.equal(res.status, 201);
    assert.equal(res.body.account.accountStatus, 'DISABLED');
    assert.equal((await login('dormant_sa', PEER_PW)).status, 403);
    const on = await call('POST', `${SA}/${res.body.account.id}/status`, { status: 'ACTIVE', currentPassword: OWNER_PW }, ownerToken);
    assert.equal(on.status, 200);
    assert.equal((await login('dormant_sa', PEER_PW)).status, 200);
    getDatabase().prepare("DELETE FROM users WHERE username = 'dormant_sa'").run();
  });

  test('8. Changing an email preserves the id, password hash, audit history and data; old email stops working', async () => {
    const before = rawUser('id = ?', peer.id);
    const auditBefore = auditRows();

    assert.equal((await call('PATCH', `${SA}/${peer.id}`, { email: 'renamed@startup.co.in', currentPassword: 'nope' }, ownerToken)).status, 401);
    assert.equal((await call('PATCH', `${SA}/${peer.id}`, { email: 'bad', currentPassword: OWNER_PW }, ownerToken)).status, 400);
    assert.equal((await call('PATCH', `${SA}/${peer.id}`, { email: 'staff@yahoo.com', currentPassword: OWNER_PW }, ownerToken)).status, 409);
    assert.equal((await call('PATCH', `${SA}/${peer.id}`, { currentPassword: OWNER_PW }, ownerToken)).status, 400, 'nothing to change');

    const res = await call('PATCH', `${SA}/${peer.id}`, { email: 'Renamed@Startup.co.in', currentPassword: OWNER_PW }, ownerToken);
    assert.equal(res.status, 200, JSON.stringify(res.body));
    const after = rawUser('id = ?', peer.id);
    assert.equal(after.email, 'renamed@startup.co.in');
    for (const column of ['id', 'password_hash', 'role', 'account_status', 'is_active', 'token_version', 'created_at', 'username', 'name', 'is_platform_owner']) {
      assert.equal(after[column], before[column], `${column} must not change`);
    }
    // History is append-only: everything that existed before is still byte-identical.
    const preserved = (JSON.parse(auditBefore) as any[]).every((row) => JSON.stringify(row) === JSON.stringify(
      (getDatabase().prepare('SELECT * FROM audit_logs WHERE id = ?').get(row.id))));
    assert.ok(preserved, 'existing audit rows are untouched');
    assert.ok(actions().includes('SUPER_ADMIN_DETAILS_UPDATED'));

    assert.equal((await login('renamed@startup.co.in', PEER_PW)).status, 200, 'new email works with the same password');
    assert.equal((await login(peer.email, PEER_PW)).status, 401, 'old email no longer resolves');
    assert.equal((await login(peer.username, PEER_PW)).status, 200, 'username still works');
    peer.email = 'renamed@startup.co.in';
    peer.token = (await login(peer.username, PEER_PW)).token;

    // Name and username edits.
    const names = await call('PATCH', `${SA}/${peer.id}`, { name: 'Peer Renamed', username: 'peer_renamed', currentPassword: OWNER_PW }, ownerToken);
    assert.equal(names.status, 200);
    peer.username = 'peer_renamed';
    assert.equal((await login('peer_renamed', PEER_PW)).status, 200);
    // A Super Admin can edit their own details too.
    const self = await call('PATCH', `${SA}/${peer.id}`, { name: 'Peer Self Edit', currentPassword: PEER_PW }, peer.token);
    assert.equal(self.status, 200);
    assert.equal(rawUser('id = ?', peer.id).name, 'Peer Self Edit');
  });

  test('9. Changing passwords: re-auth required, sessions revoked, self-change keeps the session, peers cannot touch the owner', async () => {
    const NEW_PEER = 'NewPeerPassword@2027!!';
    const body = (over: Record<string, unknown> = {}) => ({ newPassword: NEW_PEER, confirmPassword: NEW_PEER, currentPassword: OWNER_PW, ...over });

    assert.equal((await call('POST', `${SA}/${peer.id}/password`, body({ currentPassword: 'wrong' }), ownerToken)).status, 401);
    assert.equal((await call('POST', `${SA}/${peer.id}/password`, body({ newPassword: 'short', confirmPassword: 'short' }), ownerToken)).status, 400);
    assert.equal((await call('POST', `${SA}/${peer.id}/password`, body({ confirmPassword: 'different-password-1' }), ownerToken)).status, 400);
    assert.equal((await call('POST', `${SA}/${peer.id}/password`, body({ newPassword: 'x'.repeat(80), confirmPassword: 'x'.repeat(80) }), ownerToken)).status, 400, 'beyond the hashing limit');

    const hashBefore = rawUser('id = ?', peer.id).password_hash;
    const res = await call('POST', `${SA}/${peer.id}/password`, body(), ownerToken);
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.notEqual(rawUser('id = ?', peer.id).password_hash, hashBefore);
    assert.ok(!rawUser('id = ?', peer.id).password_hash.includes(NEW_PEER), 'stored as a bcrypt hash');
    assert.equal((await call('GET', SA, undefined, peer.token)).status, 401, 'their old session was revoked');
    assert.equal((await login(peer.username, PEER_PW)).status, 401, 'old password is dead');
    assert.equal((await login(peer.username, NEW_PEER)).status, 200);
    peer.token = (await login(peer.username, NEW_PEER)).token;

    // Self change: the response carries a fresh token, the previous one stops working.
    const OWN = 'PeerOwnChoice@2028!!xx';
    const mine = await call('POST', `${SA}/${peer.id}/password`, { newPassword: OWN, confirmPassword: OWN, currentPassword: NEW_PEER }, peer.token);
    assert.equal(mine.status, 200);
    assert.ok(mine.body.token, 'a fresh token is issued');
    assert.equal((await call('GET', SA, undefined, peer.token)).status, 401);
    assert.equal((await call('GET', SA, undefined, mine.body.token)).status, 200);
    peer.token = mine.body.token;
    (peer as any).pw = OWN;

    // A peer cannot take over the owner account.
    for (const attempt of [
      call('POST', `${SA}/${ownerId}/password`, { newPassword: 'PeerTakeover@2029!!', confirmPassword: 'PeerTakeover@2029!!', currentPassword: OWN }, peer.token),
      call('PATCH', `${SA}/${ownerId}`, { email: 'hijack@gmail.com', currentPassword: OWN }, peer.token),
      call('POST', `${SA}/${ownerId}/status`, { status: 'DISABLED', currentPassword: OWN }, peer.token),
      call('POST', `${SA}/${ownerId}/revoke`, { confirmationPhrase: 'REVOKE SUPER ADMIN', currentPassword: OWN }, peer.token)
    ]) {
      assert.equal((await attempt).status, 403);
    }
    assert.equal((await login('owner_one', OWNER_PW)).status, 200, 'owner unaffected');
    assert.ok(actions().includes('SUPER_ADMIN_PASSWORD_CHANGED'));
  });

  test('10. Repeated wrong password confirmations are rate limited (429), then recover', async () => {
    const before = rawUser('id = ?', peer.id).name;
    for (let i = 0; i < 5; i++) {
      assert.equal((await call('PATCH', `${SA}/${peer.id}`, { name: 'Nope Nope', currentPassword: 'wrong-guess' }, peer.token)).status, 401);
    }
    const locked = await call('PATCH', `${SA}/${peer.id}`, { name: 'Nope Nope', currentPassword: (peer as any).pw }, peer.token);
    assert.equal(locked.status, 429, 'even the right password is refused while locked');
    assert.equal(rawUser('id = ?', peer.id).name, before);
    resetReauthLimiterForTests();
    assert.equal((await call('PATCH', `${SA}/${peer.id}`, { name: 'Peer Final', currentPassword: (peer as any).pw }, peer.token)).status, 200);
  });

  test('11. Deactivating a Super Admin signs them out; reactivating restores access; owner and self are protected', async () => {
    const off = await call('POST', `${SA}/${peer.id}/status`, { status: 'DISABLED', reason: 'on leave', currentPassword: OWNER_PW }, ownerToken);
    assert.equal(off.status, 200, JSON.stringify(off.body));
    assert.equal(off.body.account.isActive, false);
    assert.equal((await call('GET', SA, undefined, peer.token)).status, 401, 'existing session is revoked at once');
    assert.equal((await login(peer.username, (peer as any).pw)).status, 403);
    assert.ok(actions().includes('SUPER_ADMIN_DEACTIVATED'));

    const on = await call('POST', `${SA}/${peer.id}/status`, { status: 'ACTIVE', currentPassword: OWNER_PW }, ownerToken);
    assert.equal(on.status, 200);
    const back = await login(peer.username, (peer as any).pw);
    assert.equal(back.status, 200);
    peer.token = back.token;
    assert.ok(actions().includes('SUPER_ADMIN_ACTIVATED'));

    // Protections: nobody can deactivate/revoke themselves or the owner.
    assert.equal((await call('POST', `${SA}/${ownerId}/status`, { status: 'DISABLED', currentPassword: OWNER_PW }, ownerToken)).status, 409, 'owner cannot deactivate self');
    assert.equal((await call('POST', `${SA}/${ownerId}/revoke`, { confirmationPhrase: 'REVOKE SUPER ADMIN', currentPassword: OWNER_PW }, ownerToken)).status, 409, 'owner cannot revoke self');
    assert.equal((await call('POST', `${SA}/${peer.id}/status`, { status: 'DISABLED', currentPassword: (peer as any).pw }, peer.token)).status, 409, 'self-deactivation refused');
    assert.equal((await call('POST', `${SA}/${peer.id}/status`, { status: 'MAYBE', currentPassword: OWNER_PW }, ownerToken)).status, 400);
    assert.equal(rawUser('id = ?', ownerId).account_status, 'ACTIVE');
  });

  test('12. Revoking Super Admin access demotes safely to Admin (confirmation phrase, history and data kept)', async () => {
    const third = await create({ name: 'Third Person', email: 'third@gmail.com', username: '', password: PEER_PW, confirmPassword: PEER_PW });
    assert.equal(third.status, 201, JSON.stringify(third.body));
    const thirdId = third.body.account.id;
    const thirdToken = (await login('third@gmail.com', PEER_PW)).token;
    assert.equal((await call('GET', SA, undefined, thirdToken)).status, 200);

    assert.equal((await call('POST', `${SA}/${thirdId}/revoke`, { confirmationPhrase: 'revoke', currentPassword: OWNER_PW }, ownerToken)).status, 400, 'phrase required');
    assert.equal((await call('POST', `${SA}/${thirdId}/revoke`, { confirmationPhrase: 'REVOKE SUPER ADMIN', currentPassword: 'x' }, ownerToken)).status, 401);
    assert.equal(rawUser('id = ?', thirdId).role, 'SUPER_ADMIN');

    // A peer Super Admin may revoke another non-owner peer.
    const res = await call('POST', `${SA}/${thirdId}/revoke`, { confirmationPhrase: 'REVOKE SUPER ADMIN', currentPassword: (peer as any).pw }, peer.token);
    assert.equal(res.status, 200, JSON.stringify(res.body));
    const row = rawUser('id = ?', thirdId);
    assert.equal(row.role, 'ADMIN');
    assert.ok(row.username, 'a username is derived because Admin accounts need one');
    assert.equal(row.account_status, 'ACTIVE');
    assert.equal(row.email, 'third@gmail.com');
    assert.equal((await call('GET', SA, undefined, thirdToken)).status, 401, 'old Super Admin session revoked');
    const asAdmin = await login('third@gmail.com', PEER_PW);
    assert.equal(asAdmin.status, 200, 'still signs in, now as Admin');
    assert.equal(asAdmin.user.role, 'ADMIN');
    assert.equal((await call('GET', SA, undefined, asAdmin.token)).status, 403);
    assert.ok(actions().includes('SUPER_ADMIN_ACCESS_REVOKED'));
  });

  test('13. The last active Super Admin can never be removed (every path), including under concurrency', async () => {
    const db = getDatabase();
    // Simulate an incident: the owner row becomes unusable out-of-band, leaving two peers.
    const bcrypt = (await import('bcryptjs')).default;
    const { repository } = await import('../src/db/repository.js');
    await repository.createUser({ id: 'race-a', email: 'race.a@gmail.com', username: 'race_a', passwordHash: await bcrypt.hash(PEER_PW, 10), name: 'Race A', role: 'SUPER_ADMIN', isActive: true });
    await repository.createUser({ id: 'race-b', email: 'race.b@gmail.com', username: 'race_b', passwordHash: await bcrypt.hash(PEER_PW, 10), name: 'Race B', role: 'SUPER_ADMIN', isActive: true });
    // Only the two racers (and nobody else) remain usable.
    db.prepare("UPDATE users SET account_status = 'DISABLED', is_active = 0 WHERE id IN (?, ?)").run(ownerId, peer.id);
    const a = (await login('race_a', PEER_PW)).token;
    const b = (await login('race_b', PEER_PW)).token;

    const results = await Promise.all([
      call('POST', `${SA}/race-b/status`, { status: 'DISABLED', currentPassword: PEER_PW }, a),
      call('POST', `${SA}/race-a/status`, { status: 'DISABLED', currentPassword: PEER_PW }, b)
    ]);
    const ok = results.filter((r) => r.status === 200).length;
    assert.equal(ok, 1, `exactly one wins: ${JSON.stringify(results.map((r) => [r.status, r.body.error]))}`);
    const usable = db.prepare("SELECT COUNT(*) AS n FROM users WHERE upper(role) = 'SUPER_ADMIN' AND account_status = 'ACTIVE' AND is_active = 1").get() as any;
    assert.equal(Number(usable.n), 1, 'one Super Admin always remains');

    // The survivor cannot remove themselves by any route.
    const survivorId = (db.prepare("SELECT id FROM users WHERE upper(role) = 'SUPER_ADMIN' AND account_status = 'ACTIVE'").get() as any).id;
    const survivorToken = survivorId === 'race-a' ? a : b;
    assert.equal((await call('POST', `${SA}/${survivorId}/status`, { status: 'DISABLED', currentPassword: PEER_PW }, survivorToken)).status, 409);
    assert.equal((await call('POST', `${SA}/${survivorId}/revoke`, { confirmationPhrase: 'REVOKE SUPER ADMIN', currentPassword: PEER_PW }, survivorToken)).status, 409);
    assert.equal(rawUser('id = ?', survivorId).role, 'SUPER_ADMIN');

    // Restore a normal roster.
    db.prepare("UPDATE users SET account_status = 'ACTIVE', is_active = 1, disabled_reason = NULL WHERE id IN (?, ?, 'race-a', 'race-b')").run(ownerId, peer.id);
    db.prepare("DELETE FROM users WHERE id IN ('race-a', 'race-b')").run();
    ownerToken = (await login('owner_one', OWNER_PW)).token;
    peer.token = (await login(peer.username, (peer as any).pw)).token;
  });

  test('14. Ownership transfer to an existing Super Admin takes effect only after they sign in and accept', async () => {
    const start = (over: Record<string, unknown> = {}, token = ownerToken, pw = OWNER_PW) =>
      call('POST', `${SA}/transfer`, { targetUserId: peer.id, confirmationPhrase: 'TRANSFER OWNERSHIP', currentPassword: pw, ...over }, token);

    // Only the owner can start one, with the phrase and a fresh password.
    assert.equal((await start({}, peer.token, (peer as any).pw)).status, 403, 'a non-owner cannot start a transfer');
    assert.equal((await start({ confirmationPhrase: 'transfer' })).status, 400);
    assert.equal((await start({}, ownerToken, 'wrong')).status, 401);
    assert.equal((await start({ targetUserId: ownerId })).status, 400, 'cannot target yourself');
    assert.equal((await start({ targetUserId: adminId })).status, 404, 'an ordinary Admin is not a valid target');
    assert.equal((await start({ targetUserId: 'missing' })).status, 404);
    assert.equal((await start({ targetUserId: undefined })).status, 400, 'a target or a new account is required');
    assert.equal((await start({ formerOwnerAccess: 'SOMETHING' })).status, 400);

    const init = await start();
    assert.equal(init.status, 201, JSON.stringify(init.body));
    const transferId = init.body.transfer.id;
    assert.equal(init.body.transfer.status, 'PENDING');
    assert.ok(!JSON.stringify(init.body).includes('ot_'), 'the internal token is never exposed');
    assert.equal((await start()).status, 409, 'only one transfer may be pending');

    // Nothing has changed yet.
    assert.equal(rawUser('id = ?', ownerId).is_platform_owner, 1);
    assert.equal(rawUser('id = ?', peer.id).is_platform_owner, 0);
    const mine = await call('GET', SA, undefined, ownerToken);
    assert.equal(mine.body.transferRole, 'OWNER');
    const theirs = await call('GET', SA, undefined, peer.token);
    assert.equal(theirs.body.transferRole, 'TARGET');
    assert.equal(theirs.body.transfer.id, transferId);

    // Only the invited Super Admin, signed in, with their own password, can accept.
    const accept = (token: string, pw: string, id = transferId) => call('POST', `${SA}/transfer/accept`, { transferId: id, currentPassword: pw }, token);
    assert.equal((await accept(ownerToken, OWNER_PW)).status, 403, 'the initiator cannot accept their own transfer');
    assert.equal((await accept(adminToken, ADMIN_PW)).status, 403, 'an Admin cannot accept');
    assert.equal((await accept('bad.token', 'x')).status, 401);
    assert.equal((await accept(peer.token, 'wrong')).status, 401, 'wrong password');
    assert.equal(rawUser('id = ?', ownerId).is_platform_owner, 1, 'still not effective');
    assert.equal((await accept(peer.token, (peer as any).pw, 'trans_missing')).status, 404);

    const done = await accept(peer.token, (peer as any).pw);
    assert.equal(done.status, 200, JSON.stringify(done.body));
    assert.equal(rawUser('id = ?', peer.id).is_platform_owner, 1);
    assert.equal(rawUser('id = ?', ownerId).is_platform_owner, 0);
    assert.equal(rawUser('id = ?', ownerId).role, 'SUPER_ADMIN', 'the former owner keeps Super Admin access by default (no lock-out)');
    assert.equal(rawUser("id = ? ", ownerId).account_status, 'ACTIVE');
    assert.equal((getDatabase().prepare('SELECT status FROM ownership_transfers WHERE id = ?').get(transferId) as any).status, 'CONFIRMED');
    assert.ok(actions().includes('OWNERSHIP_TRANSFER_INITIATED') && actions().includes('OWNERSHIP_TRANSFER_ACCEPTED'));
    assert.equal((await accept(peer.token, (peer as any).pw)).status, 409, 'cannot be accepted twice');

    // New rules apply immediately: the former owner is now a protected-peer, the new owner is protected from them.
    ownerToken = (await login('owner_one', OWNER_PW)).token;
    assert.equal((await start({ targetUserId: ownerId }, ownerToken)).status, 403, 'former owner can no longer transfer');
    assert.equal((await call('PATCH', `${SA}/${peer.id}`, { name: 'Takeover', currentPassword: OWNER_PW }, ownerToken)).status, 403);
    assert.equal((await call('GET', SA, undefined, ownerToken)).status, 200, 'but still manages the platform');
  });

  test('15. Transfer to a NEW account with demotion: the new owner signs in and accepts; former owner becomes an Admin', async () => {
    const NEW_OWNER_PW = 'BrandNewOwner@2030!!';
    // peer is the owner now; the transfer needs peer credentials.
    const init = await call('POST', `${SA}/transfer`, {
      confirmationPhrase: 'TRANSFER OWNERSHIP', currentPassword: (peer as any).pw, formerOwnerAccess: 'DEMOTE_TO_ADMIN',
      newAccount: { name: 'Brand New Owner', email: 'brand.new@startup.co.in', username: 'brand_new', password: NEW_OWNER_PW, confirmPassword: NEW_OWNER_PW }
    }, peer.token);
    assert.equal(init.status, 201, JSON.stringify(init.body));
    assert.equal(rawUser("email = 'brand.new@startup.co.in'").role, 'SUPER_ADMIN');
    assert.equal(rawUser("email = 'brand.new@startup.co.in'").is_platform_owner, 0, 'not the owner until acceptance');
    assert.equal(rawUser('id = ?', peer.id).is_platform_owner, 1);

    // The owner chose this password, so the new account must replace it before doing anything else.
    assert.equal(rawUser("email = 'brand.new@startup.co.in'").must_change_password, 1);
    const listed = await call('GET', SA, undefined, peer.token);
    assert.equal(listed.body.accounts.find((a: any) => a.email === 'brand.new@startup.co.in').mustChangePassword, true);

    const newcomer = await login('brand.new@startup.co.in', NEW_OWNER_PW);
    assert.equal(newcomer.status, 200);
    assert.equal(newcomer.user.mustChangePassword, true, 'login tells the client a change is required');

    // Everything except reading the profile and changing the password is refused with a clear code.
    const blockedAccept = await call('POST', `${SA}/transfer/accept`, { transferId: init.body.transfer.id, currentPassword: NEW_OWNER_PW }, newcomer.token);
    assert.equal(blockedAccept.status, 403);
    assert.equal(blockedAccept.body.code, 'PASSWORD_CHANGE_REQUIRED');
    for (const [m, p] of [['GET', SA], ['GET', '/api/admin/overview'], ['GET', '/api/auth/security-status'], ['PATCH', '/api/auth/profile']] as const) {
      const r = await call(m, p, m === 'PATCH' ? { name: 'Sneaky Rename' } : undefined, newcomer.token);
      assert.equal(r.status, 403, `${m} ${p} while a password change is pending`);
      assert.equal(r.body.code, 'PASSWORD_CHANGE_REQUIRED');
    }
    assert.equal(rawUser("email = 'brand.new@startup.co.in'").name, 'Brand New Owner', 'the blocked profile edit changed nothing');
    const me = await call('GET', '/api/auth/me', undefined, newcomer.token);
    assert.equal(me.status, 200);
    assert.equal(me.body.user.mustChangePassword, true);

    // The change itself has rules: right current password, strong enough, confirmed, and not the temporary one.
    const NEW_OWNER_CHOSEN = 'ChosenByTheNewOwner@2031!';
    const chg = (body: Record<string, unknown>) => call('POST', '/api/auth/change-password', body, newcomer.token);
    assert.equal((await chg({ currentPassword: 'wrong-password-123', newPassword: NEW_OWNER_CHOSEN, confirmPassword: NEW_OWNER_CHOSEN })).status, 401);
    assert.equal((await chg({ currentPassword: NEW_OWNER_PW, newPassword: 'short', confirmPassword: 'short' })).status, 400);
    assert.equal((await chg({ currentPassword: NEW_OWNER_PW, newPassword: NEW_OWNER_CHOSEN, confirmPassword: NEW_OWNER_CHOSEN + 'x' })).status, 400);
    const same = await chg({ currentPassword: NEW_OWNER_PW, newPassword: NEW_OWNER_PW, confirmPassword: NEW_OWNER_PW });
    assert.equal(same.status, 400, 'reusing the temporary password is refused');
    assert.equal(rawUser("email = 'brand.new@startup.co.in'").must_change_password, 1, 'failed attempts do not clear the requirement');

    const changed = await chg({ currentPassword: NEW_OWNER_PW, newPassword: NEW_OWNER_CHOSEN, confirmPassword: NEW_OWNER_CHOSEN });
    assert.equal(changed.status, 200, JSON.stringify(changed.body));
    assert.ok(changed.body.token, 'a fresh token is returned so the person stays signed in');
    assert.equal(rawUser("email = 'brand.new@startup.co.in'").must_change_password, 0);
    assert.ok(actions().includes('FORCED_PASSWORD_CHANGED'));
    assert.ok(!JSON.stringify(getDatabase().prepare('SELECT details_json FROM audit_logs').all()).includes(NEW_OWNER_CHOSEN), 'no password in the audit log');
    assert.equal((await call('GET', SA, undefined, newcomer.token)).status, 401, 'the old session is revoked by the password change');
    assert.equal((await login('brand.new@startup.co.in', NEW_OWNER_PW)).status, 401, 'the temporary password stops working');
    const freshLogin = await login('brand.new@startup.co.in', NEW_OWNER_CHOSEN);
    assert.equal(freshLogin.status, 200);
    assert.equal(freshLogin.user.mustChangePassword, false);

    // Now the invitation can be accepted, with the password they chose.
    const accessToken = changed.body.token as string;
    const done = await call('POST', `${SA}/transfer/accept`, { transferId: init.body.transfer.id, currentPassword: NEW_OWNER_CHOSEN }, accessToken);
    assert.equal(done.status, 200, JSON.stringify(done.body));

    const newcomerRow = rawUser("email = 'brand.new@startup.co.in'");
    assert.equal(newcomerRow.is_platform_owner, 1);
    const former = rawUser('id = ?', peer.id);
    assert.equal(former.role, 'ADMIN', 'demoted as requested');
    assert.equal(former.is_platform_owner, 0);
    assert.equal(former.account_status, 'ACTIVE');
    assert.ok(former.username);
    assert.equal((await call('GET', SA, undefined, peer.token)).status, 401, 'demoted owner session revoked');
    const asAdmin = await login(peer.username, (peer as any).pw);
    assert.equal(asAdmin.status, 200);
    assert.equal(asAdmin.user.role, 'ADMIN');
    assert.equal((await call('GET', SA, undefined, asAdmin.token)).status, 403);

    // Exactly one owner exists, and it is a usable Super Admin.
    const owners = getDatabase().prepare("SELECT COUNT(*) AS n FROM users WHERE is_platform_owner = 1").get() as any;
    assert.equal(Number(owners.n), 1);
    (peer as any).newOwner = { id: newcomerRow.id, token: freshLogin.token, pw: NEW_OWNER_CHOSEN };
  });

  test('16. Transfers can be cancelled, declined, expire, and are cancelled when the target loses access', async () => {
    const nu = (peer as any).newOwner as { id: string; token: string; pw: string };
    const bcrypt = (await import('bcryptjs')).default;
    const { repository } = await import('../src/db/repository.js');
    await repository.createUser({ id: 'cand-1', email: 'cand1@gmail.com', username: 'cand_one', passwordHash: await bcrypt.hash(PEER_PW, 10), name: 'Candidate', role: 'SUPER_ADMIN', isActive: true });
    const candToken = (await login('cand_one', PEER_PW)).token;
    const init = () => call('POST', `${SA}/transfer`, { targetUserId: 'cand-1', confirmationPhrase: 'TRANSFER OWNERSHIP', currentPassword: nu.pw }, nu.token);

    // Owner cancels.
    let t = await init();
    assert.equal(t.status, 201);
    assert.equal((await call('POST', `${SA}/transfer/cancel`, {}, candToken)).status, 200, 'the invited Super Admin may decline');
    assert.equal((getDatabase().prepare('SELECT status FROM ownership_transfers WHERE id = ?').get(t.body.transfer.id) as any).status, 'CANCELLED');
    assert.ok(actions().includes('OWNERSHIP_TRANSFER_DECLINED'));
    assert.equal((await call('POST', `${SA}/transfer/cancel`, {}, nu.token)).status, 404, 'nothing left to cancel');

    t = await init();
    assert.equal((await call('POST', `${SA}/transfer/cancel`, {}, nu.token)).status, 200);
    assert.ok(actions().includes('OWNERSHIP_TRANSFER_CANCELLED'));

    // Expiry.
    t = await init();
    getDatabase().prepare("UPDATE ownership_transfers SET expires_at = '2000-01-01T00:00:00.000Z' WHERE id = ?").run(t.body.transfer.id);
    const late = await call('POST', `${SA}/transfer/accept`, { transferId: t.body.transfer.id, currentPassword: PEER_PW }, candToken);
    assert.ok([410, 409].includes(late.status), String(late.status));
    assert.equal(rawUser('id = ?', nu.id).is_platform_owner, 1, 'an expired transfer never takes effect');

    // Target loses Super Admin access while pending: the transfer is cancelled and cannot be accepted.
    t = await init();
    assert.equal(t.status, 201, JSON.stringify(t.body));
    const off = await call('POST', `${SA}/cand-1/status`, { status: 'DISABLED', currentPassword: nu.pw }, nu.token);
    assert.equal(off.status, 200);
    assert.equal((getDatabase().prepare('SELECT status FROM ownership_transfers WHERE id = ?').get(t.body.transfer.id) as any).status, 'CANCELLED');
    // And an inactive account is not a valid target.
    assert.equal((await call('POST', `${SA}/transfer`, { targetUserId: 'cand-1', confirmationPhrase: 'TRANSFER OWNERSHIP', currentPassword: nu.pw }, nu.token)).status, 409);
    getDatabase().prepare("DELETE FROM users WHERE id = 'cand-1'").run();
  });

  test('17. The legacy token-link transfer endpoints are retired (410)', async () => {
    for (const path of ['initiate', 'accept', 'confirm', 'cancel', 'status', 'challenge/ot_abc']) {
      const r = await call('POST', `/api/auth/transfer-ownership/${path}`, {}, ownerToken);
      assert.equal(r.status, 410, path);
    }
    assert.equal((await call('GET', '/api/auth/transfer-ownership/status')).status, 410);
  });

  test('18. Ownership can be restored from the server after an accidental transfer (recovery tool)', async () => {
    const db = await (await import('../src/db/database.js')).getDb();
    const rec = await import('../src/db/superAdminRecovery.js');
    const nu = (peer as any).newOwner as { id: string };

    // The demoted former owner (an Admin now) is made owner again from the server shell.
    const noTarget = await rec.planRecovery(db, { makeOwner: true });
    assert.match(noTarget.errors.join(' '), /--user/);
    const plan = await rec.planRecovery(db, { makeOwner: true, target: peer.username });
    assert.deepEqual(plan.errors, []);
    const journal = await rec.applyRecovery(db, plan);
    assert.equal(rawUser('id = ?', peer.id).role, 'SUPER_ADMIN');
    assert.equal(rawUser('id = ?', peer.id).is_platform_owner, 1);
    assert.equal(rawUser('id = ?', nu.id).is_platform_owner, 0);
    assert.equal(Number((getDatabase().prepare('SELECT COUNT(*) AS n FROM users WHERE is_platform_owner = 1').get() as any).n), 1);
    assert.equal((await login(peer.username, (peer as any).pw)).user.role, 'SUPER_ADMIN');

    // And it is reversible.
    const back = await rec.rollbackRecovery(db, journal);
    assert.equal(back.restored, true);
    assert.equal(rawUser('id = ?', peer.id).role, 'ADMIN');
    assert.equal(rawUser('id = ?', nu.id).is_platform_owner, 1);
  });

  test('19. Legacy databases get an owner automatically and the migration is idempotent', async () => {
    const db = await (await import('../src/db/database.js')).getDb();
    const { backfillPlatformOwner, initializeSchema } = await import('../src/db/schema.js');
    const realOwner = (getDatabase().prepare('SELECT id FROM users WHERE is_platform_owner = 1').get() as any).id;
    getDatabase().prepare('UPDATE users SET is_platform_owner = 0').run();
    await backfillPlatformOwner(db);
    const flagged = getDatabase().prepare("SELECT id FROM users WHERE is_platform_owner = 1").all() as any[];
    assert.equal(flagged.length, 1, 'exactly one owner is chosen');
    const earliest = getDatabase().prepare("SELECT id FROM users WHERE upper(role) = 'SUPER_ADMIN' AND account_status = 'ACTIVE' ORDER BY created_at ASC, id ASC LIMIT 1").get() as any;
    assert.equal(flagged[0].id, earliest.id, 'the earliest active Super Admin');
    await initializeSchema(db);
    await initializeSchema(db);
    assert.equal((getDatabase().prepare("SELECT COUNT(*) AS n FROM users WHERE is_platform_owner = 1").get() as any).n, 1);
    // Put the real owner back so the following checks continue from the true state.
    getDatabase().prepare('UPDATE users SET is_platform_owner = CASE WHEN id = ? THEN 1 ELSE 0 END').run(realOwner);
  });

  test('20. Restart: accounts, ownership and history persist and setup stays closed', async () => {
    const snapshot = JSON.stringify(getDatabase().prepare('SELECT id, email, username, role, account_status, is_platform_owner, password_hash FROM users ORDER BY id').all());
    const transfers = JSON.stringify(getDatabase().prepare('SELECT id, status, target_user_id FROM ownership_transfers ORDER BY id').all());
    const { closeDb } = await import('../src/db/database.js');
    await closeDb();

    const status = await call('GET', '/api/auth/setup/status');
    assert.equal(status.body.setupRequired, false);
    assert.equal((await call('POST', '/api/auth/setup', { username: 'late_setup', email: 'late@gmail.com', password: OWNER_PW, confirmPassword: OWNER_PW })).status, 403);
    assert.equal(JSON.stringify(getDatabase().prepare('SELECT id, email, username, role, account_status, is_platform_owner, password_hash FROM users ORDER BY id').all()), snapshot);
    assert.equal(JSON.stringify(getDatabase().prepare('SELECT id, status, target_user_id FROM ownership_transfers ORDER BY id').all()), transfers);

    const nu = (peer as any).newOwner as { id: string; pw: string };
    const again = await login('brand_new', nu.pw);
    assert.equal(again.status, 200);
    const list = await call('GET', SA, undefined, again.token);
    assert.equal(list.status, 200);
    assert.equal(list.body.summary.ownerId, nu.id);
    assert.ok(list.body.summary.active >= 2);
  });

  test('21. Create Super Admin forces the new person to choose their own password before anything else works', async () => {
    const nu = (peer as any).newOwner as { pw: string };
    const ownerNow = await login('brand_new', nu.pw);
    assert.equal(ownerNow.status, 200);
    const TEMP = 'TempChosenByCreator@2034!';
    const CHOSEN = 'PrivatelyChosen@2034!!';
    const created = await call('POST', SA, {
      name: 'Forced Person', email: 'forced.person@example.org', username: 'forced_person',
      password: TEMP, confirmPassword: TEMP, status: 'ACTIVE', currentPassword: nu.pw
    }, ownerNow.token);
    assert.equal(created.status, 201, JSON.stringify(created.body));
    assert.equal(created.body.account.mustChangePassword, true);
    assert.equal(rawUser("email = 'forced.person@example.org'").must_change_password, 1);

    const first = await login('forced_person', TEMP);
    assert.equal(first.status, 200);
    assert.equal(first.user.mustChangePassword, true);
    for (const [m, p] of [['GET', SA], ['GET', '/api/admin/overview'], ['POST', `${SA}/transfer/cancel`], ['PATCH', '/api/auth/profile']] as const) {
      const r = await call(m, p, m === 'PATCH' ? { name: 'Sneaky' } : m === 'POST' ? {} : undefined, first.token);
      assert.equal(r.status, 403, `${m} ${p}`);
      assert.equal(r.body.code, 'PASSWORD_CHANGE_REQUIRED');
    }
    assert.equal((await call('GET', '/api/auth/me', undefined, first.token)).status, 200);

    // Self-service through the module's own route is not a way around it either.
    const viaModule = await call('POST', `${SA}/${created.body.account.id}/password`, { newPassword: CHOSEN, confirmPassword: CHOSEN, currentPassword: TEMP }, first.token);
    assert.equal(viaModule.status, 403);
    assert.equal(rawUser("email = 'forced.person@example.org'").must_change_password, 1);

    const changed = await call('POST', '/api/auth/change-password', { currentPassword: TEMP, newPassword: CHOSEN, confirmPassword: CHOSEN }, first.token);
    assert.equal(changed.status, 200, JSON.stringify(changed.body));
    assert.equal(rawUser("email = 'forced.person@example.org'").must_change_password, 0);
    assert.equal((await login('forced_person', TEMP)).status, 401);
    const after = await login('forced_person', CHOSEN);
    assert.equal(after.user.mustChangePassword, false);
    assert.equal((await call('GET', SA, undefined, changed.body.token)).status, 200, 'the returned token keeps them signed in and unlocks the module');

    // The owner was not affected, and a peer resetting someone's password does not flag it again.
    assert.equal(rawUser("username = 'brand_new'").must_change_password, 0);
    const reset = await call('POST', `${SA}/${created.body.account.id}/password`, { newPassword: 'ResetByOwner@2035!!x', confirmPassword: 'ResetByOwner@2035!!x', currentPassword: nu.pw }, ownerNow.token);
    assert.equal(reset.status, 200, JSON.stringify(reset.body));
    assert.equal(rawUser("email = 'forced.person@example.org'").must_change_password, 0);
  });
});
