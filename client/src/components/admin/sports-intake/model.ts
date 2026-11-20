import type { ClientRequirements, SelectedTemplateMetadata } from '../../../types/admin';
import type {
  SportType, SportsWebsiteData, SportsTeam, SportsPlayer, SportsStaffMember, SportsCompetition, SportsFixture, SportsStanding, SportsSponsor,
  SportsNewsArticle, SportsTournamentStage, SportsAcademyProgramme, SportsTrainingBatch, MatchStatus, CompetitionType, TournamentFormat
} from '../../../types/sports';
import type { SportsCategory } from '../../../templates/sports/types';

/* ------------------------------------------------------------------ form shape */

/** One card in a repeatable list. Every value is kept as text (or text lists) so drafts round-trip and validation is uniform. */
export interface Entry { id: string; [key: string]: string | string[] | Entry[] }

export type ListKey =
  | 'staff' | 'teams' | 'players' | 'competitions' | 'fixtures' | 'standings' | 'sponsors' | 'news' | 'gallery'
  | 'venues' | 'stages' | 'programmes' | 'batches' | 'facilities' | 'achievements' | 'testimonials';

export interface IntakeForm {
  v: Record<string, string>;
  lists: Record<ListKey, Entry[]>;
  template: SelectedTemplateMetadata;
}

export type FieldErrors = Record<string, string>;

export const SPORT_OPTIONS: { value: SportType; label: string }[] = [
  { value: 'football', label: 'Football' }, { value: 'cricket', label: 'Cricket' }, { value: 'basketball', label: 'Basketball' },
  { value: 'volleyball', label: 'Volleyball' }, { value: 'badminton', label: 'Badminton' }, { value: 'tennis', label: 'Tennis' },
  { value: 'hockey', label: 'Hockey' }, { value: 'athletics', label: 'Athletics' }, { value: 'swimming', label: 'Swimming' },
  { value: 'kabaddi', label: 'Kabaddi' }, { value: 'multi_sport', label: 'Multi-sport' }, { value: 'other', label: 'Other' }
];

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

