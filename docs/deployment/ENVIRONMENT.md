# Environment variables

All server variables are read in `server/src` only and are never sent to the browser. Browser-visible
variables are exactly the four `VITE_*` names below and contain no secrets. **Never commit `.env`
files** (`.gitignore` blocks `.env`, `.env.*`, `*.env`; only `*.env.example` is committed). Never paste real
values into chat, tickets or logs.

## Production (Vercel -> Project -> Settings -> Environment Variables)

| Variable | Required | Secret | Notes |
|---|---|---|---|
| `JWT_SECRET` | **Yes** | Yes | >= 32 random characters (`openssl rand -hex 32`). Generate a NEW value for production. Boot logs a `[config]` error if missing/short. |
| `DATABASE_URL` | **Yes** | Yes | Managed Postgres, pooled string. Selects Postgres automatically. Do not set `DATABASE_DRIVER` in production. |
| `SETUP_KEY` | First run only | Yes | >= 24 chars; allows creating the first Super Admin remotely. **Remove it after setup.** (It re-opens setup if every Super Admin is ever disabled/removed.) |
| `BLOB_READ_WRITE_TOKEN` | For uploads | Yes | Added when a **public** Blob store is connected. Without it uploads are refused on Vercel. |
| `PUBLIC_APP_URL` | Recommended | No | Canonical origin (absolute media URLs in exported sites, CORS). Falls back to Vercel's production URL, which makes preview deployments point at production. |
| `SMTP_HOST` `SMTP_PORT` `SMTP_SECURE` `SMTP_USER` `SMTP_PASS` `MAIL_FROM` `MAIL_REPLY_TO` | To send mail | `SMTP_PASS`, `SMTP_USER` | Without SMTP nothing is sent; on Vercel the message body (with single-use links) is **not** logged. |
| `GOOGLE_DRIVE_API_KEY` / `GOOGLE_ACCESS_TOKEN` | Optional | Yes | Server-side Drive access. `GOOGLE_ACCESS_TOKEN` is short-lived; prefer the API key for a static deployment. |
| `VERCEL_ENABLED` `VERCEL_TOKEN` `VERCEL_TEAM_ID` `VERCEL_WEBHOOK_SECRET` | Only for real publishing | Token, webhook secret | Aliases `DIGIVERSE_VERCEL_*` exist. Publishing creates one Vercel project per client site. |
| `PLATFORM_PRIMARY_EMAIL` `PLATFORM_SECONDARY_EMAIL` | No | No | Contact identity; defaults built in. |
| `SITES_ROOT_DOMAIN` | Later | No | Subdomain publishing. |
| `CORS_ORIGINS` | No | No | Extra origins; same-origin needs nothing (localhost is always allowed). |
| `MAX_UPLOAD_MB` | No | No | Default 3 on Vercel. |
| `PG_POOL_MAX` | No | No | Default 3 on Vercel. |

Do **not** set on Vercel: `NODE_ENV` (breaks `npm ci`), `DATABASE_DRIVER`, `SQLITE_PATH`, `PGLITE_DATA_DIR`,
`PUBLISH_MOCK_MODE`, `UPLOADS_DIR`, `INDEX_HTML_PATH`, `TEST_API_URL`, `RECOVERY_NEW_PASSWORD`.

Build-time (browser, non-secret): `VITE_SITES_ROOT_DOMAIN`, `VITE_APP_HOSTNAMES`,
`VITE_DIGIVERSE_PRODUCT_EMAIL`, `VITE_DIGIVERSE_SECONDARY_EMAIL`. Anything prefixed `VITE_` is public.

## Local development (`server/.env`, git-ignored)

`PORT`, `JWT_SECRET`, optionally `SQLITE_PATH`, `PUBLISH_MOCK_MODE=true` (simulation only). Leave
`DATABASE_URL` empty to use `server/data/digiverse.db`.

## Findings about the existing local `server/.env`

* It was **not** modified or deleted. It is git-ignored and was never committed.
* It contains `ADMIN_EMAIL/ADMIN_PASSWORD/SUPER_ADMIN_EMAIL/SUPER_ADMIN_PASSWORD` (and empty `VERCEL_*`). **No code
  reads those four variables**, and their values are the same as the fixture credentials committed in `server/test/**`.
  Treat them as known/compromised: delete them from the file yourself, never reuse them for a real account.
* Its `JWT_SECRET` is a low-entropy phrase: use a fresh random value in production (and rotate the local one).
* **Rotation checklist** (you do this; I did not rotate anything): new production `JWT_SECRET` (existing tokens then
  expire - acceptable); new passwords for any real account that ever used the fixture passwords; revoke/replace any
  Vercel, Blob, Google or SMTP credential that was ever shared in an archive.
* Git: `server/data/email-migration-*.journal.json` was committed (account ids and old/new email addresses) and
  pushed. It is now untracked and ignored, but it remains in git history; purging needs a history rewrite and a
  force-push, which was **not** done (your decision). The retired personal address also appears in a few source/test/doc
  files.
