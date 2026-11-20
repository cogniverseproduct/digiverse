import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CULTURAL_TEMPLATES, getCulturalTemplateById, getCulturalTemplateList, getCulturalTemplatesByCategory, DEFAULT_CULTURAL_TEMPLATE } from '../../../client/src/templates/cultural/registry.ts';
import { CULTURAL_IDS_BY_CATEGORY, ALL_CULTURAL_IDS, LEGACY_CULTURAL_TEMPLATE_IDS, categoryOfCulturalTemplate, resolveCulturalTemplateId, isCulturalTemplateIdLite } from '../../../client/src/templates/cultural/ids.ts';
import {
  STEPS, emptyForm, buildRequirements, validateStep, validateAll, pruneBlank, mergeDraft, newId
} from '../../../client/src/components/admin/cultural-intake/model.ts';
import {
  CULTURAL_TEMPLATE_IDS_BY_ARCHETYPE, ALL_CULTURAL_TEMPLATE_IDS, LEGACY_CULTURAL_TEMPLATE_IDS as SERVER_LEGACY, validateCulturalFields, culturalArchetypeForTemplate,
  isKnownCulturalTemplate, resolveCulturalTemplateId as serverResolve
} from '../../src/services/culturalCatalog.js';
import { normalizeCultural } from '../../../client/src/templates/cultural/kit/data.ts';
import { sanitizeWebsiteForPublic } from '../../src/services/publicSiteSanitizer.js';
import { synthesizeWebsite } from '../../src/services/aiGenerator.js';
import type { ClientRequirements } from '../../src/types/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '../../../client');
const CATEGORIES = ['cultural_society', 'puja_committee'] as const;
const FORBIDDEN_NAME = /\b(nova|template\s*[a-z0-9]+|untitled|placeholder|lorem)\b/i;
const REAL_ORGS = /(rama\s?krishna|ramakrishna mission|asiatic society|sangeet natak|kumartuli|sovabazar|baghbazar|bagbazar|college square|santosh mitra|60 pally|ekdalia|bosepukur|unesco|isckon|iskcon)/i;
const HEX = /^#[0-9a-fA-F]{6}$/;

const metaFor = (id: string) => {
  const t = getCulturalTemplateById(id)!;
  return { templateId: t.id, templateVersion: t.version, templateName: t.name, websiteCategory: t.archetype, selectedAt: new Date().toISOString(), designTokens: { primaryColor: t.tokens.primaryColor, accentColor: t.tokens.accentColor, fontFamily: t.tokens.fontFamily, headingFont: t.tokens.headingFont, layoutPreset: t.tokens.layoutPreset } };
};

/** Fill the identity and contact fields each category needs and leave everything else empty. */
function minimalForm(category: (typeof CATEGORIES)[number], templateId: string) {
  const f = emptyForm(metaFor(templateId));
  f.v.name = 'Larkspur Society';
  f.v.email = 'Hello@Larkspur.Example';
  if (category === 'puja_committee') f.v.festivalType = 'durga_puja';
  return f;
}

const familiesIn = (t: { tokens: { headingFont: string; fontFamily: string } }) => [t.tokens.headingFont, t.tokens.fontFamily];

