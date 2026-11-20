// Must stay the first import: prepares the isolated test environment (EMPTY database) before the app loads.
import { baseUrl, getDatabase } from './helpers/freshContext.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSetupAccess, setupAttemptsExhausted, recordSetupFailure, resetSetupFailuresForTests } from '../src/routes/auth.js';

const PRIMARY = 'contact@cogniverse.co.in';
const RETIRED = 'cogniverse.digiverse@gmail.com';
const PASSWORD = 'BootstrapOwnerPass@2026!';

async function call(method: string, path: string, body?: unknown, token?: string) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: res.status, body: (await res.json().catch(() => ({}))) as any };
}

const setup = (over: Record<string, unknown> = {}) =>
  call('POST', '/api/auth/setup', { name: 'Satyaki Maiti', username: 'owner_boot', password: PASSWORD, confirmPassword: PASSWORD, ...over });

const superAdminCount = () =>
  Number(getDatabase().prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'SUPER_ADMIN'").get()!.n);

describe('Super Admin first-run bootstrap and sign-in', () => {
  let ownerToken = '';

  test('A. With no Super Admin, status says setup is required (state NONE) and exposes no account details', async () => {
    const status = await call('GET', '/api/auth/setup/status');
    assert.equal(status.status, 200);
    assert.equal(status.body.setupRequired, true);
    assert.equal(status.body.superAdminState, 'NONE');
    assert.equal(status.body.email, PRIMARY);
    assert.equal(status.body.requiresSetupKey, false);
    assert.deepEqual(Object.keys(status.body).sort(), ['defaultName', 'email', 'requiresSetupKey', 'setupRequired', 'superAdminState']);
  });

  test('B. Setup refuses weak or invalid input and creates nothing (no default password exists)', async () => {
    const cases: Array<[string, Record<string, unknown>]> = [
      ['missing password', { password: undefined, confirmPassword: undefined }],
      ['short password', { password: 'short1!', confirmPassword: 'short1!' }],
      ['mismatched confirmation', { confirmPassword: PASSWORD + 'x' }],
      ['invalid email', { email: 'not-an-email' }],
      ['email without TLD', { email: 'owner@company' }],
      ['retired Gmail identity', { email: RETIRED }],
      ['invalid username', { username: 'no spaces allowed' }],
      ['short username', { username: 'ab' }]
    ];
    for (const [label, over] of cases) {
      const res = await setup(over);
      assert.equal(res.status, 400, `${label}: ${JSON.stringify(res.body)}`);
    }
    assert.equal(superAdminCount(), 0, 'failed attempts must not create an account');
    for (const guess of ['admin', 'owner_boot', 'superadmin', PRIMARY]) {
      for (const password of ['admin', 'password', 'Password123!', 'digiverse']) {
        assert.equal((await call('POST', '/api/auth/login', { identifier: guess, password })).status, 401);
      }
    }
  });

  test('C. Concurrent setup requests create exactly one Super Admin', async () => {
    const attempts = await Promise.all(
      Array.from({ length: 6 }, (_, i) => setup({ username: `racer_${i}`, email: i % 2 ? `racer${i}@company.co.in` : undefined }))
    );
    const created = attempts.filter((a) => a.status === 201);
    const refused = attempts.filter((a) => a.status === 403);
    assert.equal(created.length, 1, JSON.stringify(attempts.map((a) => a.status)));
    assert.equal(refused.length, 5);
    assert.equal(superAdminCount(), 1);
    ownerToken = created[0].body.token;
    assert.equal(created[0].body.user.role, 'SUPER_ADMIN');
  });

  test('D. After setup the flow is permanently closed (status, second setup, other emails)', async () => {
    const status = await call('GET', '/api/auth/setup/status');
    assert.equal(status.body.setupRequired, false);
    assert.equal(status.body.superAdminState, 'ACTIVE');

    for (const email of [PRIMARY, 'someone@gmail.com', 'other@company.co.in']) {
      const again = await setup({ username: `late_${email.length}`, email });
      assert.equal(again.status, 403, 'setup must never reopen while a usable Super Admin exists');
    }
    assert.equal(superAdminCount(), 1);
  });

  test('E. Sign-in: username and email work, wrong password and the retired Gmail do not; JWT protects routes', async () => {
    const winner = (getDatabase().prepare("SELECT username, email FROM users WHERE role = 'SUPER_ADMIN'").get()) as { username: string; email: string };

    const byUsername = await call('POST', '/api/auth/login', { identifier: winner.username, password: PASSWORD });
    assert.equal(byUsername.status, 200);
    assert.equal(byUsername.body.user.role, 'SUPER_ADMIN');

    const byEmail = await call('POST', '/api/auth/login', { identifier: winner.email.toUpperCase(), password: PASSWORD });
    assert.equal(byEmail.status, 200);
    assert.equal(byEmail.body.user.id, byUsername.body.user.id);

    assert.equal((await call('POST', '/api/auth/login', { identifier: winner.username, password: PASSWORD + 'x' })).status, 401);
    assert.equal((await call('POST', '/api/auth/login', { identifier: RETIRED, password: PASSWORD })).status, 401);

    const token = byEmail.body.token as string;
    assert.equal((await call('GET', '/api/auth/me', undefined, token)).status, 200);
    assert.equal((await call('GET', '/api/admin/users', undefined, token)).status, 200);
    assert.equal((await call('GET', '/api/admin/users')).status, 401);
    assert.equal((await call('GET', '/api/admin/users', undefined, 'not.a.jwt')).status, 401);
    assert.equal((await call('GET', '/api/admin/users', undefined, ownerToken)).status, 200);
  });

  test('F. An existing Admin signs in as before and cannot use Super Admin routes', async () => {
    const bcrypt = await import('bcryptjs');
    const { repository } = await import('../src/db/repository.js');
    await repository.createUser({
      id: 'boot-admin', email: 'staff@outlook.com', username: 'boot_admin',
      passwordHash: await bcrypt.default.hash('AdminBootPass@2026!', 10), name: 'Boot Admin', role: 'ADMIN', isActive: true
    });
    const login = await call('POST', '/api/auth/login', { identifier: 'staff@outlook.com', password: 'AdminBootPass@2026!' });
    assert.equal(login.status, 200);
    assert.equal(login.body.user.role, 'ADMIN');
    assert.equal((await call('GET', '/api/auth/me', undefined, login.body.token)).status, 200);
    assert.equal((await call('GET', '/api/admin/users', undefined, login.body.token)).status, 403);
  });

  test('G. Restarting the application does not reopen setup', async () => {
    const { closeDb } = await import('../src/db/database.js');
    await closeDb(); // the next request reconnects and re-runs schema initialisation, as a restart does
    const status = await call('GET', '/api/auth/setup/status');
    assert.equal(status.body.setupRequired, false);
    assert.equal((await setup({ username: 'after_restart' })).status, 403);
    assert.equal(superAdminCount(), 1);
  });

  test('H. Setup accepts any provider or domain (Gmail, Outlook, Yahoo, .co.in, .edu, .org) and grants nothing by domain', async () => {
    const db = getDatabase();
    const original = db.prepare("SELECT * FROM users WHERE role = 'SUPER_ADMIN'").get() as any;
    // Simulate a genuinely empty installation, one provider at a time.
    for (const [i, email] of ['Owner.One@Gmail.com', 'owner.two@outlook.com', 'owner.three@yahoo.com', 'owner@company.co.in', 'owner@college.edu', 'owner@charity.org'].entries()) {
      db.prepare("UPDATE users SET role = 'ADMIN' WHERE id = ?").run(original.id);
      const status = await call('GET', '/api/auth/setup/status');
      assert.equal(status.body.setupRequired, true);
      const res = await setup({ username: `provider_${i}`, email });
      assert.equal(res.status, 201, `${email}: ${JSON.stringify(res.body)}`);
      assert.equal(res.body.user.email, email.toLowerCase());
      assert.equal(res.body.user.role, 'SUPER_ADMIN');
      // Demote again so the next provider starts from "no Super Admin".
      db.prepare("UPDATE users SET role = 'ADMIN' WHERE id = ?").run(res.body.user.id);
    }
    // An ordinary Gmail address that merely exists as an Admin is not a Super Admin.
    const gmailUser = db.prepare("SELECT role FROM users WHERE lower(email) = 'owner.one@gmail.com'").get() as any;
    assert.equal(gmailUser.role, 'ADMIN');
    // Restore the original owner and remove the extra fixtures.
    db.prepare("DELETE FROM users WHERE username LIKE 'provider_%'").run();
    db.prepare("UPDATE users SET role = 'SUPER_ADMIN' WHERE id = ?").run(original.id);
    assert.equal(superAdminCount(), 1);
  });

  test('I. A disabled-only Super Admin reports INACTIVE_ONLY; setup never overwrites an existing account', async () => {
    const db = getDatabase();
    const owner = db.prepare("SELECT id, username, email FROM users WHERE role = 'SUPER_ADMIN'").get() as any;
    db.prepare("UPDATE users SET account_status = 'DISABLED', is_active = 0 WHERE id = ?").run(owner.id);
    try {
      const status = await call('GET', '/api/auth/setup/status');
      assert.equal(status.body.superAdminState, 'INACTIVE_ONLY');
      assert.equal(status.body.setupRequired, true);

      const sameEmail = await setup({ username: 'fresh_owner', email: owner.email });
      assert.equal(sameEmail.status, 409);
      assert.match(sameEmail.body.error, /recover/i);
      const sameUsername = await setup({ username: owner.username, email: 'fresh@company.co.in' });
      assert.equal(sameUsername.status, 409);

      // The old account is untouched.
      const row = db.prepare('SELECT account_status, email FROM users WHERE id = ?').get(owner.id) as any;
      assert.equal(row.account_status, 'DISABLED');
      assert.equal(row.email, owner.email);
    } finally {
      db.prepare("UPDATE users SET account_status = 'ACTIVE', is_active = 1 WHERE id = ?").run(owner.id);
    }
    assert.equal((await call('GET', '/api/auth/setup/status')).body.superAdminState, 'ACTIVE');
  });

  test('J. The setup gate: local machine or the correct SETUP_KEY only, with attempt limiting', () => {
    assert.equal(evaluateSetupAccess(true, undefined, undefined).allowed, true);
    assert.equal(evaluateSetupAccess(false, undefined, undefined).allowed, false);
    assert.equal(evaluateSetupAccess(false, 'right-key-123', 'wrong').allowed, false);
    assert.equal(evaluateSetupAccess(false, 'right-key-123', 'right-key-123').allowed, true);

    resetSetupFailuresForTests();
    const now = Date.now();
    for (let i = 0; i < 4; i++) recordSetupFailure('1.2.3.4', now);
    assert.equal(setupAttemptsExhausted('1.2.3.4', now), false);
    recordSetupFailure('1.2.3.4', now);
    assert.equal(setupAttemptsExhausted('1.2.3.4', now), true);
    assert.equal(setupAttemptsExhausted('5.6.7.8', now), false);
    assert.equal(setupAttemptsExhausted('1.2.3.4', now + 16 * 60 * 1000), false, 'the window expires');
  });
});
