import type { SportsTemplateProps } from '../types';
import type {
  SportsFixture, SportsPlayer, SportsStaffMember, SportsTeam, SportsTournamentMatch, SportType
} from '../../../types/sports';
import { crestUri, art, type SportsPaletteName } from './art';

/**
 * Turns SportsWebsiteData (many optional datasets) into one stable shape every Sports template reads.
 * Missing content never throws: a dataset the client did not supply reports `has.x === false` and the
 * template hides that section, so a sparse profile still renders as a finished design and nothing is invented.
 */

export interface NSocial { key: string; label: string; url: string }
export interface NTeam { id: string; name: string; sport: string; ageGroup?: string; gender?: string; description?: string; logo?: string; playerCount: number }
export interface NPlayer { id: string; name: string; number?: number; position?: string; team: string; teamId: string; photo?: string; hasPhoto: boolean; bio?: string; status: string; stats: { label: string; value: string }[] }
export interface NStaff { id: string; name: string; role: string; bio?: string; photo?: string; hasPhoto: boolean; qualifications: string[] }
export interface NFixture {
  id: string; teamId: string; competition?: string; round?: string; homeName: string; awayName: string; homeScore?: number; awayScore?: number;
  status: string; live: boolean; completed: boolean; iso: string; date: Date | null; venue?: string; summary?: string; report?: string;
  highlights?: string; /** W / D / L from our team's point of view, when scores exist. */ outcome?: 'W' | 'D' | 'L'; ourSide: 'home' | 'away'; hasScore: boolean;
}
export interface NStandingRow { position: number; name: string; played: number; won: number; drawn: number; lost: number; gf?: number; ga?: number; gd?: number; points: number; form: string[]; isUs: boolean }
export interface NStandingGroup { competition: string; rows: NStandingRow[] }
export interface NBracketMatch { id: string; home: string; away: string; homeScore?: number; awayScore?: number; status: string; winner?: 'home' | 'away' | 'draw'; date: Date | null; venue?: string }
export interface NStage { id: string; name: string; type: string; status: string; matches: NBracketMatch[] }
export interface NNews { id: string; title: string; summary?: string; content?: string; date: Date | null; image?: string; category?: string; author?: string }
export interface NSponsor { id: string; name: string; level?: string; url?: string; logo?: string; description?: string }
export interface NPhoto { id: string; src: string; caption: string; category: string }
export interface NVideo { id: string; embed: string; thumb: string; title: string }
export interface NProgramme { id: string; title: string; sport: string; ageGroup: string; duration: string; description: string; fee?: string; highlights: string[]; coach?: string }
export interface NBatch { id: string; name: string; programme?: string; ageGroup: string; days: string[]; start: string; end: string; venue: string; coach?: string; capacity?: number }
export interface NFacility { id: string; name: string; description?: string; image?: string }
export interface NAchievement { id: string; title: string; year?: string; description?: string }
export interface NTestimonial { id: string; quote: string; author: string; role?: string }
export interface NVenue { id: string; name: string; address?: string; capacity?: number; notes?: string; image?: string }
export interface NStat { value: string; label: string }

