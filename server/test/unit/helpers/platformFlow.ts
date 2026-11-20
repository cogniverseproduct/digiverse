/**
 * End-to-end platform flow used by the Vercel-readiness tests.
 *
 * Runs entirely in-process against an isolated database (temporary SQLite
 * file or in-memory PGlite Postgres) and a temporary uploads folder. It never
 * touches server/data, never calls external services and needs no accounts.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

export interface IsolatedEnvironment {
  tempDir: string;
  indexHtmlPath: string;
}

/** Must be called BEFORE importing the app. */
export function prepareIsolatedEnvironment(driver: 'sqlite' | 'pglite'): IsolatedEnvironment {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `digiverse-${driver}-`));
  const indexHtmlPath = path.join(tempDir, 'index.html');

  fs.writeFileSync(
    indexHtmlPath,
    '<!doctype html><html><head><meta charset="UTF-8" />' +
      '<title>DigiVerse &mdash; Websites</title>' +
      '<meta name="description" content="DigiVerse marketing description" />' +
      '</head><body><div id="root"></div></body></html>'
  );

  process.env.NODE_ENV = 'test';
  process.env.DATABASE_DRIVER = driver;
  process.env.SQLITE_PATH = path.join(tempDir, 'test.db');
  process.env.UPLOADS_DIR = path.join(tempDir, 'uploads');
  process.env.INDEX_HTML_PATH = indexHtmlPath;
  process.env.JWT_SECRET = 'test-secret-that-is-definitely-longer-than-32-characters';
  delete process.env.DATABASE_URL;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.DIGIVERSE_VERCEL_API_TOKEN;
  delete process.env.SITES_ROOT_DOMAIN;
  delete process.env.PUBLIC_APP_URL;
  delete process.env.SETUP_KEY;
  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;
  // Publishing: no real Vercel in tests. Simulated mode with no delay; suites that test other modes change these themselves.
  for (const name of ['VERCEL_ENABLED', 'VERCEL_TOKEN', 'VERCEL_TEAM_ID', 'VERCEL_WEBHOOK_SECRET', 'DIGIVERSE_VERCEL_ENABLED', 'DIGIVERSE_VERCEL_TOKEN', 'DIGIVERSE_VERCEL_TEAM_ID', 'DIGIVERSE_VERCEL_WEBHOOK_SECRET', 'DIGIVERSE_VERCEL_PROJECT_ID', 'PUBLISH_MOCK_OUTCOME', 'SITE_BUNDLE_DIR']) {
    delete process.env[name];
  }
  process.env.PUBLISH_MOCK_MODE = 'true';
  process.env.PUBLISH_MOCK_STEP_MS = '0';

  return { tempDir, indexHtmlPath };
}

