// Must stay the first import: prepares the isolated test environment before the app loads.
import { baseUrl } from './helpers/testContext.js';
import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { randomUUID, createHmac } from 'node:crypto';

/**
 * Centralized publishing through the real HTTP API, in SIMULATED mode (no Vercel account exists).
 * Publishing no longer needs client approval, a locked revision, a quotation or a payment.
 * The simulated provider is always labelled as simulated and is never reported as a Vercel deployment.
 */

const SENTINEL_TOKEN = 'vercel_test_SENTINEL_0123456789abcdef0123456789';

async function call(method: string, route: string, body?: unknown, token?: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${baseUrl}${route}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body)
  });
  const text = await res.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { data = null; }
  return { status: res.status, data, text };
}

let adminToken = '';
let superToken = '';
let otherAdminToken = '';

async function login(email: string, password: string): Promise<string> {
  const r = await call('POST', '/api/auth/login', { email, password });
  assert.equal(r.status, 200, `login failed for ${email}`);
  return r.data.token;
}

async function newProject(label: string, token = adminToken): Promise<string> {
  const created = await call('POST', '/api/projects', {
    organizationName: `${label} ${randomUUID().slice(0, 6)}`,
    category: 'sports',
    tagline: 'Athletic Excellence',
    aboutText: 'A community sports club used only in automated tests.',
    primaryColor: '#0284c7',
    accentColor: '#10b981',
    typographyStyle: 'athletic',
    websiteLanguage: 'english'
  }, token);
  assert.equal(created.status, 201, created.text);
  const id = created.data.project.id as string;
  const gen = await call('POST', `/api/projects/${id}/generate`, {}, token);
  assert.equal(gen.status, 200, gen.text);
  return id;
}

before(async () => {
  adminToken = await login('admin@digiverse.internal', 'Digiverse@2026!');
  superToken = await login('superadmin@digiverse.internal', 'SuperAdmin@2026!');
  const [{ repository }, bcrypt] = await Promise.all([import('../src/db/repository.js'), import('bcryptjs')]);
  await repository.createUser({
    id: randomUUID(), email: 'publishing-second@digiverse.internal', username: 'publishing-second',
    passwordHash: await bcrypt.default.hash('SecondAdmin@2026!', 10), name: 'Second Admin', role: 'ADMIN', isActive: true
  });
  otherAdminToken = await login('publishing-second@digiverse.internal', 'SecondAdmin@2026!');
});

const ENV_KEYS = ['PUBLISH_MOCK_MODE', 'PUBLISH_MOCK_STEP_MS', 'PUBLISH_MOCK_OUTCOME', 'VERCEL_TOKEN', 'VERCEL_ENABLED', 'VERCEL_WEBHOOK_SECRET'];
const savedEnv: Record<string, string | undefined> = {};
before(() => { for (const k of ENV_KEYS) savedEnv[k] = process.env[k]; });
function resetEnv() {
  process.env.PUBLISH_MOCK_MODE = 'true';
  process.env.PUBLISH_MOCK_STEP_MS = '0';
  delete process.env.PUBLISH_MOCK_OUTCOME;
  delete process.env.VERCEL_TOKEN;
  delete process.env.VERCEL_ENABLED;
  delete process.env.VERCEL_WEBHOOK_SECRET;
}
beforeEach(resetEnv);
after(() => { for (const k of ENV_KEYS) { if (savedEnv[k] === undefined) delete process.env[k]; else process.env[k] = savedEnv[k]; } });

