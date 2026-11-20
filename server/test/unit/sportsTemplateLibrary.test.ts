import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SPORTS_TEMPLATES, SPORTS_TEMPLATE_IDS, getSportsTemplateById, getSportsTemplateList, DEFAULT_SPORTS_TEMPLATE } from '../../../client/src/templates/sports/registry.ts';
import { SPORTS_IDS_BY_CATEGORY, ALL_SPORTS_IDS, categoryOfSportsTemplate } from '../../../client/src/templates/sports/ids.ts';
import {
  STEPS, emptyForm, buildRequirements, validateStep, validateAll, pruneBlank, mergeDraft, newId
} from '../../../client/src/components/admin/sports-intake/model.ts';
import { SPORTS_TEMPLATE_IDS_BY_ARCHETYPE, ALL_SPORTS_TEMPLATE_IDS, validateSportsFields, sportsArchetypeForTemplate, isKnownSportsTemplate } from '../../src/services/sportsCatalog.js';
import { synthesizeWebsite } from '../../src/services/aiGenerator.js';
import type { ClientRequirements } from '../../src/types/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientPublic = path.resolve(here, '../../../client/public');
const CATEGORIES = ['sports_club', 'sports_tournament', 'sports_academy'] as const;
const FORBIDDEN_NAME = /\b(nova|template\s*[a-z0-9]+|untitled|placeholder|lorem)\b/i;
const REAL_CLUBS = /(manchester|real madrid|barcelona|arsenal|chelsea|liverpool|juventus|bayern|psg|mumbai indians|knight riders|chennai super|east bengal|mohun bagan|fifa|uefa|icc|bcci|ipl\b|premier league)/i;
const HEX = /^#[0-9a-fA-F]{6}$/;

const metaFor = (id: string) => {
  const t = getSportsTemplateById(id)!;
  return { templateId: t.id, templateVersion: t.version, templateName: t.name, websiteCategory: t.archetype, selectedAt: new Date().toISOString(), designTokens: { primaryColor: t.tokens.primaryColor, accentColor: t.tokens.accentColor, fontFamily: t.tokens.fontFamily, headingFont: t.tokens.headingFont, layoutPreset: t.tokens.layoutPreset } };
};

/** Fill the identity and contact fields every category needs, leave everything else empty. */
function minimalForm(category: (typeof CATEGORIES)[number], templateId: string) {
  const f = emptyForm(metaFor(templateId));
  f.v.name = 'Kestrel Park';
  f.v.sport = 'football';
  f.v.email = 'Hello@Kestrel.Example';
  return { f, category };
}

