// Must stay the first import: prepares the isolated test environment (temporary database, no real server) before the app loads.
import { baseUrl, FIXTURE_ADMIN, FIXTURE_SUPER_ADMIN } from './helpers/testContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import { getNgoTemplateList } from '../../client/src/templates/ngo/registry.ts';
import { emptyForm, buildRequirements } from '../../client/src/components/admin/ngo-intake/model.ts';
import type { NgoArchetypeId } from '../../client/src/templates/ngo/ids.ts';

/**
 * Social & NGO Website Creation Engine, end to end through the real HTTP API, one run per template in the library:
 * create the project from the real intake model -> persisted selection and data -> generate -> client preview link ->
 * client approval -> publish locally WITHOUT any payment (Social & NGO sites are exempt) -> the public site carries the same
 * template and none of the private fields. Plus validation, the retired donation endpoint, media rules and project ownership.
 */

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
  const t = getNgoTemplateList().find((x) => x.id === id)!;
  return { templateId: t.id, templateVersion: t.source.commit, templateName: t.name, websiteCategory: t.archetype, selectedAt: new Date().toISOString() };
};

/** Requirements exactly as the intake wizard builds them, with a small amount of fictional content. */
function requirementsFor(archetype: NgoArchetypeId, templateId: string, name: string, extra: Record<string, string> = {}) {
  const f = emptyForm(metaFor(templateId) as never);
  f.v.name = name;
  f.v.email = 'hello@e2e-ngo.example';
  f.v.tagline = `Tagline for ${name}`;
  f.v.mission = 'A fictional mission used only in automated tests.';
  f.v.description = 'A fictional organisation used only in automated tests.';
  f.v.city = 'Testville';
  f.lists.programs = [{ id: 'p1', title: 'Test larder', category: 'Food', summary: 'A weekly larder.', description: '', beneficiary: '', locations: '', outcomes: '', image: '', status: 'active' }];
  f.lists.leadership = [{ id: 'l1', name: 'Asha Rao', role: 'Chairperson', tier: 'board', bio: '', photo: '', linkedin: '' }];
  f.lists.stories = [{ id: 's1', name: 'Grace', location: 'Testville', quote: 'A fictional quote.', story: '', photo: '' }];
  Object.assign(f.v, extra);
  return buildRequirements(f, archetype);
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
  const other = { email: 'ngo-second-admin@digiverse.internal', username: 'ngo-second-admin', password: 'SecondAdmin@2026!' };
  await repository.createUser({
    id: randomUUID(), email: other.email, username: other.username, passwordHash: await bcrypt.default.hash(other.password, 10),
    name: 'Second Admin', role: 'ADMIN', isActive: true
  });
  otherAdminToken = await login(other);
});

const TEMPLATES = getNgoTemplateList();

