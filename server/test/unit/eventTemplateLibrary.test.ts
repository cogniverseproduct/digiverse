import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';

import { EVENT_TEMPLATES, getEventTemplateById, getEventTemplatesByCategory } from '../../../client/src/templates/event/registry.ts';
import { ALL_EVENT_TEMPLATE_IDS, EVENT_CATEGORY_IDS, EVENT_TEMPLATE_IDS_BY_CATEGORY, isEventTemplateIdLite, categoryOfEventTemplate } from '../../../client/src/templates/event/ids.ts';
import { bindTemplate, visibleText } from '../../../client/src/templates/ngo/engine/mapping.ts';
import { normalizeEvent } from '../../../client/src/templates/event/kit/data.ts';
import { getEventDemoData, getMinimalEventData } from '../../../client/src/templates/event/demos/demoData.ts';
import { emptyForm, buildRequirements, stepsFor, validateStep, validateAll, pruneBlank, mergeDraft } from '../../../client/src/components/admin/event-intake/model.ts';
import {
  EVENT_TEMPLATE_IDS_BY_CATEGORY as SERVER_IDS, ALL_EVENT_TEMPLATE_IDS as SERVER_ALL, EVENT_CATEGORY_IDS as SERVER_CATEGORIES, validateEventFields,
  eventCategoryForTemplate, isEventLibraryTemplate, isEventReqs
} from '../../src/services/eventCatalog.js';
import { sanitizeWebsiteForPublic } from '../../src/services/publicSiteSanitizer.js';
import { normalizeEventDataStrict } from '../../src/services/aiGenerator.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '../../../client');
const bundle = (id: string, file = '') => path.join(clientRoot, 'public/event-templates', id, file);
const parse = (html: string) => parseHTML(html).document as unknown as Document;
const ALLOWED_LICENSES = ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC', 'CC0-1.0', 'CC-BY-3.0', 'CC-BY-4.0'];
const PAYMENT = /\b(card\s*number|cvv|upi|razorpay|stripe|paypal|checkout|pay\s*now|add\s*to\s*cart|ifsc|account\s*number)\b/i;
const metaFor = (id: string) => {
  const t = getEventTemplateById(id)!;
  return { templateId: t.id, templateVersion: t.version, templateName: t.name, websiteCategory: t.category, selectedAt: new Date().toISOString(), designTokens: {} } as never;
};

