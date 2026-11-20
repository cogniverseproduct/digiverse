import type { CulturalTemplateProps } from '../types';
import { art, monogramUri, type CulturalArtKind, type CulturalPaletteName } from './art';
import { fmtDate, parseDate, youtubeId } from '../../sports/kit/data';

export { fmtDate, parseDate, youtubeId };

/**
 * Turns CulturalWebsiteData (many optional datasets) into one stable shape every Cultural template reads.
 * Missing content never throws and is never invented: a dataset the client did not supply reports `has.x === false`
 * and the template hides that section, so a sparse profile still renders as a finished design.
 * Derived values (years since founding, counts) are computed from what the client entered, never made up.
 */

/** A name that fits a navigation bar: whole words up to 26 characters, never ending on a connector such as "&" or "of". */
export function shortenName(name: string): string {
  if (name.length <= 26) return name;
  const out: string[] = [];
  for (const w of name.split(/\s+/)) { if ([...out, w].join(' ').length > 26) break; out.push(w); }
  while (out.length > 1 && /^(&|and|of|the|for|in|at|-)$/i.test(out[out.length - 1])) out.pop();
  return (out.length ? out.join(' ') : name.slice(0, 26)).replace(/[,;:]+$/, '');
}

export interface CSocial { key: string; label: string; url: string }
export interface CLeader { id: string; name: string; nativeName?: string; designation: string; group: string; photo?: string; hasPhoto: boolean; bio?: string; email?: string; phone?: string }
export interface CActivity { id: string; title: string; nativeTitle?: string; category: string; description: string; schedule?: string; venue?: string; image?: string; upcoming: boolean; registration: boolean }
export interface CEvent { id: string; title: string; nativeTitle?: string; category: string; description: string; date: Date | null; endDate: Date | null; time: string; venue: string; image?: string; url?: string; featured: boolean; status: string }
export interface CRitual { time: string; name: string; nativeName?: string; description?: string; key: boolean }
export interface CDay { id: string; name: string; nativeName?: string; date: Date | null; dateText: string; tithi?: string; rituals: CRitual[] }
export interface CTheme { name: string; nativeName?: string; edition: string; concept: string; story?: string; artisan?: string; pandal?: string; lighting?: string; images: { src: string; caption: string; category: string }[]; past: { year: number; name: string; description: string; image?: string }[] }
export interface CGuide { location: string; landmark?: string; metro?: string; railway?: string; bus?: string; parking?: string; hours: string; vip?: string; crowd: string[]; safety: string[]; emergency?: string }
export interface CDonation { title: string; message: string; causes: { id: string; title: string; description: string; amounts: number[] }[]; transparency: string; contact: string; taxNote?: string }
export interface CMembership { tiers: { name: string; fee: string; benefits: string[] }[]; guidelines?: string }
export interface CSponsor { id: string; name: string; tier: string; url?: string; logo?: string; description?: string }
export interface CNews { id: string; title: string; nativeTitle?: string; date: Date | null; category: string; summary: string; content: string; image?: string }
export interface CPhoto { id: string; src: string; caption: string; category: string }
export interface CVideo { id: string; embed: string; thumb: string; title: string }
export interface CStat { value: string; label: string }

export interface NormalizedCultural {
  isPuja: boolean;
  name: string; nativeName?: string; shortName: string; initials: string; tagline: string; description: string;
  festival?: string; edition?: string; established?: number; years?: number; registration?: string;
  place: string; city?: string; state?: string; address?: string;
  logo: string; hasLogo: boolean; cover: string; hasCover: boolean;
  brand: { primary?: string; accent?: string };
  email?: string; phone?: string; contactPerson?: string; whatsapp?: string; socials: CSocial[];
  mission?: string; vision?: string; values: string[]; history?: string;
  leaders: CLeader[]; leaderGroups: { group: string; items: CLeader[] }[];
  activities: CActivity[]; events: CEvent[]; upcoming: CEvent[]; past: CEvent[]; nextEvent?: CEvent;
  days: CDay[]; theme?: CTheme; guide?: CGuide; donation?: CDonation; membership?: CMembership;
  sponsors: CSponsor[]; news: CNews[]; photos: CPhoto[]; videos: CVideo[];
  stats: CStat[];
  has: {
    about: boolean; history: boolean; leadership: boolean; activities: boolean; events: boolean; schedule: boolean; theme: boolean; visitor: boolean;
    news: boolean; gallery: boolean; videos: boolean; sponsors: boolean; membership: boolean; donation: boolean; contact: boolean; mission: boolean;
  };
  isDemo: boolean;
}