describe(`Social & NGO engine: all ${TEMPLATES.length} templates through the real API`, () => {
  test('the library has templates to test', () => {
    assert.ok(TEMPLATES.length > 0);
  });

  for (const template of TEMPLATES) {
    test(`${template.archetype} / ${template.id}: create, persist, generate, preview, publish without approval or payment, serve`, async () => {
      const name = `E2E ${template.name}`;
      const slug = `e2e-${template.id}`;

      // 1. Create from the real intake output
      const created = await call('POST', '/api/projects', { requirements: requirementsFor(template.archetype, template.id, name) }, adminToken);
      assert.equal(created.status, 201, created.text);
      const id: string = created.data.project.id;
      assert.equal(created.data.project.requirements.selectedTemplate.templateId, template.id, 'selection stored on create');
      assert.equal(created.data.project.requirements.ngoArchetype, template.archetype);
      assert.equal(created.data.project.requirements.category, 'ngo_social');

      // 2. Selection and data come back from the database
      const stored = await call('GET', `/api/projects/${id}`, undefined, adminToken);
      assert.equal(stored.status, 200, stored.text);
      assert.equal(stored.data.project.requirements.selectedTemplate.templateId, template.id, 'selection persisted');
      assert.equal(stored.data.project.requirements.ngoData.profile.name, name, 'client data persisted');
      assert.equal(stored.data.project.requirements.ngoData.profile.tagline, `Tagline for ${name}`);

      // 3. Generation keeps the chosen template and the client's data, and invents nothing
      const gen = await call('POST', `/api/projects/${id}/generate`, {}, adminToken);
      assert.equal(gen.status, 200, gen.text);
      const site = gen.data.project.generatedWebsite;
      assert.equal(site.selectedTemplate.templateId, template.id, 'generated website carries the same template');
      assert.equal(site.ngoData.profile.name, name);
      assert.equal(site.ngoData.profile.city, 'Testville');
      assert.equal(site.ngoData.profile.contactPhone, '', 'no invented phone number');
      assert.equal(site.ngoData.profile.registrationNumber, undefined, 'no invented registration number');
      assert.equal(site.ngoData.donationModel.donationTiers.length, 0, 'no invented donation tiers');
      assert.equal(site.ngoData.donationModel.directTransferDetails, undefined, 'no bank or UPI details');
      assert.ok(!JSON.stringify(site.ngoData).match(/State Bank|SBIN|ngo\.relief|80G|FCRA|Gram Chetna|New Delhi|REG-NGO/), 'no placeholder or payment data');
      assert.equal(site.ngoData.partners.length, 0, 'no invented partners');

      // 4. Client preview link serves that same template
      const token = await call('POST', `/api/projects/${id}/preview-tokens`, {}, adminToken);
      assert.equal(token.status, 201, token.text);
      const preview = await call('GET', `/api/preview/${token.data.token.token}`);
      assert.equal(preview.status, 200, preview.text);
      assert.equal(preview.data.website.selectedTemplate.templateId, template.id, 'client preview uses the same template');
      assert.ok(preview.data.website.ngoData, 'preview carries the data the template needs');

      // 5. Publish locally with no client approval, quotation or payment
      const pre = await call('GET', `/api/projects/${id}/publishing/preflight?siteSlug=${slug}`, undefined, adminToken);
      assert.equal(pre.status, 200, pre.text);
      assert.equal(pre.data.isReadyToPublish, true, JSON.stringify(pre.data.blockers));
      assert.ok(!('isCommerciallyCleared' in pre.data.checks), 'no payment check exists any more');
      const published = await call('POST', `/api/projects/${id}/publish`, { siteSlug: slug }, adminToken);
      assert.equal(published.status, 200, published.text);
      assert.match(published.data.deployedUrl, new RegExp(`/live/${slug}$`));

      // 6. The public site: same template, same data, no private fields
      const live = await call('GET', `/api/live/${slug}`);
      assert.equal(live.status, 200, live.text);
      assert.equal(live.data.generatedWebsite.selectedTemplate.templateId, template.id, 'public site keeps the selected design');
      assert.equal(live.data.generatedWebsite.ngoData.profile.name, name);
      assert.equal(live.data.generatedWebsite.ngoData.leadership[0].name, 'Asha Rao');
      assert.equal(live.data.generatedWebsite.ngoData.volunteerSubmissions, undefined, 'volunteer applications are never public');
      assert.equal(live.data.generatedWebsite.ngoData.donationEnquiries, undefined, 'donation enquiries are never public');
      assert.ok(!live.text.includes('deployedByAdminId'), 'internal fields are not public');
    });
  }
});

