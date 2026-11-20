
/**
 * DigiVerse — Sports Website Domain Model
 *
 * This module defines category-specific data structures for sports
 * clubs, teams, players, competitions, fixtures, results and standings.
 *
 * Important:
 * - No fabricated teams, players, matches or statistics.
 * - Optional data remains optional until supplied by the client.
 * - This module is additive and does not replace existing project types.
 */

// ---------------------------------------------------------
// 1. Sports Domain Types
// ---------------------------------------------------------

export type SportType =
  | 'football'
  | 'cricket'
  | 'basketball'
  | 'volleyball'
  | 'badminton'
  | 'tennis'
  | 'hockey'
  | 'athletics'
  | 'swimming'
  | 'kabaddi'
  | 'multi_sport'
  | 'other';

export type SportsOrganizationType =
  | 'sports_club'
  | 'sports_academy'
  | 'tournament_organizer'
  | 'sports_association';

export type MatchStatus =
  | 'scheduled'
  | 'live'
  | 'half_time'
  | 'completed'
  | 'postponed'
  | 'cancelled'
  | 'abandoned';

export type PlayerStatus =
  | 'active'
  | 'injured'
  | 'suspended'
  | 'inactive';

export type CompetitionType =
  | 'league'
  | 'knockout'
  | 'friendly'
  | 'cup'
  | 'tournament'
  | 'championship'
  | 'other';

export type SportsPageKey =
  | 'home'
  | 'about'
  | 'teams'
  | 'squads'
  | 'players'
  | 'fixtures'
  | 'results'
  | 'standings'
  | 'competitions'
  | 'match-centre'
  | 'coaches'
  | 'news'
  | 'gallery'
  | 'sponsors'
  | 'contact'
  | 'programmes'
  | 'batches'
  | 'admissions'
  | 'brackets';

export type SportsSectionType =
  | 'sports_hero'
  | 'club_identity'
  | 'featured_teams'
  | 'team_directory'
  | 'player_directory'
  | 'featured_players'
  | 'upcoming_fixtures'
  | 'recent_results'
  | 'live_match'
  | 'league_standings'
  | 'competition_list'
  | 'match_timeline'
  | 'club_statistics'
  | 'coaching_staff'
  | 'sports_news'
  | 'sports_gallery'
  | 'sponsor_showcase'
  | 'sports_contact'
  | 'tournament_bracket'
  | 'participating_teams'
  | 'academy_programmes'
  | 'training_schedules'
  | 'membership_enquiry'
  | 'admission_enquiry'
  | 'custom';

// ---------------------------------------------------------
// 2. Club Profile
// ---------------------------------------------------------

export interface SportsClubProfile {
  organizationName: string;
  sportTypes: SportType[];

  organizationType?: SportsOrganizationType;
  tagline?: string;
  description?: string;

  foundedYear?: number;
  homeGround?: string;
  headquarters?: string;

  logoUrl?: string;
  coverImageUrl?: string;

  primaryColor?: string;
  accentColor?: string;

  websiteLanguage?: 'english' | 'bengali' | 'hindi' | 'bilingual';

  /** Optional storytelling fields used by the template library. */
  nickname?: string;
  mission?: string;
  vision?: string;
  values?: string[];
  history?: string;
  historyTimeline?: SportsHistoryItem[];
  achievements?: string[];
}

// ---------------------------------------------------------
// 3. Team and Squad
// ---------------------------------------------------------

export interface SportsTeam {
  id: string;
  name: string;

  sport: SportType;
  teamType?: string;

  description?: string;
  ageGroup?: string;
  genderCategory?: string;

  coachIds?: string[];
  playerIds?: string[];

  logoUrl?: string;
  coverImageUrl?: string;

  isActive: boolean;
}

export interface SportsPlayer {
  id: string;
  teamId: string;

  fullName: string;
  displayName?: string;

  jerseyNumber?: number;
  position?: string;

  dateOfBirth?: string;
  nationality?: string;

  profileImageUrl?: string;
  biography?: string;

  status: PlayerStatus;

  statistics?: SportsPlayerStatistics;
}

export interface SportsPlayerStatistics {
  appearances?: number;
  goals?: number;
  assists?: number;
  cleanSheets?: number;

  runs?: number;
  wickets?: number;

  points?: number;
  matchesPlayed?: number;

  customStatistics?: Record<string, number | string>;
}

// ---------------------------------------------------------
// 4. Coaches and Staff
// ---------------------------------------------------------

