import type { EventTemplateProps } from '../types';
import type { EventWebsiteData, EventPerson, EventSession } from '../../../types/event';
import { safeUrl, formatDate } from '../../ngo/kit/data';

/**
 * Turns the project's event data into one stable, flat shape that every event template mapping binds to.
 * Nothing is invented: a dataset the client did not supply is empty and its section is removed from the template. Counters such as
 * "40+ speakers" are derived only from lists the client actually entered.
 * Private fields (RSVP submissions, Drive file ids, internal ids) are never copied into the view. Image URLs are made absolute
 * because the template runs in a sandboxed frame with no origin of its own.
 */

export interface EventPersonView { name: string; /** First word of the name and the rest, for designs that set the two in different weights. */ first: string; rest: string; role: string; title: string; organization: string; topic: string; bio: string; photo: string; featured: boolean; url: string }
export interface EventSessionView { title: string; who: string; track: string; trackN: number; kindN: number; description: string; time: string; timeRange: string; place: string }
export interface EventSlotView { time: string; sessions: EventSessionView[] }
export interface EventDayView { n: number; label: string; dateText: string; heading: string; slots: EventSlotView[] }
export interface EventTrackView { name: string; n: number; description: string }
export interface EventTicketView { name: string; price: string; description: string; features: string[]; badge: string; url: string; hotN: number; available: boolean }
export interface EventSponsorView { name: string; tier: string; logo: string; url: string }
export interface EventFaqView { question: string; answer: string }
export interface EventPhotoView { url: string; caption: string }
export interface EventVideoView { embed: string; thumb: string; title: string }
export interface EventTravelView { label: string; text: string }
export interface EventStatView { label: string; value: string }
export interface EventExhibitorView { name: string; category: string; booth: string; hall: string; description: string; logo: string; image: string; url: string }
export interface EventNomineeView { title: string; subtitle: string; winner: boolean; image: string }
export interface EventAwardView { name: string; description: string; nominees: EventNomineeView[] }
export interface EventMilestoneView { title: string; date: string; text: string; image: string }
export interface EventCeremonyView { time: string; name: string; venue: string; dress: string; description: string }
export interface EventHotelView { name: string; address: string; code: string; url: string; deadline: string; distance: string; /** "Name · distance" */ line: string; /** "Code: X" or "Book by …" */ note: string }
export interface EventHighlightView { title: string; subtitle: string; description: string; metric: string; image: string }
export interface EventSpecGroupView { group: string; items: Array<{ label: string; value: string }> }
export interface EventSocialView { key: string; label: string; url: string }

