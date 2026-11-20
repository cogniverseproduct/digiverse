// Must stay the first import: prepares the isolated test environment (temporary database, no real server) before the app loads.
import { baseUrl, FIXTURE_ADMIN, FIXTURE_SUPER_ADMIN } from './helpers/testContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import { getEventTemplateList } from '../../client/src/templates/event/registry.ts';
import { emptyForm, buildRequirements } from '../../client/src/components/admin/event-intake/model.ts';
import type { EventCategoryId } from '../../client/src/templates/event/ids.ts';
import { EVENT_CATEGORY_IDS } from '../../client/src/templates/event/ids.ts';

/**
 * Event Website Creation Engine, end to end through the real HTTP API, one run per template in the library:
 * create the project from the real intake model -> persisted selection and data -> generate -> client preview link ->
 * client approval -> publish locally WITHOUT any payment (Event sites are exempt) -> the public site carries the same
 * template and none of the private fields. Plus validation, the strict (non-fabricating) data update, RSVP rules and ownership.
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
  const t = getEventTemplateList().find((x) => x.id === id)!;
  return { templateId: t.id, templateVersion: t.version, templateName: t.name, websiteCategory: t.category, selectedAt: new Date().toISOString() };
};

/** Requirements exactly as the intake wizard builds them, with a small amount of fictional content. */
function requirementsFor(category: EventCategoryId, templateId: string, name: string, extra: Record<string, string> = {}) {
  const f = emptyForm(category, metaFor(templateId) as never);
  f.v.name = name;
  f.v.email = 'hello@e2e-event.example';
  f.v.tagline = `Tagline for ${name}`;
  f.v.description = 'A fictional event used only in automated tests.';
  f.v.startDate = '2027-03-18';
  f.v.endDate = '2027-03-19';
  f.v.startTime = '09:30';
  f.v.venueName = 'Test Hall';
  f.v.city = 'Testville';
  f.lists.speakers = [{ id: 's1', name: 'Asha Rao', role: 'speaker', title: 'Engineer', organization: 'Example Co', topic: 'A test talk', bio: '', photo: '', social: '', featured: '' }];
  f.lists.sessions = [{ id: 'x1', title: 'Opening', description: '', day: '', date: '2027-03-18', startTime: '09:30', endTime: '10:00', track: 'Main', stage: '', speakers: 'Asha Rao', kind: 'keynote' }];
  f.lists.tickets = [{ id: 't1', name: 'Standard', price: '199', currency: 'gbp', description: 'Both days', features: 'Entry\nLunch', badge: '', url: 'https://tickets.example/standard', available: '' }];
  Object.assign(f.v, extra);
  return buildRequirements(f);
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
  const other = { email: 'event-second-admin@digiverse.internal', username: 'event-second-admin', password: 'SecondAdmin@2026!' };
  await repository.createUser({
    id: randomUUID(), email: other.email, username: other.username, passwordHash: await bcrypt.default.hash(other.password, 10),
    name: 'Second Admin', role: 'ADMIN', isActive: true
  });
  otherAdminToken = await login(other);
});

const TEMPLATES = getEventTemplateList();

