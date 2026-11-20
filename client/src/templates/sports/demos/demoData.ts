import type { ClientRequirements, GeneratedWebsite } from '../../../types/admin';
import type {
  SportsAcademyProgramme, SportsCompetition, SportsFixture, SportsNewsArticle, SportsPlayer, SportsSponsor, SportsStaffMember, SportsStanding,
  SportsTeam, SportsTournamentStage, SportsTrainingBatch, SportsWebsiteData, SportType
} from '../../../types/sports';
import { art, type SportsPaletteName } from '../kit/art';
import type { SportsCategory, SportsTemplateId } from '../types';

/**
 * Demo content for the template gallery and live previews ONLY. Every club, person, sponsor, score and
 * fixture here is fictional, and the preview shows a visible "Sample content" badge. None of it is ever
 * copied into a client project: generated sites render only what the client supplied.
 * Images are generated SVG artwork (kit/art.ts); nothing is hotlinked.
 */

type Flavor = 'football' | 'cricket' | 'basketball' | 'volleyball' | 'multi' | 'athletics';

interface FlavorDef {
  primary: SportType;
  sports: SportType[];
  squads: string[];
  positions: string[];
  suffix: string;
  /** Produces a plausible [home, away] score. */
  score: (n: number) => [number, number];
  verb: (w: number, l: number) => string;
  stat: 'goals' | 'runs' | 'points';
}

const FLAVORS: Record<Flavor, FlavorDef> = {
  football: { primary: 'football', sports: ['football'], squads: ['First Team', 'Reserves', 'Under-18s', 'Women'], positions: ['Goalkeeper', 'Defender', 'Midfielder', 'Striker', 'Winger'], suffix: 'FC', score: (n) => [(n * 7) % 4, (n * 5 + 1) % 3], verb: (w, l) => `Won ${w}–${l}`, stat: 'goals' },
  cricket: { primary: 'cricket', sports: ['cricket'], squads: ['1st XI', '2nd XI', 'Under-19s', 'Women'], positions: ['Opening batter', 'All-rounder', 'Fast bowler', 'Spinner', 'Wicketkeeper'], suffix: 'CC', score: (n) => [150 + ((n * 37) % 90), 140 + ((n * 53) % 90)], verb: (w, l) => `Won by ${Math.abs(w - l)} runs`, stat: 'runs' },
  basketball: { primary: 'basketball', sports: ['basketball'], squads: ['Senior Men', 'Senior Women', 'Under-18s', 'Under-14s'], positions: ['Point guard', 'Shooting guard', 'Forward', 'Centre'], suffix: 'Hoops', score: (n) => [70 + ((n * 11) % 30), 66 + ((n * 17) % 30)], verb: (w, l) => `Won ${w}–${l}`, stat: 'points' },
  volleyball: { primary: 'volleyball', sports: ['volleyball'], squads: ['Senior Men', 'Senior Women', 'Under-18s', 'Juniors'], positions: ['Setter', 'Outside hitter', 'Middle blocker', 'Libero'], suffix: 'VC', score: (n) => [3, n % 3], verb: (w, l) => `Won ${w} sets to ${l}`, stat: 'points' },
  multi: { primary: 'multi_sport', sports: ['football', 'basketball', 'volleyball', 'cricket'], squads: ['Football', 'Basketball', 'Volleyball', 'Cricket'], positions: ['Captain', 'Forward', 'Defender', 'Playmaker'], suffix: 'SC', score: (n) => [(n * 7) % 4 + 1, (n * 5) % 3], verb: (w, l) => `Won ${w}–${l}`, stat: 'points' },
  athletics: { primary: 'athletics', sports: ['athletics', 'swimming'], squads: ['Sprint Group', 'Endurance Group', 'Strength & Conditioning', 'Youth Squad'], positions: ['Sprinter', 'Distance runner', 'Jumper', 'Thrower'], suffix: 'AC', score: (n) => [n % 5, n % 3], verb: () => 'Completed', stat: 'points' }
};

const FIRST = ['Ravi', 'Imran', 'Callum', 'Mateo', 'Tomas', 'Kofi', 'Dev', 'Luka', 'Samir', 'Idris', 'Noah', 'Rohan', 'Elias', 'Kabir', 'Jonas', 'Aarav', 'Mikael', 'Tariq', 'Ayesha', 'Priya', 'Nadia', 'Freya'];
const LAST = ['Whitaker', 'Kapoor', 'Alvarez', 'Okafor', 'Lindgren', 'Bose', 'Marlowe', 'Hasan', 'Petrov', 'Doyle', 'Sato', 'Rahman', 'Costa', 'Ferreira', 'Nair', 'Brandt', 'Quinn', 'Mehra', 'Haddad', 'Ward', 'Iyer', 'Novak'];
const RIVALS = ['Crestwood Rovers', 'Harlow Athletic', 'Millbrook Town', 'Ashford Wanderers', 'Kingsley Rangers', 'Stonebridge City', 'Redcliffe United', 'Oakhaven Albion', 'Linden Park', 'Marsh Vale', 'Fairmont Eagles', 'Dunmore Knights', 'Silverlake Select', 'Thornbury Hawks', 'Westgate Lions', 'Highfield Wolves'];
const personName = (i: number) => `${FIRST[(i * 7) % FIRST.length]} ${LAST[(i * 3 + Math.floor(i / 3) * 5 + 1) % LAST.length]}`;

const day = (offset: number, hour = 15, minute = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};
const dateOnly = (offset: number): string => day(offset).slice(0, 10);