const FESTIVALS: Record<string, string> = {
  durga_puja: 'Durga Puja', kali_puja: 'Kali Puja', saraswati_puja: 'Saraswati Puja', lakshmi_puja: 'Lakshmi Puja', jagaddhatri_puja: 'Jagaddhatri Puja',
  ganesh_utsav: 'Ganesh Utsav', basant_utsav: 'Basant Utsav', general_festival: 'Festival'
};
const SOCIAL_LABELS: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', youtube: 'YouTube', twitter: 'X / Twitter', x: 'X / Twitter', linkedin: 'LinkedIn', whatsapp: 'WhatsApp', website: 'Website' };
const GROUP_LABELS: Record<string, string> = { executive: 'Executive committee', advisory: 'Advisors', organizer: 'Organisers', volunteer: 'Volunteers', religious: 'Priests and ritual leads' };

const toStr = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const arr = <T,>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : []);
const isHex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v.trim());
const initialsOf = (name: string): string => {
  const words = name.split(/[\s&.,-]+/).filter((w) => w && !/^(the|of|and|a|sarbojanin|sarvajanik|samiti|committee|association|society|club)$/i.test(w));
  const src = words.length ? words : name.split(/\s+/);
  return src.slice(0, 3).map((w) => Array.from(w)[0]).join('').toUpperCase() || 'CU';
};

export interface CulturalNormalizeOptions { art?: CulturalPaletteName; coverKind?: CulturalArtKind }