export interface EventView {
  name: string; shortName: string; nameLead: string; nameLast: string; /** Three-part split for headlines set as three words: first word, the words between (may be empty), last word (the whole name when it is one word is the last). */ nameFirst: string; nameMid: string; edition: string; tagline: string; description: string;
  startDate: string; endDate: string; dateRange: string; startTime: string; endTime: string; timeText: string; timezone: string;
  /** Local date-time of the start ("2027-06-12T16:00:00"); empty when the client gave no start date. */
  startsAtIso: string;
  /** "Saturday · June 12 · 2027" for the start date; empty without one. */
  longDate: string;
  venueName: string; venueAddress: string; city: string; country: string; cityLine: string; venueLine: string; /** "Venue, street address, city, country": every part the organiser gave, joined. */ venueFull: string;
  /** The individual travel facts the organiser gave (empty when not given). */
  airport: string; transit: string; parking: string; access: string;
  organizer: string; email: string; phone: string; mailto: string; /** "tel:+441234…" (digits and a leading +), empty without a phone number. */ tel: string;
  logo: string; hero: string; images: string[]; primary: string; accent: string; badge: string;
  speakers: EventPersonView[]; featuredSpeakers: EventPersonView[]; days: EventDayView[]; tracks: EventTrackView[]; tickets: EventTicketView[];
  sponsors: EventSponsorView[]; topSponsors: EventSponsorView[]; otherSponsors: EventSponsorView[]; faqs: EventFaqView[];
  gallery: EventPhotoView[]; videos: EventVideoView[]; travel: EventTravelView[]; stats: EventStatView[]; social: EventSocialView[];
  /** The same links keyed by lower-case network name (instagram, facebook, x, linkedin, youtube); a key is absent when the organiser gave no link. */
  socialBy: Record<string, string>;
  exhibitors: EventExhibitorView[]; awards: EventAwardView[];
  wedding: { coupleNames: string; partnerOne: string; partnerTwo: string; /** "A & J" */ initials: string; /** First dress code the organiser gave. */ dress: string; milestones: EventMilestoneView[]; itinerary: EventCeremonyView[]; hotels: EventHotelView[]; registry: Array<{ name: string; url: string }> };
  product: { name: string; tagline: string; headline: string; subheadline: string; video: string; highlights: EventHighlightView[]; specs: EventSpecGroupView[]; ctaText: string; url: string };
  /** First external booking or registration link the organiser supplied (never invented). */
  bookingUrl: string;
  year: string;
  titleLine: string;
  has: {
    tagline: boolean; description: boolean; dates: boolean; countdown: boolean; venue: boolean; speakers: boolean; schedule: boolean; tickets: boolean;
    sponsors: boolean; faqs: boolean; gallery: boolean; videos: boolean; travel: boolean; exhibitors: boolean; awards: boolean; wedding: boolean; product: boolean;
    email: boolean; phone: boolean; logo: boolean; hero: boolean; booking: boolean; social: boolean;
  };
  isDemo: boolean;
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : typeof v === 'number' && Number.isFinite(v) ? String(v) : '');
const arr = <T,>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : []);
const HEX = /^#[0-9a-fA-F]{6}$/;
const SOCIAL_LABELS: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', x: 'X', twitter: 'X', linkedin: 'LinkedIn', youtube: 'YouTube' };
const SYMBOL: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const DRIVE_PREVIEW = /^https:\/\/drive\.google\.com\/file\/d\/[\w-]+\/preview$/;

/** "09:30 AM" or "14:05" to minutes after midnight; unknown strings sort last. */
export function minutesOf(t: string): number {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(t.trim());
  if (!m) return Number.MAX_SAFE_INTEGER;
  let h = Number(m[1]) % 24; const min = Number(m[2]);
  if (m[3]) { const pm = m[3].toUpperCase() === 'PM'; h = (Number(m[1]) % 12) + (pm ? 12 : 0); }
  return h * 60 + min;
}

