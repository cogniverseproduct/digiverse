/**
 * Starts the real Express app in-process against a temporary SQLite database.
 * Used by testContext.ts (fixture accounts pre-created) and freshContext.ts
 * (empty database, for suites that run first-time `/api/auth/setup` themselves).
 * Nothing here can reach server/data, and nothing under src/ knows about it.
 */
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { prepareIsolatedEnvironment, startApp } from '../unit/helpers/platformFlow.js';

export const FIXTURE_ADMIN = { email: 'admin@digiverse.internal', username: 'fixture-admin', password: 'Digiverse@2026!' };
export const FIXTURE_SUPER_ADMIN = { email: 'superadmin@digiverse.internal', username: 'fixture-super', password: 'SuperAdmin@2026!' };

export const explicitApiUrl = process.env.TEST_API_URL?.trim() || '';

export async function startIsolated(seedFixtureAccounts: boolean): Promise<string> {
  if (explicitApiUrl) return explicitApiUrl.replace(/\/+$/, '');

  const env = prepareIsolatedEnvironment('sqlite');
  const { server, baseUrl } = await startApp();
  server.unref();

  // The schema is created lazily on first database use. Touch it now so suites that open a raw handle in `before()`
  // (getDatabase) find the tables, instead of failing with "no such table: users".
  const health = await fetch(`${baseUrl}/api/health`);
  if (!health.ok) throw new Error(`The isolated test app did not start cleanly: /api/health answered ${health.status}`);

  if (seedFixtureAccounts) {
    await seedFixtureAccount('SUPER_ADMIN');
    await seedFixtureAccount('ADMIN');
  }

  process.on('exit', () => {
    try { fs.rmSync(env.tempDir, { recursive: true, force: true }); } catch { /* best effort */ }
  });
  return baseUrl;
}

/** Creates one of the two fixture accounts through the repository (the platform seeds nothing itself). */
export async function seedFixtureAccount(role: 'SUPER_ADMIN' | 'ADMIN'): Promise<void> {
  const account = role === 'SUPER_ADMIN' ? FIXTURE_SUPER_ADMIN : FIXTURE_ADMIN;
  const [{ repository }, bcrypt] = await Promise.all([import('../../src/db/repository.js'), import('bcryptjs')]);
  await repository.createUser({
    id: randomUUID(),
    email: account.email,
    username: account.username,
    passwordHash: await bcrypt.default.hash(account.password, 10),
    name: role === 'SUPER_ADMIN' ? 'Fixture Super Admin' : 'Fixture Admin',
    role,
    isActive: true
  });
}

type RawDb = import('node:sqlite').DatabaseSync;
let raw: RawDb | undefined;

/**
 * Synchronous handle on the SAME temporary SQLite file the in-process app uses
 * (a second connection; WAL allows it). Suites use it to inspect or pre-arrange
 * rows with `db.prepare(...).get/run/all`. Only for the isolated app.
 */
export function getDatabase(): RawDb {
  if (explicitApiUrl) throw new Error('getDatabase() needs the isolated in-process app; unset TEST_API_URL to use it.');
  if (!raw) {
    const { DatabaseSync } = process.getBuiltinModule('node:sqlite') as typeof import('node:sqlite');
    raw = new DatabaseSync(process.env.SQLITE_PATH as string);
    raw.exec('PRAGMA busy_timeout = 5000');
  }
  return raw;
}