export interface NormalizedSports {
  name: string; shortName: string; initials: string; nickname?: string; tagline: string; description: string;
  sport: string; sports: string[]; founded?: number; homeGround?: string; location?: string;
  logo: string; hasLogo: boolean; cover: string; hasCover: boolean;
  brand: { primary?: string; accent?: string };
  email?: string; phone?: string; address?: string; whatsapp?: string; socials: NSocial[];
  mission?: string; vision?: string; values: string[]; history?: string; timeline: { year: string; title: string; description?: string }[];
  clubAchievements: string[];
  teams: NTeam[]; players: NPlayer[]; staff: NStaff[];
  fixtures: NFixture[]; results: NFixture[]; live?: NFixture; next?: NFixture;
  standings: NStandingRow[]; standingGroups: NStandingGroup[]; competitions: { id: string; name: string; type: string; season?: string; description?: string; start?: string; end?: string; venue?: string }[];
  stages: NStage[]; news: NNews[]; sponsors: NSponsor[]; photos: NPhoto[]; videos: NVideo[];
  programmes: NProgramme[]; batches: NBatch[]; facilities: NFacility[]; ageGroups: string[];
  admission: { process?: string; eligibility?: string; feeSummary?: string; documents: string[]; trialInfo?: string; intakeDates?: string };
  philosophy?: string; achievements: NAchievement[]; testimonials: NTestimonial[];
  tournament: { edition?: string; format?: string; formatDescription?: string; matchFormat?: string; start?: Date | null; end?: Date | null; startIso?: string; endIso?: string; location?: string; registrationDeadline?: string; registrationInfo?: string; prizeInfo?: string; ticketInfo?: string };
  rules: string[]; venues: NVenue[];
  stats: NStat[];
  has: {
    teams: boolean; players: boolean; staff: boolean; fixtures: boolean; results: boolean; standings: boolean; bracket: boolean; news: boolean;
    sponsors: boolean; gallery: boolean; videos: boolean; programmes: boolean; batches: boolean; facilities: boolean; admission: boolean;
    achievements: boolean; testimonials: boolean; rules: boolean; venues: boolean; about: boolean; history: boolean; contact: boolean; tournament: boolean;
  };
  isDemo: boolean;
}

const SPORT_LABELS: Record<SportType, string> = {
  football: 'Football', cricket: 'Cricket', basketball: 'Basketball', volleyball: 'Volleyball', badminton: 'Badminton', tennis: 'Tennis',
  hockey: 'Hockey', athletics: 'Athletics', swimming: 'Swimming', kabaddi: 'Kabaddi', multi_sport: 'Multi-sport', other: 'Sport'
};

const SOCIAL_LABELS: Record<string, string> = {
  facebook: 'Facebook', instagram: 'Instagram', youtube: 'YouTube', twitter: 'X / Twitter', x: 'X / Twitter', linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp', tiktok: 'TikTok', website: 'Website', telegram: 'Telegram'
};

const toStr = (v: unknown): string => (typeof v === 'string' ? v : '');
const arr = <T,>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : []);
const isHex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v.trim());