export async function startApp(): Promise<{ server: Server; baseUrl: string }> {
  const { default: app } = await import('../../../src/app.js');
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function call(
  baseUrl: string,
  method: string,
  route: string,
  body?: unknown,
  token?: string
): Promise<{ status: number; data: any; text: string }> {
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const text = await response.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  return { status: response.status, data, text };
}

const PASSWORD = 'Correct-Horse-Battery-42';

export async function runPlatformFlow(baseUrl: string, expectedDriver: string): Promise<void> {
  // --- Health -------------------------------------------------------------
  const health = await call(baseUrl, 'GET', '/api/health');
  assert.equal(health.status, 200, health.text);
  assert.equal(health.data.database.status, 'healthy');
  assert.match(health.data.database.engine, expectedDriver === 'pglite' ? /PGlite/ : /SQLite/);

  // --- First-run Super Admin setup (local request) ------------------------
  const status = await call(baseUrl, 'GET', '/api/auth/setup/status');
  assert.equal(status.data.setupRequired, true);
  assert.equal(status.data.requiresSetupKey, false);

  const setup = await call(baseUrl, 'POST', '/api/auth/setup', {
    username: 'owner',
    password: PASSWORD,
    confirmPassword: PASSWORD
  });
  assert.equal(setup.status, 201, setup.text);
  const ownerToken: string = setup.data.token;

  const setupAgain = await call(baseUrl, 'POST', '/api/auth/setup', {
    username: 'owner2',
    password: PASSWORD,
    confirmPassword: PASSWORD
  });
  assert.equal(setupAgain.status, 403, 'setup must be one-time only');

  // --- Admin invitation and account creation (transaction path) ---------
  const invite = await call(baseUrl, 'POST', '/api/admin/users', {
    email: 'operator@example.com',
    name: 'Operator One'
  }, ownerToken);
  assert.equal(invite.status, 201, invite.text);

  const complete = await call(baseUrl, 'POST', '/api/admin/access-requests/complete', {
    setupToken: invite.data.setupToken,
    username: 'operator',
    password: PASSWORD,
    confirmPassword: PASSWORD
  });
  assert.equal(complete.status, 201, complete.text);

  const reuse = await call(baseUrl, 'POST', '/api/admin/access-requests/complete', {
    setupToken: invite.data.setupToken,
    username: 'operator-two',
    password: PASSWORD,
    confirmPassword: PASSWORD
  });
  assert.equal(reuse.status, 409, 'setup links must be single-use');

  const login = await call(baseUrl, 'POST', '/api/auth/login', {
    identifier: 'operator',
    password: PASSWORD
  });
  assert.equal(login.status, 200, login.text);
  const adminToken: string = login.data.token;

  // --- Project intake + generation (fresh-database tenant insert) --------
  const created = await call(baseUrl, 'POST', '/api/projects', {
    requirements: {
      organizationName: 'Gram Seva Trust',
      category: 'ngo',
      contactPerson: 'Secretary',
      contactEmail: 'office@gramseva.example',
      tagline: 'Dignity for every village'
    }
  }, adminToken);
  assert.equal(created.status, 201, created.text);
  const projectId: string = created.data.project.id;

  const generated = await call(baseUrl, 'POST', `/api/projects/${projectId}/generate`, {}, adminToken);
  assert.equal(generated.status, 200, generated.text);
  assert.equal(generated.data.project.status, 'preview_ready');

  // Public visitor submission containing personal data.
  const volunteer = await call(baseUrl, 'POST', `/api/projects/${projectId}/volunteer`, {
    applicantName: 'Visitor Person',
    applicantEmail: 'private.visitor@example.com',
    applicantPhone: '+91 90000 00000'
  });
  assert.equal(volunteer.status, 201, volunteer.text);

  // --- No approval or payment gate ----------------------------------------
  // Publishing needs only the technical checks: the approval route is gone and nothing waits for a quotation or payment.
  const approvalGone = await call(baseUrl, 'POST', `/api/projects/${projectId}/approve`, { approvedBy: 'Client Representative' }, adminToken);
  assert.equal(approvalGone.status, 404, 'the approval route was removed');
  const early = await call(baseUrl, 'GET', `/api/projects/${projectId}/publishing/preflight?siteSlug=gram-seva`, undefined, adminToken);
  assert.equal(early.status, 200, early.text);
  assert.equal(early.data.isReadyToPublish, true, JSON.stringify(early.data.blockers));

  // --- Preflight + publish -------------------------------------------------
  const preflight = await call(baseUrl, 'GET', `/api/projects/${projectId}/publishing/preflight?siteSlug=gram-seva`, undefined, adminToken);
  assert.equal(preflight.status, 200, preflight.text);
  assert.equal(preflight.data.isReadyToPublish, true, JSON.stringify(preflight.data.blockers));
  assert.match(preflight.data.siteUrl, /\/live\/gram-seva$/);

  const published = await call(baseUrl, 'POST', `/api/projects/${projectId}/publish`, {
    siteSlug: 'gram-seva',
    seo: { title: 'Gram Seva Trust – Official Website', description: 'Village welfare programmes.' }
  }, adminToken);
  assert.equal(published.status, 200, published.text);
  assert.match(published.data.deployedUrl, /\/live\/gram-seva$/);
  assert.equal(published.data.project.status, 'deployed');
  assert.equal(published.data.project.deploymentDetails.platform, 'mock', 'local publishing is simulated and labelled as such');
  assert.equal(published.data.deployment.isSimulated, true);

  // --- Public live site: content served, visitor PII never exposed --------
  const live = await call(baseUrl, 'GET', '/api/live/gram-seva');
  assert.equal(live.status, 200, live.text);
  assert.equal(live.data.organizationName, 'Gram Seva Trust');
  assert.equal(live.data.seo.title, 'Gram Seva Trust – Official Website');
  assert.ok(!live.text.includes('private.visitor@example.com'), 'visitor email must not be public');
  assert.ok(!live.text.includes('volunteerSubmissions'), 'submission arrays must not be public');
  assert.ok(!live.text.includes('deployedByAdminId'), 'internal deployment fields must not be public');

  // --- SEO shell rendering ------------------------------------------------
  const rendered = await call(baseUrl, 'GET', '/api/render/live/gram-seva');
  assert.equal(rendered.status, 200);
  assert.match(rendered.text, /<title>Gram Seva Trust – Official Website<\/title>/);
  assert.match(rendered.text, /<meta property="og:title" content="Gram Seva Trust – Official Website" \/>/);
  assert.match(rendered.text, /<link rel="canonical" href="http:\/\/127\.0\.0\.1:\d+\/live\/gram-seva" \/>/);
  assert.ok(!rendered.text.includes('DigiVerse marketing description'));

  const missingRender = await call(baseUrl, 'GET', '/api/render/live/does-not-exist');
  assert.equal(missingRender.status, 404);

  // --- Second project cannot take the same address -----------------------
  const other = await call(baseUrl, 'POST', '/api/projects', {
    requirements: { organizationName: 'Another Org', category: 'cultural' }
  }, adminToken);
  assert.equal(other.status, 201, other.text);
  const otherPreflight = await call(baseUrl, 'GET', `/api/projects/${other.data.project.id}/publishing/preflight?siteSlug=gram-seva`, undefined, adminToken);
  assert.equal(otherPreflight.data.checks.isSlugAvailable, false);

  // --- Central publishing management -------------------------------------
  const sites = await call(baseUrl, 'GET', '/api/sites', undefined, ownerToken);
  assert.equal(sites.status, 200, sites.text);
  assert.equal(sites.data.sites.length, 1);
  assert.equal(sites.data.sites[0].slug, 'gram-seva');

  const config = await call(baseUrl, 'GET', '/api/sites/config', undefined, adminToken);
  assert.equal(config.status, 200);
  assert.equal(config.data.customDomains.vercelConnected, false);
  assert.equal(config.data.mediaStorage, 'local');

  const seoUpdate = await call(baseUrl, 'PATCH', `/api/sites/${projectId}/seo`, { seo: { noIndex: true } }, adminToken);
  assert.equal(seoUpdate.status, 200, seoUpdate.text);
  assert.equal(seoUpdate.data.seo.noIndex, true);

  // --- Custom domain without a Vercel account (fail-closed) ---------------
  const badDomain = await call(baseUrl, 'POST', `/api/sites/${projectId}/domain`, { domain: 'https://evil.com/path' }, adminToken);
  assert.equal(badDomain.status, 400);

  const domain = await call(baseUrl, 'POST', `/api/sites/${projectId}/domain`, { domain: 'www.gramseva.example' }, adminToken);
  assert.equal(domain.status, 200, domain.text);
  assert.equal(domain.data.site.domainStatus, 'awaiting_vercel_connection');

  const byHost = await call(baseUrl, 'GET', '/api/live/by-host/www.gramseva.example');
  assert.equal(byHost.status, 404);
  assert.equal(byHost.data.code, 'DOMAIN_NOT_ACTIVE');

  const removeDomain = await call(baseUrl, 'DELETE', `/api/sites/${projectId}/domain`, undefined, adminToken);
  assert.equal(removeDomain.status, 200, removeDomain.text);

  // --- Uploads: local storage, SVG refused --------------------------------
  const svg = await call(baseUrl, 'POST', '/api/media/upload', {
    filename: 'logo.svg',
    fileData: 'data:image/svg+xml;base64,' + Buffer.from('<svg onload="alert(1)"/>').toString('base64'),
    assetType: 'logo'
  }, adminToken);
  assert.equal(svg.status, 400, 'SVG uploads must be rejected');

  const png1x1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const upload = await call(baseUrl, 'POST', '/api/media/upload', {
    filename: 'logo.png',
    fileData: `data:image/png;base64,${png1x1}`,
    assetType: 'logo'
  }, adminToken);
  assert.equal(upload.status, 201, upload.text);
  assert.equal(upload.data.storage, 'local');

  const served = await fetch(`${baseUrl}${upload.data.url}`);
  assert.equal(served.status, 200);
  assert.equal(served.headers.get('content-type'), 'image/png');
  assert.equal(served.headers.get('x-content-type-options'), 'nosniff');

  // Drive demo media is redirected to static frontend assets (no absolute paths).
  const proxy = await fetch(`${baseUrl}/api/media/drive/proxy/drv_durga_hero`, { redirect: 'manual' });
  assert.equal(proxy.status, 302);
  assert.equal(proxy.headers.get('location'), '/images/festivals/durga-hero.jpg');

  // --- Unpublish + delete ---------------------------------------------------
  const unpublished = await call(baseUrl, 'POST', `/api/projects/${projectId}/unpublish`, { reason: 'test' }, adminToken);
  assert.equal(unpublished.status, 200, unpublished.text);

  const liveAfter = await call(baseUrl, 'GET', '/api/live/gram-seva');
  assert.equal(liveAfter.status, 404);
  assert.equal(liveAfter.data.code, 'SITE_NOT_PUBLISHED');

  const deleted = await call(baseUrl, 'DELETE', `/api/projects/${projectId}`, undefined, adminToken);
  assert.equal(deleted.status, 200, deleted.text);

  const sitesAfter = await call(baseUrl, 'GET', '/api/sites', undefined, ownerToken);
  assert.equal(sitesAfter.data.sites.length, 0, 'deleting a project removes its published site');

  // --- Unknown API route ----------------------------------------------------
  const unknown = await call(baseUrl, 'GET', '/api/does-not-exist');
  assert.equal(unknown.status, 404);
}
