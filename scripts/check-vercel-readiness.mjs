/**
 * DigiVerse Vercel readiness check (no Vercel account, no network deploy).
 *
 * 1. Static checks on vercel.json, the function entry and the build output.
 * 2. Loads the BUILT function entry (api/index.js -> server/dist/app.js) with
 *    VERCEL=1 and drives it over HTTP the way Vercel's proxy would
 *    (X-Forwarded-* headers, /api and /live rewrites), using an in-memory
 *    Postgres (PGlite) instead of a hosted database.
 *
 * THIS IS A LOCAL SIMULATION. It cannot prove what only a real Vercel build proves: that the
 * function bundler traces server/node_modules into api/index.js, that rewrites resolve in the
 * documented order, and that the dashboard settings match. See "NOT VERIFIED" in the output.
 *
 * Usage (repository root, after `npm run build`):
 *   node scripts/check-vercel-readiness.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const results = [];

function check(name, ok, detail = '') {
  results.push({ check: name, result: ok ? 'PASS' : 'FAIL', detail });
}

// ---------------------------------------------------------------------------
// 1. Static checks
// ---------------------------------------------------------------------------
const vercelConfig = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const rewrites = vercelConfig.rewrites || [];

check('vercel.json: API rewrite', rewrites.some((r) => r.source === '/api/(.*)' && r.destination === '/api'));
check('vercel.json: SEO rewrite for /live/:slug', rewrites.some((r) => r.source === '/live/:slug' && r.destination === '/api'));
check('vercel.json: SPA fallback is last', rewrites.at(-1)?.destination === '/index.html');
check('vercel.json: unknown /assets/* returns a real 404 (routed before the SPA fallback)',
  rewrites.findIndex((r) => r.source === '/assets/(.*)') > -1 &&
  rewrites.findIndex((r) => r.source === '/assets/(.*)') < rewrites.findIndex((r) => r.destination === '/index.html'));
check('vercel.json: one project, controlled from the repository root (framework null, no builds/projects/services keys)',
  vercelConfig.framework === null && !('builds' in vercelConfig) && !('projects' in vercelConfig) && !('services' in vercelConfig) && !('experimentalServices' in vercelConfig));
check('no vercel.json inside client/ or server/ (they would be ignored and confuse project detection)',
  !fs.existsSync(path.join(root, 'client/vercel.json')) && !fs.existsSync(path.join(root, 'server/vercel.json')));
{
  // A linked .vercel/project.json with a rootDirectory would silently deploy only client/ or server/.
  const link = path.join(root, '.vercel/project.json');
  if (fs.existsSync(link)) {
    let linked = {};
    try { linked = JSON.parse(fs.readFileSync(link, 'utf8')); } catch { /* ignore */ }
    check('.vercel/project.json does not pin a sub-directory', !linked.settings?.rootDirectory, JSON.stringify(linked.settings?.rootDirectory ?? null));
  }
}
{
  const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
  const rootPkg = readJson('package.json');
  const serverPkg = readJson('server/package.json');
  check('root package.json pins Node 22.x (Vercel reads only the root engines)', /^22\./.test(rootPkg.engines?.node || ''), rootPkg.engines?.node);
  check('server engines are satisfied by the pinned Node major', /22/.test(serverPkg.engines?.node || ''), serverPkg.engines?.node);
  for (const dir of ['client', 'server']) {
    const lockPath = path.join(root, dir, 'package-lock.json');
    if (!fs.existsSync(lockPath)) { check(`${dir}/package-lock.json exists (npm ci needs it)`, false); continue; }
    const pkg = readJson(`${dir}/package.json`);
    const rootEntry = readJson(`${dir}/package-lock.json`).packages?.[''] ?? {};
    const drift = ['dependencies', 'devDependencies'].flatMap((k) =>
      Object.entries(pkg[k] ?? {}).filter(([name, spec]) => rootEntry[k]?.[name] !== spec).map(([name]) => name));
    check(`${dir}/package-lock.json matches ${dir}/package.json (npm ci will not fail)`, drift.length === 0, drift.join(', '));
  }
  const include = vercelConfig.functions?.['api/index.js']?.includeFiles || '';
  check('includeFiles targets exist after the build (client/dist/index.html, server/dist/site-bundle)',
    /client\/dist\/index\.html/.test(include) && fs.existsSync(path.join(root, 'client/dist/index.html')) &&
    /server\/dist\/site-bundle/.test(include) && fs.existsSync(path.join(root, 'server/dist/site-bundle/manifest.json')));
  check('root package.json build script builds server, client and the site bundle',
    ['build --prefix server', 'build --prefix client', 'build:site-bundle'].every((part) => (rootPkg.scripts?.build || '').includes(part)));
}
{
  const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
  check('.gitignore keeps env files, databases, backups, journals and .vercel out of git',
    /^\.env\.\*$/m.test(gitignore) && /^\.vercel\/$/m.test(gitignore) && /^server\/data\/\*$/m.test(gitignore) && /journal\.json/.test(gitignore));
}
check('vercel.json: function maxDuration within Hobby limit (<= 60s)', (vercelConfig.functions?.['api/index.js']?.maxDuration ?? 10) <= 60);
check('api/index.js exists', fs.existsSync(path.join(root, 'api/index.js')));
check('server/dist/app.js built', fs.existsSync(path.join(root, 'server/dist/app.js')));
check('client/dist/index.html built', fs.existsSync(path.join(root, vercelConfig.outputDirectory, 'index.html')));

