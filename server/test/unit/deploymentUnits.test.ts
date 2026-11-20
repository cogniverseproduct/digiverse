import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { toPostgresPlaceholders } from '../../src/db/driver.js';
import { evaluateSetupAccess } from '../../src/routes/auth.js';
import { sanitizeWebsiteForPublic } from '../../src/services/publicSiteSanitizer.js';
import { slugFromHostname, buildSiteUrl, normalizeSiteSlug } from '../../src/services/siteRouting.js';
import { normalizeCustomDomain, vercelDomainsService } from '../../src/services/vercelDomainsService.js';
import { injectSiteMeta } from '../../src/routes/render.js';
import { validateSeoSettings } from '../../src/services/publishingService.js';

const ENV_KEYS = [
  'SITES_ROOT_DOMAIN',
  'PUBLIC_APP_URL',
  'VERCEL_PROJECT_PRODUCTION_URL',
  'DIGIVERSE_VERCEL_API_TOKEN',
  'DIGIVERSE_VERCEL_PROJECT_ID',
  'DIGIVERSE_VERCEL_TEAM_ID',
  'VERCEL_PROJECT_ID'
];
const savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
const realFetch = globalThis.fetch;

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  globalThis.fetch = realFetch;
});

describe('Postgres placeholder rewriting', () => {
  test('rewrites ? outside quotes only', () => {
    assert.equal(
      toPostgresPlaceholders("SELECT * FROM t WHERE a = ? AND b = '?' AND c = ?"),
      "SELECT * FROM t WHERE a = $1 AND b = '?' AND c = $2"
    );
  });
});

describe('Remote Super Admin setup (Vercel)', () => {
  test('local requests are allowed without a key', () => {
    assert.equal(evaluateSetupAccess(true, undefined, undefined).allowed, true);
  });

  test('remote requests are refused when no SETUP_KEY is configured', () => {
    assert.equal(evaluateSetupAccess(false, undefined, 'anything').allowed, false);
  });

  test('remote requests need the exact key', () => {
    const key = 'a'.repeat(32);
    assert.equal(evaluateSetupAccess(false, key, 'wrong').allowed, false);
    assert.equal(evaluateSetupAccess(false, key, undefined).allowed, false);
    assert.equal(evaluateSetupAccess(false, key, key).allowed, true);
  });
});

describe('Public payload sanitizer', () => {
  test('removes visitor submissions', () => {
    const site: any = {
      ngoData: { programs: [1], volunteerSubmissions: [{ email: 'x' }], donationEnquiries: [{ pan: 'y' }] },
      eventData: { sessions: [1], rsvpSubmissions: [{ guestEmail: 'z' }] }
    };
    const clean: any = sanitizeWebsiteForPublic(site);
    assert.deepEqual(clean.ngoData, { programs: [1] });
    assert.deepEqual(clean.eventData, { sessions: [1] });
    assert.ok(site.ngoData.volunteerSubmissions, 'input object is not mutated');
  });
});

describe('Site routing', () => {
  test('path URLs use PUBLIC_APP_URL, then the request origin', () => {
    delete process.env.SITES_ROOT_DOMAIN;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.PUBLIC_APP_URL;
    assert.equal(buildSiteUrl('club', 'http://localhost:5173'), 'http://localhost:5173/live/club');

    process.env.PUBLIC_APP_URL = 'digiverse-demo.vercel.app';
    assert.equal(buildSiteUrl('club', 'http://ignored'), 'https://digiverse-demo.vercel.app/live/club');
  });

  test('subdomain routing when SITES_ROOT_DOMAIN is set', () => {
    process.env.SITES_ROOT_DOMAIN = 'sites.example.org';
    assert.equal(buildSiteUrl('club'), 'https://club.sites.example.org');
    assert.equal(slugFromHostname('club.sites.example.org'), 'club');
    assert.equal(slugFromHostname('a.b.sites.example.org'), null);
    assert.equal(slugFromHostname('sites.example.org'), null);
    assert.equal(slugFromHostname('api.sites.example.org'), null, 'reserved slugs never resolve');
  });

  test('slug validation', () => {
    assert.equal(normalizeSiteSlug('  Gram Seva Trust! '), 'gram-seva-trust');
    assert.throws(() => normalizeSiteSlug('api'));
    assert.throws(() => normalizeSiteSlug(''));
  });
});