describe(`Event engine: all ${TEMPLATES.length} templates through the real API`, () => {
  test('the library has templates to test', () => {
    assert.ok(TEMPLATES.length > 0);
  });

  for (const template of TEMPLATES) {
    test(`${template.category} / ${template.id}: create, persist, generate, preview, publish without approval or payment, serve`, async () => {
      const name = `E2E ${template.name}`;
      const slug = `e2e-${template.id}`;

      // 1. Create from the real intake output
      const created = await call('POST', '/api/projects', { requirements: requirementsFor(template.category, template.id, name) }, adminToken);
      assert.equal(created.status, 201, created.text);
      const id: string = created.data.project.id;
      assert.equal(created.data.project.requirements.selectedTemplate.templateId, template.id, 'selection stored on create');
      assert.equal(created.data.project.requirements.selectedTemplate.templateVersion, template.version, 'template version stored');
      assert.equal(created.data.project.requirements.eventCategory, template.category);
      assert.equal(created.data.project.requirements.category, 'event');

      // 2. Selection and data come back from the database
      const stored = await call('GET', `/api/projects/${id}`, undefined, adminToken);
      assert.equal(stored.status, 200, stored.text);
      assert.equal(stored.data.project.requirements.selectedTemplate.templateId, template.id, 'selection persisted');
      assert.equal(stored.data.project.requirements.eventData.profile.name, name, 'client data persisted');
      assert.equal(stored.data.project.requirements.eventData.profile.venueName, 'Test Hall');

      // 3. Generation keeps the chosen template and the client's data, and invents nothing
      const gen = await call('POST', `/api/projects/${id}/generate`, {}, adminToken);
      assert.equal(gen.status, 200, gen.text);
      const site = gen.data.project.generatedWebsite;
      assert.equal(site.selectedTemplate.templateId, template.id, 'generated website carries the same template');
      assert.equal(site.eventData.profile.name, name);
      assert.equal(site.eventData.profile.city, 'Testville');
      assert.equal(site.eventData.profile.country, '', 'no invented country');
      assert.equal(site.eventData.profile.organizerPhone, undefined, 'no invented phone number');
      assert.equal(site.eventData.profile.organizerEmail, 'hello@e2e-event.example');
      assert.equal(site.eventData.sponsors.length, 0, 'no invented sponsors');
      assert.equal(site.eventData.faqs.length, 0, 'no invented FAQs');
      assert.equal(site.eventData.gallery.length, 0, 'no invented gallery');
      assert.ok(!JSON.stringify(site.eventData).match(/Bangalore|Kolkata|Rick Astley|event\.internal|digiverse\.internal|\+91 80|Convention & Exhibition/), 'no placeholder data');
      assert.equal(site.eventData.tickets[0].registrationUrl, 'https://tickets.example/standard', 'ticket button is the organiser\'s own external link');
      assert.equal(site.eventData.tickets[0].currency, 'GBP');

      // 4. Client preview link serves that same template
      const token = await call('POST', `/api/projects/${id}/preview-tokens`, {}, adminToken);
      assert.equal(token.status, 201, token.text);
      const preview = await call('GET', `/api/preview/${token.data.token.token}`);
      assert.equal(preview.status, 200, preview.text);
      assert.equal(preview.data.website.selectedTemplate.templateId, template.id, 'client preview uses the same template');
      assert.ok(preview.data.website.eventData, 'preview carries the data the template needs');

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
      assert.equal(live.data.generatedWebsite.eventData.profile.name, name);
      assert.equal(live.data.generatedWebsite.eventData.speakers[0].name, 'Asha Rao');
      assert.equal(live.data.generatedWebsite.eventData.rsvpSubmissions, undefined, 'RSVP replies are never public');
      assert.ok(!live.text.includes('deployedByAdminId'), 'internal fields are not public');
    });
  }
});

