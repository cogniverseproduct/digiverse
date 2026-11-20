import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  PORTFOLIO_TEMPLATES, PORTFOLIO_TEMPLATE_IDS, LEGACY_TEMPLATES, DEFAULT_TEMPLATE_BY_ARCHETYPE, getPortfolioTemplateById, portfolioArchetypeForTemplate
} from '../../../client/src/templates/portfolio/registry.ts';
import { PROFESSIONS, PROFESSION_ORDER, getProfession } from '../../../client/src/templates/portfolio/professions.ts';
import {
  emptyForm, emptyProject, validateStep, validateAll, buildRequirements, pruneBlank, newId, type IntakeForm
} from '../../../client/src/components/admin/portfolio-intake/model.ts';
import { buildPortfolioTemplateMetadata } from '../../../client/src/components/admin/templates/PortfolioTemplateLibrary.tsx';
import {
  ACTIVE_PORTFOLIO_TEMPLATE_IDS, LEGACY_PORTFOLIO_TEMPLATE_IDS, PORTFOLIO_ARCHETYPE_IDS, validatePortfolioFields, isKnownPortfolioArchetype
} from '../../src/services/portfolioCatalog.js';
import { synthesizeWebsite } from '../../src/services/aiGenerator.js';
import type { ClientRequirements } from '../../src/types/index.js';

