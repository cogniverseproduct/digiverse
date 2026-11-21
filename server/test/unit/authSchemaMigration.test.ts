/**
 * The legacy SQLite users-table rebuild must preserve every column that exists, including the
 * newer security-relevant ones (platform owner, forced password change, token version, ...).
 * Runs against throwaway SQLite files only; never touches server/data.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'digiverse-authmig-'));

process.env.NODE_ENV = 'test';
process.env.DATABASE_DRIVER = 'sqlite';
delete process.env.DATABASE_URL;
delete process.env.VERCEL;
delete process.env.VERCEL_ENV;

let caseNumber = 0;

async function openWithLegacyUsers(createSql: string, insertSql: string): Promise<{ db: any; file: string }> {
  const file = path.join(tempDir, `legacy-${++caseNumber}.db`);
  const raw = new DatabaseSync(file);
  raw.exec(createSql);
  raw.exec(insertSql);
  raw.close();

  process.env.SQLITE_PATH = file;
  const { closeDb, getDb } = await import('../../src/db/database.js');
  await closeDb();
  return { db: await getDb(), file };
}

describe('legacy users-table rebuild', () => {
  after(async () => {
    const { closeDb } = await import('../../src/db/database.js');
    await closeDb();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('keeps is_platform_owner, must_change_password, token_version, last_login_at and disabled_* values', async () => {
    // An intermediate schema: email NOT NULL, no username, but already carrying the newer columns.
    const { db } = await openWithLegacyUsers(
      `CREATE TABLE users (
         id TEXT PRIMARY KEY,
         email TEXT NOT NULL UNIQUE,
         password_hash TEXT NOT NULL,
         name TEXT NOT NULL,
         role TEXT NOT NULL DEFAULT 'ADMIN',
         is_active INTEGER NOT NULL DEFAULT 1,
         account_status TEXT NOT NULL DEFAULT 'ACTIVE',
         disabled_reason TEXT,
         disabled_at TEXT,
         last_login_at TEXT,
         token_version INTEGER NOT NULL DEFAULT 1,
         is_platform_owner INTEGER NOT NULL DEFAULT 0,
         must_change_password INTEGER NOT NULL DEFAULT 0,
         created_at TEXT NOT NULL,
         updated_at TEXT NOT NULL
       );`,
      `INSERT INTO users (id, email, password_hash, name, role, is_active, account_status, disabled_reason, disabled_at,
                          last_login_at, token_version, is_platform_owner, must_change_password, created_at, updated_at) VALUES
         ('u-owner', 'owner@example.test', 'hash-owner', 'Owner', 'SUPER_ADMIN', 1, 'ACTIVE', NULL, NULL,
          '2026-01-02T00:00:00Z', 7, 1, 1, '2026-01-01T00:00:00Z', '2026-01-03T00:00:00Z'),
         ('u-removed', 'gone@example.test', 'hash-gone', 'Gone', 'ADMIN', 0, 'REMOVED', 'left the team', '2026-02-01T00:00:00Z',
          NULL, 4, 0, 0, '2026-01-05T00:00:00Z', '2026-02-01T00:00:00Z'),
         ('u-admin', 'admin@example.test', 'hash-admin', 'Admin', 'ADMIN', 1, 'ACTIVE', NULL, NULL,
          NULL, 1, 0, 0, '2026-01-06T00:00:00Z', '2026-01-06T00:00:00Z');`
    );

    const owner = await db.get('SELECT * FROM users WHERE id = ?', ['u-owner']);
    assert.equal(owner.is_platform_owner, 1, 'platform owner flag must survive');
    assert.equal(owner.must_change_password, 1, 'must_change_password must survive');
    assert.equal(owner.token_version, 7, 'token_version must survive (a reset would un-revoke old tokens)');
    assert.equal(owner.last_login_at, '2026-01-02T00:00:00Z');
    assert.equal(owner.password_hash, 'hash-owner');
    assert.equal(owner.role, 'SUPER_ADMIN');
    assert.equal(owner.updated_at, '2026-01-03T00:00:00Z');

    const removed = await db.get('SELECT * FROM users WHERE id = ?', ['u-removed']);
    assert.equal(removed.account_status, 'REMOVED', 'REMOVED must not be downgraded to DISABLED');
    assert.equal(removed.disabled_reason, 'left the team');
    assert.equal(removed.disabled_at, '2026-02-01T00:00:00Z');
    assert.equal(removed.token_version, 4);
    assert.equal(removed.is_active, 0);

    const count = await db.get('SELECT COUNT(*) AS n FROM users');
    assert.equal(Number(count.n), 3);
    const owners = await db.get('SELECT COUNT(*) AS n FROM users WHERE is_platform_owner = 1');
    assert.equal(Number(owners.n), 1, 'still exactly one platform owner');

    // The rebuild relaxed NOT NULL on email and added username.
    const columns = await db.all('PRAGMA table_info(users)');
    assert.ok(columns.some((c: any) => c.name === 'username'));
    assert.equal(columns.find((c: any) => c.name === 'email').notnull, 0);
  });

  test('a very old table (no username, is_active, updated_at, newer columns) is upgraded with sane defaults', async () => {
    const { db } = await openWithLegacyUsers(
      `CREATE TABLE users (
         id TEXT PRIMARY KEY,
         email TEXT NOT NULL UNIQUE,
         password_hash TEXT NOT NULL,
         name TEXT NOT NULL,
         role TEXT NOT NULL,
         created_at TEXT NOT NULL
       );`,
      `INSERT INTO users (id, email, password_hash, name, role, created_at) VALUES
         ('old-1', 'first@example.test', 'h1', 'First', 'SUPER_ADMIN', '2025-01-01T00:00:00Z'),
         ('old-2', 'second@example.test', 'h2', 'Second', 'admin', '2025-02-01T00:00:00Z');`
    );

    const first = await db.get('SELECT * FROM users WHERE id = ?', ['old-1']);
    assert.equal(first.account_status, 'ACTIVE');
    assert.equal(first.is_active, 1);
    assert.equal(first.token_version, 1);
    assert.equal(first.updated_at, '2025-01-01T00:00:00Z', 'updated_at falls back to created_at');
    // The normal upgrade rule (backfillPlatformOwner) marks the earliest Super Admin as owner - exactly one.
    assert.equal(first.is_platform_owner, 1);
    const second = await db.get('SELECT * FROM users WHERE id = ?', ['old-2']);
    assert.equal(second.role, 'ADMIN');
    assert.equal(second.is_platform_owner, 0);
  });

  test('a table that cannot be rebuilt fails loudly and leaves the data untouched', async () => {
    const file = path.join(tempDir, 'broken.db');
    const raw = new DatabaseSync(file);
    // No password_hash column: the rebuild cannot invent credentials.
    raw.exec(`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL, created_at TEXT NOT NULL);
              INSERT INTO users VALUES ('x', 'x@example.test', 'X', 'ADMIN', '2025-01-01T00:00:00Z');`);
    raw.close();

    process.env.SQLITE_PATH = file;
    const { closeDb, getDb } = await import('../../src/db/database.js');
    await closeDb();
    await assert.rejects(() => getDb(), /required column\(s\) missing: password_hash/);
    await closeDb();

    const check = new DatabaseSync(file, { readOnly: true });
    const rows = check.prepare('SELECT id, email FROM users').all() as Array<{ id: string; email: string }>;
    check.close();
    assert.deepEqual(rows.map((r) => r.id), ['x']);
  });

  test('already-current databases are not rebuilt (idempotent)', async () => {
    const { db } = await openWithLegacyUsers('CREATE TABLE unrelated (id TEXT);', 'INSERT INTO unrelated VALUES (\'a\');');
    await db.run(
      `INSERT INTO users (id, email, username, password_hash, name, role, created_at, updated_at, is_platform_owner, must_change_password, token_version)
       VALUES ('n1', 'n1@example.test', 'n1', 'h', 'N1', 'SUPER_ADMIN', '2026-01-01', '2026-01-01', 1, 1, 9)`
    );
    const { initializeSchema } = await import('../../src/db/schema.js');
    await initializeSchema(db);
    await initializeSchema(db);
    const row = await db.get('SELECT * FROM users WHERE id = ?', ['n1']);
    assert.equal(row.token_version, 9);
    assert.equal(row.must_change_password, 1);
    assert.equal(row.is_platform_owner, 1);
  });
});
