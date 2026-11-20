import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHmac } from 'node:crypto';

import { getPublishingConfig } from '../../src/config.js';
import { VercelClient, VercelApiError, mapReadyState, scrubSecrets, sha1Hex } from '../../src/services/publishing/vercelClient.js';
import { VercelProvider } from '../../src/services/publishing/providers/vercelProvider.js';
import {
  absolutizeMedia, buildSiteDataPayload, escapeJsonForHtml, exportOfflinePage, exportSite,
  isSafeBundlePath, loadSiteBundle, offlinePageHtml, resetSiteBundleCache, ExportError
} from '../../src/services/publishing/siteExporter.js';
import { verifyVercelSignature } from '../../src/routes/vercelWebhook.js';

const TOKEN = 'vercel_unit_SENTINEL_0123456789abcdef';
const realFetch = globalThis.fetch;

interface Recorded { url: URL; method: string; headers: Record<string, string>; body: any; rawBody?: string }
let calls: Recorded[] = [];
type Responder = (req: Recorded) => { status?: number; json?: unknown; headers?: Record<string, string> } | Error;
let responders: Responder[] = [];

function installFetch(handler: Responder) {
  responders = [handler];
  calls = [];
  globalThis.fetch = (async (input: any, init: any = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(init.headers || {})) headers[k.toLowerCase()] = String(v);
    let body: any;
    let rawBody: string | undefined;
    if (typeof init.body === 'string') { rawBody = init.body; try { body = JSON.parse(init.body); } catch { body = init.body; } }
    else if (init.body) body = init.body;
    const rec: Recorded = { url, method: init.method || 'GET', headers, body, rawBody };
    calls.push(rec);
    const out = responders[0](rec);
    if (out instanceof Error) throw out;
    const status = out.status ?? 200;
    const text = out.json === undefined ? '' : JSON.stringify(out.json);
    return new Response(status === 204 ? null : text, { status, headers: out.headers });
  }) as typeof fetch;
}

afterEach(() => { globalThis.fetch = realFetch; });

const client = () => new VercelClient({ token: TOKEN, teamId: 'team_abc', retryDelayMs: 0 });

describe('publishing configuration', () => {
  const keys = ['VERCEL_ENABLED', 'VERCEL_TOKEN', 'VERCEL_TEAM_ID', 'PUBLISH_MOCK_MODE', 'PUBLISH_MOCK_STEP_MS', 'PUBLISH_MOCK_OUTCOME', 'VERCEL', 'VERCEL_ENV', 'NODE_ENV', 'DIGIVERSE_VERCEL_TOKEN', 'DIGIVERSE_VERCEL_API_TOKEN', 'DIGIVERSE_VERCEL_TEAM_ID', 'DIGIVERSE_VERCEL_ENABLED'];
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => { for (const k of keys) { saved[k] = process.env[k]; delete process.env[k]; } process.env.NODE_ENV = 'test'; });
  afterEach(() => { for (const k of keys) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } });

  test('nothing set: not configured', () => {
    const c = getPublishingConfig();
    assert.equal(c.mode, 'not_configured');
    assert.equal(c.enabled, false);
  });
  test('enabled with token: live', () => {
    process.env.VERCEL_ENABLED = 'true'; process.env.VERCEL_TOKEN = TOKEN; process.env.VERCEL_TEAM_ID = 'team_x';
    const c = getPublishingConfig();
    assert.equal(c.mode, 'live'); assert.equal(c.teamId, 'team_x');
  });
  test('enabled without token: not configured (never silently falls back to mock)', () => {
    process.env.VERCEL_ENABLED = 'true'; process.env.PUBLISH_MOCK_MODE = 'true';
    assert.equal(getPublishingConfig().mode, 'not_configured');
  });
  test('token alone (VERCEL_ENABLED=false) does not enable real deployments', () => {
    process.env.VERCEL_TOKEN = TOKEN;
    assert.equal(getPublishingConfig().mode, 'not_configured');
  });
  test('mock mode is explicit and local only', () => {
    process.env.PUBLISH_MOCK_MODE = 'true';
    assert.equal(getPublishingConfig().mode, 'mock');
    process.env.VERCEL = '1';
    assert.equal(getPublishingConfig().mode, 'not_configured', 'never on the Vercel runtime');
    delete process.env.VERCEL; process.env.NODE_ENV = 'production';
    assert.equal(getPublishingConfig().mode, 'not_configured', 'never in production');
  });
  test('DIGIVERSE_VERCEL_* aliases work', () => {
    process.env.DIGIVERSE_VERCEL_ENABLED = '1'; process.env.DIGIVERSE_VERCEL_TOKEN = TOKEN; process.env.DIGIVERSE_VERCEL_TEAM_ID = 'team_y';
    const c = getPublishingConfig();
    assert.equal(c.mode, 'live'); assert.equal(c.teamId, 'team_y');
  });
});