/** A complete, valid intake for any profession. */
function filledForm(archetype: (typeof PROFESSION_ORDER)[number]): IntakeForm {
  const prof = PROFESSIONS[archetype];
  const tmpl = PORTFOLIO_TEMPLATES[prof.recommendedTemplate];
  const f = emptyForm(buildPortfolioTemplateMetadata(tmpl as never));
  const project = { ...emptyProject(), title: `${prof.label} Project`, summary: 'A summary.', category: prof.projectCategories[0], image: '/uploads/cover.jpg', problem: 'Hard problem', outcome: 'Great result', client: 'ACME', location: 'Pune', area: '2,400 sq ft', tools: 'A, B', videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' };
  return {
    ...f, fullName: 'Priya Chatterjee', email: 'priya@example.com', phone: '+91 98765 43210', location: '',
    title: 'Professional Title', headline: 'A headline long enough to pass.', bio: 'A biography that is comfortably longer than thirty characters.',
    skills: [{ id: newId('sk'), name: prof.skillSuggestions[0], category: prof.skillCategories[0], proficiency: 'Expert' }],
    projects: [project], education: [{ id: newId('edu'), degree: 'B.Des', institution: 'NID', location: '', year: '2020', honors: '' }],
    certifications: [{ id: newId('c'), name: 'Certified Pro', issuer: 'Body', year: '2024', credentialUrl: '' }],
    achievements: [{ id: newId('a'), title: 'Award', issuer: 'Org', year: '2023', description: '', url: '' }],
    services: prof.extras.includes('services') ? [{ id: newId('s'), title: 'Design sprint', description: 'Five days.', price: '$1,000', timeline: '1 week', deliverables: 'Report' }] : [],
    resumeUrl: 'https://example.com/cv.pdf', socialLinks: { [prof.socialLinks[0].key]: 'https://example.com/me' }
  };
}

describe('Portfolio archetypes and the intake contract (pure unit test: no server, no database)', () => {
  test('there are exactly 10 profession cards, one per template, each with a distinct recommended template', () => {
    assert.equal(PROFESSION_ORDER.length, 10);
    const recommended = PROFESSION_ORDER.map((id) => PROFESSIONS[id].recommendedTemplate);
    assert.equal(new Set(recommended).size, 10, 'every template is the recommendation of exactly one profession');
    for (const id of PROFESSION_ORDER) {
      assert.ok(getPortfolioTemplateById(PROFESSIONS[id].recommendedTemplate), `${id}: recommended template is active`);
      assert.equal(DEFAULT_TEMPLATE_BY_ARCHETYPE[id], PROFESSIONS[id].recommendedTemplate, `${id}: registry default matches the profession config`);
      assert.equal(PORTFOLIO_TEMPLATES[PROFESSIONS[id].recommendedTemplate].archetype, id, `${id}: the template points back to its profession`);
      assert.equal(portfolioArchetypeForTemplate(PROFESSIONS[id].recommendedTemplate), id);
    }
  });

  test('server catalog stays in sync with the client registry', () => {
    assert.deepEqual([...ACTIVE_PORTFOLIO_TEMPLATE_IDS].sort(), [...PORTFOLIO_TEMPLATE_IDS].sort());
    assert.deepEqual([...LEGACY_PORTFOLIO_TEMPLATE_IDS].sort(), Object.keys(LEGACY_TEMPLATES).sort());
    for (const id of [...PROFESSION_ORDER, 'academic_pro', 'personal_brand']) assert.ok(isKnownPortfolioArchetype(id), `${id} is a server archetype`);
    assert.equal(PORTFOLIO_ARCHETYPE_IDS.length, 18);
  });

  test('profession configs are complete and distinct', () => {
    for (const id of PROFESSION_ORDER) {
      const p = PROFESSIONS[id];
      assert.equal(p.id, id);
      assert.ok(p.skillCategories.length >= 3 && p.skillSuggestions.length >= 4, `${id}: skills guidance`);
      assert.ok(p.projectCategories.length >= 4 && p.projectFields.length >= 5, `${id}: project fields`);
      assert.ok(p.socialLinks.length >= 3, `${id}: link slots`);
      assert.ok(p.intakeHighlights.length >= 3);
      assert.ok(new Set(p.socialLinks.map((s) => s.key)).size === p.socialLinks.length, `${id}: unique link keys`);
    }
    // Not identical for every profession (the requirement): field sets and link slots differ.
    assert.notDeepEqual(PROFESSIONS.developer.projectFields, PROFESSIONS.photographer.projectFields);
    assert.ok(PROFESSIONS.developer.projectFields.includes('githubUrl') && !PROFESSIONS.photographer.projectFields.includes('githubUrl'));
    assert.ok(PROFESSIONS.designer.projectFields.includes('problem') && PROFESSIONS.designer.projectFields.includes('outcome'));
    assert.ok(PROFESSIONS.photographer.projectFields.includes('gallery') && PROFESSIONS.photographer.projectCategories.includes('Landscape'));
    assert.ok(PROFESSIONS.data_scientist.extras.includes('publications') && PROFESSIONS.freelancer.extras.includes('services'));
    assert.ok(PROFESSIONS.developer.socialLinks.some((s) => s.key === 'github') && !PROFESSIONS.photographer.socialLinks.some((s) => s.key === 'github'));
    assert.equal(getProfession('academic_pro').id, 'data_scientist');
    assert.equal(getProfession('personal_brand').id, 'freelancer');
  });

  test('nothing is pre-filled: a fresh form is empty and every required step fails until completed', () => {
    for (const id of PROFESSION_ORDER) {
      const f = emptyForm(buildPortfolioTemplateMetadata(PORTFOLIO_TEMPLATES[PROFESSIONS[id].recommendedTemplate] as never));
      assert.equal(f.fullName, ''); assert.equal(f.email, ''); assert.equal(f.projects.length, 0); assert.equal(f.skills.length, 0);
      for (const step of [1, 2, 4, 6]) assert.ok(Object.keys(validateStep(step, f, id)).length > 0, `${id}: step ${step} requires input`);
      assert.ok(validateAll(f, id).length >= 4);
    }
  });

  test('validation rules: email, phone, URLs, years and blank cards', () => {
    const f = filledForm('developer');
    assert.deepEqual(validateAll(f, 'developer'), []);
    assert.ok(validateStep(1, { ...f, email: 'not-an-email' }, 'developer').email);
    assert.ok(validateStep(1, { ...f, phone: '12' }, 'developer').phone);
    assert.ok(validateStep(2, { ...f, yearsOfExperience: '-3' }, 'developer').yearsOfExperience);
    assert.ok(validateStep(2, { ...f, bio: 'too short' }, 'developer').bio);
    assert.ok(validateStep(9, { ...f, socialLinks: { github: 'github.com/me' } }, 'developer').social_github);
    assert.ok(validateStep(9, { ...f, resumeUrl: 'cv.pdf' }, 'developer').resumeUrl);
    // a project with only a bad link
    const bad = { ...f, projects: [{ ...f.projects[0], liveUrl: 'nope' }] };
    assert.ok(Object.keys(validateStep(6, bad, 'developer')).some((k) => k.startsWith('project_')));
    // blank cards never block and never reach the payload
    const withBlank = { ...f, projects: [...f.projects, emptyProject()], services: [...f.services, { id: 'x', title: '', description: '', price: '', timeline: '', deliverables: '' }] };
    assert.deepEqual(validateStep(6, withBlank, 'developer'), {});
    assert.equal(pruneBlank(withBlank).projects.length, 1);
    // profession-specific rules
    assert.ok(validateStep(5, { ...f, education: [] }, 'student_grad').education, 'students need education');
    assert.deepEqual(validateStep(5, { ...f, education: [] }, 'developer'), {});
    const noImage = { ...f, projects: [{ ...f.projects[0], image: '' }] };
    assert.ok(validateStep(6, noImage, 'photographer').projects, 'photographers need a cover image');
    assert.deepEqual(validateStep(6, noImage, 'developer'), {});
    assert.ok(validateStep(6, { ...f, projects: [], services: [] }, 'freelancer').projects);
    assert.deepEqual(validateStep(6, { ...f, projects: [], services: filledForm('freelancer').services }, 'freelancer'), {});
  });

  for (const archetype of PROFESSION_ORDER) {
    test(`${archetype}: intake → requirements → generated site keeps the archetype, template and entered data`, () => {
      const f = filledForm(archetype);
      assert.deepEqual(validateAll(f, archetype), [], 'filled form is valid');
      const reqs = buildRequirements(f, archetype);

      assert.equal(reqs.category, 'portfolio');
      assert.equal(reqs.portfolioArchetype, archetype);
      assert.equal(reqs.selectedTemplate?.templateId, PROFESSIONS[archetype].recommendedTemplate);
      assert.equal(reqs.portfolioData?.archetype, archetype);
      assert.equal(reqs.portfolioData?.identity.fullName, 'Priya Chatterjee');
      assert.equal(reqs.portfolioData?.projects[0].featuredImageUrl, '/uploads/cover.jpg');
      assert.equal(reqs.portfolioData?.resumeUrl, 'https://example.com/cv.pdf');
      assert.equal(reqs.portfolioData?.certifications?.[0].name, 'Certified Pro');
      assert.equal(reqs.portfolioData?.achievements?.[0].title, 'Award');
      assert.ok(reqs.youtubeUrls?.some((u) => u.includes('aqz-KE-bpKQ')), 'project video reaches the video list');
      // Empty optional fields are omitted rather than invented.
      assert.equal(reqs.portfolioData?.identity.yearsOfExperience, undefined);
      assert.equal(reqs.portfolioData?.identity.location, undefined);
      assert.deepEqual(reqs.portfolioData?.about?.interests, []);
      assert.equal(validatePortfolioFields(reqs as unknown as Partial<ClientRequirements>, reqs.category as string), null, 'the server accepts the payload');

      // Round-trip through the real generator, as POST /generate does.
      const site = synthesizeWebsite(JSON.parse(JSON.stringify(reqs)) as ClientRequirements);
      assert.equal(site.selectedTemplate?.templateId, PROFESSIONS[archetype].recommendedTemplate, 'template survives generation');
      const pd = (site as unknown as { portfolioData: NonNullable<typeof reqs.portfolioData> }).portfolioData;
      assert.equal(pd.identity.fullName, 'Priya Chatterjee');
      assert.equal(pd.identity.yearsOfExperience, undefined, 'no invented years');
      assert.equal(pd.identity.location, '', 'no invented location');
      assert.deepEqual(pd.about?.interests, [], 'no sample interests');
      assert.equal(pd.projects.length, 1);
      assert.equal(pd.skills[0].name, PROFESSIONS[archetype].skillSuggestions[0]);
      // Credentials and the CV link must survive generation (they were silently dropped before).
      assert.equal(pd.certifications?.[0]?.name, 'Certified Pro', 'certifications survive generation');
      assert.equal(pd.achievements?.[0]?.title, 'Award', 'achievements survive generation');
      assert.equal(pd.resumeUrl, 'https://example.com/cv.pdf', 'resume link survives generation');
      assert.equal(pd.education?.[0]?.institution, 'NID');
      assert.equal(pd.identity.email, 'priya@example.com');
    });
  }

  test('generation never invents content for real intake data, and still demos when there is none', () => {
    const f = { ...filledForm('photographer'), socialLinks: {}, resumeUrl: '', certifications: [], achievements: [] };
    const reqs = buildRequirements(f, 'photographer');
    const pd = (synthesizeWebsite(JSON.parse(JSON.stringify(reqs)) as ClientRequirements) as unknown as { portfolioData: NonNullable<typeof reqs.portfolioData> }).portfolioData;
    assert.deepEqual(pd.socialLinks, {}, 'no placeholder github/linkedin links');
    assert.equal(pd.resumeUrl, undefined);
    assert.deepEqual(pd.certifications, []);
    assert.ok(pd.identity.email !== 'alex@example.internal');
    assert.equal(pd.skills.length, 1, 'only the skills the Admin entered');

    // No portfolio data at all (a quick demo project) keeps the demo content.
    const demo = synthesizeWebsite({ organizationName: 'Demo Person', category: 'portfolio', portfolioArchetype: 'developer' } as unknown as ClientRequirements);
    const dpd = (demo as unknown as { portfolioData: { skills: unknown[]; socialLinks: Record<string, string> } }).portfolioData;
    assert.ok(dpd.skills.length >= 4 && Object.keys(dpd.socialLinks).length >= 2);
  });

  test('server validation rules for create and update', () => {
    assert.equal(validatePortfolioFields({ portfolioArchetype: 'developer' }, 'portfolio'), null);
    assert.match(validatePortfolioFields({ portfolioArchetype: 'wizard' as never }, 'portfolio') || '', /Unknown portfolio archetype/);
    assert.equal(validatePortfolioFields({ selectedTemplate: { templateId: 'photo-fullscreen' } as never }, 'portfolio'), null);
    assert.equal(validatePortfolioFields({ selectedTemplate: { templateId: 'nova' } as never }, 'portfolio'), null, 'legacy template ids stay valid');
    assert.match(validatePortfolioFields({ selectedTemplate: { templateId: 'made-up' } as never }, 'portfolio') || '', /Unknown portfolio template/);
    // other engines use selectedTemplate with their own ids
    assert.equal(validatePortfolioFields({ selectedTemplate: { templateId: 'heritage_akademi' } as never }, 'cultural'), null);
    assert.equal(validatePortfolioFields({}, 'sports'), null);
  });
});