describe('Social & NGO engine: validation, retired donation endpoint, media', () => {
  const first = TEMPLATES[0];

  test('an unknown template is refused on create and on update; legacy design ids are still accepted', async () => {
    const unknown = requirementsFor(first.archetype, first.id, 'E2E Unknown');
    unknown.selectedTemplate = { ...metaFor(first.id), templateId: 'does-not-exist' } as typeof unknown.selectedTemplate;
    const r = await call('POST', '/api/projects', { requirements: unknown }, adminToken);
    assert.equal(r.status, 400);
    assert.match(r.data.error, /Unknown Social & NGO template/);

    const ok = await call('POST', '/api/projects', { requirements: requirementsFor(first.archetype, first.id, 'E2E Update Check') }, adminToken);
    assert.equal(ok.status, 201, ok.text);
    const bad = await call('PUT', `/api/projects/${ok.data.project.id}`, { selectedTemplate: { ...metaFor(first.id), templateId: 'nope' } }, adminToken);
    assert.equal(bad.status, 400);
    const legacy = await call('PUT', `/api/projects/${ok.data.project.id}`, { selectedTemplate: { ...metaFor(first.id), templateId: 'ngo_impact', templateName: 'Impact & Mission' } }, adminToken);
    assert.equal(legacy.status, 200, 'a design recorded before the library is still valid');
  });

  test('a template that belongs to another archetype is refused', async () => {
    const other = (['grassroots_ngo', 'institutional_foundation', 'cause_charity'] as NgoArchetypeId[]).find((a) => a !== first.archetype)!;
    const r = requirementsFor(other, first.id, 'E2E Wrong Archetype');
    const res = await call('POST', '/api/projects', { requirements: r }, adminToken);
    assert.equal(res.status, 400, res.text);
    assert.match(res.data.error, /belongs to/);
  });

  test('publishing needs no payment or client approval for any engine', async () => {
    const created = await call('POST', '/api/projects', {
      requirements: { organizationName: 'E2E Open Association', category: 'professional', organizationType: 'professional', contactEmail: 'open@e2e.example', tagline: 'Open', aboutText: 'A fictional association.' }
    }, adminToken);
    assert.equal(created.status, 201, created.text);
    const id = created.data.project.id;
    assert.equal((await call('POST', `/api/projects/${id}/generate`, {}, adminToken)).status, 200);
    const published = await call('POST', `/api/projects/${id}/publish`, { siteSlug: 'e2e-open-association' }, adminToken);
    assert.equal(published.status, 200, published.text);
    assert.equal(published.data.deployment.status, 'ready');
    assert.equal((await call('POST', `/api/projects/${id}/approve`, { approvedBy: 'Rep' }, adminToken)).status, 404, 'the approval route was removed');
  });

  test('the donation pledge endpoint is retired: 410 and nothing is stored', async () => {
    const created = await call('POST', '/api/projects', { requirements: requirementsFor(first.archetype, first.id, 'E2E No Pledges') }, adminToken);
    const id = created.data.project.id;
    const res = await call('POST', `/api/projects/${id}/donation-enquiry`, { donorName: 'Donor', donorEmail: 'donor@e2e.example', amount: 500, panNumber: 'ABCDE1234F' });
    assert.equal(res.status, 410);
    const after = (await call('GET', `/api/projects/${id}`, undefined, adminToken)).data.project;
    assert.deepEqual(after.requirements.ngoData.donationEnquiries || [], []);
    assert.ok(!JSON.stringify(after).includes('ABCDE1234F'), 'no tax id is stored');
  });

  test('a request that tries to add bank, UPI or tiers through the data endpoint cannot', async () => {
    const created = await call('POST', '/api/projects', { requirements: requirementsFor(first.archetype, first.id, 'E2E Payment Attempt') }, adminToken);
    const id = created.data.project.id;
    const res = await call('PATCH', `/api/projects/${id}/ngo-data`, {
      ngoData: {
        profile: { name: 'E2E Payment Attempt', contactEmail: 'x@e2e.example' },
        donationModel: { headline: 'Donate', donationTiers: [{ id: 't', amount: 100, currency: 'INR', label: 'x', impactEquivalence: 'y' }], directTransferDetails: { bankName: 'Some Bank', upiId: 'a@b' }, customAmountAllowed: true, taxDeductible: true, enquiryOnly: false }
      }
    }, adminToken);
    assert.equal(res.status, 200, res.text);
    assert.ok(!JSON.stringify(res.data.ngoData).match(/Some Bank|a@b/), 'no payment details are stored');
    assert.equal(res.data.ngoData.donationModel.donationTiers.length, 0);
    assert.equal(res.data.ngoData.profile.registrationNumber, undefined, 'nothing is invented by the update either');
  });

  test('a Drive folder link never imports demo stock photos for a Social & NGO project (no Google credentials)', async () => {
    const r = requirementsFor(first.archetype, first.id, 'E2E No Mock Drive', { driveGalleryUrl: 'https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUv' });
    r.googleDriveVideoUrls = ['https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUv/view'];
    const created = await call('POST', '/api/projects', { requirements: r }, adminToken);
    assert.equal(created.status, 201, created.text);
    const id = created.data.project.id;
    const items = await call('GET', `/api/media/drive/items/${id}`, undefined, adminToken);
    assert.equal(items.status, 200, items.text);
    assert.deepEqual(items.data.items.filter((i: any) => i.mediaType === 'image'), [], 'no mock Drive photos imported on create');
    assert.ok(items.data.items.every((i: any) => !String(i.thumbnailUrl || '').includes('unsplash')), 'the stored Drive video carries no stock thumbnail');
  });

  test('an uploaded logo is stored and ends up in the project branding', async () => {
    const noAuth = await call('POST', '/api/media/upload', { filename: 'logo.png', fileData: `data:image/png;base64,${PNG_1X1}`, assetType: 'logo' });
    assert.equal(noAuth.status, 401, 'uploads need a signed-in admin');
    const up = await call('POST', '/api/media/upload', { filename: 'crest.png', fileData: `data:image/png;base64,${PNG_1X1}`, assetType: 'logo' }, adminToken);
    assert.equal(up.status, 201, up.text);
    const url: string = up.data.url || up.data.asset?.url;
    assert.ok(url, 'upload returns a URL');
    const r = requirementsFor(first.archetype, first.id, 'E2E Logo', { logo: url });
    const created = await call('POST', '/api/projects', { requirements: r }, adminToken);
    const gen = await call('POST', `/api/projects/${created.data.project.id}/generate`, {}, adminToken);
    assert.equal(gen.data.project.generatedWebsite.ngoData.branding.logoUrl, url);
  });
});

