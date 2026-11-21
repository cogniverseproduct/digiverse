# SQLite -> PostgreSQL migration runbook (with rollback)

**Nothing in this runbook has been run against a real PostgreSQL database.** Only the rehearsal (disposable
in-memory PGlite) has been run. Do the real migration only after you decide to, on a fresh, empty database.

## What the tool guarantees

`server/scripts/lib/sqliteToPostgres.ts` (CLI: `migrate-sqlite-to-postgres.ts`, rehearsal:
`verify-migration.local.ts`):

1. The original `digiverse.db`, `-wal`, `-shm` are only read. They are copied consistently (retrying if a writer
   changes them mid-copy), checkpointed into a **retained snapshot** `server/data/backups/digiverse-snapshot-<ts>.db`
   (`VACUUM INTO`, SHA-256 recorded), and all reading is from that snapshot opened read-only. SHA-256 of the originals
   is compared before/after and reported.
2. Every source table is classified. Tables that are not in `TABLES` are listed; one holding rows **blocks** the run
   (`--accept-unmanaged <name>` to override knowingly). `email_verification_otps` is documented as legacy and empty.
3. Pre-flight (nothing written if it fails): required columns present, no NUL characters, schema version not newer
   than the code.
4. A real run needs `DATABASE_URL` **and** `--confirm-target <host from that URL>`; the target must be empty unless
   `--allow-nonempty`; the copy is ONE transaction; existing rows are never overwritten.
5. Success = all checks pass, not row counts: per-table primary-key equality, per-row SHA-256 over all shared columns,
   relationship orphan counts equal to the source's, every index and unique/primary constraint present, every Super
   Admin identical (id, email, username, password hash, role, status, token_version, flags), exactly one platform
   owner with the same id, no second Super Admin, original files unchanged.
6. Reports (`server/data/backups/migration-report-*.json`) contain counts, keys and check names only - never values,
   hashes or secrets. Skipped (source-only) and defaulted (target-only) columns are listed per table.
7. Re-running is safe: with `--allow-nonempty`, identical rows are "alreadyPresent"; any row that differs in the
   target is reported as a mismatch (never silently kept or overwritten) and the run fails.

## Procedure

1. **Stop writers.** Stop the local dev server (`npm run dev`) so the WAL is quiescent. (The tool also works while it
   runs, but then it can take a moment-in-time snapshot only.)
2. **Rehearse** (disposable target, no cloud account):
   `cd server && npm run db:rehearse-migration` -> expect `"ok": true` and `N/N checks`. Read the report.
3. Decide about uploads: `npx tsx scripts/migrate-uploads-to-blob.ts` (report-only) lists the references to
   `/api/media/uploads/...` (currently 2 files, 2 projects). They 404 on Vercel unless uploaded to Blob.
4. Provision the managed PostgreSQL yourself (e.g. Neon) - an **empty** database, pooled connection string.
5. **Real run** (PowerShell):
   ```
   $env:DATABASE_URL="postgres://..."   # never commit or paste this into chat
   npx tsx scripts/migrate-sqlite-to-postgres.ts --confirm-target <host-from-the-url>
   ```
   Exit code 0 and "Migration verified." are required. Anything else: do not point the application at it.
6. Optional, after step 5 is verified: `BLOB_READ_WRITE_TOKEN=... npx tsx scripts/migrate-uploads-to-blob.ts --apply --confirm-target <host>`
   (uploads the referenced files to Blob and rewrites the references in the Postgres target only).
7. Set `DATABASE_URL` in the Vercel project, deploy, check `/api/health` and sign in as the Super Admin.
8. Keep `server/data/` (database, backups, snapshot) untouched until you are satisfied.

## Rollback and recovery

* **Source untouched**: SQLite remains the system of record until you switch. Rolling back = remove `DATABASE_URL`
  from the deployment (or redeploy the previous deployment with Vercel Instant Rollback) and keep using SQLite locally.
* **Failed/partial target**: the copy is a single transaction, so a failure leaves the target empty. If you need to
  start over, drop and recreate the *new, migration-only* database (or restore the provider's point-in-time/branch
  taken before step 5). Never "fix" the source.
* **Restore the SQLite side**: the retained snapshot `server/data/backups/digiverse-snapshot-<ts>.db` (SHA-256 in
  the report) is a complete consistent database; copy it back as `digiverse.db` (and delete stale `-wal/-shm`) with the
  server stopped. Older restore points: `digiverse.db.pre-*` files.
* **After go-live writes** happen only in Postgres; there is no automatic reverse sync. Use the provider's backups,
  and re-run the migration tool only into a *new* empty database.
* **Super Admin recovery** (if sign-in fails after the move): `npm run auth:recover-super-admin` (dry-run by default;
  `--apply` takes a backup before any change). See SUPER_ADMIN_ACCOUNTS.md.

## Known limits

* Pre-existing orphan rows (see DATABASE.md) are copied as they are.
* INTEGER columns become Postgres `integer` (32-bit); a larger value would abort the transaction loudly.
* The tool does not migrate files; see step 3/6 for uploads. Google Drive items are references only.
