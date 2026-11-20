# DIGIVERSE — COMPLETE ADMIN AUTHENTICATION, ACCESS CONTROL & ACCOUNT MANAGEMENT MASTER PLAN

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a production-grade, secure, and backend-connected Admin Authentication, Access Control, and Account Management system for DigiVerse that seamlessly integrates with the existing Super Admin Platform Governance without breaking or weakening any Super Admin functionality.

**Architecture:** 
- **Two Strictly Enforced Internal Platform Roles:** `SUPER_ADMIN` (Product Owner) and `ADMIN` (Internal Operator / Sales / Agent). Zero third/demo roles.
- **Strictly Two-Field Admin Login:** Username and Password only. Zero passkeys, zero WebAuthn, zero Windows Hello, zero device PINs, zero mandatory Google sign-in, zero SMS/email OTPs.
- **Self-Controlled Admin Credentials:** Applicants request access; Super Admin approves; applicants establish their own usernames and passwords via single-use, 48-hour expiring setup tokens. Super Admin NEVER creates, views, or receives an Admin's password.
- **Super-Admin-Approved Password Resets:** Admins submit password change requests; Super Admin approves; Admin establishes their new password via single-use, 24-hour expiring reset tokens.
- **Full Account Lifecycle Controls:** Super Admin can Disable (revoking active sessions and blocking logins with optional reason), Enable (restoring login), or Remove (soft-delete, revoking access) any Admin while 100% preserving client projects, media, and business records.
- **Secure Super Admin Impersonation ("Login as Admin"):** Super Admin can inspect an ACTIVE Admin's dashboard after fresh password re-authentication; creates a short-lived 1-hour session with prominent banner ("You are viewing this account as Super Admin.") and "Exit Admin View" control; audited thoroughly.

**Tech Stack:** Node.js, Express, TypeScript, SQLite (`node:sqlite`), React 18, Tailwind CSS, Lucide icons, JWT, bcryptjs, crypto.

---

## Global Constraints

1. **Product Identity:** DigiVerse remains the product identity.
2. **Zero Regressions to Super Admin:** Existing Super Admin login, dashboard, Profile & Security, and Ownership Transfer must remain 100% functional.
3. **Role Limit:** Exactly two roles: `SUPER_ADMIN` and `ADMIN`. No demo roles (`Operations Lead`, `Field Lead`, etc.).
4. **Admin Login Input Limit:** Exactly two credential inputs: `Username` and `Password`.
5. **No Password Visibility:** Super Admin never creates, views, retrieves, or receives an Admin's password.
6. **Data Preservation:** Disabling or removing an Admin never cascades to delete client projects, websites, or inquiries.
7. **No Git / No OCI / No Deploy:** No Git commands (`git init`, `add`, `commit`), no cloud deployment, no billable resource creation.

---

## Review Focus

1. **Attempting to log in as a DISABLED Admin:** Returns `403 Forbidden` with `"Account has been deactivated. Please contact your Super Administrator."` and does not issue a JWT.
2. **Setup token replay or reuse:** Re-submitting an already consumed setup token returns `409 Conflict` or `410 Gone`.
3. **Password reset request when one is already pending:** Prevents duplicate pending requests for the same Admin with `409 Conflict`.
4. **Impersonation session security boundary:** Impersonated tokens cannot invoke Super Admin governance endpoints (`/api/admin/access-requests/approve`, `/api/admin/users/:id/disable`, `/api/auth/ownership-transfers`).
5. **Session revocation on disable:** Active JWTs issued prior to disabling an account are immediately rejected via `token_version` invalidation on subsequent requests.

---

## Database Schema & Migration Changes

### `server/src/db/authSchemaMigration.ts`

