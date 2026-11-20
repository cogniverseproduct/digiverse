# DigiVerse email identity: runbook

Official addresses:

| Role | Address | Used for |
|---|---|---|
| Primary | `contact@cogniverse.co.in` | public contact, first-run Super Admin identity (new installs), owner notifications, default sender and reply-to |
| Secondary | `mrk@cogniverse.co.in` | public contact, copied on owner notifications |

The old address `cogniverse.digiverse@gmail.com` is retired. **Both new addresses are contact
addresses only.** Configuring or accepting an address never creates an account or grants a role.
Roles come only from the Super Admin (invite / access-request approval). `mrk@cogniverse.co.in`
belongs to no account today; no account was created for it.

## 1. Migrate the existing Super Admin account (once per database)

A database created before this change still stores the Super Admin's email as the old Gmail.
Until you migrate, that account keeps working (login by username, or by the old email). After
migrating, login is by username or `contact@cogniverse.co.in`; the old email stops resolving.

```powershell
cd server
# 1. Dry run: prints what would change, changes nothing.
npm run db:migrate-email
# 2. Apply: takes a consistent backup, migrates in one transaction, verifies.
#    The dev server may keep running (the backup uses SQLite VACUUM INTO).
npm run db:migrate-email -- --apply
# 3. Log in with the username or contact@cogniverse.co.in and your existing password.
```

What `--apply` does (all or nothing):

- changes the Super Admin's `users.email` to the new primary address, and **nothing else**;
- leaves audit logs and every other historical record exactly as written (add
  `--rewrite-history` only if you also want the old address rewritten inside
  `audit_logs`, `admin_access_requests`, `admin_password_resets` and `ownership_transfers`);
- never changes account ids, password hashes, roles, status, token versions, ownership or
  project links, so passwords and existing sessions keep working;
- refuses to run if the old address is not held by exactly one Super Admin, or if the new
  address already belongs to any account;
- writes a backup `server/data/digiverse.db.pre-email-migration-<timestamp>` and a journal
  `server/data/email-migration-<timestamp>.journal.json`, then verifies that every account is
  identical except email.

Undo:

```powershell
npm run db:migrate-email -- --rollback data\email-migration-<timestamp>.journal.json
```

Rollback restores the exact old values. It skips (and reports) any row edited after the
migration, and will not hand the old address to a second account.

Options: `--db <path>` (use another SQLite file, e.g. a copy), `--from`, `--to`. On Postgres
(Vercel/Neon) no file backup is possible from the script: take a database backup or Neon branch
first; the journal still allows `--rollback`. Run it against production with `DATABASE_URL` set.

New installs need no migration: first-run setup creates the Super Admin (see section 4).

## 4. First-time Super Admin setup and recovery

**When the setup page appears.** Choosing "Super Admin" in the staff portal checks the server.
If there is no usable Super Admin (role `SUPER_ADMIN`, status ACTIVE, enabled, has a password),
the First-Time Setup page opens by itself: name, email (pre-filled `contact@cogniverse.co.in`,
any valid address is accepted), username, password (12+ characters) and confirmation.
Otherwise only the normal login is shown, with no way to create a Super Admin.

**Who may submit it.** Only a request from the same machine as the server, or a request that
carries the correct `SETUP_KEY` (production). On Vercel nothing counts as "local", so
`SETUP_KEY` is mandatory there; repeated wrong keys are rate-limited (429). The email
address never grants anything: authority comes from that gate alone.

**Guarantees.** No default or hardcoded password exists. The check and the insert run in one
transaction (Postgres also takes an advisory lock), so parallel requests create exactly one
Super Admin. Once one exists the endpoint answers 403 permanently; a restart cannot reopen it
because the state is read from the database. Setup never overwrites or deletes an existing
account: a colliding email or username gets 409.

**If the Super Admin exists but cannot sign in** (wrong or forgotten password, disabled
account, old email). Setup stays closed on purpose; do not create a second owner. On the server:

```powershell
cd server
npm run auth:recover-super-admin                          # diagnose only, changes nothing
npm run auth:recover-super-admin -- --reset-password --apply   # hidden prompt for the new password
npm run auth:recover-super-admin -- --reactivate --apply       # re-enable a disabled/removed owner
npm run auth:recover-super-admin -- --set-email contact@cogniverse.co.in --apply
npm run auth:recover-super-admin -- --make-owner --user <username|email> --apply   # restore Product Owner access (see SUPER_ADMIN_ACCOUNTS.md)
npm run auth:recover-super-admin -- --rollback data\super-admin-recovery-<timestamp>.journal.json
```

Options can be combined; `--user <username|email>` picks the account if several exist. It
repairs an existing Super Admin only (never creates accounts, never touches Admins), takes a
backup first, bumps `token_version` on a password reset (so old sessions stop working), and
records an audit entry. The password is never printed or stored in plaintext; for scripts set
`RECOVERY_NEW_PASSWORD`. The journal holds the previous password hash: keep it private.
On Postgres run it with `DATABASE_URL` set, after taking a backup/branch.
If the server has no Super Admin at all, use the setup page instead (the tool will say so).

## 2. Notification email (SMTP)

DigiVerse does not assume the mailboxes already exist. Without SMTP it only logs messages
(status `SIMULATED_NO_SMTP`). Variables, all in `server/.env` (see `server/.env.example`):

| Variable | Purpose |
|---|---|
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | all three required to enable sending |
| `SMTP_PORT` (default 587), `SMTP_SECURE` (default true only for port 465) | connection |
| `MAIL_FROM`, `MAIL_REPLY_TO` | default to `PLATFORM_PRIMARY_EMAIL`; many providers require a verified sender |
| `PLATFORM_PRIMARY_EMAIL`, `PLATFORM_SECONDARY_EMAIL` | override the official addresses |

Statuses: `SENT` only after the SMTP server accepted the message (not proof it was read);
`FAILED` if it did not (never breaks the request); `SIMULATED_NO_SMTP` when not configured.
Owner alerts (new Admin access request) go to the primary address with the secondary copied.
Setup and reset links are also shown to the Super Admin in the dashboard.

Client build variables (public, not secret): `VITE_DIGIVERSE_PRODUCT_EMAIL`,
`VITE_DIGIVERSE_SECONDARY_EMAIL`.

## 3. Email validation

One rule everywhere (`server/src/utils/email.ts`, mirrored in `client/src/lib/email.ts`):
syntax only, any provider or domain (`.co.in`, `.com`, `.org`, `.net`, Gmail, Outlook, custom
domains). It is applied to Admin access requests, Super Admin invites, ownership transfer, the
login-modal and dashboard forms, and the data layer (`repository.createUser`, access-request
repository). Duplicate emails are refused case-insensitively.