describe('configuration detection', () => {
  test('reports simulated mode without exposing any credential', async () => {
    process.env.VERCEL_TOKEN = SENTINEL_TOKEN;
    const r = await call('GET', '/api/publishing/config', undefined, adminToken);
    assert.equal(r.status, 200);
    assert.equal(r.data.mode, 'mock');
    assert.equal(r.data.vercelEnabled, false);
    assert.equal(r.data.tokenConfigured, true);
    assert.ok(!r.text.includes(SENTINEL_TOKEN), 'the token must never appear in a response');
  });

  test('without credentials or the mock switch publishing is "not configured"', async () => {
    delete process.env.PUBLISH_MOCK_MODE;
    const r = await call('GET', '/api/publishing/config', undefined, adminToken);
    assert.equal(r.data.mode, 'not_configured');
    assert.match(r.data.message, /Vercel setup is pending/i);
  });

  test('VERCEL_ENABLED without a token is not configured and says what is missing', async () => {
    process.env.VERCEL_ENABLED = 'true';
    delete process.env.PUBLISH_MOCK_MODE;
    const r = await call('GET', '/api/publishing/config', undefined, adminToken);
    assert.equal(r.data.mode, 'not_configured');
    assert.ok(r.data.problems.some((p: string) => /VERCEL_TOKEN/.test(p)));
  });

  test('the config endpoint needs a signed-in admin; credential verification is Super Admin only', async () => {
    assert.equal((await call('GET', '/api/publishing/config')).status, 401);
    assert.equal((await call('POST', '/api/publishing/config/verify', {}, adminToken)).status, 403);
    const verify = await call('POST', '/api/publishing/config/verify', {}, superToken);
    assert.equal(verify.status, 409, 'cannot verify without credentials');
    assert.equal(verify.data.error.code, 'NOT_CONFIGURED');
  });
});

describe('not configured: publishing is disabled but everything else works', () => {
  test('status says not_configured, publishing is refused, generation and preflight still work', async () => {
    const id = await newProject('Unconfigured Club');
    delete process.env.PUBLISH_MOCK_MODE;

    const status = await call('GET', `/api/projects/${id}/publishing/status`, undefined, adminToken);
    assert.equal(status.status, 200);
    assert.equal(status.data.state, 'not_configured');
    assert.equal(status.data.isLive, false);

    const publish = await call('POST', `/api/projects/${id}/publishing/publish`, {}, adminToken);
    assert.equal(publish.status, 409);
    assert.equal(publish.data.code, 'NOT_CONFIGURED');

    const preflight = await call('GET', `/api/projects/${id}/publishing/preflight`, undefined, adminToken);
    assert.equal(preflight.status, 200);
    assert.equal(preflight.data.isReadyToPublish, true);
  });
});

describe('publishing needs no approval, revision lock, quotation or payment', () => {
  test('preflight lists only technical checks', async () => {
    const id = await newProject('Preflight Club');
    const r = await call('GET', `/api/projects/${id}/publishing/preflight`, undefined, adminToken);
    assert.equal(r.status, 200);
    assert.equal(r.data.isReadyToPublish, true);
    assert.equal(r.data.checks.hasGeneratedWebsite, true);
    for (const gone of ['hasClientApproval', 'isCommerciallyCleared', 'isRevisionLocked']) {
      assert.ok(!(gone in r.data.checks), `${gone} must not exist any more`);
    }
    assert.ok(!('clearanceMessage' in r.data));
  });

  test('a project that was never generated is blocked for a technical reason only', async () => {
    const created = await call('POST', '/api/projects', {
      organizationName: `Ungenerated ${randomUUID().slice(0, 5)}`, category: 'sports', tagline: 't', aboutText: 'a'
    }, adminToken);
    const id = created.data.project.id;
    const r = await call('GET', `/api/projects/${id}/publishing/preflight`, undefined, adminToken);
    assert.equal(r.data.isReadyToPublish, false);
    assert.ok(r.data.blockers.some((b: string) => /Generate the website/.test(b)));
    const publish = await call('POST', `/api/projects/${id}/publishing/publish`, {}, adminToken);
    assert.equal(publish.status, 400);
    assert.equal(publish.data.code, 'PREFLIGHT_FAILED');
  });

  test('publish works immediately for a fresh generated site and the old gates and routes are gone', async () => {
    const id = await newProject('Open Publishing Club');
    const res = await call('POST', `/api/projects/${id}/publishing/publish`, { seo: { title: 'Open Club' } }, adminToken);
    assert.equal(res.status, 200, res.text);
    assert.equal(res.data.success, true);
    assert.equal(res.data.deployment.status, 'ready');
    assert.equal(res.data.deployment.isSimulated, true, 'a local deployment is labelled as simulated');
    assert.equal(res.data.deployment.provider, 'mock');
    assert.equal(res.data.state, 'ready');
    assert.ok(res.data.deployedUrl.includes('/live/'), 'the simulated URL is the local shared route');
    assert.equal(res.data.project.status, 'deployed');
    assert.equal(res.data.project.deploymentDetails.platform, 'mock');
    assert.ok(!res.data.project.deploymentDetails.vercelDeploymentId, 'a simulated deployment never carries a Vercel id');

    assert.equal((await call('POST', `/api/projects/${id}/approve`, { approvedBy: 'x' }, adminToken)).status, 404, 'admin approval route was removed');
  });

  test('the bypassCommercialGate flag no longer exists and does nothing', async () => {
    const id = await newProject('Bypass Club');
    const res = await call('POST', `/api/projects/${id}/publish`, { bypassCommercialGate: true }, adminToken);
    assert.equal(res.status, 200);
    assert.ok(!JSON.stringify(res.data).includes('bypassCommercialGate'));
  });

  test('every engine publishes without payment (legacy alias route)', async () => {
    const id = await newProject('Alias Club');
    const res = await call('POST', `/api/projects/${id}/deploy`, {}, adminToken);
    assert.equal(res.status, 200, res.text);
    assert.equal(res.data.deployment.status, 'ready');
  });
});