describe('SEO', () => {
  test('meta injection escapes HTML and replaces the title', () => {
    const shell = '<html><head><title>DigiVerse</title><meta name="description" content="old" /></head><body></body></html>';
    const html = injectSiteMeta(
      shell,
      {
        slug: 'x',
        organizationName: 'Org',
        seo: { title: 'A "quoted" <b>title</b>', description: 'desc & more', ogImageUrl: '/images/a.jpg' }
      } as any,
      'https://app.example/live/x',
      'https://app.example'
    );
    assert.match(html, /<title>A &quot;quoted&quot; &lt;b&gt;title&lt;\/b&gt;<\/title>/);
    assert.match(html, /content="desc &amp; more"/);
    assert.match(html, /og:image" content="https:\/\/app\.example\/images\/a\.jpg"/);
    assert.ok(!html.includes('content="old"'));
  });

  test('settings validation', () => {
    assert.deepEqual(validateSeoSettings({ title: ' T ', noIndex: 1, extra: 'dropped' }), { title: 'T', noIndex: true });
    assert.throws(() => validateSeoSettings({ ogImageUrl: 'javascript:alert(1)' }));
    assert.throws(() => validateSeoSettings({ title: 'x'.repeat(200) }));
  });
});

describe('Custom domains via Vercel API', () => {
  test('domain normalization', () => {
    assert.equal(normalizeCustomDomain('HTTPS://WWW.Example.org/'), 'www.example.org');
    assert.throws(() => normalizeCustomDomain('example.org/path'));
    assert.throws(() => normalizeCustomDomain('user@example.org'));
    assert.throws(() => normalizeCustomDomain('my-app.vercel.app'));
  });

  test('without credentials nothing is sent to Vercel', async () => {
    delete process.env.DIGIVERSE_VERCEL_API_TOKEN;
    delete process.env.DIGIVERSE_VERCEL_PROJECT_ID;
    delete process.env.VERCEL_PROJECT_ID;
    globalThis.fetch = (async () => {
      throw new Error('fetch must not be called');
    }) as typeof fetch;

    const result = await vercelDomainsService.attachDomain('www.example.org');
    assert.equal(result.status, 'awaiting_vercel_connection');
  });

  test('with credentials it adds the domain and reports verification state', async () => {
    process.env.DIGIVERSE_VERCEL_API_TOKEN = 'test-token';
    process.env.DIGIVERSE_VERCEL_PROJECT_ID = 'prj_test';
    process.env.DIGIVERSE_VERCEL_TEAM_ID = 'team_test';

    const calls: Array<{ url: string; method: string; auth: string | null }> = [];
    globalThis.fetch = (async (input: any, init: any = {}) => {
      const url = String(input);
      calls.push({ url, method: init.method || 'GET', auth: new Headers(init.headers).get('authorization') });

      if (url.includes('/v10/projects/prj_test/domains') && init.method === 'POST') {
        return new Response(JSON.stringify({ name: 'www.example.org' }), { status: 200 });
      }
      if (url.includes('/v9/projects/prj_test/domains/www.example.org')) {
        return new Response(JSON.stringify({
          verified: false,
          verification: [{ type: 'TXT', domain: '_vercel.example.org', value: 'vc-domain-verify=abc' }]
        }), { status: 200 });
      }
      if (url.includes('/v6/domains/www.example.org/config')) {
        return new Response(JSON.stringify({ misconfigured: true }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    }) as typeof fetch;

    const result = await vercelDomainsService.attachDomain('www.example.org');

    assert.equal(result.status, 'pending_verification');
    assert.equal(result.details.verification?.[0].type, 'TXT');
    assert.deepEqual(result.details.recommendedRecords, [{ type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' }]);
    assert.ok(calls.every((c) => c.auth === 'Bearer test-token'));
    assert.ok(calls.every((c) => c.url.includes('teamId=team_test')));
  });

  test('Vercel API errors are reported, not hidden', async () => {
    process.env.DIGIVERSE_VERCEL_API_TOKEN = 'test-token';
    process.env.DIGIVERSE_VERCEL_PROJECT_ID = 'prj_test';
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: { message: 'Domain is owned by another account' } }), { status: 403 })) as typeof fetch;

    const result = await vercelDomainsService.attachDomain('www.example.org');
    assert.equal(result.status, 'error');
    assert.match(result.details.message || '', /another account/);
  });
});