export interface SportsStaffMember {
  id: string;
  fullName: string;

  role: string;
  teamIds?: string[];

  biography?: string;
  profileImageUrl?: string;

  qualifications?: string[];
}

// ---------------------------------------------------------
// 5. Competitions and Fixtures
// ---------------------------------------------------------

export interface SportsCompetition {
  id: string;
  name: string;

  sport: SportType;
  competitionType: CompetitionType;

  season?: string;
  description?: string;

  startDate?: string;
  endDate?: string;

  venue?: string;
  participatingTeamIds?: string[];

  logoUrl?: string;
}

export interface SportsFixture {
  id: string;

  competitionId?: string;
  teamId: string;

  opponentName: string;
  opponentTeamId?: string;

  scheduledAt: string;
  venue?: string;

  homeOrAway?: 'home' | 'away' | 'neutral';

  status: MatchStatus;

  matchFormat?: string;
  round?: string;

  homeScore?: number;
  awayScore?: number;

  resultSummary?: string;

  matchReport?: string;
  matchHighlightsUrl?: string;
}

// ---------------------------------------------------------
// 6. Match Centre
// ---------------------------------------------------------

export interface SportsMatchEvent {
  id: string;
  fixtureId: string;

  minute?: number;

  eventType:
    | 'goal'
    | 'yellow_card'
    | 'red_card'
    | 'substitution'
    | 'wicket'
    | 'boundary'
    | 'six'
    | 'period_start'
    | 'period_end'
    | 'other';

  teamId?: string;
  playerId?: string;

  description?: string;
}

export interface SportsMatchCentre {
  fixtureId: string;

  status: MatchStatus;

  homeTeamName: string;
  awayTeamName: string;

  homeScore?: number;
  awayScore?: number;

  currentPeriod?: string;
  matchClock?: string;

  events: SportsMatchEvent[];

  lastUpdatedAt?: string;
}

// ---------------------------------------------------------
// 7. League Standings
// ---------------------------------------------------------

export interface SportsStanding {
  competitionId: string;
  teamId: string;
  /** Display name for a team that is not in `teams` (for example an opposing club in a league table). */
  teamName?: string;

  position: number;

  played: number;
  won: number;
  drawn: number;
  lost: number;

  goalsFor?: number;
  goalsAgainst?: number;

  points: number;

  goalDifference?: number;

  form?: string[];
}

// ---------------------------------------------------------
// 8. Sponsors
// ---------------------------------------------------------

export interface SportsSponsor {
  id: string;

  name: string;
  websiteUrl?: string;

  logoUrl?: string;

  sponsorshipLevel?: string;
  description?: string;

  displayOrder?: number;
}

// ---------------------------------------------------------
// 9. Sports News
// ---------------------------------------------------------

export interface SportsNewsArticle {
  id: string;

  title: string;
  summary?: string;
  content?: string;

  publishedAt?: string;

  coverImageUrl?: string;

  category?: string;
  author?: string;

  isPublished: boolean;
}

// ---------------------------------------------------------
// 10. Sports Website Navigation
// ---------------------------------------------------------

export interface SportsPageDefinition {
  id: SportsPageKey;

  slug: string;
  title: string;
  navLabel: string;

  enabled: boolean;

  sections: SportsSectionType[];

  showInNavigation: boolean;
}

export interface SportsSectionDefinition {
  id: string;

  type: SportsSectionType;

  title?: string;
  subtitle?: string;

  enabled: boolean;
  order: number;

  layoutStyle?: string;