describe('deployment lifecycle (simulated)', () => {
  test('queued -> building -> ready is reported honestly while polling', async () => {
    const id = await newProject('Lifecycle Club');
    process.env.PUBLISH_MOCK_STEP_MS = '60000';
    const published = await call('POST', `/api/projects/${id}/publishing/publish`, {}, adminToken);
    assert.equal(published.status, 200);
    assert.equal(published.data.deployment.status, 'queued');
    assert.equal(published.data.state, 'queued');
    assert.equal(published.data.deployedUrl, undefined, 'no live URL is shown before the deployment is ready');
    assert.equal(published.data.success, true);

    // A second publish while one is running is refused.
    const second = await call('POST', `/api/projects/${id}/publishing/publish`, {}, adminToken);
    assert.equal(second.status, 409);
    assert.equal(second.data.code, 'IN_PROGRESS');

    const { siteDeploymentRepository } = await import('../src/db/siteDeploymentRepository.js');
    const dep = await siteDeploymentRepository.getLatest(id);
    const { getDatabase } = await import('./helpers/testContext.js');
    const db: any = getDatabase();
    db.prepare('UPDATE site_deployments SET created_at = ? WHERE id = ?').run(new Date(Date.now() - 70_000).toISOString(), dep!.id);
    let status = await call('GET', `/api/projects/${id}/publishing/status`, undefined, adminToken);
    assert.equal(status.data.state, 'building');
    assert.equal(status.data.isLive, false);

    process.env.PUBLISH_MOCK_STEP_MS = '0';
    status = await call('GET', `/api/projects/${id}/publishing/status`, undefined, adminToken);
    assert.equal(status.data.state, 'ready');
    assert.equal(status.data.isLive, true);
    assert.ok(status.data.liveUrl.includes('/live/'));
    assert.equal(status.data.isSimulated, true);

    const project = await call('GET', `/api/projects/${id}`, undefined, adminToken);
    assert.equal(project.data.project.status, 'deployed');
    assert.ok(project.data.project.deploymentDetails.deployedUrl.includes('/live/'), 'live URL persisted on the project');
  });

  test('a failed deployment is recorded as failed, never as success, and a retry recovers', async () => {
    const id = await newProject('Failing Club');
    process.env.PUBLISH_MOCK_OUTCOME = 'fail';
    const res = await call('POST', `/api/projects/${id}/publishing/publish`, {}, adminToken);
    assert.equal(res.status, 200);
    assert.equal(res.data.success, false);
    assert.equal(res.data.deployment.status, 'failed');
    assert.equal(res.data.state, 'failed');
    assert.match(res.data.deployment.errorMessage, /Simulated failure/);
    assert.equal(res.data.deployedUrl, undefined);
    assert.equal(res.data.project.status, 'deployment_failed');
    assert.equal((await call('GET', `/api/live/${res.data.deployment.siteSlug}`)).status, 404, 'a failed first publish serves nothing');

    delete process.env.PUBLISH_MOCK_OUTCOME;
    const retry = await call('POST', `/api/projects/${id}/publishing/redeploy`, {}, adminToken);
    assert.equal(retry.status, 200, retry.text);
    assert.equal(retry.data.deployment.status, 'ready');
    const history = await call('GET', `/api/projects/${id}/publishing/deployments`, undefined, adminToken);
    assert.deepEqual(history.data.deployments.map((d: any) => d.status), ['ready', 'failed']);
  });

  test('a failed redeploy keeps the previous version live and says so', async () => {
    const id = await newProject('Redeploy Club');
    const first = await call('POST', `/api/projects/${id}/publishing/publish`, {}, adminToken);
    assert.equal(first.data.deployment.status, 'ready');
    process.env.PUBLISH_MOCK_OUTCOME = 'fail';
    const second = await call('POST', `/api/projects/${id}/publishing/redeploy`, {}, adminToken);
    assert.equal(second.data.deployment.status, 'failed');
    const status = await call('GET', `/api/projects/${id}/publishing/status`, undefined, adminToken);
    assert.equal(status.data.state, 'failed');
    assert.equal(status.data.previousVersionLive, true);
    assert.equal(status.data.isLive, true);
    const project = await call('GET', `/api/projects/${id}`, undefined, adminToken);
    assert.equal(project.data.project.status, 'deployed', 'the live site is unaffected by a failed update');
  });

  test('redeploy publishes the current content again and keeps independent history', async () => {
    const id = await newProject('History Club');
    await call('POST', `/api/projects/${id}/publishing/publish`, {}, adminToken);
    const redeploy = await call('POST', `/api/projects/${id}/publishing/redeploy`, {}, adminToken);
    assert.equal(redeploy.status, 200);
    const history = await call('GET', `/api/projects/${id}/publishing/deployments`, undefined, adminToken);
    assert.equal(history.data.deployments.length, 2);
    assert.ok(history.data.deployments.every((d: any) => d.isSimulated && d.kind === 'publish'));
    const one = await call('GET', `/api/projects/${id}/publishing/deployments/${history.data.deployments[0].id}`, undefined, adminToken);
    assert.equal(one.data.deployment.id, history.data.deployments[0].id);
    const logs = await call('GET', `/api/projects/${id}/publishing/deployments/${history.data.deployments[0].id}/logs`, undefined, adminToken);
    assert.equal(logs.data.simulated, true);
    assert.ok(logs.data.lines.some((l: any) => /simulated/i.test(l.text)));
  });

  test('redeploy needs an existing publication', async () => {
    const id = await newProject('Never Published Club');
    const r = await call('POST', `/api/projects/${id}/publishing/redeploy`, {}, adminToken);
    assert.equal(r.status, 409);
    assert.equal(r.data.code, 'NOT_PUBLISHED');
  });

  test('unpublish deploys an offline page, takes the shared site down, and publishing again works', async () => {
    const id = await newProject('Offline Club');
    const pub = await call('POST', `/api/projects/${id}/publishing/publish`, {}, adminToken);
    const slug = pub.data.deployment.siteSlug;
    assert.equal((await call('GET', `/api/live/${slug}`)).status, 200);

    const off = await call('POST', `/api/projects/${id}/publishing/unpublish`, { reason: 'test' }, adminToken);
    assert.equal(off.status, 200, off.text);
    assert.equal(off.data.deployment.kind, 'offline');
    assert.equal(off.data.deployment.status, 'ready');
    assert.equal(off.data.state, 'ready_to_publish');
    const gone = await call('GET', `/api/live/${slug}`);
    assert.equal(gone.status, 404);
    assert.equal(gone.data.code, 'SITE_NOT_PUBLISHED');

    const again = await call('POST', `/api/projects/${id}/publishing/publish`, {}, adminToken);
    assert.equal(again.data.deployment.status, 'ready');
    assert.equal((await call('GET', `/api/live/${slug}`)).status, 200);
  });

  test('unpublishing a site that is not live is refused', async () => {
    const id = await newProject('Not Live Club');
    const r = await call('POST', `/api/projects/${id}/publishing/unpublish`, {}, adminToken);
    assert.equal(r.status, 409);
  });

  test('two sites cannot share a site address', async () => {
    const a = await newProject('Slug A');
    const b = await newProject('Slug B');
    const slug = `shared-${randomUUID().slice(0, 6)}`;
    assert.equal((await call('POST', `/api/projects/${a}/publishing/publish`, { siteSlug: slug }, adminToken)).status, 200);
    const clash = await call('POST', `/api/projects/${b}/publishing/publish`, { siteSlug: slug }, adminToken);
    assert.equal(clash.status, 400);
    assert.ok(clash.data.blockers.some((x: string) => /already used/.test(x)));
  });
});

