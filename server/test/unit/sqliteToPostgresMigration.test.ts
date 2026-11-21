/**
 * SQLite -> Postgres migration engine, rehearsed against a disposable in-memory PGlite target using a
 * throwaway SQLite source. Never touches server/data and never needs a cloud database.
 */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'digiverse-migtest-'));
const sourceFile = path.join(tempDir, 'source.db');
const backupDir = path.join(tempDir, 'backups');

process.env.NODE_ENV = 'test';
delete process.env.VERCEL;
delete process.env.VERCEL_ENV;

const sha = (file: string) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

async function runner() {
  return (await import('../../scripts/lib/sqliteToPostgres.js')).runMigration;
}

before(async () => {
  // Build a realistic source with the application's own schema code, then seed it.
  process.env.DATABASE_DRIVER = 'sqlite';
  process.env.SQLITE_PATH = sourceFile;
  delete process.env.DATABASE_URL;
  const { closeDb, getDb } = await import('../../src/db/database.js');
  await closeDb();
  const db = await getDb();

  await db.run(
    `INSERT INTO users (id, email, username, password_hash, name, role, account_status, token_version, is_platform_owner, must_change_password, last_login_at, created_at, updated_at)
     VALUES ('u-owner', 'owner@example.test', 'owner', 'bcrypt-hash-owner', 'Owner', 'SUPER_ADMIN', 'ACTIVE', 3, 1, 1, '2026-03-01T00:00:00Z', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
            ('u-admin', 'admin@example.test', 'admin', 'bcrypt-hash-admin', 'Admin', 'ADMIN', 'ACTIVE', 1, 0, 0, NULL, '2026-01-02T00:00:00Z', '2026-01-02T00:00:00Z'),
            ('u-gone', NULL, NULL, 'bcrypt-hash-gone', 'Gone', 'ADMIN', 'REMOVED', 2, 0, 0, NULL, '2026-01-03T00:00:00Z', '2026-01-03T00:00:00Z')`
  );
  await db.run(
    `INSERT INTO audit_logs (id, user_id, user_email, user_role, action, resource_type, resource_id, details_json, created_at)
     VALUES ('a1', 'u-owner', 'owner@example.test', 'SUPER_ADMIN', 'LOGIN', 'user', 'u-owner', '{"note":"ünïcode ✓"}', '2026-03-01T00:00:00Z')`
  );
  await db.run(
    `INSERT INTO tenants (id, slug, name, organization_type, category, created_at, updated_at)
     VALUES ('t1', 'demo-org', 'Demo Org', 'cultural', 'cultural', '2026-01-04T00:00:00Z', '2026-01-04T00:00:00Z')`
  );
  await db.run(
    `INSERT INTO projects (id, tenant_id, tenant_slug, title, status, requirements_json, created_at, updated_at)
     VALUES ('p1', 't1', 'demo-org', 'Main', 'DRAFT', '{"logoUrl":"/api/media/uploads/x.png"}', '2026-01-05T00:00:00Z', '2026-01-05T00:00:00Z'),
            ('p-orphan', 't-missing', 'ghost-org', 'Ghost', 'DRAFT', '{}', '2026-01-06T00:00:00Z', '2026-01-06T00:00:00Z')`
  );
  await closeDb();

  // The abandoned legacy table that exists in real historical databases.
  const raw = new DatabaseSync(sourceFile);
  raw.exec(`CREATE TABLE email_verification_otps (id TEXT PRIMARY KEY, email TEXT, otp_hash TEXT, purpose TEXT,
            expires_at TEXT, attempts INTEGER, verified_at TEXT, consumed_at TEXT, created_at TEXT);`);
  raw.close();
});