export interface DemoSpec {
  id: SportsTemplateId;
  templateName: string;
  archetype: SportsCategory;
  flavor: Flavor;
  org: string;
  place: string;
  ground: string;
  founded: number;
  palette: SportsPaletteName;
  primary: string;
  accent: string;
  tagline: string;
  about: string;
  /** Optional extra data (for example a smaller squad for a minimal design). */
  trim?: { players?: number; news?: number; gallery?: number };
}

const team = (id: string, name: string, sport: SportType, ageGroup: string, genderCategory: string): SportsTeam => ({ id, name, sport, ageGroup, genderCategory, isActive: true, description: '' });

function buildClubLike(spec: DemoSpec): Omit<SportsWebsiteData, 'club' | 'dataAvailability' | 'schemaVersion'> {
  const f = FLAVORS[spec.flavor];
  const squads = f.squads;
  const sportOf = (i: number): SportType => (spec.flavor === 'multi' ? f.sports[i % f.sports.length] : f.primary);
  const teams: SportsTeam[] = squads.map((s, i) => team(`t${i}`, spec.flavor === 'multi' ? `${spec.place} ${s}` : `${spec.org.split(' ').slice(0, 2).join(' ')} ${s}`, sportOf(i), i === 2 ? 'Under 18' : i === 3 ? (spec.flavor === 'multi' ? 'Open' : 'Senior') : 'Senior', i === 3 && spec.flavor !== 'multi' ? 'Women' : 'Mixed'));
  const playerCount = spec.trim?.players ?? 12;
  const players: SportsPlayer[] = Array.from({ length: playerCount }, (_, i) => ({
    id: `p${i}`, teamId: teams[i % 2 === 0 ? 0 : (i % teams.length)].id, fullName: personName(i), jerseyNumber: i + 1, position: f.positions[i % f.positions.length], status: 'active',
    profileImageUrl: art('portrait', `${spec.org}:${i}`, spec.palette),
    statistics: f.stat === 'goals' ? { appearances: 10 + ((i * 3) % 9), goals: (i * 5) % 11, assists: (i * 3) % 7 } : f.stat === 'runs' ? { matchesPlayed: 8 + (i % 6), runs: 120 + ((i * 97) % 600), wickets: (i * 3) % 14 } : { matchesPlayed: 9 + (i % 6), points: 40 + ((i * 29) % 220) }
  }));
  const staff: SportsStaffMember[] = [
    { id: 's0', fullName: personName(30), role: 'Head Coach', qualifications: ['Level 3 coaching licence'], profileImageUrl: art('portrait', `${spec.org}:coach`, spec.palette) },
    { id: 's1', fullName: personName(31), role: 'Assistant Coach', profileImageUrl: art('portrait', `${spec.org}:asst`, spec.palette) },
    { id: 's2', fullName: personName(32), role: 'Club Chairperson', profileImageUrl: art('portrait', `${spec.org}:chair`, spec.palette) },
    { id: 's3', fullName: personName(33), role: 'Physiotherapist', profileImageUrl: art('portrait', `${spec.org}:physio`, spec.palette) }
  ];
  const competitions: SportsCompetition[] = [{ id: 'c0', name: `${spec.place} ${spec.flavor === 'cricket' ? 'District League' : 'Regional League'}`, sport: f.primary, competitionType: 'league', season: '2026–27' }];
  const fixtures: SportsFixture[] = [
    ...[3, 10, 17].map((o, i): SportsFixture => ({ id: `fx${i}`, competitionId: 'c0', teamId: 't0', opponentName: `${RIVALS[i]} ${f.suffix}`, scheduledAt: day(o, 15 + (i % 2)), venue: i % 2 ? `${RIVALS[i]} Ground` : spec.ground, status: 'scheduled', homeOrAway: i % 2 ? 'away' : 'home', round: `Round ${10 + i}` })),
    ...[-4, -11, -18, -25].map((o, i): SportsFixture => {
      const [h, a] = f.score(i + 2);
      const away = i % 2 === 1;
      const ours = away ? a : h; const theirs = away ? h : a;
      return { id: `rs${i}`, competitionId: 'c0', teamId: 't0', opponentName: `${RIVALS[i + 3]} ${f.suffix}`, scheduledAt: day(o, 15), venue: away ? `${RIVALS[i + 3]} Ground` : spec.ground, status: 'completed', homeOrAway: away ? 'away' : 'home', homeScore: h, awayScore: a, round: `Round ${9 - i}`, resultSummary: ours > theirs ? f.verb(ours, theirs) : ours === theirs ? 'Honours even' : `Lost ${ours}–${theirs}` };
    })
  ];
  const rowsFor = [spec.org, ...RIVALS.slice(2, 9).map((r) => `${r} ${f.suffix}`)];
  const standings: SportsStanding[] = rowsFor.map((n, i) => {
    const w = 8 - i, d = i % 3, l = 9 - w - d;
    return { competitionId: 'c0', teamId: i === 0 ? 't0' : `x${i}`, teamName: i === 0 ? undefined : n, position: i + 1, played: 9, won: w, drawn: d, lost: Math.max(l, 0), goalsFor: 20 - i * 2, goalsAgainst: 8 + i * 2, points: w * 3 + d, form: ['W', 'W', 'D', 'W', 'L'].slice(i % 2) };
  });
  const sponsors: SportsSponsor[] = ['Halden Motors', 'Brightside Dental', 'Kestrel Insurance', 'Pennant Brewing Co.', 'Orchard Fitness'].map((n, i) => ({ id: `sp${i}`, name: n, sponsorshipLevel: i < 2 ? 'Principal partner' : 'Club partner', displayOrder: i + 1 }));
  const news: SportsNewsArticle[] = [
    { id: 'n0', title: `${spec.org} secure a statement win`, summary: 'A composed second-half display settled a tight contest and lifts the club into the top three.', publishedAt: dateOnly(-4), category: 'Match report', isPublished: true, coverImageUrl: art('action', `${spec.org}:n0`, spec.palette) },
    { id: 'n1', title: 'Junior registrations are now open', summary: 'Boys and girls aged 6 to 16 can sign up for the new season at the clubhouse or online.', publishedAt: dateOnly(-8), category: 'Club news', isPublished: true, coverImageUrl: art('crowd', `${spec.org}:n1`, spec.palette) },
    { id: 'n2', title: 'Volunteer day at the ground', summary: 'Help us paint, plant and prepare the pitch ahead of the next home fixture.', publishedAt: dateOnly(-13), category: 'Community', isPublished: true, coverImageUrl: art('mesh', `${spec.org}:n2`, spec.palette) },
    { id: 'n3', title: 'New partnership announced', summary: 'We welcome a local partner to support the youth programme for the coming three seasons.', publishedAt: dateOnly(-20), category: 'Partners', isPublished: true, coverImageUrl: art('trophy', `${spec.org}:n3`, spec.palette) }
  ].slice(0, spec.trim?.news ?? 4);
  return { teams, players, staff, competitions, fixtures, standings, matchEvents: [], sponsors, news, pages: [], sections: [] };
}