1. **Enhance `admin_access_requests` table:**
   - Add `reason TEXT` (applicant's optional reason for requesting access).
   - Add `setup_token_hash TEXT` (SHA-256 hash of single-use account setup token).
   - Add `setup_token_expires_at TEXT` (ISO 8601 timestamp, 48 hours).
2. **Create `admin_password_resets` table:**
   ```sql
   CREATE TABLE IF NOT EXISTS admin_password_resets (
     id TEXT PRIMARY KEY,
     admin_id TEXT NOT NULL,
     admin_email TEXT NOT NULL,
     admin_username TEXT NOT NULL,
     reason TEXT,
     status TEXT NOT NULL DEFAULT 'PENDING'
       CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'EXPIRED')),
     reset_token_hash TEXT,
     expires_at TEXT,
     created_at TEXT NOT NULL,
     reviewed_at TEXT,
     reviewed_by TEXT,
     completed_at TEXT,
     FOREIGN KEY(admin_id) REFERENCES users(id) ON DELETE CASCADE
   );
   CREATE INDEX IF NOT EXISTS idx_admin_password_resets_status
   ON admin_password_resets(status, created_at DESC);
   ```
3. **Enhance `users` table:**
   - Add `account_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(account_status IN ('ACTIVE', 'DISABLED', 'REMOVED'))`.
   - Add `disabled_reason TEXT`.
   - Add `disabled_at TEXT`.
   - Add `last_login_at TEXT`.
   - Add `token_version INTEGER NOT NULL DEFAULT 1`.

---

## Task Decomposition

### Task 1: Database Schema Migrations & Repositories
**Files:**
- Modify: `server/src/db/authSchemaMigration.ts`
- Modify: `server/src/db/adminAccessRequestRepository.ts`
- Create: `server/src/db/passwordResetRepository.ts`
- Modify: `server/src/db/repository.ts`
- Modify: `server/src/types/index.ts`

- [x] **Step 1: Backup database file `server/data/digiverse.db` to `server/data/digiverse.db.admin_bak`**
- [x] **Step 2: Update schema migrations in `authSchemaMigration.ts`**
  - Add `reason`, `setup_token_hash`, and `setup_token_expires_at` to `admin_access_requests`.
  - Create table `admin_password_resets`.
  - Add `account_status`, `disabled_reason`, `disabled_at`, `last_login_at`, `token_version` to `users`.
- [x] **Step 3: Update `adminAccessRequestRepository.ts`**
  - Add `reason`, `setupTokenHash`, `setupTokenExpiresAt` to interface.
  - Implement `approveWithSetupToken(id, tokenHash, expiresAt, reviewedBy)`.
  - Implement `consumeSetupToken(tokenHash, createdUserId)`.
- [x] **Step 4: Create `passwordResetRepository.ts`**
  - Implement `create`, `list`, `getById`, `getByTokenHash`, `review`, `markCompleted`, `hasPendingRequest`.
- [x] **Step 5: Update `repository.ts`**
  - Implement `disableUser`, `enableUser`, `removeUser`, `incrementTokenVersion`, `updateLastLogin`, `getUserProfile`.
- [x] **Step 6: Build server to verify compilation**
  Run: `cmd /c "npm --prefix server run build"`

---

### Task 2: Backend API Routes & Authentication Middleware
**Files:**
- Modify: `server/src/middleware/auth.ts`
- Modify: `server/src/routes/auth.ts`
- Modify: `server/src/routes/adminUsers.ts`
- Create: `server/src/services/emailService.ts`

- [x] **Step 1: Create `server/src/services/emailService.ts`**
  - Implement `notifySuperAdminNewAccessRequest(name, email, reason)`.
  - Implement `sendAdminSetupLink(email, name, setupLink)`.
  - Implement `sendPasswordResetLink(email, username, resetLink)`.
  - Implement `notifyRequestRejection(email, type, reason)`.
  - Log transparent status without claiming delivery when SMTP is unconfigured.
- [x] **Step 2: Update `server/src/middleware/auth.ts`**
  - Verify `token_version` against DB user. If token version < DB token version, reject 401.
  - Verify `account_status`. If not `ACTIVE`, reject 403.
  - Attach `req.isImpersonated` and `req.impersonatedBy`. Block Super Admin routes if `isImpersonated === true`.
- [x] **Step 3: Update `server/src/routes/auth.ts`**
  - In `POST /login`: update `last_login_at`. Block if `account_status !== 'ACTIVE'`.
- [x] **Step 4: Update `server/src/routes/adminUsers.ts`**
  - Add `POST /access-requests` with optional `reason` and email alert.
  - Add `POST /access-requests/:id/approve` generating setup token hash and setup link.
  - Add `POST /access-requests/:id/reject`.
  - Add `POST /access-requests/complete` consuming setup token and letting Admin create password.
  - Add Password Reset routes: `/password-resets/request`, `GET /password-resets`, `POST /password-resets/:id/approve`, `POST /password-resets/:id/reject`, `POST /password-resets/complete`.
  - Add Account Lifecycle routes: `GET /users/:id/profile`, `POST /users/:id/disable`, `POST /users/:id/enable`, `POST /users/:id/remove`, `POST /users/:id/revoke-sessions`.
  - Add Impersonation routes: `POST /users/:id/impersonate` and `POST /impersonate/exit`.
  - Remove direct Admin creation with password parameter (`POST /users`), replacing with invite trigger.
- [x] **Step 5: Build server and verify compilation**
  Run: `cmd /c "npm --prefix server run build"`

---

### Task 3: Comprehensive Automated Tests
**Files:**
- Create: `server/test/adminAuthGovernance.test.ts`

- [x] **Step 1: Write integration tests covering:**
  1. Admin Access Request submission with optional reason.
  2. Super Admin views access requests inbox.
  3. Super Admin approves request -> verifies setup token hash stored, 48h expiry.
  4. Applicant completes account setup -> sets custom username & password (>=12 chars).
  5. Admin login with new credentials succeeds.
  6. Super Admin disables Admin account -> active session immediately rejected, new login blocked, client projects intact.
  7. Super Admin re-enables Admin account -> login succeeds again with original credentials.
  8. Super Admin removes Admin account -> marked REMOVED, login blocked, client projects intact.
  9. Admin password reset request flow -> Super Admin approval -> Admin resets password -> old sessions invalidated.
  10. Secure impersonation ("Login as Admin") -> Super Admin re-auth, short-lived session, audit trail, exit.
  11. RBAC isolation -> Admin cannot approve requests or access Super Admin routes.
  12. Zero Passkey / WebAuthn / OTP requirements.
- [x] **Step 2: Run automated test suite**
  Run: `cmd /c "npm --prefix server run test"`
  Expected: All existing test suites pass + new `adminAuthGovernance.test.ts` passes 100%.

---

### Task 4: Frontend Integration — Staff Login, Modals & Requests
**Files:**
- Modify: `client/src/lib/api.ts`
- Modify: `client/src/types/admin.ts`
- Modify: `client/src/components/admin/AdminLoginModal.tsx`

- [x] **Step 1: Update `client/src/lib/api.ts` and `client/src/types/admin.ts`**
  - Add types: `AdminAccessRequest`, `AdminPasswordReset`, `AdminUserProfile`, `ImpersonationState`.
  - Add API client methods for all new endpoints.
- [x] **Step 2: Refactor `client/src/components/admin/AdminLoginModal.tsx`**
  - Ensure Admin Login has strictly TWO fields: Username and Password.
  - Provide "Request Admin Access" option with Full Name, Gmail, and Optional Reason inputs.
  - Provide "Forgot Password / Request Password Change" option with Username/Email and Reason inputs.
  - Implement Account Setup screen via setup token (Admin chooses username and password).
  - Implement Password Reset screen via reset token (Admin chooses new password).
  - Verify zero Passkey, Windows Hello, WebAuthn, or OTP controls.
- [x] **Step 3: Test client build**
  Run: `cmd /c "npm --prefix client run build"`

---

### Task 5: Frontend Integration — Super Admin & Admin Dashboards
**Files:**
- Modify: `client/src/components/admin/SuperAdminDashboard.tsx`
- Modify: `client/src/components/admin/AdminDashboard.tsx`
- Create: `client/src/components/admin/AdminProfileModal.tsx`

- [x] **Step 1: Create `client/src/components/admin/AdminProfileModal.tsx`**
  - Detailed modal displaying Full Name, Email, Username, Creation Date, Status (`ACTIVE`, `DISABLED`, `REMOVED`), Last Login, Assigned Projects, Recent Activity, Audit History.
  - Actions: Disable (with reason dialog), Enable, Remove (with confirmation dialog), Revoke All Sessions, Login as Admin (with Super Admin password confirmation).
- [x] **Step 2: Update `client/src/components/admin/SuperAdminDashboard.tsx`**
  - Add Navigation Tabs:
    1. Platform Telemetry & Overview
    2. Admin Accounts (with profile modal trigger and quick action controls)
    3. Admin Access Requests Inbox (pending requests, review details, Approve with setup link, Reject)
    4. Password Reset Requests Inbox (pending requests, review details, Approve with reset link, Reject)
    5. Audit Trail
  - Integrate `AdminProfileModal`.
- [x] **Step 3: Update `client/src/components/admin/AdminDashboard.tsx`**
  - Fix role badge to say `ADMIN` / `INTERNAL OPERATOR`.
  - Add Impersonation Banner at top when `isImpersonated === true`:
    *"You are viewing this account as Super Admin. [Admin Name]"* with *"Exit Admin View"* button.
  - Add "Request Password Change" button in operator controls.
- [x] **Step 4: Build client and verify zero compilation errors**
  Run: `cmd /c "npm --prefix client run build"`

---

### Task 6: Final End-to-End Verification & Walkthrough Report
**Files:**
- Create: `<Artifact Directory>/admin_auth_governance_final_report.md`
- Create: `<Artifact Directory>/walkthrough.md`

- [x] **Step 1: Execute all backend tests and verify 100% pass rate**
- [x] **Step 2: Verify database integrity and client projects preservation**
- [x] **Step 3: Verify Super Admin bootstrap and governance remain 100% intact**
- [x] **Step 4: Generate detailed delivery report**
