// Must stay the first import: prepares the isolated test environment (temporary database, no real server) before the app loads.
import { baseUrl, FIXTURE_ADMIN, FIXTURE_SUPER_ADMIN } from './helpers/testContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import { getSportsTemplateById, getSportsTemplateList } from '../../client/src/templates/sports/registry.ts';
import { emptyForm, buildRequirements } from '../../client/src/components/admin/sports-intake/model.ts';

/**
 * Sports Website Creation Engine, end to end through the real HTTP API, one run per template (24 in total):
 * create the project from the real intake model -> persisted selection -> generate -> client preview link ->
 * publish locally with no approval or payment gate -> the public site still carries the same template.
 * Plus uploads, saved data, template/category validation and project ownership.
 */

const CATEGORIES = ['sports_club', 'sports_tournament', 'sports_academy'] as const;
type Category = (typeof CATEGORIES)[number];

async function call(method: string, route: string, body?: unknown, token?: string): Promise<{ status: number; data: any; text: string }> {
  const res = await fetch(`${baseUrl}${route}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { data = null; }
  return { status: res.status, data, text };
}

const metaFor = (id: string) => {
  const t = getSportsTemplateById(id)!;
  return { templateId: t.id, templateVersion: t.version, templateName: t.name, websiteCategory: t.archetype, selectedAt: new Date().toISOString(), designTokens: { primaryColor: t.tokens.primaryColor, accentColor: t.tokens.accentColor, fontFamily: t.tokens.fontFamily, headingFont: t.tokens.headingFont, layoutPreset: t.tokens.layoutPreset } };
};

/** Requirements exactly as the intake wizard builds them, with only identity and contact filled (nothing invented). */
function requirementsFor(category: Category, templateId: string, name: string, extra: Record<string, string> = {}) {
  const f = emptyForm(metaFor(templateId));
  f.v.name = name;
  f.v.sport = 'football';
  f.v.email = 'hello@e2e-sports.example';
  f.v.tagline = `Tagline for ${name}`;
  Object.assign(f.v, extra);
  return buildRequirements(f, category);
}

const PNG_1X1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

let adminToken = '';
let superToken = '';
let otherAdminToken = '';

async function login(identity: { email: string; password: string }): Promise<string> {
  const r = await call('POST', '/api/auth/login', { email: identity.email, password: identity.password });
  assert.equal(r.status, 200, `login failed for ${identity.email}: ${r.text}`);
  return r.data.token;
}

before(async () => {
  adminToken = await login(FIXTURE_ADMIN);
  superToken = await login(FIXTURE_SUPER_ADMIN);

  // A second Admin, created the same way the fixtures are (the platform seeds nothing), to prove project ownership.
  const [{ repository }, bcrypt] = await Promise.all([import('../src/db/repository.js'), import('bcryptjs')]);
  const other = { email: 'second-admin@digiverse.internal', username: 'second-admin', password: 'SecondAdmin@2026!' };
  await repository.createUser({
    id: randomUUID(), email: other.email, username: other.username, passwordHash: await bcrypt.default.hash(other.password, 10),
    name: 'Second Admin', role: 'ADMIN', isActive: true
  });
  otherAdminToken = await login(other);
});

describe('Sports engine: all 24 templates through the real API', () => {
  for (const category of CATEGORIES) {
    for (const template of getSportsTemplateList(category)) {
      test(`${category} / ${template.id}: create, persist, generate, preview, publish, serve`, async () => {
        const name = `E2E ${template.name}`;
        const slug = `e2e-${template.id}`;

        // 1. Create from the real intake output
        const created = await call('POST', '/api/projects', { requirements: requirementsFor(category, template.id, name) }, adminToken);
        assert.equal(created.status, 201, created.text);
        const id: string = created.data.project.id;
        assert.equal(created.data.project.requirements.selectedTemplate.templateId, template.id, 'selection stored on create');
        assert.equal(created.data.project.requirements.sportsArchetype, category);

        // 2. Selection and data come back from the database
        const stored = await call('GET', `/api/projects/${id}`, undefined, adminToken);
        assert.equal(stored.status, 200, stored.text);
        assert.equal(stored.data.project.requirements.selectedTemplate.templateId, template.id, 'selection persisted');
        assert.equal(stored.data.project.requirements.sportsData.club.organizationName, name, 'client data persisted');
        assert.equal(stored.data.project.requirements.sportsData.club.tagline, `Tagline for ${name}`);

        // 3. Generation keeps the chosen template and the client's data (the design is not replaced)
        const gen = await call('POST', `/api/projects/${id}/generate`, {}, adminToken);
        assert.equal(gen.status, 200, gen.text);
        const site = gen.data.project.generatedWebsite;
        assert.equal(site.selectedTemplate.templateId, template.id, 'generated website carries the same template');
        assert.equal(site.sportsData.club.organizationName, name);
        assert.ok(!JSON.stringify(site.sportsData).match(/"(testimonials|achievements)":\[\{/), 'nothing invented for the client');

        // 4. Client preview link serves that same template
        const token = await call('POST', `/api/projects/${id}/preview-tokens`, {}, adminToken);
        assert.equal(token.status, 201, token.text);
        const preview = await call('GET', `/api/preview/${token.data.token.token}`);
        assert.equal(preview.status, 200, preview.text);
        assert.equal(preview.data.website.selectedTemplate.templateId, template.id, 'client preview uses the same template');
        assert.ok(preview.data.website.sportsData, 'preview carries the sports data the template needs');

        // 5. Publish locally (simulated hosting): no approval, quotation or payment is needed
        const published = await call('POST', `/api/projects/${id}/publish`, { siteSlug: slug }, adminToken);
        assert.equal(published.data.deployment.isSimulated, true, 'local publishing is labelled as simulated');
        assert.equal(published.status, 200, published.text);
        assert.match(published.data.deployedUrl, new RegExp(`/live/${slug}$`));

        // 6. The public site: same template, same data, no internal fields
        const live = await call('GET', `/api/live/${slug}`);
        assert.equal(live.status, 200, live.text);
        assert.equal(live.data.generatedWebsite.selectedTemplate.templateId, template.id, 'public site keeps the selected design');
        assert.equal(live.data.generatedWebsite.sportsData.club.organizationName, name);
        assert.ok(!live.text.includes('deployedByAdminId'), 'internal fields are not public');
      });
    }
  }
});

describe('Sports engine: validation, saved data and uploads', () => {
  test('a template from another category, or an unknown one, is refused', async () => {
    const mismatch = requirementsFor('sports_club', 'matchday-modern', 'E2E Mismatch');
    mismatch.selectedTemplate = metaFor('knockout-minimal') as typeof mismatch.selectedTemplate;
    assert.equal((await call('POST', '/api/projects', { requirements: mismatch }, adminToken)).status, 400);

    const unknown = requirementsFor('sports_club', 'matchday-modern', 'E2E Unknown');
    unknown.selectedTemplate = { ...metaFor('matchday-modern'), templateId: 'does-not-exist' } as typeof unknown.selectedTemplate;
    const r = await call('POST', '/api/projects', { requirements: unknown }, adminToken);
    assert.equal(r.status, 400);
    assert.match(r.data.error, /Unknown sports template/);
  });

  test('edits to sports data are saved and read back (draft-style update after creation)', async () => {
    const created = await call('POST', '/api/projects', { requirements: requirementsFor('sports_academy', 'learn-and-play', 'E2E Saved Data Academy') }, adminToken);
    const id = created.data.project.id;
    await call('POST', `/api/projects/${id}/generate`, {}, adminToken);
    const current = (await call('GET', `/api/projects/${id}`, undefined, adminToken)).data.project;
    const sportsData = structuredClone(current.generatedWebsite.sportsData);
    sportsData.club.tagline = 'Edited after creation';
    sportsData.club.primaryColor = '#112233';
    const patched = await call('PATCH', `/api/projects/${id}/sports-data`, { sportsData }, adminToken);
    assert.equal(patched.status, 200, patched.text);
    const again = (await call('GET', `/api/projects/${id}`, undefined, adminToken)).data.project;
    assert.equal(again.generatedWebsite.sportsData.club.tagline, 'Edited after creation');
    assert.equal(again.requirements.sportsData.club.primaryColor, '#112233');
    assert.equal(again.generatedWebsite.selectedTemplate.templateId, 'learn-and-play', 'editing data never swaps the design');
  });

  test('Studio brand edits (customize with sportsData) update both copies and keep the template', async () => {
    const created = await call('POST', '/api/projects', { requirements: requirementsFor('sports_club', 'clean-sheet', 'E2E Brand Edit Club') }, adminToken);
    const id = created.data.project.id;
    const gen = await call('POST', `/api/projects/${id}/generate`, {}, adminToken);
    const sd = structuredClone(gen.data.project.generatedWebsite.sportsData);
    sd.club = { ...sd.club, primaryColor: '#0A3D62', accentColor: '#F39C12', tagline: 'Brand edit' };
    const res = await call('PATCH', `/api/projects/${id}/customize`, { sportsData: sd }, adminToken);
    assert.equal(res.status, 200, res.text);
    assert.equal(res.data.project.generatedWebsite.sportsData.club.accentColor, '#F39C12');
    assert.equal(res.data.project.requirements.sportsData.club.tagline, 'Brand edit');
    assert.equal(res.data.project.generatedWebsite.selectedTemplate.templateId, 'clean-sheet');
  });

  test('Drive and YouTube links from the intake are kept on the project', async () => {
    const extra = { driveGalleryUrl: 'https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUv', youtubeUrls: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtubePlaylistUrls: 'https://www.youtube.com/playlist?list=PLabcdefghijklmnop' };
    const r = requirementsFor('sports_tournament', 'bracket-board', 'E2E Media Cup', extra);
    assert.equal(r.googleDriveGalleryUrl, extra.driveGalleryUrl);
    assert.deepEqual(r.youtubeUrls, [extra.youtubeUrls]);
    const created = await call('POST', '/api/projects', { requirements: r }, adminToken);
    assert.equal(created.status, 201, created.text);
    const got = (await call('GET', `/api/projects/${created.data.project.id}`, undefined, adminToken)).data.project;
    assert.equal(got.requirements.googleDriveGalleryUrl, extra.driveGalleryUrl);
    assert.deepEqual(got.requirements.youtubeUrls, [extra.youtubeUrls]);
  });

  test('an uploaded logo is stored, served back, and ends up on the generated site', async () => {
    const bad = await call('POST', '/api/media/upload', { filename: 'logo.svg', fileData: `data:image/svg+xml;base64,${Buffer.from('<svg onload="x()"/>').toString('base64')}`, assetType: 'logo' }, adminToken);
    assert.equal(bad.status, 400, 'SVG is rejected');
    const noAuth = await call('POST', '/api/media/upload', { filename: 'logo.png', fileData: `data:image/png;base64,${PNG_1X1}`, assetType: 'logo' });
    assert.equal(noAuth.status, 401, 'uploads need a signed-in admin');

    const up = await call('POST', '/api/media/upload', { filename: 'crest.png', fileData: `data:image/png;base64,${PNG_1X1}`, assetType: 'logo' }, adminToken);
    assert.equal(up.status, 201, up.text);
    const served = await fetch(`${baseUrl}${up.data.url}`);
    assert.equal(served.status, 200);
    assert.equal(served.headers.get('content-type'), 'image/png');

    const created = await call('POST', '/api/projects', { requirements: requirementsFor('sports_club', 'premier-elite-club', 'E2E Upload Club', { logo: up.data.url }) }, adminToken);
    assert.equal(created.status, 201, created.text);
    const gen = await call('POST', `/api/projects/${created.data.project.id}/generate`, {}, adminToken);
    assert.equal(gen.data.project.generatedWebsite.sportsData.club.logoUrl, up.data.url);
  });
});

describe('Project ownership between administrators', () => {
  let projectId = '';
  let tenantId = '';

  before(async () => {
    const created = await call('POST', '/api/projects', { requirements: requirementsFor('sports_club', 'matchday-modern', 'E2E Private Club') }, adminToken);
    assert.equal(created.status, 201, created.text);
    projectId = created.data.project.id;
    tenantId = created.data.project.tenantId;
    await call('POST', `/api/projects/${projectId}/generate`, {}, adminToken);
  });

  test('another Admin cannot list, read, change, generate, publish, or delete it', async () => {
    const list = await call('GET', '/api/projects', undefined, otherAdminToken);
    assert.ok(!list.data.projects.some((p: any) => p.id === projectId), 'not in the other admin\'s list');
    for (const [method, route, body] of [
      ['GET', `/api/projects/${projectId}`, undefined],
      ['PUT', `/api/projects/${projectId}`, { tagline: 'hijack' }],
      ['POST', `/api/projects/${projectId}/generate`, {}],
      ['PATCH', `/api/projects/${projectId}/sports-data`, { sportsData: { club: {} } }],
      ['PATCH', `/api/projects/${projectId}/customize`, { themeAccent: 'neon-cyan' }],
      ['POST', `/api/projects/${projectId}/preview-tokens`, {}],
      ['GET', `/api/projects/${projectId}/revisions`, undefined],
      ['GET', `/api/projects/${projectId}/commercial`, undefined],
      ['GET', `/api/projects/${projectId}/publishing/preflight`, undefined],
      ['POST', `/api/projects/${projectId}/publish`, { siteSlug: 'stolen' }],
      ['GET', `/api/commercial/project/${projectId}`, undefined],
      ['GET', `/api/media/drive/items/${projectId}`, undefined],
      ['GET', `/api/media/youtube/${projectId}`, undefined],
      ['GET', `/api/tenants/${tenantId}`, undefined],
      ['DELETE', `/api/projects/${projectId}`, undefined]
    ] as const) {
      const r = await call(method, route, body, otherAdminToken);
      assert.equal(r.status, 404, `${method} ${route} should look like it does not exist, got ${r.status}`);
    }
    const stillThere = await call('GET', `/api/projects/${projectId}`, undefined, adminToken);
    assert.equal(stillThere.status, 200, 'the owner still has it');
    assert.notEqual(stillThere.data.project.requirements.tagline, 'hijack');
  });

  test('another Admin cannot take over the organization by reusing its name or reassigning it', async () => {
    const dup = await call('POST', '/api/projects', { requirements: requirementsFor('sports_club', 'clean-sheet', 'E2E Private Club') }, otherAdminToken);
    assert.equal(dup.status, 409, dup.text);
    const patch = await call('PATCH', `/api/tenants/${tenantId}`, { assignedAdminId: 'someone-else' }, otherAdminToken);
    assert.equal(patch.status, 404);
    const tenants = await call('GET', '/api/tenants', undefined, otherAdminToken);
    assert.ok(!tenants.data.tenants.some((t: any) => t.id === tenantId));
  });

  test('the Super Admin sees every project and can read this one', async () => {
    const list = await call('GET', '/api/projects', undefined, superToken);
    assert.ok(list.data.projects.some((p: any) => p.id === projectId));
    assert.equal((await call('GET', `/api/projects/${projectId}`, undefined, superToken)).status, 200);
    assert.equal((await call('GET', `/api/tenants/${tenantId}`, undefined, superToken)).status, 200);
  });

  test('visitor endpoints stay public and unauthenticated requests are refused', async () => {
    assert.equal((await call('GET', `/api/projects/${projectId}`)).status, 401);
    assert.equal((await call('GET', '/api/projects')).status, 401);
    // A visitor RSVP is not blocked by the ownership guard (it may still be rejected for the project's own reasons, never as 401/404-by-ownership).
    const rsvp = await call('POST', `/api/projects/${projectId}/rsvp`, {});
    assert.notEqual(rsvp.status, 401);
  });
});
