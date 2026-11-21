# DigiVerse database: inventory, schema report and integrity findings

Audit date: 2026-11-21. Live data was inspected only through copies (never opened in place).
Counts below are from a copy taken 2026-11-21 13:35 IST while the local dev server was running.

## 1. Architecture (one schema, three engines)

| Environment | Engine | Selected by |
|---|---|---|
| Local development | SQLite (`node:sqlite`, WAL) at `server/data/digiverse.db` | no `DATABASE_URL` |
| Automated tests | PGlite (in-memory Postgres) and temp SQLite files | tests set `DATABASE_DRIVER` |
| Production / Vercel | ONE managed PostgreSQL (e.g. Neon) | `DATABASE_URL` |

Single definition: `TABLES` + `INDEXES` in `server/src/db/schema.ts` (REAL becomes DOUBLE PRECISION on
Postgres). Repository code (`repository.ts` and friends) talks to the `Database` abstraction in
`driver.ts` with `?` placeholders for both dialects.

Guards (config.ts / driver.ts): SQLite is refused on Vercel; an unknown `DATABASE_DRIVER` is an error;
`DATABASE_DRIVER=sqlite` next to a `DATABASE_URL` in production is an error; PGlite is refused on Vercel
production/preview deployments; `/api/health` reports only the engine family.

## 2. Authoritative file inventory (`server/data/`)

| File | Class | Schema | Content | Action |
|---|---|---|---|---|
| `digiverse.db` + `digiverse.db-wal` + `digiverse.db-shm` | **REAL, authoritative** (must be copied/migrated as a set; main file alone is stale: 1 user vs 4) | v5 | 4 users, 41 projects, 23 tenants, 104 audit logs, 32 commercial records, 622 drive items, 61 YouTube videos, 14 preview tokens | Never delete/reset. Migrate from a snapshot, not in place. |
| `digiverse.db.admin_bak` | backup (2026-11-03, before admin-governance) | none | 1 user, 5 projects | keep |
| `digiverse.db.bak` | backup (2026-11-03) - **test-polluted**: 59 users, 678 projects, 671 tenants | none | pre-test-isolation data | keep; do not migrate |
| `digiverse.db.pre-email-migration-...` | backup via `VACUUM INTO` (v3) | v3 | 4 users, 41 projects | keep (restore point) |
| `digiverse.db.pre-super-admin-mgmt-...` | backup via `VACUUM INTO` (v3) | v3 | 4 users, 41 projects | keep |
| `digiverse.db.pre-force-pw-change-...` | backup via `VACUUM INTO` (v4) | v4 | 4 users, 41 projects | keep |
| `email-migration-...journal.json` | rollback journal (PII: account ids/emails) | - | one email change | **untracked from git** (file kept on disk); history still contains it |
| `uploads/` | media | - | 36 files (~5 MB); 30 are 70-byte test stubs; **2 files are referenced** by 2 projects | see MIGRATION_RUNBOOK |
| `backups/` (new, created by the migration tool) | retained snapshots + reports | - | - | git-ignored |

No other `*.db`/`*.sqlite`/PGlite directories exist in the repository. Test databases are created in the
OS temp directory and removed; no test writes to `server/data` (verified in test helpers).

## 3. Schema discrepancy report

| Topic | Finding | Resolution |
|---|---|---|
| Table count | Database has 22 tables; `TABLES` has 21 | The extra table is `email_verification_otps` |
| `email_verification_otps` | Columns `id,email,otp_hash,purpose,expires_at,attempts,verified_at,consumed_at,created_at` + index. **0 rows in every database file including the oldest backups.** Zero references anywhere in source, tests, scripts or docs; the product states it has no OTP. Created by an earlier code version that is not in this repository. | **Decision: legacy/abandoned, not required.** Not added to the schema, **not migrated** to Postgres, **not dropped** from SQLite (no deletion without your approval). The migration tool lists it explicitly and **refuses to continue if it ever contains rows** (`--accept-unmanaged` is then required). |
| Version tracking | `schema_meta.schema_version = 5` (`PRAGMA user_version` unused, 0) | unchanged |
| Postgres upgrade gate | Initialisation returns early when stored version >= `SCHEMA_VERSION`, so a schema change without a bump never reaches Postgres | New test pins a fingerprint of `TABLES`+`INDEXES` to `SCHEMA_VERSION`; changing the schema now fails CI until the version is bumped |
| Postgres init | had no transaction/lock (concurrent cold starts could race) | now one transaction under `pg_advisory_xact_lock` |
| Duplicated DDL | `authSchemaMigration.ts` re-declared the users table (and had drifted) | now built from `TABLES` (passed in); no second copy |
| `tenants.organization_type` | NOT NULL in old SQLite files, nullable in `schema.ts`/Postgres | accepted: Postgres is a superset; the app always writes the value |
| `idx_users_username` | partial unique index duplicates the column UNIQUE | harmless, left as is |
| Late-added columns | `ALTER ADD COLUMN` drops PK/UNIQUE/NOT NULL-without-default | only relevant to upgrades of very old databases; fresh Postgres gets the full definition |

## 4. Super Admin and data integrity

The legacy users-table rebuild (`authSchemaMigration.ts`) previously dropped `is_platform_owner`,
`must_change_password`, `token_version`, `last_login_at`, `disabled_reason/at` and turned REMOVED into
DISABLED. It was latent (the live database does not trigger it: email is nullable and `username` exists).
It is now column-driven: every column present in both tables is copied verbatim, the copy is verified
inside the transaction (row count, and per-row equality of identity/security columns) and rolled back on
any difference. Four tests cover it.

Verified on the rehearsal copy: exactly **one** platform owner, same id/email/username/password hash/role/
status/token_version/flags in the target; no second Super Admin; `audit_logs` byte-identical; no
`must_change_password` rows.

### Pre-existing data issues (reported, not changed)

| Relationship | Orphans in the live data |
|---|---|
| `projects.tenant_slug` -> `tenants.slug` | 9 projects |
| `media_sources.project_id` -> `projects.id` | 51 rows |
| `drive_media_items.project_id` -> `projects.id` | 602 rows (of 622) |
| `youtube_videos.project_id` -> `projects.id` | 56 rows |
| `project_requirements` rows | 25 for 41 projects (sync errors are swallowed at `repository.ts:198-200`) |

These look like leftovers from deleted/test projects and seeded mock Drive items (`drv_*` ids). They are
migrated as they are and the verifier proves the target has the **same** orphan counts. Clean-up is a
product decision for you; nothing was deleted.

## 5. Migration rehearsal result (disposable PGlite target, copy of the live set)

Run with `npm run db:rehearse-migration -- --source <copy> --backup-dir <dir>`: **165/165 checks
passed** - 20 tables, per-row SHA-256 equal for every table, primary keys equal, relationship orphan counts
equal, all 12 indexes and every unique/primary constraint present, Super Admin/owner identity equal,
source files' SHA-256 unchanged, repository read-back (41 projects, 23 tenants, 4 users, 43 revisions).
Not run against any real PostgreSQL.