describe('VercelClient', () => {
  test('creates a project: official path, bearer token, teamId, body', async () => {
    installFetch(() => ({ json: { id: 'prj_1', name: 'dv-site-abc' } }));
    const p = await client().createProject('dv-site-abc');
    assert.deepEqual(p, { id: 'prj_1', name: 'dv-site-abc' });
    const c = calls[0];
    assert.equal(c.method, 'POST');
    assert.equal(c.url.origin + c.url.pathname, 'https://api.vercel.com/v11/projects');
    assert.equal(c.url.searchParams.get('teamId'), 'team_abc');
    assert.equal(c.headers.authorization, `Bearer ${TOKEN}`);
    assert.equal(c.body.name, 'dv-site-abc');
  });

  test('retries project creation without ssoProtection when Vercel rejects the field', async () => {
    let n = 0;
    installFetch((req) => (++n === 1 ? { status: 400, json: { error: { code: 'bad_request', message: 'invalid ssoProtection' } } } : { json: { id: 'prj_2', name: req.body.name } }));
    const p = await client().createProject('x');
    assert.equal(p.id, 'prj_2');
    assert.ok('ssoProtection' in calls[0].body);
    assert.ok(!('ssoProtection' in calls[1].body));
  });

  test('creates a deployment with file references and inline files', async () => {
    installFetch(() => ({ json: { id: 'dpl_1', url: 'site-abc.vercel.app', readyState: 'QUEUED', alias: [], inspectorUrl: 'https://vercel.com/x' } }));
    const d = await client().createDeployment({
      name: 'dv-site', projectId: 'prj_1',
      files: [{ file: 'index.html', data: 'PGh0bWw+', encoding: 'base64' }, { file: 'assets/a.js', sha: 'a'.repeat(40), size: 12 }],
      meta: { digiverseProject: 'p1' }
    });
    assert.equal(d.id, 'dpl_1'); assert.equal(d.readyState, 'QUEUED');
    const c = calls[0];
    assert.equal(c.url.pathname, '/v13/deployments');
    assert.equal(c.url.searchParams.get('skipAutoDetectionConfirmation'), '1');
    assert.equal(c.body.target, 'production');
    assert.equal(c.body.project, 'prj_1');
    assert.deepEqual(c.body.files[1], { file: 'assets/a.js', sha: 'a'.repeat(40), size: 12 });
    assert.equal(c.body.files[0].encoding, 'base64');
    assert.equal(c.body.projectSettings.framework, null);
  });

  test('uploads files by SHA1 digest with a raw body', async () => {
    installFetch(() => ({ json: {} }));
    const content = Buffer.from('hello');
    await client().uploadFile(sha1Hex(content), content);
    const c = calls[0];
    assert.equal(c.url.pathname, '/v2/files');
    assert.equal(c.headers['x-vercel-digest'], sha1Hex(content));
    assert.equal(c.headers['content-length'], '5');
    assert.equal(c.headers['content-type'], 'application/octet-stream');
  });

  test('maps errors to safe codes and never includes the token', async () => {
    installFetch(() => ({ status: 401, json: { error: { code: 'forbidden', message: `invalid token ${TOKEN}` } } }));
    await assert.rejects(client().getDeployment('dpl_1'), (e: any) => {
      assert.ok(e instanceof VercelApiError); assert.equal(e.code, 'VERCEL_AUTH');
      assert.ok(!e.message.includes(TOKEN)); assert.ok(!JSON.stringify(e).includes(TOKEN)); return true;
    });
    installFetch(() => ({ status: 404, json: { error: { message: 'nope' } } }));
    await assert.rejects(client().getDeployment('x'), (e: any) => e.code === 'VERCEL_NOT_FOUND');
    installFetch(() => ({ status: 409, json: { error: { message: 'exists' } } }));
    await assert.rejects(client().createProject('x'), (e: any) => e.code === 'VERCEL_CONFLICT');
  });

  test('retries 429 and 5xx, then reports the failure', async () => {
    let n = 0;
    installFetch(() => (++n < 3 ? { status: 429, json: { error: { message: 'slow down' } } } : { json: { id: 'dpl_9', readyState: 'READY' } }));
    assert.equal((await client().getDeployment('dpl_9')).readyState, 'READY');
    assert.equal(calls.length, 3);
    installFetch(() => ({ status: 503, json: {} }));
    await assert.rejects(client().getDeployment('dpl_9'), (e: any) => e.code === 'VERCEL_UNAVAILABLE');
    assert.equal(calls.length, 3, 'initial attempt plus two retries');
  });

  test('network failures become VERCEL_NETWORK', async () => {
    installFetch(() => new Error('ECONNRESET'));
    await assert.rejects(client().getDeployment('x'), (e: any) => e.code === 'VERCEL_NETWORK' && !e.message.includes('ECONNRESET'));
  });

  test('recognises the missing-files error and its digests', async () => {
    installFetch(() => ({ status: 400, json: { error: { code: 'missing_files', message: 'Missing files', missing: ['b'.repeat(40)] } } }));
    await assert.rejects(client().createDeployment({ name: 'n', projectId: 'p', files: [] }), (e: any) => e.code === 'VERCEL_MISSING_FILES' && e.missing[0] === 'b'.repeat(40));
  });

  test('log lines are filtered, trimmed and scrubbed; failures return an empty list', async () => {
    installFetch(() => ({ json: [
      { type: 'stdout', created: 1, payload: { text: `Deploying with Bearer abcdefghijklmnop and ${TOKEN}` } },
      { type: 'metric', payload: { text: 'ignored' } },
      { type: 'stderr', payload: { text: 'Build failed', level: 'error' } }
    ] }));
    const lines = await client().getDeploymentLogs('dpl_1');
    assert.equal(lines.length, 2);
    assert.ok(lines.every((l) => !l.text.includes(TOKEN) && !/Bearer abcdefghijklmnop/.test(l.text)));
    installFetch(() => ({ status: 500, json: {} }));
    assert.deepEqual(await client().getDeploymentLogs('dpl_1'), []);
  });

  test('verifies credentials with read-only calls and returns no token', async () => {
    installFetch((req) => (req.url.pathname === '/v2/user' ? { json: { user: { username: 'digiverse-owner' } } } : { json: { id: 'team_abc', name: 'DigiVerse', slug: 'digiverse' } }));
    const r = await client().verifyAccess();
    assert.equal(r.tokenValid, true); assert.equal(r.username, 'digiverse-owner'); assert.equal(r.team?.name, 'DigiVerse');
    assert.ok(calls.every((c) => c.method === 'GET'));
    assert.ok(!JSON.stringify(r).includes(TOKEN));
  });

  test('the token cannot be read back from the client object', () => {
    const c = client();
    assert.ok(!JSON.stringify(c).includes(TOKEN));
    assert.ok(!Object.values(c as any).some((v) => v === TOKEN));
    assert.throws(() => new VercelClient({ token: '' }), (e: any) => e.code === 'VERCEL_AUTH');
  });

  test('state mapping and secret scrubbing helpers', () => {
    assert.equal(mapReadyState('READY'), 'ready'); assert.equal(mapReadyState('ERROR'), 'failed');
    assert.equal(mapReadyState('CANCELED'), 'canceled'); assert.equal(mapReadyState('QUEUED'), 'queued');
    assert.equal(mapReadyState('INITIALIZING'), 'building'); assert.equal(mapReadyState('BUILDING'), 'building');
    assert.equal(scrubSecrets(`x ${TOKEN} y`, TOKEN), 'x [redacted] y');
  });
});

