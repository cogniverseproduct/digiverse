// Must stay the first import: prepares the isolated test environment (temporary database, no real server) before the app loads.
import { baseUrl, FIXTURE_ADMIN, FIXTURE_SUPER_ADMIN } from './helpers/testContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import { getCulturalTemplateById, getCulturalTemplateList } from '../../client/src/templates/cultural/registry.ts';
import { emptyForm, buildRequirements } from '../../client/src/components/admin/cultural-intake/model.ts';

/**
 * Cultural Website Creation Engine, end to end through the real HTTP API, one run per template (10 in total):
 * create the project from the real intake model -> persisted selection and data -> generate -> client preview link ->
 * publish locally with no approval or payment gate -> the public site carries the same template and
 * none of the private fields. Plus legacy ids, validation, saved data, brand edits, uploads and project ownership.
 */

const CATEGORIES = ['cultural_society', 'puja_committee'] as const;
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
  const t = getCulturalTemplateById(id)!;
  return { templateId: t.id, templateVersion: t.version, templateName: t.name, websiteCategory: t.archetype, selectedAt: new Date().toISOString(), designTokens: { primaryColor: t.tokens.primaryColor, accentColor: t.tokens.accentColor, fontFamily: t.tokens.fontFamily, headingFont: t.tokens.headingFont, layoutPreset: t.tokens.layoutPreset } };
};

/** Requirements exactly as the intake wizard builds them, with a small amount of real-looking (fictional) content. */
function requirementsFor(category: Category, templateId: string, name: string, extra: Record<string, string> = {}) {
  const f = emptyForm(metaFor(templateId));
  f.v.name = name;
  f.v.email = 'hello@e2e-cultural.example';
  f.v.tagline = `Tagline for ${name}`;
  f.v.description = 'A fictional organisation used only in automated tests.';
  f.v.city = 'Testville';
  f.lists.leadership = [{ id: 'ld1', name: 'Asha Rao', designation: 'President', roleCategory: 'executive', photo: '', bio: '', email: 'asha.private@e2e-cultural.example', phone: '+00 111 111 111' }];
  if (category === 'puja_committee') {
    f.v.festivalType = 'durga_puja';
    f.lists.days = [{ id: 'd1', dayName: 'Maha Ashtami', dayNameNative: '', date: '2099-10-10', tithiInfo: '', rituals: [{ id: 'r1', time: '9:30 am', name: 'Pushpanjali', nameNative: '', description: '', key: 'yes' }] }];
    f.v.pandalLocation = 'Test Maidan'; f.v.visitingHours = '9 am to 11 pm';
  } else {
    f.lists.events = [{ id: 'e1', title: 'Annual Day', category: '', description: 'A fictional annual day.', startDate: '2099-01-05', endDate: '', time: '6 pm', venue: 'Test Hall', image: '', registrationUrl: '', featured: '' }];
    f.lists.activities = [{ id: 'a1', title: 'Choir', category: 'music', description: 'A weekly choir.', schedule: 'Fridays', venue: '', image: '', registration: '' }];
  }
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
  const [{ repository }, bcrypt] = await Promise.all([import('../src/db/repository.js'), import('bcryptjs')]);
  const other = { email: 'cultural-second-admin@digiverse.internal', username: 'cultural-second-admin', password: 'SecondAdmin@2026!' };
  await repository.createUser({
    id: randomUUID(), email: other.email, username: other.username, passwordHash: await bcrypt.default.hash(other.password, 10),
    name: 'Second Admin', role: 'ADMIN', isActive: true
  });
  otherAdminToken = await login(other);
});

