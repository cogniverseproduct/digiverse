/**
 * Full platform flow against Postgres (in-process PGlite).
 * This exercises the exact SQL and transaction code that runs on Vercel
 * with a hosted Postgres database, without needing any cloud account.
 */
import { test, after } from 'node:test';
import fs from 'node:fs';
import { prepareIsolatedEnvironment, startApp, runPlatformFlow } from './helpers/platformFlow.js';

const env = prepareIsolatedEnvironment('pglite');

test('platform flow on Postgres dialect (PGlite)', async () => {
  const { server, baseUrl } = await startApp();
  try {
    await runPlatformFlow(baseUrl, 'pglite');
  } finally {
    server.close();
    const { closeDb } = await import('../../src/db/database.js');
    await closeDb();
  }
});

after(() => {
  fs.rmSync(env.tempDir, { recursive: true, force: true });
});