function buildTournamentLike(spec: DemoSpec): Omit<SportsWebsiteData, 'club' | 'dataAvailability' | 'schemaVersion'> {
  const f = FLAVORS[spec.flavor];
  const names = RIVALS.slice(0, 8).map((r) => `${r} ${f.suffix}`);
  const teams: SportsTeam[] = names.map((n, i) => ({ ...team(`t${i}`, n, f.primary, 'Open', 'Mixed'), description: `Entered from ${spec.place} region.` }));
  const competitions: SportsCompetition[] = [
    { id: 'ga', name: 'Group A', sport: f.primary, competitionType: 'tournament', season: '2027' },
    { id: 'gb', name: 'Group B', sport: f.primary, competitionType: 'tournament', season: '2027' }
  ];
  const standings: SportsStanding[] = names.map((_n, i) => {
    const g = i < 4 ? 'ga' : 'gb', pos = (i % 4) + 1, w = 3 - (pos - 1), d = pos === 2 ? 1 : 0;
    return { competitionId: g, teamId: `t${i}`, position: pos, played: 3, won: Math.max(w, 0), drawn: d, lost: Math.max(3 - Math.max(w, 0) - d, 0), goalsFor: 8 - pos * 2 + 2, goalsAgainst: pos * 2, points: Math.max(w, 0) * 3 + d, form: ['W', 'W', 'D'].slice(pos - 1) };
  });
  const fixtures: SportsFixture[] = [
    ...[2, 3, 5, 6].map((o, i): SportsFixture => ({ id: `fx${i}`, competitionId: i % 2 ? 'gb' : 'ga', teamId: `t${i % 2 ? 4 + (i % 4) : (i % 4)}`, opponentName: names[(i % 2 ? 4 : 0) + ((i + 1) % 4)], scheduledAt: day(o, 16 + (i % 2) * 2), venue: i % 2 ? 'North Arena' : 'Central Stadium', status: 'scheduled', homeOrAway: 'neutral', round: 'Matchday 4' })),
    ...[-1, -2, -4, -5].map((o, i): SportsFixture => {
      const [h, a] = f.score(i + 3);
      return { id: `rs${i}`, competitionId: i % 2 ? 'gb' : 'ga', teamId: `t${i % 2 ? 4 + (i % 4) : (i % 4)}`, opponentName: names[(i % 2 ? 4 : 0) + ((i + 2) % 4)], scheduledAt: day(o, 17), venue: 'Central Stadium', status: 'completed', homeOrAway: 'neutral', homeScore: h, awayScore: a, round: 'Matchday 3' };
    })
  ];
  const mk = (id: string, round: string, a: string, b: string, sc?: [number, number], offset = 8, status: SportsFixture['status'] = 'scheduled'): SportsTournamentStage['matches'][number] => ({ id, roundName: round, homeTeamName: a, awayTeamName: b, homeScore: sc?.[0], awayScore: sc?.[1], scheduledAt: day(offset, 17), venue: 'Central Stadium', status: sc ? 'completed' : status, winner: sc ? (sc[0] > sc[1] ? 'home' : sc[0] < sc[1] ? 'away' : 'draw') : undefined });
  const tournamentStages: SportsTournamentStage[] = [
    { id: 'qf', name: 'Quarter-finals', stageOrder: 1, stageType: 'quarter_final', status: 'in_progress', matches: [mk('q1', 'QF 1', names[0], names[5], [2, 1], -1), mk('q2', 'QF 2', names[4], names[1], [0, 1], -1), mk('q3', 'QF 3', names[2], names[7], undefined, 8), mk('q4', 'QF 4', names[6], names[3], undefined, 8)] },
    { id: 'sf', name: 'Semi-finals', stageOrder: 2, stageType: 'semi_final', status: 'upcoming', matches: [mk('s1', 'SF 1', names[0], 'Winner QF 3', undefined, 12), mk('s2', 'SF 2', names[1], 'Winner QF 4', undefined, 12)] },
    { id: 'fn', name: 'Final', stageOrder: 3, stageType: 'final', status: 'upcoming', matches: [mk('f1', 'Final', 'Winner SF 1', 'Winner SF 2', undefined, 16)] }
  ];
  const sponsors: SportsSponsor[] = ['Halden Motors', 'Brightside Dental', 'Kestrel Insurance', 'Pennant Brewing Co.'].map((n, i) => ({ id: `sp${i}`, name: n, sponsorshipLevel: i < 1 ? 'Title partner' : 'Official partner', displayOrder: i + 1 }));
  const news: SportsNewsArticle[] = [
    { id: 'n0', title: 'Quarter-final line-up confirmed', summary: 'Eight sides become four after a dramatic final day of the group stage.', publishedAt: dateOnly(-1), category: 'Tournament news', isPublished: true, coverImageUrl: art('action', `${spec.org}:n0`, spec.palette) },
    { id: 'n1', title: 'Ticket and entry information', summary: 'Entry is free for under-12s; gates open ninety minutes before kick-off.', publishedAt: dateOnly(-6), category: 'Information', isPublished: true, coverImageUrl: art('crowd', `${spec.org}:n1`, spec.palette) },
    { id: 'n2', title: 'Fixture changes for the weekend', summary: 'Two matches move to the evening slot because of the floodlight upgrade.', publishedAt: dateOnly(-9), category: 'Schedule', isPublished: true, coverImageUrl: art('stadium', `${spec.org}:n2`, spec.palette) }
  ].slice(0, spec.trim?.news ?? 3);
  return { teams, players: [], staff: [], competitions, fixtures, standings, matchEvents: [], sponsors, news, pages: [], sections: [], tournamentStages };
}

