import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PORTFOLIO_TEMPLATES,
  PORTFOLIO_TEMPLATE_IDS,
  FILTER_OPTIONS,
  LEGACY_TEMPLATES,
  DEFAULT_TEMPLATE_BY_ARCHETYPE,
  getPortfolioTemplateById,
  isLegacyTemplateId,
  portfolioArchetypeForTemplate
} from '../../../client/src/templates/portfolio/registry.ts';
import { synthesizeWebsite } from '../../src/services/aiGenerator.js';
import type { ClientRequirements } from '../../src/types/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientPublic = path.resolve(here, '../../../client/public');

const EXPECTED_CATEGORIES = ['developer', 'ui_ux', 'photography', 'creative', 'freelancer', 'student', 'ai_data', 'architecture', 'content_creator'];
const FORBIDDEN_NAME = /\b(nova|template\s*[a-z0-9]+|untitled|placeholder)\b/i;

describe('Portfolio template library v2 (pure unit test: no server, no database)', () => {
  test('registers 10 unique templates covering every required profession', () => {
    assert.equal(PORTFOLIO_TEMPLATE_IDS.length, 10);
    assert.equal(new Set(PORTFOLIO_TEMPLATE_IDS).size, 10);
    const cats = new Set(Object.values(PORTFOLIO_TEMPLATES).map((t) => t.category));
    for (const c of EXPECTED_CATEGORIES) assert.ok(cats.has(c as never), `category ${c} is covered`);
  });

  test('every template has complete, consistent metadata', () => {
    for (const id of PORTFOLIO_TEMPLATE_IDS) {
      const t = PORTFOLIO_TEMPLATES[id];
      assert.equal(t.id, id);
      assert.ok(t.name.length > 3 && !FORBIDDEN_NAME.test(t.name), `${id}: descriptive name`);
      assert.ok(t.description.length > 80, `${id}: description`);
      assert.ok(t.designStyle && t.categoryLabel && t.tagline, `${id}: style/category/tagline`);
      assert.ok(t.highlights.length >= 4, `${id}: visual features`);
      assert.ok(t.sections.length >= 5, `${id}: sections`);
      assert.ok(t.contentFields.length > 5, `${id}: supported content fields`);
      assert.ok(t.assetRequirements.notes, `${id}: asset requirements`);
      assert.ok(t.animation.features.length > 0 && t.animation.reducedMotion === 'static', `${id}: animation config`);
      assert.equal(t.source.kind, 'original', `${id}: provenance recorded`);
      assert.match(t.tokens.accentColor, /^#[0-9A-Fa-f]{6}$/, `${id}: accent colour`);
      assert.match(t.version, /^\d+\.\d+\.\d+$/);
    }
  });

  test('designs are genuinely different: unique palettes, fonts and layouts', () => {
    const ts = PORTFOLIO_TEMPLATE_IDS.map((id) => PORTFOLIO_TEMPLATES[id]);
    assert.equal(new Set(ts.map((t) => `${t.tokens.background}|${t.tokens.accentColor}`)).size, ts.length, 'unique background+accent');
    assert.equal(new Set(ts.map((t) => t.tokens.headingFont)).size, ts.length, 'unique heading fonts');
    assert.equal(new Set(ts.map((t) => t.tokens.layoutPreset)).size, ts.length, 'unique layout presets');
    assert.equal(new Set(ts.map((t) => t.name)).size, ts.length, 'unique names');
  });

  test('every gallery preview image exists and is a real file', () => {
    for (const id of PORTFOLIO_TEMPLATE_IDS) {
      const file = path.join(clientPublic, PORTFOLIO_TEMPLATES[id].previewImage);
      assert.ok(fs.existsSync(file), `${id}: ${file} exists`);
      assert.ok(fs.statSync(file).size > 10_000, `${id}: preview is not an empty placeholder`);
    }
  });

  test('filters: all requested filters exist and each non-"all" filter has a template', () => {
    const labels = FILTER_OPTIONS.map((f) => f.label);
    for (const l of ['All', 'Developer', 'UI/UX Designer', 'Photography', 'Creative', 'Freelancer', 'Student', 'AI / Data Science', 'Architecture', 'Content Creator']) assert.ok(labels.includes(l), l);
    for (const f of FILTER_OPTIONS.filter((x) => x.id !== 'all')) {
      assert.ok(PORTFOLIO_TEMPLATE_IDS.some((id) => PORTFOLIO_TEMPLATES[id].category === f.id), `filter ${f.id} has a template`);
    }
  });

  test('every demo profile builds, is self-consistent and uses no remote images', () => {
    for (const id of PORTFOLIO_TEMPLATE_IDS) {
      const { requirements, portfolioData, website } = PORTFOLIO_TEMPLATES[id].getDemoData();
      assert.equal(requirements.selectedTemplate?.templateId, id);
      assert.equal(website.selectedTemplate?.templateId, id);
      assert.ok(portfolioData.identity.fullName);
      assert.ok(portfolioData.projects.length > 0 || id === 'graduate-profile', `${id}: has work`);
      const urls = JSON.stringify(portfolioData).match(/https?:\/\/[^"]+/g) || [];
      for (const u of urls) assert.ok(!/unsplash|pexels|pixabay/.test(u), `${id}: no stock-photo hotlink (${u})`);
    }
  });

  test('legacy template ids keep resolving, and map to a current replacement', () => {
    for (const [legacyId, info] of Object.entries(LEGACY_TEMPLATES)) {
      assert.ok(isLegacyTemplateId(legacyId));
      assert.equal(getPortfolioTemplateById(legacyId), undefined, `${legacyId} is no longer in the active library`);
      assert.ok(getPortfolioTemplateById(info.replacedBy), `${legacyId} -> ${info.replacedBy}`);
      assert.ok(portfolioArchetypeForTemplate(legacyId));
    }
    assert.equal(LEGACY_TEMPLATES.nova.replacedBy, 'engineer-blueprint');
  });

  test('server default template per archetype is an active v2 template that matches the client default', () => {
    for (const [archetype, expectedId] of Object.entries(DEFAULT_TEMPLATE_BY_ARCHETYPE)) {
      const reqs = {
        organizationName: 'Test Person', category: 'portfolio', portfolioArchetype: archetype,
        tagline: '', aboutText: 'About', contactEmail: 'a@example.com', contactPhone: '',
        primaryColor: '#000000', accentColor: '#ffffff',
        portfolioData: { schemaVersion: '1.0', archetype, identity: { fullName: 'Test Person' }, skills: [], projects: [], experience: [] }
      } as unknown as ClientRequirements;
      const site = synthesizeWebsite(reqs);
      assert.equal(site.selectedTemplate?.templateId, expectedId, `${archetype} default`);
      assert.ok(getPortfolioTemplateById(site.selectedTemplate?.templateId), `${archetype} default is active`);
    }
  });

  test('every server portfolio archetype (18) resolves to an active template', () => {
    const all = ['developer', 'fullstack_dev', 'data_scientist', 'designer', 'graphic_artist', 'photographer', 'filmmaker', 'motion_3d', 'freelancer', 'marketer_seo', 'content_creator', 'architect', 'academic_pro', 'student_grad', 'writer_author', 'fine_artist', 'product_designer', 'personal_brand'];
    const seen = new Set<string>();
    for (const archetype of all) {
      const reqs = {
        organizationName: 'Test Person', category: 'portfolio', portfolioArchetype: archetype, tagline: '', aboutText: 'About', contactEmail: 'a@example.com', contactPhone: '',
        primaryColor: '#000000', accentColor: '#ffffff',
        portfolioData: { schemaVersion: '1.0', archetype, identity: { fullName: 'Test Person' }, skills: [], projects: [], experience: [] }
      } as unknown as ClientRequirements;
      const id = synthesizeWebsite(reqs).selectedTemplate?.templateId;
      assert.ok(getPortfolioTemplateById(id), `${archetype} -> ${id} is an active template`);
      const def = getPortfolioTemplateById(id)!;
      assert.equal(synthesizeWebsite(reqs).selectedTemplate?.websiteCategory, def.category, `${archetype}: category metadata matches the registry`);
      seen.add(id!);
    }
    assert.equal(seen.size, 10, 'all ten templates are reachable as archetype defaults');
  });

  test('an explicitly selected template (including a legacy one) is preserved by the generator', () => {
    for (const templateId of ['photo-fullscreen', 'nova']) {
      const reqs = {
        organizationName: 'Test Person', category: 'portfolio', portfolioArchetype: 'developer',
        tagline: '', aboutText: 'About', contactEmail: 'a@example.com', contactPhone: '',
        primaryColor: '#000000', accentColor: '#ffffff',
        portfolioData: { schemaVersion: '1.0', archetype: 'developer', identity: { fullName: 'Test Person' }, skills: [], projects: [], experience: [] },
        selectedTemplate: { templateId, templateVersion: '1.0.0', templateName: templateId, websiteCategory: 'x', selectedAt: new Date().toISOString() }
      } as unknown as ClientRequirements;
      assert.equal(synthesizeWebsite(reqs).selectedTemplate?.templateId, templateId);
    }
  });
});