describe('Sports template library (pure unit test: no server, no database)', () => {
  test('registers 24 unique templates, 8 per category', () => {
    assert.equal(SPORTS_TEMPLATE_IDS.length, 24);
    assert.equal(new Set(SPORTS_TEMPLATE_IDS).size, 24);
    for (const c of CATEGORIES) {
      assert.equal(getSportsTemplateList(c).length, 8, `${c} has 8 templates`);
      assert.equal(SPORTS_IDS_BY_CATEGORY[c].length, 8);
    }
    for (const c of CATEGORIES) assert.ok(getSportsTemplateById(DEFAULT_SPORTS_TEMPLATE[c]), `${c} has a default`);
  });

  test('client registry, client id list and server catalogue agree exactly', () => {
    assert.deepEqual([...SPORTS_TEMPLATE_IDS].sort(), [...ALL_SPORTS_IDS].sort());
    assert.deepEqual([...ALL_SPORTS_TEMPLATE_IDS].sort(), [...SPORTS_TEMPLATE_IDS].sort());
    for (const c of CATEGORIES) {
      assert.deepEqual([...SPORTS_TEMPLATE_IDS_BY_ARCHETYPE[c]].sort(), getSportsTemplateList(c).map((t) => t.id).sort(), `${c}: server ids match client registry`);
      for (const id of SPORTS_TEMPLATE_IDS_BY_ARCHETYPE[c]) {
        assert.equal(getSportsTemplateById(id)!.archetype, c, `${id} belongs to ${c} on the client`);
        assert.equal(sportsArchetypeForTemplate(id), c, `${id} belongs to ${c} on the server`);
        assert.equal(categoryOfSportsTemplate(id), c);
      }
    }
  });

  test('every template has complete metadata, a real screenshot and an original-source record', () => {
    for (const id of SPORTS_TEMPLATE_IDS) {
      const t = SPORTS_TEMPLATES[id];
      assert.equal(t.id, id);
      assert.ok(t.name.length > 3 && !FORBIDDEN_NAME.test(t.name), `${id}: descriptive name`);
      assert.ok(t.description.length > 60 && t.tagline && t.designStyle && t.designDirection && t.badge, `${id}: copy`);
      assert.ok(t.highlights.length >= 3, `${id}: highlights`);
      assert.ok(t.sports.length >= 1, `${id}: sports tags`);
      for (const k of ['primaryColor', 'accentColor', 'background', 'textColor'] as const) assert.match(t.tokens[k], HEX, `${id}: ${k}`);
      assert.ok(t.tokens.headingFont && t.tokens.fontFamily && t.tokens.layoutPreset, `${id}: fonts and layout`);
      assert.ok(t.sections.length >= 4, `${id}: sections`);
      assert.equal(t.animation.reducedMotion, 'static', `${id}: reduced motion handled`);
      assert.equal(t.source.kind, 'original', `${id}: original implementation (no third-party code)`);
      assert.equal(t.previewImage, `/images/sports-templates/${id}.jpg`);
      const file = path.join(clientPublic, 'images/sports-templates', `${id}.jpg`);
      assert.ok(fs.existsSync(file) && fs.statSync(file).size > 10_000, `${id}: card screenshot exists`);
    }
  });

  test('each template has its own design identity (no two share fonts + palette + layout)', () => {
    // Layout is deliberately not part of the key: two templates must differ in look (fonts, palette) too.
    // Different categories may share a palette family, but inside one category no palette or font pairing repeats.
    for (const c of CATEGORIES) {
      const palettes = new Map<string, string>();
      const fonts = new Map<string, string>();
      for (const t of getSportsTemplateList(c)) {
        const palette = [t.tokens.primaryColor.toLowerCase(), t.tokens.accentColor.toLowerCase(), t.tokens.background.toLowerCase()].join('|');
        const font = [t.tokens.headingFont, t.tokens.fontFamily].join('|');
        assert.ok(!palettes.has(palette), `${t.id} repeats the palette of ${palettes.get(palette)} in ${c}`);
        assert.ok(!fonts.has(font), `${t.id} repeats the font pairing of ${fonts.get(font)} in ${c}`);
        palettes.set(palette, t.id);
        fonts.set(font, t.id);
      }
    }
    const identities = new Set(SPORTS_TEMPLATE_IDS.map((id) => { const t = SPORTS_TEMPLATES[id]; return [t.tokens.headingFont, t.tokens.fontFamily, t.tokens.primaryColor, t.tokens.accentColor].join('|'); }));
    assert.equal(identities.size, 24, 'no two templates anywhere share fonts and palette');
    assert.equal(new Set(SPORTS_TEMPLATE_IDS.map((id) => SPORTS_TEMPLATES[id].designDirection)).size, 24, 'unique design directions');
    assert.equal(new Set(SPORTS_TEMPLATE_IDS.map((id) => SPORTS_TEMPLATES[id].name)).size, 24, 'unique names');
  });

  test('every design file exists, follows the folder convention and is wired to a template', () => {
    const dirFor = { sports_club: 'club', sports_tournament: 'tournament', sports_academy: 'academy' } as const;
    for (const id of SPORTS_TEMPLATE_IDS) {
      const pascal = id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join('');
      const file = path.resolve(here, '../../../client/src/templates/sports/designs', dirFor[SPORTS_TEMPLATES[id].archetype], `${pascal}.tsx`);
      assert.ok(fs.existsSync(file), `${id}: ${pascal}.tsx exists`);
      const src = fs.readFileSync(file, 'utf8');
      assert.match(src, new RegExp(`export const ${pascal}\\b`), `${id}: exports ${pascal}`);
      assert.match(src, /sp-root/, `${id}: root carries the shared safety class`);
      assert.match(src, /DemoBadge/, `${id}: shows the sample-content badge on demos`);
    }
  });

  test('demo content is fictional: no real clubs or leagues, no real contact details', () => {
    for (const id of SPORTS_TEMPLATE_IDS) {
      const demo = SPORTS_TEMPLATES[id].getDemoData();
      const blob = JSON.stringify({ r: demo.requirements, s: demo.sportsData });
      assert.ok(!REAL_CLUBS.test(blob), `${id}: demo mentions a real club or league`);
      assert.match(demo.requirements.contactEmail, /\.example$/, `${id}: demo email is on the reserved .example domain`);
      const urls = blob.match(/https?:\/\/[^"\s\\]+/g) || [];
      for (const u of urls) assert.ok(/\.example(\/|$)|\/images\/|^https?:\/\/(www\.)?(facebook|instagram|youtube)\.com\/?$/.test(u) || /\.example/.test(u), `${id}: demo URL ${u} must be a placeholder`);
      assert.ok(Array.isArray(demo.sportsData.teams), `${id}: demo has sports data`);
    }
  });

  test('server validation: unknown, mismatched and valid templates', () => {
    const base = { organizationName: 'X' } as Partial<ClientRequirements>;
    assert.equal(validateSportsFields({ ...base, sportsArchetype: 'sports_club', selectedTemplate: metaFor('floodlight-night') } as never, 'sports'), null);
    assert.match(validateSportsFields({ ...base, sportsArchetype: 'sports_club', selectedTemplate: { ...metaFor('floodlight-night'), templateId: 'does-not-exist' } } as never, 'sports') || '', /Unknown sports template/);
    assert.match(validateSportsFields({ ...base, sportsArchetype: 'sports_club', selectedTemplate: metaFor('bracket-board') } as never, 'sports') || '', /belongs to sports_tournament, not sports_club/);
    assert.match(validateSportsFields({ ...base, sportsArchetype: 'sports_banana' } as never, 'sports') || '', /Unknown sports archetype/);
    // an update that omits the archetype is checked against the stored one
    assert.match(validateSportsFields({ selectedTemplate: metaFor('premier-academy') } as never, 'sports', 'sports_club') || '', /belongs to sports_academy/);
    assert.equal(validateSportsFields({ selectedTemplate: metaFor('premier-academy') } as never, 'sports', 'sports_academy'), null);
    // other engines are not affected by sports template ids
    assert.equal(validateSportsFields({ selectedTemplate: { ...metaFor('floodlight-night'), templateId: 'engineer-blueprint' } } as never, 'portfolio'), null);
    assert.equal(validateSportsFields({ selectedTemplate: { ...metaFor('floodlight-night'), templateId: 'any-cultural-id' } } as never, 'cultural'), null);
    assert.ok(isKnownSportsTemplate('knockout-minimal') && !isKnownSportsTemplate('engineer-blueprint'));
  });
});

describe('Sports intake -> requirements -> generated website (pure unit test)', () => {
  test('each category has its own steps ending in review, and every category-specific step exists', () => {
    for (const c of CATEGORIES) {
      const titles = STEPS[c].map((s) => s.id);
      assert.equal(new Set(titles).size, titles.length, `${c}: unique step ids`);
      assert.equal(titles[0], 'identity');
      assert.equal(titles[titles.length - 1], 'review');
      assert.ok(titles.includes('branding') && titles.includes('contact'), `${c}: branding and contact`);
    }
    const ids = (c: (typeof CATEGORIES)[number]) => STEPS[c].map((s) => s.id);
    assert.ok(ids('sports_tournament').includes('bracket') && ids('sports_tournament').includes('venues'));
    assert.ok(ids('sports_academy').includes('programmes') && ids('sports_academy').includes('admission') && ids('sports_academy').includes('batches'));
    assert.ok(ids('sports_club').includes('squad') && ids('sports_club').includes('standings'));
    assert.ok(!ids('sports_club').includes('programmes') && !ids('sports_club').includes('admission'), 'the club intake has no academy steps');
    assert.ok(!ids('sports_academy').includes('bracket'), 'the academy intake has no bracket');
  });

  test('a new form is empty: nothing is pre-filled or invented', () => {
    const f = emptyForm(metaFor('premier-elite-club'));
    assert.deepEqual(Object.values(f.lists).flat(), []);
    assert.deepEqual(Object.keys(f.v).sort(), ['accentColor', 'primaryColor']);
  });

  for (const c of CATEGORIES) {
    test(`${c}: only name, sport and contact email are required; everything else is optional`, () => {
      const empty = emptyForm(metaFor(DEFAULT_SPORTS_TEMPLATE[c]));
      const problems = validateAll(empty, c);
      const messages = problems.flatMap((p) => Object.keys(p.errors));
      assert.deepEqual([...new Set(messages)].sort(), ['email', 'name', 'sport'], `${c}: required fields`);
      const { f } = minimalForm(c, DEFAULT_SPORTS_TEMPLATE[c]);
      assert.deepEqual(validateAll(f, c), [], `${c}: minimal form is valid`);
    });

    test(`${c}: a minimal intake generates a site that keeps the selected template and invents nothing`, () => {
      for (const templateId of SPORTS_IDS_BY_CATEGORY[c]) {
        const { f } = minimalForm(c, templateId);
        const reqs = buildRequirements(f, c);
        assert.equal(reqs.selectedTemplate?.templateId, templateId);
        assert.equal(reqs.sportsArchetype, c);
        assert.equal(validateSportsFields(reqs as never, reqs.category), null, `${templateId}: passes server validation`);
        const sd = reqs.sportsData!;
        assert.equal(sd.club.organizationName, 'Kestrel Park');
        for (const k of ['teams', 'players', 'staff', 'competitions', 'fixtures', 'standings', 'sponsors', 'news'] as const) assert.equal(sd[k].length, 0, `${templateId}: no ${k}`);
        assert.equal(reqs.tagline, '', 'no invented tagline');
        assert.equal(reqs.aboutText, '', 'no invented about text');
        assert.equal(reqs.contactEmail, 'hello@kestrel.example');
        assert.ok(Object.values(sd.dataAvailability).every((v) => v === false), `${templateId}: every dataset is flagged as not supplied`);
        const site = synthesizeWebsite(reqs as unknown as ClientRequirements);
        assert.equal(site.selectedTemplate?.templateId, templateId, `${templateId}: generator keeps the template`);
        assert.equal(site.selectedTemplate?.websiteCategory, c);
      }
    });
  }

  test('club: entered data is carried exactly; standings are keyed by team id; scores follow the match status', () => {
    const { f } = minimalForm('sports_club', 'floodlight-night');
    const team = { id: newId('team'), name: 'First Team', sport: '', ageGroup: '', gender: '', description: '', logo: '' };
    f.lists.teams = [team];
    f.lists.players = [{ id: newId('pl'), teamId: team.id, fullName: 'Dev Anand', jerseyNumber: '9', position: 'Forward', photo: '' }];
    f.lists.fixtures = [
      { id: newId('fx'), teamId: team.id, opponent: '', opponentName: 'Redhill', scheduledAt: '2026-10-10T16:00', venue: '', homeOrAway: 'away', status: 'completed', homeScore: '1', awayScore: '3', round: '', competitionId: '', resultSummary: '' },
      { id: newId('fx'), teamId: '', opponent: '', opponentName: 'Dunmore', scheduledAt: '2026-11-20T15:00', venue: '', homeOrAway: 'home', status: 'scheduled', homeScore: '9', awayScore: '9', round: '', competitionId: '', resultSummary: '' }
    ];
    f.lists.standings = [
      { id: newId('st'), competitionId: '', teamId: team.id, teamName: '', position: '1', played: '2', won: '1', drawn: '0', lost: '1', goalsFor: '4', goalsAgainst: '3', points: '3' },
      { id: newId('st'), competitionId: '', teamId: '__other', teamName: 'Redhill', position: '2', played: '', won: '', drawn: '', lost: '', goalsFor: '', goalsAgainst: '', points: '1' }
    ];
    assert.deepEqual(validateAll(f, 'sports_club'), []);
    const sd = buildRequirements(f, 'sports_club').sportsData!;
    assert.equal(sd.players[0].teamId, team.id);
    assert.equal(sd.players[0].jerseyNumber, 9);
    assert.equal(sd.fixtures[0].homeOrAway, 'away');
    assert.deepEqual([sd.fixtures[0].homeScore, sd.fixtures[0].awayScore], [1, 3]);
    assert.equal(sd.fixtures[1].homeScore, undefined, 'a scheduled match never carries a score');
    assert.equal(sd.fixtures[1].awayScore, undefined);
    assert.equal(sd.fixtures[1].teamId, 'main', 'a match with no team selected belongs to the main side');
    assert.equal(sd.standings[0].teamId, team.id, 'standing keyed by team id, not by name');
    assert.equal(sd.standings[0].goalDifference, 1);
    assert.match(sd.standings[1].teamId, /^ext_/);
    assert.equal(sd.standings[1].teamName, 'Redhill');
    assert.equal(sd.dataAvailability.fixtures, true);
    assert.equal(sd.dataAvailability.sponsors, false);
  });

  test('tournament: bracket becomes tournamentStages, venues and rules become tournamentInfo', () => {
    const { f } = minimalForm('sports_tournament', 'bracket-board');
    f.v.format = 'group_knockout'; f.v.startDate = '2026-12-01'; f.v.endDate = '2026-12-07'; f.v.rules = 'Rule one\n\n  Rule two  ';
    f.lists.venues = [{ id: newId('v'), name: 'Arena', address: '', capacity: '500', notes: '', imageUrl: '' }];
    f.lists.stages = [{ id: newId('s'), name: 'Final', stageType: 'final', status: 'upcoming', matches: [{ id: newId('m'), homeTeamName: 'Alpha', awayTeamName: 'TBD', homeScore: '', awayScore: '', status: 'scheduled', scheduledAt: '' }] }];
    const sd = buildRequirements(f, 'sports_tournament').sportsData!;
    assert.equal(sd.tournamentInfo?.format, 'group_knockout');
    assert.deepEqual(sd.tournamentInfo?.rules, ['Rule one', 'Rule two']);
    assert.equal(sd.tournamentInfo?.venues?.[0].capacity, 500);
    assert.equal(sd.tournamentStages?.[0].stageType, 'final');
    assert.equal(sd.tournamentStages?.[0].matches[0].awayTeamName, 'TBD');
    assert.equal(sd.tournamentStages?.[0].matches[0].winner, undefined, 'no winner without a score');
    assert.equal(sd.academyProgrammes, undefined, 'tournament data has no academy fields');
    assert.equal(sd.dataAvailability.tournamentStages, true);
  });

  test('academy: programmes, batches, admission and genuine testimonials only', () => {
    const { f } = minimalForm('sports_academy', 'premier-academy');
    f.lists.programmes = [{ id: newId('p'), title: 'Juniors', sport: '', ageGroup: '8-12', duration: '10 months', description: '', feeStructure: '', highlights: 'Passing, Teamwork , ' }];
    f.lists.batches = [{ id: newId('b'), name: 'Juniors A', programmeId: '', ageGroup: '', daysOfWeek: ['Mon', 'Wed'], startTime: '16:00', endTime: '', venue: '', coachName: '' }];
    f.v.admProcess = 'Book a free trial.';
    const sd = buildRequirements(f, 'sports_academy').sportsData!;
    assert.deepEqual(sd.academyProgrammes?.[0].curriculumHighlights, ['Passing', 'Teamwork']);
    assert.equal(sd.academyProgrammes?.[0].sport, 'football', 'a programme with no sport inherits the main sport');
    assert.deepEqual(sd.trainingBatches?.[0].daysOfWeek, ['Mon', 'Wed']);
    assert.equal(sd.academyInfo?.admission?.process, 'Book a free trial.');
    assert.deepEqual(sd.academyInfo?.testimonials, []);
    assert.deepEqual(sd.academyInfo?.achievements, []);
    assert.equal(sd.tournamentStages, undefined);
  });

  test('validation: scores, dates, links, colours, days and orphaned references are caught', () => {
    const { f } = minimalForm('sports_tournament', 'bracket-board');
    const errs = (step: number) => validateStep(step, f, 'sports_tournament');
    f.v.startDate = '2026-12-07'; f.v.endDate = '2026-12-01';
    assert.ok(errs(3).endDate, 'end before start');
    f.v.endDate = '2026-12-09'; assert.deepEqual(errs(3), {});
    f.v.founded = '1700'; assert.ok(errs(1).founded, 'year out of range'); f.v.founded = '1990'; assert.deepEqual(errs(1), {});
    f.v.primaryColor = 'red'; assert.ok(errs(2).primaryColor, 'colour must be hex'); f.v.primaryColor = '#112233'; assert.deepEqual(errs(2), {});
    f.v.facebook = 'not a link'; assert.ok(errs(11).facebook, 'social link must be a full URL'); f.v.facebook = 'https://facebook.com/kestrel'; assert.deepEqual(errs(11), {});
    f.v.email = 'nope'; assert.ok(errs(11).email); f.v.email = 'ok@kestrel.example';
    const a = newId('team'); const b = newId('team');
    f.lists.teams = [{ id: a, name: 'Alpha', sport: '', ageGroup: '', gender: '', description: '', logo: '' }];
    f.lists.fixtures = [{ id: 'fx1', teamId: a, opponent: a, opponentName: '', scheduledAt: '2026-12-02T10:00', venue: '', homeOrAway: 'home', status: 'completed', homeScore: '', awayScore: '', round: '', competitionId: '', resultSummary: '' }];
    const fx = errs(6);
    assert.ok(fx.fixtures, 'a tournament match needs two teams in the team list');
    assert.ok(fx['fixtures:fx1:homeScore'], 'a completed match needs both scores');
    assert.ok(fx['fixtures:fx1:opponent'], 'a team cannot play itself');
    f.lists.teams.push({ id: b, name: 'Bravo', sport: '', ageGroup: '', gender: '', description: '', logo: '' });
    f.lists.fixtures[0].opponent = b; f.lists.fixtures[0].homeScore = '2'; f.lists.fixtures[0].awayScore = '2';
    assert.deepEqual(errs(6), {});
    f.lists.stages = [{ id: 's1', name: '', stageType: 'final', status: 'upcoming', matches: [{ id: 'm1', homeTeamName: 'Alpha', awayTeamName: '', homeScore: '1', awayScore: '', status: 'scheduled', scheduledAt: '' }] }];
    const br = errs(8);
    assert.ok(br['stages:s1:name'] && br['stages:m1:teams'] && br['stages:m1:score'], 'bracket round and match problems');
    const ac = minimalForm('sports_academy', 'premier-academy').f;
    ac.lists.batches = [{ id: 'b1', name: 'Juniors', programmeId: '', ageGroup: '', daysOfWeek: [], startTime: '', endTime: '', venue: '', coachName: '' }];
    const bt = validateStep(7, ac, 'sports_academy');
    assert.ok(bt['batches:b1:daysOfWeek'] && bt['batches:b1:startTime'], 'a batch needs days and a start time');
    const cl = minimalForm('sports_club', 'premier-elite-club').f;
    cl.lists.players = [{ id: 'p1', teamId: '', fullName: 'Dev', jerseyNumber: '', position: '', photo: '' }];
    assert.ok(validateStep(5, cl, 'sports_club').players, 'players need a team to exist first');
  });

  test('cards that were added but never filled in are dropped; filled ones are kept', () => {
    const { f } = minimalForm('sports_club', 'premier-elite-club');
    f.lists.sponsors = [
      { id: newId('sp'), name: '', level: '', websiteUrl: '', logo: '', description: '' },
      { id: newId('sp'), name: 'Acme Hardware', level: '', websiteUrl: '', logo: '', description: '' }
    ];
    f.lists.fixtures = [{ id: newId('fx'), teamId: '', opponent: '', opponentName: '', scheduledAt: '', venue: '', homeOrAway: 'home', status: 'scheduled', homeScore: '', awayScore: '', round: '', competitionId: '', resultSummary: '' }];
    const p = pruneBlank(f);
    assert.equal(p.lists.sponsors.length, 1);
    assert.equal(p.lists.sponsors[0].name, 'Acme Hardware');
    assert.equal(p.lists.fixtures.length, 0, 'an untouched club match card is pruned');
  });

  test('a saved draft merges over a fresh form without losing newer fields', () => {
    const base = emptyForm(metaFor('premier-elite-club'));
    const saved = JSON.parse(JSON.stringify(base));
    saved.v.name = 'Saved Club'; saved.lists.news = [{ id: 'n1', title: 'Hello', summary: '', date: '', image: '' }];
    delete saved.lists.gallery; // a draft from an older version
    const merged = mergeDraft(base, saved);
    assert.equal(merged.v.name, 'Saved Club');
    assert.equal(merged.lists.news.length, 1);
    assert.deepEqual(merged.lists.gallery, []);
    assert.equal(merged.lists.programmes.length, 0);
  });

  test('legacy: a sports project with no template is not given one by the generator (it keeps the old renderer)', () => {
    const reqs = {
      organizationName: 'Old Club', category: 'sports', sportsArchetype: 'sports_club', tagline: 'Old', aboutText: 'Old', contactEmail: 'a@b.example', contactPhone: '',
      primaryColor: '#000000', accentColor: '#ffffff', sportsData: { schemaVersion: '1.0', club: { organizationName: 'Old Club', sportTypes: ['football'] }, teams: [], players: [], staff: [], competitions: [], fixtures: [], standings: [], matchEvents: [], sponsors: [], news: [], pages: [], sections: [], dataAvailability: {} }
    } as unknown as ClientRequirements;
    const site = synthesizeWebsite(reqs);
    assert.equal(site.selectedTemplate, undefined, 'no template invented for a legacy sports project');
    assert.equal(validateSportsFields(reqs as never, 'sports'), null, 'and it is still valid on the server');
  });

  test('switching template keeps every piece of entered data', () => {
    const { f } = minimalForm('sports_club', 'premier-elite-club');
    f.lists.sponsors = [{ id: 's1', name: 'Acme', level: '', websiteUrl: '', logo: '', description: '' }];
    const before = buildRequirements(f, 'sports_club');
    const after = { ...before, selectedTemplate: metaFor('clean-sheet') } as unknown as ClientRequirements;
    assert.deepEqual(after.sportsData, before.sportsData);
    assert.equal(synthesizeWebsite(after).selectedTemplate?.templateId, 'clean-sheet');
    assert.equal(validateSportsFields(after as never, 'sports', 'sports_club'), null);
  });
});
