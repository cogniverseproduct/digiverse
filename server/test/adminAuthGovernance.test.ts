// Must stay the first import: prepares the isolated test environment before the app loads.
import { baseUrl, getDatabase } from './helpers/freshContext.js';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';

describe('Admin Authentication, Access Control & Account Management', () => {

  let superAdminToken = '';
  const superAdminEmail = 'contact@cogniverse.co.in';
  const superAdminPassword = 'TestSuperAdminPass@2026!';
  const superAdminUsername = 'owner_satyaki';

  const applicantName = 'Ananya Sen';
  const applicantEmail = 'ananya.sen.staff@gmail.com';
  const applicantReason = 'Joining DigiVerse as Cultural & Event Operations Lead';
  let applicantSetupToken = '';
  const adminUsername = 'ananya_sen';
  const adminInitialPassword = 'AdminSecretPassword@2026!';
  const adminUpdatedPassword = 'UpdatedAdminSecret@2026!';
  let adminToken = '';
  let adminUserId = '';

  before(async () => {
    // Clean up test-specific artifacts to ensure idempotency across test runs
    const db = getDatabase();
    db.prepare('DELETE FROM users WHERE username = ? OR lower(email) = ?').run(adminUsername, applicantEmail);
    db.prepare('DELETE FROM admin_access_requests WHERE lower(email) = ?').run(applicantEmail);
    db.prepare('DELETE FROM admin_password_resets WHERE admin_username = ? OR lower(admin_email) = ?').run(adminUsername, applicantEmail);

    // Prime or authenticate Super Admin for test suite
    const statusRes = await fetch(`${baseUrl}/api/auth/setup/status`);
    const statusData = await statusRes.json();

    if (statusData.setupRequired) {
      const setupRes = await fetch(`${baseUrl}/api/auth/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Satyaki Maiti',
          username: superAdminUsername,
          password: superAdminPassword,
          confirmPassword: superAdminPassword
        })
      });
      const setupJson = await setupRes.json();
      superAdminToken = setupJson.token;
    } else {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: superAdminEmail,
          password: superAdminPassword
        })
      });
      if (loginRes.ok) {
        const loginData = await loginRes.json();
        superAdminToken = loginData.token;
      } else {
        // In case previous test set a different password, reset via DB for test isolation
        const bcrypt = await import('bcryptjs');
        const hash = await bcrypt.default.hash(superAdminPassword, 12);
        const db = getDatabase();
        db.prepare('UPDATE users SET password_hash = ? WHERE role = ?').run(hash, 'SUPER_ADMIN');

        const retryRes = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: superAdminEmail,
            password: superAdminPassword
          })
        });
        const retryData = await retryRes.json();
        superAdminToken = retryData.token;
      }
    }
  });

  test('1. Admin Access Request: Submits request with Full Name, email and Reason', async () => {
    // 1a. Reject a malformed address (any valid provider/domain is accepted, see emailIdentity.test.ts)
    const malformedRes = await fetch(`${baseUrl}/api/admin/access-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: applicantName,
        email: 'applicant@yahoo',
        reason: applicantReason
      })
    });
    assert.strictEqual(malformedRes.status, 400);

    // 1b. Reject invalid short name
    const shortNameRes = await fetch(`${baseUrl}/api/admin/access-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'A',
        email: applicantEmail,
        reason: applicantReason
      })
    });
    assert.strictEqual(shortNameRes.status, 400);

    // 1c. Successfully submit genuine access request
    const validRes = await fetch(`${baseUrl}/api/admin/access-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: applicantName,
        email: applicantEmail,
        reason: applicantReason
      })
    });
    assert.strictEqual(validRes.status, 201);
    const data = await validRes.json();
    assert.strictEqual(data.request.name, applicantName);
    assert.strictEqual(data.request.email, applicantEmail);
    assert.strictEqual(data.request.status, 'PENDING');
    assert.strictEqual(data.request.reason, applicantReason);

    // 1d. Duplicate pending request rejected
    const dupRes = await fetch(`${baseUrl}/api/admin/access-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: applicantName,
        email: applicantEmail
      })
    });
    assert.strictEqual(dupRes.status, 409);
  });

  test('2. Super Admin Access Requests Inbox: View, Approve and generate 48h setup link', async () => {
    // 2a. List requests as Super Admin
    const listRes = await fetch(`${baseUrl}/api/admin/access-requests`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    const found = listData.requests.find((r: any) => r.email === applicantEmail);
    assert.ok(found);
    assert.strictEqual(found.status, 'PENDING');
    assert.strictEqual(found.reason, applicantReason);

    // 2b. Approve request
    const approveRes = await fetch(`${baseUrl}/api/admin/access-requests/${found.id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(approveRes.status, 200);
    const approveData = await approveRes.json();
    assert.strictEqual(approveData.status, 'APPROVED');
    assert.ok(approveData.setupToken);
    assert.ok(approveData.setupLink);
    applicantSetupToken = approveData.setupToken;
  });

  test('3. Admin Account Setup: Applicant establishes their OWN username and password', async () => {
    // 3a. Reject short password (< 12 chars)
    const shortPassRes = await fetch(`${baseUrl}/api/admin/access-requests/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        setupToken: applicantSetupToken,
        username: adminUsername,
        password: 'Short123!',
        confirmPassword: 'Short123!'
      })
    });
    assert.strictEqual(shortPassRes.status, 400);

    // 3b. Reject mismatched confirmation
    const mismatchRes = await fetch(`${baseUrl}/api/admin/access-requests/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        setupToken: applicantSetupToken,
        username: adminUsername,
        password: adminInitialPassword,
        confirmPassword: 'DifferentPassword@2026!'
      })
    });
    assert.strictEqual(mismatchRes.status, 400);

    // 3c. Successful account creation
    const completeRes = await fetch(`${baseUrl}/api/admin/access-requests/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        setupToken: applicantSetupToken,
        name: applicantName,
        username: adminUsername,
        password: adminInitialPassword,
        confirmPassword: adminInitialPassword
      })
    });
    assert.strictEqual(completeRes.status, 201);
    const completeData = await completeRes.json();
    assert.strictEqual(completeData.user.username, adminUsername);
    assert.strictEqual(completeData.user.role, 'ADMIN');
    adminUserId = completeData.user.id;

    // 3d. Single-use token enforcement: Reusing setup token fails
    const reuseRes = await fetch(`${baseUrl}/api/admin/access-requests/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        setupToken: applicantSetupToken,
        username: 'other_username',
        password: adminInitialPassword,
        confirmPassword: adminInitialPassword
      })
    });
    assert.strictEqual(reuseRes.status, 409);
  });

  test('4. Admin Login: Strictly Username + Password (Zero OTP / Passkey / WebAuthn)', async () => {
    // 4a. Invalid credentials fail safely
    const badRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: adminUsername,
        password: 'WrongPassword@2026!'
      })
    });
    assert.strictEqual(badRes.status, 401);

    // 4b. Valid Username + Password succeeds directly
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: adminUsername,
        password: adminInitialPassword
      })
    });
    assert.strictEqual(loginRes.status, 200);
    const loginData = await loginRes.json();
    assert.strictEqual(loginData.user.role, 'ADMIN');
    assert.strictEqual(loginData.user.username, adminUsername);
    adminToken = loginData.token;
  });

  test('5. Super Admin Admin Profile & Account Controls: Disable and Session Revocation', async () => {
    // 5a. Super Admin views Admin full profile
    const profileRes = await fetch(`${baseUrl}/api/admin/users/${adminUserId}/profile`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(profileRes.status, 200);
    const profileData = await profileRes.json();
    assert.strictEqual(profileData.user.username, adminUsername);
    assert.strictEqual(profileData.user.accountStatus, 'ACTIVE');

    // 5b. Super Admin disables Admin account with reason
    const disableRes = await fetch(`${baseUrl}/api/admin/users/${adminUserId}/disable`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason: 'Security review pending' })
    });
    assert.strictEqual(disableRes.status, 200);
    const disableData = await disableRes.json();
    assert.strictEqual(disableData.accountStatus, 'DISABLED');

    // 5c. Disabled Admin active session is immediately revoked (Token version check)
    const authedReqRes = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    // Disabled account gets rejected immediately
    assert.ok(authedReqRes.status === 401 || authedReqRes.status === 403);

    // 5d. Disabled Admin cannot log in
    const disabledLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: adminUsername,
        password: adminInitialPassword
      })
    });
    assert.strictEqual(disabledLoginRes.status, 403);
  });

  test('6. Super Admin Enables Admin: Restores login with original credentials', async () => {
    const enableRes = await fetch(`${baseUrl}/api/admin/users/${adminUserId}/enable`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(enableRes.status, 200);
    const enableData = await enableRes.json();
    assert.strictEqual(enableData.accountStatus, 'ACTIVE');

    // Admin logs in again with original credentials
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: adminUsername,
        password: adminInitialPassword
      })
    });
    assert.strictEqual(loginRes.status, 200);
    const loginData = await loginRes.json();
    adminToken = loginData.token;
  });

  test('7. Admin Password Reset: Request -> Super Admin Approve -> Admin sets new password', async () => {
    // 7a. Submit password reset request
    const requestRes = await fetch(`${baseUrl}/api/admin/password-resets/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: adminUsername,
        reason: 'Scheduled quarterly credential rotation'
      })
    });
    assert.strictEqual(requestRes.status, 201);
    const requestData = await requestRes.json();
    const resetRequestId = requestData.requestId;

    // 7b. Super Admin reviews and approves
    const listRes = await fetch(`${baseUrl}/api/admin/password-resets`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    const pendingReset = listData.requests.find((r: any) => r.id === resetRequestId);
    assert.ok(pendingReset);
    assert.strictEqual(pendingReset.status, 'PENDING');

    const approveRes = await fetch(`${baseUrl}/api/admin/password-resets/${resetRequestId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(approveRes.status, 200);
    const approveData = await approveRes.json();
    assert.ok(approveData.resetToken);
    const resetToken = approveData.resetToken;

    // 7c. Admin establishes new password via resetToken
    const completeRes = await fetch(`${baseUrl}/api/admin/password-resets/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resetToken,
        password: adminUpdatedPassword,
        confirmPassword: adminUpdatedPassword
      })
    });
    assert.strictEqual(completeRes.status, 200);

    // 7d. Prior session is invalidated
    const oldSessionRes = await fetch(`${baseUrl}/api/projects`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(oldSessionRes.status, 401);

    // 7e. Old password fails
    const oldPassRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: adminUsername,
        password: adminInitialPassword
      })
    });
    assert.strictEqual(oldPassRes.status, 401);

    // 7f. New password succeeds
    const newPassRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: adminUsername,
        password: adminUpdatedPassword
      })
    });
    assert.strictEqual(newPassRes.status, 200);
    const newLoginData = await newPassRes.json();
    adminToken = newLoginData.token;
  });

  test('8. Super Admin Impersonation: "Login as Admin" with Super Admin re-auth', async () => {
    // 8a. Rejection when incorrect Super Admin password is supplied
    const badAuthRes = await fetch(`${baseUrl}/api/admin/users/${adminUserId}/impersonate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        superAdminPassword: 'WrongSuperAdminPass!',
        reason: 'Inspecting client website generation issue'
      })
    });
    assert.strictEqual(badAuthRes.status, 401);

    // 8b. Successful impersonation session generation
    const impRes = await fetch(`${baseUrl}/api/admin/users/${adminUserId}/impersonate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        superAdminPassword: superAdminPassword,
        reason: 'Inspecting client website generation issue'
      })
    });
    assert.strictEqual(impRes.status, 200);
    const impData = await impRes.json();
    assert.ok(impData.token);
    assert.strictEqual(impData.impersonation.active, true);
    assert.strictEqual(impData.user.username, adminUsername);
    const impersonationToken = impData.token;

    // 8c. Impersonated token CANNOT invoke Super Admin platform governance
    const govRes = await fetch(`${baseUrl}/api/admin/access-requests`, {
      headers: { Authorization: `Bearer ${impersonationToken}` }
    });
    assert.strictEqual(govRes.status, 403);

    // 8d. Impersonated token CAN access Admin operator functions
    const projectsRes = await fetch(`${baseUrl}/api/projects`, {
      headers: { Authorization: `Bearer ${impersonationToken}` }
    });
    assert.strictEqual(projectsRes.status, 200);

    // 8e. Exit impersonation view
    const exitRes = await fetch(`${baseUrl}/api/admin/impersonate/exit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${impersonationToken}` }
    });
    assert.strictEqual(exitRes.status, 200);
  });

  test('9. RBAC Isolation: Active Admin cannot access Super Admin platform routes', async () => {
    // Attempting to access Super Admin overview with an Admin token
    const blockedRes = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(blockedRes.status, 403);

    // Attempting to list users
    const blockedUsersRes = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(blockedUsersRes.status, 403);

    // Attempting to approve access request
    const blockedApproveRes = await fetch(`${baseUrl}/api/admin/access-requests/any-id/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(blockedApproveRes.status, 403);
  });

  test('10. Super Admin Removes Admin: Soft deletion, session revocation, client data preserved', async () => {
    // 10a. Remove Admin account
    const removeRes = await fetch(`${baseUrl}/api/admin/users/${adminUserId}/remove`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason: 'Operator contract ended' })
    });
    assert.strictEqual(removeRes.status, 200);
    const removeData = await removeRes.json();
    assert.strictEqual(removeData.accountStatus, 'REMOVED');

    // 10b. Removed Admin cannot log in
    const removedLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: adminUsername,
        password: adminUpdatedPassword
      })
    });
    assert.strictEqual(removedLoginRes.status, 403);

    // 10c. Existing active token for removed Admin is rejected
    const removedSessionRes = await fetch(`${baseUrl}/api/projects`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.ok(removedSessionRes.status === 401 || removedSessionRes.status === 403);

    // 10d. Client projects remain completely intact and accessible to Super Admin
    const projectsRes = await fetch(`${baseUrl}/api/projects`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(projectsRes.status, 200);
    const data = await projectsRes.json();
    assert.ok(Array.isArray(data.projects));
  });

  after(async () => {
    const db = getDatabase();
    db.prepare('DELETE FROM users WHERE username = ? OR lower(email) = ?').run(adminUsername, applicantEmail);
    db.prepare('DELETE FROM admin_access_requests WHERE lower(email) = ?').run(applicantEmail);
    db.prepare('DELETE FROM admin_password_resets WHERE admin_username = ? OR lower(admin_email) = ?').run(adminUsername, applicantEmail);
  });
});