describe('authentication, authorization and isolation', () => {
  test('every publishing endpoint needs a signed-in admin', async () => {
    const id = await newProject('Auth Club');
    const routes: [string, string][] = [
      ['GET', `/api/projects/${id}/publishing/status`],
      ['POST', `/api/projects/${id}/publishing/publish`],
      ['POST', `/api/projects/${id}/publishing/redeploy`],
      ['POST', `/api/projects/${id}/publishing/unpublish`],
      ['GET', `/api/projects/${id}/publishing/deployments`],
      ['GET', `/api/projects/${id}/publishing/deployments/dep_x`],
      ['GET', `/api/projects/${id}/publishing/deployments/dep_x/logs`],
      ['POST', `/api/projects/${id}/publish`],
      ['POST', `/api/projects/${id}/unpublish`]
    ];
    for (const [method, route] of routes) {
      assert.equal((await call(method, route, method === 'POST' ? {} : undefined)).status, 401, `${method} ${route}`);
    }
  });

  test("another admin cannot see or touch a project's deployments (404, not 403)", async () => {
    const id = await newProject('Private Club');
    const pub = await call('POST', `/api/projects/${id}/publishing/publish`, {}, adminToken);
    const depId = pub.data.deployment.id;
    const attempts: [string, string, unknown?][] = [
      ['GET', `/api/projects/${id}/publishing/status`],
      ['POST', `/api/projects/${id}/publishing/publish`, {}],
      ['POST', `/api/projects/${id}/publishing/redeploy`, {}],
      ['POST', `/api/projects/${id}/publishing/unpublish`, {}],
      ['GET', `/api/projects/${id}/publishing/deployments`],
      ['GET', `/api/projects/${id}/publishing/deployments/${depId}`],
      ['GET', `/api/projects/${id}/publishing/deployments/${depId}/logs`],
      ['POST', `/api/projects/${id}/publish`, {}]
    ];
    for (const [method, route, body] of attempts) {
      const r = await call(method, route, body, otherAdminToken);
      assert.equal(r.status, 404, `${method} ${route} should be hidden, got ${r.status}`);
    }
    assert.equal((await call('GET', `/api/projects/${id}/publishing/status`, undefined, superToken)).status, 200, 'Super Admin can read');
  });

  test("a deployment id from another project is never returned", async () => {
    const a = await newProject('Iso A');
    const b = await newProject('Iso B');
    const pubA = await call('POST', `/api/projects/${a}/publishing/publish`, {}, adminToken);
    const r = await call('GET', `/api/projects/${b}/publishing/deployments/${pubA.data.deployment.id}`, undefined, adminToken);
    assert.equal(r.status, 404);
  });

  test('no response or stored record contains a credential', async () => {
    process.env.VERCEL_TOKEN = SENTINEL_TOKEN;
    const id = await newProject('Secret Club');
    const bodies: string[] = [];
    const pub = await call('POST', `/api/projects/${id}/publishing/publish`, {}, adminToken); bodies.push(pub.text);
    bodies.push((await call('GET', `/api/projects/${id}/publishing/status`, undefined, adminToken)).text);
    bodies.push((await call('GET', `/api/projects/${id}/publishing/deployments`, undefined, adminToken)).text);
    bodies.push((await call('GET', '/api/publishing/config', undefined, adminToken)).text);
    bodies.push((await call('GET', '/api/sites', undefined, adminToken)).text);
    bodies.push((await call('GET', `/api/live/${pub.data.deployment.siteSlug}`)).text);
    for (const body of bodies) assert.ok(!body.includes(SENTINEL_TOKEN), 'token leaked into a response');
    const { getDatabase } = await import('./helpers/testContext.js');
    const db: any = getDatabase();
    for (const table of ['site_hosting', 'site_deployments', 'audit_logs', 'projects']) {
      const rows = JSON.stringify(db.prepare(`SELECT * FROM ${table}`).all());
      assert.ok(!rows.includes(SENTINEL_TOKEN), `token stored in ${table}`);
    }
  });
});