after(async () => {
  const { closeDb } = await import('../../src/db/database.js');
  await closeDb();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('SQLite -> Postgres migration engine', () => {
  test('rehearsal verifies keys, row contents, relationships, indexes and owner; source files are untouched', async () => {
    const runMigration = await runner();
    const before = sha(sourceFile);

    const report = await runMigration({ source: sourceFile, dryRun: true, backupDir });

    const failed = report.checks.filter((c) => !c.ok);
    assert.deepEqual(failed, [], `failed checks: ${JSON.stringify(failed)}`);
    assert.equal(report.ok, true);
    assert.equal(report.mode, 'rehearsal');
    assert.match(report.target, /PGlite/);
    assert.equal(report.source.unchanged, true);
    assert.equal(sha(sourceFile), before, 'original source database must not be modified');

    // A retained, hashed snapshot and a report exist.
    assert.ok(fs.existsSync(report.source.snapshotPath));
    assert.equal(sha(report.source.snapshotPath), report.source.snapshotSha256);
    assert.ok(report.reportPath && fs.existsSync(report.reportPath));

    const users = report.tables.find((t) => t.table === 'users')!;
    assert.equal(users.sourceRows, 3);
    assert.equal(users.targetRowsAfter, 3);
    assert.equal(users.mismatchedRows, 0);
    assert.equal(users.missingPrimaryKeys, 0);

    // Legacy table is reported, empty, and deliberately not migrated.
    const legacy = report.unmanagedTables.find((t) => t.table === 'email_verification_otps')!;
    assert.equal(legacy.rows, 0);
    assert.match(legacy.decision, /not migrated/);

    // Pre-existing source data problems are reported, not hidden or "fixed".
    const orphanCheck = report.checks.find((c) => c.name.startsWith('relationship projects.tenant_id'))!;
    assert.match(orphanCheck.detail ?? '', /source orphans=1 target orphans=1/);

    // The report must never contain values: no password hashes, emails or JSON payloads.
    const text = fs.readFileSync(report.reportPath!, 'utf8');
    assert.ok(!text.includes('bcrypt-hash'));
    assert.ok(!text.includes('owner@example.test'));
  });

  test('an unmanaged table that holds rows blocks the migration until the operator accepts it', async () => {
    const runMigration = await runner();
    const raw = new DatabaseSync(sourceFile);
    raw.exec("INSERT INTO email_verification_otps (id, email, created_at) VALUES ('o1', 'x@example.test', '2026-01-01')");
    raw.close();

    const blocked = await runMigration({ source: sourceFile, dryRun: true, backupDir });
    assert.equal(blocked.ok, false);
    assert.ok(blocked.checks.some((c) => !c.ok && /email_verification_otps/.test(c.name)));
    assert.equal(blocked.tables.length, 0, 'nothing may be copied when pre-flight fails');

    const accepted = await runMigration({ source: sourceFile, dryRun: true, backupDir, acceptUnmanaged: ['email_verification_otps'] });
    assert.equal(accepted.ok, true);

    const cleanup = new DatabaseSync(sourceFile);
    cleanup.exec('DELETE FROM email_verification_otps');
    cleanup.close();
  });

  test('a re-run is idempotent, and silent divergence in the target is detected (not hidden by DO NOTHING)', async () => {
    const runMigration = await runner();

    const first = await runMigration({ source: sourceFile, dryRun: true, backupDir, keepConnection: true });
    assert.equal(first.ok, true);

    // Same data again into the same (now non-empty) target.
    const refused = await runMigration({ source: sourceFile, dryRun: true, backupDir, keepConnection: true });
    assert.equal(refused.ok, false, 'a non-empty target is refused unless --allow-nonempty is given');

    const rerun = await runMigration({ source: sourceFile, dryRun: true, backupDir, keepConnection: true, allowNonEmptyTarget: true });
    assert.equal(rerun.ok, true);
    assert.equal(rerun.tables.find((t) => t.table === 'users')!.inserted, 0);
    assert.equal(rerun.tables.find((t) => t.table === 'users')!.alreadyPresent, 3);

    // Someone changes the owner's token_version in the target: counts still match, content does not.
    const { getDb, closeDb } = await import('../../src/db/database.js');
    const target = await getDb();
    await target.run("UPDATE users SET token_version = 99 WHERE id = 'u-owner'");

    const diverged = await runMigration({ source: sourceFile, dryRun: true, backupDir, keepConnection: true, allowNonEmptyTarget: true });
    assert.equal(diverged.ok, false);
    assert.equal(diverged.tables.find((t) => t.table === 'users')!.targetRowsAfter, 3, 'row counts alone would have passed');
    assert.deepEqual(diverged.tables.find((t) => t.table === 'users')!.mismatchSample, ['u-owner']);
    assert.ok(diverged.checks.some((c) => !c.ok && /Super Admin account is identical/.test(c.name)));

    await closeDb();
  });

  test('a real (non-rehearsal) run refuses to write without a confirmed target host', async () => {
    const runMigration = await runner();
    const savedUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgres://user:pw@db.example.test:5432/app';
    try {
      await assert.rejects(
        () => runMigration({ source: sourceFile, dryRun: false, backupDir }),
        /--confirm-target db\.example\.test/
      );
      await assert.rejects(
        () => runMigration({ source: sourceFile, dryRun: false, backupDir, confirmTarget: 'wrong.example.test' }),
        /--confirm-target db\.example\.test/
      );
    } finally {
      if (savedUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = savedUrl;
    }
  });
});