describe('Cultural engine: all 10 templates through the real API', () => {
  for (const category of CATEGORIES) {
    for (const template of getCulturalTemplateList().filter((t) => t.archetype === category)) {
      test(`${category} / ${template.id}: create, persist, generate, preview, publish, serve`, async () => {
        const name = `E2E ${template.name}`;
        const slug = `e2e-${template.id}`;

        // 1. Create from the real intake output
        const created = await call('POST', '/api/projects', { requirements: requirementsFor(category, template.id, name) }, adminToken);
        assert.equal(created.status, 201, created.text);
        const id: string = created.data.project.id;
        assert.equal(created.data.project.requirements.selectedTemplate.templateId, template.id, 'selection stored on create');
        assert.equal(created.data.project.requirements.culturalArchetype, category);
        assert.equal(created.data.project.requirements.category, category === 'puja_committee' ? 'puja_committee' : 'cultural');

        // 2. Selection and data come back from the database
        const stored = await call('GET', `/api/projects/${id}`, undefined, adminToken);
        assert.equal(stored.status, 200, stored.text);
        assert.equal(stored.data.project.requirements.selectedTemplate.templateId, template.id, 'selection persisted');
        assert.equal(stored.data.project.requirements.culturalData.organization.name, name, 'client data persisted');
        assert.equal(stored.data.project.requirements.culturalData.organization.tagline, `Tagline for ${name}`);

        // 3. Generation keeps the chosen template and the client's data, and adds nothing the client did not give
        const gen = await call('POST', `/api/projects/${id}/generate`, {}, adminToken);
        assert.equal(gen.status, 200, gen.text);
        const site = gen.data.project.generatedWebsite;
        assert.equal(site.selectedTemplate.templateId, template.id, 'generated website carries the same template');
        assert.equal(site.culturalData.organization.name, name);
        assert.equal(site.culturalData.organization.city, 'Testville');
        assert.equal(site.culturalData.organization.contactPhone, '', 'no invented phone number');
        assert.ok(!JSON.stringify(site.culturalData).match(/organization\.internal|2200 0000|Kolkata|Cultural Complex/), 'no placeholder contact data');
        assert.equal(site.culturalData.sponsors.length, 0, 'no invented sponsors');
        if (category === 'puja_committee') assert.equal(site.culturalData.pujaSchedule.length, 1);

        // 4. Client preview link serves that same template
        const token = await call('POST', `/api/projects/${id}/preview-tokens`, {}, adminToken);
        assert.equal(token.status, 201, token.text);
        const preview = await call('GET', `/api/preview/${token.data.token.token}`);
        assert.equal(preview.status, 200, preview.text);
        assert.equal(preview.data.website.selectedTemplate.templateId, template.id, 'client preview uses the same template');
        assert.ok(preview.data.website.culturalData, 'preview carries the cultural data the template needs');
        assert.ok(!JSON.stringify(preview.data.website.culturalData).includes('asha.private@'), 'a member’s private email is not in the client preview');

        // 5. Publish locally (simulated hosting): no approval, quotation or payment is needed
        const published = await call('POST', `/api/projects/${id}/publish`, { siteSlug: slug }, adminToken);
        assert.equal(published.data.deployment.isSimulated, true, 'local publishing is labelled as simulated');
        assert.equal(published.status, 200, published.text);
        assert.match(published.data.deployedUrl, new RegExp(`/live/${slug}$`));

        // 6. The public site: same template, same data, no private fields
        const live = await call('GET', `/api/live/${slug}`);
        assert.equal(live.status, 200, live.text);
        assert.equal(live.data.generatedWebsite.selectedTemplate.templateId, template.id, 'public site keeps the selected design');
        assert.equal(live.data.generatedWebsite.culturalData.organization.name, name);
        assert.equal(live.data.generatedWebsite.culturalData.leadership[0].name, 'Asha Rao', 'the member’s name is public');
        assert.ok(!live.text.includes('asha.private@') && !live.text.includes('+00 111 111 111'), 'a member’s private email and phone are not public');
        assert.ok(!live.text.includes('deployedByAdminId'), 'internal fields are not public');
      });
    }
  }
});