describe('published sites list, audit trail and project deletion', () => {
  test('the sites list marks simulated hosting and deployments are audited', async () => {
    const id = await newProject('Listed Club');
    await call('POST', `/api/projects/${id}/publishing/publish`, {}, adminToken);
    const sites = await call('GET', '/api/sites', undefined, adminToken);
    const mine = sites.data.sites.find((s: any) => s.projectId === id);
    assert.equal(mine.hosting.platform, 'mock');
    assert.equal(mine.hosting.simulated, true);
    const { getDatabase } = await import('./helpers/testContext.js');
    const db: any = getDatabase();
    const actions = db.prepare('SELECT action FROM audit_logs WHERE resource_id = ?').all(id).map((r: any) => r.action);
    for (const expected of ['PUBLISH_PROJECT', 'PUBLISH_REQUESTED', 'DEPLOYMENT_READY']) assert.ok(actions.includes(expected), `missing audit ${expected}`);
  });

  test('deleting a project removes its hosting and deployment history', async () => {
    const id = await newProject('Deleted Club');
    await call('POST', `/api/projects/${id}/publishing/publish`, {}, adminToken);
    assert.equal((await call('DELETE', `/api/projects/${id}`, undefined, adminToken)).status, 200);
    const { getDatabase } = await import('./helpers/testContext.js');
    const db: any = getDatabase();
    assert.equal(db.prepare('SELECT COUNT(*) c FROM site_deployments WHERE project_id = ?').get(id).c, 0);
    assert.equal(db.prepare('SELECT COUNT(*) c FROM site_hosting WHERE project_id = ?').get(id).c, 0);
  });
});

describe('Vercel webhook', () => {
  const body = JSON.stringify({ type: 'deployment.ready', payload: { deployment: { id: 'dpl_unknown' } } });
  const sign = (secret: string, payload: string) => createHmac('sha1', secret).update(payload).digest('hex');

  test('does not exist without a configured secret', async () => {
    const r = await call('POST', '/api/vercel/webhook', body);
    assert.equal(r.status, 404);
  });

  test('rejects a bad or missing signature and accepts a valid one', async () => {
    process.env.VERCEL_WEBHOOK_SECRET = 'webhook-secret-for-tests';
    assert.equal((await call('POST', '/api/vercel/webhook', body)).status, 401);
    assert.equal((await call('POST', '/api/vercel/webhook', body, undefined, { 'x-vercel-signature': sign('wrong-secret', body) })).status, 401);
    const ok = await call('POST', '/api/vercel/webhook', body, undefined, { 'x-vercel-signature': sign('webhook-secret-for-tests', body) });
    assert.equal(ok.status, 200);
    assert.equal(ok.data.received, true);
  });
});
