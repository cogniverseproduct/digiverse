import type { ClientRequirements } from '../types/index.js';

/**
 * The portfolio archetypes and template ids this server accepts. They mirror the client's registry
 * (client/src/templates/portfolio/registry.ts); server/test/unit/portfolioArchetypes.test.ts fails if the
 * two ever drift apart.
 */
export const PORTFOLIO_ARCHETYPE_IDS = [
  'developer', 'fullstack_dev', 'data_scientist', 'designer', 'graphic_artist', 'photographer', 'filmmaker', 'motion_3d', 'freelancer',
  'marketer_seo', 'content_creator', 'architect', 'academic_pro', 'student_grad', 'writer_author', 'fine_artist', 'product_designer', 'personal_brand'
] as const;

/** Templates offered for new portfolios. */
export const ACTIVE_PORTFOLIO_TEMPLATE_IDS = [
  'engineer-blueprint', 'editorial-ux', 'photo-fullscreen', 'graphic-bold', 'motion-immersive',
  'freelancer-services', 'graduate-profile', 'data-ai-lab', 'architect-minimal', 'creator-media'
] as const;

/** Ids written by the earlier library. Existing projects keep them, so they stay valid. */
export const LEGACY_PORTFOLIO_TEMPLATE_IDS = ['nova', 'creative_studio', 'vision', 'motionverse', 'academic_pro', 'brandbuilder'] as const;

const ARCHETYPES = new Set<string>(PORTFOLIO_ARCHETYPE_IDS);
const TEMPLATES = new Set<string>([...ACTIVE_PORTFOLIO_TEMPLATE_IDS, ...LEGACY_PORTFOLIO_TEMPLATE_IDS]);

export const isKnownPortfolioArchetype = (id: unknown): boolean => typeof id === 'string' && ARCHETYPES.has(id);
export const isKnownPortfolioTemplate = (id: unknown): boolean => typeof id === 'string' && TEMPLATES.has(id);

/**
 * Returns a message when the portfolio-specific fields are invalid, or null. Only fields that are present are
 * checked. `selectedTemplate` is shared with the other engines, so it is checked for portfolio projects only.
 */
export function validatePortfolioFields(reqs: Partial<ClientRequirements>, category: string | undefined): string | null {
  if (reqs.portfolioArchetype !== undefined && !isKnownPortfolioArchetype(reqs.portfolioArchetype)) {
    return `Unknown portfolio archetype "${String(reqs.portfolioArchetype)}".`;
  }
  const templateId = reqs.selectedTemplate?.templateId;
  if (category === 'portfolio' && reqs.selectedTemplate !== undefined && reqs.selectedTemplate !== null && !isKnownPortfolioTemplate(templateId)) {
    return `Unknown portfolio template "${String(templateId)}".`;
  }
  return null;
}