describe('Event engine: validation, strict data, RSVP, media', () => {
  const first = TEMPLATES[0];

  test('an unknown template is refused on create and on update', async () => {
    const unknown = requirementsFor(first.category, first.id, 'E2E Unknown');
    unknown.selectedTemplate = { ...metaFor(first.id), templateId: 'does-not-exist' } as typeof unknown.selectedTemplate;
    const r = await call('POST', '/api/projects', { requirements: unknown }, adminToken);
    assert.equal(r.status, 400);
    assert.match(r.data.error, /Unknown Event template/);

    const ok = await call('POST', '/api/projects', { requirements: requirementsFor(first.category, first.id, 'E2E Update Check') }, adminToken);
    assert.equal(ok.status, 201, ok.text);
    const bad = await call('PUT', `/api/projects/${ok.data.project.id}`, { selectedTemplate: { ...metaFor(first.id), templateId: 'nope' } }, adminToken);
    assert.equal(bad.status, 400);
  });

  test('an unknown event category is refused (never silently replaced)', async () => {
    const r = requirementsFor(first.category, first.id, 'E2E Bad Category');
    (r as unknown as Record<string, unknown>).eventCategory = 'garden_party';
    const res = await call('POST', '/api/projects', { requirements: r }, adminToken);
    assert.equal(res.status, 400, res.text);
    assert.match(res.data.error, /Unknown event category/);
  });

  test('a template that belongs to another event category is refused', async () => {
    const other = EVENT_CATEGORY_IDS.find((c) => c !== first.category)!;
    const r = requirementsFor(other, first.id, 'E2E Wrong Category');
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
    const published = await call('POST', `/api/projects/${id}/publish`, { siteSlug: 'e2e-event-open-association' }, adminToken);
    assert.equal(published.status, 200, published.text);
    assert.equal(published.data.deployment.status, 'ready');
    assert.equal((await call('POST', `/api/projects/${id}/approve`, { approvedBy: 'Rep' }, adminToken)).status, 404, 'the approval route was removed');
  });

  test('the data endpoint is strict: nothing is invented, bad links and colours are dropped, stored RSVPs survive', async () => {
    const created = await call('POST', '/api/projects', { requirements: requirementsFor(first.category, first.id, 'E2E Strict Update') }, adminToken);
    const id = created.data.project.id;
    const rsvp = await call('POST', `/api/projects/${id}/rsvp`, { guestName: 'Guest One', guestEmail: 'guest.one@e2e.example', attending: 'attending' });
    assert.equal(rsvp.status, 200, rsvp.text);

    const res = await call('PATCH', `/api/projects/${id}/event-data`, {
      eventData: {
        profile: { name: 'E2E Strict Update', socialLinks: { instagram: 'javascript:alert(1)', youtube: 'https://youtube.example/channel' } },
        branding: { primaryColor: 'red', accentColor: '#112233' },
        tickets: [{ name: 'Standard', price: 199, currency: 'gbp', registrationUrl: 'javascript:alert(1)', cardNumber: '4242424242424242', upiId: 'a@b' }],
        rsvpSubmissions: []
      }
    }, adminToken);
    assert.equal(res.status, 200, res.text);
    const data = res.data.eventData;
    assert.equal(data.profile.city, '', 'nothing is invented by the update');
    assert.equal(data.profile.country, '');
    assert.equal(data.profile.organizerPhone, undefined);
    assert.equal(data.profile.socialLinks.instagram, undefined, 'a non-http link is dropped');
    assert.equal(data.profile.socialLinks.youtube, 'https://youtube.example/channel');
    assert.equal(data.branding.primaryColor, '', 'an invalid colour is dropped');
    assert.equal(data.branding.accentColor, '#112233');
    assert.equal(data.tickets[0].registrationUrl, undefined, 'a non-http booking link is dropped');
    assert.ok(!JSON.stringify(data).match(/4242|cardNumber|upiId|a@b/), 'no card or UPI data is stored');
    assert.equal(data.rsvpSubmissions.length, 1, 'a client payload can never erase stored replies');
    assert.equal(data.rsvpSubmissions[0].guestEmail, 'guest.one@e2e.example');
  });

  test('an unknown category is refused by the data endpoint', async () => {
    const created = await call('POST', '/api/projects', { requirements: requirementsFor(first.category, first.id, 'E2E Data Category') }, adminToken);
    const id = created.data.project.id;
    const res = await call('PATCH', `/api/projects/${id}/event-data`, { eventData: { category: 'garden_party', profile: { name: 'x' } } }, adminToken);
    assert.equal(res.status, 400, res.text);
  });

  test('RSVP: validated, stored privately, never public, event projects only, rate limited', async () => {
    const created = await call('POST', '/api/projects', { requirements: requirementsFor(first.category, first.id, 'E2E Guest List') }, adminToken);
    const id = created.data.project.id;

    const noName = await call('POST', `/api/projects/${id}/rsvp`, { guestEmail: 'a@e2e.example' });
    assert.equal(noName.status, 400);
    const badEmail = await call('POST', `/api/projects/${id}/rsvp`, { guestName: 'Guest', guestEmail: 'not-an-email' });
    assert.equal(badEmail.status, 400);
    assert.match(badEmail.data.error, /valid email/);

    const ok = await call('POST', `/api/projects/${id}/rsvp`, { guestName: '  Guest Two  ', guestEmail: 'guest.two@e2e.example', attending: 'declined', plusOnes: 999, dietaryNotes: 'none\u0000' });
    assert.equal(ok.status, 200, ok.text);
    assert.equal(ok.data.submission.guestName, 'Guest Two');
    assert.equal(ok.data.submission.plusOnes, 20, 'plus-ones are capped');
    assert.equal(ok.data.submission.attending, 'declined');
    assert.ok(!ok.data.submission.dietaryNotes.includes('\u0000'), 'control characters are removed');

    const adminView = await call('GET', `/api/projects/${id}`, undefined, adminToken);
    assert.ok(adminView.data.project.requirements.eventData.rsvpSubmissions.some((r: any) => r.guestEmail === 'guest.two@e2e.example'), 'the owner can read replies');

    // generate + publish: replies must not appear on the public site
    assert.equal((await call('POST', `/api/projects/${id}/generate`, {}, adminToken)).status, 200);
    assert.equal((await call('POST', `/api/projects/${id}/publish`, { siteSlug: 'e2e-event-guest-list' }, adminToken)).status, 200);
    const live = await call('GET', '/api/live/e2e-event-guest-list');
    assert.ok(!live.text.includes('guest.two@e2e.example'), 'a guest email is never in the public payload');
    assert.ok(!live.text.includes('rsvpSubmissions'), 'the replies key is not public');

    // a non-event project is not an RSVP target
    const other = await call('POST', '/api/projects', { requirements: { organizationName: 'E2E Not An Event', category: 'professional', organizationType: 'professional', contactEmail: 'x@e2e.example', tagline: 'x', aboutText: 'x' } }, adminToken);
    const notEvent = await call('POST', `/api/projects/${other.data.project.id}/rsvp`, { guestName: 'Guest', guestEmail: 'g@e2e.example' });
    assert.equal(notEvent.status, 404);

    // rate limit: ten per visitor per project per hour (two already used above for this project: one rejected earlier counted too)
    let limited = 0;
    for (let i = 0; i < 14; i++) {
      const r = await call('POST', `/api/projects/${id}/rsvp`, { guestName: `Bulk ${i}`, guestEmail: `bulk${i}@e2e.example` });
      if (r.status === 429) limited += 1;
    }
    assert.ok(limited > 0, 'repeated submissions are rate limited');
  });

  test('a Drive folder link never imports demo stock photos for an Event project (no Google credentials)', async () => {
    const r = requirementsFor(first.category, first.id, 'E2E No Mock Drive', { driveGalleryUrl: 'https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUv' });
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
    const r = requirementsFor(first.category, first.id, 'E2E Logo', { logo: url });
    const created = await call('POST', '/api/projects', { requirements: r }, adminToken);
    const gen = await call('POST', `/api/projects/${created.data.project.id}/generate`, {}, adminToken);
    assert.equal(gen.data.project.generatedWebsite.eventData.branding.logoUrl, url);
  });
});

