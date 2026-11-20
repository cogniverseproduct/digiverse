// Must stay the first import: prepares the isolated test environment before the app loads.
import { baseUrl, getDatabase } from './helpers/testContext.js';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';

describe('Phase 2: Authentication, Strict Two-Role Architecture & RBAC Security', () => {

  before(async () => {
    const db = getDatabase();
    const existing = db.prepare("SELECT id FROM users WHERE role = 'SUPER_ADMIN'").get();
    if (!existing) {
      const bcrypt = await import('bcryptjs');
      const hash = await bcrypt.default.hash('SuperAdmin@2026!', 10);
      db.prepare(`
        INSERT INTO users (id, email, password_hash, name, role, is_active, created_at, updated_at)
        VALUES ('usr_super_admin_rbac_test', 'superadmin@digiverse.internal', ?, 'Super Admin', 'SUPER_ADMIN', 1, datetime('now'), datetime('now'))
      `).run(hash);
    }
  });

  after(async () => {
    const db = getDatabase();
    db.prepare("DELETE FROM users WHERE id = 'usr_super_admin_rbac_test' OR email LIKE 'ops_%@digiverse.internal'").run();
  });

  test('should authenticate Super Admin with seeded credentials', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@digiverse.internal',
        password: 'SuperAdmin@2026!'
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user.role, 'SUPER_ADMIN');
    assert.ok(data.token, 'Token must be present in response');
  });

  test('should authenticate Admin with seeded credentials', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@digiverse.internal',
        password: 'Digiverse@2026!'
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user.role, 'ADMIN');
    assert.ok(data.token, 'Token must be present in response');
  });

  test('should reject invalid credentials with 401', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@digiverse.internal',
        password: 'WrongPassword123!'
      })
    });

    assert.strictEqual(res.status, 401);
  });

  test('Super Admin can access /api/admin/users and list accounts', async () => {
    // Login as Super Admin
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@digiverse.internal',
        password: 'SuperAdmin@2026!'
      })
    });
    const { token } = await loginRes.json();

    const usersRes = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(usersRes.status, 200);
    const data = await usersRes.json();
    assert.ok(Array.isArray(data.users), 'Users should be an array');
    assert.ok(data.users.length >= 2, 'Should contain seeded Super Admin and Admin');
  });

  test('Admin is STRICTLY FORBIDDEN (403) from accessing /api/admin/users', async () => {
    // Login as Admin
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@digiverse.internal',
        password: 'Digiverse@2026!'
      })
    });
    const { token } = await loginRes.json();

    const usersRes = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(usersRes.status, 403);
    const data = await usersRes.json();
    assert.ok(data.error.includes('lacks sufficient privileges'));
  });

  test('Super Admin can invite a new Admin, the Admin sets their own password, and the audit log records it', async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@digiverse.internal', password: 'SuperAdmin@2026!' })
    });
    const { token } = await loginRes.json();

    const testAdminEmail = `ops_${Date.now()}@digiverse.internal`;
    const inviteRes = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Operations Field Lead', email: testAdminEmail })
    });
    assert.strictEqual(inviteRes.status, 201);
    const invite = await inviteRes.json();

    const username = `ops_${Date.now()}`;
    const completeRes = await fetch(`${baseUrl}/api/admin/access-requests/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setupToken: invite.setupToken, username, password: 'TempPassword@2026!', confirmPassword: 'TempPassword@2026!' })
    });
    assert.strictEqual(completeRes.status, 201);

    // The invitation is in the audit trail
    const auditRes = await fetch(`${baseUrl}/api/admin/audit-logs`, { headers: { Authorization: `Bearer ${token}` } });
    assert.strictEqual(auditRes.status, 200);
    const auditData = await auditRes.json();
    const event = auditData.logs.find((l: any) => l.action === 'INVITE_ADMIN' && l.details?.invitedEmail === testAdminEmail);
    assert.ok(event, 'Audit log event must exist for the admin invitation');

    // The new Admin can sign in with the password they chose
    const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: username, password: 'TempPassword@2026!' })
    });
    assert.strictEqual(adminLogin.status, 200);
    const { user: newAdmin } = await adminLogin.json();

    // Disable the account: sign-in is then refused with 403
    const disableRes = await fetch(`${baseUrl}/api/admin/users/${newAdmin.id}/disable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason: 'RBAC test' })
    });
    assert.strictEqual(disableRes.status, 200);

    const deactLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: username, password: 'TempPassword@2026!' })
    });
    assert.strictEqual(deactLoginRes.status, 403);
  });

  test('Admin can invoke website generation; day-to-day design editing is closed to the Super Admin', async () => {
    const login = async (email: string, password: string) => (await (await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
    })).json()).token as string;
    const adminToken = await login('admin@digiverse.internal', 'Digiverse@2026!');
    const superToken = await login('superadmin@digiverse.internal', 'SuperAdmin@2026!');

    // The platform seeds no projects, so the Admin creates one and generates it.
    const created = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ organizationName: `RBAC Generation Org ${Date.now()}`, category: 'cultural' })
    });
    assert.strictEqual(created.status, 201);
    const { project } = await created.json();
    const adminGenRes = await fetch(`${baseUrl}/api/projects/${project.id}/generate`, { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } });
    assert.strictEqual(adminGenRes.status, 200);

    // Design customization is an Admin-only operation: the Super Admin is refused with 403.
    const superEditRes = await fetch(`${baseUrl}/api/projects/${project.id}/customize`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${superToken}` },
      body: JSON.stringify({ heroHeadline: 'Not allowed' })
    });
    assert.strictEqual(superEditRes.status, 403);
    const superEditData = await superEditRes.json();
    assert.ok(superEditData.error.includes("Role 'SUPER_ADMIN' lacks sufficient privileges"));
  });

  test('Unauthenticated request to protected endpoints is rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/api/projects`);
    assert.strictEqual(res.status, 401);
  });
});
