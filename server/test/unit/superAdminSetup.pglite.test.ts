/**
 * First-run Super Admin setup on the Postgres dialect (in-process PGlite):
 * concurrent setup requests must still create exactly one Super Admin, and
 * the flow must stay closed afterwards.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { prepareIsolatedEnvironment, startApp } from './helpers/platformFlow.js';

const env = prepareIsolatedEnvironment('pglite');
const PASSWORD = 'PgliteOwnerPass@2026!';

test('concurrent setup creates exactly one Super Admin on Postgres (PGlite)', async () => {
  const { server, baseUrl } = await startApp();
  try {
    const post = async (username: string) => {
      const res = await fetch(`${baseUrl}/api/auth/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: PASSWORD, confirmPassword: PASSWORD, email: `${username}@company.co.in` })
      });
      return res.status;
    };

    const statuses = await Promise.all(Array.from({ length: 6 }, (_, i) => post(`pg_racer_${i}`)));
    assert.equal(statuses.filter((s) => s === 201).length, 1, JSON.stringify(statuses));
    assert.equal(statuses.filter((s) => s === 403).length, 5, JSON.stringify(statuses));

    const status = await (await fetch(`${baseUrl}/api/auth/setup/status`)).json() as any;
    assert.equal(status.setupRequired, false);
    assert.equal(status.superAdminState, 'ACTIVE');
    assert.equal(await post('pg_late'), 403);

    const { repository } = await import('../../src/db/repository.js');
    assert.equal((await repository.countSuperAdmins()).total, 1);
  } finally {
    server.close();
    const { closeDb } = await import('../../src/db/database.js');
    await closeDb();
  }
});

after(() => {
  fs.rmSync(env.tempDir, { recursive: true, force: true });
});