// Centralized publishing: the standalone site bundle every client deployment is made from.
check('vercel.json: build creates the site bundle', /build-site-bundle\.mjs/.test(vercelConfig.buildCommand || ''), vercelConfig.buildCommand);
check('vercel.json: the function includes the site bundle', /server\/dist\/site-bundle/.test(vercelConfig.functions?.['api/index.js']?.includeFiles || ''));
check('client/dist/site.html built (standalone site entry)', fs.existsSync(path.join(root, vercelConfig.outputDirectory, 'site.html')));
const bundleDir = path.join(root, 'server/dist/site-bundle');
check('site bundle built (server/dist/site-bundle)', fs.existsSync(path.join(bundleDir, 'site.html')) && fs.existsSync(path.join(bundleDir, 'manifest.json')));
try {
  const manifest = JSON.parse(fs.readFileSync(path.join(bundleDir, 'manifest.json'), 'utf8'));
  const safe = /^[A-Za-z0-9][A-Za-z0-9._@~+\-/]*$/;
  check('site bundle manifest: every file listed, safe and present',
    manifest.files.length > 0 && manifest.files.every((f) => safe.test(f.path) && !f.path.includes('..') && fs.existsSync(path.join(bundleDir, 'files', f.path))),
    `${manifest.files.length} files`);
  check('site bundle excludes the DigiVerse admin shell', !manifest.files.some((f) => f.path === 'index.html' || f.path === 'site.html'));
} catch (error) {
  check('site bundle manifest readable', false, error instanceof Error ? error.message : String(error));
}
const envExample = fs.readFileSync(path.join(root, 'server/.env.example'), 'utf8');
check('server/.env.example documents VERCEL_ENABLED / VERCEL_TOKEN / VERCEL_TEAM_ID',
  ['VERCEL_ENABLED=', 'VERCEL_TOKEN=', 'VERCEL_TEAM_ID='].every((k) => envExample.includes(k)));
check('server/.env.example ships with real publishing OFF', /^VERCEL_ENABLED=false$/m.test(envExample) && /^VERCEL_TOKEN=$/m.test(envExample));
{
  // Tokens must never be readable by the browser bundle.
  const publicFiles = fs.existsSync(assetsDirForTokens()) ? fs.readdirSync(assetsDirForTokens()).filter((f) => f.endsWith('.js')) : [];
  const hit = publicFiles.some((f) => /VERCEL_TOKEN|VERCEL_WEBHOOK_SECRET/.test(fs.readFileSync(path.join(assetsDirForTokens(), f), 'utf8')));
  check('client bundle never references the Vercel token variables', publicFiles.length > 0 && !hit);
}
function assetsDirForTokens() { return path.join(root, 'client/dist/assets'); }

const vercelIgnore = fs.readFileSync(path.join(root, '.vercelignore'), 'utf8');
check('.vercelignore excludes server/data (local DB and uploads)', /^server\/data$/m.test(vercelIgnore));
check('.vercelignore excludes .env files', /\.env/.test(vercelIgnore));

// No secrets in the public bundle.
const assetsDir = path.join(root, 'client/dist/assets');
const bundle = fs.existsSync(assetsDir)
  ? fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(assetsDir, f), 'utf8')).join('\n')
  : '';
const secretPatterns = [/postgres(ql)?:\/\/[^\s"']+@/i, /vercel_blob_rw_[A-Za-z0-9]+/, /JWT_SECRET\s*[:=]\s*["'][^"']{8,}/];
check('client bundle contains no connection strings or tokens', bundle.length > 0 && !secretPatterns.some((p) => p.test(bundle)));

// ---------------------------------------------------------------------------
// 2. Runtime simulation of the Vercel function
// ---------------------------------------------------------------------------
process.env.VERCEL = '1';
// 'development' = Vercel runtime behaviour without being a production/preview deployment (PGlite is refused on those).
process.env.VERCEL_ENV = 'development';
process.env.DATABASE_DRIVER = 'pglite';
process.env.JWT_SECRET = 'readiness-check-secret-longer-than-thirty-two-chars';
process.env.SETUP_KEY = 'readiness-check-setup-key-0123456789';
delete process.env.DATABASE_URL;
delete process.env.BLOB_READ_WRITE_TOKEN;
process.chdir(root); // Vercel functions run with the project root as cwd.

const { default: handler } = await import(pathToFileURL(path.join(root, 'api/index.js')).href);
const server = http.createServer((req, res) => handler(req, res));
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

