import type { SportsCategory, SportsTemplateId } from './types';

/**
 * Template ids per category. Deliberately dependency-free so the preview route and the dispatcher can
 * check an id without loading the registry. server/src/services/sportsCatalog.ts mirrors this list and
 * server/test/unit/sportsTemplateLibrary.test.ts fails if the two drift apart.
 */
export const SPORTS_IDS_BY_CATEGORY: Record<SportsCategory, SportsTemplateId[]> = {
  sports_club: ['premier-elite-club', 'matchday-modern', 'willow-and-wicket', 'floodlight-night', 'club-journal', 'clean-sheet', 'community-pitch', 'multi-sport-union'],
  sports_tournament: ['championship-portal', 'cup-night-football', 'cricket-league-centre', 'bracket-board', 'global-games', 'tournament-gazette', 'fixtures-results-desk', 'knockout-minimal'],
  sports_academy: ['premier-academy', 'pitch-academy', 'coaching-crease', 'rising-stars', 'learn-and-play', 'performance-lab', 'coaching-institute', 'multi-sport-campus']
};

export const ALL_SPORTS_IDS: SportsTemplateId[] = [...SPORTS_IDS_BY_CATEGORY.sports_club, ...SPORTS_IDS_BY_CATEGORY.sports_tournament, ...SPORTS_IDS_BY_CATEGORY.sports_academy];
const SET = new Set<string>(ALL_SPORTS_IDS);

export const isSportsTemplateIdLite = (id: unknown): id is SportsTemplateId => typeof id === 'string' && SET.has(id);
export const categoryOfSportsTemplate = (id: unknown): SportsCategory | undefined =>
  (Object.keys(SPORTS_IDS_BY_CATEGORY) as SportsCategory[]).find((c) => (SPORTS_IDS_BY_CATEGORY[c] as string[]).includes(id as string));