/** "09:30 AM" to "09:30", "2:05 PM" to "14:05". Already-24-hour values are returned zero-padded; anything else is ''. */
export function toHHmm(t: string): string {
  const mins = minutesOf(t);
  if (mins === Number.MAX_SAFE_INTEGER) return '';
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

/** "12 Nov 2026" for one day; "12–13 Nov 2026" within a month; "30 Nov – 2 Dec 2026" across months. */
export function dateRangeText(start: string, end: string): string {
  const a = /^(\d{4})-(\d{2})-(\d{2})/.exec(start);
  if (!a) return start ? formatDate(start) : '';
  const b = /^(\d{4})-(\d{2})-(\d{2})/.exec(end || '');
  if (!b || end === start) return formatDate(start);
  const f = (m: RegExpExecArray, o: Intl.DateTimeFormatOptions) => new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString('en-GB', { ...o, timeZone: 'UTC' });
  if (a[1] === b[1] && a[2] === b[2]) return `${+a[3]}–${f(b, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  if (a[1] === b[1]) return `${f(a, { day: 'numeric', month: 'short' })} – ${f(b, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function priceText(price: unknown, currency: unknown): string {
  if (typeof price === 'number' && Number.isFinite(price)) { const c = str(currency).toUpperCase(); return `${SYMBOL[c] ?? (c ? c + ' ' : '')}${price.toLocaleString('en-US')}`; }
  return str(price);
}

const personView = (x: EventPerson, U: (u: unknown) => string): EventPersonView => ({
  name: str(x.name), first: str(x.name).split(/\s+/)[0] || '', rest: str(x.name).split(/\s+/).slice(1).join(' '), role: [str(x.title), str(x.organization)].filter(Boolean).join(' · '), title: str(x.title), organization: str(x.organization),
  topic: str(x.topic), bio: str(x.bio), photo: U(x.photoUrl), featured: Boolean(x.isFeatured), url: U(x.socialUrl),
});

function buildDays(sessions: EventSession[], trackIndex: Map<string, number>, people: Map<string, string>, trackNames: Map<string, string>): EventDayView[] {
  const order: string[] = [];
  const byDay = new Map<string, EventSession[]>();
  for (const s of sessions) {
    const key = str(s.date) || str(s.day) || '1';
    if (!byDay.has(key)) { byDay.set(key, []); order.push(key); }
    byDay.get(key)!.push(s);
  }
  order.sort((a, b) => a.localeCompare(b));
  return order.map((key, i) => {
    const list = byDay.get(key)!.slice().sort((a, b) => minutesOf(str(a.startTime)) - minutesOf(str(b.startTime)));
    const slots: EventSlotView[] = [];
    for (const s of list) {
      const time = toHHmm(str(s.startTime)) || str(s.startTime);
      let slot = slots.find((x) => x.time === time);
      if (!slot) { slot = { time, sessions: [] }; slots.push(slot); }
      const tags = arr(s.tags).map((t) => str(t).toLowerCase());
      const isBreak = tags.includes('break');
      const trackN = !isBreak && s.trackId && trackIndex.has(s.trackId) ? (trackIndex.get(s.trackId) as number) : 0;
      const who = arr(s.speakerIds).map((id) => people.get(id) || '').filter(Boolean).join(', ');
      slot.sessions.push({
        title: str(s.title), who, track: trackN ? trackNames.get(str(s.trackId)) || '' : '', trackN, kindN: isBreak ? 3 : s.isKeynote ? 2 : 1, description: str(s.description), time,
        timeRange: [str(s.startTime), str(s.endTime)].filter(Boolean).join(' – '), place: str(s.stage) || str(s.room),
      });
    }
    const dayName = str(list[0]?.day);
    const dateText = list[0]?.date ? new Date(`${list[0].date}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) : '';
    const label = dayName || `Day ${i + 1}`;
    return { n: i + 1, label, dateText: Number.isNaN(Date.parse(list[0]?.date || '')) ? '' : dateText, heading: [label, Number.isNaN(Date.parse(list[0]?.date || '')) ? '' : dateText].filter(Boolean).join(' · '), slots };
  });
}

export function normalizeEvent(props: EventTemplateProps, origin = ''): EventView {
  const d: EventWebsiteData | null = props.eventData || (props.website as { eventData?: EventWebsiteData } | undefined)?.eventData || null;
  const req = (props.requirements || {}) as Record<string, unknown>;
  const web = (props.website || {}) as Record<string, unknown>;
  const p = d?.profile;
  const b = d?.branding;
  const U = (u: unknown) => safeUrl(u, origin);

  const name = str(p?.name) || str(req.organizationName);
  const words = name.split(/\s+/).filter(Boolean);
  const nameLast = words.length > 1 ? words[words.length - 1] : name;
  const nameLead = words.length > 1 ? words.slice(0, -1).join(' ') + ' ' : '';
  const nameFirst = words.length > 1 ? words[0] : '';
  const nameMid = words.length > 2 ? words.slice(1, -1).join(' ') : '';

  const speakers = arr(d?.speakers).map((x) => personView(x, U)).filter((x) => x.name);
  const personById = new Map<string, string>(arr(d?.speakers).map((x) => [x.id, str(x.name)] as [string, string]));
  const tracks: EventTrackView[] = arr(d?.tracks).filter((t) => str(t.name)).map((t, i) => ({ name: str(t.name), n: i + 1, description: str(t.description) }));
  const trackIndex = new Map<string, number>();
  const trackNames = new Map<string, string>();
  arr(d?.tracks).filter((t) => str(t.name)).forEach((t, i) => { trackIndex.set(t.id, i + 1); trackNames.set(t.id, str(t.name)); });
  const days = buildDays(arr(d?.sessions).filter((s) => str(s.title)), trackIndex, personById, trackNames);
  // Session rows name their track so a template can print it; resolved after the day grouping.
  const trackName = new Map<number, string>(tracks.map((t) => [t.n, t.name]));
  days.forEach((day) => day.slots.forEach((slot) => slot.sessions.forEach((s) => { s.track = trackName.get(s.trackN) || ''; })));

  const tickets: EventTicketView[] = arr(d?.tickets).filter((t) => str(t.name)).map((t) => ({
    name: str(t.name), price: priceText(t.price, t.currency), description: str(t.description), features: arr(t.features).map(str).filter(Boolean),
    badge: str(t.badge), url: U(t.registrationUrl), hotN: str(t.badge) ? 2 : 1, available: t.isAvailable !== false,
  }));
  const sponsors: EventSponsorView[] = arr(d?.sponsors).filter((s) => str(s.name)).map((s) => ({ name: str(s.name), tier: str(s.tier), logo: U(s.logoUrl), url: U(s.websiteUrl) }));
  const TOP = new Set(['title', 'diamond', 'platinum']);
  const topSponsors = sponsors.filter((s) => TOP.has(s.tier));
  const otherSponsors = sponsors.filter((s) => !TOP.has(s.tier));
  const faqs: EventFaqView[] = arr(d?.faqs).map((x) => ({ question: str(x.question), answer: str(x.answer) })).filter((x) => x.question && x.answer);

  const gallery: EventPhotoView[] = [];
  const addPhoto = (url: unknown, caption: unknown) => { const u = U(url); if (u && !gallery.some((g) => g.url === u)) gallery.push({ url: u, caption: str(caption) }); };
  arr(d?.gallery).filter((g) => g.type !== 'video').forEach((g) => addPhoto(g.url, g.caption || g.title));
  arr(web.galleryPhotos as Array<{ url?: string; title?: string }> | undefined).forEach((g) => addPhoto(g.url, g.title));

  const videos: EventVideoView[] = [];
  arr(web.featuredVideos as Array<Record<string, unknown>> | undefined).forEach((vd) => {
    const embed = str(vd.embedUrl);
    if (!embed || videos.some((x) => x.embed === embed)) return;
    if (vd.provider === 'google_drive') { if (DRIVE_PREVIEW.test(embed)) videos.push({ embed, thumb: '', title: str(vd.title) || 'Video' }); return; }
    if (!/^https:\/\/(www\.youtube(-nocookie)?\.com|player\.vimeo\.com)\//.test(embed)) return;
    const vid = str(vd.videoId);
    videos.push({ embed, thumb: U(vd.thumbnailUrl) || (vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : ''), title: str(vd.title) || 'Video' });
  });

  const v = d?.venue;
  const venueName = str(v?.venueName) || str(p?.venueName);
  const venueAddress = str(v?.address) || str(p?.venueAddress);
  const city = str(v?.city) || str(p?.city);
  const country = str(v?.country) || str(p?.country);
  const travel: EventTravelView[] = [
    { label: 'By air', text: str(v?.airportInfo) }, { label: 'By transit', text: str(v?.metroTransit) }, { label: 'Parking', text: str(v?.parkingInfo) },
    { label: 'Access', text: v?.wheelchairAccessible ? 'Step-free access to the venue.' : '' },
  ].filter((x) => x.text);

  const startDate = str(p?.startDate);
  const endDate = str(p?.endDate);
  const longDate = /^\d{4}-\d{2}-\d{2}$/.test(startDate) && !Number.isNaN(Date.parse(startDate))
    ? new Date(`${startDate}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).replace(/^(\w+), (\w+ \d+), (\d+)$/, '$1 · $2 · $3')
    : '';
  const startTime = /^\d{2}:\d{2}$/.test(str(p?.startTime)) ? str(p?.startTime) : toHHmm(str(p?.time).split(/[-–]/)[0] || '');
  const endTime = /^\d{2}:\d{2}$/.test(str(p?.endTime)) ? str(p?.endTime) : '';
  const startsAtIso = /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? `${startDate}T${startTime || '00:00'}:00` : '';

  const stats: EventStatView[] = [
    days.length ? { label: days.length === 1 ? 'Day' : 'Days', value: String(days.length) } : null,
    tracks.length ? { label: tracks.length === 1 ? 'Track' : 'Tracks', value: String(tracks.length) } : null,
    speakers.length ? { label: speakers.length === 1 ? 'Speaker' : 'Speakers', value: String(speakers.length) } : null,
  ].filter(Boolean) as EventStatView[];

  const social: EventSocialView[] = Object.entries(p?.socialLinks || {}).map(([key, url]) => ({ key, label: SOCIAL_LABELS[key.toLowerCase()] || key, url: U(url) })).filter((s) => s.url);

  const exhibitors: EventExhibitorView[] = arr(d?.exhibitors).filter((x) => str(x.name)).map((x) => ({
    name: str(x.name), category: str(x.category), booth: str(x.boothNumber), hall: str(x.hallSector), description: str(x.description), logo: U(x.logoUrl), image: U(x.imageUrl), url: U(x.websiteUrl),
  }));
  const awards: EventAwardView[] = arr(d?.awardCategories).filter((c) => str(c.name)).map((c) => ({
    name: str(c.name), description: str(c.description),
    nominees: arr(c.nominees).filter((n) => str(n.title)).map((n) => ({ title: str(n.title), subtitle: str(n.subtitle), winner: Boolean(n.isWinner), image: U(n.imageUrl) })),
  }));
  const w = d?.weddingStory;
  const wedding = {
    coupleNames: str(w?.coupleNames), partnerOne: str(w?.partnerOne), partnerTwo: str(w?.partnerTwo),
    initials: [str(w?.partnerOne), str(w?.partnerTwo)].filter(Boolean).map((n) => n.charAt(0).toUpperCase()).join(' & '),
    dress: arr(w?.ceremonyItinerary).map((c) => str(c.dressCode)).find(Boolean) || '',
    milestones: arr(w?.storyMilestones).filter((m) => str(m.title)).map((m) => ({ title: str(m.title), date: formatDate(str(m.date)), text: str(m.text), image: U(m.imageUrl) })),
    itinerary: arr(w?.ceremonyItinerary).filter((c) => str(c.eventName)).map((c) => ({ time: str(c.time), name: str(c.eventName), venue: str(c.venue), dress: str(c.dressCode), description: str(c.description) })),
    hotels: arr(w?.hotelBlocks).filter((h) => str(h.hotelName)).map((h) => ({ name: str(h.hotelName), address: str(h.address), code: str(h.bookingCode), url: U(h.link), deadline: str(h.deadline), distance: str(h.distanceToVenue),
      line: [str(h.hotelName), str(h.distanceToVenue)].filter(Boolean).join(' · '), note: str(h.bookingCode) ? `Code: ${str(h.bookingCode)}` : str(h.deadline) ? `Book by ${str(h.deadline)}` : '' })),
    registry: arr(w?.registryLinks).map((r) => ({ name: str(r.storeName), url: U(r.url) })).filter((r) => r.name && r.url),
  };
  const pl = d?.productLaunch;
  const product = {
    name: str(pl?.productName), tagline: str(pl?.tagline), headline: str(pl?.heroHeadline), subheadline: str(pl?.heroSubheadline), video: U(pl?.revealVideoUrl),
    highlights: arr(pl?.bentoHighlights).filter((h) => str(h.title)).map((h) => ({ title: str(h.title), subtitle: str(h.subtitle), description: str(h.description), metric: str(h.metric), image: U(h.imageUrl) })),
    specs: arr(pl?.techSpecs).filter((g) => str(g.group)).map((g) => ({ group: str(g.group), items: arr(g.items).map((i) => ({ label: str(i.label), value: str(i.value) })).filter((i) => i.label && i.value) })),
    ctaText: str(pl?.preorderCtaText), url: U(pl?.preorderUrl),
  };

  const bookingUrl = tickets.find((t) => t.url)?.url || product.url;
  const email = str(p?.organizerEmail) || str(req.contactEmail);
  const phone = str(p?.organizerPhone) || str(req.contactPhone);
  const primary = HEX.test(str(b?.primaryColor)) ? str(b?.primaryColor) : '';
  const accent = HEX.test(str(b?.accentColor)) ? str(b?.accentColor) : '';
  const logo = U(b?.logoUrl) || U(req.logoUrl);
  const hero = U(b?.coverImageUrl) || U(req.coverImageUrl);
  const hasWedding = Boolean(wedding.coupleNames || wedding.milestones.length || wedding.itinerary.length);
  const hasProduct = Boolean(product.name || product.highlights.length || product.specs.length);

  return {
    name, shortName: name.length <= 24 ? name : words.slice(0, 3).join(' '), nameLead, nameLast, nameFirst, nameMid, edition: str(p?.edition), tagline: str(p?.tagline), description: str(p?.description),
    longDate, startDate, endDate, dateRange: dateRangeText(startDate, endDate), startTime, endTime, timeText: str(p?.time), timezone: str(p?.timezone), startsAtIso,
    airport: str(v?.airportInfo), transit: str(v?.metroTransit), parking: str(v?.parkingInfo), access: v?.wheelchairAccessible ? 'Step-free access to the venue.' : '',
    venueName, venueAddress, city, country, cityLine: [city, country].filter(Boolean).join(', '), venueLine: [venueName, city].filter(Boolean).join(', '), venueFull: [venueName, venueAddress, city, country].filter(Boolean).join(', '),
    organizer: str(p?.organizerName), email, phone, mailto: email ? `mailto:${email}` : '', tel: /\d{5,}/.test(str(p?.organizerPhone).replace(/[^\d+]/g, '')) ? `tel:${str(p?.organizerPhone).replace(/[^\d+]/g, '')}` : '',
    logo, hero, images: arr(req.additionalImages as string[] | undefined).map(U).filter(Boolean), primary, accent, badge: str(b?.badgeText),
    speakers, featuredSpeakers: speakers.filter((s) => s.featured), days, tracks, tickets, sponsors, topSponsors, otherSponsors, faqs, gallery, videos, travel, stats, social,
    socialBy: Object.fromEntries(social.map((s) => [s.key.toLowerCase() === 'twitter' ? 'x' : s.key.toLowerCase(), s.url])),
    exhibitors, awards, wedding, product, bookingUrl, year: String(new Date().getFullYear()),
    titleLine: str(p?.tagline) ? `${name} — ${str(p?.tagline)}` : name,
    has: {
      tagline: Boolean(str(p?.tagline)), description: Boolean(str(p?.description)), dates: Boolean(startDate), countdown: Boolean(startsAtIso), venue: Boolean(venueName || venueAddress),
      speakers: speakers.length > 0, schedule: days.length > 0, tickets: tickets.length > 0, sponsors: sponsors.length > 0, faqs: faqs.length > 0, gallery: gallery.length > 0,
      videos: videos.length > 0, travel: travel.length > 0, exhibitors: exhibitors.length > 0, awards: awards.length > 0, wedding: hasWedding, product: hasProduct,
      email: Boolean(email), phone: Boolean(phone), logo: Boolean(logo), hero: Boolean(hero), booking: Boolean(bookingUrl), social: social.length > 0,
    },
    isDemo: Boolean(props.isDemo),
  };
}
