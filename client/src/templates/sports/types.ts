import type { SportsWebsiteData } from '../../types/sports';
import type { ClientRequirements, GeneratedWebsite } from '../../types/admin';

/** The three Sports Website Creation categories. Each has its own template library. */
export type SportsCategory = 'sports_club' | 'sports_tournament' | 'sports_academy';

export type SportsClubTemplateId =
  | 'premier-elite-club'
  | 'matchday-modern'
  | 'willow-and-wicket'
  | 'floodlight-night'
  | 'club-journal'
  | 'clean-sheet'
  | 'community-pitch'
  | 'multi-sport-union';

export type SportsTournamentTemplateId =
  | 'championship-portal'
  | 'cup-night-football'
  | 'cricket-league-centre'
  | 'bracket-board'
  | 'global-games'
  | 'tournament-gazette'
  | 'fixtures-results-desk'
  | 'knockout-minimal';

export type SportsAcademyTemplateId =
  | 'premier-academy'
  | 'pitch-academy'
  | 'coaching-crease'
  | 'rising-stars'
  | 'learn-and-play'
  | 'performance-lab'
  | 'coaching-institute'
  | 'multi-sport-campus';

export type SportsTemplateId = SportsClubTemplateId | SportsTournamentTemplateId | SportsAcademyTemplateId;

/** Sports a template is especially suited to (used by the library's sport filter). */
export type SportsFocus = 'football' | 'cricket' | 'basketball' | 'volleyball' | 'multi_sport' | 'any';

export type SportsSectionKey =
  | 'hero' | 'about' | 'history' | 'teams' | 'players' | 'staff' | 'fixtures' | 'results' | 'standings'
  | 'bracket' | 'schedule' | 'venues' | 'rules' | 'news' | 'gallery' | 'videos' | 'sponsors' | 'contact'
  | 'programmes' | 'batches' | 'facilities' | 'admission' | 'achievements' | 'testimonials';

export interface SportsTemplateTokens {
  primaryColor: string;
  accentColor: string;
  secondaryColor?: string;
  background: string;
  textColor: string;
  fontFamily: string;
  headingFont: string;
  layoutPreset: string;
}

export interface SportsSectionConfig {
  id: SportsSectionKey;
  label: string;
  /** The section is hidden when the client supplied none of this data. */
  needs?: string;
}

export interface SportsTemplateDefinition {
  id: SportsTemplateId;
  name: string;
  tagline: string;
  description: string;
  archetype: SportsCategory;
  categoryLabel: string;
  version: string;
  author: string;
  badge: string;
  /** Short design-style label on cards, for example "Dark · Stadium · Bold". */
  designStyle: string;
  /** Style family used by the library's style filter. */
  styleGroup: 'dark' | 'light' | 'editorial' | 'minimal' | 'bold' | 'youth';
  designDirection: string;
  sports: SportsFocus[];
  highlights: string[];
  tokens: SportsTemplateTokens;
  sections: SportsSectionConfig[];
  contentFields: string[];
  assetRequirements: { logo: 'required' | 'recommended' | 'optional'; heroImage: 'required' | 'recommended' | 'optional'; notes: string };
  animation: { style: string; reducedMotion: 'static'; features: string[] };
  /** Screenshot used by the gallery (public path), captured from the real preview route. */
  previewImage: string;
  /** Where the design comes from; mirrors the licence record (LICENSES.md). */
  source: { kind: 'original'; inspiration: string[]; note: string };
  getDemoData: () => {
    requirements: ClientRequirements;
    sportsData: SportsWebsiteData;
    website: GeneratedWebsite;
  };
}

export interface SportsTemplateProps {
  requirements: ClientRequirements;
  sportsData: SportsWebsiteData;
  website: GeneratedWebsite;
  activePage?: string;
  onNavigate?: (page: string) => void;
  /** True only inside the template library / preview route: shows the "Sample content" badge. */
  isDemo?: boolean;
}

export const SPORTS_CATEGORY_LABELS: Record<SportsCategory, string> = {
  sports_club: 'Sports Club',
  sports_tournament: 'Tournament Hub',
  sports_academy: 'Sports Academy'
};
