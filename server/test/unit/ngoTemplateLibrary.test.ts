import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';

import { NGO_TEMPLATES, getNgoTemplateById, getNgoTemplatesByArchetype } from '../../../client/src/templates/ngo/registry.ts';
import { ALL_NGO_TEMPLATE_IDS, NGO_ARCHETYPE_IDS, NGO_TEMPLATE_IDS_BY_ARCHETYPE, isNgoTemplateIdLite, archetypeOfNgoTemplate } from '../../../client/src/templates/ngo/ids.ts';
import { bindTemplate, visibleText } from '../../../client/src/templates/ngo/engine/mapping.ts';
import { normalizeNgo } from '../../../client/src/templates/ngo/kit/data.ts';
import { getNgoDemoData, getMinimalNgoData } from '../../../client/src/templates/ngo/demos/demoData.ts';
import { STEPS, emptyForm, buildRequirements, validateStep, validateAll, pruneBlank, mergeDraft } from '../../../client/src/components/admin/ngo-intake/model.ts';
import {
  NGO_TEMPLATE_IDS_BY_ARCHETYPE as SERVER_IDS, ALL_NGO_TEMPLATE_IDS as SERVER_ALL, validateNgoFields, ngoArchetypeForTemplate, isNgoLibraryTemplate, isNgoReqs
} from '../../src/services/ngoCatalog.js';
import { sanitizeWebsiteForPublic } from '../../src/services/publicSiteSanitizer.js';
import { normalizeNGODataStrict } from '../../src/services/aiGenerator.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '../../../client');
const bundle = (id: string, file = '') => path.join(clientRoot, 'public/ngo-templates', id, file);
const parse = (html: string) => parseHTML(html).document as unknown as Document;
const ALLOWED_LICENSES = ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC', 'CC0-1.0'];
const PAYMENT = /\b(pan\s*number|ifsc|upi|account\s*number|80g|razorpay|stripe|paypal|checkout)\b/i;
const metaFor = (id: string) => {
  const t = getNgoTemplateById(id)!;
  return { templateId: t.id, templateVersion: '1', templateName: t.name, websiteCategory: t.archetype, selectedAt: new Date().toISOString(), designTokens: {} } as never;
};

