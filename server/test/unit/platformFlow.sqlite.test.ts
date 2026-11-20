/**
 * Full platform flow against a fresh, temporary SQLite database
 * (the local-development driver). Also proves a brand-new database works,
 * which previously failed on tenant creation.
 */
import { test, after } from 'node:test';
import fs from 'node:fs';
import { prepareIsolatedEnvironment, startApp, runPlatformFlow } from './helpers/platformFlow.js';

const env = prepareIsolatedEnvironment('sqlite');

test('platform flow on SQLite (fresh database)', async () => {
  const { server, baseUrl } = await startApp();
  try {
    await runPlatformFlow(baseUrl, 'sqlite');
  } finally {
    server.close();
    const { closeDb } = await import('../../src/db/database.js');
    await closeDb();
  }
});

after(() => {
  fs.rmSync(env.tempDir, { recursive: true, force: true });
});