export function normalizeCultural(props: Pick<CulturalTemplateProps, 'requirements' | 'culturalData' | 'website' | 'isDemo'>, opts: CulturalNormalizeOptions = {}): NormalizedCultural {
  const { requirements, culturalData: cd, website } = props;
  const org = cd?.organization;
  const branding = cd?.branding;
  const isPuja = cd?.websiteType === 'puja_committee' || requirements?.category === 'puja_committee';
  const name = toStr(org?.name) || toStr(requirements?.organizationName) || 'Your organisation';
  const initials = initialsOf(name);

  const primary = isHex(branding?.primaryColor) ? branding?.primaryColor : undefined;
  const accent = isHex(branding?.accentColor) ? branding?.accentColor : undefined;
  const logoUrl = toStr(branding?.primaryLogoUrl) || toStr(requirements?.logoUrl);
  const coverUrl = toStr(branding?.coverImageUrl) || toStr(requirements?.coverImageUrl) || toStr(website?.heroImage);

  const socialRaw: Record<string, string | undefined> = { ...(org?.socialLinks || {}), ...(requirements?.socialLinks || {}) };
  const socials: CSocial[] = Object.entries(socialRaw)
    .filter(([k, v]) => k !== 'whatsapp' && typeof v === 'string' && v.trim())
    .map(([k, v]) => ({ key: k.toLowerCase(), label: SOCIAL_LABELS[k.toLowerCase()] || k, url: (v as string).trim() }));
  const whatsapp = toStr(socialRaw.whatsapp) || undefined;
  const email = toStr(org?.contactEmail) || toStr(requirements?.contactEmail) || undefined;
  const phone = toStr(org?.contactPhone) || toStr(requirements?.contactPhone) || undefined;
  const city = toStr(org?.city) || undefined;
  const state = toStr(org?.state) || undefined;
  const address = toStr(requirements?.address) || [toStr(org?.headquarters), city, state].filter(Boolean).join(', ') || undefined;
  const place = [city, state].filter(Boolean).join(', ');

  const leaders: CLeader[] = arr(cd?.leadership).slice().sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)).map((l) => ({
    id: l.id, name: l.name, nativeName: l.nativeName, designation: l.designation, group: GROUP_LABELS[l.roleCategory] || 'Committee',
    photo: l.profileImageUrl || undefined, hasPhoto: Boolean(l.profileImageUrl), bio: l.bio, email: l.email, phone: l.phone
  }));
  const leaderGroups: { group: string; items: CLeader[] }[] = [];
  leaders.forEach((l) => { const g = leaderGroups.find((x) => x.group === l.group); if (g) g.items.push(l); else leaderGroups.push({ group: l.group, items: [l] }); });

  const activities: CActivity[] = arr(cd?.activities).map((a) => ({
    id: a.id, title: a.title, nativeTitle: a.titleNative, category: a.category, description: a.description, schedule: a.schedule, venue: a.venue,
    image: a.featuredImageUrl || undefined, upcoming: Boolean(a.isUpcoming), registration: Boolean(a.registrationRequired)
  }));

  const events: CEvent[] = arr(cd?.events).map((e) => ({
    id: e.id, title: e.title, nativeTitle: e.titleNative, category: e.category, description: e.description, date: parseDate(e.startDate), endDate: parseDate(e.endDate),
    time: e.time, venue: e.venue, image: e.featuredImageUrl || undefined, url: e.registrationUrl || undefined, featured: Boolean(e.isFeatured), status: e.status
  })).sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isPast = (e: CEvent) => e.status === 'completed' || (e.status !== 'ongoing' && !!e.date && (e.endDate || e.date).getTime() < today.getTime());
  const upcoming = events.filter((e) => !isPast(e));
  const past = events.filter(isPast).reverse();
  const nextEvent = upcoming.find((e) => e.featured) || upcoming[0];

  const days: CDay[] = arr(cd?.pujaSchedule).map((d) => ({
    id: d.id, name: d.dayName, nativeName: d.dayNameNative, date: parseDate(d.date), dateText: d.date, tithi: d.tithiInfo,
    rituals: arr(d.rituals).map((r) => ({ time: r.time, name: r.name, nativeName: r.nameNative, description: r.description, key: Boolean(r.isKeyRitual) }))
  }));

  const pt = cd?.pujaTheme;
  const theme: CTheme | undefined = pt && toStr(pt.currentThemeName) ? {
    name: pt.currentThemeName, nativeName: pt.currentThemeNameNative, edition: pt.editionYear, concept: pt.themeConcept, story: pt.themeStory, artisan: pt.idolArtisan,
    pandal: pt.pandalArchitecture, lighting: pt.lightingConcept,
    images: arr(pt.themeImages).filter((i) => i.url).map((i) => ({ src: i.url, caption: i.caption, category: i.category })),
    past: arr(pt.pastThemes).map((p) => ({ year: p.year, name: p.themeName, description: p.description, image: p.imageUrl }))
  } : undefined;

  const vg = cd?.visitorGuide;
  const guide: CGuide | undefined = vg && (toStr(vg.pandalLocation) || toStr(vg.visitingHours)) ? {
    location: vg.pandalLocation, landmark: vg.landmark, metro: vg.nearestMetro, railway: vg.nearestRailway, bus: vg.nearestBusStop, parking: vg.parkingInfo,
    hours: vg.visitingHours, vip: vg.vipPassInfo, crowd: arr(vg.crowdGuidelines).filter(Boolean), safety: arr(vg.safetyAccessibility).filter(Boolean), emergency: vg.emergencyContactPhone
  } : undefined;

  const di = cd?.donationInfo;
  const donation: CDonation | undefined = di && (toStr(di.campaignTitle) || toStr(di.appealMessage)) ? {
    title: di.campaignTitle, message: di.appealMessage, transparency: di.transparencyNote, contact: di.contactForDonations, taxNote: di.taxExemptionNote,
    causes: arr(di.causes).map((c) => ({ id: c.id, title: c.title, description: c.description, amounts: arr(c.suggestedAmounts) }))
  } : undefined;

  const mi = cd?.membershipInfo;
  const membership: CMembership | undefined = mi?.enabled && (arr(mi.membershipTypes).length || toStr(mi.guidelines)) ? { tiers: arr(mi.membershipTypes), guidelines: mi.guidelines } : undefined;

  const sponsors: CSponsor[] = arr(cd?.sponsors).map((s) => ({ id: s.id, name: s.name, tier: s.tier, url: s.websiteUrl, logo: s.logoUrl || undefined, description: s.description }));
  const news: CNews[] = arr(cd?.news).filter((n) => n.isPublished !== false).map((n) => ({
    id: n.id, title: n.title, nativeTitle: n.titleNative, date: parseDate(n.publishedAt), category: n.category, summary: n.summary, content: n.content, image: n.coverImageUrl || undefined
  })).sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

  const photos: CPhoto[] = [];
  const addPhoto = (src: string | undefined, caption: string, category: string) => {
    if (src && src.trim() && !photos.some((p) => p.src === src)) photos.push({ id: `ph-${photos.length}`, src, caption, category });
  };
  arr(cd?.gallery).forEach((g) => addPhoto(g.imageUrl || g.thumbnailUrl, g.caption || g.title || '', g.category || 'Gallery'));
  arr(website?.galleryPhotos).forEach((g) => addPhoto(g.url, g.title || '', g.category || 'Gallery'));
  arr(theme?.images).forEach((g) => addPhoto(g.src, g.caption, g.category));

  const videos: CVideo[] = [];
  arr(website?.featuredVideos).forEach((v) => {
    if (!v.embedUrl || videos.some((x) => x.embed === v.embedUrl)) return;
    if (v.provider === 'google_drive') {
      // A Drive video is embedded through Drive's own player, so only a genuine Drive file URL is accepted. It has no thumbnail we may
      // hotlink (a public Drive thumbnail needs credentials), so the design draws a plain play tile.
      if (!/^https:\/\/drive\.google\.com\/file\/d\/[\w-]+\/preview$/.test(v.embedUrl)) return;
      const title = v.title && !/^Drive Video \(/.test(v.title) ? v.title : 'Video';
      videos.push({ id: v.id, embed: v.embedUrl, thumb: '', title });
      return;
    }
    videos.push({ id: v.id, embed: v.embedUrl, thumb: v.thumbnailUrl || (v.videoId ? `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg` : ''), title: v.title });
  });

  const established = typeof org?.establishedYear === 'number' && org.establishedYear > 1000 ? org.establishedYear : undefined;
  const years = established ? Math.max(0, new Date().getFullYear() - established) : undefined;
  const festival = cd?.festivalType ? FESTIVALS[cd.festivalType] : undefined;
  const palette = opts.art || 'vermilion';
  const kind = opts.coverKind || (isPuja ? 'pandal' : 'alpona');

  const stats: CStat[] = [];
  if (established) stats.push({ value: String(established), label: 'Established' });
  if (years && years > 0) stats.push({ value: `${years}`, label: years === 1 ? 'Year of service' : 'Years of service' });
  if (events.length) stats.push({ value: String(events.length), label: events.length === 1 ? 'Event listed' : 'Events listed' });
  if (activities.length) stats.push({ value: String(activities.length), label: activities.length === 1 ? 'Programme' : 'Programmes' });
  if (days.length) stats.push({ value: String(days.length), label: days.length === 1 ? 'Day of rituals' : 'Days of rituals' });
  if (leaders.length) stats.push({ value: String(leaders.length), label: 'Committee members' });

  const description = toStr(org?.description) || toStr(requirements?.aboutText);
  return {
    isPuja, name, nativeName: toStr(org?.nativeName) || undefined, shortName: shortenName(name), initials,
    tagline: toStr(org?.tagline), description,
    festival, edition: theme?.edition || undefined, established, years, registration: toStr(org?.registrationNumber) || undefined,
    place, city, state, address,
    logo: logoUrl || monogramUri(initials, primary || '#7A1414', accent || '#F1A23A'), hasLogo: Boolean(logoUrl),
    cover: coverUrl || art(kind, name, palette), hasCover: Boolean(coverUrl),
    brand: { primary, accent },
    email, phone, contactPerson: toStr(org?.contactPerson) || undefined, whatsapp, socials,
    mission: toStr(org?.mission) || undefined, vision: toStr(org?.vision) || undefined, values: arr(org?.coreValues).filter(Boolean), history: toStr(org?.history) || undefined,
    leaders, leaderGroups, activities, events, upcoming, past, nextEvent, days, theme, guide, donation, membership, sponsors, news, photos, videos, stats,
    has: {
      about: Boolean(description), history: Boolean(toStr(org?.history)), mission: Boolean(toStr(org?.mission) || toStr(org?.vision) || arr(org?.coreValues).length),
      leadership: leaders.length > 0, activities: activities.length > 0, events: events.length > 0, schedule: days.length > 0, theme: Boolean(theme), visitor: Boolean(guide),
      news: news.length > 0, gallery: photos.length > 0, videos: videos.length > 0, sponsors: sponsors.length > 0, membership: Boolean(membership), donation: Boolean(donation),
      contact: Boolean(email || phone || address || socials.length)
    },
    isDemo: Boolean(props.isDemo)
  };
}

export { art };