describe('VercelProvider', () => {
  const file = (p: string, content: string) => { const b = Buffer.from(content); return { path: p, size: b.length, sha1: sha1Hex(b), content: undefined as Buffer | undefined, absolutePath: undefined as string | undefined, _b: b }; };

  test('creates one project per site and reuses it', async () => {
    installFetch((req) => ({ json: { id: 'prj_77', name: req.body.name } }));
    const provider = new VercelProvider(client());
    const h1 = await provider.ensureHosting({ projectId: 'p1', siteSlug: 'my-club', existing: null });
    assert.equal(h1.provider, 'vercel'); assert.equal(h1.providerProjectId, 'prj_77');
    assert.match(h1.providerProjectName!, /^dv-my-club-[0-9a-f]{6}$/);
    assert.equal(h1.productionUrl, `https://${h1.providerProjectName}.vercel.app`);
    const h2 = await provider.ensureHosting({ projectId: 'p1', siteSlug: 'my-club', existing: h1 });
    assert.equal(h2.providerProjectId, 'prj_77');
    assert.equal(calls.filter((c) => c.url.pathname === '/v11/projects').length, 1, 'no second project');
  });

  test('uploads missing files once, then retries the deployment', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dv-prov-'));
    const asset = path.join(dir, 'a.js'); fs.writeFileSync(asset, 'console.log(1)');
    const sha = sha1Hex(fs.readFileSync(asset));
    let deployCalls = 0;
    installFetch((req) => {
      if (req.url.pathname === '/v2/files') return { json: {} };
      if (req.url.pathname === '/v13/deployments') {
        return ++deployCalls === 1
          ? { status: 400, json: { error: { code: 'missing_files', message: 'm', missing: [sha] } } }
          : { json: { id: 'dpl_5', url: 'x-1.vercel.app', readyState: 'QUEUED' } };
      }
      return { json: {} };
    });
    const provider = new VercelProvider(client());
    const res = await provider.deploy({
      projectId: 'p1', siteSlug: 's', kind: 'publish',
      hosting: { projectId: 'p1', provider: 'vercel', providerProjectId: 'prj_1', providerProjectName: 'dv-s-abc', createdAt: '', updatedAt: '' },
      site: { files: [
        { path: 'index.html', size: 3, sha1: sha1Hex('abc'), content: Buffer.from('abc') },
        { path: 'assets/a.js', size: 14, sha1: sha, absolutePath: asset }
      ], bundleHash: 'h', fileCount: 2, totalBytes: 17 }
    });
    assert.equal(res.providerDeploymentId, 'dpl_5'); assert.equal(res.status, 'queued');
    assert.equal(calls.filter((c) => c.url.pathname === '/v2/files').length, 1);
    assert.equal(deployCalls, 2);
  });

  test('recreates the project when it was deleted on Vercel', async () => {
    let first = true;
    installFetch((req) => {
      if (req.url.pathname === '/v13/deployments') {
        if (first) { first = false; return { status: 404, json: { error: { message: 'project not found' } } }; }
        return { json: { id: 'dpl_6', readyState: 'QUEUED' } };
      }
      if (req.url.pathname === '/v11/projects') return { json: { id: 'prj_new', name: req.body.name } };
      return { json: {} };
    });
    const res = await new VercelProvider(client()).deploy({
      projectId: 'p1', siteSlug: 'abc', kind: 'publish',
      hosting: { projectId: 'p1', provider: 'vercel', providerProjectId: 'prj_gone', providerProjectName: 'dv-abc-1', createdAt: '', updatedAt: '' },
      site: { files: [{ path: 'index.html', size: 1, sha1: sha1Hex('a'), content: Buffer.from('a') }], bundleHash: 'h', fileCount: 1, totalBytes: 1 }
    });
    assert.equal(res.hosting?.providerProjectId, 'prj_new');
  });

  test('ready state returns the production alias; failure carries Vercel\'s reason', async () => {
    const hosting = { projectId: 'p1', provider: 'vercel' as const, providerProjectId: 'prj_1', providerProjectName: 'dv-s-abc', createdAt: '', updatedAt: '' };
    const dep = { id: 'd', projectId: 'p1', provider: 'vercel' as const, kind: 'publish' as const, providerDeploymentId: 'dpl_1', status: 'building' as const, createdAt: '', updatedAt: '' };
    installFetch(() => ({ json: { id: 'dpl_1', url: 'dv-s-abc-hash.vercel.app', readyState: 'READY', alias: ['other.vercel.app', 'dv-s-abc.vercel.app'] } }));
    const ok = await new VercelProvider(client()).getState(dep, hosting);
    assert.deepEqual([ok.status, ok.url], ['ready', 'https://dv-s-abc.vercel.app']);
    installFetch(() => ({ json: { id: 'dpl_1', readyState: 'ERROR', errorCode: 'BUILD_UTILS_SPAWN_1', errorMessage: 'Something broke' } }));
    const bad = await new VercelProvider(client()).getState(dep, hosting);
    assert.deepEqual([bad.status, bad.errorMessage], ['failed', 'Something broke']);
  });

  test('releasing hosting deletes only the client\'s own project', async () => {
    installFetch(() => ({ status: 204 }));
    await new VercelProvider(client()).releaseHosting({ projectId: 'p1', provider: 'vercel', providerProjectId: 'prj_9', createdAt: '', updatedAt: '' });
    assert.equal(calls[0].method, 'DELETE'); assert.equal(calls[0].url.pathname, '/v9/projects/prj_9');
  });
});

