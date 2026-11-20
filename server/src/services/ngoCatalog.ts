import type { ClientRequirements } from '../types/index.js';

/**
 * The Social & NGO template library as the server knows it. It mirrors the client registry
 * (client/src/templates/ngo/ids.ts and registry.ts); server/test/unit/ngoTemplateLibrary.test.ts fails if the two ever drift apart.
 *
 * Archetypes: `grassroots_ngo`, `institutional_foundation`, `cause_charity`. Project categories: `ngo_social` and `ngo`.
 * Every template is a real, open-licensed third-party design (see client/src/templates/ngo/NGO_TEMPLATE_SOURCES.md).
 */
export const NGO_ARCHETYPE_IDS = ['grassroots_ngo', 'institutional_foundation', 'cause_charity'] as const;
export type NgoArchetypeId = (typeof NGO_ARCHETYPE_IDS)[number];

export const NGO_TEMPLATE_IDS_BY_ARCHETYPE: Record<NgoArchetypeId, readonly string[]> = {
  grassroots_ngo: ['grassroots-folder-tabs', 'grassroots-kilnfield'],
  institutional_foundation: [],
  cause_charity: ['cause-open-rivers']
};

export const ALL_NGO_TEMPLATE_IDS: readonly string[] = NGO_ARCHETYPE_IDS.flatMap((a) => NGO_TEMPLATE_IDS_BY_ARCHETYPE[a]);

/**
 * Ids of the original NGO design cards. Projects created with them keep their stored id and keep rendering through the legacy
 * renderer (no data is rewritten); they are accepted on update but can no longer be chosen for a new project.
 */
export const LEGACY_NGO_TEMPLATE_IDS: Record<string, NgoArchetypeId | undefined> = {
  ngo_impact: undefined,
  ngo_campaign: undefined,
  ngo_community: undefined,
  ngo_grassroots: 'grassroots_ngo',
  ngo_foundation: 'institutional_foundation',
  ngo_charity: 'cause_charity'
};

/** Project categories handled by this engine. */
export const NGO_CATEGORIES: readonly string[] = ['ngo_social', 'ngo'];
export const isNgoCategory = (category: unknown): boolean => typeof category === 'string' && NGO_CATEGORIES.includes(category);

/** True when a project's requirements belong to the Social & NGO engine. */
export const isNgoReqs = (r?: { category?: string; organizationType?: string }): boolean =>
  isNgoCategory(r?.category) || isNgoCategory(r?.organizationType);

const ARCHETYPES = new Set<string>(NGO_ARCHETYPE_IDS);
const TEMPLATES = new Set<string>(ALL_NGO_TEMPLATE_IDS);

export const isKnownNgoArchetype = (id: unknown): boolean => typeof id === 'string' && ARCHETYPES.has(id);
export const isNgoLibraryTemplate = (id: unknown): boolean => typeof id === 'string' && TEMPLATES.has(id);
export const isLegacyNgoTemplate = (id: unknown): boolean => typeof id === 'string' && Object.prototype.hasOwnProperty.call(LEGACY_NGO_TEMPLATE_IDS, id);

/** The archetype a library template belongs to, or undefined for unknown ids. */
export function ngoArchetypeForTemplate(templateId: unknown): NgoArchetypeId | undefined {
  return typeof templateId === 'string' ? NGO_ARCHETYPE_IDS.find((a) => NGO_TEMPLATE_IDS_BY_ARCHETYPE[a].includes(templateId)) : undefined;
}

/** True when a project renders through a library template (as opposed to the legacy inline renderer). */
export const usesNgoLibraryTemplate = (r?: Partial<ClientRequirements>): boolean => isNgoLibraryTemplate(r?.selectedTemplate?.templateId);

/**
 * Returns a message when the NGO-specific fields are invalid, or null. Only fields that are present are checked.
 * `selectedTemplate` is shared with the other engines, so it is judged for NGO projects only: a Portfolio, Sports or Cultural
 * template id is never judged here. `existingArchetype` is the archetype already stored on the project.
 */
export function validateNgoFields(
  reqs: Partial<ClientRequirements>,
  category: string | undefined,
  existingArchetype?: string
): string | null {
  if (reqs.ngoArchetype !== undefined && !isKnownNgoArchetype(reqs.ngoArchetype)) {
    return `Unknown NGO archetype "${String(reqs.ngoArchetype)}".`;
  }
  if (!isNgoCategory(category)) return null;
  if (reqs.selectedTemplate === undefined || reqs.selectedTemplate === null) return null;

  const templateId = reqs.selectedTemplate.templateId;
  if (isLegacyNgoTemplate(templateId)) return null;
  if (!isNgoLibraryTemplate(templateId)) return `Unknown Social & NGO template "${String(templateId)}".`;

  const owner = ngoArchetypeForTemplate(templateId);
  const archetype = (reqs.ngoArchetype ?? existingArchetype) as string | undefined;
  if (archetype && owner !== archetype) return `Template "${String(templateId)}" belongs to ${owner}, not ${archetype}.`;
  return null;
}