  /**
   * References domain data by identifiers.
   * It must not contain private credentials or Drive tokens.
   */
  dataReferences?: string[];

  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------

// ---------------------------------------------------------
// 10B. Tournament Stages & Knockout Brackets
// ---------------------------------------------------------

export interface SportsTournamentMatch {
  id: string;
  roundName: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number;
  awayScore?: number;
  scheduledAt?: string;
  venue?: string;
  status: MatchStatus;
  winner?: 'home' | 'away' | 'draw';
}

export interface SportsTournamentStage {
  id: string;
  competitionId?: string;
  name: string;
  stageOrder: number;
  order?: number;
  stageType: 'group_stage' | 'knockout' | 'quarter_final' | 'semi_final' | 'final';
  status: 'upcoming' | 'in_progress' | 'completed';
  matches: SportsTournamentMatch[];
}

// ---------------------------------------------------------
// 10C. Academy Programmes & Training Batches
// ---------------------------------------------------------

export interface SportsAcademyProgramme {
  id: string;
  title: string;
  sport: SportType;
  ageGroup: string;
  duration: string;
  description: string;
  feeStructure?: string;
  coachIds?: string[];
  curriculumHighlights?: string[];
  isActive: boolean;
}

export interface SportsTrainingBatch {
  id: string;
  programmeId?: string;
  name: string;
  ageGroup: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  venue: string;
  maxCapacity?: number;
  currentEnrollment?: number;
  coachName?: string;
}

// ---------------------------------------------------------
// 10D. SEO & Branding Extensions
// ---------------------------------------------------------

export interface SportsSEOInfo {
  pageTitle?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImageUrl?: string;
}

export interface SportsBrandingMedia {
  primaryLogoUrl?: string;
  alternativeLogoUrl?: string;
  faviconUrl?: string;
  bannerImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  typographyPreference?: string;
  guidelinesUrl?: string;
}


// ---------------------------------------------------------
// 10E. Template-library extensions (all optional, additive)
// ---------------------------------------------------------

export interface SportsGalleryItem {
  id: string;
  url: string;
  caption?: string;
  category?: string;
}

export interface SportsVenue {
  id: string;
  name: string;
  address?: string;
  capacity?: number;
  notes?: string;
  imageUrl?: string;
}

export type TournamentFormat = 'knockout' | 'league' | 'group_knockout' | 'round_robin' | 'other';

/** Tournament-level information (Tournament Hub). Nothing here is invented: it is what the organiser supplied. */
export interface SportsTournamentInfo {
  edition?: string;
  format?: TournamentFormat;
  formatDescription?: string;
  matchFormat?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  registrationDeadline?: string;
  registrationInfo?: string;
  prizeInfo?: string;
  ticketInfo?: string;
  rules?: string[];
  venues?: SportsVenue[];
}

export interface SportsAcademyFacility {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface SportsAcademyAdmission {
  process?: string;
  eligibility?: string;
  feeSummary?: string;
  documentsRequired?: string[];
  trialInfo?: string;
  intakeDates?: string;
}

export interface SportsAchievement {
  id: string;
  title: string;
  year?: string;
  description?: string;
}

/** Only genuine, client-supplied testimonials are ever stored or shown. */
export interface SportsTestimonial {
  id: string;
  quote: string;
  author: string;
  role?: string;
}

export interface SportsAcademyInfo {
  philosophy?: string;
  facilities?: SportsAcademyFacility[];
  ageGroups?: string[];
  admission?: SportsAcademyAdmission;
  achievements?: SportsAchievement[];
  testimonials?: SportsTestimonial[];
}

export interface SportsHistoryItem {
  year: string;
  title: string;
  description?: string;
}

// ---------------------------------------------------------
// 11. Complete Sports Website Data
// ---------------------------------------------------------

export interface SportsWebsiteData {
  schemaVersion: '1.0';

  club: SportsClubProfile;

  teams: SportsTeam[];
  players: SportsPlayer[];

  staff: SportsStaffMember[];

  competitions: SportsCompetition[];
  fixtures: SportsFixture[];

  standings: SportsStanding[];

  matchEvents: SportsMatchEvent[];

  sponsors: SportsSponsor[];
  news: SportsNewsArticle[];

  pages: SportsPageDefinition[];
  sections: SportsSectionDefinition[];

  tournamentStages?: SportsTournamentStage[];
  academyProgrammes?: SportsAcademyProgramme[];
  trainingBatches?: SportsTrainingBatch[];
  seoInfo?: SportsSEOInfo;
  brandingMedia?: SportsBrandingMedia;

  /** Template-library data (all optional; templates hide sections that have no data). */
  tournamentInfo?: SportsTournamentInfo;
  academyInfo?: SportsAcademyInfo;
  gallery?: SportsGalleryItem[];

  /**
   * Indicates which sports datasets have actually been
   * provided by the client or imported from an approved source.
   */
  dataAvailability: {
    teams: boolean;
    players: boolean;
    staff: boolean;
    competitions: boolean;
    fixtures: boolean;
    standings: boolean;
    sponsors: boolean;
    news: boolean;
    tournamentStages?: boolean;
    academyProgrammes?: boolean;
    trainingBatches?: boolean;
    gallery?: boolean;
    tournamentInfo?: boolean;
    academyInfo?: boolean;
  };
}