function buildAcademyLike(spec: DemoSpec): Omit<SportsWebsiteData, 'club' | 'dataAvailability' | 'schemaVersion'> {
  const f = FLAVORS[spec.flavor];
  const staff: SportsStaffMember[] = ['Head of Coaching', 'Youth Development Coach', 'Strength & Conditioning Coach', 'Goalkeeping / Specialist Coach'].map((role, i) => ({
    id: `s${i}`, fullName: personName(40 + i), role, qualifications: i === 0 ? ['Advanced coaching licence', 'First-aid certified'] : ['Certified coach'], profileImageUrl: art('portrait', `${spec.org}:c${i}`, spec.palette), biography: 'Works with players on technique, decision-making and long-term development.'
  }));
  const academyProgrammes: SportsAcademyProgramme[] = [
    { id: 'pr0', title: 'Foundation (Little Stars)', sport: f.primary, ageGroup: '6–9 years', duration: '10 months', description: 'Movement skills, ball familiarity and confidence through play.', feeStructure: 'Monthly plan', curriculumHighlights: ['Fundamental movement', 'Small-sided games', 'Teamwork'], coachIds: ['s1'], isActive: true },
    { id: 'pr1', title: 'Development Squad', sport: f.primary, ageGroup: '10–14 years', duration: '10 months', description: 'Technical sessions, tactical awareness and monthly match exposure.', feeStructure: 'Monthly plan', curriculumHighlights: ['Technical drills', 'Tactical sessions', 'Match play'], coachIds: ['s0', 's1'], isActive: true },
    { id: 'pr2', title: 'Performance Pathway', sport: f.primary, ageGroup: '15–18 years', duration: '12 months', description: 'High-intensity training, video analysis and competition preparation.', feeStructure: 'Termly plan', curriculumHighlights: ['Strength & conditioning', 'Video analysis', 'Competition prep'], coachIds: ['s0', 's2'], isActive: true },
    { id: 'pr3', title: 'Holiday Camps', sport: f.primary, ageGroup: '7–15 years', duration: '1–2 weeks', description: 'Intensive skills camps during school holidays with certified coaches.', feeStructure: 'Per camp', curriculumHighlights: ['Skills circuits', 'Mini-tournaments'], coachIds: ['s1'], isActive: true }
  ];
  const trainingBatches: SportsTrainingBatch[] = [
    { id: 'b0', programmeId: 'pr0', name: 'Little Stars A', ageGroup: '6–9', daysOfWeek: ['Mon', 'Wed'], startTime: '16:00', endTime: '17:00', venue: 'Training Ground 1', coachName: staff[1].fullName, maxCapacity: 20 },
    { id: 'b1', programmeId: 'pr0', name: 'Little Stars B', ageGroup: '6–9', daysOfWeek: ['Sat'], startTime: '09:00', endTime: '10:30', venue: 'Training Ground 1', coachName: staff[1].fullName, maxCapacity: 20 },
    { id: 'b2', programmeId: 'pr1', name: 'Development U12', ageGroup: '10–12', daysOfWeek: ['Tue', 'Thu'], startTime: '17:00', endTime: '18:30', venue: 'Main Pitch', coachName: staff[0].fullName, maxCapacity: 24 },
    { id: 'b3', programmeId: 'pr1', name: 'Development U14', ageGroup: '13–14', daysOfWeek: ['Tue', 'Thu', 'Sat'], startTime: '18:30', endTime: '20:00', venue: 'Main Pitch', coachName: staff[0].fullName, maxCapacity: 24 },
    { id: 'b4', programmeId: 'pr2', name: 'Performance Squad', ageGroup: '15–18', daysOfWeek: ['Mon', 'Wed', 'Fri'], startTime: '06:30', endTime: '08:00', venue: 'Main Pitch', coachName: staff[2].fullName, maxCapacity: 18 },
    { id: 'b5', programmeId: 'pr3', name: 'Holiday Camp', ageGroup: '7–15', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], startTime: '09:00', endTime: '13:00', venue: 'Training Ground 2', coachName: staff[1].fullName, maxCapacity: 40 }
  ];
  const news: SportsNewsArticle[] = [
    { id: 'n0', title: 'Admissions open for the new season', summary: 'Trials for every age group run over two weekends. Register your child to reserve a slot.', publishedAt: dateOnly(-3), category: 'Admissions', isPublished: true, coverImageUrl: art('action', `${spec.org}:n0`, spec.palette) },
    { id: 'n1', title: 'New floodlit training ground opens', summary: 'A second all-weather pitch lets us run evening sessions all year.', publishedAt: dateOnly(-12), category: 'Facilities', isPublished: true, coverImageUrl: art('stadium', `${spec.org}:n1`, spec.palette) }
  ];
  return { teams: [], players: [], staff, competitions: [], fixtures: [], standings: [], matchEvents: [], sponsors: [], news, pages: [], sections: [], academyProgrammes, trainingBatches };
}