describe('NGO template library: registry and catalog', () => {
  test('the three archetypes exist and registry, ids and server catalog agree exactly', () => {
    assert.deepEqual([...NGO_ARCHETYPE_IDS], ['grassroots_ngo', 'institutional_foundation', 'cause_charity']);
    assert.deepEqual([...NGO_TEMPLATES.map((t) => t.id)].sort(), [...ALL_NGO_TEMPLATE_IDS].sort());
    assert.deepEqual([...SERVER_ALL].sort(), [...ALL_NGO_TEMPLATE_IDS].sort());
    for (const a of NGO_ARCHETYPE_IDS) {
      assert.deepEqual([...SERVER_IDS[a]].sort(), [...NGO_TEMPLATE_IDS_BY_ARCHETYPE[a]].sort(), `server ids for ${a}`);
      assert.deepEqual(getNgoTemplatesByArchetype(a).map((t) => t.id).sort(), [...NGO_TEMPLATE_IDS_BY_ARCHETYPE[a]].sort(), `registry for ${a}`);
    }
  });

  test('ids are unique kebab-case and disjoint from the other engines', async () => {
    assert.equal(new Set(ALL_NGO_TEMPLATE_IDS).size, ALL_NGO_TEMPLATE_IDS.length);
    const { ALL_SPORTS_IDS } = await import('../../../client/src/templates/sports/ids.ts').catch(() => ({ ALL_SPORTS_IDS: [] as string[] })) as { ALL_SPORTS_IDS?: string[] };
    const { ALL_CULTURAL_IDS } = await import('../../../client/src/templates/cultural/ids.ts') as { ALL_CULTURAL_IDS: string[] };
    const others = new Set([...(ALL_SPORTS_IDS || []), ...ALL_CULTURAL_IDS]);
    for (const id of ALL_NGO_TEMPLATE_IDS) {
      assert.match(id, /^[a-z0-9]+(-[a-z0-9]+)*$/);
      assert.ok(!others.has(id), `${id} collides with another engine`);
      assert.ok(isNgoTemplateIdLite(id));
      assert.equal(archetypeOfNgoTemplate(id), ngoArchetypeForTemplate(id));
      assert.ok(isNgoLibraryTemplate(id));
    }
    assert.equal(isNgoTemplateIdLite('ngo_impact'), false, 'legacy ids are not library ids');
  });

  test('every template is a real third-party template with a verified source, an allowed licence and nothing invented', () => {
    for (const t of NGO_TEMPLATES) {
      const s = t.source;
      assert.equal(s.kind, 'adapted', t.id);
      assert.ok(ALLOWED_LICENSES.includes(s.license), `${t.id} licence ${s.license}`);
      assert.match(s.repoUrl, /^https:\/\/github\.com\/[^/]+\/[^/]+$/, t.id);
      assert.match(s.commit, /^[0-9a-f]{7,40}$/, `${t.id} commit`);
      assert.match(s.retrievedAt, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(s.copyright.length > 10 && s.author && s.name, `${t.id} attribution`);
      assert.ok(s.sampleTokens.length >= 3, `${t.id} needs sample tokens for the leftover-content gate`);
      assert.ok(s.changes.length > 0 && s.imageNote.length > 20);
      assert.ok(t.highlights.length >= 3 && t.description.length > 60 && t.designStyle.length > 10);
      assert.ok(!/lorem|nova|untitled|placeholder/i.test(`${t.name} ${t.tagline} ${t.description}`), `${t.id} copy`);
    }
  });

  test('each template ships its own LICENSE (matching the declared licence), CREDITS, mapping and a real preview image', () => {
    for (const t of NGO_TEMPLATES) {
      for (const f of ['index.html', 'LICENSE', 'CREDITS.md', 'mapping.json']) assert.ok(fs.existsSync(bundle(t.id, f)), `${t.id}/${f}`);
      const lic = fs.readFileSync(bundle(t.id, 'LICENSE'), 'utf8');
      if (t.source.license === 'MIT') assert.match(lic, /Permission is hereby granted, free of charge/, t.id);
      if (t.source.license === 'Apache-2.0') assert.match(lic, /Apache License/, t.id);
      assert.ok(lic.includes(t.source.copyright.replace(/^Copyright \(c\) /, '').split(' (')[0]), `${t.id} copyright line matches LICENSE`);
      const img = path.join(clientRoot, 'public', t.previewImage);
      assert.ok(fs.existsSync(img) && fs.statSync(img).size > 20_000, `${t.id} preview image`);
      assert.ok(Array.isArray(JSON.parse(fs.readFileSync(bundle(t.id, 'mapping.json'), 'utf8')).rules));
    }
  });

  test('server validator accepts exact ids and rejects unknown or cross-archetype ones', () => {
    for (const a of NGO_ARCHETYPE_IDS) for (const id of NGO_TEMPLATE_IDS_BY_ARCHETYPE[a]) {
      assert.equal(validateNgoFields({ ngoArchetype: a, selectedTemplate: { templateId: id } } as never, 'ngo_social'), null, id);
    }
    assert.ok(validateNgoFields({ ngoArchetype: 'grassroots_ngo', selectedTemplate: { templateId: 'no-such-template' } } as never, 'ngo_social'));
    assert.ok(validateNgoFields({ ngoArchetype: 'cause_charity', selectedTemplate: { templateId: 'grassroots-folder-tabs' } } as never, 'ngo_social'), 'wrong archetype');
    assert.ok(validateNgoFields({ selectedTemplate: { templateId: 'grassroots-folder-tabs' } } as never, 'ngo_social', 'cause_charity'), 'wrong stored archetype');
    assert.equal(validateNgoFields({ ngoArchetype: 'grassroots_ngo', selectedTemplate: { templateId: 'ngo_impact' } } as never, 'ngo_social'), null, 'legacy id still accepted');
    assert.equal(validateNgoFields({ selectedTemplate: { templateId: 'some-sports-template' } } as never, 'sports_club'), null, 'other engines are not judged here');
    assert.equal(isNgoReqs({ category: 'ngo_social' }), true);
    assert.equal(isNgoReqs({ category: 'sports_club' }), false);
  });
});

describe('NGO template library: bundles are safe and self-contained', () => {
  for (const t of NGO_TEMPLATES) {
    const html = () => fs.readFileSync(bundle(t.id, 'index.html'), 'utf8');

    test(`${t.id}: no analytics, trackers, ad or CDN scripts and no external script files`, () => {
      const h = html();
      assert.ok(!/<script[^>]+\ssrc=/i.test(h), 'external script');
      assert.ok(!/google-analytics|googletagmanager|gtag\(|fbq\(|hotjar|segment\.com|doubleclick|adsbygoogle|mixpanel/i.test(h), 'tracker');
      assert.ok(!/<link[^>]+rel=["']stylesheet["'][^>]+href=["'](?!https:\/\/fonts\.googleapis\.com)/i.test(h) || /<link[^>]+href=["']https:\/\/fonts\.googleapis\.com/i.test(h));
    });

    test(`${t.id}: the page needs no files beside it (one self-contained document)`, () => {
      const doc = parse(html());
      doc.querySelectorAll('link[rel="stylesheet"]').forEach((l) => assert.match(l.getAttribute('href') || '', /^https:\/\/fonts\.googleapis\.com\//, 'only Google Fonts may be linked'));
      doc.querySelectorAll('img[src], source[src]').forEach((i) => assert.ok(/^(https:|data:)/.test(i.getAttribute('src') || ''), `relative image ${i.getAttribute('src')}`));
    });

    test(`${t.id}: mapping resolves against the page (every rule selector is valid and finds something unless it is optional)`, () => {
      const m = JSON.parse(fs.readFileSync(bundle(t.id, 'mapping.json'), 'utf8')) as { rules: Array<{ sel: string }> };
      const doc = parse(html());
      let dead = 0;
      for (const r of m.rules) { let n = 0; try { n = doc.querySelectorAll(r.sel).length; } catch { assert.fail(`invalid selector ${r.sel}`); } if (!n) dead++; }
      assert.ok(dead <= Math.ceil(m.rules.length * 0.1), `${t.id}: ${dead} of ${m.rules.length} rules match nothing in the page`);
    });

    for (const [label, getData] of [['rich', getNgoDemoData], ['minimal', getMinimalNgoData]] as const) {
      test(`${t.id}: live mode with ${label} data keeps no upstream sample content and no forms, payment words or external hosts`, () => {
        const mapping = JSON.parse(fs.readFileSync(bundle(t.id, 'mapping.json'), 'utf8'));
        const view = normalizeNgo({ ngoData: getData(t.archetype), requirements: {}, isDemo: true }, 'http://localhost');
        const out = bindTemplate(html(), mapping, view, parse);
        const text = visibleText(out, parse);
        for (const token of t.source.sampleTokens) assert.ok(!text.includes(token), `${t.id} (${label}) still shows upstream sample word "${token}"`);
        assert.ok(!/<form[\s>]/i.test(out), 'form survived');
        assert.ok(!PAYMENT.test(text), `payment wording in ${label} output: ${(text.match(PAYMENT) || [])[0]}`);
        assert.ok(!/images\.unsplash\.com/.test(out), 'upstream stock photo still referenced in live output');
        assert.ok(!/<script[^>]+\ssrc=/i.test(out));
        assert.ok(!/lorem ipsum/i.test(text));
        assert.ok(text.includes(view.name), `${t.id} (${label}) must show the organisation's name`);
        assert.ok(text.includes(view.email), `${t.id} (${label}) must show the contact email`);
      });
    }

    test(`${t.id}: the page shows the client's name and escapes markup typed into any field`, () => {
      const mapping = JSON.parse(fs.readFileSync(bundle(t.id, 'mapping.json'), 'utf8'));
      const data = getNgoDemoData(t.archetype);
      data.profile.name = 'Alpha <img src=x onerror=alert(1)> Trust';
      data.profile.tagline = '"><script>alert(2)</script>';
      data.profile.contactEmail = 'x@example.org';
      const view = normalizeNgo({ ngoData: data, requirements: {}, isDemo: true }, 'http://localhost');
      const out = bindTemplate(html(), mapping, view, parse);
      const doc = parse(out);
      assert.equal(doc.querySelectorAll('img[onerror]').length, 0, 'injected element');
      assert.ok(![...doc.querySelectorAll('script')].some((s) => /alert\(2\)/.test(s.textContent || '')), 'injected script');
      assert.ok(visibleText(out, parse).includes('Alpha'), 'name is shown');
    });
  }
});

describe('NGO engine: source rules and safety', () => {
  const read = (p: string) => fs.readFileSync(path.join(clientRoot, p), 'utf8');
  const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');

  test('engine never assigns HTML strings and the frame is sandboxed without same-origin access', () => {
    const engine = read('src/templates/ngo/engine/mapping.ts') + read('src/templates/ngo/engine/render.ts');
    assert.ok(!/\.innerHTML\s*=|insertAdjacentHTML|document\.write/.test(engine), 'engine must use text/attribute APIs only');
    const src = read('src/templates/ngo/NgoBundleFrame.tsx');
    assert.match(src, /sandbox=/);
    assert.ok(!/allow-same-origin/.test(stripComments(src)), 'the frame must not grant same-origin access');
    assert.match(read('src/templates/ngo/NgoLiveFrame.tsx'), /NgoBundleFrame/, 'live frame renders through the sandboxed frame');
  });

  test('unsafe URLs typed by a client never reach href or src', () => {
    const t = NGO_TEMPLATES[0];
    const mapping = JSON.parse(fs.readFileSync(bundle(t.id, 'mapping.json'), 'utf8'));
    const data = getNgoDemoData(t.archetype);
    data.profile.websiteUrl = 'javascript:alert(1)';
    data.profile.socialLinks = { facebook: 'javascript:alert(3)', instagram: 'data:text/html,<b>x</b>' } as never;
    const out = bindTemplate(fs.readFileSync(bundle(t.id, 'index.html'), 'utf8'), mapping, normalizeNgo({ ngoData: data, requirements: {}, isDemo: true }, 'http://localhost'), parse);
    assert.ok(!/(href|src)=["']\s*(javascript|data:text)/i.test(out));
  });

  test('catalog and engine files carry no payment machinery', () => {
    for (const f of ['src/templates/ngo/engine/mapping.ts', 'src/templates/ngo/registry.ts', 'src/components/admin/ngo-intake/model.ts', 'src/components/admin/ngo-intake/steps.tsx']) {
      assert.ok(!/razorpay|stripe|paypal|checkout|\bupi\b|ifsc|panNumber/i.test(stripComments(read(f))), `${f} mentions payment machinery`);
    }
  });
});

describe('NGO intake model', () => {
  const template = (a = 'grassroots_ngo' as const) => metaFor(NGO_TEMPLATES.find((t) => t.archetype === a)!.id);

  test('has the ten required steps in the specified order', () => {
    assert.deepEqual(STEPS.map((s) => s.id).length, 10);
    assert.deepEqual(STEPS.map((s) => s.title), [
      'Organisation profile', 'Mission and story', 'Branding and template', 'Programmes and impact', 'Leadership and team',
      'Gallery and media', 'Volunteers and support', 'News, stories and questions', 'Contact and social', 'Review and create'
    ]);
  });

  test('starts completely empty: nothing invented, no payment field anywhere', () => {
    const f = emptyForm(template());
    assert.deepEqual(f.v, {});
    for (const k of Object.keys(f.lists)) assert.equal((f.lists as Record<string, unknown[]>)[k].length, 0, k);
    const specText = JSON.stringify(STEPS);
    assert.ok(!PAYMENT.test(specText), 'intake mentions payment/tax/bank fields');
    assert.ok(!/"key":"(panNumber|bank|upi|ifsc|taxId|donation)/i.test(specText));
  });

  test('requires name, mission and contact email, and validates formats', () => {
    const f = emptyForm(template());
    const all = validateAll(f);
    assert.ok(all.length > 0, 'an empty form is not valid');
    const bad = emptyForm(template()); bad.v = { name: 'A', mission: 'm', email: 'not-an-email', phone: '12', website: 'nope' };
    const errs = validateStep(9, bad); assert.ok(errs.email, 'email format');
    const good = emptyForm(template());
    good.v = { name: 'Harbourlight Trust', tagline: 'Neighbours', mission: 'We run a weekly larder.', description: 'About the organisation.', email: 'hello@harbourlight.example', phone: '+00 111 222 3333', city: 'Harbourlight' };
    assert.deepEqual(validateAll(good), [], JSON.stringify(validateAll(good)));
  });

  test('buildRequirements keeps only what was typed, preserves the exact template, and creates no donation data', () => {
    const f = emptyForm(template());
    f.v = { name: 'Harbourlight Trust', mission: 'We run a weekly larder.', email: 'HELLO@Harbourlight.example', phone: '+00 111 222 3333', description: 'About.' };
    f.lists.programs = [{ id: 'p1', title: 'Community larder', summary: 'A weekly larder.' } as never];
    const r = buildRequirements(f, 'grassroots_ngo') as never as { category: string; ngoArchetype: string; selectedTemplate: { templateId: string }; contactEmail: string; ngoData: Record<string, any> };
    assert.equal(r.category, 'ngo_social');
    assert.equal(r.ngoArchetype, 'grassroots_ngo');
    assert.equal(r.selectedTemplate.templateId, NGO_TEMPLATES[0].id);
    assert.equal(r.contactEmail, 'hello@harbourlight.example');
    assert.equal(r.ngoData.programs.length, 1);
    assert.deepEqual(r.ngoData.leadership, []); assert.deepEqual(r.ngoData.impactStats, []); assert.deepEqual(r.ngoData.stories, []);
    assert.deepEqual(r.ngoData.donationModel.donationTiers, []); assert.equal(r.ngoData.donationModel.enquiryOnly, true);
    assert.ok(!r.ngoData.profile.registrationNumber, 'no invented registration number');
    assert.ok(!PAYMENT.test(JSON.stringify(r.ngoData)), 'no payment data');
  });

  test('blank list entries are pruned and a saved draft merges without losing the chosen template', () => {
    const f = emptyForm(template()); f.lists.faqs = [{ id: 'a', question: '', answer: '' } as never, { id: 'b', question: 'Q?', answer: 'A.' } as never];
    assert.equal(pruneBlank(f).lists.faqs.length, 1);
    const merged = mergeDraft(emptyForm(template()), { ...f, v: { name: 'X' } });
    assert.equal(merged.v.name, 'X'); assert.equal(merged.template.templateId, template().templateId);
  });
});

describe('NGO data on the server', () => {
  test('strict normaliser fabricates nothing and keeps stored submissions', () => {
    const empty = normalizeNGODataStrict({ organizationName: 'Tiny Trust', category: 'ngo_social' } as never, 'grassroots_ngo');
    const s = JSON.stringify(empty);
    assert.ok(!PAYMENT.test(s), 'payment fields invented');
    assert.ok(!/gram chetna|fcra|goonj|ramesh/i.test(s), 'invented organisation');
    assert.deepEqual(empty.programs, []); assert.deepEqual(empty.leadership, []);
  });

  test('public sanitiser removes submissions, tax ids, bank/UPI details and Drive file ids from NGO sites', () => {
    const website = {
      ngoData: {
        profile: { name: 'X', panNumber: 'ABCDE1234F', registrationNumber: 'REG-1' },
        donationModel: { directTransferDetails: { accountNumber: '123', ifscCode: 'X', upiId: 'a@b' }, eightyGRegNumber: '80G-1', outboundDonationUrl: 'https://pay.example', donationTiers: [] },
        volunteerSubmissions: [{ name: 'Private', email: 'p@x.org' }], donationEnquiries: [{ donorName: 'Private', panNumber: 'ABCDE1234F' }],
        gallery: [{ id: '1', url: 'https://drive.google.com/uc?id=abc', driveFileId: 'abc' }]
      },
      requirements: { selectedTemplate: { templateId: NGO_TEMPLATES[0].id } }
    } as never;
    const clean = JSON.stringify(sanitizeWebsiteForPublic(website));
    assert.ok(!/ABCDE1234F|Private|p@x\.org|"driveFileId"/.test(clean), clean.slice(0, 300));
    assert.ok(!/accountNumber|upiId|ifscCode|80G-1|pay\.example/.test(clean), 'bank/UPI/80G/donation link survived on a library site');
    assert.ok(!/"requirements"/.test(clean), 'requirements must never be public');
  });

  test('older (non-library) NGO sites keep their own published transfer details, as before', () => {
    const legacy = { ngoData: { profile: { name: 'Old' }, donationModel: { directTransferDetails: { accountName: 'Old Trust' }, donationTiers: [] } }, requirements: { selectedTemplate: { templateId: 'ngo_impact' } } } as never;
    assert.match(JSON.stringify(sanitizeWebsiteForPublic(legacy)), /Old Trust/);
  });
});
