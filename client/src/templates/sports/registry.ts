import type {
  SportsCategory, SportsFocus, SportsSectionConfig, SportsSectionKey, SportsTemplateDefinition, SportsTemplateId, SportsTemplateTokens
} from './types';
import { SPORTS_CATEGORY_LABELS } from './types';
import { DEMO_BUILDERS } from './demos/demoData';

/**
 * Sports Website Creation Engine template library (3 categories x 8 designs). Every entry is an original
 * design implemented in ./designs; see LICENSES.md and SPORTS_TEMPLATE_SOURCES.md for sources and font licences.
 */

const preview = (id: SportsTemplateId) => `/images/sports-templates/${id}.jpg`;
const sec = (id: SportsSectionKey, label: string, needs?: string): SportsSectionConfig => ({ id, label, needs });
const original = (inspiration: string[], note: string) => ({ kind: 'original' as const, inspiration, note });

const CLUB_FIELDS = ['club.organizationName', 'club.tagline', 'club.description', 'club.logoUrl', 'club.coverImageUrl', 'teams[]', 'players[]', 'staff[]', 'fixtures[]', 'standings[]', 'news[]', 'sponsors[]', 'gallery[]', 'requirements.contact*', 'requirements.socialLinks'];
const TOURNAMENT_FIELDS = ['club.organizationName', 'tournamentInfo.*', 'teams[]', 'fixtures[]', 'standings[]', 'tournamentStages[]', 'news[]', 'sponsors[]', 'gallery[]', 'requirements.contact*'];
const ACADEMY_FIELDS = ['club.organizationName', 'club.tagline', 'academyInfo.*', 'academyProgrammes[]', 'trainingBatches[]', 'staff[]', 'news[]', 'gallery[]', 'requirements.contact*'];

interface Def {
  id: SportsTemplateId; name: string; tagline: string; description: string; archetype: SportsCategory; badge: string; designStyle: string;
  styleGroup: SportsTemplateDefinition['styleGroup']; designDirection: string; sports: SportsFocus[]; highlights: string[]; tokens: SportsTemplateTokens;
  sections: SportsSectionConfig[]; animation: { style: string; features: string[] }; inspiration: string[]; note: string;
  logo?: 'required' | 'recommended' | 'optional'; hero?: 'required' | 'recommended' | 'optional'; assets?: string;
}

const make = (d: Def): SportsTemplateDefinition => ({
  id: d.id, name: d.name, tagline: d.tagline, description: d.description, archetype: d.archetype, categoryLabel: SPORTS_CATEGORY_LABELS[d.archetype],
  version: '1.0.0', author: 'DigiVerse Design', badge: d.badge, designStyle: d.designStyle, styleGroup: d.styleGroup, designDirection: d.designDirection, sports: d.sports,
  highlights: d.highlights, tokens: d.tokens, sections: d.sections,
  contentFields: d.archetype === 'sports_club' ? CLUB_FIELDS : d.archetype === 'sports_tournament' ? TOURNAMENT_FIELDS : ACADEMY_FIELDS,
  assetRequirements: { logo: d.logo || 'recommended', heroImage: d.hero || 'recommended', notes: d.assets || 'A transparent logo and one wide hero photograph. Generated artwork is used until the client supplies images.' },
  animation: { style: d.animation.style, reducedMotion: 'static', features: d.animation.features },
  previewImage: preview(d.id), source: original(d.inspiration, d.note), getDemoData: DEMO_BUILDERS[d.id]
});

const tok = (primaryColor: string, accentColor: string, background: string, textColor: string, headingFont: string, fontFamily: string, layoutPreset: string, secondaryColor?: string): SportsTemplateTokens =>
  ({ primaryColor, accentColor, secondaryColor, background, textColor, headingFont, fontFamily, layoutPreset });