describe('Cultural engine: validation, legacy projects, saved data and uploads', () => {
  test('a template from the other category, or an unknown one, is refused on create and on update', async () => {
    const mismatch = requirementsFor('cultural_society', 'cultural-heritage', 'E2E Mismatch');
    mismatch.selectedTemplate = metaFor('traditional-durga-puja') as typeof mismatch.selectedTemplate;
    const m = await call('POST', '/api/projects', { requirements: mismatch }, adminToken);
    assert.equal(m.status, 400);
    assert.match(m.data.error, /belongs to puja_committee, not cultural_society/);

    const unknown = requirementsFor('puja_committee', 'traditional-durga-puja', 'E2E Unknown');
    unknown.selectedTemplate = { ...metaFor('traditional-durga-puja'), templateId: 'does-not-exist' } as typeof unknown.selectedTemplate;
    const r = await call('POST', '/api/projects', { requirements: unknown }, adminToken);
    assert.equal(r.status, 400);
    assert.match(r.data.error, /Unknown cultural template/);

    const ok = await call('POST', '/api/projects', { requirements: requirementsFor('cultural_society', 'cultural-heritage', 'E2E Update Check') }, adminToken);
    assert.equal(ok.status, 201, ok.text);
    const bad = await call('PUT', `/api/projects/${ok.data.project.id}`, { selectedTemplate: metaFor('premium-modern-durga-puja') }, adminToken);
    assert.equal(bad.status, 400, 'an update cannot move a society onto a puja template');
    const good = await call('PUT', `/api/projects/${ok.data.project.id}`, { selectedTemplate: metaFor('arts-literature-society') }, adminToken);
    assert.equal(good.status, 200, good.text);
    const after = (await call('GET', `/api/projects/${ok.data.project.id}`, undefined, adminToken)).data.project;
    assert.equal(after.requirements.selectedTemplate.templateId, 'arts-literature-society');
    assert.equal(after.requirements.culturalData.organization.name, 'E2E Update Check', 'switching the design keeps the data');
  });

  test('a project that still stores a retired template id keeps working; the stored id is not rewritten', async () => {
    const legacy = requirementsFor('puja_committee', 'traditional-durga-puja', 'E2E Legacy Samiti');
    legacy.selectedTemplate = { ...metaFor('traditional-durga-puja'), templateId: 'mahasabha_royal', templateName: 'Mahasabha Royal' } as typeof legacy.selectedTemplate;
    const created = await call('POST', '/api/projects', { requirements: legacy }, adminToken);
    assert.equal(created.status, 201, created.text);
    const id = created.data.project.id;
    const gen = await call('POST', `/api/projects/${id}/generate`, {}, adminToken);
    assert.equal(gen.status, 200, gen.text);
    assert.equal(gen.data.project.generatedWebsite.selectedTemplate.templateId, 'mahasabha_royal', 'the stored id is preserved; the client maps it to its replacement when rendering');
    const wrongSide = requirementsFor('cultural_society', 'cultural-heritage', 'E2E Legacy Wrong Side');
    wrongSide.selectedTemplate = { ...metaFor('cultural-heritage'), templateId: 'mahasabha_royal' } as typeof wrongSide.selectedTemplate;
    assert.equal((await call('POST', '/api/projects', { requirements: wrongSide }, adminToken)).status, 400, 'a retired puja id still cannot be used on a society');
  });

  test('a cultural project with no template (created before the library) generates without one being invented', async () => {
    const r = requirementsFor('cultural_society', 'cultural-heritage', 'E2E No Template');
    delete (r as { selectedTemplate?: unknown }).selectedTemplate;
    const created = await call('POST', '/api/projects', { requirements: r }, adminToken);
    assert.equal(created.status, 201, created.text);
    const gen = await call('POST', `/api/projects/${created.data.project.id}/generate`, {}, adminToken);
    assert.equal(gen.status, 200, gen.text);
    assert.equal(gen.data.project.generatedWebsite.selectedTemplate, undefined);
  });

  test('Data Manager edits keep availability correct for datasets that were not part of the update', async () => {
    const created = await call('POST', '/api/projects', { requirements: requirementsFor('cultural_society', 'dance-music-association', 'E2E Data Manager') }, adminToken);
    const id = created.data.project.id;
    await call('POST', `/api/projects/${id}/generate`, {}, adminToken);
    const current = (await call('GET', `/api/projects/${id}`, undefined, adminToken)).data.project;
    const cd = structuredClone(current.generatedWebsite.culturalData);
    // Only the news changes; leadership, events and activities must remain "available"
    cd.news = [{ id: 'n1', title: 'Hello', summary: 'S', content: 'S', publishedAt: '2099-01-01', category: 'Notice', isPublished: true }];
    delete cd.leadership; delete cd.events; delete cd.activities;
    const patched = await call('PATCH', `/api/projects/${id}/cultural-data`, { culturalData: cd }, adminToken);
    assert.equal(patched.status, 200, patched.text);
    const saved = patched.data.culturalData;
    assert.equal(saved.dataAvailability.news, true);
    assert.equal(saved.dataAvailability.leadership, true, 'untouched leadership is still available');
    assert.equal(saved.dataAvailability.events, true);
    assert.equal(saved.dataAvailability.activities, true);
    assert.equal(saved.dataAvailability.sponsors, false);
    assert.equal(saved.organization.name, 'E2E Data Manager', 'the organisation profile is kept');
    assert.ok(!JSON.stringify(saved).match(/organization\.internal|Kolkata/), 'no invented fallbacks');
    const again = (await call('GET', `/api/projects/${id}`, undefined, adminToken)).data.project;
    assert.equal(again.generatedWebsite.selectedTemplate.templateId, 'dance-music-association', 'editing data never swaps the design');
  });

  test('Studio brand edits update both copies, validate their input and keep the template and other data', async () => {
    const created = await call('POST', '/api/projects', { requirements: requirementsFor('puja_committee', 'community-puja-committee', 'E2E Brand Edit Puja') }, adminToken);
    const id = created.data.project.id;
    const gen = await call('POST', `/api/projects/${id}/generate`, {}, adminToken);
    const cd = structuredClone(gen.data.project.generatedWebsite.culturalData);
    cd.branding = { ...cd.branding, primaryColor: '#0A3D62', accentColor: '#F39C12' };
    cd.organization = { ...cd.organization, tagline: 'Brand edit', name: 'SHOULD NOT CHANGE' };
    cd.leadership = [];
    const res = await call('PATCH', `/api/projects/${id}/customize`, { culturalData: cd }, adminToken);
    assert.equal(res.status, 200, res.text);
    const p = res.data.project;
    assert.equal(p.generatedWebsite.culturalData.branding.accentColor, '#F39C12');
    assert.equal(p.requirements.culturalData.branding.primaryColor, '#0A3D62');
    assert.equal(p.requirements.culturalData.organization.tagline, 'Brand edit');
    assert.equal(p.generatedWebsite.culturalData.organization.name, 'E2E Brand Edit Puja', 'only colours and the hero line are taken from a Studio edit');
    assert.equal(p.generatedWebsite.culturalData.leadership.length, 1, 'the committee is not replaced by a Studio edit');
    assert.equal(p.generatedWebsite.selectedTemplate.templateId, 'community-puja-committee');

    // A later Regenerate (a new revision) starts from the stored requirements, so the brand edit is not lost
    const regen = await call('POST', `/api/projects/${id}/generate`, {}, adminToken);
    assert.equal(regen.status, 200, regen.text);
    assert.equal(regen.data.project.generatedWebsite.culturalData.branding.accentColor, '#F39C12', 'regenerating keeps the Studio brand edit');
    assert.equal(regen.data.project.generatedWebsite.culturalData.organization.tagline, 'Brand edit');
    assert.equal(regen.data.project.generatedWebsite.selectedTemplate.templateId, 'community-puja-committee');

    const badColour = await call('PATCH', `/api/projects/${id}/customize`, { culturalData: { branding: { primaryColor: 'red' } } }, adminToken);
    assert.equal(badColour.status, 400);
    const longLine = await call('PATCH', `/api/projects/${id}/customize`, { culturalData: { organization: { tagline: 'x'.repeat(141) } } }, adminToken);
    assert.equal(longLine.status, 400);
    const sportsProject = await call('PATCH', `/api/projects/${id}/customize`, { culturalData: 'nope' }, adminToken);
    assert.equal(sportsProject.status, 200, 'a malformed value is ignored rather than stored');
    assert.equal(sportsProject.data.project.generatedWebsite.culturalData.branding.primaryColor, '#0A3D62');
  });

  test('Drive and YouTube links from the intake are kept on the project', async () => {
    const extra = { driveGalleryUrl: 'https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUv', youtubeUrls: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtubePlaylistUrls: 'https://www.youtube.com/playlist?list=PLabcdefghijklmnop' };
    const r = requirementsFor('cultural_society', 'modern-festival-organization', 'E2E Media Collective', extra);
    assert.equal(r.googleDriveGalleryUrl, extra.driveGalleryUrl);
    assert.deepEqual(r.youtubeUrls, [extra.youtubeUrls]);
    const created = await call('POST', '/api/projects', { requirements: r }, adminToken);
    assert.equal(created.status, 201, created.text);
    const got = (await call('GET', `/api/projects/${created.data.project.id}`, undefined, adminToken)).data.project;
    assert.equal(got.requirements.googleDriveGalleryUrl, extra.driveGalleryUrl);
    assert.deepEqual(got.requirements.youtubeUrls, [extra.youtubeUrls]);
    assert.equal(got.requirements.culturalData.gallery.length, 0, 'links are media sources, not gallery photographs');
  });

  test('a Drive folder link never imports demo stock photos for a Cultural project (no Google credentials)', async () => {
    for (const [category, template] of [['cultural_society', 'cultural-heritage'], ['puja_committee', 'traditional-durga-puja']] as const) {
      const r = requirementsFor(category, template, `E2E No Mock Drive ${category}`, { driveGalleryUrl: 'https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUv', youtubePlaylistUrls: 'https://www.youtube.com/playlist?list=PLabcdefghijklmnop' });
      r.googleDriveVideoUrls = ['https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUv/view'];
      const created = await call('POST', '/api/projects', { requirements: r }, adminToken);
      assert.equal(created.status, 201, created.text);
      const id = created.data.project.id;
      const items = await call('GET', `/api/media/drive/items/${id}`, undefined, adminToken);
      assert.equal(items.status, 200, items.text);
      assert.deepEqual(items.data.items.filter((i: any) => i.mediaType === 'image'), [], `${category}: no mock Drive photos imported on create`);
      assert.deepEqual(items.data.items.map((i: any) => i.mediaType), ['video'], `${category}: only the client's own video link is stored`);
      assert.ok(items.data.items.every((i: any) => !String(i.thumbnailUrl || '').includes('unsplash')), `${category}: the stored Drive video carries no stock thumbnail`);
      const yt = await call('GET', `/api/media/youtube/${id}`, undefined, adminToken);
      assert.equal(yt.status, 200, yt.text);
      assert.ok(!JSON.stringify(yt.data).includes('unsplash'), `${category}: the stored YouTube playlist carries no stock thumbnail`);

      // the explicit sync and re-sync routes behave the same way
      const sync = await call('POST', '/api/media/drive/sync', { projectId: id }, adminToken);
      assert.equal(sync.status, 200, sync.text);
      assert.deepEqual(sync.data.items.filter((i: any) => i.mediaType === 'image'), []);
      assert.ok(!JSON.stringify(sync.data.items).includes('/images/festivals/'), 'no bundled stock images');
      assert.equal(sync.data.isMock, false);
      assert.equal(sync.data.success, false);
      assert.match(String(sync.data.error || sync.data.message), /credentials are not configured/i);

      // an update that adds a folder link is covered too
      const upd = await call('PUT', `/api/projects/${id}`, { googleDriveGalleryUrl: 'https://drive.google.com/drive/folders/1ZyXwVuTsRqPoNmLkJiHgFe' }, adminToken);
      assert.equal(upd.status, 200, upd.text);
      assert.deepEqual((await call('GET', `/api/media/drive/items/${id}`, undefined, adminToken)).data.items.filter((i: any) => i.mediaType === 'image'), [], `${category}: no photos after update`);

      // generation then shows no photographs the client never supplied
      const gen = await call('POST', `/api/projects/${id}/generate`, {}, adminToken);
      assert.equal(gen.status, 200, gen.text);
      assert.equal((gen.data.project.generatedWebsite.galleryPhotos || []).length, 0, `${category}: no stock photos in the generated site`);
      assert.ok(!JSON.stringify(gen.data.project.generatedWebsite).includes('/images/festivals/'), `${category}: no bundled festival stock images`);
      const videos = gen.data.project.generatedWebsite.featuredVideos || [];
      assert.ok(videos.some((v: any) => v.provider === 'google_drive'), `${category}: the client's Drive video is still listed`);
      assert.ok(videos.some((v: any) => v.provider === 'google_drive' && /^https:\/\/drive\.google\.com\/file\/d\/[\w-]+\/preview$/.test(v.embedUrl)), `${category}: the Drive video carries a Drive player embed URL the site can play`);
      assert.ok(!JSON.stringify(videos).includes('images.unsplash.com'), `${category}: no stock thumbnails on the client's videos`);
    }
  });

  test('an uploaded logo is stored, served back, and ends up on the generated site as branding, not as a gallery photo', async () => {
    const noAuth = await call('POST', '/api/media/upload', { filename: 'logo.png', fileData: `data:image/png;base64,${PNG_1X1}`, assetType: 'logo' });
    assert.equal(noAuth.status, 401, 'uploads need a signed-in admin');
    const up = await call('POST', '/api/media/upload', { filename: 'crest.png', fileData: `data:image/png;base64,${PNG_1X1}`, assetType: 'logo' }, adminToken);
    assert.equal(up.status, 201, up.text);
    const served = await fetch(`${baseUrl}${up.data.url}`);
    assert.equal(served.status, 200);
    assert.equal(served.headers.get('content-type'), 'image/png');

    const created = await call('POST', '/api/projects', { requirements: requirementsFor('cultural_society', 'community-cultural-association', 'E2E Upload Society', { logo: up.data.url }) }, adminToken);
    assert.equal(created.status, 201, created.text);
    const gen = await call('POST', `/api/projects/${created.data.project.id}/generate`, {}, adminToken);
    const cd = gen.data.project.generatedWebsite.culturalData;
    assert.equal(cd.branding.primaryLogoUrl, up.data.url);
    assert.ok(!cd.gallery.some((g: any) => g.imageUrl === up.data.url), 'the logo is not in the gallery');
  });
});