function build(spec: DemoSpec): { requirements: ClientRequirements; sportsData: SportsWebsiteData; website: GeneratedWebsite } {
  const f = FLAVORS[spec.flavor];
  const base = spec.archetype === 'sports_tournament' ? buildTournamentLike(spec) : spec.archetype === 'sports_academy' ? buildAcademyLike(spec) : buildClubLike(spec);
  const cover = art(spec.flavor === 'cricket' ? 'cricket' : spec.flavor === 'basketball' || spec.flavor === 'volleyball' ? 'court' : spec.flavor === 'athletics' ? 'track' : 'stadium', spec.org, spec.palette);
  const galleryCount = spec.trim?.gallery ?? 8;
  const kinds = ['action', 'pitch', 'crowd', 'stadium', 'trophy', 'mesh', 'net', 'stripes'] as const;
  const gallery = Array.from({ length: galleryCount }, (_, i) => ({ id: `g${i}`, url: art(kinds[i % kinds.length], `${spec.org}:g${i}`, spec.palette), caption: ['Matchday', 'Training', 'Supporters', 'Under the lights', 'Silverware', 'Behind the scenes', 'Goal frame', 'Colours'][i % 8], category: i % 2 ? 'Training' : 'Matchday' }));
  const sportsData: SportsWebsiteData = {
    schemaVersion: '1.0',
    club: {
      organizationName: spec.org, sportTypes: f.sports, organizationType: spec.archetype === 'sports_academy' ? 'sports_academy' : spec.archetype === 'sports_tournament' ? 'tournament_organizer' : 'sports_club',
      tagline: spec.tagline, description: spec.about, foundedYear: spec.founded, homeGround: spec.ground, headquarters: spec.place, coverImageUrl: cover,
      primaryColor: spec.primary, accentColor: spec.accent, nickname: spec.archetype === 'sports_club' ? 'The ' + spec.org.split(' ')[0] + 's' : undefined,
      mission: 'To give everyone in our community a place to play, improve and belong.', vision: 'A thriving club that develops people as well as players.',
      values: ['Respect', 'Effort', 'Teamwork', 'Inclusion'],
      history: `${spec.org} began with a handful of local players and a borrowed pitch. Decades later the club runs teams for every age, welcomes thousands of visitors each season and is still run by its community.`,
      historyTimeline: [{ year: String(spec.founded), title: 'Club founded', description: 'First match played on a borrowed field.' }, { year: String(spec.founded + 24), title: 'New home', description: `Moved into ${spec.ground}.` }, { year: String(spec.founded + 48), title: 'Youth programme launched' }, { year: String(spec.founded + 60), title: 'Women’s and girls’ teams formed' }],
      achievements: ['Regional league champions (sample)', 'Community Club of the Year (sample)']
    },
    ...base,
    gallery,
    tournamentInfo: spec.archetype === 'sports_tournament' ? {
      edition: `${new Date().getFullYear()} Edition`, format: 'group_knockout', formatDescription: 'Eight teams in two groups of four. The top two from each group reach the knockout rounds.', matchFormat: f.primary === 'cricket' ? '20 overs a side' : '2 × 40 minutes',
      startDate: dateOnly(-8), endDate: dateOnly(16), location: spec.place, registrationInfo: 'Registration for the next edition opens after the final. Contact the organisers.', prizeInfo: 'Trophy and medals for the top three, with awards for the best player and top scorer.', ticketInfo: 'Free entry; gates open 90 minutes before the first match.',
      rules: ['Each squad may register up to 16 players.', 'Group matches are 40 minutes with a 5-minute break.', 'Points: 3 for a win, 1 for a draw, 0 for a loss.', 'Ties are separated by goal difference, then goals scored, then head-to-head.', 'Knockout matches go to penalties if level.', 'The referee’s decision is final.'],
      venues: [{ id: 'v0', name: 'Central Stadium', address: `${spec.place} City Centre`, capacity: 5000, notes: 'Final and semi-finals' }, { id: 'v1', name: 'North Arena', address: `${spec.place} North`, capacity: 1800, notes: 'Group matches' }, { id: 'v2', name: 'Riverside Ground', address: `${spec.place} Riverside`, capacity: 1200, notes: 'Group matches' }]
    } : undefined,
    academyInfo: spec.archetype === 'sports_academy' ? {
      philosophy: 'We develop confident, capable athletes by teaching the game, not just drills: every session has a purpose, every player a pathway.',
      facilities: [{ id: 'f0', name: 'Main Pitch', description: 'Full-size floodlit pitch with a quality surface.', imageUrl: art('pitch', `${spec.org}:f0`, spec.palette) }, { id: 'f1', name: 'Training Ground 1', description: 'Small-sided area for foundation squads.', imageUrl: art('net', `${spec.org}:f1`, spec.palette) }, { id: 'f2', name: 'Performance Gym', description: 'Strength and conditioning with certified supervision.', imageUrl: art('stripes', `${spec.org}:f2`, spec.palette) }, { id: 'f3', name: 'Classroom & Video Room', description: 'Tactical sessions and match analysis.', imageUrl: art('mesh', `${spec.org}:f3`, spec.palette) }],
      ageGroups: ['6–9', '10–12', '13–14', '15–18'],
      admission: { process: 'Book a free trial session, meet the coaching team, then confirm a batch.', eligibility: 'Open to players aged 6 to 18 of all ability levels.', feeSummary: 'Monthly and termly plans; sibling discounts available.', documentsRequired: ['Age proof', 'Passport photograph', 'Medical fitness form'], trialInfo: 'Trials run every Saturday morning.', intakeDates: 'Quarterly intakes: January, April, July, October' },
      achievements: [{ id: 'a0', title: 'Under-14 regional runners-up', year: '2026', description: 'Sample entry' }, { id: 'a1', title: 'Players selected for district squads', year: '2025', description: 'Sample entry' }, { id: 'a2', title: 'Certified-coach accreditation', year: '2024' }],
      testimonials: [{ id: 'ts0', quote: 'My daughter gained confidence in a single term. The coaches are patient and clear.', author: 'A parent (sample)', role: 'Parent' }, { id: 'ts1', quote: 'The structure and video sessions changed how I read the game.', author: 'A senior player (sample)', role: 'Player' }]
    } : undefined,
    dataAvailability: { teams: false, players: false, staff: false, competitions: false, fixtures: false, standings: false, sponsors: false, news: true, gallery: true }
  };
  sportsData.dataAvailability = {
    teams: sportsData.teams.length > 0, players: sportsData.players.length > 0, staff: sportsData.staff.length > 0, competitions: sportsData.competitions.length > 0,
    fixtures: sportsData.fixtures.length > 0, standings: sportsData.standings.length > 0, sponsors: sportsData.sponsors.length > 0, news: sportsData.news.length > 0,
    tournamentStages: (sportsData.tournamentStages?.length || 0) > 0, academyProgrammes: (sportsData.academyProgrammes?.length || 0) > 0, trainingBatches: (sportsData.trainingBatches?.length || 0) > 0,
    gallery: gallery.length > 0, tournamentInfo: Boolean(sportsData.tournamentInfo), academyInfo: Boolean(sportsData.academyInfo)
  };
  const selectedTemplate = { templateId: spec.id, templateVersion: '1.0.0', templateName: spec.templateName, websiteCategory: spec.archetype, selectedAt: '2026-01-01T00:00:00.000Z' };
  const slug = spec.org.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const requirements = {
    organizationName: spec.org, category: 'sports', organizationType: 'sports', sportsArchetype: spec.archetype, tagline: spec.tagline, aboutText: spec.about,
    contactEmail: `hello@${slug}.example`, contactPhone: '+00 000 000 0000', address: `${spec.ground}, ${spec.place}`, primaryColor: spec.primary, accentColor: spec.accent,
    logoUrl: undefined, coverImageUrl: cover, socialLinks: { facebook: 'https://facebook.example/club', instagram: 'https://instagram.example/club', youtube: 'https://youtube.example/club' },
    enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true }, events: [], committee: [], gallery: [],
    designSelection: { mode: 'template', modelId: spec.archetype }, sportsData, selectedTemplate
  } as unknown as ClientRequirements;
  const website: GeneratedWebsite = {
    themeAccent: spec.id, layoutPreset: 'editorial', fontFamily: 'Inter, sans-serif', simulatedDomain: `${slug}.example`, heroHeadline: spec.org, heroDescription: spec.tagline, heroImage: cover,
    metrics: [], eventsTitle: '', eventsList: [], aboutContent: spec.about, committeeTitle: '', committeeList: [], galleryTitle: '', galleryList: [], sportsData, selectedTemplate
  };
  return { requirements, sportsData, website };
}