describe('Event template library: registry and catalog', () => {
  test('the seven fixed categories exist and registry, ids and server catalog agree exactly', () => {
    assert.deepEqual([...EVENT_CATEGORY_IDS], ['conference_seminar', 'festival_concert', 'corporate_business', 'exhibition_trade', 'wedding_private', 'award_ceremony', 'launch_reveal']);
    assert.deepEqual([...SERVER_CATEGORIES], [...EVENT_CATEGORY_IDS]);
    assert.deepEqual([...EVENT_TEMPLATES.map((t) => t.id)].sort(), [...ALL_EVENT_TEMPLATE_IDS].sort());
    assert.deepEqual([...SERVER_ALL].sort(), [...ALL_EVENT_TEMPLATE_IDS].sort());
    for (const c of EVENT_CATEGORY_IDS) {
      assert.deepEqual([...SERVER_IDS[c]].sort(), [...EVENT_TEMPLATE_IDS_BY_CATEGORY[c]].sort(), `server ids for ${c}`);
      assert.deepEqual(getEventTemplatesByCategory(c).map((t) => t.id).sort(), [...EVENT_TEMPLATE_IDS_BY_CATEGORY[c]].sort(), `registry for ${c}`);
    }
  });

  test('ids are unique kebab-case and disjoint from the other engines', async () => {
    assert.equal(new Set(ALL_EVENT_TEMPLATE_IDS).size, ALL_EVENT_TEMPLATE_IDS.length);
    const { ALL_NGO_TEMPLATE_IDS } = await import('../../../client/src/templates/ngo/ids.ts') as { ALL_NGO_TEMPLATE_IDS: string[] };
    const { ALL_CULTURAL_IDS } = await import('../../../client/src/templates/cultural/ids.ts') as { ALL_CULTURAL_IDS: string[] };
    const { ALL_SPORTS_IDS } = await import('../../../client/src/templates/sports/ids.ts').catch(() => ({ ALL_SPORTS_IDS: [] as string[] })) as { ALL_SPORTS_IDS?: string[] };
    const others = new Set([...ALL_NGO_TEMPLATE_IDS, ...ALL_CULTURAL_IDS, ...(ALL_SPORTS_IDS || [])]);
    for (const id of ALL_EVENT_TEMPLATE_IDS) {
      assert.match(id, /^[a-z0-9]+(-[a-z0-9]+)*$/);
      assert.ok(!others.has(id), `${id} collides with another engine`);
      assert.ok(isEventTemplateIdLite(id));
      assert.equal(categoryOfEventTemplate(id), eventCategoryForTemplate(id));
      assert.ok(isEventLibraryTemplate(id));
    }
  });

  test('every template is a real third-party template with a verified source, an allowed licence and nothing invented', () => {
    for (const t of EVENT_TEMPLATES) {
      const s = t.source;
      assert.equal(s.kind, 'adapted', t.id);
      assert.ok(ALLOWED_LICENSES.includes(s.license), `${t.id} licence ${s.license}`);
      assert.match(s.repoUrl, /^https:\/\/github\.com\/[^/]+\/[^/]+$/, t.id);
      assert.match(s.commit, /^[0-9a-f]{7,40}$/, `${t.id} commit`);
      assert.match(s.retrievedAt, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(s.copyright.length > 10 && s.author && s.name, `${t.id} attribution`);
      assert.ok(s.sampleTokens.length >= 3, `${t.id} needs sample tokens for the leftover-content gate`);
      assert.ok(s.changes.length > 0 && s.imageNote.length > 20);
      assert.match(t.version, /^\d+\.\d+\.\d+$/);
      assert.ok(t.pages.length >= 1 && t.highlights.length >= 3 && t.description.length > 60 && t.designStyle.length > 10);
      assert.ok(!/lorem|untitled|placeholder/i.test(`${t.name} ${t.tagline} ${t.description}`), `${t.id} copy`);
      if (s.license.startsWith('CC-BY')) assert.ok(s.requiredCredit?.text, `${t.id} needs its required credit recorded`);
    }
  });

  test('each template ships its own LICENSE (matching the declared licence), CREDITS, mapping and a real preview image', () => {
    for (const t of EVENT_TEMPLATES) {
      for (const f of ['index.html', 'LICENSE', 'CREDITS.md', 'mapping.json']) assert.ok(fs.existsSync(bundle(t.id, f)), `${t.id}/${f}`);
      const lic = fs.readFileSync(bundle(t.id, 'LICENSE'), 'utf8');
      if (t.source.license === 'MIT') assert.match(lic, /Permission is hereby granted, free of charge/, t.id);
      if (t.source.license === 'Apache-2.0') assert.match(lic, /Apache License/, t.id);
      assert.ok(lic.includes(t.source.copyright.replace(/^Copyright \(c\) /, '').split(' (')[0]), `${t.id} copyright line matches LICENSE`);
      const credits = fs.readFileSync(bundle(t.id, 'CREDITS.md'), 'utf8');
      assert.ok(credits.includes(t.source.repoUrl) && credits.includes(t.source.license), `${t.id} CREDITS names the source and licence`);
      const img = path.join(clientRoot, 'public', t.previewImage);
      assert.ok(fs.existsSync(img) && fs.statSync(img).size > 20_000, `${t.id} preview image`);
      assert.ok(Array.isArray(JSON.parse(fs.readFileSync(bundle(t.id, 'mapping.json'), 'utf8')).rules));
    }
  });

  test('server validator accepts exact ids and rejects unknown or cross-category ones', () => {
    for (const c of EVENT_CATEGORY_IDS) for (const id of EVENT_TEMPLATE_IDS_BY_CATEGORY[c]) {
      assert.equal(validateEventFields({ eventCategory: c, selectedTemplate: { templateId: id } } as never, 'event'), null, id);
    }
    const first = EVENT_TEMPLATES[0];
    const other = EVENT_CATEGORY_IDS.find((c) => c !== first.category)!;
    assert.ok(validateEventFields({ eventCategory: first.category, selectedTemplate: { templateId: 'no-such-template' } } as never, 'event'));
    assert.ok(validateEventFields({ eventCategory: other, selectedTemplate: { templateId: first.id } } as never, 'event'), 'wrong category');
    assert.ok(validateEventFields({ selectedTemplate: { templateId: first.id } } as never, 'event', other), 'wrong stored category');
    assert.ok(validateEventFields({ eventCategory: 'garden_party' } as never, 'event'), 'unknown category');
    assert.equal(validateEventFields({ selectedTemplate: { templateId: 'some-sports-template' } } as never, 'sports_club'), null, 'other engines are not judged here');
    assert.equal(isEventReqs({ category: 'event' }), true);
    assert.equal(isEventReqs({ category: 'sports_club' }), false);
  });
});

describe('Event template library: bundles are safe and self-contained', () => {
  for (const t of EVENT_TEMPLATES) {
    const html = () => fs.readFileSync(bundle(t.id, 'index.html'), 'utf8');

    test(`${t.id}: no analytics, trackers, ad or CDN scripts and no external script files`, () => {
      const h = html();
      assert.ok(!/<script[^>]+\ssrc=/i.test(h), 'external script');
      assert.ok(!/google-analytics|googletagmanager|gtag\(|fbq\(|hotjar|segment\.com|doubleclick|adsbygoogle|mixpanel/i.test(h), 'tracker');
      assert.ok(!/gsap/i.test(h), 'GSAP is not admitted (its licence restricts use in website builders)');
    });

    test(`${t.id}: the page needs no files beside it except its own bundled images`, () => {
      const doc = parse(html());
      doc.querySelectorAll('link[rel="stylesheet"]').forEach((l) => assert.match(l.getAttribute('href') || '', /^https:\/\/fonts\.googleapis\.com\//, 'only Google Fonts may be linked'));
      doc.querySelectorAll('img[src], source[src]').forEach((i) => {
        const src = i.getAttribute('src') || '';
        assert.ok(/^(https:|data:)/.test(src) || src.startsWith(`/event-templates/${t.id}/`), `unexpected image path ${src}`);
        if (src.startsWith('/')) assert.ok(fs.existsSync(path.join(clientRoot, 'public', src)), `missing bundled file ${src}`);
      });
    });

    test(`${t.id}: mapping resolves against the page (every rule selector is valid and finds something unless it is optional)`, () => {
      const m = JSON.parse(fs.readFileSync(bundle(t.id, 'mapping.json'), 'utf8')) as { rules: Array<{ sel: string }> };
      const doc = parse(html());
      let dead = 0;
      for (const r of m.rules) { let n = 0; try { n = doc.querySelectorAll(r.sel).length; } catch { assert.fail(`invalid selector ${r.sel}`); } if (!n) dead++; }
      assert.ok(dead <= Math.ceil(m.rules.length * 0.1), `${t.id}: ${dead} of ${m.rules.length} rules match nothing in the page`);
    });

    for (const [label, getData] of [['rich', getEventDemoData], ['minimal', getMinimalEventData]] as const) {
      test(`${t.id}: live mode with ${label} data keeps no upstream sample content and no forms, payment words or external hosts`, () => {
        const mapping = JSON.parse(fs.readFileSync(bundle(t.id, 'mapping.json'), 'utf8'));
        const view = normalizeEvent({ eventData: getData(t.category), requirements: {}, isDemo: true }, 'http://localhost');
        const out = bindTemplate(html(), mapping, view, parse);
        const text = visibleText(out, parse);
        for (const token of t.source.sampleTokens) assert.ok(!text.includes(token), `${t.id} (${label}) still shows upstream sample word "${token}"`);
        assert.ok(!/<form[\s>]/i.test(out), 'form survived');
        assert.ok(!PAYMENT.test(text), `payment wording in ${label} output: ${(text.match(PAYMENT) || [])[0]}`);
        assert.ok(!/images\.unsplash\.com/.test(out), 'upstream stock photo still referenced in live output');
        assert.ok(!/<script[^>]+\ssrc=/i.test(out));
        assert.ok(!/lorem ipsum/i.test(text));
        assert.ok(text.includes(view.name) || (view.wedding.coupleNames && text.includes(view.wedding.coupleNames)), `${t.id} (${label}) must show the event's name`);
        assert.ok(out.includes(view.email), `${t.id} (${label}) must carry the contact email (as text or a mailto link)`);
        // every external link opens in its own tab; nothing links to a javascript: url
        const doc = parse(out);
        doc.querySelectorAll('a[href^="http"]').forEach((a) => assert.equal(a.getAttribute('target'), '_blank', 'outside link must open in a new tab'));
        assert.ok(!/href=["']\s*javascript/i.test(out));
      });
    }

    test(`${t.id}: the page shows the organiser's name and escapes markup typed into any field`, () => {
      const mapping = JSON.parse(fs.readFileSync(bundle(t.id, 'mapping.json'), 'utf8'));
      const data = getEventDemoData(t.category);
      data.profile.name = 'Alpha <img src=x onerror=alert(1)> Summit';
      data.profile.tagline = '"><script>alert(2)</script>';
      data.profile.organizerEmail = 'x@example.org';
      if (data.weddingStory) data.weddingStory.partnerOne = 'Alpha <b onmouseover=alert(3)>';
      const view = normalizeEvent({ eventData: data, requirements: {}, isDemo: true }, 'http://localhost');
      const out = bindTemplate(html(), mapping, view, parse);
      const doc = parse(out);
      assert.equal(doc.querySelectorAll('img[onerror]').length, 0, 'injected element');
      assert.equal(doc.querySelectorAll('[onmouseover]').length, 0, 'injected handler');
      assert.ok(![...doc.querySelectorAll('script')].some((s) => /alert\(2\)/.test(s.textContent || '')), 'injected script');
      assert.ok(visibleText(out, parse).includes('Alpha'), 'name is shown');
    });
  }
});

describe('Event engine: source rules and safety', () => {
  const read = (p: string) => fs.readFileSync(path.join(clientRoot, p), 'utf8');
  const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');

  test('engine never assigns HTML strings and the frame is sandboxed without same-origin access', () => {
    const engine = read('src/templates/ngo/engine/mapping.ts') + read('src/templates/event/engine/render.ts');
    assert.ok(!/\.innerHTML\s*=|insertAdjacentHTML|document\.write/.test(engine), 'engine must use text/attribute APIs only');
    const src = read('src/templates/event/EventBundleFrame.tsx');
    assert.match(src, /sandbox=/);
    assert.ok(!/allow-same-origin/.test(stripComments(src)), 'the frame must not grant same-origin access');
    assert.match(read('src/templates/event/EventLiveFrame.tsx'), /EventBundleFrame/, 'live frame renders through the sandboxed frame');
  });

  test('unsafe URLs typed by a client never reach href or src', () => {
    for (const t of EVENT_TEMPLATES) {
      const mapping = JSON.parse(fs.readFileSync(bundle(t.id, 'mapping.json'), 'utf8'));
      const data = getEventDemoData(t.category);
      data.profile.socialLinks = { instagram: 'javascript:alert(3)', facebook: 'data:text/html,<b>x</b>' } as never;
      data.tickets.forEach((k) => { k.registrationUrl = 'javascript:alert(1)'; });
      const out = bindTemplate(fs.readFileSync(bundle(t.id, 'index.html'), 'utf8'), mapping, normalizeEvent({ eventData: data, requirements: {}, isDemo: true }, 'http://localhost'), parse);
      assert.ok(!/(href|src)=["']\s*(javascript|data:text)/i.test(out), t.id);
    }
  });

  test('catalog, engine and intake carry no payment machinery', () => {
    for (const f of ['src/templates/event/registry.ts', 'src/templates/event/kit/data.ts', 'src/components/admin/event-intake/model.ts', 'src/components/admin/event-intake/steps.tsx']) {
      assert.ok(!/razorpay|stripe|paypal|checkout|\bupi\b|ifsc|cardNumber/i.test(stripComments(read(f))), `${f} mentions payment machinery`);
    }
  });
});

describe('Event intake model', () => {
  const meta = (c: (typeof EVENT_CATEGORY_IDS)[number]) => metaFor(EVENT_TEMPLATES.find((t) => t.category === c)?.id || EVENT_TEMPLATES[0].id);

  test('every category has its own steps: shared first steps, a category-specific middle, then media, contact and review', () => {
    const titles = EVENT_CATEGORY_IDS.map((c) => stepsFor(c).map((s) => s.id).join('>'));
    assert.equal(new Set(titles).size, EVENT_CATEGORY_IDS.length, 'each category has a different step sequence');
    for (const c of EVENT_CATEGORY_IDS) {
      const ids = stepsFor(c).map((s) => s.id);
      assert.deepEqual(ids.slice(0, 3), ['details', 'venue', 'branding'], c);
      assert.deepEqual(ids.slice(-3), ['media', 'contact', 'review'], c);
      assert.ok(ids.length >= 8, c);
    }
    const lists = (c: (typeof EVENT_CATEGORY_IDS)[number]) => stepsFor(c).flatMap((s) => s.sections).flatMap((sec) => (sec.kind === 'list' ? [sec.list] : []));
    assert.ok(lists('exhibition_trade').includes('exhibitors') && !lists('conference_seminar').includes('exhibitors'));
    assert.ok(lists('award_ceremony').includes('awards') && !lists('wedding_private').includes('awards'));
    assert.ok(lists('wedding_private').includes('hotels') && lists('wedding_private').includes('registry') && !lists('wedding_private').includes('sponsors'));
    assert.ok(lists('launch_reveal').includes('highlights') && lists('launch_reveal').includes('specs'));
  });

  test('starts completely empty: nothing invented, no payment field anywhere', () => {
    for (const c of EVENT_CATEGORY_IDS) {
      const f = emptyForm(c, meta(c));
      assert.deepEqual(f.v, {});
      for (const k of Object.keys(f.lists)) assert.equal((f.lists as Record<string, unknown[]>)[k].length, 0, k);
      const specText = JSON.stringify(stepsFor(c).map((s) => ({ ...s, sections: s.sections.map((x) => ({ ...x, itemLabel: undefined, blank: undefined })) })));
      assert.ok(!PAYMENT.test(specText), `${c} intake mentions payment fields`);
      assert.ok(!/"key":"(card|upi|bank|cvv|account)/i.test(specText));
    }
  });

  test('requires name, a start date and a contact email, and validates formats', () => {
    const c = 'conference_seminar' as const;
    assert.ok(validateAll(emptyForm(c, meta(c))).length > 0, 'an empty form is not valid');
    const bad = emptyForm(c, meta(c)); bad.v = { name: 'A', startDate: '2027-02-30', email: 'not-an-email', endDate: '2027-01-01', startTime: '25:99' };
    assert.ok(validateStep(2, bad).startDate || validateStep(2, bad).endDate || validateStep(2, bad).startTime, 'dates and times are checked');
    assert.ok(validateStep(stepsFor(c).length - 1, bad).email, 'email format');
    const good = emptyForm(c, meta(c));
    good.v = { name: 'Harbour Summit', startDate: '2027-03-18', email: 'hello@harbour.example' };
    assert.deepEqual(validateAll(good), [], JSON.stringify(validateAll(good)));
  });

  test('a session that ends before it starts, and a ticket link that is not http(s), are rejected', () => {
    const c = 'conference_seminar' as const;
    const f = emptyForm(c, meta(c));
    f.v = { name: 'X', startDate: '2027-03-18', email: 'a@b.example' };
    f.lists.sessions = [{ id: 's', title: 'Talk', date: '2027-03-18', startTime: '10:00', endTime: '09:00', description: '', day: '', track: '', stage: '', speakers: '', kind: 'session' }];
    f.lists.tickets = [{ id: 't', name: 'Pass', price: '10', currency: '', description: '', features: '', badge: '', url: 'javascript:alert(1)', available: '' }];
    const all = validateAll(f);
    assert.ok(JSON.stringify(all).includes('end time'), 'end before start');
    assert.ok(JSON.stringify(all).includes('https://'), 'ticket link must be a full link');
  });

  test('buildRequirements keeps only what was typed, preserves the exact template, and creates no venue, people, prices or payment data', () => {
    const c = 'conference_seminar' as const;
    const f = emptyForm(c, meta(c));
    f.v = { name: 'Harbour Summit', startDate: '2027-03-18', email: 'HELLO@Harbour.example', startTime: '09:30' };
    f.lists.speakers = [{ id: 'p1', name: 'Asha Rao', role: 'speaker', title: '', organization: '', topic: 'A talk', bio: '', photo: '', social: '', featured: '' }];
    f.lists.sessions = [
      { id: 's1', title: 'Opening', date: '2027-03-18', startTime: '09:30', endTime: '10:00', description: '', day: '', track: 'Main', stage: '', speakers: 'asha rao', kind: 'keynote' },
      { id: 's2', title: 'Lunch', date: '2027-03-18', startTime: '12:00', endTime: '13:00', description: '', day: '', track: 'Main', stage: '', speakers: '', kind: 'break' },
    ];
    const r = buildRequirements(f) as never as { category: string; eventCategory: string; selectedTemplate: { templateId: string }; contactEmail: string; eventData: Record<string, any> };
    assert.equal(r.category, 'event');
    assert.equal(r.eventCategory, c);
    assert.equal(r.selectedTemplate.templateId, EVENT_TEMPLATES[0].id);
    assert.equal(r.contactEmail, 'hello@harbour.example');
    assert.equal(r.eventData.speakers.length, 1);
    assert.deepEqual(r.eventData.sponsors, []); assert.deepEqual(r.eventData.tickets, []); assert.deepEqual(r.eventData.faqs, []); assert.deepEqual(r.eventData.gallery, []);
    assert.equal(r.eventData.profile.venueName, ''); assert.equal(r.eventData.profile.city, ''); assert.equal(r.eventData.profile.organizerPhone, undefined);
    assert.equal(r.eventData.sessions[0].speakerIds[0], 'p1', 'speaker names are linked to the people list, case-insensitively');
    assert.equal(r.eventData.tracks.length, 1, 'a track name used twice (and not on a break) is one track');
    assert.deepEqual(r.eventData.sessions[1].tags, ['break']);
    assert.equal(r.eventData.sessions[1].trackId, undefined, 'a break has no track');
    assert.ok(!PAYMENT.test(JSON.stringify(r.eventData)), 'no payment data');
  });

  test('weddings and launches build their own data shapes, and an empty one stays empty', () => {
    const w = emptyForm('wedding_private', meta('wedding_private'));
    w.v = { name: 'Our Day', partnerOne: 'Nora', partnerTwo: 'Theo', startDate: '2027-06-12', email: 'a@b.example' };
    w.lists.milestones = [{ id: 'm', title: 'Met', date: '2019', text: 'Bookshop', image: '' }];
    w.lists.hotels = [{ id: 'h', hotelName: 'The Inn', address: '', bookingCode: 'CODE', link: '', deadline: '', distance: '5 min' }];
    const rw = buildRequirements(w) as never as { eventData: any };
    assert.equal(rw.eventData.weddingStory.coupleNames, 'Nora & Theo');
    assert.equal(rw.eventData.weddingStory.hotelBlocks[0].bookingCode, 'CODE');
    assert.equal(rw.eventData.productLaunch, undefined);
    const empty = buildRequirements(emptyForm('launch_reveal', meta('launch_reveal'))) as never as { eventData: any };
    assert.equal(empty.eventData.productLaunch, undefined); assert.equal(empty.eventData.weddingStory, undefined);
  });

  test('blank list entries are pruned and a saved draft merges without losing the chosen template', () => {
    const c = 'conference_seminar' as const;
    const f = emptyForm(c, meta(c)); f.lists.faqs = [{ id: 'a', question: '', answer: '' } as never, { id: 'b', question: 'Q?', answer: 'A.' } as never];
    assert.equal(pruneBlank(f).lists.faqs.length, 1);
    const merged = mergeDraft(emptyForm(c, meta(c)), { ...f, v: { name: 'X' } });
    assert.equal(merged.v.name, 'X'); assert.equal(merged.template.templateId, meta(c).templateId);
  });
});

describe('Event data on the server', () => {
  const reqs = (over: Record<string, unknown> = {}) => ({ organizationName: 'Tiny Event', category: 'event', ...over }) as never;

  test('strict normaliser fabricates nothing', () => {
    const empty = normalizeEventDataStrict({}, reqs(), 'conference_seminar');
    const s = JSON.stringify(empty);
    assert.ok(!/bangalore|kolkata|india|rick astley|event\.internal|\+91|convention & exhibition|2026-11-20/i.test(s), 'placeholder data invented');
    assert.equal(empty.profile.name, 'Tiny Event');
    assert.equal(empty.profile.venueName, ''); assert.equal(empty.profile.startDate, '');
    assert.deepEqual(empty.speakers, []); assert.deepEqual(empty.tickets, []);
    assert.equal(empty.dataAvailability.venue, false);
  });

  test('strict normaliser keeps real data, drops unsafe links, bad colours, nameless items and any payment-like extras', () => {
    const d = normalizeEventDataStrict({
      profile: { name: 'Real Summit', startDate: '2027-03-18', socialLinks: { instagram: 'javascript:alert(1)', youtube: 'https://yt.example/c' } },
      branding: { primaryColor: 'red', accentColor: '#112233' },
      tickets: [{ name: 'Pass', price: 10, currency: 'gbp', registrationUrl: 'ftp://x', cardNumber: '4242', upiId: 'a@b' }, { name: '' }],
      speakers: [{ name: 'Asha' }, { role: 'speaker' }],
      rsvpSubmissions: [{ id: 'r1', guestName: 'G', guestEmail: 'g@x.org' }]
    }, reqs(), 'conference_seminar');
    assert.equal(d.profile.socialLinks?.instagram, undefined);
    assert.equal(d.profile.socialLinks?.youtube, 'https://yt.example/c');
    assert.equal(d.branding.primaryColor, ''); assert.equal(d.branding.accentColor, '#112233');
    assert.equal(d.tickets.length, 1); assert.equal(d.tickets[0].registrationUrl, undefined); assert.equal(d.speakers.length, 1);
    assert.ok(!/4242|cardNumber|upiId/.test(JSON.stringify(d)));
    assert.equal(d.rsvpSubmissions?.length, 1, 'stored replies are carried over');
  });

  test('public sanitiser removes guest replies and Drive file ids everywhere in an event site', () => {
    const website = {
      eventData: { profile: { name: 'X' }, rsvpSubmissions: [{ guestName: 'Private', guestEmail: 'p@x.org' }], gallery: [{ id: '1', url: 'https://drive.google.com/uc?id=abc', driveFileId: 'abc' }] },
      sections: [{ data: { rsvpSubmissions: [{ guestEmail: 'p@x.org' }], items: [{ photoUrl: 'https://x.example/a.jpg', driveFileId: 'abc' }] } }],
      requirements: { selectedTemplate: { templateId: EVENT_TEMPLATES[0].id } }
    } as never;
    const clean = JSON.stringify(sanitizeWebsiteForPublic(website));
    assert.ok(!/Private|p@x\.org|rsvpSubmissions|"driveFileId"/.test(clean), clean.slice(0, 300));
    assert.ok(!/"requirements"/.test(clean), 'requirements must never be public');
  });
});