describe('Cultural engine: project ownership between administrators', () => {
  let projectId = '';
  let tenantId = '';

  before(async () => {
    const created = await call('POST', '/api/projects', { requirements: requirementsFor('puja_committee', 'heritage-traditional-puja', 'E2E Private Samiti') }, adminToken);
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
      ['PATCH', `/api/projects/${projectId}/cultural-data`, { culturalData: { organization: { name: 'hijack' } } }],
      ['PATCH', `/api/projects/${projectId}/customize`, { culturalData: { branding: { primaryColor: '#000000' } } }],
      ['POST', `/api/projects/${projectId}/preview-tokens`, {}],
      ['GET', `/api/projects/${projectId}/revisions`, undefined],
      ['GET', `/api/projects/${projectId}/commercial`, undefined],
      ['POST', `/api/projects/${projectId}/publish`, { siteSlug: 'stolen' }],
      ['GET', `/api/media/drive/items/${projectId}`, undefined],
      ['GET', `/api/tenants/${tenantId}`, undefined],
      ['DELETE', `/api/projects/${projectId}`, undefined]
    ] as const) {
      const r = await call(method, route, body, otherAdminToken);
      assert.equal(r.status, 404, `${method} ${route} should look like it does not exist, got ${r.status}`);
    }
    const stillThere = await call('GET', `/api/projects/${projectId}`, undefined, adminToken);
    assert.equal(stillThere.status, 200, 'the owner still has it');
    assert.notEqual(stillThere.data.project.requirements.tagline, 'hijack');
    assert.equal(stillThere.data.project.requirements.culturalData.organization.name, 'E2E Private Samiti');
  });

  test('another Admin cannot take over the organisation by reusing its name or reassigning it', async () => {
    const dup = await call('POST', '/api/projects', { requirements: requirementsFor('puja_committee', 'traditional-durga-puja', 'E2E Private Samiti') }, otherAdminToken);
    assert.equal(dup.status, 409, dup.text);
    assert.equal(dup.data.code, 'ORGANIZATION_NOT_AVAILABLE');
    const patch = await call('PATCH', `/api/tenants/${tenantId}`, { assignedAdminId: 'someone-else' }, otherAdminToken);
    assert.equal(patch.status, 404);
  });

  test('the Super Admin sees every project and can read this one', async () => {
    const list = await call('GET', '/api/projects', undefined, superToken);
    assert.ok(list.data.projects.some((p: any) => p.id === projectId));
    assert.equal((await call('GET', `/api/projects/${projectId}`, undefined, superToken)).status, 200);
  });

  test('unauthenticated requests are refused', async () => {
    assert.equal((await call('GET', `/api/projects/${projectId}`)).status, 401);
    assert.equal((await call('PATCH', `/api/projects/${projectId}/cultural-data`, { culturalData: {} })).status, 401);
  });
});