describe('Social & NGO engine: project ownership between administrators', () => {
  let projectId = '';
  before(async () => {
    const created = await call('POST', '/api/projects', { requirements: requirementsFor(TEMPLATES[0].archetype, TEMPLATES[0].id, 'E2E Private Trust') }, adminToken);
    assert.equal(created.status, 201, created.text);
    projectId = created.data.project.id;
  });

  test('another Admin cannot list, read, change, generate, publish, or delete it', async () => {
    const list = await call('GET', '/api/projects', undefined, otherAdminToken);
    assert.ok(!list.data.projects.some((p: any) => p.id === projectId), 'not in the other admin\'s list');
    const attempts: [string, string, unknown][] = [
      ['GET', `/api/projects/${projectId}`, undefined],
      ['PUT', `/api/projects/${projectId}`, { tagline: 'hijack' }],
      ['PATCH', `/api/projects/${projectId}/ngo-data`, { ngoData: { profile: { name: 'x' } } }],
      ['POST', `/api/projects/${projectId}/generate`, {}],
      ['POST', `/api/projects/${projectId}/publish`, { siteSlug: 'hijack' }],
      ['DELETE', `/api/projects/${projectId}`, undefined]
    ];
    for (const [method, route, body] of attempts) {
      const r = await call(method, route, body, otherAdminToken);
      assert.ok([403, 404].includes(r.status), `${method} ${route} should be refused, got ${r.status}`);
    }
  });

  test('another Admin cannot reuse the organisation name', async () => {
    const dup = await call('POST', '/api/projects', { requirements: requirementsFor(TEMPLATES[0].archetype, TEMPLATES[0].id, 'E2E Private Trust') }, otherAdminToken);
    assert.ok([400, 403, 409].includes(dup.status), `reusing another admin's organisation name must fail, got ${dup.status}`);
  });

  test('the Super Admin can read it, and unauthenticated requests are refused', async () => {
    const r = await call('GET', `/api/projects/${projectId}`, undefined, superToken);
    assert.equal(r.status, 200, r.text);
    assert.equal((await call('GET', `/api/projects/${projectId}`)).status, 401);
  });
});