describe('site exporter', () => {
  const site: any = {
    projectId: 'p1', slug: 'my-club', status: 'live', organizationName: 'Club </script><script>alert(1)</script>',
    seo: { title: 'T "quoted" <b>', description: 'D' }, publishedAt: '2026-01-01T00:00:00.000Z', updatedAt: '',
    website: {
      heroHeadline: 'Hello </script><img src=x onerror=alert(1)>',
      heroImage: '/api/media/uploads/hero.png',
      requirements: { contactEmail: 'private@secret.example' },
      eventData: { rsvpSubmissions: [{ name: 'Guest' }], profile: { name: 'E' } }
    }
  };

  function makeBundle(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dv-bundle-'));
    fs.mkdirSync(path.join(dir, 'files', 'assets'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'site.html'), '<!doctype html><html><head><title>x</title><meta name="description" content="d"></head><body><div id="root"></div></body></html>');
    const js = Buffer.from('console.log(1)');
    fs.writeFileSync(path.join(dir, 'files', 'assets', 'app.js'), js);
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ files: [{ path: 'assets/app.js', sha1: sha1Hex(js), size: js.length }] }));
    return dir;
  }

  beforeEach(() => { resetSiteBundleCache(); delete process.env.PUBLIC_APP_URL; });
  afterEach(() => { delete process.env.SITE_BUNDLE_DIR; delete process.env.PUBLIC_APP_URL; resetSiteBundleCache(); });

  test('escapes JSON so it cannot close the script element', () => {
    const out = escapeJsonForHtml(JSON.stringify({ a: '</script><!--', b: 'x y' }));
    assert.ok(!out.includes('</script>') && !out.includes('<!--') && !out.includes(' '));
    assert.deepEqual(JSON.parse(out), { a: '</script><!--', b: 'x y' });
  });

  test('the payload carries no private data and absolute media URLs', () => {
    const p = buildSiteDataPayload(site, 'https://x.example', 'https://app.example');
    assert.equal(p.generatedWebsite.heroImage, 'https://app.example/api/media/uploads/hero.png');
    assert.ok(!('requirements' in p.generatedWebsite));
    assert.ok(!JSON.stringify(p).includes('private@secret.example'));
    assert.ok(!JSON.stringify(p).includes('rsvpSubmissions'));
    assert.equal(p.standalone, true);
  });

  test('uploaded media without a public origin is a clear error', () => {
    assert.throws(() => buildSiteDataPayload(site, 'https://x.example', undefined), (e: any) => e instanceof ExportError && e.code === 'MEDIA_ORIGIN_MISSING');
    assert.equal(absolutizeMedia({ a: ['/api/media/x'] }, 'https://o').rewritten, 1);
  });

  test('a built bundle becomes a safe file set with generated files first', async () => {
    process.env.SITE_BUNDLE_DIR = makeBundle();
    process.env.PUBLIC_APP_URL = 'https://app.example';
    const out = await exportSite({ site, canonicalUrl: 'https://dv-my-club-abc.vercel.app', requireBundle: true });
    const paths = out.files.map((f) => f.path);
    assert.deepEqual(paths.slice(0, 3), ['index.html', 'vercel.json', 'robots.txt']);
    assert.ok(paths.includes('assets/app.js'));
    const index = out.files[0].content!.toString('utf8');
    assert.equal((index.match(/<\/script>/g) || []).length, 1, 'only our own data script closes; client text cannot add one');
    assert.ok(!index.includes('<img src=x'), 'no client markup reaches the page unescaped');
    assert.ok(index.includes('id="dv-site-data"'));
    assert.ok(index.includes('<link rel="canonical" href="https://dv-my-club-abc.vercel.app"'));
    assert.ok(!index.includes('<meta name="description" content="d">'), 'template description replaced');
    assert.match(out.bundleHash, /^[0-9a-f]{40}$/);
    const vercelJson = JSON.parse(out.files[1].content!.toString('utf8'));
    assert.equal(vercelJson.rewrites[0].destination, '/index.html');
    assert.ok(out.files.every((f) => isSafeBundlePath(f.path)));
  });

  test('noindex produces a disallow robots file', async () => {
    process.env.SITE_BUNDLE_DIR = makeBundle();
    process.env.PUBLIC_APP_URL = 'https://app.example';
    const out = await exportSite({ site: { ...site, seo: { noIndex: true } }, canonicalUrl: 'https://x.example', requireBundle: true });
    assert.match(out.files[2].content!.toString(), /Disallow: \//);
  });

  test('a missing bundle is an error for real deployments and tolerated for simulated ones', async () => {
    process.env.SITE_BUNDLE_DIR = path.join(os.tmpdir(), 'definitely-not-here');
    process.env.PUBLIC_APP_URL = 'https://app.example';
    const bundle = await loadSiteBundle();
    // Falls back to a built client folder when present; force the "nothing built" case by checking the error path directly.
    if (!bundle) {
      await assert.rejects(exportSite({ site, canonicalUrl: 'https://x', requireBundle: true }), (e: any) => e.code === 'BUNDLE_MISSING');
    }
    const sim = await exportSite({ site, canonicalUrl: 'https://x', requireBundle: false });
    assert.ok(sim.files.some((f) => f.path === 'index.html'));
  });

  test('a manifest with an unsafe path is rejected', async () => {
    const dir = makeBundle();
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
    manifest.files.push({ path: '../../etc/passwd', sha1: 'a'.repeat(40), size: 1 });
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
    process.env.SITE_BUNDLE_DIR = dir;
    await assert.rejects(loadSiteBundle(), (e: any) => e.code === 'BUNDLE_INVALID');
    for (const bad of ['../x', '/abs', 'a/../b', '.env', 'a//b', 'sp ace', 'a\\b']) assert.equal(isSafeBundlePath(bad), false, bad);
    assert.equal(isSafeBundlePath('assets/index-abc123.js'), true);
  });

  test('the offline page escapes the organisation name and is noindex', () => {
    const html = offlinePageHtml('<b>"Bad" & Co</b>');
    assert.ok(!html.includes('<b>')); assert.ok(html.includes('noindex'));
    const off = exportOfflinePage('X');
    assert.deepEqual(off.files.map((f) => f.path), ['index.html', 'vercel.json', 'robots.txt']);
  });
});

describe('webhook signature', () => {
  test('accepts only the exact HMAC-SHA1 of the raw body', () => {
    const raw = Buffer.from('{"type":"deployment.ready"}');
    const sig = createHmac('sha1', 's3cret').update(raw).digest('hex');
    assert.equal(verifyVercelSignature(raw, sig, 's3cret'), true);
    assert.equal(verifyVercelSignature(raw, sig.toUpperCase(), 's3cret'), true);
    assert.equal(verifyVercelSignature(raw, sig, 'other'), false);
    assert.equal(verifyVercelSignature(Buffer.from('{"type":"x"}'), sig, 's3cret'), false);
    assert.equal(verifyVercelSignature(raw, undefined, 's3cret'), false);
    assert.equal(verifyVercelSignature(raw, 'short', 's3cret'), false);
    assert.equal(verifyVercelSignature(raw, sig, ''), false);
  });
});