let uid = 0;
export const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(uid++).toString(36)}`;

const LIST_KEYS: ListKey[] = ['staff', 'teams', 'players', 'competitions', 'fixtures', 'standings', 'sponsors', 'news', 'gallery', 'venues', 'stages', 'programmes', 'batches', 'facilities', 'achievements', 'testimonials'];

/** Every field starts empty. Only the chosen template is pre-set; nothing is invented for the client. */
export function emptyForm(template: SelectedTemplateMetadata): IntakeForm {
  const lists = {} as Record<ListKey, Entry[]>;
  LIST_KEYS.forEach((k) => { lists[k] = []; });
  return {
    v: { primaryColor: template.designTokens?.primaryColor || '', accentColor: template.designTokens?.accentColor || '' },
    lists,
    template
  };
}

/* ------------------------------------------------------------------ field and step specs */

export type FieldKind = 'text' | 'textarea' | 'lines' | 'select' | 'number' | 'datetime' | 'date' | 'email' | 'tel' | 'url' | 'image' | 'days' | 'color';
export type OptionSource = { value: string; label: string }[] | 'teams' | 'teamsOrMain' | 'teamsOrOther' | 'competitions' | 'programmes' | 'standingTeams';

export interface FieldSpec {
  key: string;
  label: string;
  kind?: FieldKind;
  options?: OptionSource;
  emptyLabel?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  wide?: boolean;
  /** Entry-level condition (lists only). */
  showIf?: (entry: Entry) => boolean;
}

export type SectionSpec =
  | { kind: 'fields'; title?: string; hint?: string; fields: FieldSpec[] }
  | { kind: 'list'; list: ListKey; title: string; hint?: string; addLabel: string; itemLabel: (e: Entry, i: number) => string; fields: FieldSpec[]; blank: () => Entry; needs?: string[] }
  | { kind: 'template' }
  | { kind: 'stages' }
  /** Google Drive gallery/video links and YouTube links (the shared GalleryAndVideoSection). Values live in `v` as newline lists. */
  | { kind: 'media' }
  | { kind: 'review' };

export interface StepSpec { id: string; title: string; subtitle?: string; sections: SectionSpec[] }

const text = (e: Entry, k: string) => (typeof e[k] === 'string' ? (e[k] as string) : '');
const label = (e: Entry, k: string, fallback: string, i: number) => text(e, k).trim() || `${fallback} ${i + 1}`;

const MATCH_STATUS: { value: MatchStatus; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' }, { value: 'live', label: 'Live now' }, { value: 'completed', label: 'Completed' },
  { value: 'postponed', label: 'Postponed' }, { value: 'cancelled', label: 'Cancelled' }
];
const COMPETITION_TYPES: { value: CompetitionType; label: string }[] = [
  { value: 'league', label: 'League' }, { value: 'cup', label: 'Cup' }, { value: 'knockout', label: 'Knockout' }, { value: 'tournament', label: 'Tournament' },
  { value: 'championship', label: 'Championship' }, { value: 'friendly', label: 'Friendly' }, { value: 'other', label: 'Other' }
];
const FORMATS: { value: TournamentFormat; label: string }[] = [
  { value: 'knockout', label: 'Knockout' }, { value: 'league', label: 'League' }, { value: 'group_knockout', label: 'Group stage and knockout' }, { value: 'round_robin', label: 'Round robin' }, { value: 'other', label: 'Other format' }
];
const STAGE_TYPES = [
  { value: 'group_stage', label: 'Group stage' }, { value: 'knockout', label: 'Knockout round' }, { value: 'quarter_final', label: 'Quarter-finals' }, { value: 'semi_final', label: 'Semi-finals' }, { value: 'final', label: 'Final' }
];
const STAGE_STATUS = [{ value: 'upcoming', label: 'Upcoming' }, { value: 'in_progress', label: 'In progress' }, { value: 'completed', label: 'Completed' }];

const sportField = (label_ = 'Main sport'): FieldSpec => ({ key: 'sport', label: label_, kind: 'select', options: SPORT_OPTIONS, required: true, emptyLabel: 'Choose a sport' });
const showScores = (e: Entry) => ['completed', 'live'].includes(text(e, 'status'));

/* ---- list blueprints (shared) */
const staffList = (title: string, itemWord: string, add: string): SectionSpec => ({
  kind: 'list', list: 'staff', title, hint: 'Only people who actually coach or run the organisation. Leave empty if you have nothing to show yet.', addLabel: add,
  itemLabel: (e, i) => label(e, 'fullName', itemWord, i), needs: ['fullName', 'role'], blank: () => ({ id: newId('staff'), fullName: '', role: '', biography: '', photo: '', qualifications: '' }),
  fields: [
    { key: 'fullName', label: 'Full name', required: true }, { key: 'role', label: 'Role', required: true, placeholder: 'Head coach' },
    { key: 'biography', label: 'Short biography', kind: 'textarea', wide: true }, { key: 'qualifications', label: 'Qualifications', hint: 'Separate with commas', wide: true },
    { key: 'photo', label: 'Photo', kind: 'image', wide: true }
  ]
});

const galleryList: SectionSpec = {
  kind: 'list', list: 'gallery', title: 'Photos', hint: 'Real photographs of the organisation. They appear in the gallery section.', addLabel: 'Add a photo', itemLabel: (e, i) => label(e, 'caption', 'Photo', i),
  needs: ['url'], blank: () => ({ id: newId('ph'), url: '', caption: '' }), fields: [{ key: 'url', label: 'Photo', kind: 'image', required: true, wide: true }, { key: 'caption', label: 'Caption', wide: true }]
};
const videoFields: SectionSpec = { kind: 'media' };

/** Form keys the media section reads and writes (newline-separated lists, except the single Drive folder link). */
export const MEDIA_KEYS = { driveGallery: 'driveGalleryUrl', driveVideos: 'driveVideoUrls', youtube: 'youtubeUrls', playlists: 'youtubePlaylistUrls' } as const;

const sponsorsList: SectionSpec = {
  kind: 'list', list: 'sponsors', title: 'Sponsors & partners', hint: 'Only real partners. Leave empty to hide the sponsors section.', addLabel: 'Add a sponsor', itemLabel: (e, i) => label(e, 'name', 'Sponsor', i),
  needs: ['name'], blank: () => ({ id: newId('sp'), name: '', level: '', websiteUrl: '', logo: '', description: '' }),
  fields: [{ key: 'name', label: 'Name', required: true }, { key: 'level', label: 'Level', placeholder: 'Main partner' }, { key: 'websiteUrl', label: 'Website', kind: 'url' }, { key: 'logo', label: 'Logo', kind: 'image' }, { key: 'description', label: 'Description', kind: 'textarea', wide: true }]
};
const newsList: SectionSpec = {
  kind: 'list', list: 'news', title: 'News & announcements', hint: 'Real updates only. Leave empty to hide the news section.', addLabel: 'Add a news item', itemLabel: (e, i) => label(e, 'title', 'Article', i),
  needs: ['title'], blank: () => ({ id: newId('news'), title: '', summary: '', date: '', image: '' }),
  fields: [{ key: 'title', label: 'Headline', required: true, wide: true }, { key: 'summary', label: 'Summary', kind: 'textarea', wide: true }, { key: 'date', label: 'Date', kind: 'date' }, { key: 'image', label: 'Image', kind: 'image' }]
};

const identityFields = (nameLabel: string, taglineHint: string, yearLabel: string): SectionSpec => ({
  kind: 'fields', fields: [
    { key: 'name', label: nameLabel, required: true, wide: true }, sportField(),
    { key: 'founded', label: yearLabel, kind: 'number', placeholder: 'e.g. 1995' },
    { key: 'tagline', label: 'Tagline', hint: taglineHint, wide: true },
    { key: 'city', label: 'City / town' }, { key: 'state', label: 'State / region' }, { key: 'country', label: 'Country' }
  ]
});
const brandingStep: StepSpec = {
  id: 'branding', title: 'Branding & design', subtitle: 'Your template, logo and colours. The colours start from the template and can be changed.',
  sections: [
    { kind: 'template' },
    { kind: 'fields', title: 'Logo and colours', fields: [
      { key: 'logo', label: 'Logo', kind: 'image', hint: 'Square or transparent works best.' }, { key: 'cover', label: 'Hero / cover image', kind: 'image', hint: 'Wide photo of your ground, squad or event.' },
      { key: 'primaryColor', label: 'Primary colour', kind: 'color' }, { key: 'accentColor', label: 'Accent colour', kind: 'color' }
    ] }
  ]
};
const contactStep: StepSpec = {
  id: 'contact', title: 'Contact & social', subtitle: 'How visitors reach the organisation. Only the contact email is required.',
  sections: [{ kind: 'fields', fields: [
    { key: 'contactPerson', label: 'Contact person' }, { key: 'email', label: 'Contact email', kind: 'email', required: true }, { key: 'phone', label: 'Phone', kind: 'tel' },
    { key: 'whatsapp', label: 'WhatsApp number', kind: 'tel' }, { key: 'address', label: 'Address / ground', wide: true },
    { key: 'facebook', label: 'Facebook page', kind: 'url' }, { key: 'instagram', label: 'Instagram', kind: 'url' }, { key: 'twitter', label: 'X (Twitter)', kind: 'url' }, { key: 'youtube', label: 'YouTube channel', kind: 'url' }
  ] }]
};
const reviewStep: StepSpec = { id: 'review', title: 'Review & generate', subtitle: 'Check what will appear on the website, then create it.', sections: [{ kind: 'review' }] };

const teamsList = (title: string, hint: string, tournament: boolean): SectionSpec => ({
  kind: 'list', list: 'teams', title, hint, addLabel: tournament ? 'Add a team' : 'Add a team', itemLabel: (e, i) => label(e, 'name', 'Team', i), needs: ['name'],
  blank: () => ({ id: newId('team'), name: '', sport: '', ageGroup: '', gender: '', description: '', logo: '' }),
  fields: tournament
    ? [{ key: 'name', label: 'Team name', required: true }, { key: 'logo', label: 'Logo', kind: 'image' }, { key: 'description', label: 'Short description', kind: 'textarea', wide: true, placeholder: 'City, club or group' }]
    : [{ key: 'name', label: 'Team name', required: true }, { key: 'ageGroup', label: 'Age group', placeholder: 'Senior, U-17…' }, { key: 'gender', label: 'Category', kind: 'select', options: [{ value: 'Men', label: 'Men' }, { value: 'Women', label: 'Women' }, { value: 'Boys', label: 'Boys' }, { value: 'Girls', label: 'Girls' }, { value: 'Mixed', label: 'Mixed' }] }, { key: 'logo', label: 'Logo', kind: 'image' }, { key: 'description', label: 'Short description', kind: 'textarea', wide: true }]
});
const competitionsList = (title: string, hint: string): SectionSpec => ({
  kind: 'list', list: 'competitions', title, hint, addLabel: 'Add a competition', itemLabel: (e, i) => label(e, 'name', 'Competition', i), needs: ['name'],
  blank: () => ({ id: newId('comp'), name: '', competitionType: 'league', season: '', startDate: '', endDate: '', venue: '', description: '' }),
  fields: [{ key: 'name', label: 'Name', required: true }, { key: 'competitionType', label: 'Type', kind: 'select', options: COMPETITION_TYPES }, { key: 'season', label: 'Season', placeholder: '2026-27' }, { key: 'venue', label: 'Venue' }, { key: 'startDate', label: 'Starts', kind: 'date' }, { key: 'endDate', label: 'Ends', kind: 'date' }]
});
const standingsList = (hint: string): SectionSpec => ({
  kind: 'list', list: 'standings', title: 'League table', hint, addLabel: 'Add a table row', itemLabel: (e, i) => label(e, 'teamName', 'Row', i) || `Row ${i + 1}`,
  needs: ['teamId'], blank: () => ({ id: newId('st'), competitionId: '', teamId: '', teamName: '', position: '', played: '', won: '', drawn: '', lost: '', goalsFor: '', goalsAgainst: '', points: '' }),
  fields: [
    { key: 'competitionId', label: 'Table', kind: 'select', options: 'competitions', emptyLabel: 'General table' },
    { key: 'teamId', label: 'Team', kind: 'select', options: 'standingTeams', required: true, emptyLabel: 'Choose a team' },
    { key: 'teamName', label: 'Team name', required: true, showIf: (e) => text(e, 'teamId') === '__other', hint: 'For a team that is not in your team list.' },
    { key: 'position', label: 'Position', kind: 'number', required: true }, { key: 'played', label: 'Played', kind: 'number' }, { key: 'won', label: 'Won', kind: 'number' },
    { key: 'drawn', label: 'Drawn', kind: 'number' }, { key: 'lost', label: 'Lost', kind: 'number' }, { key: 'goalsFor', label: 'For', kind: 'number' }, { key: 'goalsAgainst', label: 'Against', kind: 'number' }, { key: 'points', label: 'Points', kind: 'number', required: true }
  ]
});

/* ---- per category */

const CLUB_STEPS: StepSpec[] = [
  { id: 'identity', title: 'Identity', subtitle: 'Who the club is.', sections: [identityFields('Club name', 'A short line under the name. Optional.', 'Year founded')] },
  brandingStep,
  { id: 'about', title: 'About & history', subtitle: 'The club’s story in the club’s own words. Every field is optional.', sections: [{ kind: 'fields', fields: [
    { key: 'description', label: 'About the club', kind: 'textarea', wide: true }, { key: 'history', label: 'History', kind: 'textarea', wide: true },
    { key: 'mission', label: 'Mission', kind: 'textarea' }, { key: 'vision', label: 'Vision', kind: 'textarea' },
    { key: 'values', label: 'Values', kind: 'lines', hint: 'One per line', wide: true }, { key: 'clubAchievements', label: 'Honours & achievements', kind: 'lines', hint: 'One per line, for example “District league champions 2024”', wide: true }
  ] }] },
  { id: 'staff', title: 'Staff & coaches', sections: [staffList('Coaches and staff', 'Staff member', 'Add a staff member')] },
  { id: 'squad', title: 'Teams & players', sections: [
    teamsList('Teams', 'Squads such as First team, U-17 or Women’s. Add these before players and fixtures.', false),
    { kind: 'list', list: 'players', title: 'Players', hint: 'Only real players, added with their permission.', addLabel: 'Add a player', itemLabel: (e, i) => label(e, 'fullName', 'Player', i), needs: ['fullName'],
      blank: () => ({ id: newId('pl'), teamId: '', fullName: '', jerseyNumber: '', position: '', photo: '' }),
      fields: [{ key: 'fullName', label: 'Full name', required: true }, { key: 'teamId', label: 'Team', kind: 'select', options: 'teams', required: true, emptyLabel: 'Choose a team' }, { key: 'jerseyNumber', label: 'Shirt number', kind: 'number' }, { key: 'position', label: 'Position' }, { key: 'photo', label: 'Photo', kind: 'image', wide: true }] }
  ] },
  { id: 'fixtures', title: 'Fixtures & results', subtitle: 'Enter real matches only. A completed match needs both scores.', sections: [
    competitionsList('Competitions', 'Leagues or cups your teams play in. Optional.'),
    { kind: 'list', list: 'fixtures', title: 'Fixtures and results', addLabel: 'Add a match', itemLabel: (e, i) => `${text(e, 'opponentName').trim() ? `vs ${text(e, 'opponentName')}` : `Match ${i + 1}`}`, needs: ['opponentName', 'scheduledAt'],
      blank: () => ({ id: newId('fx'), teamId: '', opponent: '', opponentName: '', scheduledAt: '', venue: '', homeOrAway: 'home', status: 'scheduled', homeScore: '', awayScore: '', round: '', competitionId: '', resultSummary: '' }),
      fields: [
        { key: 'opponentName', label: 'Opponent', required: true }, { key: 'scheduledAt', label: 'Date and time', kind: 'datetime', required: true },
        { key: 'teamId', label: 'Our team', kind: 'select', options: 'teamsOrMain', emptyLabel: 'Main side' }, { key: 'competitionId', label: 'Competition', kind: 'select', options: 'competitions', emptyLabel: 'Friendly / none' },
        { key: 'homeOrAway', label: 'Home or away', kind: 'select', options: [{ value: 'home', label: 'Home' }, { value: 'away', label: 'Away' }, { value: 'neutral', label: 'Neutral venue' }] },
        { key: 'status', label: 'Status', kind: 'select', options: MATCH_STATUS }, { key: 'venue', label: 'Venue' }, { key: 'round', label: 'Round / matchday' },
        { key: 'homeScore', label: 'Home side’s score', kind: 'number', showIf: showScores, hint: 'The score of the team listed at home.' }, { key: 'awayScore', label: 'Away side’s score', kind: 'number', showIf: showScores },
        { key: 'resultSummary', label: 'Result summary', kind: 'textarea', wide: true, showIf: (e) => text(e, 'status') === 'completed' }
      ] }
  ] },
  { id: 'standings', title: 'Standings', sections: [standingsList('Only if you have a real table to show. Leave empty to hide it.')] },
  { id: 'news', title: 'News', sections: [newsList] },
  { id: 'gallery', title: 'Gallery & video', sections: [galleryList, videoFields] },
  { id: 'sponsors', title: 'Sponsors', sections: [sponsorsList] },
  contactStep, reviewStep
];

const TOURNAMENT_STEPS: StepSpec[] = [
  { id: 'identity', title: 'Identity', subtitle: 'The tournament’s name and sport.', sections: [identityFields('Tournament name', 'A line such as “Four days. Sixteen teams.” Optional.', 'First held (year)')] },
  brandingStep,
  { id: 'details', title: 'Tournament details', subtitle: 'Dates, format and registration. Leave out anything that is not decided yet.', sections: [{ kind: 'fields', fields: [
    { key: 'description', label: 'About the tournament', kind: 'textarea', wide: true }, { key: 'edition', label: 'Edition', placeholder: '2026 Edition' },
    { key: 'format', label: 'Format', kind: 'select', options: FORMATS, emptyLabel: 'Choose a format' }, { key: 'formatDescription', label: 'How it works', kind: 'textarea', wide: true },
    { key: 'matchFormat', label: 'Match format', placeholder: 'T20, 2 × 25 min, best of 3…' }, { key: 'tLocation', label: 'Host city / location' },
    { key: 'startDate', label: 'Starts', kind: 'date' }, { key: 'endDate', label: 'Ends', kind: 'date' },
    { key: 'registrationDeadline', label: 'Registration deadline', kind: 'date' }, { key: 'registrationInfo', label: 'How to register', kind: 'textarea', wide: true },
    { key: 'prizeInfo', label: 'Prizes', kind: 'textarea' }, { key: 'ticketInfo', label: 'Tickets / entry', kind: 'textarea' }
  ] }] },
  { id: 'venues', title: 'Venues & rules', sections: [
    { kind: 'list', list: 'venues', title: 'Venues', addLabel: 'Add a venue', itemLabel: (e, i) => label(e, 'name', 'Venue', i), needs: ['name'], blank: () => ({ id: newId('ven'), name: '', address: '', capacity: '', notes: '', imageUrl: '' }),
      fields: [{ key: 'name', label: 'Venue name', required: true }, { key: 'address', label: 'Address' }, { key: 'capacity', label: 'Capacity', kind: 'number' }, { key: 'imageUrl', label: 'Photo', kind: 'image' }, { key: 'notes', label: 'Notes', kind: 'textarea', wide: true }] },
    { kind: 'fields', title: 'Rules & regulations', hint: 'One rule per line.', fields: [{ key: 'rules', label: 'Rules', kind: 'lines', wide: true }] }
  ] },
  { id: 'teams', title: 'Participating teams', sections: [teamsList('Teams', 'The teams taking part. Add these before fixtures and standings.', true)] },
  { id: 'fixtures', title: 'Fixtures & results', subtitle: 'Enter real matches only. A completed match needs both scores.', sections: [
    competitionsList('Groups or competitions', 'Optional: for example Group A, Group B or the main league.'),
    { kind: 'list', list: 'fixtures', title: 'Matches', addLabel: 'Add a match', itemLabel: (_e, i) => `Match ${i + 1}`, needs: ['teamId', 'scheduledAt'],
      blank: () => ({ id: newId('fx'), teamId: '', opponent: '', opponentName: '', scheduledAt: '', venue: '', homeOrAway: 'home', status: 'scheduled', homeScore: '', awayScore: '', round: '', competitionId: '', resultSummary: '' }),
      fields: [
        { key: 'teamId', label: 'Team A (home)', kind: 'select', options: 'teams', required: true, emptyLabel: 'Choose a team' },
        { key: 'opponent', label: 'Team B (away)', kind: 'select', options: 'teamsOrOther', required: true, emptyLabel: 'Choose a team' },
        { key: 'opponentName', label: 'Team B name', required: true, showIf: (e) => text(e, 'opponent') === '__other' },
        { key: 'scheduledAt', label: 'Date and time', kind: 'datetime', required: true }, { key: 'competitionId', label: 'Group / competition', kind: 'select', options: 'competitions', emptyLabel: 'None' },
        { key: 'round', label: 'Round', placeholder: 'Group A · Matchday 1' }, { key: 'venue', label: 'Venue' },
        { key: 'status', label: 'Status', kind: 'select', options: MATCH_STATUS },
        { key: 'homeScore', label: 'Team A score', kind: 'number', showIf: showScores }, { key: 'awayScore', label: 'Team B score', kind: 'number', showIf: showScores },
        { key: 'resultSummary', label: 'Result summary', kind: 'textarea', wide: true, showIf: (e) => text(e, 'status') === 'completed' }
      ] }
  ] },
  { id: 'standings', title: 'Standings', sections: [standingsList('Group or league tables. Leave empty to hide them.')] },
  { id: 'bracket', title: 'Knockout bracket', subtitle: 'Rounds from first to last. Matches can be filled in as the draw is made.', sections: [{ kind: 'stages' }] },
  { id: 'sponsors-news', title: 'Sponsors & news', sections: [sponsorsList, newsList] },
  { id: 'gallery', title: 'Gallery & video', sections: [galleryList, videoFields] },
  contactStep, reviewStep
];

const ACADEMY_STEPS: StepSpec[] = [
  { id: 'identity', title: 'Identity', subtitle: 'Who the academy is.', sections: [identityFields('Academy name', 'A short line under the name. Optional.', 'Year established')] },
  brandingStep,
  { id: 'about', title: 'About & philosophy', subtitle: 'Every field is optional.', sections: [{ kind: 'fields', fields: [
    { key: 'description', label: 'About the academy', kind: 'textarea', wide: true }, { key: 'philosophy', label: 'Coaching philosophy', kind: 'textarea', wide: true },
    { key: 'history', label: 'History', kind: 'textarea', wide: true }, { key: 'mission', label: 'Mission', kind: 'textarea' }, { key: 'vision', label: 'Vision', kind: 'textarea' },
    { key: 'values', label: 'Values', kind: 'lines', hint: 'One per line', wide: true }
  ] }] },
  { id: 'programmes', title: 'Programmes', sections: [{
    kind: 'list', list: 'programmes', title: 'Programmes and courses', hint: 'Add each programme the academy really runs.', addLabel: 'Add a programme', itemLabel: (e, i) => label(e, 'title', 'Programme', i), needs: ['title'],
    blank: () => ({ id: newId('prog'), title: '', sport: '', ageGroup: '', duration: '', description: '', feeStructure: '', highlights: '' }),
    fields: [{ key: 'title', label: 'Programme name', required: true }, { key: 'sport', label: 'Sport', kind: 'select', options: SPORT_OPTIONS, emptyLabel: 'Same as main sport' }, { key: 'ageGroup', label: 'Age group', placeholder: '8–12 years' }, { key: 'duration', label: 'Duration', placeholder: '10 months' },
      { key: 'description', label: 'Description', kind: 'textarea', wide: true }, { key: 'highlights', label: 'What students learn', hint: 'Separate with commas', wide: true }, { key: 'feeStructure', label: 'Fee', placeholder: 'Monthly plan, termly plan…' }]
  }] },
  { id: 'coaches', title: 'Coaches', sections: [staffList('Coaches', 'Coach', 'Add a coach')] },
  { id: 'facilities', title: 'Facilities', sections: [{
    kind: 'list', list: 'facilities', title: 'Grounds and facilities', addLabel: 'Add a facility', itemLabel: (e, i) => label(e, 'name', 'Facility', i), needs: ['name'], blank: () => ({ id: newId('fac'), name: '', description: '', imageUrl: '' }),
    fields: [{ key: 'name', label: 'Facility', required: true }, { key: 'imageUrl', label: 'Photo', kind: 'image' }, { key: 'description', label: 'Description', kind: 'textarea', wide: true }]
  }] },
  { id: 'batches', title: 'Batches & schedule', subtitle: 'The weekly timetable. It becomes the schedule on the website.', sections: [{
    kind: 'list', list: 'batches', title: 'Training batches', addLabel: 'Add a batch', itemLabel: (e, i) => label(e, 'name', 'Batch', i), needs: ['name'], blank: () => ({ id: newId('batch'), name: '', programmeId: '', ageGroup: '', daysOfWeek: [], startTime: '', endTime: '', venue: '', coachName: '' }),
    fields: [{ key: 'name', label: 'Batch name', required: true }, { key: 'programmeId', label: 'Programme', kind: 'select', options: 'programmes', emptyLabel: 'Not linked' }, { key: 'daysOfWeek', label: 'Days', kind: 'days', required: true, wide: true },
      { key: 'startTime', label: 'Start', kind: 'text', required: true, placeholder: '16:00' }, { key: 'endTime', label: 'End', placeholder: '17:30' }, { key: 'ageGroup', label: 'Age group' }, { key: 'venue', label: 'Venue' }, { key: 'coachName', label: 'Coach' }]
  }] },
  { id: 'admission', title: 'Admission', subtitle: 'Shown only when you fill it in.', sections: [{ kind: 'fields', fields: [
    { key: 'admProcess', label: 'How to apply', kind: 'textarea', wide: true }, { key: 'admEligibility', label: 'Who can join', kind: 'textarea' }, { key: 'admTrial', label: 'Trial sessions', kind: 'textarea' },
    { key: 'admFee', label: 'Fee summary', kind: 'textarea' }, { key: 'admIntake', label: 'Intake dates', kind: 'textarea' }, { key: 'admDocs', label: 'Documents required', kind: 'lines', hint: 'One per line', wide: true }
  ] }] },
  { id: 'proof', title: 'Achievements & testimonials', subtitle: 'Real achievements and genuine quotes only. If you have none, leave both empty: nothing is invented.', sections: [
    { kind: 'list', list: 'achievements', title: 'Achievements', addLabel: 'Add an achievement', itemLabel: (e, i) => label(e, 'title', 'Achievement', i), needs: ['title'], blank: () => ({ id: newId('ach'), title: '', year: '', description: '' }),
      fields: [{ key: 'title', label: 'Achievement', required: true, wide: true }, { key: 'year', label: 'Year', kind: 'number' }, { key: 'description', label: 'Details', kind: 'textarea', wide: true }] },
    { kind: 'list', list: 'testimonials', title: 'Testimonials', hint: 'Only quotes that a parent, student or coach actually gave and agreed to share.', addLabel: 'Add a testimonial', itemLabel: (e, i) => label(e, 'author', 'Testimonial', i), needs: ['quote', 'author'], blank: () => ({ id: newId('tm'), quote: '', author: '', role: '' }),
      fields: [{ key: 'quote', label: 'Quote', kind: 'textarea', required: true, wide: true }, { key: 'author', label: 'Name', required: true }, { key: 'role', label: 'Role', placeholder: 'Parent, student…' }] }
  ] },
  { id: 'gallery', title: 'Gallery & video', sections: [galleryList, videoFields] },
  contactStep, reviewStep
];

export const STEPS: Record<SportsCategory, StepSpec[]> = { sports_club: CLUB_STEPS, sports_tournament: TOURNAMENT_STEPS, sports_academy: ACADEMY_STEPS };

export const CATEGORY_LABEL: Record<SportsCategory, string> = { sports_club: 'Sports club', sports_tournament: 'Tournament hub', sports_academy: 'Sports academy' };

/* ------------------------------------------------------------------ stages (bracket) */

export const blankStage = (): Entry => ({ id: newId('stage'), name: '', stageType: 'knockout', status: 'upcoming', matches: [] });
export const blankStageMatch = (): Entry => ({ id: newId('m'), homeTeamName: '', awayTeamName: '', homeScore: '', awayScore: '', status: 'scheduled', scheduledAt: '' });
export const STAGE_FIELDS = { types: STAGE_TYPES, status: STAGE_STATUS, matchStatus: MATCH_STATUS };

/* ------------------------------------------------------------------ pruning and validation */

const sameValue = (a: unknown, b: unknown): boolean => (Array.isArray(a) && Array.isArray(b) ? a.length === b.length && a.every((x, i) => sameValue(x, b[i])) : a === b);

/** An entry that still equals its untouched blank card. */
const isBlankEntry = (e: Entry, blank: Entry): boolean => Object.keys(blank).every((k) => k === 'id' || sameValue(e[k], blank[k]));

const BLANKS: Record<ListKey, () => Entry> = {} as Record<ListKey, () => Entry>;
STEPS.sports_club.concat(STEPS.sports_tournament, STEPS.sports_academy).forEach((s) => s.sections.forEach((sec) => { if (sec.kind === 'list') BLANKS[sec.list] = sec.blank; }));
BLANKS.stages = blankStage;

const STAGE_MATCH_BLANK = blankStageMatch();
const pruneStage = (s: Entry): Entry => ({ ...s, matches: ((s.matches as Entry[]) || []).filter((m) => !isBlankEntry(m, STAGE_MATCH_BLANK)) });

/** Drop cards that were added but never filled in. */
export function pruneBlank(f: IntakeForm): IntakeForm {
  const lists = { ...f.lists };
  LIST_KEYS.forEach((k) => {
    const blank = BLANKS[k]();
    lists[k] = (f.lists[k] || []).filter((e) => !isBlankEntry(e, blank)).map((e) => (k === 'stages' ? pruneStage(e) : e));
  });
  return { ...f, lists };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isUrl = (s: string) => { try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } };
const HEX = /^#[0-9a-fA-F]{6}$/;
const isInt = (s: string) => /^\d+$/.test(s.trim());
const filled = (v: unknown) => (Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim() !== '');

function fieldError(spec: FieldSpec, value: unknown): string | undefined {
  const s = typeof value === 'string' ? value.trim() : '';
  if (spec.required && !filled(value)) return spec.kind === 'days' ? 'Choose at least one day.' : `${spec.label} is required.`;
  if (!filled(value)) return undefined;
  switch (spec.kind) {
    case 'email': return EMAIL.test(s) ? undefined : 'Enter a valid email address.';
    case 'url': return isUrl(s) ? undefined : 'Enter a full link starting with https://';
    case 'number': return isInt(s) ? undefined : 'Use whole numbers only.';
    case 'color': return HEX.test(s) ? undefined : 'Use a hex colour such as #0A3D62.';
    case 'lines': return spec.key === 'youtubeUrls' ? ((value as string).split('\n').map((l) => l.trim()).filter(Boolean).every(isUrl) ? undefined : 'Each line must be a full link starting with https://') : undefined;
    default: return undefined;
  }
}

const sectionsOf = (step: StepSpec) => step.sections;
export const errKey = (list: ListKey, id: string, field: string) => `${list}:${id}:${field}`;

/** Validate one step. Keys: scalar field key, or `list:entryId:field`, or `list:entryId` for a whole-card problem. */
export function validateStep(stepIndex: number, form: IntakeForm, category: SportsCategory): FieldErrors {
  const step = STEPS[category][stepIndex - 1];
  const errors: FieldErrors = {};
  if (!step) return errors;
  const clean = pruneBlank(form);
  const { v } = clean;

  for (const sec of sectionsOf(step)) {
    if (sec.kind === 'fields') {
      sec.fields.forEach((f) => { const m = fieldError(f, v[f.key] ?? ''); if (m) errors[f.key] = m; });
      if (step.id === 'identity') {
        if (v.founded && (Number(v.founded) < 1800 || Number(v.founded) > new Date().getFullYear())) errors.founded = `Enter a year between 1800 and ${new Date().getFullYear()}.`;
      }
      if (step.id === 'details' && v.startDate && v.endDate && v.endDate < v.startDate) errors.endDate = 'The end date cannot be before the start date.';
    }
    if (sec.kind === 'list') {
      for (const e of clean.lists[sec.list]) {
        sec.fields.forEach((f) => {
          if (f.showIf && !f.showIf(e)) return;
          const m = fieldError(f, e[f.key]);
          if (m) errors[errKey(sec.list, e.id, f.key)] = m;
        });
        if (sec.list === 'fixtures' && text(e, 'status') === 'completed') {
          if (!filled(e.homeScore) || !filled(e.awayScore)) errors[errKey('fixtures', e.id, 'homeScore')] = 'A completed match needs both scores. Set it to Scheduled if it has not been played.';
        }
        if (sec.list === 'fixtures' && text(e, 'teamId') && text(e, 'teamId') === text(e, 'opponent')) errors[errKey('fixtures', e.id, 'opponent')] = 'A team cannot play itself.';
        if (sec.list === 'players' && !clean.lists.teams.some((t) => t.id === text(e, 'teamId')) && text(e, 'teamId')) errors[errKey('players', e.id, 'teamId')] = 'That team was removed. Choose another.';
      }
      if (sec.list === 'players' && clean.lists.players.length && !clean.lists.teams.length) errors.players = 'Add at least one team above before adding players.';
      if (sec.list === 'fixtures' && category === 'sports_tournament' && clean.lists.fixtures.length && clean.lists.teams.length < 2) errors.fixtures = 'Add at least two teams (step “Participating teams”) before adding matches.';
    }
    if (sec.kind === 'media') {
      const bad = (key: string) => String(v[key] ?? '').split('\n').map((l) => l.trim()).filter(Boolean).some((l) => !isUrl(l));
      if (bad(MEDIA_KEYS.youtube) || bad(MEDIA_KEYS.playlists)) errors[MEDIA_KEYS.youtube] = 'Each YouTube link must be a full link starting with https://';
      if (bad(MEDIA_KEYS.driveVideos)) errors[MEDIA_KEYS.driveVideos] = 'Each Google Drive link must be a full link starting with https://';
      if (v[MEDIA_KEYS.driveGallery] && !isUrl(String(v[MEDIA_KEYS.driveGallery]).trim())) errors[MEDIA_KEYS.driveGallery] = 'Enter the full Google Drive folder link.';
    }
    if (sec.kind === 'stages') {
      for (const s of clean.lists.stages) {
        if (!filled(s.name)) errors[errKey('stages', s.id, 'name')] = 'Name this round, for example “Quarter-finals”.';
        for (const m of (s.matches as Entry[]) || []) {
          if (!filled(m.homeTeamName) || !filled(m.awayTeamName)) errors[errKey('stages', m.id, 'teams')] = 'Both team names are needed (use “TBD” for a team that is not decided).';
          if ((filled(m.homeScore) || filled(m.awayScore)) && !(filled(m.homeScore) && filled(m.awayScore))) errors[errKey('stages', m.id, 'score')] = 'Enter both scores, or neither.';
          if ((filled(m.homeScore) && !isInt(text(m, 'homeScore'))) || (filled(m.awayScore) && !isInt(text(m, 'awayScore')))) errors[errKey('stages', m.id, 'score')] = 'Scores must be whole numbers.';
        }
      }
    }
  }
  return errors;
}

export function validateAll(form: IntakeForm, category: SportsCategory): { step: number; errors: FieldErrors }[] {
  const out: { step: number; errors: FieldErrors }[] = [];
  STEPS[category].forEach((_, i) => { const errors = validateStep(i + 1, form, category); if (Object.keys(errors).length) out.push({ step: i + 1, errors }); });
  return out;
}

/* ------------------------------------------------------------------ build requirements */

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const num = (v: unknown): number | undefined => (typeof v === 'string' && /^\d+$/.test(v.trim()) ? Number(v.trim()) : undefined);
const lines = (v: unknown) => str(v).split('\n').map((l) => l.trim()).filter(Boolean);
const csv = (v: unknown) => str(v).split(',').map((l) => l.trim()).filter(Boolean);
const opt = (s: string) => (s ? s : undefined);

export function buildRequirements(input: IntakeForm, category: SportsCategory): ClientRequirements {
  const f = pruneBlank(input);
  const v = f.v;
  const L = f.lists;
  const sport = (str(v.sport) || 'other') as SportType;
  const name = str(v.name);
  const location = [v.city, v.state, v.country].map(str).filter(Boolean).join(', ');
  const t = category === 'sports_tournament';
  const a = category === 'sports_academy';

  const teams: SportsTeam[] = L.teams.map((e) => ({ id: e.id, name: str(e.name), sport: (str(e.sport) || sport) as SportType, ageGroup: opt(str(e.ageGroup)), genderCategory: opt(str(e.gender)), description: opt(str(e.description)), logoUrl: opt(str(e.logo)), isActive: true }));
  const teamIds = new Set(teams.map((x) => x.id));
  const players: SportsPlayer[] = L.players.filter((e) => teamIds.has(str(e.teamId))).map((e) => ({ id: e.id, teamId: str(e.teamId), fullName: str(e.fullName), jerseyNumber: num(e.jerseyNumber), position: opt(str(e.position)), profileImageUrl: opt(str(e.photo)), status: 'active' }));
  const staff: SportsStaffMember[] = L.staff.map((e) => ({ id: e.id, fullName: str(e.fullName), role: str(e.role), biography: opt(str(e.biography)), profileImageUrl: opt(str(e.photo)), qualifications: csv(e.qualifications) }));
  const competitions: SportsCompetition[] = L.competitions.map((e) => ({ id: e.id, name: str(e.name), sport, competitionType: (str(e.competitionType) || 'league') as CompetitionType, season: opt(str(e.season)), startDate: opt(str(e.startDate)), endDate: opt(str(e.endDate)), venue: opt(str(e.venue)) }));
  const compIds = new Set(competitions.map((x) => x.id));
  const nameOfTeam = (id: string) => teams.find((x) => x.id === id)?.name || '';

  const fixtures: SportsFixture[] = L.fixtures.map((e) => {
    const status = (str(e.status) || 'scheduled') as MatchStatus;
    const scored = ['completed', 'live'].includes(status);
    const oppPick = str(e.opponent);
    const opponentName = t ? (oppPick === '__other' ? str(e.opponentName) : nameOfTeam(oppPick)) : str(e.opponentName);
    return {
      id: e.id, teamId: str(e.teamId) || 'main', competitionId: compIds.has(str(e.competitionId)) ? str(e.competitionId) : undefined,
      opponentName, opponentTeamId: t && oppPick && oppPick !== '__other' ? oppPick : undefined, scheduledAt: str(e.scheduledAt), venue: opt(str(e.venue)),
      homeOrAway: (t ? 'home' : (str(e.homeOrAway) || 'home')) as SportsFixture['homeOrAway'], status, round: opt(str(e.round)),
      homeScore: scored ? num(e.homeScore) : undefined, awayScore: scored ? num(e.awayScore) : undefined, resultSummary: opt(str(e.resultSummary))
    };
  });
  const standings: SportsStanding[] = L.standings.map((e, i) => {
    const external = str(e.teamId) === '__other';
    const gf = num(e.goalsFor); const ga = num(e.goalsAgainst);
    return {
      competitionId: compIds.has(str(e.competitionId)) ? str(e.competitionId) : 'league', teamId: external ? `ext_${e.id}` : str(e.teamId), teamName: external ? str(e.teamName) : undefined,
      position: num(e.position) ?? i + 1, played: num(e.played) ?? 0, won: num(e.won) ?? 0, drawn: num(e.drawn) ?? 0, lost: num(e.lost) ?? 0,
      goalsFor: gf, goalsAgainst: ga, points: num(e.points) ?? 0, goalDifference: gf !== undefined && ga !== undefined ? gf - ga : undefined
    };
  });
  const sponsors: SportsSponsor[] = L.sponsors.map((e, i) => ({ id: e.id, name: str(e.name), sponsorshipLevel: opt(str(e.level)), websiteUrl: opt(str(e.websiteUrl)), logoUrl: opt(str(e.logo)), description: opt(str(e.description)), displayOrder: i + 1 }));
  const news: SportsNewsArticle[] = L.news.map((e) => ({ id: e.id, title: str(e.title), summary: opt(str(e.summary)), publishedAt: opt(str(e.date)), coverImageUrl: opt(str(e.image)), isPublished: true }));
  const stages: SportsTournamentStage[] = L.stages.map((s, i) => ({
    id: s.id, name: str(s.name), stageOrder: i + 1, stageType: (str(s.stageType) || 'knockout') as SportsTournamentStage['stageType'], status: (str(s.status) || 'upcoming') as SportsTournamentStage['status'],
    matches: ((s.matches as Entry[]) || []).map((m) => {
      const hs = num(m.homeScore); const as_ = num(m.awayScore);
      return { id: m.id, roundName: str(s.name), homeTeamName: str(m.homeTeamName), awayTeamName: str(m.awayTeamName), homeScore: hs, awayScore: as_, scheduledAt: opt(str(m.scheduledAt)), status: (str(m.status) || 'scheduled') as MatchStatus, winner: hs !== undefined && as_ !== undefined ? (hs > as_ ? 'home' : hs < as_ ? 'away' : 'draw') : undefined };
    })
  }));
  const programmes: SportsAcademyProgramme[] = L.programmes.map((e) => ({ id: e.id, title: str(e.title), sport: (str(e.sport) || sport) as SportType, ageGroup: str(e.ageGroup), duration: str(e.duration), description: str(e.description), feeStructure: opt(str(e.feeStructure)), curriculumHighlights: csv(e.highlights), isActive: true }));
  const batches: SportsTrainingBatch[] = L.batches.map((e) => ({ id: e.id, name: str(e.name), programmeId: opt(str(e.programmeId)), ageGroup: str(e.ageGroup), daysOfWeek: Array.isArray(e.daysOfWeek) ? (e.daysOfWeek as string[]) : [], startTime: str(e.startTime), endTime: str(e.endTime), venue: str(e.venue), coachName: opt(str(e.coachName)) }));
  const gallery = L.gallery.map((e) => ({ id: e.id, url: str(e.url), caption: opt(str(e.caption)) }));

  const venues = L.venues.map((e) => ({ id: e.id, name: str(e.name), address: opt(str(e.address)), capacity: num(e.capacity), notes: opt(str(e.notes)), imageUrl: opt(str(e.imageUrl)) }));
  const tournamentInfo = t ? {
    edition: opt(str(v.edition)), format: (str(v.format) || undefined) as TournamentFormat | undefined, formatDescription: opt(str(v.formatDescription)), matchFormat: opt(str(v.matchFormat)),
    startDate: opt(str(v.startDate)), endDate: opt(str(v.endDate)), location: opt(str(v.tLocation)), registrationDeadline: opt(str(v.registrationDeadline)), registrationInfo: opt(str(v.registrationInfo)),
    prizeInfo: opt(str(v.prizeInfo)), ticketInfo: opt(str(v.ticketInfo)), rules: lines(v.rules), venues
  } : undefined;
  const admission = { process: opt(str(v.admProcess)), eligibility: opt(str(v.admEligibility)), feeSummary: opt(str(v.admFee)), documentsRequired: lines(v.admDocs), trialInfo: opt(str(v.admTrial)), intakeDates: opt(str(v.admIntake)) };
  const hasAdmission = Object.values(admission).some((x) => (Array.isArray(x) ? x.length > 0 : Boolean(x)));
  const facilities = L.facilities.map((e) => ({ id: e.id, name: str(e.name), description: opt(str(e.description)), imageUrl: opt(str(e.imageUrl)) }));
  const achievements = L.achievements.map((e) => ({ id: e.id, title: str(e.title), year: opt(str(e.year)), description: opt(str(e.description)) }));
  const testimonials = L.testimonials.map((e) => ({ id: e.id, quote: str(e.quote), author: str(e.author), role: opt(str(e.role)) }));
  const academyInfo = a ? { philosophy: opt(str(v.philosophy)), facilities, admission: hasAdmission ? admission : undefined, achievements, testimonials } : undefined;

  const primaryColor = HEX.test(str(v.primaryColor)) ? str(v.primaryColor) : (f.template.designTokens?.primaryColor || '#0B1F3A');
  const accentColor = HEX.test(str(v.accentColor)) ? str(v.accentColor) : (f.template.designTokens?.accentColor || '#C9A24B');
  const youtubeUrls = lines(v.youtubeUrls);
  const youtubePlaylistUrls = lines(v.youtubePlaylistUrls);
  const googleDriveVideoUrls = lines(v.driveVideoUrls);
  const googleDriveGalleryUrl = opt(str(v.driveGalleryUrl));
  const hasGalleryMedia = gallery.length > 0 || Boolean(googleDriveGalleryUrl) || youtubeUrls.length > 0 || youtubePlaylistUrls.length > 0 || googleDriveVideoUrls.length > 0;

  const sportsData: SportsWebsiteData = {
    schemaVersion: '1.0',
    club: {
      organizationName: name, sportTypes: [sport], tagline: opt(str(v.tagline)), description: opt(str(v.description)), foundedYear: num(v.founded), homeGround: opt(str(v.address)),
      headquarters: opt(location), logoUrl: opt(str(v.logo)), coverImageUrl: opt(str(v.cover)), primaryColor, accentColor, websiteLanguage: 'english',
      mission: opt(str(v.mission)), vision: opt(str(v.vision)), values: lines(v.values), history: opt(str(v.history)), achievements: lines(v.clubAchievements)
    },
    teams, players, staff, competitions, fixtures, standings, matchEvents: [], sponsors, news,
    tournamentStages: t ? stages : undefined, academyProgrammes: a ? programmes : undefined, trainingBatches: a ? batches : undefined,
    tournamentInfo, academyInfo, gallery,
    seoInfo: { pageTitle: name, metaDescription: opt(str(v.tagline)) },
    brandingMedia: { primaryLogoUrl: opt(str(v.logo)), bannerImageUrl: opt(str(v.cover)), primaryColor, accentColor },
    pages: [], sections: [],
    dataAvailability: {
      teams: teams.length > 0, players: players.length > 0, staff: staff.length > 0, competitions: competitions.length > 0, fixtures: fixtures.length > 0, standings: standings.length > 0,
      sponsors: sponsors.length > 0, news: news.length > 0, tournamentStages: stages.length > 0, academyProgrammes: programmes.length > 0, trainingBatches: batches.length > 0,
      gallery: gallery.length > 0, tournamentInfo: Boolean(tournamentInfo && Object.entries(tournamentInfo).some(([k, x]) => (k === 'venues' || k === 'rules' ? (x as unknown[]).length > 0 : Boolean(x)))),
      academyInfo: Boolean(academyInfo && (academyInfo.philosophy || facilities.length || hasAdmission || achievements.length || testimonials.length))
    }
  };

  const socialLinks: Record<string, string> = {};
  (['facebook', 'instagram', 'twitter', 'youtube', 'whatsapp'] as const).forEach((k) => { if (str(v[k])) socialLinks[k] = str(v[k]); });

  return {
    organizationName: name, category: 'sports', organizationType: 'sports', sportsArchetype: category,
    tagline: str(v.tagline), aboutText: [str(v.description), str(v.history)].filter(Boolean).join('\n\n'),
    contactPerson: opt(str(v.contactPerson)), contactEmail: str(v.email).toLowerCase(), contactPhone: str(v.phone),
    address: [str(v.address), location].filter(Boolean).join(', ') || undefined,
    logoUrl: opt(str(v.logo)), coverImageUrl: opt(str(v.cover)), additionalBrandingImages: [],
    primaryColor, accentColor, typographyStyle: 'athletic', websiteLanguage: 'english', preferredLanguage: 'english',
    youtubeUrls, youtubePlaylistUrls, googleDriveGalleryUrl, googleDriveVideoUrls, socialLinks,
    requiredPages: { home: true, about: true, events: fixtures.length > 0, committee: staff.length > 0 || teams.length > 0, gallery: hasGalleryMedia, announcements: news.length > 0, contact: true },
    enabledSections: { hero: true, events: fixtures.length > 0, about: true, committee: staff.length > 0 || teams.length > 0, gallery: hasGalleryMedia, contact: true },
    events: [], committee: [], gallery: [],
    designSelection: { mode: 'template', modelId: f.template.templateId },
    selectedTemplate: f.template,
    sportsData
  };
}

/* ------------------------------------------------------------------ drafts */

const draftKey = (scope: string, category: string) => `dv:sports-draft:${scope}:${category}`;
interface DraftEnvelope { version: 1; step: number; savedAt: string; form: IntakeForm }

/** Browser-local drafts. Every call is guarded: storage can be blocked or full. */
export const drafts = {
  available(): boolean {
    try { const k = '__dv_probe__'; window.localStorage.setItem(k, '1'); window.localStorage.removeItem(k); return true; } catch { return false; }
  },
  save(scope: string, category: string, step: number, form: IntakeForm): { ok: boolean; savedAt?: string; error?: string } {
    try {
      const env: DraftEnvelope = { version: 1, step, savedAt: new Date().toISOString(), form };
      window.localStorage.setItem(draftKey(scope, category), JSON.stringify(env));
      return { ok: true, savedAt: env.savedAt };
    } catch (e) { return { ok: false, error: e instanceof Error && /quota/i.test(e.message) ? 'Browser storage is full, so the draft could not be saved.' : 'The draft could not be saved in this browser.' }; }
  },
  load(scope: string, category: string): DraftEnvelope | null {
    try {
      const raw = window.localStorage.getItem(draftKey(scope, category));
      if (!raw) return null;
      const env = JSON.parse(raw) as DraftEnvelope;
      return env && env.version === 1 && env.form && typeof env.form === 'object' ? env : null;
    } catch { return null; }
  },
  clear(scope: string, category: string) { try { window.localStorage.removeItem(draftKey(scope, category)); } catch { /* ignore */ } }
};

/** Merge a stored draft over a fresh form so lists added in newer versions never come back undefined. */
export function mergeDraft(base: IntakeForm, saved: IntakeForm): IntakeForm {
  const lists = { ...base.lists };
  LIST_KEYS.forEach((k) => { if (Array.isArray(saved.lists?.[k])) lists[k] = saved.lists[k]; });
  return { ...base, v: { ...base.v, ...(saved.v || {}) }, lists };
}

/** Does the form hold anything the Admin typed? Used to decide whether a draft is worth keeping. */
export const hasContent = (f: IntakeForm) => Object.entries(f.v).some(([k, x]) => k !== 'primaryColor' && k !== 'accentColor' && Boolean(x)) || LIST_KEYS.some((k) => f.lists[k].length > 0);
