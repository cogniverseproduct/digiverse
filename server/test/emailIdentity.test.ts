// Must stay the first import: prepares the isolated test environment (empty database) before the app loads.
import { baseUrl, getDatabase } from './helpers/freshContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

const PRIMARY = 'contact@cogniverse.co.in';
const SECONDARY = 'mrk@cogniverse.co.in';
const RETIRED = 'cogniverse.digiverse@gmail.com';

const OWNER = { username: 'owner_identity', password: 'OwnerIdentityPass@2026!' };

async function post(path: string, body: unknown, token?: string) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body)
  });
  return { status: res.status, body: (await res.json().catch(() => ({}))) as any };
}

describe('Email identity: official addresses, validation and authentication', () => {
  let ownerToken = '';

  before(async () => {
    const setup = await post('/api/auth/setup', {
      name: 'Satyaki Maiti', username: OWNER.username, password: OWNER.password, confirmPassword: OWNER.password
    });
    assert.equal(setup.status, 201, JSON.stringify(setup.body));
    ownerToken = setup.body.token;
  });

  test('1. First-run setup uses the primary official address, not the retired Gmail', async () => {
    const status = await (await fetch(`${baseUrl}/api/auth/setup/status`)).json() as any;
    assert.equal(status.email, PRIMARY);
    assert.equal(status.setupRequired, false);

    const me = await (await fetch(`${baseUrl}/api/auth/me`, { headers: { Authorization: `Bearer ${ownerToken}` } })).json() as any;
    assert.equal(me.user.email, PRIMARY);
    assert.equal(me.user.role, 'SUPER_ADMIN');
  });

  test('2. Super Admin logs in by username and by the new email (any letter case); the old Gmail no longer resolves', async () => {
    const byUsername = await post('/api/auth/login', { identifier: OWNER.username, password: OWNER.password });
    assert.equal(byUsername.status, 200);
    assert.equal(byUsername.body.user.role, 'SUPER_ADMIN');

    const byEmail = await post('/api/auth/login', { identifier: 'CONTACT@Cogniverse.CO.in', password: OWNER.password });
    assert.equal(byEmail.status, 200);
    assert.equal(byEmail.body.user.id, byUsername.body.user.id);

    const byOld = await post('/api/auth/login', { identifier: RETIRED, password: OWNER.password });
    assert.equal(byOld.status, 401);

    const wrong = await post('/api/auth/login', { identifier: PRIMARY, password: 'wrong-password-123' });
    assert.equal(wrong.status, 401);
  });

  test('3. The secondary address is a contact address only: no account, no login, no privileges', async () => {
    const db = getDatabase();
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users WHERE lower(email) = ?').get(SECONDARY)!.n, 0);
    const attempt = await post('/api/auth/login', { identifier: SECONDARY, password: OWNER.password });
    assert.equal(attempt.status, 401);
  });

  test('4. Admin access requests accept any valid provider or domain (.co.in, .com, .org, .net, Gmail, Outlook)', async () => {
    const accepted = [
      'new.staff@company.co.in', 'staff@gmail.com', 'staff2@outlook.com', 'staff3@charity.org',
      'staff4@company.net', 'Mixed.Case@Company.com', 'ops@cogniverse.co.in'
    ];
    for (const email of accepted) {
      const res = await post('/api/admin/access-requests', { name: 'Staff Member', email });
      assert.equal(res.status, 201, `${email}: ${JSON.stringify(res.body)}`);
      assert.equal(res.body.request.status, 'PENDING');
      assert.equal(res.body.request.email, email.toLowerCase());
    }
  });

  test('5. An accepted address grants nothing: requests stay PENDING and no account or role is created', async () => {
    const db = getDatabase();
    for (const email of ['new.staff@company.co.in', 'staff@gmail.com', 'ops@cogniverse.co.in']) {
      assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users WHERE lower(email) = ?').get(email)!.n, 0, `${email} must have no account`);
      assert.equal(db.prepare("SELECT status FROM admin_access_requests WHERE lower(email) = ?").get(email)!.status, 'PENDING');
    }
    const roles = db.prepare('SELECT role, COUNT(*) AS n FROM users GROUP BY role').all() as Array<{ role: string; n: number }>;
    assert.deepEqual(roles.map((r) => [r.role, r.n]), [['SUPER_ADMIN', 1]]);
  });

  test('6. Invalid addresses are rejected with 400 and store nothing', async () => {
    const before = getDatabase().prepare('SELECT COUNT(*) AS n FROM admin_access_requests').get()!.n;
    for (const email of ['plainaddress', 'a@b', 'a b@company.com', '@company.com', 'a@@company.com', 'x@company', 'a..b@company.com', '<x>@company.com', `${'a'.repeat(250)}@x.com`]) {
      const res = await post('/api/admin/access-requests', { name: 'Staff Member', email });
      assert.equal(res.status, 400, `${email.slice(0, 30)} should be rejected`);
    }
    assert.equal(getDatabase().prepare('SELECT COUNT(*) AS n FROM admin_access_requests').get()!.n, before);
  });

  test('7. Duplicate prevention: a pending request for the same address (any letter case) returns 409', async () => {
    const dup = await post('/api/admin/access-requests', { name: 'Staff Member', email: 'NEW.STAFF@COMPANY.CO.IN' });
    assert.equal(dup.status, 409);
  });

  test('8. Super Admin invites accept custom domains, reject invalid addresses and existing identities', async () => {
    const ok = await post('/api/admin/users', { name: 'Invited Person', email: 'invitee@company.co.in' }, ownerToken);
    assert.equal(ok.status, 201, JSON.stringify(ok.body));
    assert.ok(ok.body.setupToken);

    const bad = await post('/api/admin/users', { name: 'Invited Person', email: 'invitee-at-company' }, ownerToken);
    assert.equal(bad.status, 400);

    const existing = await post('/api/admin/users', { name: 'Someone', email: 'Contact@Cogniverse.co.in' }, ownerToken);
    assert.equal(existing.status, 409);

    const anonymous = await post('/api/admin/users', { name: 'Invited Person', email: 'x@company.com' });
    assert.ok([401, 403].includes(anonymous.status));
  });

  test('9. Ownership transfer and Super Admin creation use the same validation', async () => {
    const transfer = (email: string) => post('/api/super-admins/transfer', {
      confirmationPhrase: 'TRANSFER OWNERSHIP', currentPassword: OWNER.password,
      newAccount: { name: 'New Owner', email, username: 'new_owner_x', password: 'NewOwnerPass@2026!!', confirmPassword: 'NewOwnerPass@2026!!' }
    }, ownerToken);
    assert.equal((await transfer('new-owner@company')).status, 400, 'a domain without a dot is not a valid address');
    assert.equal((await transfer(RETIRED)).status, 400, 'the retired identity is refused');
    assert.equal((await transfer(PRIMARY.toUpperCase())).status, 409, 'an existing identity is never overwritten');
    assert.equal((await post('/api/super-admins', {
      name: 'Someone', email: 'x@company', password: 'SomePass@2026!!xx', confirmPassword: 'SomePass@2026!!xx', currentPassword: OWNER.password
    }, ownerToken)).status, 400);
  });

  test('10. The data layer also refuses malformed emails and duplicates differing only by case', async () => {
    const { repository } = await import('../src/db/repository.js');
    await assert.rejects(
      repository.createUser({ id: 'u-bad-email', email: 'not-an-email', username: 'bad-email-user', passwordHash: 'x', name: 'Bad', role: 'ADMIN', isActive: true }),
      /INVALID_EMAIL/
    );
    await assert.rejects(
      repository.createUser({ id: 'u-dup-email', email: 'CONTACT@COGNIVERSE.CO.IN', username: 'dup-email-user', passwordHash: 'x', name: 'Dup', role: 'ADMIN', isActive: true })
    );
    // Username-only Admins (no email) remain allowed.
    const created = await repository.createUser({ id: 'u-no-email', username: 'no-email-user', passwordHash: 'x', name: 'No Email', role: 'ADMIN', isActive: true });
    assert.equal(created.email, '');
  });

  test('11. A Gmail address is accepted like any other (no Gmail-only rule remains)', async () => {
    const gmail = await post('/api/admin/access-requests', { name: 'Gmail Person', email: 'gmail.person@gmail.com' });
    assert.equal(gmail.status, 201);
    const yahoo = await post('/api/admin/access-requests', { name: 'Yahoo Person', email: 'yahoo.person@yahoo.com' });
    assert.equal(yahoo.status, 201);
  });
});