const S = (s: DemoSpec) => () => build(s);

/** One entry per template: the fictional organisation that fills the template in the library. */
export const DEMO_SPECS: Record<SportsTemplateId, DemoSpec> = {
  'premier-elite-club': { id: 'premier-elite-club', templateName: 'Premier Elite Club', archetype: 'sports_club', flavor: 'football', org: 'Northbridge United FC', place: 'Northbridge', ground: 'Riverside Park Stadium', founded: 1962, palette: 'royal', primary: '#0A1A4A', accent: '#F5C542', tagline: 'Pride of the north since 1962.', about: 'A professional football club with a proud local identity, an ambitious first team and one of the region’s most respected youth pathways.' },
  'matchday-modern': { id: 'matchday-modern', templateName: 'Matchday Modern', archetype: 'sports_club', flavor: 'football', org: 'Riverside City FC', place: 'Riverside', ground: 'Canal Street Ground', founded: 1998, palette: 'volt', primary: '#0C1200', accent: '#D6FF3D', tagline: 'Fast football. Loud ground. Every matchday.', about: 'A modern football club built around attacking football, a young squad and a matchday experience supporters actually enjoy.' },
  'willow-and-wicket': { id: 'willow-and-wicket', templateName: 'Willow & Wicket', archetype: 'sports_club', flavor: 'cricket', org: 'Harbour City Cricket Club', place: 'Harbourtown', ground: 'The Pavilion Oval', founded: 1887, palette: 'paper', primary: '#14532D', accent: '#B8892B', tagline: 'Cricket at its best since 1887.', about: 'A traditional cricket club with a handsome pavilion, three senior elevens and a thriving junior section.' },
  'floodlight-night': { id: 'floodlight-night', templateName: 'Floodlight Night', archetype: 'sports_club', flavor: 'football', org: 'Eastgate Athletic', place: 'Eastgate', ground: 'Floodlight Arena', founded: 1975, palette: 'night', primary: '#050A18', accent: '#3A6BFF', tagline: 'Friday nights belong to us.', about: 'A club that plays under the lights and fills the stands: dark, dramatic and fiercely local.' },
  'club-journal': { id: 'club-journal', templateName: 'The Club Journal', archetype: 'sports_club', flavor: 'football', org: 'Marlowe Rangers', place: 'Marlowe', ground: 'The Common', founded: 1921, palette: 'paper', primary: '#2A2418', accent: '#C21F3A', tagline: 'A club, a town and its stories.', about: 'An old club with a good memory. We cover our own matches, our own people and our own history.' },
  'clean-sheet': { id: 'clean-sheet', templateName: 'Clean Sheet', archetype: 'sports_club', flavor: 'football', org: 'Thornfield Town', place: 'Thornfield', ground: 'Station Road', founded: 2004, palette: 'mono', primary: '#111111', accent: '#1F9954', tagline: 'Simple, honest football.', about: 'A small, well-run club that cares about fixtures, results and the people who turn up every week.', trim: { players: 8, news: 3, gallery: 6 } },
  'community-pitch': { id: 'community-pitch', templateName: 'Community Pitch', archetype: 'sports_club', flavor: 'volleyball', org: 'Greenway Community Sports', place: 'Greenway', ground: 'Greenway Community Hall', founded: 2011, palette: 'mint', primary: '#0B5A56', accent: '#F0457A', tagline: 'Sport for everyone in Greenway.', about: 'A volunteer-run community club offering volleyball, fitness and family sport sessions for all ages.' },
  'multi-sport-union': { id: 'multi-sport-union', templateName: 'Multi-Sport Union', archetype: 'sports_club', flavor: 'multi', org: 'Eastfield Sports Union', place: 'Eastfield', ground: 'Eastfield Sports Complex', founded: 1983, palette: 'sunrise', primary: '#2B1055', accent: '#FF9A3C', tagline: 'Four sports. One union.', about: 'A multi-sport union running football, basketball, volleyball and cricket under one roof, with shared facilities and one friendly community.' },

  'championship-portal': { id: 'championship-portal', templateName: 'Championship Portal', archetype: 'sports_tournament', flavor: 'football', org: 'Crown Cup Championship', place: 'Crownfield', ground: 'Central Stadium', founded: 2012, palette: 'clay', primary: '#1E1A17', accent: '#E8743B', tagline: 'The region’s premier knockout championship.', about: 'An annual championship bringing the region’s best amateur sides together over three weeks.' },
  'cup-night-football': { id: 'cup-night-football', templateName: 'Cup Night Football', archetype: 'sports_tournament', flavor: 'football', org: 'Lakeside Cup', place: 'Lakeside', ground: 'Lakeside Stadium', founded: 2017, palette: 'turf', primary: '#0B3D23', accent: '#8DE0A6', tagline: 'Sixteen days. Eight teams. One cup.', about: 'A community football tournament with group nights, knockout rounds and a big final.' },
  'cricket-league-centre': { id: 'cricket-league-centre', templateName: 'Cricket League Centre', archetype: 'sports_tournament', flavor: 'cricket', org: 'Meridian District League', place: 'Meridian', ground: 'Meridian Oval', founded: 2009, palette: 'ocean', primary: '#031B34', accent: '#58D0E8', tagline: 'T20 cricket for the district.', about: 'The district’s Twenty20 league, run over weekends with live tables, fixtures and scorecards.' },
  'bracket-board': { id: 'bracket-board', templateName: 'Bracket Board', archetype: 'sports_tournament', flavor: 'basketball', org: 'Metro 3×3 Open', place: 'Metro City', ground: 'Metro Arena', founded: 2019, palette: 'violet', primary: '#160A33', accent: '#C09BFF', tagline: 'Win or go home.', about: 'A fast, city-wide 3×3 basketball knockout with brackets that update through the day.' },
  'global-games': { id: 'global-games', templateName: 'Global Games', archetype: 'sports_tournament', flavor: 'multi', org: 'Continental Games', place: 'Aurora', ground: 'Aurora Olympic Park', founded: 2001, palette: 'sunrise', primary: '#2B1055', accent: '#FF9A3C', tagline: 'Nations. Sport. Together.', about: 'An international multi-sport competition bringing teams from across the continent to one host city.' },
  'tournament-gazette': { id: 'tournament-gazette', templateName: 'Tournament Gazette', archetype: 'sports_tournament', flavor: 'football', org: 'Old Town Invitational', place: 'Old Town', ground: 'The Recreation Ground', founded: 1949, palette: 'paper', primary: '#2A2418', accent: '#C21F3A', tagline: 'Seventy-seven years of the Invitational.', about: 'One of the longest-running invitational tournaments in the region, reported in the style of a matchday programme.' },
  'fixtures-results-desk': { id: 'fixtures-results-desk', templateName: 'Fixtures & Results Desk', archetype: 'sports_tournament', flavor: 'volleyball', org: 'City Volleyball League', place: 'Bayview', ground: 'Bayview Sports Hall', founded: 2015, palette: 'mint', primary: '#062B2B', accent: '#7FE5CE', tagline: 'Every fixture, every result, in one place.', about: 'A weekly volleyball league with divisions, tables and a complete fixtures and results desk.' },
  'knockout-minimal': { id: 'knockout-minimal', templateName: 'Knockout Minimal', archetype: 'sports_tournament', flavor: 'football', org: 'Parkside Five-a-Side', place: 'Parkside', ground: 'Parkside Pitches', founded: 2020, palette: 'mono', primary: '#111111', accent: '#C21F3A', tagline: 'Five-a-side knockout, kept simple.', about: 'A one-day five-a-side knockout with a clear bracket and nothing in the way.', trim: { news: 2, gallery: 4 } },

  'premier-academy': { id: 'premier-academy', templateName: 'Premier Academy', archetype: 'sports_academy', flavor: 'football', org: 'Apex Football Academy', place: 'Apexton', ground: 'Apex Performance Centre', founded: 2008, palette: 'royal', primary: '#0A1A4A', accent: '#F5C542', tagline: 'Where serious young players are made.', about: 'A premium football academy offering structured pathways from age six to eighteen, with qualified coaches and modern facilities.' },
  'pitch-academy': { id: 'pitch-academy', templateName: 'Pitch Academy', archetype: 'sports_academy', flavor: 'football', org: 'Greenfield Football School', place: 'Greenfield', ground: 'Greenfield Training Ground', founded: 2014, palette: 'turf', primary: '#0B3D23', accent: '#8DE0A6', tagline: 'Technique first. Always.', about: 'A modern football training academy focused on technical development, small-sided games and match confidence.' },
  'coaching-crease': { id: 'coaching-crease', templateName: 'Coaching Crease', archetype: 'sports_academy', flavor: 'cricket', org: 'Crease Cricket Coaching', place: 'Brookvale', ground: 'Brookvale Nets & Oval', founded: 2006, palette: 'paper', primary: '#14532D', accent: '#B8892B', tagline: 'Net sessions that build real cricketers.', about: 'Professional cricket coaching with indoor and outdoor nets, bowling machines and age-group batches.' },
  'rising-stars': { id: 'rising-stars', templateName: 'Rising Stars', archetype: 'sports_academy', flavor: 'multi', org: 'Rising Stars Youth Sports', place: 'Sunnyside', ground: 'Sunnyside Youth Centre', founded: 2016, palette: 'sunrise', primary: '#7A2E8E', accent: '#FF9A3C', tagline: 'Play. Grow. Shine.', about: 'A friendly youth development academy introducing children to football, basketball and athletics.' },
  'learn-and-play': { id: 'learn-and-play', templateName: 'Learn & Play', archetype: 'sports_academy', flavor: 'multi', org: 'Learn & Play Sports School', place: 'Maple Grove', ground: 'Maple Grove Hall', founded: 2012, palette: 'mint', primary: '#0B5A56', accent: '#F0457A', tagline: 'Sport education for every child.', about: 'A calm, minimal sports education programme combining physical literacy, skills and character.', trim: { news: 1, gallery: 4 } },
  'performance-lab': { id: 'performance-lab', templateName: 'Performance Lab', archetype: 'sports_academy', flavor: 'athletics', org: 'Velocity Athletic Lab', place: 'Highgate', ground: 'Velocity Track & Gym', founded: 2018, palette: 'night', primary: '#050A18', accent: '#3A6BFF', tagline: 'Measure it. Train it. Win with it.', about: 'An athletic performance lab offering sprint, endurance and strength programmes backed by testing and analysis.' },
  'coaching-institute': { id: 'coaching-institute', templateName: 'Coaching Institute Premium', archetype: 'sports_academy', flavor: 'football', org: 'National Coaching Institute', place: 'Capital City', ground: 'Institute Campus', founded: 1995, palette: 'crimson', primary: '#2A0709', accent: '#FF6B7D', tagline: 'Qualified coaches. Better sport.', about: 'A professional institute that trains and certifies coaches, alongside its own elite player programmes.' },
  'multi-sport-campus': { id: 'multi-sport-campus', templateName: 'Multi-Sport Campus', archetype: 'sports_academy', flavor: 'multi', org: 'Summit Sports Campus', place: 'Summit', ground: 'Summit Campus', founded: 2010, palette: 'ocean', primary: '#031B34', accent: '#58D0E8', tagline: 'Everything you need to train, in one campus.', about: 'A large multi-sport training centre with courts, pitches, a pool and structured programmes for every age.' }
};

export const DEMO_BUILDERS = Object.fromEntries(
  (Object.keys(DEMO_SPECS) as SportsTemplateId[]).map((id) => [id, S(DEMO_SPECS[id])])
) as Record<SportsTemplateId, () => ReturnType<typeof build>>;
