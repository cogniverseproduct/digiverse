/**
 * Super Admin account management on the Postgres dialect (in-process PGlite): the same SQL and
 * transaction/advisory-lock code that runs on Vercel with a hosted Postgres database.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { prepareIsolatedEnvironment, startApp } from './helpers/platformFlow.js';

const env = prepareIsolatedEnvironment('pglite');
const OWNER_PW = 'PgOwnerPassword@2026!';
const PEER_PW = 'PgPeerPassword@2026!!';
const PEER_TEMP = 'PgTempFromOwner@2026!!';

test('Super Admin management and ownership transfer on Postgres (PGlite)', async () => {
  const { server, baseUrl } = await startApp();
  const call = async (method: string, path: string, body?: unknown, token?: string) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    return { status: res.status, body: (await res.json().catch(() => ({}))) as any };
  };

  try {
    const setup = await call('POST', '/api/auth/setup', { username: 'pg_owner', email: 'owner@startup.co.in', password: OWNER_PW, confirmPassword: OWNER_PW });
    assert.equal(setup.status, 201, JSON.stringify(setup.body));
    const owner = setup.body.token as string;

    // Parallel creations with the same email: exactly one wins, the rest are refused (no duplicates).
    const create = (i: number) => call('POST', '/api/super-admins', {
      name: `Peer ${i}`, email: 'peer@outlook.com', username: `pg_peer_${i}`, password: PEER_TEMP, confirmPassword: PEER_TEMP, currentPassword: OWNER_PW
    }, owner);
    const creations = await Promise.all([0, 1, 2, 3].map(create));
    assert.equal(creations.filter((r) => r.status === 201).length, 1, JSON.stringify(creations.map((r) => r.status)));
    assert.equal(creations.filter((r) => r.status === 409).length, 3);
    const peerId = creations.find((r) => r.status === 201)!.body.account.id as string;

    // The creator chose the password, so the new Super Admin must replace it before anything else works.
    const peerLogin = await call('POST', '/api/auth/login', { identifier: 'peer@outlook.com', password: PEER_TEMP });
    assert.equal(peerLogin.status, 200);
    assert.equal(peerLogin.body.user.mustChangePassword, true);
    const lockedOut = await call('GET', '/api/super-admins', undefined, peerLogin.body.token);
    assert.equal(lockedOut.status, 403);
    assert.equal(lockedOut.body.code, 'PASSWORD_CHANGE_REQUIRED');
    const chose = await call('POST', '/api/auth/change-password', { currentPassword: PEER_TEMP, newPassword: PEER_PW, confirmPassword: PEER_PW }, peerLogin.body.token);
    assert.equal(chose.status, 200, JSON.stringify(chose.body));
    assert.equal((await call('GET', '/api/super-admins', undefined, chose.body.token)).status, 200);
    assert.equal((await call('POST', '/api/auth/login', { identifier: 'peer@outlook.com', password: PEER_TEMP })).status, 401);

    // Email change keeps the same account and the password they chose.
    assert.equal((await call('POST', '/api/auth/login', { identifier: 'peer@outlook.com', password: PEER_PW })).status, 200);
    const patch = await call('PATCH', `/api/super-admins/${peerId}`, { email: 'peer@college.edu', currentPassword: OWNER_PW }, owner);
    assert.equal(patch.status, 200, JSON.stringify(patch.body));
    assert.equal((await call('POST', '/api/auth/login', { identifier: 'peer@college.edu', password: PEER_PW })).body.user.id, peerId);
    assert.equal((await call('POST', '/api/auth/login', { identifier: 'peer@outlook.com', password: PEER_PW })).status, 401);

    // Parallel transfer initiations: only one may be pending.
    const start = () => call('POST', '/api/super-admins/transfer', { targetUserId: peerId, confirmationPhrase: 'TRANSFER OWNERSHIP', currentPassword: OWNER_PW }, owner);
    const starts = await Promise.all([start(), start(), start()]);
    assert.equal(starts.filter((r) => r.status === 201).length, 1, JSON.stringify(starts.map((r) => r.status)));
    const transferId = starts.find((r) => r.status === 201)!.body.transfer.id as string;

    // Ownership only moves when the target signs in and accepts; a stolen owner session cannot accept for them.
    assert.equal((await call('POST', '/api/super-admins/transfer/accept', { transferId, currentPassword: OWNER_PW }, owner)).status, 403);
    const peerToken = (await call('POST', '/api/auth/login', { identifier: 'peer@college.edu', password: PEER_PW })).body.token as string;
    const accepts = await Promise.all([
      call('POST', '/api/super-admins/transfer/accept', { transferId, currentPassword: PEER_PW }, peerToken),
      call('POST', '/api/super-admins/transfer/accept', { transferId, currentPassword: PEER_PW }, peerToken)
    ]);
    assert.equal(accepts.filter((r) => r.status === 200).length, 1, JSON.stringify(accepts.map((r) => r.status)));

    const list = await call('GET', '/api/super-admins', undefined, peerToken);
    assert.equal(list.body.summary.ownerId, peerId);
    assert.equal(list.body.summary.active, 2);

    // The last-active guard holds on Postgres as well.
    assert.equal((await call('POST', `/api/super-admins/${peerId}/status`, { status: 'DISABLED', currentPassword: PEER_PW }, peerToken)).status, 409);

    // A transfer to a NEW account forces that person to choose their own password before accepting.
    const TEMP_PW = 'TemporaryByOwner@2033!';
    const CHOSEN_PW = 'ChosenOnFirstLogin@2033!';
    const second = await call('POST', '/api/super-admins/transfer', {
      confirmationPhrase: 'TRANSFER OWNERSHIP', currentPassword: PEER_PW,
      newAccount: { name: 'Fresh Owner', email: 'fresh@startup.co.in', username: 'fresh_owner', password: TEMP_PW, confirmPassword: TEMP_PW }
    }, peerToken);
    assert.equal(second.status, 201, JSON.stringify(second.body));
    const fresh = await call('POST', '/api/auth/login', { identifier: 'fresh@startup.co.in', password: TEMP_PW });
    assert.equal(fresh.body.user.mustChangePassword, true);
    const blocked = await call('POST', '/api/super-admins/transfer/accept', { transferId: second.body.transfer.id, currentPassword: TEMP_PW }, fresh.body.token);
    assert.equal(blocked.status, 403);
    assert.equal(blocked.body.code, 'PASSWORD_CHANGE_REQUIRED');
    const changed = await call('POST', '/api/auth/change-password', { currentPassword: TEMP_PW, newPassword: CHOSEN_PW, confirmPassword: CHOSEN_PW }, fresh.body.token);
    assert.equal(changed.status, 200, JSON.stringify(changed.body));
    const accepted = await call('POST', '/api/super-admins/transfer/accept', { transferId: second.body.transfer.id, currentPassword: CHOSEN_PW }, changed.body.token);
    assert.equal(accepted.status, 200, JSON.stringify(accepted.body));
    assert.equal((await call('POST', '/api/auth/login', { identifier: 'fresh@startup.co.in', password: CHOSEN_PW })).body.user.mustChangePassword, false);
  } finally {
    server.close();
    const { closeDb } = await import('../../src/db/database.js');
    await closeDb();
  }
});

after(() => {
  fs.rmSync(env.tempDir, { recursive: true, force: true });
});
