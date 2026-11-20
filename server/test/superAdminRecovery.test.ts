// Must stay the first import: prepares the isolated test environment (EMPTY database) before the app loads.
import { baseUrl, getDatabase } from './helpers/freshContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

const OLD_PASSWORD = 'OriginalOwnerPass@2026!';
const NEW_PASSWORD = 'RecoveredOwnerPass@2027!';
const OFFICIAL = 'contact@cogniverse.co.in';

async function call(method: string, path: string, body?: unknown, token?: string) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: res.status, body: (await res.json().catch(() => ({}))) as any };
}

describe('Super Admin recovery (existing account only, journaled, reversible)', () => {
  let db: Awaited<ReturnType<typeof import('../src/db/database.js').getDb>>;
  let rec: typeof import('../src/db/superAdminRecovery.js');
  let bcrypt: typeof import('bcryptjs');
  let oldToken = '';
  let ownerId = '';
  let journal: import('../src/db/superAdminRecovery.js').RecoveryJournal;
  let usersBefore = '';

  before(async () => {
    bcrypt = await import('bcryptjs');
    rec = await import('../src/db/superAdminRecovery.js');
    db = await (await import('../src/db/database.js')).getDb();
    const { repository } = await import('../src/db/repository.js');

    const owner = await repository.createUser({
      id: 'rec-owner', email: 'cogniverse.digiverse@gmail.com', username: 'rec_owner',
      passwordHash: await bcrypt.default.hash(OLD_PASSWORD, 10), name: 'Owner', role: 'SUPER_ADMIN', isActive: true
    });
    ownerId = owner.id;
    await repository.createUser({
      id: 'rec-admin', email: 'staff@yahoo.com', username: 'rec_admin',
      passwordHash: await bcrypt.default.hash('StaffRecPass@2026!', 10), name: 'Staff', role: 'ADMIN', isActive: true
    });
    const login = await call('POST', '/api/auth/login', { identifier: 'rec_owner', password: OLD_PASSWORD });
    assert.equal(login.status, 200);
    oldToken = login.body.token;
    usersBefore = JSON.stringify(await db.all("SELECT * FROM users WHERE id <> 'rec-owner' ORDER BY id"));
  });

  test('1. Diagnose reports state without secrets and recommends the right next step', async () => {
    const report = await rec.diagnoseSuperAdmins(db, OFFICIAL);
    assert.equal(report.rows.length, 1);
    assert.equal(report.activeCount, 1);
    assert.equal(report.setupOpen, false);
    assert.equal(report.rows[0].usable, true);
    assert.equal(report.rows[0].passwordHash, 'bcrypt');
    assert.equal(report.rows[0].emailIsRetired, true);
    assert.equal(report.rows[0].emailMatchesOfficial, false);
    assert.match(report.nextSteps.join(' '), /retired email/i);

    const json = JSON.stringify(report);
    assert.ok(!json.includes('cogniverse.digiverse@gmail.com'), 'emails are masked');
    assert.ok(!json.includes('$2'), 'no hashes in the report');
  });

  test('2. Planning refuses anything unsafe and changes nothing', async () => {
    const hash = await bcrypt.default.hash(NEW_PASSWORD, 10);
    assert.match((await rec.planRecovery(db, {})).errors.join(' '), /Nothing to do/);
    assert.match((await rec.planRecovery(db, { target: 'rec_admin', newPasswordHash: hash })).errors.join(' '), /only repairs Super Admin/i);
    assert.match((await rec.planRecovery(db, { target: 'nobody', newPasswordHash: hash })).errors.join(' '), /No Super Admin matches/);
    assert.match((await rec.planRecovery(db, { setEmail: 'broken' })).errors.join(' '), /not a valid email/);
    assert.match((await rec.planRecovery(db, { setEmail: 'cogniverse.digiverse@gmail.com' })).errors.join(' '), /retired/);
    assert.match((await rec.planRecovery(db, { setEmail: 'staff@yahoo.com' })).errors.join(' '), /another account/);
    assert.equal(rec.validateRecoveryPassword('short'), `The new password must contain at least ${rec.MIN_RECOVERY_PASSWORD_LENGTH} characters.`);
    assert.equal(rec.validateRecoveryPassword(NEW_PASSWORD), null);
    assert.equal((await db.get<any>('SELECT token_version FROM users WHERE id = ?', [ownerId])).token_version, 1);
  });

  test('3. Reset password + new email: only the target changes, sessions are revoked, history is untouched', async () => {
    const auditBefore = JSON.stringify(await db.all("SELECT * FROM audit_logs WHERE action <> 'SUPER_ADMIN_RECOVERY' ORDER BY id"));
    const hash = await bcrypt.default.hash(NEW_PASSWORD, 10);
    const plan = await rec.planRecovery(db, { newPasswordHash: hash, setEmail: 'Contact@Cogniverse.co.in' });
    assert.deepEqual(plan.errors, []);
    assert.equal(plan.userId, ownerId);
    assert.ok(!JSON.stringify(plan.summary).includes(NEW_PASSWORD));

    journal = await rec.applyRecovery(db, plan);
    assert.ok(!JSON.stringify(journal).includes(NEW_PASSWORD), 'the plaintext password is never journaled');

    const row = await db.get<any>('SELECT * FROM users WHERE id = ?', [ownerId]);
    assert.equal(row.email, OFFICIAL);
    assert.equal(row.token_version, 2);
    assert.equal(row.role, 'SUPER_ADMIN');
    assert.equal(row.username, 'rec_owner');

    assert.equal(JSON.stringify(await db.all("SELECT * FROM users WHERE id <> 'rec-owner' ORDER BY id")), usersBefore, 'no other account changes');
    assert.equal(JSON.stringify(await db.all("SELECT * FROM audit_logs WHERE action <> 'SUPER_ADMIN_RECOVERY' ORDER BY id")), auditBefore, 'existing audit rows are untouched');

    const audit = await db.get<any>("SELECT details_json FROM audit_logs WHERE action = 'SUPER_ADMIN_RECOVERY'");
    assert.ok(audit, 'the recovery is audited');
    assert.ok(!audit.details_json.includes('$2') && !audit.details_json.includes(NEW_PASSWORD));

    // Sign-in: new password works with username and the new email; old password, old email and old session do not.
    assert.equal((await call('POST', '/api/auth/login', { identifier: 'rec_owner', password: NEW_PASSWORD })).status, 200);
    assert.equal((await call('POST', '/api/auth/login', { identifier: OFFICIAL, password: NEW_PASSWORD })).status, 200);
    assert.equal((await call('POST', '/api/auth/login', { identifier: 'rec_owner', password: OLD_PASSWORD })).status, 401);
    assert.equal((await call('POST', '/api/auth/login', { identifier: 'cogniverse.digiverse@gmail.com', password: NEW_PASSWORD })).status, 401);
    assert.equal((await call('GET', '/api/auth/me', undefined, oldToken)).status, 401, 'sessions from before the reset are revoked');

    // Existing Admin login is unaffected.
    assert.equal((await call('POST', '/api/auth/login', { identifier: 'staff@yahoo.com', password: 'StaffRecPass@2026!' })).status, 200);
  });

  test('4. Applying a stale plan is refused (the account changed meanwhile)', async () => {
    const plan = await rec.planRecovery(db, { newPasswordHash: await bcrypt.default.hash('Another@Password2028!', 10) });
    await db.run('UPDATE users SET token_version = token_version + 1 WHERE id = ?', [ownerId]);
    await assert.rejects(rec.applyRecovery(db, plan), /changed while recovering/);
    await db.run('UPDATE users SET token_version = token_version - 1 WHERE id = ?', [ownerId]);
  });

  test('5. Rollback restores the exact previous credentials and email', async () => {
    const result = await rec.rollbackRecovery(db, journal);
    assert.equal(result.restored, true);
    const row = await db.get<any>('SELECT email, token_version FROM users WHERE id = ?', [ownerId]);
    assert.equal(row.email, 'cogniverse.digiverse@gmail.com');
    assert.equal(row.token_version, 1);
    assert.equal((await call('POST', '/api/auth/login', { identifier: 'rec_owner', password: OLD_PASSWORD })).status, 200);
    assert.equal((await call('POST', '/api/auth/login', { identifier: 'rec_owner', password: NEW_PASSWORD })).status, 401);
    assert.equal((await call('GET', '/api/auth/me', undefined, oldToken)).status, 200, 'the original session works again');

    // A rollback does not clobber later edits.
    const again = await rec.rollbackRecovery(db, journal);
    assert.equal(again.restored, false);
  });

  test('6. A disabled Super Admin can be reactivated (recovery, not a second account) and setup stays closed', async () => {
    await db.run("UPDATE users SET account_status = 'DISABLED', is_active = 0, disabled_reason = 'test' WHERE id = ?", [ownerId]);
    assert.equal((await call('POST', '/api/auth/login', { identifier: 'rec_owner', password: OLD_PASSWORD })).status, 403);
    const diagnosis = await rec.diagnoseSuperAdmins(db, OFFICIAL);
    assert.equal(diagnosis.activeCount, 0);
    assert.match(diagnosis.nextSteps.join(' '), /reactivate/i);

    const plan = await rec.planRecovery(db, { reactivate: true });
    assert.deepEqual(plan.errors, []);
    await rec.applyRecovery(db, plan);
    const row = await db.get<any>('SELECT account_status, is_active, disabled_reason FROM users WHERE id = ?', [ownerId]);
    assert.deepEqual([row.account_status, row.is_active, row.disabled_reason], ['ACTIVE', 1, null]);
    assert.equal((await call('POST', '/api/auth/login', { identifier: 'rec_owner', password: OLD_PASSWORD })).status, 200);
    assert.equal((await call('GET', '/api/auth/setup/status')).body.setupRequired, false);
    assert.equal(Number(getDatabase().prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'SUPER_ADMIN'").get()!.n), 1);
  });

  test('7. With no Super Admin at all there is nothing to recover (use setup instead)', async () => {
    getDatabase().prepare("UPDATE users SET role = 'ADMIN' WHERE id = ?").run(ownerId);
    try {
      const plan = await rec.planRecovery(db, { reactivate: true });
      assert.match(plan.errors.join(' '), /First-Time Setup/);
      const report = await rec.diagnoseSuperAdmins(db, OFFICIAL);
      assert.equal(report.setupOpen, true);
    } finally {
      getDatabase().prepare("UPDATE users SET role = 'SUPER_ADMIN' WHERE id = ?").run(ownerId);
    }
  });
});