async function request(method, route, { body, headers = {} } = {}) {
  const res = await fetch(base + route, {
    method,
    headers: {
      'content-type': 'application/json',
      // What Vercel's proxy sends: the real client address and public host.
      'x-forwarded-for': '203.0.113.10',
      'x-forwarded-proto': 'https',
      'x-forwarded-host': 'digiverse-example.vercel.app',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual'
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* html */ }
  return { status: res.status, data, text, headers: res.headers };
}

try {
  const health = await request('GET', '/api/health');
  check('GET /api/health on Vercel runtime', health.status === 200 && health.data?.runtime === 'vercel', health.data?.database?.engine);

  const status = await request('GET', '/api/auth/setup/status');
  check('Remote first-run setup requires SETUP_KEY', status.data?.requiresSetupKey === true && status.data?.remoteSetupAvailable === true);

  const noKey = await request('POST', '/api/auth/setup', {
    body: { username: 'owner', password: 'Readiness-Check-Pass-1', confirmPassword: 'Readiness-Check-Pass-1' }
  });
  check('Setup without key is refused remotely', noKey.status === 403, noKey.data?.error);

  const withKey = await request('POST', '/api/auth/setup', {
    body: {
      username: 'owner',
      password: 'Readiness-Check-Pass-1',
      confirmPassword: 'Readiness-Check-Pass-1',
      setupKey: process.env.SETUP_KEY
    }
  });
  check('Setup with key succeeds once', withKey.status === 201, withKey.data?.error || '');

  const token = withKey.data?.token;
  const config = await request('GET', '/api/sites/config', { headers: { authorization: `Bearer ${token}` } });
  check(
    'Public URLs use the forwarded https host',
    config.data?.publicAppUrl === 'https://digiverse-example.vercel.app',
    config.data?.routing?.pathPattern
  );

  const upload = await request('POST', '/api/media/upload', {
    headers: { authorization: `Bearer ${token}` },
    body: {
      filename: 'a.png',
      fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      assetType: 'logo'
    }
  });
  check(
    'Uploads refuse local disk on Vercel without Blob',
    upload.status === 500 && /Vercel Blob/.test(upload.data?.error || ''),
    upload.data?.error
  );

  const liveShell = await request('GET', '/live/not-published-yet');
  check(
    '/live/<slug> rewrite returns the app shell (SEO renderer)',
    liveShell.status === 404 && /<div id="root">/.test(liveShell.text),
    `HTTP ${liveShell.status}`
  );

  // Publishing endpoints exist, need a signed-in admin, and the webhook is hidden until a secret is configured.
  const pubConfig = await request('GET', '/api/publishing/config');
  check('GET /api/publishing/config requires authentication', pubConfig.status === 401, `HTTP ${pubConfig.status}`);
  const pubPublish = await request('POST', '/api/projects/proj_x/publishing/publish', { body: {} });
  check('POST .../publishing/publish requires authentication', pubPublish.status === 401, `HTTP ${pubPublish.status}`);
  const hook = await request('POST', '/api/vercel/webhook', { body: { type: 'deployment.ready' } });
  check('Vercel webhook is hidden (404) until VERCEL_WEBHOOK_SECRET is set', hook.status === 404, `HTTP ${hook.status}`);

  check('/api/health does not expose database paths or hosts',
    !/[\/]|\.db|@/.test(JSON.stringify(health.data?.database ?? {})), JSON.stringify(health.data?.database));

  const missingAsset = await request('GET', '/assets/not-a-real-chunk-123abc.js');
  check('Unknown /assets/* is a 404 with Cache-Control: no-store (not the SPA shell)',
    missingAsset.status === 404 && /no-store/.test(missingAsset.headers.get('cache-control') || '') && !/<div id="root">/.test(missingAsset.text),
    `HTTP ${missingAsset.status}`);

  const unknown = await request('GET', '/api/nope');
  check('Unknown API routes return JSON 404', unknown.status === 404 && Boolean(unknown.data?.error));
} catch (error) {
  check('Runtime simulation', false, error instanceof Error ? error.message : String(error));
} finally {
  server.close();
  const { closeDb } = await import(pathToFileURL(path.join(root, 'server/dist/db/database.js')).href);
  await closeDb();
}

console.table(results);
const failed = results.filter((r) => r.result === 'FAIL');
console.log(failed.length ? `${failed.length} check(s) failed.` : 'All local readiness checks passed. This was a LOCAL SIMULATION; no deployment was performed.');
console.log([
  'NOT VERIFIED by this script (only a real Vercel build/deploy can confirm):',
  '  - the function bundler traces server/node_modules (express, pg, ...) into api/index.js',
  '  - rewrite precedence (filesystem first, then /api, /live, /assets, SPA fallback) on the Vercel edge',
  '  - the Vercel Dashboard matches docs/deployment/VERCEL.md (Root Directory ./, Framework Other, no overrides)',
  '  - production DATABASE_URL / BLOB_READ_WRITE_TOKEN connectivity'
].join('\n'));
process.exit(failed.length ? 1 : 0);
