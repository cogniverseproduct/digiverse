import type { ClientRequirements } from '../types/index.js';

/**
 * The Sports template library as the server knows it. It mirrors the client registry
 * (client/src/templates/sports/registry.ts); server/test/unit/sportsTemplateLibrary.test.ts fails if the two
 * ever drift apart.
 */
export const SPORTS_ARCHETYPE_IDS = ['sports_club', 'sports_tournament', 'sports_academy'] as const;
export type SportsArchetypeId = (typeof SPORTS_ARCHETYPE_IDS)[number];

export const SPORTS_TEMPLATE_IDS_BY_ARCHETYPE: Record<SportsArchetypeId, readonly string[]> = {
  sports_club: [
    'premier-elite-club', 'matchday-modern', 'willow-and-wicket', 'floodlight-night',
    'club-journal', 'clean-sheet', 'community-pitch', 'multi-sport-union'
  ],
  sports_tournament: [
    'championship-portal', 'cup-night-football', 'cricket-league-centre', 'bracket-board',
    'global-games', 'tournament-gazette', 'fixtures-results-desk', 'knockout-minimal'
  ],
  sports_academy: [
    'premier-academy', 'pitch-academy', 'coaching-crease', 'rising-stars',
    'learn-and-play', 'performance-lab', 'coaching-institute', 'multi-sport-campus'
  ]
};

export const ALL_SPORTS_TEMPLATE_IDS: readonly string[] = SPORTS_ARCHETYPE_IDS.flatMap((a) => SPORTS_TEMPLATE_IDS_BY_ARCHETYPE[a]);

const ARCHETYPES = new Set<string>(SPORTS_ARCHETYPE_IDS);
const TEMPLATES = new Set<string>(ALL_SPORTS_TEMPLATE_IDS);

export const isKnownSportsArchetype = (id: unknown): boolean => typeof id === 'string' && ARCHETYPES.has(id);
export const isKnownSportsTemplate = (id: unknown): boolean => typeof id === 'string' && TEMPLATES.has(id);

/** The archetype a template id belongs to, or undefined for unknown ids. */
export function sportsArchetypeForTemplate(templateId: unknown): SportsArchetypeId | undefined {
  if (typeof templateId !== 'string') return undefined;
  return SPORTS_ARCHETYPE_IDS.find((a) => SPORTS_TEMPLATE_IDS_BY_ARCHETYPE[a].includes(templateId));
}

/**
 * Returns a message when the sports-specific fields are invalid, or null. Only fields that are present are
 * checked. `selectedTemplate` is shared with the other engines, so it is checked for sports projects only.
 * `existingArchetype` is the archetype already stored on the project (used by updates that omit it).
 */
export function validateSportsFields(
  reqs: Partial<ClientRequirements>,
  category: string | undefined,
  existingArchetype?: string
): string | null {
  if (reqs.sportsArchetype !== undefined && !isKnownSportsArchetype(reqs.sportsArchetype)) {
    return `Unknown sports archetype "${String(reqs.sportsArchetype)}".`;
  }
  if (category !== 'sports' || reqs.selectedTemplate === undefined || reqs.selectedTemplate === null) return null;

  const templateId = reqs.selectedTemplate.templateId;
  if (!isKnownSportsTemplate(templateId)) {
    return `Unknown sports template "${String(templateId)}".`;
  }
  const archetype = reqs.sportsArchetype ?? existingArchetype;
  const owner = sportsArchetypeForTemplate(templateId);
  if (archetype && isKnownSportsArchetype(archetype) && owner !== archetype) {
    return `Template "${String(templateId)}" belongs to ${owner}, not ${archetype}.`;
  }
  return null;
}