describe('Event engine: project ownership between administrators', () => {
  let projectId = '';
  before(async () => {
    const created = await call('POST', '/api/projects', { requirements: requirementsFor(TEMPLATES[0].category, TEMPLATES[0].id, 'E2E Private Summit') }, adminToken);
    assert.equal(created.status, 201, created.text);
    projectId = created.data.project.id;
  });

  test('another Admin cannot list, read, change, generate, publish, or delete it', async () => {
    const list = await call('GET', '/api/projects', undefined, otherAdminToken);
    assert.ok(!list.data.projects.some((p: any) => p.id === projectId), 'not in the other admin\'s list');
    const attempts: [string, string, unknown][] = [
      ['GET', `/api/projects/${projectId}`, undefined],
      ['PUT', `/api/projects/${projectId}`, { tagline: 'hijack' }],
      ['PATCH', `/api/projects/${projectId}/event-data`, { eventData: { profile: { name: 'x' } } }],
      ['POST', `/api/projects/${projectId}/generate`, {}],
      ['POST', `/api/projects/${projectId}/publish`, { siteSlug: 'hijack' }],
      ['DELETE', `/api/projects/${projectId}`, undefined]
    ];
    for (const [method, route, body] of attempts) {
      const r = await call(method, route, body, otherAdminToken);
      assert.ok([403, 404].includes(r.status), `${method} ${route} should be refused, got ${r.status}`);
    }
  });

  test('the Super Admin can read it, and unauthenticated requests are refused', async () => {
    const r = await call('GET', `/api/projects/${projectId}`, undefined, superToken);
    assert.equal(r.status, 200, r.text);
    assert.equal((await call('GET', `/api/projects/${projectId}`)).status, 401);
  });
});