/** Parses ISO timestamps and date-only strings (date-only values are read as local calendar dates). */
export function parseDate(v?: string): Date | null {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const fmtDate = (d: Date | null, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string =>
  d ? d.toLocaleDateString('en-GB', opts) : '';
export const fmtTime = (d: Date | null): string => (d && /T\d{2}:\d{2}/.test(d.toISOString()) ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '');
export const fmtDay = (d: Date | null): string => fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short' });

export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  return m ? m[1] : null;
}

const initialsOf = (name: string): string => {
  const words = name.split(/[\s&.-]+/).filter((w) => w && !/^(the|of|and|fc|cc|sc|afc|club|academy)$/i.test(w));
  const src = words.length ? words : name.split(/\s+/);
  return src.slice(0, 3).map((w) => w[0]).join('').toUpperCase() || 'SC';
};

export interface SportsNormalizeOptions {
  /** Style of generated artwork when the client has not supplied images. */
  art?: SportsPaletteName;
  coverKind?: Parameters<typeof art>[0];
}

export function normalizeSports(props: SportsTemplateProps, opts: SportsNormalizeOptions = {}): NormalizedSports {
  const { requirements, sportsData, website } = props;
  const club = sportsData?.club;
  const name = toStr(club?.organizationName) || requirements?.organizationName || 'Your organisation';
  const palette = opts.art || 'night';
  const initials = initialsOf(name);
  const teamsRaw = arr(sportsData?.teams);
  const teamName = (id?: string) => teamsRaw.find((t) => t.id === id)?.name || '';

  // ---- identity and images
  const brandingMedia = sportsData?.brandingMedia;
  const logoUrl = toStr(club?.logoUrl) || toStr(requirements?.logoUrl) || toStr(brandingMedia?.primaryLogoUrl);
  const coverUrl = toStr(club?.coverImageUrl) || toStr(website?.heroImage) || toStr(requirements?.coverImageUrl);
  const primary = isHex(club?.primaryColor) ? club?.primaryColor : isHex(brandingMedia?.primaryColor) ? brandingMedia?.primaryColor : undefined;
  const accent = isHex(club?.accentColor) ? club?.accentColor : isHex(brandingMedia?.accentColor) ? brandingMedia?.accentColor : undefined;
  const sportList = arr(club?.sportTypes).map((s) => SPORT_LABELS[s] || 'Sport');

  // ---- contact and social
  const socialRaw: Record<string, string | undefined> = { ...(requirements?.socialLinks || {}) };
  const socials: NSocial[] = Object.entries(socialRaw)
    .filter(([k, v]) => k !== 'whatsapp' && typeof v === 'string' && v.trim())
    .map(([k, v]) => ({ key: k.toLowerCase(), label: SOCIAL_LABELS[k.toLowerCase()] || k, url: (v as string).trim() }));
  const whatsapp = toStr(requirements?.socialLinks?.whatsapp) || undefined;
  const email = toStr(requirements?.contactEmail) || undefined;
  const phone = toStr(requirements?.contactPhone) || undefined;
  const address = toStr(requirements?.address) || toStr(club?.headquarters) || undefined;

  // ---- squads
  const playersRaw = arr(sportsData?.players);
  const teams: NTeam[] = teamsRaw.filter((t: SportsTeam) => t.isActive !== false).map((t) => ({
    id: t.id, name: t.name, sport: SPORT_LABELS[t.sport] || 'Sport', ageGroup: t.ageGroup, gender: t.genderCategory, description: t.description,
    logo: t.logoUrl || undefined, playerCount: playersRaw.filter((p) => p.teamId === t.id).length
  }));
  const statLabels: [keyof NonNullable<SportsPlayer['statistics']>, string][] = [
    ['appearances', 'Apps'], ['goals', 'Goals'], ['assists', 'Assists'], ['cleanSheets', 'Clean sheets'], ['runs', 'Runs'], ['wickets', 'Wickets'], ['points', 'Points'], ['matchesPlayed', 'Matches']
  ];
  const players: NPlayer[] = playersRaw.map((p: SportsPlayer) => ({
    id: p.id, name: p.displayName || p.fullName, number: p.jerseyNumber, position: p.position, team: teamName(p.teamId), teamId: p.teamId,
    photo: p.profileImageUrl || undefined, hasPhoto: Boolean(p.profileImageUrl), bio: p.biography, status: p.status,
    stats: statLabels.filter(([k]) => typeof p.statistics?.[k] === 'number').map(([k, label]) => ({ label, value: String(p.statistics?.[k]) }))
  }));
  const staff: NStaff[] = arr(sportsData?.staff).map((s: SportsStaffMember) => ({
    id: s.id, name: s.fullName, role: s.role, bio: s.biography, photo: s.profileImageUrl || undefined, hasPhoto: Boolean(s.profileImageUrl), qualifications: arr(s.qualifications)
  }));

  // ---- fixtures and results
  const toFixture = (f: SportsFixture): NFixture => {
    const ours = teamName(f.teamId) || name;
    const away = f.homeOrAway === 'away';
    const date = parseDate(f.scheduledAt);
    const hasScore = typeof f.homeScore === 'number' && typeof f.awayScore === 'number';
    const our = away ? f.awayScore : f.homeScore;
    const their = away ? f.homeScore : f.awayScore;
    const completed = f.status === 'completed';
    return {
      id: f.id, teamId: f.teamId, competition: arr(sportsData?.competitions).find((c) => c.id === f.competitionId)?.name, round: f.round,
      homeName: away ? f.opponentName : ours, awayName: away ? ours : f.opponentName, homeScore: f.homeScore, awayScore: f.awayScore,
      status: f.status, live: f.status === 'live' || f.status === 'half_time', completed, iso: f.scheduledAt, date, venue: f.venue,
      summary: f.resultSummary, report: f.matchReport, highlights: f.matchHighlightsUrl, ourSide: away ? 'away' : 'home', hasScore,
      outcome: completed && hasScore && typeof our === 'number' && typeof their === 'number' ? (our > their ? 'W' : our === their ? 'D' : 'L') : undefined
    };
  };
  const allFixtures = arr(sportsData?.fixtures).map(toFixture);
  const byDate = (a: NFixture, b: NFixture) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0);
  const fixtures = allFixtures.filter((f) => ['scheduled', 'live', 'half_time', 'postponed'].includes(f.status)).sort(byDate);
  const results = allFixtures.filter((f) => f.completed).sort((a, b) => byDate(b, a));
  const live = allFixtures.find((f) => f.live);
  const next = fixtures.find((f) => f.status === 'scheduled' && (!f.date || f.date.getTime() >= Date.now() - 36e5)) || fixtures.find((f) => f.status === 'scheduled');

  // ---- standings (grouped by competition)
  const standingsRaw = arr(sportsData?.standings);
  const competitions = arr(sportsData?.competitions).map((c) => ({ id: c.id, name: c.name, type: c.competitionType, season: c.season, description: c.description, start: c.startDate, end: c.endDate, venue: c.venue }));
  const groups = new Map<string, NStandingRow[]>();
  [...standingsRaw].sort((a, b) => a.position - b.position).forEach((s) => {
    const nameOf = s.teamName || teamName(s.teamId) || s.teamId;
    const row: NStandingRow = {
      position: s.position, name: nameOf, played: s.played, won: s.won, drawn: s.drawn, lost: s.lost, gf: s.goalsFor, ga: s.goalsAgainst,
      gd: typeof s.goalDifference === 'number' ? s.goalDifference : typeof s.goalsFor === 'number' && typeof s.goalsAgainst === 'number' ? s.goalsFor - s.goalsAgainst : undefined,
      points: s.points, form: arr(s.form), isUs: nameOf.toLowerCase() === name.toLowerCase() || teamsRaw.some((t) => t.id === s.teamId)
    };
    groups.set(s.competitionId, [...(groups.get(s.competitionId) || []), row]);
  });
  const standingGroups: NStandingGroup[] = [...groups.entries()].map(([cid, rows]) => ({ competition: competitions.find((c) => c.id === cid)?.name || 'League table', rows }));

  // ---- knockout stages
  const stages: NStage[] = [...arr(sportsData?.tournamentStages)].sort((a, b) => (a.stageOrder ?? a.order ?? 0) - (b.stageOrder ?? b.order ?? 0)).map((s) => ({
    id: s.id, name: s.name, type: s.stageType, status: s.status,
    matches: arr(s.matches).map((m: SportsTournamentMatch) => ({ id: m.id, home: m.homeTeamName, away: m.awayTeamName, homeScore: m.homeScore, awayScore: m.awayScore, status: m.status, winner: m.winner, date: parseDate(m.scheduledAt), venue: m.venue }))
  }));

  // ---- news, sponsors, media
  const news: NNews[] = arr(sportsData?.news).filter((n) => n.isPublished).map((n) => ({
    id: n.id, title: n.title, summary: n.summary, content: n.content, date: parseDate(n.publishedAt), image: n.coverImageUrl || undefined, category: n.category, author: n.author
  })).sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
  const sponsors: NSponsor[] = [...arr(sportsData?.sponsors)].sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99)).map((s) => ({
    id: s.id, name: s.name, level: s.sponsorshipLevel, url: s.websiteUrl, logo: s.logoUrl || undefined, description: s.description
  }));
  const seen = new Set<string>();
  const photos: NPhoto[] = [];
  const addPhoto = (src: unknown, caption: string, category: string) => {
    if (typeof src !== 'string' || !src.trim() || seen.has(src)) return;
    seen.add(src);
    photos.push({ id: `ph-${photos.length}`, src, caption, category });
  };
  arr(sportsData?.gallery).forEach((g) => addPhoto(g.url, g.caption || '', g.category || 'Gallery'));
  arr(website?.galleryPhotos).forEach((g) => addPhoto(g.url, g.title || '', g.category || 'Gallery'));
  arr(website?.additionalBrandingImages).forEach((u, i) => addPhoto(u, `${name} ${i + 1}`, 'Gallery'));
  const videos: NVideo[] = [];
  arr(requirements?.youtubeUrls).forEach((u, i) => {
    const vid = youtubeId(u);
    if (vid) videos.push({ id: `v-${i}`, embed: `https://www.youtube-nocookie.com/embed/${vid}`, thumb: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`, title: `Video ${videos.length + 1}` });
  });
  arr(website?.featuredVideos).forEach((v) => {
    if (v.provider === 'google_drive' || !v.embedUrl || videos.some((x) => x.embed === v.embedUrl)) return;
    videos.push({ id: v.id, embed: v.embedUrl, thumb: v.thumbnailUrl || (v.videoId ? `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg` : ''), title: v.title });
  });

  // ---- academy
  const coachOf = (ids?: string[]) => arr(ids).map((id) => staff.find((s) => s.id === id)?.name).filter(Boolean).join(', ') || undefined;
  const programmes: NProgramme[] = arr(sportsData?.academyProgrammes).filter((p) => p.isActive !== false).map((p) => ({
    id: p.id, title: p.title, sport: SPORT_LABELS[p.sport] || 'Sport', ageGroup: p.ageGroup, duration: p.duration, description: p.description, fee: p.feeStructure, highlights: arr(p.curriculumHighlights), coach: coachOf(p.coachIds)
  }));
  const batches: NBatch[] = arr(sportsData?.trainingBatches).map((b) => ({
    id: b.id, name: b.name, programme: programmes.find((p) => p.id === b.programmeId)?.title, ageGroup: b.ageGroup, days: arr(b.daysOfWeek), start: b.startTime, end: b.endTime, venue: b.venue, coach: b.coachName, capacity: b.maxCapacity
  }));
  const ai = sportsData?.academyInfo;
  const facilities: NFacility[] = arr(ai?.facilities).map((f) => ({ id: f.id, name: f.name, description: f.description, image: f.imageUrl || undefined }));
  const adm = ai?.admission;
  const admission = { process: adm?.process, eligibility: adm?.eligibility, feeSummary: adm?.feeSummary, documents: arr(adm?.documentsRequired), trialInfo: adm?.trialInfo, intakeDates: adm?.intakeDates };
  const achievements: NAchievement[] = arr(ai?.achievements).map((a) => ({ id: a.id, title: a.title, year: a.year, description: a.description }));
  const testimonials: NTestimonial[] = arr(ai?.testimonials).filter((t) => t.quote && t.author).map((t) => ({ id: t.id, quote: t.quote, author: t.author, role: t.role }));
  const ageGroups = arr(ai?.ageGroups).length ? arr(ai?.ageGroups) : [...new Set(programmes.map((p) => p.ageGroup).filter(Boolean))];

  // ---- tournament
  const ti = sportsData?.tournamentInfo;
  const tournament = {
    edition: ti?.edition, format: ti?.format ? ({ knockout: 'Knockout', league: 'League', group_knockout: 'Group stage and knockout', round_robin: 'Round robin', other: 'Custom format' } as Record<string, string>)[ti.format] || ti.format.replace(/_/g, ' ') : undefined, formatDescription: ti?.formatDescription, matchFormat: ti?.matchFormat,
    start: parseDate(ti?.startDate), end: parseDate(ti?.endDate), startIso: ti?.startDate, endIso: ti?.endDate, location: ti?.location,
    registrationDeadline: ti?.registrationDeadline, registrationInfo: ti?.registrationInfo, prizeInfo: ti?.prizeInfo, ticketInfo: ti?.ticketInfo
  };
  const rules = arr(ti?.rules).filter((r) => r && r.trim());
  const venues: NVenue[] = arr(ti?.venues).map((v) => ({ id: v.id, name: v.name, address: v.address, capacity: v.capacity, notes: v.notes, image: v.imageUrl || undefined }));

  // ---- headline numbers (only facts derived from supplied data)
  const stats: NStat[] = [];
  if (club?.foundedYear) stats.push({ value: String(club.foundedYear), label: 'Founded' });
  if (teams.length) stats.push({ value: String(teams.length), label: teams.length === 1 ? 'Team' : 'Teams' });
  if (players.length) stats.push({ value: String(players.length), label: players.length === 1 ? 'Player' : 'Players' });
  if (programmes.length) stats.push({ value: String(programmes.length), label: programmes.length === 1 ? 'Programme' : 'Programmes' });
  if (staff.length) stats.push({ value: String(staff.length), label: 'Coaches & staff' });
  if (competitions.length) stats.push({ value: String(competitions.length), label: competitions.length === 1 ? 'Competition' : 'Competitions' });
  if (facilities.length) stats.push({ value: String(facilities.length), label: 'Facilities' });

  const shortName = name.length > 22 ? initials : name;
  const description = toStr(club?.description) || toStr(requirements?.aboutText);
  return {
    name, shortName, initials, nickname: club?.nickname, tagline: toStr(club?.tagline) || toStr(requirements?.tagline), description,
    sport: sportList[0] || '', sports: sportList, founded: club?.foundedYear, homeGround: club?.homeGround, location: toStr(club?.headquarters) || undefined,
    logo: logoUrl || crestUri(initials, primary || '#1F3A8A', accent || '#F5C542'), hasLogo: Boolean(logoUrl),
    cover: coverUrl || art(opts.coverKind || 'stadium', name, palette), hasCover: Boolean(coverUrl),
    brand: { primary, accent },
    email, phone, address, whatsapp, socials,
    mission: club?.mission, vision: club?.vision, values: arr(club?.values), history: club?.history, timeline: arr(club?.historyTimeline), clubAchievements: arr(club?.achievements),
    teams, players, staff, fixtures, results, live, next, standings: standingGroups[0]?.rows || [], standingGroups, competitions, stages, news, sponsors, photos, videos,
    programmes, batches, facilities, ageGroups, admission, philosophy: ai?.philosophy, achievements, testimonials, tournament, rules, venues, stats,
    has: {
      teams: teams.length > 0, players: players.length > 0, staff: staff.length > 0, fixtures: fixtures.length > 0, results: results.length > 0,
      standings: standingGroups.length > 0, bracket: stages.some((s) => s.matches.length > 0), news: news.length > 0, sponsors: sponsors.length > 0,
      gallery: photos.length > 0, videos: videos.length > 0, programmes: programmes.length > 0, batches: batches.length > 0, facilities: facilities.length > 0,
      admission: Boolean(admission.process || admission.eligibility || admission.feeSummary || admission.documents.length || admission.trialInfo || admission.intakeDates),
      achievements: achievements.length > 0, testimonials: testimonials.length > 0, rules: rules.length > 0, venues: venues.length > 0,
      about: Boolean(description), history: Boolean(club?.history || arr(club?.historyTimeline).length || club?.mission || club?.vision),
      contact: Boolean(email || phone || address || socials.length || whatsapp),
      tournament: Boolean(tournament.format || tournament.start || tournament.location || tournament.registrationInfo || tournament.prizeInfo)
    },
    isDemo: Boolean(props.isDemo)
  };
}

/** Groups batches by weekday for timetable layouts. */
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export function batchesByDay(batches: NBatch[]): { day: string; items: NBatch[] }[] {
  return WEEKDAYS.map((day) => ({ day, items: batches.filter((b) => b.days.some((d) => d.slice(0, 3).toLowerCase() === day.toLowerCase())) })).filter((g) => g.items.length > 0);
}

/** "3–1" style score for a fixture. */
export const scoreText = (f: { homeScore?: number; awayScore?: number }): string =>
  typeof f.homeScore === 'number' && typeof f.awayScore === 'number' ? `${f.homeScore}–${f.awayScore}` : 'vs';


/** "12 Jun – 20 Jun 2026" style range; collapses to one date when start and end match; empty when neither is known. */
export const fmtRange = (a: Date | null | undefined, b: Date | null | undefined): string => {
  if (!a && !b) return '';
  if (a && b && a.toDateString() !== b.toDateString()) return `${fmtDate(a, { day: 'numeric', month: 'short' })} – ${fmtDate(b, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  return fmtDate(a || b || null);
};

/** Groups matches by calendar day, oldest first, keeping undated matches last. */
export function groupByDay<T extends { date: Date | null }>(items: T[]): { key: string; date: Date | null; items: T[] }[] {
  const map = new Map<string, { key: string; date: Date | null; items: T[] }>();
  for (const it of items) {
    const key = it.date ? it.date.toDateString() : 'tbc';
    if (!map.has(key)) map.set(key, { key, date: it.date, items: [] });
    map.get(key)!.items.push(it);
  }
  return [...map.values()].sort((a, b) => (a.date?.getTime() ?? Infinity) - (b.date?.getTime() ?? Infinity));
}
