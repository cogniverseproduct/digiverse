import type { CulturalCategory, CulturalTemplateId } from './types';

/**
 * Template ids per category. Deliberately dependency-free so the preview route and the dispatcher can
 * check an id without loading the registry. server/src/services/culturalCatalog.ts mirrors these lists and
 * server/test/unit/culturalTemplateLibrary.test.ts fails if the two drift apart.
 */
export const CULTURAL_IDS_BY_CATEGORY: Record<CulturalCategory, CulturalTemplateId[]> = {
  cultural_society: ['cultural-heritage', 'arts-literature-society', 'dance-music-association', 'community-cultural-association', 'modern-festival-organization'],
  puja_committee: ['traditional-durga-puja', 'premium-modern-durga-puja', 'community-puja-committee', 'heritage-traditional-puja', 'festival-experience-celebration']
};

export const ALL_CULTURAL_IDS: CulturalTemplateId[] = [...CULTURAL_IDS_BY_CATEGORY.cultural_society, ...CULTURAL_IDS_BY_CATEGORY.puja_committee];
const SET = new Set<string>(ALL_CULTURAL_IDS);

/**
 * The first generation of Cultural designs (colour-and-copy variants of one layout) was retired. Projects that stored one of
 * those ids keep working: the id is mapped to the closest new design at render time. Stored data is never rewritten.
 */
export const LEGACY_CULTURAL_TEMPLATE_IDS: Record<string, CulturalTemplateId> = {
  heritage_akademi: 'cultural-heritage',
  sanskriti_mancha: 'modern-festival-organization',
  samaj_milan: 'community-cultural-association',
  mahasabha_royal: 'traditional-durga-puja',
  kala_kendra_theme: 'premium-modern-durga-puja',
  prabashi_utsav_hub: 'community-puja-committee'
};

export const isCulturalTemplateIdLite = (id: unknown): id is CulturalTemplateId => typeof id === 'string' && SET.has(id);

/** A current id, or the new design a retired id maps to. Anything else is undefined. */
export const resolveCulturalTemplateId = (id: unknown): CulturalTemplateId | undefined =>
  isCulturalTemplateIdLite(id) ? id : typeof id === 'string' && Object.prototype.hasOwnProperty.call(LEGACY_CULTURAL_TEMPLATE_IDS, id) ? LEGACY_CULTURAL_TEMPLATE_IDS[id] : undefined;

/** True for a current id or a retired one that still renders. */
export const isCulturalTemplateKnown = (id: unknown): boolean => resolveCulturalTemplateId(id) !== undefined;

export const categoryOfCulturalTemplate = (id: unknown): CulturalCategory | undefined => {
  const r = resolveCulturalTemplateId(id);
  return r ? (Object.keys(CULTURAL_IDS_BY_CATEGORY) as CulturalCategory[]).find((c) => CULTURAL_IDS_BY_CATEGORY[c].includes(r)) : undefined;
};

/** The design shown for a project that never chose one (created before the library existed). */
export const DEFAULT_CULTURAL_TEMPLATE_ID: Record<CulturalCategory, CulturalTemplateId> = { cultural_society: 'community-cultural-association', puja_committee: 'traditional-durga-puja' };
