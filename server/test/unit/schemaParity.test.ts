/**
 * One schema, two dialects: SQLite (local) and Postgres (production, verified with PGlite) must end up
 * with the same tables, columns and indexes, and a schema change must not ship without a version bump.
 * Also covers the database-driver selection guards. Uses throwaway databases only.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, test } from 'node:test';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'digiverse-parity-'));
process.env.NODE_ENV = 'test';
delete process.env.DATABASE_URL;
delete process.env.VERCEL;
delete process.env.VERCEL_ENV;

async function snapshot(driver: 'sqlite' | 'pglite') {
  process.env.DATABASE_DRIVER = driver;
  process.env.SQLITE_PATH = path.join(tempDir, `parity-${driver}.db`);
  const { closeDb, getDb } = await import('../../src/db/database.js');
  const { TABLES } = await import('../../src/db/schema.js');
  await closeDb();
  const db = await getDb();

  const columns: Record<string, string[]> = {};
  for (const table of TABLES) {
    const rows =
      driver === 'sqlite'
        ? await db.all<{ name: string }>(`PRAGMA table_info(${table.name})`)
        : await db.all<{ name: string }>(
            'SELECT column_name AS name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ?',
            [table.name]
          );
    columns[table.name] = rows.map((r) => r.name).sort();
  }

  const indexRows =
    driver === 'sqlite'
      ? await db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%'")
      : await db.all<{ name: string }>("SELECT indexname AS name FROM pg_indexes WHERE schemaname = current_schema() AND indexname LIKE 'idx_%'");
  const version = await db.get<{ value: string }>("SELECT value FROM schema_meta WHERE key = 'schema_version'");

  await closeDb();
  return { columns, indexes: indexRows.map((r) => r.name).sort(), version: Number(version?.value) };
}

describe('schema definition', () => {
  after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  test('SQLite and Postgres (PGlite) create identical tables, columns and indexes', async () => {
    const sqlite = await snapshot('sqlite');
    const pglite = await snapshot('pglite');
    assert.deepEqual(pglite.columns, sqlite.columns);
    assert.deepEqual(pglite.indexes, sqlite.indexes);
    assert.equal(sqlite.version, pglite.version);
  });

  test('schema fingerprint is pinned to SCHEMA_VERSION (changing the schema requires a version bump)', async () => {
    const { SCHEMA_VERSION, schemaFingerprint } = await import('../../src/db/schema.js');
    // If this fails you changed a table, column, constraint or index. Existing Postgres databases skip
    // the upgrade when schema_version >= SCHEMA_VERSION, so BUMP SCHEMA_VERSION in schema.ts, then
    // update both values below.
    assert.equal(SCHEMA_VERSION, 5);
    assert.equal(schemaFingerprint(), PINNED_FINGERPRINT_FOR_VERSION_5);
  });

  test('a second initialisation is a no-op and keeps all data (Postgres upgrade path)', async () => {
    process.env.DATABASE_DRIVER = 'pglite';
    const { closeDb, getDb } = await import('../../src/db/database.js');
    const { initializeSchema } = await import('../../src/db/schema.js');
    await closeDb();
    const db = await getDb();
    await db.run(
      `INSERT INTO users (id, email, username, password_hash, name, role, token_version, is_platform_owner, must_change_password, created_at, updated_at)
       VALUES ('p1', 'p1@example.test', 'p1', 'h', 'P1', 'SUPER_ADMIN', 5, 1, 1, '2026-01-01', '2026-01-01')`
    );
    await initializeSchema(db);
    await initializeSchema(db);
    const row = await db.get<any>('SELECT token_version, is_platform_owner, must_change_password FROM users WHERE id = ?', ['p1']);
    assert.deepEqual({ ...row }, { token_version: 5, is_platform_owner: 1, must_change_password: 1 });
    await closeDb();
  });
});

describe('database driver selection guards', () => {
  const saved = { ...process.env };
  const restore = () => {
    for (const key of ['DATABASE_DRIVER', 'DATABASE_URL', 'VERCEL', 'VERCEL_ENV', 'NODE_ENV']) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  };

  test('an unknown DATABASE_DRIVER is an error, not a silent fallback', async () => {
    const { getDatabaseDriverName } = await import('../../src/config.js');
    process.env.DATABASE_DRIVER = 'postgresql';
    try {
      assert.throws(() => getDatabaseDriverName(), /Unsupported DATABASE_DRIVER "postgresql"/);
    } finally {
      restore();
    }
  });

  test('DATABASE_DRIVER=sqlite beside a DATABASE_URL is refused on Vercel / in production', async () => {
    const { getDatabaseDriverName } = await import('../../src/config.js');
    process.env.DATABASE_DRIVER = 'sqlite';
    process.env.DATABASE_URL = 'postgres://user:pw@db.example.test/app';
    process.env.NODE_ENV = 'production';
    try {
      assert.throws(() => getDatabaseDriverName(), /conflicts with DATABASE_URL/);
    } finally {
      restore();
    }
  });

  test('PGlite is refused on real Vercel deployments but allowed locally', async () => {
    const { getDatabaseDriverName } = await import('../../src/config.js');
    process.env.DATABASE_DRIVER = 'pglite';
    process.env.VERCEL_ENV = 'production';
    try {
      assert.throws(() => getDatabaseDriverName(), /not allowed on Vercel/);
      process.env.VERCEL_ENV = 'development';
      assert.equal(getDatabaseDriverName(), 'pglite');
    } finally {
      restore();
    }
  });

  test('DATABASE_URL selects Postgres; no URL selects SQLite', async () => {
    const { getDatabaseDriverName } = await import('../../src/config.js');
    delete process.env.DATABASE_DRIVER;
    process.env.DATABASE_URL = 'postgres://user:pw@db.example.test/app';
    try {
      assert.equal(getDatabaseDriverName(), 'postgres');
      delete process.env.DATABASE_URL;
      assert.equal(getDatabaseDriverName(), 'sqlite');
    } finally {
      restore();
    }
  });

  test('SQLite itself is refused on Vercel', async () => {
    const { isVercelRuntime } = await import('../../src/config.js');
    process.env.VERCEL = '1';
    process.env.DATABASE_DRIVER = 'sqlite';
    try {
      assert.equal(isVercelRuntime(), true);
      const { closeDb, getDb } = await import('../../src/db/database.js');
      await closeDb();
      await assert.rejects(() => getDb(), /SQLite cannot be used on Vercel/);
    } finally {
      restore();
    }
  });
});

// Fingerprint of the schema at SCHEMA_VERSION 5 (tables, columns, constraints, indexes).
const PINNED_FINGERPRINT_FOR_VERSION_5 = '0071aff40cf9e55d728fbdd54f11758ffc131e9e738bffdcc688cb84fb0e6500';
