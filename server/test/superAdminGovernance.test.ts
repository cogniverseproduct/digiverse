// Must stay the first import: prepares the isolated test environment before the app loads.
import { baseUrl, getDatabase, seedFixtureAccount } from './helpers/freshContext.js';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';

describe('Super Admin Authentication, Owner Profile & Platform Governance', () => {

  let superAdminToken = '';
  let adminToken = '';
  const initialUsername = 'satyakimaiti';
  const initialPassword = 'SuperPassword@2026!';
  const updatedPassword = 'NewSuperPassword@2026!';
  const superAdminEmail = 'contact@cogniverse.co.in';

  before(async () => {
    const db = getDatabase();
    db.prepare("DELETE FROM users WHERE role = 'SUPER_ADMIN'").run();
    db.prepare("DELETE FROM ownership_transfers").run();
    db.prepare("DELETE FROM audit_logs").run();
    // This suite also exercises an operational Admin; create the fixture one (the Super Admin is created by the setup test itself).
    await seedFixtureAccount('ADMIN');
  });

  test('1. Setup Status: Reports setupRequired is true before bootstrap', async () => {
    const res = await fetch(`${baseUrl}/api/auth/setup/status`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.setupRequired, true);
    assert.strictEqual(data.defaultName, 'Satyaki Maiti');
    assert.strictEqual(data.email, superAdminEmail);
  });

  test('2. First-Run Bootstrap: Validates inputs and creates Product Owner', async () => {
    // 2a. Reject short password (< 12 chars)
    const shortRes = await fetch(`${baseUrl}/api/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Satyaki Maiti',
        username: initialUsername,
        password: 'Short123!',
        confirmPassword: 'Short123!'
      })
    });
    assert.strictEqual(shortRes.status, 400);

    // 2b. Reject mismatched passwords
    const mismatchRes = await fetch(`${baseUrl}/api/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Satyaki Maiti',
        username: initialUsername,
        password: initialPassword,
        confirmPassword: 'DifferentPassword@2026!'
      })
    });
    assert.strictEqual(mismatchRes.status, 400);

    // 2c. Successful bootstrap
    const setupRes = await fetch(`${baseUrl}/api/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Satyaki Maiti',
        username: initialUsername,
        password: initialPassword,
        confirmPassword: initialPassword
      })
    });

    assert.strictEqual(setupRes.status, 201);
    const setupData = await setupRes.json();
    assert.ok(setupData.token);
    assert.strictEqual(setupData.user.name, 'Satyaki Maiti');
    assert.strictEqual(setupData.user.email, superAdminEmail);
    assert.strictEqual(setupData.user.username, initialUsername);
    assert.strictEqual(setupData.user.role, 'SUPER_ADMIN');

    superAdminToken = setupData.token;
  });

  test('3. One-Time Setup Lockout: Subsequent bootstrap attempts are permanently rejected', async () => {
    const statusRes = await fetch(`${baseUrl}/api/auth/setup/status`);
    const statusData = await statusRes.json();
    assert.strictEqual(statusData.setupRequired, false);

    const secondSetupRes = await fetch(`${baseUrl}/api/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker',
        username: 'attacker',
        password: 'AttackerPassword@2026!',
        confirmPassword: 'AttackerPassword@2026!'
      })
    });

    assert.strictEqual(secondSetupRes.status, 403);
    const errData = await secondSetupRes.json();
    assert.ok(errData.error.includes('already been completed'));
  });

  test('4. Super Admin Login: Authenticates by username and rejects invalid credentials', async () => {
    // 4a. Login by username
    const usernameLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: initialUsername,
        password: initialPassword
      })
    });
    assert.strictEqual(usernameLoginRes.status, 200);
    const loginData = await usernameLoginRes.json();
    assert.strictEqual(loginData.user.role, 'SUPER_ADMIN');
    assert.strictEqual(loginData.user.email, superAdminEmail);

    // 4b. Login by registered email fallback
    const emailLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: superAdminEmail,
        password: initialPassword
      })
    });
    assert.strictEqual(emailLoginRes.status, 200);

    // 4c. Reject invalid password
    const wrongPassRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: initialUsername,
        password: 'IncorrectPassword@999'
      })
    });
    assert.strictEqual(wrongPassRes.status, 401);

    // 4d. Authenticate Admin operator
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@digiverse.internal',
        password: 'Digiverse@2026!'
      })
    });
    assert.strictEqual(adminLoginRes.status, 200);
    const adminData = await adminLoginRes.json();
    assert.strictEqual(adminData.user.role, 'ADMIN');
    adminToken = adminData.token;
  });

  test('5. Profile Management: Updates display name and persists in database', async () => {
    const updateRes = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        name: 'Satyaki Maiti (Founder)'
      })
    });

    assert.strictEqual(updateRes.status, 200);
    const updateData = await updateRes.json();
    assert.strictEqual(updateData.user.name, 'Satyaki Maiti (Founder)');

    // Verify GET /me returns updated name
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const meData = await meRes.json();
    assert.strictEqual(meData.user.name, 'Satyaki Maiti (Founder)');
  });

  test('6. Password Change: Verifies current password and rotates hash', async () => {
    // 6a. Reject incorrect current password
    const failRes = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        currentPassword: 'WrongCurrentPassword@123',
        newPassword: updatedPassword,
        confirmPassword: updatedPassword
      })
    });
    assert.strictEqual(failRes.status, 401);

    // 6b. Successful password change
    const passRes = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        currentPassword: initialPassword,
        newPassword: updatedPassword,
        confirmPassword: updatedPassword
      })
    });
    assert.strictEqual(passRes.status, 200);

    // 6c. Verify old password no longer works
    const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: initialUsername,
        password: initialPassword
      })
    });
    assert.strictEqual(oldLoginRes.status, 401);

    // 6d. Verify new password works and refresh superAdminToken
    const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: initialUsername,
        password: updatedPassword
      })
    });
    assert.strictEqual(newLoginRes.status, 200);
    const newLoginData = await newLoginRes.json();
    superAdminToken = newLoginData.token;
  });

  test('7. Security Telemetry: Returns real persistent account and session telemetry', async () => {
    const secRes = await fetch(`${baseUrl}/api/auth/security-status`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(secRes.status, 200);
    const secData = await secRes.json();
    assert.ok(secData.accountCreatedAt);
    assert.strictEqual(secData.activeSessionsCount, 1);
    assert.strictEqual(secData.recoveryEmailConfigured, false);
  });

  test('8. Ownership Transfer Lifecycle: the new owner signs in, accepts, and ownership moves atomically', async () => {
    const candidateEmail = 'candidate.owner@example.com';
    const candidateUsername = 'targetowner';
    const candidatePassword = 'CandidatePassword@2026!';
    const json = { 'Content-Type': 'application/json' };
    const post = async (path: string, body: unknown, token?: string) => {
      const res = await fetch(`${baseUrl}${path}`, {
        method: 'POST', headers: { ...json, ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body)
      });
      return { status: res.status, body: (await res.json().catch(() => ({}))) as any };
    };
    const login = (identifier: string, password: string) => post('/api/auth/login', { identifier, password });
    const newAccount = { name: 'Target Operator', email: candidateEmail, username: candidateUsername, password: candidatePassword, confirmPassword: candidatePassword };

    // 8a. An Admin cannot start a transfer.
    const forbidden = await post('/api/super-admins/transfer', { confirmationPhrase: 'TRANSFER OWNERSHIP', currentPassword: 'x', newAccount }, adminToken);
    assert.strictEqual(forbidden.status, 403);

    // 8b. The owner starts it (fresh password + phrase); nothing changes until the candidate accepts.
    const init = await post('/api/super-admins/transfer', { confirmationPhrase: 'TRANSFER OWNERSHIP', currentPassword: updatedPassword, newAccount }, superAdminToken);
    assert.strictEqual(init.status, 201, JSON.stringify(init.body));
    assert.strictEqual(init.body.transfer.status, 'PENDING');

    // 8c. The candidate signs in with the supplied credentials and accepts.
    const firstLogin = await login(candidateUsername, candidatePassword);
    assert.strictEqual(firstLogin.status, 200);
    assert.strictEqual(firstLogin.body.user.mustChangePassword, true);
    const early = await post('/api/super-admins/transfer/accept', { transferId: init.body.transfer.id, currentPassword: candidatePassword }, firstLogin.body.token);
    assert.strictEqual(early.status, 403);
    assert.strictEqual(early.body.code, 'PASSWORD_CHANGE_REQUIRED');

    // They must replace the owner-chosen password first.
    const chosenPassword = 'CandidateChoseThis@2032!';
    const rotated = await post('/api/auth/change-password', { currentPassword: candidatePassword, newPassword: chosenPassword, confirmPassword: chosenPassword }, firstLogin.body.token);
    assert.strictEqual(rotated.status, 200, JSON.stringify(rotated.body));
    const candidate = await login(candidateUsername, chosenPassword);
    assert.strictEqual(candidate.status, 200);
    assert.strictEqual(candidate.body.user.mustChangePassword, false);
    const accepted = await post('/api/super-admins/transfer/accept', { transferId: init.body.transfer.id, currentPassword: chosenPassword }, candidate.body.token);
    assert.strictEqual(accepted.status, 200, JSON.stringify(accepted.body));

    // 8d. The former owner keeps Super Admin access (no lock-out) but is no longer the owner.
    const former = await login(initialUsername, updatedPassword);
    assert.strictEqual(former.body.user.role, 'SUPER_ADMIN');
    const noLonger = await post('/api/super-admins/transfer', { confirmationPhrase: 'TRANSFER OWNERSHIP', currentPassword: updatedPassword, targetUserId: candidate.body.user.id }, former.body.token);
    assert.strictEqual(noLonger.status, 403);

    // 8e. Transfer it back; the original owner signs in and accepts.
    const back = await post('/api/super-admins/transfer', { confirmationPhrase: 'TRANSFER OWNERSHIP', currentPassword: chosenPassword, targetUserId: former.body.user.id }, candidate.body.token);
    assert.strictEqual(back.status, 201, JSON.stringify(back.body));
    const restored = await post('/api/super-admins/transfer/accept', { transferId: back.body.transfer.id, currentPassword: updatedPassword }, former.body.token);
    assert.strictEqual(restored.status, 200, JSON.stringify(restored.body));

    const finalLogin = await login(initialUsername, updatedPassword);
    assert.strictEqual(finalLogin.body.user.role, 'SUPER_ADMIN');
    superAdminToken = finalLogin.body.token;

    // Remove the candidate so the platform is pristine for the remaining checks.
    getDatabase().prepare('DELETE FROM users WHERE email = ?').run(candidateEmail);
  });

  test('9. Platform Overview: Dashboard metrics reflect real database counts without fake demo numbers', async () => {
    const overviewRes = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(overviewRes.status, 200);
    const overviewData = await overviewRes.json();

    assert.strictEqual(overviewData.stats.superAdmins, 1);
    assert.strictEqual(overviewData.stats.activeAdmins, 1); // Only the fixture Admin
    assert.strictEqual(overviewData.stats.totalProjects, 0); // The platform seeds no demo projects, so a fresh database reports zero
    assert.ok(overviewData.stats.totalUsers >= 2); // 1 Super Admin + at least 1 Admin
  });

  test('10. Audit Trail: Real events are persistently logged', async () => {
    const auditRes = await fetch(`${baseUrl}/api/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(auditRes.status, 200);
    const auditData = await auditRes.json();
    assert.ok(Array.isArray(auditData.logs));
    assert.ok(auditData.logs.length > 0);

    const actions = auditData.logs.map((l: any) => l.action);
    assert.ok(actions.includes('SUPER_ADMIN_INITIAL_SETUP'));
    assert.ok(actions.includes('USER_LOGIN'));
    assert.ok(actions.includes('UPDATE_PROFILE'));
    assert.ok(actions.includes('CHANGE_PASSWORD'));
    assert.ok(actions.includes('OWNERSHIP_TRANSFER_INITIATED'));
    assert.ok(actions.includes('OWNERSHIP_TRANSFER_ACCEPTED'));
    assert.ok(actions.includes('SUPER_ADMIN_CREATED'));
  });

  after(async () => {
    const db = getDatabase();
    db.prepare("DELETE FROM users WHERE role = 'SUPER_ADMIN'").run();
    db.prepare("DELETE FROM ownership_transfers").run();
    db.prepare("DELETE FROM audit_logs").run();
  });
});
