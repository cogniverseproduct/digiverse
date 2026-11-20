/**
 * Social & NGO template ids. Dependency-free so the server catalog, unit tests and the preview route can import it
 * without pulling in React. The server mirrors these lists in `server/src/services/ngoCatalog.ts`; a unit test fails if they drift.
 *
 * Every id is a real third-party website template integrated from an open-licensed source (see NGO_TEMPLATE_SOURCES.md).
 * Ids are kebab-case and must stay disjoint from the Sports, Cultural and Portfolio ids (main.tsx routes by id).
 */
export type NgoArchetypeId = 'grassroots_ngo' | 'institutional_foundation' | 'cause_charity';

export const NGO_ARCHETYPE_IDS: readonly NgoArchetypeId[] = ['grassroots_ngo', 'institutional_foundation', 'cause_charity'];

export const NGO_TEMPLATE_IDS_BY_ARCHETYPE: Record<NgoArchetypeId, readonly string[]> = {
  grassroots_ngo: ['grassroots-folder-tabs', 'grassroots-kilnfield'],
  institutional_foundation: [],
  cause_charity: ['cause-open-rivers'],
};

export const ALL_NGO_TEMPLATE_IDS: readonly string[] = NGO_ARCHETYPE_IDS.flatMap((a) => NGO_TEMPLATE_IDS_BY_ARCHETYPE[a]);

export const isNgoTemplateIdLite = (id: unknown): id is string => typeof id === 'string' && ALL_NGO_TEMPLATE_IDS.includes(id);

export const archetypeOfNgoTemplate = (id: string): NgoArchetypeId | undefined =>
  NGO_ARCHETYPE_IDS.find((a) => NGO_TEMPLATE_IDS_BY_ARCHETYPE[a].includes(id));