const DEFS: Def[] = [
  /* ============================== SPORTS CLUB ============================== */
  {
    id: 'premier-elite-club', name: 'Premier Elite Club', archetype: 'sports_club', badge: 'Elite', designStyle: 'Dark navy · Gold · Formal', styleGroup: 'dark',
    tagline: 'The look of a top-flight club: crest, gold detailing and a next-match hero.',
    description: 'A formal, high-status club website: a centred crest header, a full-bleed hero with a next-match card and live countdown, a squad directory by position with large shirt numbers, a results ledger, a trophy and honours cabinet and a history timeline.',
    designDirection: 'Prestige and heritage: deep navy, burnished gold, serif headlines and ample space.', sports: ['football', 'any'],
    highlights: ['Next-match hero with live countdown', 'Squad directory by position with shirt numbers', 'Fixtures and results ledger', 'League table with form', 'Honours cabinet and history timeline'],
    tokens: tok('#0A1A4A', '#F5C542', '#07102E', '#F3F6FF', 'Playfair Display', 'Inter', 'Centred masthead + sections', '#14327E'),
    sections: [sec('hero', 'Next-match hero'), sec('fixtures', 'Fixtures', 'fixtures'), sec('results', 'Results', 'results'), sec('standings', 'League table', 'standings'), sec('players', 'The squad', 'players'), sec('staff', 'Management', 'staff'), sec('history', 'History & honours', 'history'), sec('news', 'News', 'news'), sec('gallery', 'Gallery', 'gallery'), sec('sponsors', 'Partners', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Slow reveals, gold hover lines', features: ['Countdown timer', 'Reveal on scroll', 'Hover underline'] }, inspiration: ['Top-flight club website conventions (crest masthead, next-match hero)'], note: 'Original layout and code. Playfair Display and Inter (SIL OFL).'
  },
  {
    id: 'matchday-modern', name: 'Matchday Modern', archetype: 'sports_club', badge: 'Modern', designStyle: 'Black · Volt lime · Condensed', styleGroup: 'bold',
    tagline: 'Fast, loud and young: slashed hero, fixture ticker and horizontal player cards.',
    description: 'A contemporary football club website with an oversized condensed headline over a slashed hero, a scrolling fixture ticker, a matchday card, horizontally scrolling player cards with giant numbers and a bento grid for news.',
    designDirection: 'Energy: near-black canvas, volt-lime accent, condensed uppercase type and diagonal cuts.', sports: ['football', 'basketball'],
    highlights: ['Scrolling fixture ticker', 'Diagonal slashed hero', 'Horizontal player-card strip', 'Bento news grid', 'Matchday card with countdown'],
    tokens: tok('#0C1200', '#D6FF3D', '#080D00', '#F2FFD0', 'Barlow Condensed', 'Barlow', 'Slashed hero + bento', '#27400A'),
    sections: [sec('hero', 'Slashed hero'), sec('fixtures', 'Matchday', 'fixtures'), sec('players', 'Players', 'players'), sec('results', 'Results', 'results'), sec('standings', 'Table', 'standings'), sec('news', 'Latest', 'news'), sec('gallery', 'Gallery', 'gallery'), sec('sponsors', 'Partners', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Marquee ticker, scroll reveals', features: ['Fixture ticker', 'Reveal on scroll', 'Hover lift'] }, inspiration: ['Contemporary football-club and sports-brand layouts'], note: 'Original layout and code. Barlow and Barlow Condensed (SIL OFL).'
  },
  {
    id: 'willow-and-wicket', name: 'Willow & Wicket', archetype: 'sports_club', badge: 'Cricket', designStyle: 'Cream · Bottle green · Brass', styleGroup: 'editorial',
    tagline: 'A pavilion-style cricket club site with scorecards and team sheets.',
    description: 'A premium traditional cricket club: a masthead styled like a pavilion board, results shown as scorecards, XI team sheets, a batting and bowling averages table, a fixtures card list, an honours board and club history.',
    designDirection: 'Genteel and timeless: cream paper, bottle green, brass accents and classical serif type.', sports: ['cricket'],
    highlights: ['Scorecard-style results', 'Eleven team sheets by side', 'Batting and bowling averages', 'Honours board', 'Pavilion-board masthead'],
    tokens: tok('#14532D', '#B8892B', '#F5F1E8', '#1F2A1B', 'Cormorant Garamond', 'Work Sans', 'Masthead + scorecards', '#0F3D22'),
    sections: [sec('hero', 'Pavilion masthead'), sec('fixtures', 'Fixture card', 'fixtures'), sec('results', 'Scorecards', 'results'), sec('teams', 'The sides', 'teams'), sec('players', 'Averages', 'players'), sec('standings', 'League table', 'standings'), sec('history', 'History & honours', 'history'), sec('news', 'Club news', 'news'), sec('gallery', 'Gallery', 'gallery'), sec('sponsors', 'Sponsors', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Gentle fades', features: ['Fade-in sections', 'Hover underline'] }, inspiration: ['Traditional county-cricket-club print and signage'], note: 'Original layout and code. Cormorant Garamond and Work Sans (SIL OFL).'
  },
  {
    id: 'floodlight-night', name: 'Floodlight Night', archetype: 'sports_club', badge: 'Stadium', designStyle: 'Night · Electric blue · Glass', styleGroup: 'dark',
    tagline: 'A dark, dramatic stadium experience with a matchday dashboard.',
    description: 'A full-screen stadium hero lit by floodlight beams, a glass navigation bar, a three-panel matchday centre (next match, last result, table), a vertical results timeline, a spotlight player carousel and a sponsor marquee.',
    designDirection: 'Drama after dark: near-black, electric blue glow, glass panels and large display type.', sports: ['football', 'any'],
    highlights: ['Floodlit full-screen hero', 'Matchday centre dashboard', 'Vertical results timeline', 'Spotlight player carousel', 'Sponsor marquee'],
    tokens: tok('#050A18', '#3A6BFF', '#050A18', '#E8EEFF', 'Bebas Neue', 'Inter', 'Hero + glass dashboard', '#16295A'),
    sections: [sec('hero', 'Floodlit hero'), sec('fixtures', 'Matchday centre', 'fixtures'), sec('results', 'Results timeline', 'results'), sec('players', 'Spotlight', 'players'), sec('standings', 'Table', 'standings'), sec('news', 'News', 'news'), sec('gallery', 'Gallery', 'gallery'), sec('sponsors', 'Partners', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Light-beam glow, marquee', features: ['Floodlight pulse', 'Sponsor marquee', 'Glass hover'] }, inspiration: ['Night-match stadium photography conventions'], note: 'Original layout and code. Bebas Neue and Inter (SIL OFL).'
  },
  {
    id: 'club-journal', name: 'The Club Journal', archetype: 'sports_club', badge: 'Editorial', designStyle: 'Newsprint · Serif · Red rule', styleGroup: 'editorial',
    tagline: 'A matchday-programme front page: lead story, columns and a ruled league table.',
    description: 'An editorial club site laid out like a newspaper front page: a dated masthead, a lead story with a sidebar of fixtures, ruled results columns, a league table, team sheets as lists, features and a contact-sheet gallery.',
    designDirection: 'Print journalism: warm newsprint, black serif type, a single red rule and tight columns.', sports: ['football', 'cricket', 'any'],
    highlights: ['Newspaper masthead with date line', 'Lead story and fixture column', 'Ruled league table', 'Team sheets', 'Contact-sheet gallery'],
    tokens: tok('#2A2418', '#C21F3A', '#F5F1E8', '#2A2418', 'Fraunces', 'Source Serif 4', 'Multi-column front page', '#7B6A45'),
    sections: [sec('hero', 'Front page'), sec('news', 'Stories', 'news'), sec('fixtures', 'Fixtures', 'fixtures'), sec('results', 'Results', 'results'), sec('standings', 'Table', 'standings'), sec('players', 'Team sheets', 'players'), sec('history', 'Our history', 'history'), sec('gallery', 'Gallery', 'gallery'), sec('sponsors', 'Advertisers', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Minimal fades', features: ['Fade-in columns'] }, inspiration: ['Newspaper front-page and matchday-programme layout'], note: 'Original layout and code. Fraunces and Source Serif 4 (SIL OFL).'
  },
  {
    id: 'clean-sheet', name: 'Clean Sheet', archetype: 'sports_club', badge: 'Minimal', designStyle: 'White · Black · Green accent', styleGroup: 'minimal',
    tagline: 'Plain, quick and readable: the club website for people who just want the fixtures.',
    description: 'A minimal, professional club website: left-aligned header, numbered sections, hairline rules, simple fixture and result rows, a quiet league table, a player list and a one-line sponsor strip.',
    designDirection: 'Restraint: lots of white, black type, hairline rules and one green accent.', sports: ['any', 'football', 'cricket', 'basketball'],
    highlights: ['Numbered sections', 'Fixtures and results as clean rows', 'Quiet league table', 'Fast and accessible', 'Works with very little content'],
    tokens: tok('#111111', '#1F9954', '#FFFFFF', '#111111', 'DM Sans', 'DM Sans', 'Single column, numbered', '#6B7280'),
    sections: [sec('hero', 'Intro'), sec('fixtures', 'Fixtures', 'fixtures'), sec('results', 'Results', 'results'), sec('standings', 'Table', 'standings'), sec('players', 'Players', 'players'), sec('staff', 'People', 'staff'), sec('news', 'News', 'news'), sec('gallery', 'Photos', 'gallery'), sec('sponsors', 'Supporters', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Almost none', features: ['Subtle fade'] }, inspiration: ['Swiss-style minimal layouts'], note: 'Original layout and code. DM Sans (SIL OFL).'
  },
  {
    id: 'community-pitch', name: 'Community Pitch', archetype: 'sports_club', badge: 'Community', designStyle: 'Light · Teal · Friendly cards', styleGroup: 'youth',
    tagline: 'A welcoming volunteer-club site with sessions, news and ways to get involved.',
    description: 'A friendly website for community clubs and associations: a photo-mosaic hero, "get involved" call-outs, a sessions and fixtures card list, a people section, news, supporters and clear contact details with a map link.',
    designDirection: 'Warm and approachable: soft teal, a pink accent, rounded cards and plain language.', sports: ['volleyball', 'basketball', 'any'],
    highlights: ['Photo-mosaic hero', 'Get-involved call-outs', 'Sessions and fixtures cards', 'People and volunteers', 'Map link and clear contact block'],
    tokens: tok('#0B5A56', '#F0457A', '#F4FBF9', '#12312F', 'Poppins', 'Poppins', 'Rounded cards', '#12A58F'),
    sections: [sec('hero', 'Mosaic hero'), sec('about', 'About us', 'about'), sec('fixtures', 'What’s on', 'fixtures'), sec('results', 'Results', 'results'), sec('teams', 'Our teams', 'teams'), sec('staff', 'People', 'staff'), sec('news', 'News', 'news'), sec('gallery', 'Gallery', 'gallery'), sec('sponsors', 'Supporters', 'sponsors'), sec('contact', 'Find us')],
    animation: { style: 'Soft lifts and reveals', features: ['Card lift', 'Reveal on scroll'] }, inspiration: ['Community-organisation website patterns'], note: 'Original layout and code. Poppins (SIL OFL).'
  },
  {
    id: 'multi-sport-union', name: 'Multi-Sport Union', archetype: 'sports_club', badge: 'Multi-sport', designStyle: 'Sunrise gradient · Tabs by sport', styleGroup: 'bold',
    tagline: 'One club, many sports: switch fixtures, results and squads by sport.',
    description: 'A multi-sport club website with a sunrise-gradient hero, a tile for each sport, and tabbed fixtures, results and squads that filter by sport, plus news, facilities-style about, sponsors and contact.',
    designDirection: 'Vivid and inclusive: deep purple to orange gradient, large sport tiles and tabbed content.', sports: ['multi_sport', 'any'],
    highlights: ['Sport tiles on the home page', 'Tabs filter fixtures, results and squads by sport', 'Gradient hero with stats', 'Teams directory', 'News and sponsors'],
    tokens: tok('#2B1055', '#FF9A3C', '#140A2B', '#FFF4E8', 'Outfit', 'Inter', 'Tiles + tabs', '#7A2E8E'),
    sections: [sec('hero', 'Gradient hero'), sec('teams', 'Our sports', 'teams'), sec('fixtures', 'Fixtures', 'fixtures'), sec('results', 'Results', 'results'), sec('players', 'Squads', 'players'), sec('news', 'News', 'news'), sec('gallery', 'Gallery', 'gallery'), sec('sponsors', 'Partners', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Gradient drift, tab fades', features: ['Gradient shift', 'Tab transitions'] }, inspiration: ['Multi-sport leisure and university sports unions'], note: 'Original layout and code. Outfit and Inter (SIL OFL).'
  },

  /* ============================== TOURNAMENT HUB ============================== */
  {
    id: 'championship-portal', name: 'Championship Portal', archetype: 'sports_tournament', badge: 'Premium', designStyle: 'Charcoal · Copper · Tabbed portal', styleGroup: 'dark',
    tagline: 'A premium championship portal with tabs for fixtures, tables, bracket and teams.',
    description: 'A tournament portal with a trophy hero, key facts (dates, format, venues, prize), a countdown to the next match and a sticky tab bar that switches between Overview, Fixtures, Standings, Bracket and Teams.',
    designDirection: 'Prestige: charcoal and copper, trophy artwork and a tabbed portal that keeps everything one click away.', sports: ['football', 'any'],
    highlights: ['Trophy hero and key-facts band', 'Sticky tab bar', 'Group tables', 'Knockout bracket', 'Participating teams and venues'],
    tokens: tok('#1E1A17', '#E8743B', '#0E0D0C', '#F6F1EA', 'Oswald', 'Inter', 'Tabbed portal', '#3A312B'),
    sections: [sec('hero', 'Trophy hero'), sec('about', 'Overview', 'tournament'), sec('fixtures', 'Fixtures', 'fixtures'), sec('results', 'Results', 'results'), sec('standings', 'Standings', 'standings'), sec('bracket', 'Bracket', 'bracket'), sec('teams', 'Teams', 'teams'), sec('venues', 'Venues', 'venues'), sec('rules', 'Rules', 'rules'), sec('news', 'News', 'news'), sec('sponsors', 'Partners', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Tab fades, countdown', features: ['Tab transitions', 'Countdown timer'] }, inspiration: ['Major-tournament official websites'], note: 'Original layout and code. Oswald and Inter (SIL OFL).'
  },
  {
    id: 'cup-night-football', name: 'Cup Night Football', archetype: 'sports_tournament', badge: 'Football cup', designStyle: 'Turf green · Pitch lines · Heavy type', styleGroup: 'bold',
    tagline: 'A football cup site drawn on a pitch: group tables side by side and big scorelines.',
    description: 'A football tournament website with pitch-line artwork, group tables laid side by side, matchday cards with large scorelines, a knockout bracket, venue cards and rules.',
    designDirection: 'Cup-tie drama: turf green, chalk-white lines, heavy display type and big numbers.', sports: ['football'],
    highlights: ['Pitch-line hero', 'Group tables side by side', 'Big-score match cards', 'Knockout bracket', 'Venue and rules cards'],
    tokens: tok('#0B3D23', '#8DE0A6', '#062414', '#EFFFF4', 'Archivo Black', 'Archivo', 'Pitch hero + group grids', '#14693A'),
    sections: [sec('hero', 'Pitch hero'), sec('standings', 'Groups', 'standings'), sec('fixtures', 'Fixtures', 'fixtures'), sec('results', 'Results', 'results'), sec('bracket', 'Knockout', 'bracket'), sec('teams', 'Teams', 'teams'), sec('venues', 'Venues', 'venues'), sec('rules', 'Rules', 'rules'), sec('news', 'News', 'news'), sec('sponsors', 'Partners', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Chalk-line draw, reveals', features: ['Pitch-line sweep', 'Reveal on scroll'] }, inspiration: ['Football cup branding'], note: 'Original layout and code. Archivo and Archivo Black (SIL OFL).'
  },
  {
    id: 'cricket-league-centre', name: 'Cricket League Centre', archetype: 'sports_tournament', badge: 'Cricket league', designStyle: 'Ocean blue · Sidebar · Data-rich', styleGroup: 'dark',
    tagline: 'A league portal with a sticky side menu, points table and scorecard-style results.',
    description: 'A cricket league website with a sticky side menu, a points table, scorecard-style result cards showing runs, a fixtures list grouped by date, team directory and venue guide.',
    designDirection: 'Broadcast-clean: deep ocean blue, cyan highlights and a data-first sidebar layout.', sports: ['cricket'],
    highlights: ['Sticky side menu', 'Points table', 'Scorecard-style results', 'Fixtures grouped by date', 'Teams and venues'],
    tokens: tok('#031B34', '#58D0E8', '#04182C', '#E3F8FF', 'Rajdhani', 'Inter', 'Sidebar + content', '#05507A'),
    sections: [sec('hero', 'League header'), sec('standings', 'Points table', 'standings'), sec('fixtures', 'Fixtures', 'fixtures'), sec('results', 'Results', 'results'), sec('teams', 'Teams', 'teams'), sec('venues', 'Venues', 'venues'), sec('rules', 'Playing conditions', 'rules'), sec('news', 'News', 'news'), sec('sponsors', 'Partners', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Quiet fades', features: ['Active-section highlight', 'Reveal on scroll'] }, inspiration: ['Cricket league score centres'], note: 'Original layout and code. Rajdhani and Inter (SIL OFL).'
  },
  {
    id: 'bracket-board', name: 'Bracket Board', archetype: 'sports_tournament', badge: 'Dashboard', designStyle: 'Violet · Panels · Dense dashboard', styleGroup: 'dark',
    tagline: 'A dashboard-style tournament site: a large bracket and live-style panels.',
    description: 'A modern dashboard for knockout competitions: KPI tiles, a large bracket panel, next-matches and recent-results panels, a compact standings panel and teams, laid out as draggable-looking cards on a grid.',
    designDirection: 'Product-dashboard feel: violet surfaces, mono labels, cards on a grid.', sports: ['basketball', 'any'],
    highlights: ['KPI tiles', 'Large bracket panel', 'Next-matches and results panels', 'Compact standings', 'Dense, scannable grid'],
    tokens: tok('#160A33', '#C09BFF', '#0E0722', '#F1E8FF', 'Space Grotesk', 'Space Grotesk', 'Panel grid', '#3A1B80'),
    sections: [sec('hero', 'Header & KPIs'), sec('bracket', 'Bracket', 'bracket'), sec('fixtures', 'Up next', 'fixtures'), sec('results', 'Results', 'results'), sec('standings', 'Standings', 'standings'), sec('teams', 'Teams', 'teams'), sec('rules', 'Rules', 'rules'), sec('news', 'News', 'news'), sec('sponsors', 'Partners', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Panel fade-ins', features: ['Panel reveal', 'Hover glow'] }, inspiration: ['Analytics dashboard layouts'], note: 'Original layout and code. Space Grotesk (SIL OFL).'
  },
  {
    id: 'global-games', name: 'Global Games', archetype: 'sports_tournament', badge: 'International', designStyle: 'Sunrise · Day-by-day schedule', styleGroup: 'bold',
    tagline: 'An international multi-sport competition with a day-by-day schedule and venue guide.',
    description: 'A large international games website: a host-city hero, a day selector for the schedule, pool tables, a nations/teams grid, venue cards with capacities and a rules and information section.',
    designDirection: 'Festival energy: sunrise gradient, big type and a schedule you navigate by day.', sports: ['multi_sport', 'any'],
    highlights: ['Day selector for the schedule', 'Pool tables', 'Teams grid', 'Venue guide with capacities', 'Information and rules'],
    tokens: tok('#2B1055', '#FF9A3C', '#140A2B', '#FFF4E8', 'Sora', 'Inter', 'Day-by-day schedule', '#7A2E8E'),
    sections: [sec('hero', 'Host-city hero'), sec('schedule', 'Schedule', 'fixtures'), sec('standings', 'Pools', 'standings'), sec('results', 'Results', 'results'), sec('bracket', 'Finals', 'bracket'), sec('teams', 'Teams', 'teams'), sec('venues', 'Venues', 'venues'), sec('rules', 'Information', 'rules'), sec('news', 'News', 'news'), sec('sponsors', 'Partners', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Gradient drift, day switch', features: ['Gradient shift', 'Day tab transition'] }, inspiration: ['International multi-sport games websites'], note: 'Original layout and code. Sora and Inter (SIL OFL).'
  },
  {
    id: 'tournament-gazette', name: 'Tournament Gazette', archetype: 'sports_tournament', badge: 'Editorial', designStyle: 'Sepia print · Drop caps · Programme', styleGroup: 'editorial',
    tagline: 'An official programme online: cover, fixtures, rules as statutes and reports.',
    description: 'An editorial event website designed like an official programme: a poster-style cover, the order of play, a table in print style, rules numbered as statutes, match reports with drop caps and a roll of teams.',
    designDirection: 'A well-printed programme: sepia paper, red ink, serif type and numbered statutes.', sports: ['football', 'cricket', 'any'],
    highlights: ['Poster-style cover', 'Order of play', 'Rules as numbered statutes', 'Match reports with drop caps', 'Roll of teams'],
    tokens: tok('#2A2418', '#C21F3A', '#F3EBDA', '#2A2418', 'Playfair Display', 'Libre Baskerville', 'Programme pages', '#7B6A45'),
    sections: [sec('hero', 'Cover'), sec('about', 'Welcome', 'tournament'), sec('fixtures', 'Order of play', 'fixtures'), sec('results', 'Results', 'results'), sec('standings', 'The table', 'standings'), sec('bracket', 'The draw', 'bracket'), sec('teams', 'The teams', 'teams'), sec('rules', 'Rules', 'rules'), sec('news', 'Reports', 'news'), sec('sponsors', 'Advertisers', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Minimal fades', features: ['Fade-in'] }, inspiration: ['Official matchday programmes'], note: 'Original layout and code. Playfair Display and Libre Baskerville (SIL OFL).'
  },
  {
    id: 'fixtures-results-desk', name: 'Fixtures & Results Desk', archetype: 'sports_tournament', badge: 'Data desk', designStyle: 'Dark mint · Mono · Filterable tables', styleGroup: 'dark',
    tagline: 'Everything is a filterable table: by status, competition and team.',
    description: 'A data-first league and tournament portal: a single desk with filters for status, competition and team search, a fixtures table, a results ledger and division tables. It stays fast and accessible with a lot of data.',
    designDirection: 'Precise and utilitarian: dark mint, monospace numerals and dense, well-aligned tables.', sports: ['volleyball', 'any'],
    highlights: ['Filters by status, competition and team', 'Fixtures table and results ledger', 'Division tables', 'Sortable-looking dense layout', 'Keyboard friendly'],
    tokens: tok('#062B2B', '#7FE5CE', '#041C1C', '#EAFFF9', 'IBM Plex Sans', 'IBM Plex Sans', 'Filter desk + tables', '#0B5A56'),
    sections: [sec('hero', 'Header'), sec('fixtures', 'Fixtures', 'fixtures'), sec('results', 'Results', 'results'), sec('standings', 'Divisions', 'standings'), sec('teams', 'Teams', 'teams'), sec('rules', 'Rules', 'rules'), sec('news', 'Notices', 'news'), sec('sponsors', 'Partners', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'None required', features: ['Instant filtering'] }, inspiration: ['League administration systems'], note: 'Original layout and code. IBM Plex Sans and IBM Plex Mono (SIL OFL).'
  },
  {
    id: 'knockout-minimal', name: 'Knockout Minimal', archetype: 'sports_tournament', badge: 'Minimal', designStyle: 'White · Black · Red · Bracket-first', styleGroup: 'minimal',
    tagline: 'A giant bracket and nothing in the way.',
    description: 'A minimal competition website where the bracket is the page: a short intro, the knockout bracket at full width, the next matches, a plain results list, the rules and a contact line.',
    designDirection: 'Clarity: white page, black type, one red accent and generous space around the bracket.', sports: ['any', 'football', 'basketball'],
    highlights: ['Full-width bracket as the centrepiece', 'Next matches and results as plain lists', 'Minimal chrome', 'Quick to scan on a phone', 'Works with a handful of teams'],
    tokens: tok('#111111', '#C21F3A', '#FFFFFF', '#111111', 'Inter', 'Inter', 'Bracket-first', '#6B7280'),
    sections: [sec('hero', 'Intro'), sec('bracket', 'Bracket', 'bracket'), sec('fixtures', 'Next', 'fixtures'), sec('results', 'Results', 'results'), sec('teams', 'Teams', 'teams'), sec('rules', 'Rules', 'rules'), sec('news', 'News', 'news'), sec('sponsors', 'Partners', 'sponsors'), sec('contact', 'Contact')],
    animation: { style: 'Almost none', features: ['Subtle fade'] }, inspiration: ['Minimal competition brackets'], note: 'Original layout and code. Inter (SIL OFL).'
  },

  /* ============================== SPORTS ACADEMY ============================== */
  {
    id: 'premier-academy', name: 'Premier Academy', archetype: 'sports_academy', badge: 'Premium', designStyle: 'Ivory · Navy · Gold · Pathway tiers', styleGroup: 'light',
    tagline: 'A premium academy with a pathway of programme tiers and a polished admissions flow.',
    description: 'A refined academy website with a split hero, programmes presented as pathway tiers by age, a coaches directory with credentials, facilities, a batch timetable, an admissions timeline and achievements.',
    designDirection: 'Quiet confidence: ivory and navy with gold detailing and an elegant serif.', sports: ['football', 'any'],
    highlights: ['Pathway tiers by age group', 'Coaches with credentials', 'Facilities showcase', 'Batch timetable', 'Admissions timeline'],
    tokens: tok('#0A1A4A', '#B8892B', '#FBF8F1', '#14213D', 'Cormorant Garamond', 'Inter', 'Split hero + tiers', '#14327E'),
    sections: [sec('hero', 'Split hero'), sec('programmes', 'Pathway', 'programmes'), sec('staff', 'Coaches', 'staff'), sec('facilities', 'Facilities', 'facilities'), sec('batches', 'Timetable', 'batches'), sec('admission', 'Admissions', 'admission'), sec('achievements', 'Achievements', 'achievements'), sec('testimonials', 'Families', 'testimonials'), sec('gallery', 'Gallery', 'gallery'), sec('news', 'News', 'news'), sec('contact', 'Contact')],
    animation: { style: 'Slow reveals', features: ['Reveal on scroll', 'Hover lift'] }, inspiration: ['Private-school and premium academy sites'], note: 'Original layout and code. Cormorant Garamond and Inter (SIL OFL).'
  },
  {
    id: 'pitch-academy', name: 'Pitch Academy', archetype: 'sports_academy', badge: 'Football', designStyle: 'Turf green · Condensed · Pitch diagram', styleGroup: 'bold',
    tagline: 'A football training academy: the pathway drawn as a pitch and a weekly session grid.',
    description: 'A football academy site with a heavy condensed headline, a pathway shown as steps across a pitch diagram, a weekly session grid by day, coach cards with licences, facility tiles and a trial-booking enquiry.',
    designDirection: 'Training-ground energy: turf green, chalk lines, big condensed type.', sports: ['football'],
    highlights: ['Pathway as steps across a pitch', 'Weekly session grid by day', 'Coach cards with licences', 'Facility tiles', 'Trial enquiry form'],
    tokens: tok('#0B3D23', '#8DE0A6', '#06210F', '#EFFFF4', 'Anton', 'Roboto Condensed', 'Pitch pathway + grid', '#14693A'),
    sections: [sec('hero', 'Training hero'), sec('programmes', 'Pathway', 'programmes'), sec('batches', 'Session grid', 'batches'), sec('staff', 'Coaches', 'staff'), sec('facilities', 'Facilities', 'facilities'), sec('admission', 'Join', 'admission'), sec('achievements', 'Achievements', 'achievements'), sec('gallery', 'Gallery', 'gallery'), sec('news', 'News', 'news'), sec('contact', 'Contact')],
    animation: { style: 'Chalk-line sweep, reveals', features: ['Reveal on scroll', 'Hover lift'] }, inspiration: ['Football academy marketing sites'], note: 'Original layout and code. Anton and Roboto Condensed (SIL OFL).'
  },
  {
    id: 'coaching-crease', name: 'Coaching Crease', archetype: 'sports_academy', badge: 'Cricket', designStyle: 'Clay · Cream · Serif · Net sessions', styleGroup: 'editorial',
    tagline: 'Cricket coaching with batch cards, net-session schedules and coach profiles.',
    description: 'A cricket coaching academy website: batch cards with days, times and capacity, a programme list by age, coach profiles with qualifications, indoor and outdoor facilities, an admissions note and an enquiry form.',
    designDirection: 'Classic cricket: cream and clay with bottle-green details and book-like serif type.', sports: ['cricket'],
    highlights: ['Batch cards with days, times and capacity', 'Programmes by age group', 'Coach profiles', 'Indoor and outdoor facilities', 'Enquiry form'],
    tokens: tok('#14532D', '#C9632B', '#FAF6EC', '#2A2418', 'Libre Baskerville', 'Work Sans', 'Cards + schedule', '#8A3F1B'),
    sections: [sec('hero', 'Hero'), sec('programmes', 'Programmes', 'programmes'), sec('batches', 'Batches', 'batches'), sec('staff', 'Coaches', 'staff'), sec('facilities', 'Facilities', 'facilities'), sec('admission', 'Admissions', 'admission'), sec('gallery', 'Gallery', 'gallery'), sec('news', 'News', 'news'), sec('contact', 'Enquire')],
    animation: { style: 'Gentle fades', features: ['Reveal on scroll'] }, inspiration: ['Cricket coaching centres'], note: 'Original layout and code. Libre Baskerville and Work Sans (SIL OFL).'
  },
  {
    id: 'rising-stars', name: 'Rising Stars', archetype: 'sports_academy', badge: 'Youth', designStyle: 'Playful · Rounded · Bright', styleGroup: 'youth',
    tagline: 'A bright, friendly youth academy for parents and children.',
    description: 'A youth development academy site with big rounded shapes and bright colours: age-group stairs, programme cards, meet-the-coaches, parent-friendly admissions steps and a gallery of moments.',
    designDirection: 'Fun but trustworthy: sunrise purple and orange, rounded type and chunky shapes.', sports: ['multi_sport', 'football', 'any'],
    highlights: ['Age-group stairs', 'Rounded programme cards', 'Meet the coaches', 'Parent-friendly admission steps', 'Moments gallery'],
    tokens: tok('#7A2E8E', '#FF9A3C', '#FFF7EE', '#2B1055', 'Fredoka', 'Nunito', 'Rounded + bright', '#F0457A'),
    sections: [sec('hero', 'Hero'), sec('programmes', 'Age groups', 'programmes'), sec('staff', 'Coaches', 'staff'), sec('batches', 'When we train', 'batches'), sec('admission', 'How to join', 'admission'), sec('gallery', 'Moments', 'gallery'), sec('testimonials', 'Parents say', 'testimonials'), sec('contact', 'Say hello')],
    animation: { style: 'Bounce and float', features: ['Floating shapes', 'Hover bounce'] }, inspiration: ['Children’s activity and youth sport branding'], note: 'Original layout and code. Fredoka and Nunito (SIL OFL).'
  },
  {
    id: 'learn-and-play', name: 'Learn & Play', archetype: 'sports_academy', badge: 'Minimal', designStyle: 'Light · Calm · Text-forward', styleGroup: 'minimal',
    tagline: 'A calm sports-education website that puts the curriculum first.',
    description: 'A minimal sports education site: a gentle serif headline, a curriculum list by age, how a session works, coaches in plain cards, facilities and a simple enquiry. Built to read well and load fast.',
    designDirection: 'Calm and clear: soft mint background, serif display type, generous reading width.', sports: ['multi_sport', 'any'],
    highlights: ['Curriculum list by age', 'Clear reading width', 'Plain coach cards', 'Simple enquiry', 'Works with little content'],
    tokens: tok('#0B5A56', '#F0457A', '#F5FBF9', '#0F2E2C', 'DM Serif Display', 'DM Sans', 'Single column reading', '#12A58F'),
    sections: [sec('hero', 'Intro'), sec('programmes', 'Curriculum', 'programmes'), sec('staff', 'Coaches', 'staff'), sec('facilities', 'Spaces', 'facilities'), sec('batches', 'Timetable', 'batches'), sec('admission', 'Joining', 'admission'), sec('gallery', 'Photos', 'gallery'), sec('contact', 'Contact')],
    animation: { style: 'Almost none', features: ['Subtle fade'] }, inspiration: ['Education and Montessori-style websites'], note: 'Original layout and code. DM Serif Display and DM Sans (SIL OFL).'
  },
  {
    id: 'performance-lab', name: 'Performance Lab', archetype: 'sports_academy', badge: 'Athletic', designStyle: 'Dark · Electric blue · Data tiles', styleGroup: 'dark',
    tagline: 'An athletic performance lab: programme intensity, schedule matrix and facility specs.',
    description: 'A data-led athletic training site: metric tiles, programme cards with intensity indicators, a day-by-time schedule matrix, specialist coaches, facility spec lists and a clear trial and admissions block.',
    designDirection: 'Lab precision: near-black, electric blue, mono labels and tiles.', sports: ['multi_sport', 'any'],
    highlights: ['Metric tiles', 'Programme cards with intensity bars', 'Schedule matrix by day', 'Facility spec lists', 'Trial and admissions block'],
    tokens: tok('#050A18', '#3A6BFF', '#050A18', '#E8EEFF', 'Chakra Petch', 'Inter', 'Tiles + matrix', '#16295A'),
    sections: [sec('hero', 'Lab hero'), sec('programmes', 'Programmes', 'programmes'), sec('batches', 'Schedule', 'batches'), sec('staff', 'Coaches', 'staff'), sec('facilities', 'Facilities', 'facilities'), sec('admission', 'Admissions', 'admission'), sec('achievements', 'Results', 'achievements'), sec('gallery', 'Gallery', 'gallery'), sec('contact', 'Contact')],
    animation: { style: 'Bar growth, glow', features: ['Intensity bars', 'Hover glow'] }, inspiration: ['Sports-science and performance-lab brands'], note: 'Original layout and code. Chakra Petch and Inter (SIL OFL).'
  },
  {
    id: 'coaching-institute', name: 'Coaching Institute Premium', archetype: 'sports_academy', badge: 'Institute', designStyle: 'Crimson · Charcoal · Course catalogue', styleGroup: 'editorial',
    tagline: 'A professional coaching institute: courses, faculty and a structured admission process.',
    description: 'A formal institute website: a course catalogue with duration and fee summaries, faculty directory, an admission process in numbered steps with required documents, accreditation and achievements, and a contact desk.',
    designDirection: 'Institutional and credible: crimson and charcoal on white, a serif headline and a catalogue layout.', sports: ['any', 'football', 'cricket'],
    highlights: ['Course catalogue with fees and duration', 'Faculty directory', 'Numbered admission steps and documents', 'Accreditation and achievements', 'Admissions desk'],
    tokens: tok('#6B0F1A', '#C21F3A', '#FFFFFF', '#1B1B1D', 'Merriweather', 'Inter', 'Catalogue', '#2A0709'),
    sections: [sec('hero', 'Hero'), sec('programmes', 'Courses', 'programmes'), sec('staff', 'Faculty', 'staff'), sec('admission', 'Admission', 'admission'), sec('batches', 'Timetable', 'batches'), sec('achievements', 'Accreditation', 'achievements'), sec('facilities', 'Campus', 'facilities'), sec('news', 'Notices', 'news'), sec('contact', 'Admissions desk')],
    animation: { style: 'Minimal fades', features: ['Reveal on scroll'] }, inspiration: ['University and professional-institute catalogues'], note: 'Original layout and code. Merriweather and Inter (SIL OFL).'
  },
  {
    id: 'multi-sport-campus', name: 'Multi-Sport Campus', archetype: 'sports_academy', badge: 'Campus', designStyle: 'Ocean · Light · Sport tabs', styleGroup: 'bold',
    tagline: 'A big training campus: choose a sport, see its programmes, coaches and schedule.',
    description: 'A multi-sport campus website: sport tabs that filter programmes, a facilities grid for courts, pitches and pool, a weekly schedule matrix, coaching staff, admissions and a gallery.',
    designDirection: 'Open and active: light ocean blue, white cards and confident sans-serif type.', sports: ['multi_sport'],
    highlights: ['Sport tabs filter programmes', 'Facilities grid', 'Weekly schedule matrix', 'Coaching staff', 'Admissions'],
    tokens: tok('#05507A', '#0A8FBF', '#F2FAFF', '#06283D', 'Outfit', 'Inter', 'Tabs + grid', '#031B34'),
    sections: [sec('hero', 'Campus hero'), sec('programmes', 'Programmes', 'programmes'), sec('facilities', 'Facilities', 'facilities'), sec('batches', 'Schedule', 'batches'), sec('staff', 'Coaches', 'staff'), sec('admission', 'Admissions', 'admission'), sec('gallery', 'Gallery', 'gallery'), sec('news', 'News', 'news'), sec('contact', 'Contact')],
    animation: { style: 'Tab fades, reveals', features: ['Tab transitions', 'Reveal on scroll'] }, inspiration: ['University sports-centre sites'], note: 'Original layout and code. Outfit and Inter (SIL OFL).'
  }
];

export const SPORTS_TEMPLATES = Object.fromEntries(DEFS.map((d) => [d.id, make(d)])) as Record<SportsTemplateId, SportsTemplateDefinition>;

export const SPORTS_TEMPLATE_IDS = DEFS.map((d) => d.id);

export function getSportsTemplateList(archetype?: SportsCategory): SportsTemplateDefinition[] {
  const all = SPORTS_TEMPLATE_IDS.map((id) => SPORTS_TEMPLATES[id]);
  return archetype ? all.filter((t) => t.archetype === archetype) : all;
}

export function getSportsTemplateById(id: string | undefined | null): SportsTemplateDefinition | undefined {
  return id && id in SPORTS_TEMPLATES ? SPORTS_TEMPLATES[id as SportsTemplateId] : undefined;
}

export const isSportsTemplateId = (id: unknown): id is SportsTemplateId => typeof id === 'string' && id in SPORTS_TEMPLATES;

/** Template shown first for each category (the recommended starting point). */
export const DEFAULT_SPORTS_TEMPLATE: Record<SportsCategory, SportsTemplateId> = {
  sports_club: 'premier-elite-club',
  sports_tournament: 'championship-portal',
  sports_academy: 'premier-academy'
};

export const SPORT_FILTERS: { id: SportsFocus | 'all'; label: string }[] = [
  { id: 'all', label: 'All sports' }, { id: 'football', label: 'Football' }, { id: 'cricket', label: 'Cricket' },
  { id: 'basketball', label: 'Basketball' }, { id: 'volleyball', label: 'Volleyball' }, { id: 'multi_sport', label: 'Multi-sport' }
];

export const STYLE_FILTERS: { id: SportsTemplateDefinition['styleGroup'] | 'all'; label: string }[] = [
  { id: 'all', label: 'All styles' }, { id: 'dark', label: 'Dark' }, { id: 'light', label: 'Light' }, { id: 'editorial', label: 'Editorial' },
  { id: 'minimal', label: 'Minimal' }, { id: 'bold', label: 'Bold' }, { id: 'youth', label: 'Youth & community' }
];