describe('Cultural template library (pure unit test: no server, no database)', () => {
  test('registers 10 unique templates, 5 per category, each category with a default', () => {
    assert.equal(ALL_CULTURAL_IDS.length, 10);
    assert.equal(new Set(ALL_CULTURAL_IDS).size, 10);
    assert.equal(getCulturalTemplateList().length, 10);
    for (const c of CATEGORIES) {
      assert.equal(getCulturalTemplatesByCategory(c).length, 5, `${c} has 5 templates`);
      assert.equal(CULTURAL_IDS_BY_CATEGORY[c].length, 5);
      assert.ok(getCulturalTemplateById(DEFAULT_CULTURAL_TEMPLATE[c]), `${c} has a default`);
      assert.equal(categoryOfCulturalTemplate(DEFAULT_CULTURAL_TEMPLATE[c]), c);
    }
  });

  test('client registry, client id list and server catalogue agree exactly', () => {
    assert.deepEqual(Object.keys(CULTURAL_TEMPLATES).sort(), [...ALL_CULTURAL_IDS].sort());
    assert.deepEqual([...ALL_CULTURAL_TEMPLATE_IDS].sort(), [...ALL_CULTURAL_IDS].sort());
    for (const c of CATEGORIES) {
      assert.deepEqual([...CULTURAL_TEMPLATE_IDS_BY_ARCHETYPE[c]].sort(), getCulturalTemplatesByCategory(c).map((t) => t.id).sort(), `${c}: server ids match client registry`);
      for (const id of CULTURAL_TEMPLATE_IDS_BY_ARCHETYPE[c]) {
        assert.equal(getCulturalTemplateById(id)!.archetype, c, `${id} belongs to ${c} on the client`);
        assert.equal(culturalArchetypeForTemplate(id), c, `${id} belongs to ${c} on the server`);
        assert.equal(categoryOfCulturalTemplate(id), c);
        assert.ok(isCulturalTemplateIdLite(id));
      }
    }
  });

  test('retired first-generation ids map to a real design of the same category, identically on client and server', () => {
    assert.deepEqual(LEGACY_CULTURAL_TEMPLATE_IDS, SERVER_LEGACY, 'client and server legacy maps are the same');
    assert.equal(Object.keys(LEGACY_CULTURAL_TEMPLATE_IDS).length, 6);
    const society = ['heritage_akademi', 'sanskriti_mancha', 'samaj_milan'];
    for (const [oldId, newId_] of Object.entries(LEGACY_CULTURAL_TEMPLATE_IDS)) {
      assert.ok(ALL_CULTURAL_IDS.includes(newId_ as never), `${oldId} -> ${newId_} exists`);
      assert.equal(resolveCulturalTemplateId(oldId), newId_);
      assert.equal(serverResolve(oldId), newId_);
      assert.equal(categoryOfCulturalTemplate(oldId), society.includes(oldId) ? 'cultural_society' : 'puja_committee', `${oldId} keeps its category`);
      assert.ok(!ALL_CULTURAL_IDS.includes(oldId as never), `${oldId} is retired, not a library entry`);
    }
    assert.equal(resolveCulturalTemplateId('cultural-heritage'), 'cultural-heritage');
    assert.equal(resolveCulturalTemplateId('not-a-template'), undefined);
    assert.equal(resolveCulturalTemplateId('__proto__'), undefined, 'prototype keys are never templates');
    assert.equal(resolveCulturalTemplateId('constructor'), undefined);
    assert.equal(getCulturalTemplateById('mahasabha_royal')?.id, 'traditional-durga-puja');
    assert.equal(getCulturalTemplateById('nope'), undefined);
  });

  test('every template has complete metadata, a real screenshot and an original-source record', () => {
    for (const id of ALL_CULTURAL_IDS) {
      const t = CULTURAL_TEMPLATES[id];
      assert.equal(t.id, id);
      assert.ok(t.name.length > 3 && !FORBIDDEN_NAME.test(t.name), `${id}: descriptive name`);
      assert.ok(t.description.length > 80 && t.tagline && t.designStyle && t.designDirection && t.badge, `${id}: copy`);
      assert.ok(t.highlights.length >= 4, `${id}: highlights`);
      for (const k of ['primaryColor', 'accentColor', 'background', 'textColor'] as const) assert.match(t.tokens[k], HEX, `${id}: ${k}`);
      assert.ok(t.tokens.headingFont && t.tokens.fontFamily && t.tokens.layoutPreset, `${id}: fonts and layout`);
      assert.ok(t.sections.length >= 8, `${id}: sections`);
      assert.ok(t.sections.some((s) => s.id === 'hero') && t.sections.some((s) => s.id === 'contact'), `${id}: hero and contact`);
      assert.equal(t.animation.reducedMotion, 'static', `${id}: reduced motion handled`);
      assert.equal(t.source.kind, 'original', `${id}: original implementation (no third-party code)`);
      assert.match(t.source.note, /SIL OFL/, `${id}: fonts are recorded as OFL`);
      assert.equal(t.previewImage, `/images/cultural-templates/${id}.jpg`);
      const file = path.join(clientRoot, 'public/images/cultural-templates', `${id}.jpg`);
      assert.ok(fs.existsSync(file) && fs.statSync(file).size > 10_000, `${id}: card screenshot exists`);
    }
  });

  test('puja templates tell visitors about the schedule and the visit; association templates do not', () => {
    for (const t of getCulturalTemplatesByCategory('puja_committee')) {
      assert.ok(t.sections.some((s) => s.id === 'schedule'), `${t.id}: schedule section`);
      assert.ok(t.sections.some((s) => s.id === 'donation'), `${t.id}: donation section`);
      assert.ok(t.sections.some((s) => s.id === 'visitor'), `${t.id}: visitor guide`);
    }
    for (const t of getCulturalTemplatesByCategory('cultural_society')) {
      assert.ok(!t.sections.some((s) => s.id === 'schedule' || s.id === 'donation'), `${t.id}: no puja-only sections`);
      assert.ok(t.sections.some((s) => s.id === 'events' || s.id === 'activities'), `${t.id}: programmes or events`);
    }
  });

  test('each template has its own design identity: no two share a font pairing or a palette', () => {
    const fonts = new Map<string, string>(); const palettes = new Map<string, string>(); const names = new Set<string>(); const directions = new Set<string>();
    for (const id of ALL_CULTURAL_IDS) {
      const t = CULTURAL_TEMPLATES[id];
      const font = familiesIn(t).join('|'); const palette = [t.tokens.primaryColor, t.tokens.accentColor, t.tokens.background].map((x) => x.toLowerCase()).join('|');
      assert.ok(!fonts.has(font), `${id} repeats the font pairing of ${fonts.get(font)}`);
      assert.ok(!palettes.has(palette), `${id} repeats the palette of ${palettes.get(palette)}`);
      assert.ok(!names.has(t.name) && !directions.has(t.designDirection), `${id}: unique name and direction`);
      fonts.set(font, id); palettes.set(palette, id); names.add(t.name); directions.add(t.designDirection);
    }
    assert.equal(new Set(ALL_CULTURAL_IDS.map((id) => CULTURAL_TEMPLATES[id].tokens.headingFont)).size, 10, 'ten different heading faces');
  });

  test('every design file exists, follows the folder convention, loads the fonts its tokens promise and is wired', () => {
    const dirFor = { cultural_society: 'association', puja_committee: 'puja' } as const;
    for (const id of ALL_CULTURAL_IDS) {
      const t = CULTURAL_TEMPLATES[id];
      const pascal = id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join('');
      const file = path.join(clientRoot, 'src/templates/cultural/designs', dirFor[t.archetype], `${pascal}.tsx`);
      assert.ok(fs.existsSync(file), `${id}: ${pascal}.tsx exists`);
      const src = fs.readFileSync(file, 'utf8');
      assert.match(src, new RegExp(`export const ${pascal}\\b`), `${id}: exports ${pascal}`);
      assert.match(src, /sp-root/, `${id}: root carries the shared safety class`);
      assert.match(src, /<DemoBadge show=\{d\.isDemo\}/, `${id}: shows the sample-content badge on demos only`);
      assert.match(src, /normalizeCultural\(props/, `${id}: reads content through the shared normaliser`);
      for (const family of familiesIn(t)) assert.ok(src.includes(`family=${family.replace(/ /g, '+')}`), `${id}: loads ${family}`);
      assert.ok(!/images\.unsplash|picsum|placeholder\.com|via\.placeholder/i.test(src), `${id}: no hotlinked stock images`);
    }
  });

  test('the first-generation designs and their dead helpers are gone', () => {
    for (const rel of ['src/templates/cultural/components', 'src/data/culturalThemes.ts', 'src/components/admin/CulturalRequirementWizard.tsx', 'src/components/admin/templates/CulturalTemplateSelector.tsx']) {
      assert.ok(!fs.existsSync(path.join(clientRoot, rel)), `${rel} was removed`);
    }
  });

  test('demo content is fictional: no real organisations, only reserved example domains, no hotlinked photographs', () => {
    for (const id of ALL_CULTURAL_IDS) {
      const demo = CULTURAL_TEMPLATES[id].getDemoData();
      const blob = JSON.stringify({ r: demo.requirements, c: demo.culturalData });
      assert.ok(!REAL_ORGS.test(blob), `${id}: demo mentions a real organisation`);
      assert.match(String(demo.requirements.contactEmail), /\.example$/, `${id}: demo email is on the reserved .example domain`);
      for (const u of blob.match(/https?:\/\/[^"\s\\]+/g) || []) assert.match(u, /\.example(\/|$)|w3\.org/, `${id}: demo URL ${u} must be a placeholder`);
      assert.ok(!/unsplash|pexels|pixabay|googleusercontent/i.test(blob), `${id}: no stock-photo hotlinks`);
      assert.equal(demo.culturalData.websiteType, CULTURAL_TEMPLATES[id].archetype);
      assert.equal(demo.requirements.selectedTemplate?.templateId, id);
      if (demo.culturalData.websiteType === 'puja_committee') {
        assert.ok(demo.culturalData.pujaSchedule!.length >= 4 && demo.culturalData.pujaTheme && demo.culturalData.visitorGuide, `${id}: puja demo has schedule, theme and guide`);
      }
    }
  });

  test('server validation: unknown, mismatched, legacy and valid templates', () => {
    const base = { organizationName: 'X' } as Partial<ClientRequirements>;
    assert.equal(validateCulturalFields({ ...base, selectedTemplate: metaFor('cultural-heritage') } as never, 'cultural'), null);
    assert.equal(validateCulturalFields({ ...base, selectedTemplate: metaFor('traditional-durga-puja') } as never, 'puja_committee'), null);
    assert.match(validateCulturalFields({ ...base, selectedTemplate: { ...metaFor('cultural-heritage'), templateId: 'does-not-exist' } } as never, 'cultural') || '', /Unknown cultural template/);
    assert.match(validateCulturalFields({ ...base, selectedTemplate: metaFor('traditional-durga-puja') } as never, 'cultural') || '', /belongs to puja_committee, not cultural_society/);
    assert.match(validateCulturalFields({ ...base, selectedTemplate: metaFor('cultural-heritage') } as never, 'puja_committee') || '', /belongs to cultural_society, not puja_committee/);
    assert.match(validateCulturalFields({ ...base, culturalArchetype: 'cultural_banana' } as never, 'cultural') || '', /Unknown cultural archetype/);
    assert.match(validateCulturalFields({ ...base, category: 'puja_committee', culturalArchetype: 'cultural_society' } as never, 'puja_committee') || '', /puja_committee archetype/);
    // an update that omits the archetype is checked against the stored one
    assert.match(validateCulturalFields({ selectedTemplate: metaFor('traditional-durga-puja') } as never, 'cultural', 'cultural_society') || '', /belongs to puja_committee/);
    assert.equal(validateCulturalFields({ selectedTemplate: metaFor('modern-festival-organization') } as never, 'cultural', 'cultural_society'), null);
    // retired ids stay valid for existing projects (and are judged by the category they came from)
    assert.equal(validateCulturalFields({ selectedTemplate: { ...metaFor('cultural-heritage'), templateId: 'heritage_akademi' } } as never, 'cultural'), null);
    assert.equal(validateCulturalFields({ selectedTemplate: { ...metaFor('cultural-heritage'), templateId: 'mahasabha_royal' } } as never, 'puja_committee'), null);
    assert.match(validateCulturalFields({ selectedTemplate: { ...metaFor('cultural-heritage'), templateId: 'mahasabha_royal' } } as never, 'cultural') || '', /belongs to puja_committee/);
    // other engines are not affected by cultural template ids, and a missing template is fine
    assert.equal(validateCulturalFields({ selectedTemplate: { ...metaFor('cultural-heritage'), templateId: 'engineer-blueprint' } } as never, 'portfolio'), null);
    assert.equal(validateCulturalFields({ selectedTemplate: { ...metaFor('cultural-heritage'), templateId: 'floodlight-night' } } as never, 'sports'), null);
    assert.equal(validateCulturalFields({ ...base } as never, 'cultural'), null);
    assert.ok(isKnownCulturalTemplate('premium-modern-durga-puja') && isKnownCulturalTemplate('samaj_milan') && !isKnownCulturalTemplate('engineer-blueprint'));
  });
});

describe('Cultural intake -> requirements -> generated website (pure unit test)', () => {
  test('each category has its own steps ending in review, and every category-specific step exists', () => {
    for (const c of CATEGORIES) {
      const ids = STEPS[c].map((s) => s.id);
      assert.equal(new Set(ids).size, ids.length, `${c}: unique step ids`);
      assert.equal(ids[0], 'identity');
      assert.equal(ids[ids.length - 1], 'review');
      assert.ok(ids.includes('branding') && ids.includes('contact') && ids.includes('gallery') && ids.includes('committee'), `${c}: shared steps`);
    }
    const soc = STEPS.cultural_society.map((s) => s.id); const puja = STEPS.puja_committee.map((s) => s.id);
    assert.ok(soc.includes('events') && soc.includes('membership') && soc.includes('programmes'));
    assert.ok(puja.includes('schedule') && puja.includes('theme') && puja.includes('visitor') && puja.includes('donation'));
    assert.ok(!soc.includes('schedule') && !soc.includes('visitor') && !soc.includes('donation'), 'the association intake has no puja steps');
    assert.ok(!puja.includes('membership') && !puja.includes('events'), 'the puja intake has no association-only steps');
  });

  test('branding and the gallery are separate steps: the logo and cover never land in the gallery', () => {
    const branding = STEPS.cultural_society.find((s) => s.id === 'branding')!;
    const gallery = STEPS.cultural_society.find((s) => s.id === 'gallery')!;
    const keys = (s: typeof branding) => s.sections.flatMap((x) => (x.kind === 'fields' ? x.fields.map((f) => f.key) : []));
    assert.ok(keys(branding).includes('logo') && keys(branding).includes('cover'));
    assert.ok(!keys(gallery).includes('logo') && !keys(gallery).includes('cover'));
    const f = minimalForm('cultural_society', 'cultural-heritage');
    f.v.logo = '/uploads/logo.png'; f.v.cover = '/uploads/cover.jpg';
    const reqs = buildRequirements(f, 'cultural_society');
    assert.equal(reqs.culturalData!.gallery.length, 0, 'branding images are not gallery items');
    assert.equal(reqs.culturalData!.branding.primaryLogoUrl, '/uploads/logo.png');
    assert.equal(reqs.culturalData!.branding.coverImageUrl, '/uploads/cover.jpg');
  });

  test('a new form is empty: nothing is pre-filled or invented', () => {
    const f = emptyForm(metaFor('cultural-heritage'));
    assert.deepEqual(Object.values(f.lists).flat(), []);
    assert.deepEqual(Object.keys(f.v).sort(), ['accentColor', 'primaryColor']);
  });

  test('association: only name and contact email are required; puja also needs the festival', () => {
    const soc = validateAll(emptyForm(metaFor('cultural-heritage')), 'cultural_society').flatMap((p) => Object.keys(p.errors));
    assert.deepEqual([...new Set(soc)].sort(), ['email', 'name']);
    const puja = validateAll(emptyForm(metaFor('traditional-durga-puja')), 'puja_committee').flatMap((p) => Object.keys(p.errors));
    assert.deepEqual([...new Set(puja)].sort(), ['email', 'festivalType', 'name']);
    for (const c of CATEGORIES) {
      const id = DEFAULT_CULTURAL_TEMPLATE[c];
      assert.deepEqual(validateAll(minimalForm(c, id), c), [], `${c}: minimal form is valid`);
    }
  });

  for (const c of CATEGORIES) {
    test(`${c}: a minimal intake generates a site that keeps the selected template and invents nothing`, () => {
      for (const templateId of CULTURAL_IDS_BY_CATEGORY[c]) {
        const reqs = buildRequirements(minimalForm(c, templateId), c);
        assert.equal(reqs.selectedTemplate?.templateId, templateId);
        assert.equal(reqs.culturalArchetype, c);
        assert.equal(reqs.category, c === 'puja_committee' ? 'puja_committee' : 'cultural');
        assert.equal(validateCulturalFields(reqs as never, reqs.category), null, `${templateId}: passes server validation`);
        const cd = reqs.culturalData!;
        assert.equal(cd.organization.name, 'Larkspur Society');
        for (const k of ['leadership', 'activities', 'events', 'gallery', 'sponsors', 'news'] as const) assert.equal(cd[k].length, 0, `${templateId}: no ${k}`);
        assert.equal(cd.pujaSchedule === undefined || cd.pujaSchedule.length === 0, true);
        assert.equal(cd.pujaTheme, undefined); assert.equal(cd.visitorGuide, undefined); assert.equal(cd.donationInfo, undefined); assert.equal(cd.membershipInfo, undefined);
        assert.equal(reqs.tagline, ''); assert.equal(reqs.aboutText, ''); assert.deepEqual(reqs.socialLinks, {}, 'no invented social links');
        assert.equal(reqs.contactEmail, 'hello@larkspur.example');
        assert.ok(Object.values(cd.dataAvailability).every((v) => v === false), `${templateId}: every dataset flagged as not supplied`);

        const site = synthesizeWebsite(reqs as unknown as ClientRequirements);
        assert.equal(site.selectedTemplate?.templateId, templateId, `${templateId}: generator keeps the template`);
        assert.equal(site.selectedTemplate?.websiteCategory, c);
        const g = site.culturalData!;
        // the generator must not add contact details, places or descriptions the client never gave
        assert.equal(g.organization.contactPhone, ''); assert.equal(g.organization.city, ''); assert.equal(g.organization.state, ''); assert.equal(g.organization.country, '');
        assert.equal(g.organization.contactEmail, 'hello@larkspur.example'); assert.equal(g.organization.headquarters, ''); assert.equal(g.organization.description, '');
        assert.equal(g.organization.contactPerson, '');
        assert.ok(!/@organization\.internal|2200 0000|Kolkata|Cultural Complex|Preserving cultural heritage/.test(JSON.stringify(g)), `${templateId}: no placeholder contact data in the generated site`);
      }
    });
  }

  test('association: entered data is carried exactly; event status follows the date; membership appears only when entered', () => {
    const f = minimalForm('cultural_society', 'cultural-heritage');
    f.lists.leadership = [{ id: 'l1', name: 'Asha Rao', designation: 'President', roleCategory: 'executive', photo: '', bio: '', email: 'asha@larkspur.example', phone: '' }];
    f.lists.events = [
      { id: 'e1', title: 'Old Concert', category: '', description: 'A concert.', startDate: '2020-01-05', endDate: '', time: '6 pm', venue: 'Hall', image: '', registrationUrl: '', featured: '' },
      { id: 'e2', title: 'Future Recital', category: 'Music', description: 'A recital.', startDate: '2099-01-05', endDate: '', time: '', venue: 'Hall', image: '', registrationUrl: 'https://larkspur.example/r', featured: 'yes' }
    ];
    f.lists.activities = [{ id: 'a1', title: 'Choir', category: 'music', description: 'Weekly choir.', schedule: 'Fri 7pm', venue: '', image: '', registration: 'yes' }];
    f.lists.membershipTypes = [{ id: 'm1', name: 'Individual', fee: '₹600', benefits: 'Voting\n\nNewsletter ' }];
    f.v.memGuidelines = 'Apply at the monthly meeting.';
    assert.deepEqual(validateAll(f, 'cultural_society'), []);
    const cd = buildRequirements(f, 'cultural_society').culturalData!;
    assert.equal(cd.leadership[0].displayOrder, 1);
    assert.equal(cd.events[0].status, 'completed'); assert.equal(cd.events[1].status, 'upcoming'); assert.equal(cd.events[1].isFeatured, true); assert.equal(cd.events[0].isFeatured, undefined);
    assert.equal(cd.activities[0].registrationRequired, true);
    assert.deepEqual(cd.membershipInfo?.membershipTypes?.[0].benefits, ['Voting', 'Newsletter']);
    assert.equal(cd.dataAvailability.events, true); assert.equal(cd.dataAvailability.membership, true); assert.equal(cd.dataAvailability.sponsors, false);
    const noMembership = buildRequirements(minimalForm('cultural_society', 'cultural-heritage'), 'cultural_society').culturalData!;
    assert.equal(noMembership.membershipInfo, undefined);
  });

  test('puja: schedule, theme, visitor guide and donations are built from entered data only', () => {
    const f = minimalForm('puja_committee', 'traditional-durga-puja');
    f.lists.days = [{ id: 'd1', dayName: 'Maha Ashtami', dayNameNative: '', date: '2099-10-10', tithiInfo: '', rituals: [
      { id: 'r1', time: '9:30 am', name: 'Pushpanjali', nameNative: '', description: '', key: 'yes' }, { id: 'r2', time: '7 pm', name: 'Aarti', nameNative: '', description: '', key: '' }
    ] }];
    f.v.themeName = 'Lamps'; f.v.themeConcept = 'A canopy of lamps.'; f.v.editionYear = '2099';
    f.v.pandalLocation = 'Maidan'; f.v.visitingHours = '9 to 11'; f.v.crowdGuidelines = 'Queue\n\nBe kind';
    f.v.donMessage = 'Please help.'; f.v.donContact = 'See the treasurer.';
    f.lists.causes = [{ id: 'c1', title: 'Bhog', description: '', amounts: '250, 500,x' }];
    const errs = validateAll(f, 'puja_committee').flatMap((p) => Object.keys(p.errors));
    assert.deepEqual(errs, ['causes:c1:amounts'], 'invalid amounts are rejected');
    f.lists.causes[0].amounts = '250, 500';
    assert.deepEqual(validateAll(f, 'puja_committee'), []);
    const cd = buildRequirements(f, 'puja_committee').culturalData!;
    assert.equal(cd.festivalType, 'durga_puja');
    assert.equal(cd.pujaSchedule?.length, 1);
    assert.equal(cd.pujaSchedule?.[0].rituals[0].isKeyRitual, true); assert.equal(cd.pujaSchedule?.[0].rituals[1].isKeyRitual, undefined);
    assert.equal(cd.pujaSchedule?.[0].tithiInfo, undefined, 'no tithi unless the committee gave one');
    assert.equal(cd.pujaTheme?.currentThemeName, 'Lamps');
    assert.deepEqual(cd.visitorGuide?.crowdGuidelines, ['Queue', 'Be kind']);
    assert.deepEqual(cd.donationInfo?.causes[0].suggestedAmounts, [250, 500]);
    assert.equal(cd.dataAvailability.pujaSchedule, true); assert.equal(cd.dataAvailability.donationInfo, true);
    assert.equal(cd.membershipInfo, undefined, 'a puja committee has no membership module');
    const site = synthesizeWebsite(buildRequirements(f, 'puja_committee') as unknown as ClientRequirements);
    assert.equal(site.culturalData?.pujaSchedule?.length, 1);
    assert.equal(site.culturalData?.visitorGuide?.visitingHours, '9 to 11');
  });

  test('puja: a half-filled theme, visitor guide or donation block is rejected, and empty ones are simply left out', () => {
    const f = minimalForm('puja_committee', 'traditional-durga-puja');
    f.v.pandalLocation = 'Maidan';
    const guide = validateStep(STEPS.puja_committee.findIndex((s) => s.id === 'visitor') + 1, f, 'puja_committee');
    assert.ok(guide.visitingHours && !guide.pandalLocation, 'hours are required once any visitor detail exists');
    f.v.themeName = 'Lamps';
    const theme = validateStep(STEPS.puja_committee.findIndex((s) => s.id === 'theme') + 1, f, 'puja_committee');
    assert.ok(theme.themeConcept && theme.editionYear);
    f.v.donTitle = 'Support';
    const don = validateStep(STEPS.puja_committee.findIndex((s) => s.id === 'donation') + 1, f, 'puja_committee');
    assert.ok(don.donMessage && don.donContact);
    const blank = minimalForm('puja_committee', 'traditional-durga-puja');
    for (const id of ['visitor', 'theme', 'donation']) assert.deepEqual(validateStep(STEPS.puja_committee.findIndex((s) => s.id === id) + 1, blank, 'puja_committee'), {});
  });

  test('validation: dates, links, colours, years and required fields are caught', () => {
    const f = minimalForm('cultural_society', 'cultural-heritage');
    const step = (id: string) => STEPS.cultural_society.findIndex((s) => s.id === id) + 1;
    f.v.founded = '999'; assert.ok(validateStep(step('identity'), f, 'cultural_society').founded); f.v.founded = '1950'; assert.deepEqual(validateStep(step('identity'), f, 'cultural_society'), {});
    f.v.primaryColor = 'red'; assert.ok(validateStep(step('branding'), f, 'cultural_society').primaryColor); f.v.primaryColor = '#112233';
    f.v.facebook = 'not a link'; assert.ok(validateStep(step('contact'), f, 'cultural_society').facebook); f.v.facebook = 'https://facebook.com/larkspur';
    f.v.email = 'nope'; assert.ok(validateStep(step('contact'), f, 'cultural_society').email); f.v.email = 'ok@larkspur.example';
    f.lists.events = [{ id: 'e1', title: 'Gala', category: '', description: '', startDate: '2030-02-02', endDate: '2030-02-01', time: '', venue: '', image: '', registrationUrl: 'nope', featured: '' }];
    const ev = validateStep(step('events'), f, 'cultural_society');
    assert.ok(ev['events:e1:endDate'] && ev['events:e1:venue'] && ev['events:e1:description'] && ev['events:e1:registrationUrl'], 'event needs a venue and description and sane dates and links');
    f.v[`youtubeUrls`] = 'https://youtu.be/abc\nnot a link';
    assert.ok(validateStep(step('gallery'), f, 'cultural_society').youtubeUrls, 'every YouTube line must be a link');
    const p = minimalForm('puja_committee', 'traditional-durga-puja');
    // a card with something typed in it is kept, so what is missing is reported (an untouched card is pruned instead)
    p.lists.days = [{ id: 'd1', dayName: '', dayNameNative: '', date: '', tithiInfo: 'Ashtami', rituals: [{ id: 'r1', time: '', name: '', nameNative: '', description: 'Only a note', key: '' }] }];
    const sc = validateStep(STEPS.puja_committee.findIndex((s) => s.id === 'schedule') + 1, p, 'puja_committee');
    assert.ok(sc['days:d1:dayName'] && sc['days:d1:date'] && sc['days:r1:name'] && sc['days:r1:time'], 'a day needs a name and date; a ritual a name and time');
  });

  test('cards that were added but never filled in are dropped; filled ones are kept', () => {
    const f = minimalForm('puja_committee', 'traditional-durga-puja');
    f.lists.sponsors = [{ id: newId('sp'), name: '', tier: 'associate', websiteUrl: '', logo: '', description: '' }, { id: newId('sp'), name: 'Acme Hardware', tier: 'associate', websiteUrl: '', logo: '', description: '' }];
    f.lists.days = [{ id: 'd0', dayName: '', dayNameNative: '', date: '', tithiInfo: '', rituals: [] }, { id: 'd1', dayName: 'Ashtami', dayNameNative: '', date: '', tithiInfo: '', rituals: [{ id: 'r0', time: '', name: '', nameNative: '', description: '', key: '' }] }];
    const p = pruneBlank(f);
    assert.deepEqual(p.lists.sponsors.map((s) => s.name), ['Acme Hardware']);
    assert.deepEqual(p.lists.days.map((d) => d.id), ['d1'], 'an untouched day is pruned, a named one kept');
    assert.equal((p.lists.days[0].rituals as unknown[]).length, 0, 'an untouched ritual is pruned');
  });

  test('a saved draft merges over a fresh form without losing newer fields', () => {
    const base = emptyForm(metaFor('cultural-heritage'));
    const saved = JSON.parse(JSON.stringify(base));
    saved.v.name = 'Saved Society'; saved.lists.news = [{ id: 'n1', title: 'Hello', summary: '', date: '', category: '', image: '' }];
    delete saved.lists.gallery; // a draft from an older version
    const merged = mergeDraft(base, saved);
    assert.equal(merged.v.name, 'Saved Society'); assert.equal(merged.lists.news.length, 1); assert.deepEqual(merged.lists.gallery, []); assert.equal(merged.lists.days.length, 0);
  });

  test('legacy: a cultural project with no template, or a retired id, is not rewritten or rejected', () => {
    const base = { organizationName: 'Old Samiti', category: 'puja_committee', culturalArchetype: 'puja_committee', tagline: 'Old', aboutText: 'Old', contactEmail: 'a@b.example', contactPhone: '', primaryColor: '#000000', accentColor: '#ffffff', culturalData: { schemaVersion: '1.0', websiteType: 'puja_committee', organization: { name: 'Old Samiti' }, branding: {}, leadership: [], activities: [], events: [], gallery: [], sponsors: [], news: [], dataAvailability: {} } } as unknown as ClientRequirements;
    const site = synthesizeWebsite(base);
    assert.equal(site.selectedTemplate, undefined, 'no template is invented for a legacy project');
    assert.equal(validateCulturalFields(base as never, 'puja_committee'), null);
    const old = { ...base, selectedTemplate: { templateId: 'mahasabha_royal', templateName: 'Mahasabha Royal', websiteCategory: 'puja_committee', templateVersion: '1.0.0', selectedAt: '2020-01-01' } } as unknown as ClientRequirements;
    assert.equal(synthesizeWebsite(old).selectedTemplate?.templateId, 'mahasabha_royal', 'the stored id is kept as it is; it is mapped only when rendering');
    assert.equal(validateCulturalFields(old as never, 'puja_committee'), null);
  });

  test('switching template keeps every piece of entered data', () => {
    const f = minimalForm('cultural_society', 'cultural-heritage');
    f.lists.sponsors = [{ id: 's1', name: 'Acme', tier: 'associate', websiteUrl: '', logo: '', description: '' }];
    const before = buildRequirements(f, 'cultural_society');
    const after = { ...before, selectedTemplate: metaFor('arts-literature-society') } as unknown as ClientRequirements;
    assert.deepEqual(after.culturalData, before.culturalData);
    assert.equal(synthesizeWebsite(after).selectedTemplate?.templateId, 'arts-literature-society');
    assert.equal(validateCulturalFields(after as never, 'cultural', 'cultural_society'), null);
  });

  test('public sites never carry committee members’ personal email or phone, or internal Drive file ids', () => {
    const site = { culturalData: { leadership: [{ id: 'l1', name: 'A', designation: 'P', email: 'a@x.example', phone: '123' }], gallery: [{ id: 'g1', title: 't', imageUrl: '/u/a.jpg', driveFileId: 'DRIVE-ID-1' }], organization: { name: 'O', contactEmail: 'o@x.example' } }, requirements: { secret: 1 } };
    const out = sanitizeWebsiteForPublic(site as never) as any;
    assert.equal(out.culturalData.leadership[0].email, undefined); assert.equal(out.culturalData.leadership[0].phone, undefined);
    assert.equal(out.culturalData.gallery[0].driveFileId, undefined); assert.equal(out.requirements, undefined);
    assert.equal(out.culturalData.organization.contactEmail, 'o@x.example', 'the organisation’s own public contact email is kept');
    assert.equal(site.culturalData.leadership[0].email, 'a@x.example', 'the stored project is not modified');
  });
});

describe('Cultural designs: media without photos', () => {
  const designsDir = path.join(clientRoot, 'src/templates/cultural/designs');
  const files = ['association', 'puja'].flatMap((d) => fs.readdirSync(path.join(designsDir, d)).filter((f) => f.endsWith('.tsx')).map((f) => path.join(designsDir, d, f)));

  test('there are ten design files', () => assert.equal(files.length, 10));

  test('a design never hides the client’s videos behind a photos-only guard', () => {
    for (const file of files) {
      const src = fs.readFileSync(file, 'utf8');
      assert.ok(src.includes('<VideoGrid'), `${path.basename(file)} renders videos`);
      // Any section opened by `d.has.gallery && ` must not contain the video grid: a site with videos but no photos would lose them.
      const guarded = /\{d\.has\.gallery && (?:\(\s*)?<section[\s\S]*?<\/section>/g;
      for (const m of src.matchAll(guarded)) {
        assert.ok(!m[0].includes('<VideoGrid'), `${path.basename(file)}: videos sit inside a photos-only section`);
      }
      // The photo wall itself only renders when there are photos.
      for (const m of src.matchAll(/<PhotoWall\b/g)) {
        const before = src.slice(Math.max(0, (m.index ?? 0) - 40), m.index);
        assert.ok(/d\.has\.gallery && $|d\.has\.gallery \? $/.test(before) || /d\.has\.gallery/.test(src.slice(Math.max(0, (m.index ?? 0) - 400), m.index)), `${path.basename(file)}: PhotoWall is gated on photos`);
      }
    }
  });
});

describe('Cultural designs: Drive videos', () => {
  const mk = (featuredVideos: unknown[]) => normalizeCultural({
    requirements: { organizationName: 'Demo Samiti', category: 'cultural', contactEmail: 'a@b.example' } as any,
    culturalData: undefined,
    website: { featuredVideos } as any,
  });
  const drive = (over: Record<string, unknown> = {}) => ({
    id: 'v1', videoId: 'AbC123_-xyz', originalUrl: 'https://drive.google.com/file/d/AbC123_-xyz/view',
    embedUrl: 'https://drive.google.com/file/d/AbC123_-xyz/preview', title: 'Annual programme', provider: 'google_drive', ...over,
  });

  test('a Drive video is listed with its Drive player and no hotlinked thumbnail', () => {
    const d = mk([drive({ thumbnailUrl: 'https://images.unsplash.com/photo-1518173946687-x' })]);
    assert.equal(d.videos.length, 1);
    assert.equal(d.videos[0].embed, 'https://drive.google.com/file/d/AbC123_-xyz/preview');
    assert.equal(d.videos[0].thumb, '');
    assert.equal(d.has.videos, true);
  });

  test('only a genuine Drive file URL is accepted', () => {
    for (const bad of ['https://evil.example/file/d/x/preview', 'http://drive.google.com/file/d/x/preview', 'javascript:alert(1)', 'https://drive.google.com/file/d/x/preview?next=https://evil.example'])
      assert.equal(mk([drive({ embedUrl: bad })]).videos.length, 0, bad);
  });

  test('the auto-generated placeholder title is not shown publicly', () => {
    assert.equal(mk([drive({ title: 'Drive Video (1AbCdEfG)' })]).videos[0].title, 'Video');
    assert.equal(mk([drive()]).videos[0].title, 'Annual programme');
  });

  test('a YouTube video next to it keeps its thumbnail', () => {
    const d = mk([drive(), { id: 'y1', videoId: 'dQw4w9WgXcQ', embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', title: 'Talk', provider: 'youtube' }]);
    assert.equal(d.videos.length, 2);
    assert.match(d.videos[1].thumb, /^https:\/\/img\.youtube\.com\/vi\/dQw4w9WgXcQ\//);
  });
});
