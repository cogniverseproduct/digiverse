import type { ClientRequirements } from '../types/index.js';

/**
 * The Cultural template library as the server knows it. It mirrors the client registry
 * (client/src/templates/cultural/ids.ts and registry.ts); server/test/unit/culturalTemplateLibrary.test.ts fails if
 * the two ever drift apart.
 *
 * Archetypes: `cultural_society` (Cultural Association websites) and `puja_committee`.
 * Project categories: `cultural` and `puja_committee`.
 */
export const CULTURAL_ARCHETYPE_IDS = ['cultural_society', 'puja_committee'] as const;
export type CulturalArchetypeId = (typeof CULTURAL_ARCHETYPE_IDS)[number];

export const CULTURAL_TEMPLATE_IDS_BY_ARCHETYPE: Record<CulturalArchetypeId, readonly string[]> = {
  cultural_society: ['cultural-heritage', 'arts-literature-society', 'dance-music-association', 'community-cultural-association', 'modern-festival-organization'],
  puja_committee: ['traditional-durga-puja', 'premium-modern-durga-puja', 'community-puja-committee', 'heritage-traditional-puja', 'festival-experience-celebration']
};

export const ALL_CULTURAL_TEMPLATE_IDS: readonly string[] = CULTURAL_ARCHETYPE_IDS.flatMap((a) => CULTURAL_TEMPLATE_IDS_BY_ARCHETYPE[a]);

/**
 * The first-generation designs were retired when the library was rebuilt. Projects created with them keep their stored id
 * (no data is rewritten); the id is mapped to the design that replaced it whenever it is read, validated, rendered or generated.
 */
export const LEGACY_CULTURAL_TEMPLATE_IDS: Record<string, string> = {
  heritage_akademi: 'cultural-heritage',
  sanskriti_mancha: 'modern-festival-organization',
  samaj_milan: 'community-cultural-association',
  mahasabha_royal: 'traditional-durga-puja',
  kala_kendra_theme: 'premium-modern-durga-puja',
  prabashi_utsav_hub: 'community-puja-committee'
};

/** Project categories handled by this engine. */
export const CULTURAL_CATEGORIES: readonly string[] = ['cultural', 'puja_committee'];
export const isCulturalCategory = (category: unknown): boolean => typeof category === 'string' && CULTURAL_CATEGORIES.includes(category);

const ARCHETYPES = new Set<string>(CULTURAL_ARCHETYPE_IDS);
const TEMPLATES = new Set<string>(ALL_CULTURAL_TEMPLATE_IDS);

export const isKnownCulturalArchetype = (id: unknown): boolean => typeof id === 'string' && ARCHETYPES.has(id);

/** Maps a retired id to its replacement. A current id is returned as is, and an unknown id is undefined. */
export function resolveCulturalTemplateId(id: unknown): string | undefined {
  if (typeof id !== 'string') return undefined;
  if (TEMPLATES.has(id)) return id;
  return Object.prototype.hasOwnProperty.call(LEGACY_CULTURAL_TEMPLATE_IDS, id) ? LEGACY_CULTURAL_TEMPLATE_IDS[id] : undefined;
}

export const isKnownCulturalTemplate = (id: unknown): boolean => resolveCulturalTemplateId(id) !== undefined;

/** The archetype a template id (current or retired) belongs to, or undefined for unknown ids. */
export function culturalArchetypeForTemplate(templateId: unknown): CulturalArchetypeId | undefined {
  const resolved = resolveCulturalTemplateId(templateId);
  return resolved ? CULTURAL_ARCHETYPE_IDS.find((a) => CULTURAL_TEMPLATE_IDS_BY_ARCHETYPE[a].includes(resolved)) : undefined;
}

/** The archetype implied by a project's category and, when present, its stored `culturalArchetype`. */
export function culturalArchetypeForProject(category: string | undefined, archetype?: string): CulturalArchetypeId {
  if (category === 'puja_committee') return 'puja_committee';
  return archetype === 'puja_committee' ? 'puja_committee' : 'cultural_society';
}

/**
 * Returns a message when the cultural-specific fields are invalid, or null. Only fields that are present are checked.
 * `selectedTemplate` is shared with the other engines, so it is checked for cultural and puja-committee projects only: a Portfolio or
 * Sports template id is never judged here. `existingArchetype` is the archetype already stored on the project (used by updates that omit it).
 */
export function validateCulturalFields(
  reqs: Partial<ClientRequirements>,
  category: string | undefined,
  existingArchetype?: string
): string | null {
  if (reqs.culturalArchetype !== undefined && !isKnownCulturalArchetype(reqs.culturalArchetype)) {
    return `Unknown cultural archetype "${String(reqs.culturalArchetype)}".`;
  }
  if (!isCulturalCategory(category)) return null;
  const archetype = culturalArchetypeForProject(category, reqs.culturalArchetype ?? existingArchetype);
  if (reqs.culturalArchetype !== undefined && category === 'puja_committee' && reqs.culturalArchetype !== 'puja_committee') {
    return 'A puja committee project must use the puja_committee archetype.';
  }
  if (reqs.selectedTemplate === undefined || reqs.selectedTemplate === null) return null;

  const templateId = reqs.selectedTemplate.templateId;
  if (!isKnownCulturalTemplate(templateId)) {
    return `Unknown cultural template "${String(templateId)}".`;
  }
  const owner = culturalArchetypeForTemplate(templateId);
  if (owner !== archetype) {
    return `Template "${String(templateId)}" belongs to ${owner}, not ${archetype}.`;
  }
  return null;
}
