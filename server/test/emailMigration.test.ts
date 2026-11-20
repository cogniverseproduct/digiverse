// Must stay the first import: prepares the isolated test environment (empty database) before the app loads.
import { baseUrl } from './helpers/freshContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

const OLD = 'cogniverse.digiverse@gmail.com';
const NEW = 'contact@cogniverse.co.in';
const OWNER_PASSWORD = 'LegacyOwnerPass@2026!';
// The history rewrite is opt-in; most scenarios below exercise it, the last one proves the default leaves audit logs untouched.
const HISTORY = { includeHistory: true };

async function post(path: string, body: unknown, token?: string) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body)
  });
  return { status: res.status, body: (await res.json().catch(() => ({}))) as any };
}

describe('Email identity migration (reversible, no lock-out)', () => {
  let db: Awaited<ReturnType<typeof import('../src/db/database.js').getDb>>;
  let mig: typeof import('../src/db/emailIdentityMigration.js');
  let ownerId = '';
  let ownerHash = '';
  let tokenBefore = '';
  let beforeSnapshot: Awaited<ReturnType<typeof import('../src/db/emailIdentityMigration.js').snapshotAccounts>>;
  let journal: import('../src/db/emailIdentityMigration.js').MigrationJournal;

  before(async () => {
    const bcrypt = await import('bcryptjs');
    const { repository } = await import('../src/db/repository.js');
    db = await (await import('../src/db/database.js')).getDb();
    mig = await import('../src/db/emailIdentityMigration.js');

    ownerHash = await bcrypt.default.hash(OWNER_PASSWORD, 10);
    // A legacy installation: the Super Admin still holds the retired address, plus two Admins and a project link.
    const owner = await repository.createUser({ id: 'owner-legacy', email: OLD, username: 'satyaki_owner', passwordHash: ownerHash, name: 'Owner', role: 'SUPER_ADMIN', isActive: true });
    ownerId = owner.id;
    await repository.createUser({ id: 'admin-gmail', email: 'staff.one@gmail.com', username: 'staff-one', passwordHash: ownerHash, name: 'Staff One', role: 'ADMIN', isActive: true });
    await repository.createUser({ id: 'admin-noemail', username: 'staff-two', passwordHash: ownerHash, name: 'Staff Two', role: 'ADMIN', isActive: true });

    const now = new Date().toISOString();
    for (let i = 0; i < 3; i++) {
      await db.run(
        'INSERT INTO audit_logs (id, user_id, user_email, user_role, action, resource_type, resource_id, details_json, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [`audit-${i}`, ownerId, OLD, 'SUPER_ADMIN', 'USER_LOGIN', 'users', ownerId, i === 0 ? JSON.stringify({ email: OLD, note: 'x' }) : null, '127.0.0.1', now]
      );
    }
    await db.run(
      'INSERT INTO audit_logs (id, user_id, user_email, user_role, action, resource_type, resource_id, details_json, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['audit-other', 'admin-gmail', 'staff.one@gmail.com', 'ADMIN', 'USER_LOGIN', 'users', 'admin-gmail', null, '127.0.0.1', now]
    );
    await db.run(
      "INSERT INTO admin_access_requests (id, name, email, status, created_at) VALUES ('req-old', 'Legacy', ?, 'PENDING', ?)", [OLD.toUpperCase(), now]
    );

    const login = await post('/api/auth/login', { identifier: OLD, password: OWNER_PASSWORD });
    assert.equal(login.status, 200, 'legacy login by the old Gmail works before migration');
    tokenBefore = login.body.token;
    beforeSnapshot = await mig.snapshotAccounts(db);
  });

  test('1. Dry run lists exactly what would change and changes nothing', async () => {
    const plan = await mig.planEmailMigration(db, OLD, NEW, HISTORY);
    assert.deepEqual(plan.errors, []);
    const count = (key: string) => plan.changes.filter((c) => `${c.table}.${c.column}` === key).length;
    assert.equal(count('users.email'), 1);
    assert.equal(count('admin_access_requests.email'), 1);
    assert.equal(count('audit_logs.details_json'), 1);
    // 3 seeded rows plus the audit row written by the legacy login in before().
    assert.ok(count('audit_logs.user_email') >= 3);
    assert.equal(plan.changes.every((c) => ['users', 'audit_logs', 'admin_access_requests'].includes(c.table)), true);
    assert.equal((await db.get<any>('SELECT email FROM users WHERE id = ?', [ownerId])).email, OLD);
  });

  test('2. Preconditions refuse unsafe migrations', async () => {
    const taken = await mig.planEmailMigration(db, OLD, 'staff.one@gmail.com');
    assert.match(taken.errors.join(' '), /already belongs to an account/);

    const notSuper = await mig.planEmailMigration(db, 'staff.one@gmail.com', 'another@company.co.in');
    assert.match(notSuper.errors.join(' '), /not the Super Admin/);

    const missing = await mig.planEmailMigration(db, 'nobody@company.com', NEW);
    assert.match(missing.errors.join(' '), /No account uses/);

    const same = await mig.planEmailMigration(db, OLD, OLD);
    assert.ok(same.errors.length > 0);

    await assert.rejects(mig.applyEmailMigration(db, taken), /Refusing to apply/);
  });

  test('3. Apply changes only the email identity and keeps ids, hashes, roles and status', async () => {
    const plan = await mig.planEmailMigration(db, OLD, NEW, HISTORY);
    journal = await mig.applyEmailMigration(db, plan);
    assert.equal(journal.changes.length, plan.changes.length);

    const report = await mig.verifyEmailMigration(db, beforeSnapshot, OLD, NEW, HISTORY);
    assert.deepEqual(report.problems, []);
    assert.equal(report.ok, true);
    assert.equal(report.remainingOldAddressRows, 0);
    assert.equal(report.newAddressResolvesTo, ownerId);

    const owner = await db.get<any>('SELECT id, email, role, password_hash, account_status, is_active FROM users WHERE id = ?', [ownerId]);
    assert.equal(owner.email, NEW);
    assert.equal(owner.role, 'SUPER_ADMIN');
    assert.equal(owner.password_hash, ownerHash);

    // Other accounts, including the Admin with no email, are untouched.
    assert.equal((await db.get<any>("SELECT email FROM users WHERE id = 'admin-gmail'")).email, 'staff.one@gmail.com');
    assert.equal((await db.get<any>("SELECT email FROM users WHERE id = 'admin-noemail'")).email, null);
    assert.equal((await db.get<any>("SELECT user_email FROM audit_logs WHERE id = 'audit-other'")).user_email, 'staff.one@gmail.com');
    assert.match((await db.get<any>("SELECT details_json FROM audit_logs WHERE id = 'audit-0'")).details_json, new RegExp(NEW.replace('.', '\\.')));
  });

  test('4. The owner is not locked out: username and new email log in, the old token still works, the old email is gone', async () => {
    const byUsername = await post('/api/auth/login', { identifier: 'satyaki_owner', password: OWNER_PASSWORD });
    assert.equal(byUsername.status, 200);
    assert.equal(byUsername.body.user.id, ownerId);
    assert.equal(byUsername.body.user.role, 'SUPER_ADMIN');

    const byNew = await post('/api/auth/login', { identifier: NEW, password: OWNER_PASSWORD });
    assert.equal(byNew.status, 200);
    assert.equal(byNew.body.user.email, NEW);

    const byOld = await post('/api/auth/login', { identifier: OLD, password: OWNER_PASSWORD });
    assert.equal(byOld.status, 401);

    // A session issued before the migration stays valid (token_version is untouched).
    const me = await fetch(`${baseUrl}/api/auth/me`, { headers: { Authorization: `Bearer ${tokenBefore}` } });
    assert.equal(me.status, 200);
    assert.equal(((await me.json()) as any).user.email, NEW);
  });

  test('5. Running it again is refused cleanly (nothing left to migrate)', async () => {
    const plan = await mig.planEmailMigration(db, OLD, NEW, HISTORY);
    assert.ok(plan.errors.length > 0);
    assert.equal(plan.changes.length, 0);
  });

  test('6. Rollback restores every original value exactly', async () => {
    const result = await mig.rollbackEmailMigration(db, journal);
    assert.equal(result.restored, journal.changes.length);
    assert.deepEqual(result.skipped, []);

    assert.equal((await db.get<any>('SELECT email FROM users WHERE id = ?', [ownerId])).email, OLD);
    assert.equal((await db.get<any>("SELECT email FROM admin_access_requests WHERE id = 'req-old'")).email, OLD.toUpperCase());
    assert.equal((await db.get<any>("SELECT details_json FROM audit_logs WHERE id = 'audit-0'")).details_json, JSON.stringify({ email: OLD, note: 'x' }));
    const after = await mig.snapshotAccounts(db);
    assert.deepEqual(after, beforeSnapshot);

    const login = await post('/api/auth/login', { identifier: OLD, password: OWNER_PASSWORD });
    assert.equal(login.status, 200);
  });

  test('7. Rollback does not overwrite values edited after the migration, and does not hand an address to two accounts', async () => {
    const plan = await mig.planEmailMigration(db, OLD, NEW, HISTORY);
    const second = await mig.applyEmailMigration(db, plan);

    // Someone edits one audit row afterwards, and another account takes the retired address.
    await db.run("UPDATE audit_logs SET user_email = 'edited@company.com' WHERE id = 'audit-1'");
    await db.run("UPDATE users SET email = ? WHERE id = 'admin-gmail'", [OLD]);

    const result = await mig.rollbackEmailMigration(db, second);
    const reasons = result.skipped.map((s) => s.reason).sort();
    assert.ok(reasons.includes('value was edited after the migration'));
    assert.ok(reasons.includes('old address now used by another account'));
    assert.equal((await db.get<any>("SELECT user_email FROM audit_logs WHERE id = 'audit-1'")).user_email, 'edited@company.com');
    assert.equal((await db.get<any>('SELECT email FROM users WHERE id = ?', [ownerId])).email, NEW);

    // Put the fixture back for any later assertions.
    await db.run("UPDATE users SET email = 'staff.one@gmail.com' WHERE id = 'admin-gmail'");
  });

  test('8. A failure part-way through leaves the database unchanged (single transaction)', async () => {
    // Tamper with a row between planning and applying: the guarded UPDATE finds nothing and the whole run is rolled back.
    await db.run("UPDATE users SET email = ? WHERE id = ?", [OLD, ownerId]);
    await db.run("UPDATE audit_logs SET user_email = ? WHERE id IN ('audit-0', 'audit-2')", [OLD]);
    await db.run("UPDATE audit_logs SET user_email = ? WHERE id = 'audit-1'", [OLD]);
    const plan = await mig.planEmailMigration(db, OLD, NEW, HISTORY);
    const target = plan.changes.find((c) => c.rowId === 'audit-2' && c.column === 'user_email')!;
    await db.run("UPDATE audit_logs SET user_email = 'changed-meanwhile@company.com' WHERE id = 'audit-2'");
    await assert.rejects(mig.applyEmailMigration(db, plan), /changed while migrating/);
    assert.ok(target);
    assert.equal((await db.get<any>('SELECT email FROM users WHERE id = ?', [ownerId])).email, OLD, 'the account email must not be half-migrated');
    assert.equal((await db.get<any>("SELECT user_email FROM audit_logs WHERE id = 'audit-0'")).user_email, OLD);
  });

  test('9. By default only the account email changes: audit logs and other history stay exactly as written', async () => {
    // Reset the fixture to a clean legacy state.
    await db.run("UPDATE audit_logs SET user_email = ? WHERE id IN ('audit-0', 'audit-1', 'audit-2')", [OLD]);
    await db.run("UPDATE users SET email = ? WHERE id = ?", [OLD, ownerId]);
    const auditBefore = JSON.stringify(await db.all('SELECT * FROM audit_logs ORDER BY id'));
    const requestsBefore = JSON.stringify(await db.all('SELECT * FROM admin_access_requests ORDER BY id'));
    const snapshot = await mig.snapshotAccounts(db);

    const plan = await mig.planEmailMigration(db, OLD, NEW);
    assert.deepEqual(plan.errors, []);
    assert.deepEqual(plan.changes.map((c) => `${c.table}.${c.column}`), ['users.email']);

    const applied = await mig.applyEmailMigration(db, plan);
    assert.equal(applied.changes.length, 1);
    const report = await mig.verifyEmailMigration(db, snapshot, OLD, NEW);
    assert.equal(report.ok, true, report.problems.join('; '));

    assert.equal(JSON.stringify(await db.all('SELECT * FROM audit_logs ORDER BY id')), auditBefore, 'audit logs must be byte-identical');
    assert.equal(JSON.stringify(await db.all('SELECT * FROM admin_access_requests ORDER BY id')), requestsBefore);
    assert.equal((await db.get<any>('SELECT email FROM users WHERE id = ?', [ownerId])).email, NEW);

    // Rolling it back restores the single field.
    const rolled = await mig.rollbackEmailMigration(db, applied);
    assert.equal(rolled.restored, 1);
    assert.equal((await db.get<any>('SELECT email FROM users WHERE id = ?', [ownerId])).email, OLD);
  });
});
