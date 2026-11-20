# Super Admin Account Management

Where: Super Admin Dashboard → sidebar section **Super Admin Account Management**
(View Super Admins, Create Super Admin, Transfer ownership). Code: `server/src/routes/superAdmins.ts`
(HTTP), `server/src/db/superAdminAccounts.ts` (all rules, in transactions), `client/src/components/workspace/SuperAdminAccountsPanel.tsx` (UI).

## Model

- Any number of **Super Admins** may exist. Exactly one of them is the **Product Owner** (`users.is_platform_owner = 1`).
- The first account created by the one-time first-run setup is the Product Owner. Existing databases get one automatically
  (the earliest active Super Admin) the first time the server starts after upgrading. The step is idempotent.
- The first-run setup page is unchanged and still the only way to create a Super Admin on an *uninitialized* installation.
  After that, this module is the normal way to create and manage Super Admins. There is no public registration.

| Action | Any active Super Admin | Product Owner only |
|---|---|---|
| View Super Admins, create a Super Admin | yes | |
| Edit details / change password / deactivate / revoke **another non-owner** Super Admin | yes | |
| Edit details / change password of **the owner account** | no (403) | yes (own account) |
| Deactivate or revoke the owner or yourself | no | no (transfer ownership first / ask a peer) |
| Start or cancel an ownership transfer | | yes |
| Accept or decline a transfer | the invited Super Admin only | |

Ordinary Admins and customers get 401/403 on every route. Roles are read from the database on each request (never from the
client or the token), and impersonated "Admin view" sessions are refused.

## Safeguards (enforced in the backend)

- **Fresh re-authentication**: every mutation needs the acting Super Admin's current password in `currentPassword`
  (checked with bcrypt). 5 wrong attempts in 15 minutes lock further confirmations for that account (429).
- **Last active Super Admin** can never be deactivated or revoked; checked inside a transaction (Postgres also takes an advisory lock).
- **Confirmation phrases**: `REVOKE SUPER ADMIN` for revoke, `TRANSFER OWNERSHIP` for transfers.
- **No silent promotion or overwrite**: creating with an email/username that already exists (case-insensitive, any account) returns 409.
- **Email**: syntax validation only (any provider or domain). The retired `cogniverse.digiverse@gmail.com` is refused. Domain never grants rights.
- **Passwords**: 12+ characters, at most 72 bytes (the bcrypt limit), bcrypt cost 12, never returned or logged.
- **Email changes** write only `name/email/username/updated_at`: the user id, password hash, role, status and audit history are untouched.
- **Password change / deactivation / revoke / demotion** bump `token_version`, signing that account out everywhere. Changing your own password returns a fresh token so you stay signed in.
- **Audit log**: `SUPER_ADMIN_CREATED`, `SUPER_ADMIN_DETAILS_UPDATED`, `SUPER_ADMIN_PASSWORD_CHANGED`, `SUPER_ADMIN_DEACTIVATED`,
  `SUPER_ADMIN_ACTIVATED`, `SUPER_ADMIN_ACCESS_REVOKED`, `SUPER_ADMIN_REAUTH_FAILED`, `OWNERSHIP_TRANSFER_INITIATED / ACCEPTED / CANCELLED / DECLINED`.
- *Deactivate* = cannot sign in, can be reactivated, keeps the Super Admin role. *Revoke* = becomes an ordinary Admin (a username is derived if missing); data and history are kept.

## Ownership transfer

1. The owner starts it (password + phrase), choosing an **existing active Super Admin** or **a new account** (created as an ordinary
   Super Admin with a **temporary password** the owner shares privately; see "Forced password change" below) and what happens to the former owner: **stay Super Admin (default)** or become an Admin.
2. Nothing changes yet. The invited Super Admin signs in with their own account, sees the request (sidebar badge) and accepts with their password.
   The initiator cannot accept for them. It expires after 48 hours; the owner can cancel, the invitee can decline.
3. Acceptance moves the owner flag atomically (and demotes the former owner only if chosen). Only one transfer can be pending.
   It is cancelled automatically if the invitee is deactivated or revoked, or if the owner changed.

### Forced password change (accounts created by Create Super Admin or by a transfer)

Whoever creates the account chooses its password, so they know it. Every account made through **Create Super Admin** or through an
ownership transfer to a new account is therefore flagged `users.must_change_password = 1`, and the person must replace the password before anything else works:

- Sign-in succeeds and the login response carries `user.mustChangePassword: true`. The app shows a "Choose your own password"
  screen instead of the dashboard (also after a page reload; the state comes from the server).
- **The server enforces it, not the screen.** While the flag is set every authenticated request returns `403` with
  `code: "PASSWORD_CHANGE_REQUIRED"`, except `GET /api/auth/me` and `POST /api/auth/change-password`. That includes accepting the transfer,
  so a transfer invitation can only be accepted with a password the owner never knew.
- `POST /api/auth/change-password` needs the temporary password, a new one of 12+ characters that is confirmed and **different from the temporary one**.
  It clears the flag, signs every old session out, returns a fresh `token` (so the person stays signed in), and logs `FORCED_PASSWORD_CHANGED` (never the password).
- The owner's account list shows a "Must set own password" badge until it is done (`mustChangePassword` in `GET /api/super-admins`).
- Only newly created accounts are flagged. Existing accounts and passwords reset by a peer are unchanged (a peer reset does not set or clear the flag; changing your own password clears it). `change-password` now also returns a fresh token for ordinary changes, so changing your own password no longer ends your session.

**Recovery from a mistaken transfer or lost access.** By default the former owner stays a Super Admin, so nobody is locked out.
Whoever controls the server can always restore ownership:

```powershell
cd server
npm run auth:recover-super-admin -- --make-owner --user <username-or-email> --apply   # promotes, reactivates, becomes owner
npm run auth:recover-super-admin -- --rollback data\super-admin-recovery-<timestamp>.journal.json
```

It takes a backup and writes a journal first, and removes the owner flag from everyone else. See `EMAIL_IDENTITY_MIGRATION.md` section 4 for the other recovery options.
The old token-link transfer endpoints (`/api/auth/transfer-ownership/*`) were retired and answer 410.

## API (all under `/api/super-admins`, all require `Authorization: Bearer <token>` of an active Super Admin)

| Method and path | Body | Result |
|---|---|---|
| `GET /` | | `accounts[]` (id, name, username, email, accountStatus, isActive, isOwner, isSelf, lastLoginAt, createdAt, disabledReason), `summary {total, active, ownerId}`, `transfer`, `transferRole` (OWNER, TARGET, OBSERVER), `you` |
| `POST /` | `name, email, username?, password (temporary), confirmPassword, status (ACTIVE or DISABLED), currentPassword` | 201 `account` (`mustChangePassword: true`) |
| `PATCH /:id` | `name?, email?, username?, currentPassword` | `account` (400 if nothing changes) |
| `POST /:id/password` | `newPassword, confirmPassword, currentPassword` | `account`, plus `token` when changing your own |
| `POST /:id/status` | `status (ACTIVE or DISABLED), reason?, currentPassword` | `account` |
| `POST /:id/revoke` | `confirmationPhrase, currentPassword` | `account {id, email, username, role: ADMIN}` |
| `POST /transfer` | `targetUserId` **or** `newAccount {name,email,username?,password,confirmPassword}`, `formerOwnerAccess (KEEP_SUPER_ADMIN or DEMOTE_TO_ADMIN)`, `confirmationPhrase, currentPassword` | 201 `transfer` |
| `POST /transfer/accept` | `transferId, currentPassword` | 200 |
| `POST /transfer/cancel` | | 200 (owner cancels or invitee declines) |

Errors: `{ error, code? }` with 400 validation, 401 missing/invalid token or wrong password, 403 not a Super Admin / owner-protected / not the invitee,
404 unknown account or transfer, 409 conflict (duplicate identity, last Super Admin, self action, pending transfer), 410 expired, 429 too many wrong passwords.

## Database changes (schema version 3 → 5, additive, applied automatically at startup)

- `users.is_platform_owner INTEGER NOT NULL DEFAULT 0` plus the idempotent backfill described above.
- `ownership_transfers.target_user_id TEXT` and `ownership_transfers.former_owner_access TEXT NOT NULL DEFAULT 'KEEP_SUPER_ADMIN'`.
- Version 4 to 5: `users.must_change_password INTEGER NOT NULL DEFAULT 0` (existing accounts stay 0, so nobody is affected by the upgrade).
- No data is deleted or rewritten. Take a backup before upgrading a production database, as for any release.
