import type { NgoTemplateProps } from '../types';

/**
 * Turns the project's NGO data into one stable, flat shape that every template mapping binds to.
 * Nothing is invented: a dataset the client did not supply is empty and its section is removed from the template.
 * Private fields (donor details, bank/UPI/PAN, volunteer submissions, Drive file ids) are never copied into the view.
 * Image URLs are made absolute because the template runs in a sandboxed frame with no origin of its own.
 */

export interface NgoProgramView { title: string; category: string; summary: string; description: string; beneficiaries: string; location: string; outcome: string; outcomes: string[]; image: string; status: string }
export interface NgoStatView { value: string; label: string; description: string }
export interface NgoPersonView { name: string; /** First word of the name and the rest, for designs that set the two in different weights. */ first: string; rest: string; role: string; tier: string; bio: string; photo: string }
export interface NgoStoryView { title: string; name: string; location: string; excerpt: string; story: string; quote: string; photo: string; date: string }
export interface NgoUpdateView { title: string; kind: string; kindLabel: string; date: string; dateText: string; summary: string; image: string; url: string }
export interface NgoRoleView { name: string; department: string; location: string; commitment: string; requirements: string }
export interface NgoPartnerView { name: string; logo: string; url: string; summary: string }
export interface NgoFaqView { question: string; answer: string }
export interface NgoPhotoView { url: string; caption: string }
export interface NgoVideoView { id: string; embed: string; thumb: string; title: string }
export interface NgoReportView { title: string; year: string; url: string }
export interface NgoSocialView { key: string; label: string; url: string }

export interface NgoView {
  name: string; shortName: string; tagline: string; mission: string; vision: string; about: string; founded: string; registration: string;
  values: string[]; regions: string[]; regionsLine: string;
  address: string; city: string; country: string; cityLine: string; email: string; phone: string; /** "tel:+441234…" (digits and a leading +), empty without a usable phone number. */ tel: string; website: string; contactPerson: string;
  logo: string; hero: string; images: string[]; primary: string; accent: string; badge: string;
  programs: NgoProgramView[]; stats: NgoStatView[]; people: NgoPersonView[]; stories: NgoStoryView[]; updates: NgoUpdateView[];
  volunteer: { enabled: boolean; headline: string; description: string; roles: NgoRoleView[] };
  support: { headline: string; text: string };
  partners: NgoPartnerView[]; faqs: NgoFaqView[]; gallery: NgoPhotoView[]; videos: NgoVideoView[]; reports: NgoReportView[]; social: NgoSocialView[];
  /** First value of each list, as flat paths a mapping can use directly. */
  firstProgram: NgoProgramView; firstStory: NgoStoryView; firstValue: string;
  year: string;
  /** Page title: the name, plus the tagline when there is one. */
  titleLine: string;
  has: {
    tagline: boolean; mission: boolean; vision: boolean; about: boolean; values: boolean; programs: boolean; stats: boolean; people: boolean; stories: boolean; updates: boolean;
    volunteer: boolean; support: boolean; partners: boolean; faqs: boolean; gallery: boolean; videos: boolean; reports: boolean; social: boolean;
    email: boolean; phone: boolean; address: boolean; logo: boolean; hero: boolean; contact: boolean;
  };
  isDemo: boolean;
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : typeof v === 'number' && Number.isFinite(v) ? String(v) : '');
const arr = <T,>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : []);

/** http(s) only. Relative `/path` URLs become absolute against `origin`. Anything else (javascript:, data:, file:) is dropped. */
export function safeUrl(url: unknown, origin: string): string {
  const s = str(url);
  if (!s) return '';
  if (s.startsWith('/') && !s.startsWith('//')) return origin ? origin + s : s;
  try { const u = new URL(s); return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : ''; } catch { return ''; }
}

const empty = (): NgoProgramView => ({ title: '', category: '', summary: '', description: '', beneficiaries: '', location: '', outcome: '', outcomes: [], image: '', status: '' });
const emptyStory = (): NgoStoryView => ({ title: '', name: '', location: '', excerpt: '', story: '', quote: '', photo: '', date: '' });

const SOCIAL_LABELS: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', x: 'X', twitter: 'X', linkedin: 'LinkedIn', youtube: 'YouTube', whatsapp: 'WhatsApp' };

const KIND_LABELS: Record<string, string> = { announcement: 'Announcement', news: 'News', campaign: 'Campaign', project: 'Project', event: 'Event', success_story: 'Story' };

/** `2026-10-02` becomes `2 Oct 2026`; anything that is not a date is returned as the client typed it. */
export function formatDate(s: string): string {
  if (!s) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return s;
  const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(dt.getTime())) return s;
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const DRIVE_PREVIEW = /^https:\/\/drive\.google\.com\/file\/d\/[\w-]+\/preview$/;

export function normalizeNgo(props: NgoTemplateProps, origin = ''): NgoView {
  const d = props.ngoData || (props.website as { ngoData?: NgoTemplateProps['ngoData'] } | undefined)?.ngoData || null;
  const req = (props.requirements || {}) as Record<string, unknown>;
  const web = (props.website || {}) as Record<string, unknown>;
  const p = d?.profile;
  const b = d?.branding;
  const U = (u: unknown) => safeUrl(u, origin);

  const name = str(p?.name) || str(req.organizationName);
  const programs: NgoProgramView[] = arr(d?.programs).map((x) => ({
    title: str(x.title), category: str(x.category), summary: str(x.shortSummary) || str(x.fullDescription), description: str(x.fullDescription) || str(x.shortSummary),
    beneficiaries: str(x.beneficiaryGroup), location: arr(x.locations).map(str).filter(Boolean).join(', '),
    outcome: arr(x.outcomes).map(str).find(Boolean) || '', outcomes: arr(x.outcomes).map(str).filter(Boolean), image: U(x.imageUrl), status: str(x.status),
  })).filter((x) => x.title);
  const stats: NgoStatView[] = arr(d?.impactStats).map((x) => ({ value: str(x.value), label: str(x.label), description: str(x.description) })).filter((x) => x.value && x.label);
  const people: NgoPersonView[] = arr(d?.leadership).map((x) => ({ name: str(x.name), first: str(x.name).split(/\s+/)[0] || '', rest: str(x.name).split(/\s+/).slice(1).join(' '), role: str(x.role), tier: str(x.tier), bio: str(x.bio), photo: U(x.photoUrl) })).filter((x) => x.name);
  const stories: NgoStoryView[] = arr(d?.stories).map((x) => ({
    title: str(x.title), name: str(x.beneficiaryName), location: str(x.location), excerpt: str(x.excerpt) || str(x.fullStory), story: str(x.fullStory) || str(x.excerpt),
    quote: str(x.quote), photo: U(x.photoUrl), date: str(x.date),
  })).filter((x) => x.title);

  // Updates: dated items the client entered, plus campaigns shown as informational updates (never with donation links).
  const rawUpdates = [
    ...arr(d?.updates).map((x) => ({ title: str(x.title), kind: str(x.kind), date: str(x.date), summary: str(x.summary), image: U(x.imageUrl), url: U(x.linkUrl) })),
    ...arr(d?.campaigns).map((c) => ({ title: str(c.title), kind: 'campaign', date: str(c.startDate), summary: str(c.tagline) || str(c.description), image: U(c.imageUrl), url: '' })),
  ];
  const updates: NgoUpdateView[] = rawUpdates.filter((x) => x.title).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .map((x) => ({ ...x, kindLabel: KIND_LABELS[x.kind] || '', dateText: formatDate(x.date) }));

  const v = d?.volunteering;
  const roles: NgoRoleView[] = arr(v?.opportunities).map((o) => ({ name: str(o.roleName), department: str(o.department), location: str(o.location), commitment: str(o.commitment), requirements: arr(o.requirements).map(str).filter(Boolean).join(', ') })).filter((o) => o.name);
  const volunteer = { enabled: Boolean(v?.enabled) && Boolean(str(v?.headline) || str(v?.description) || roles.length), headline: str(v?.headline), description: str(v?.description), roles };

  const partners: NgoPartnerView[] = arr(d?.partners).map((x) => ({ name: str(x.name), logo: U(x.logoUrl), url: U(x.websiteUrl), summary: str(x.contributionSummary) })).filter((x) => x.name);
  const faqs: NgoFaqView[] = arr(d?.faqs).map((x) => ({ question: str(x.question), answer: str(x.answer) })).filter((x) => x.question && x.answer);
  const reports: NgoReportView[] = arr(d?.reports).map((x) => ({ title: str(x.title), year: str(x.financialYear), url: U(x.fileUrl) })).filter((x) => x.title);

  const gallery: NgoPhotoView[] = [];
  const addPhoto = (url: unknown, caption: unknown) => { const u = U(url); if (u && !gallery.some((g) => g.url === u)) gallery.push({ url: u, caption: str(caption) }); };
  arr(d?.gallery).filter((g) => g.type !== 'video').forEach((g) => addPhoto(g.url, g.caption || g.title));
  arr(web.galleryPhotos as Array<{ url?: string; title?: string }> | undefined).forEach((g) => addPhoto(g.url, g.title));

  const videos: NgoVideoView[] = [];
  arr(web.featuredVideos as Array<Record<string, unknown>> | undefined).forEach((vd) => {
    const embed = str(vd.embedUrl);
    if (!embed || videos.some((x) => x.embed === embed)) return;
    if (vd.provider === 'google_drive') {
      // Drive's own player; only a genuine Drive file URL is accepted and there is no thumbnail we may hotlink.
      if (!DRIVE_PREVIEW.test(embed)) return;
      const t = str(vd.title);
      videos.push({ id: str(vd.id), embed, thumb: '', title: t && !/^Drive Video \(/.test(t) ? t : 'Video' });
      return;
    }
    if (!/^https:\/\/(www\.youtube(-nocookie)?\.com|player\.vimeo\.com)\//.test(embed)) return;
    const vid = str(vd.videoId);
    videos.push({ id: str(vd.id), embed, thumb: U(vd.thumbnailUrl) || (vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : ''), title: str(vd.title) || 'Video' });
  });

  const social: NgoSocialView[] = Object.entries(p?.socialLinks || {}).map(([key, url]) => ({ key, label: SOCIAL_LABELS[key.toLowerCase()] || key, url: U(url) })).filter((s) => s.url);

  const primary = HEX.test(str(b?.primaryColor)) ? str(b?.primaryColor) : '';
  const accent = HEX.test(str(b?.accentColor)) ? str(b?.accentColor) : '';
  const email = str(p?.contactEmail) || str(req.contactEmail);
  const phone = str(p?.contactPhone) || str(req.contactPhone);
  const address = str(p?.headquartersAddress);
  const city = str(p?.city);
  const country = str(p?.country);
  const regions = arr(p?.operationalRegions).map(str).filter(Boolean);
  const values = arr(p?.coreValues).map(str).filter(Boolean);
  const support = { headline: str(d?.supportInfo?.headline), text: str(d?.supportInfo?.text) };
  const logo = U(b?.logoUrl) || U(req.logoUrl);
  const hero = U(b?.coverImageUrl) || U(req.coverImageUrl);
  const images = arr(req.additionalImages as string[] | undefined).map(U).filter(Boolean);

  return {
    name, shortName: name.length <= 24 ? name : name.split(/\s+/).slice(0, 3).join(' '), tagline: str(p?.tagline), mission: str(p?.missionStatement), vision: str(p?.visionStatement),
    about: str(p?.aboutDescription), founded: str(p?.foundedYear), registration: str(p?.registrationNumber), values, regions, regionsLine: regions.join(' · '),
    address, city, country, cityLine: [city, country].filter(Boolean).join(', '), email, phone, tel: /\d{5,}/.test(phone.replace(/[^\d+]/g, '')) ? `tel:${phone.replace(/[^\d+]/g, '')}` : '', website: U(p?.websiteUrl), contactPerson: str(p?.contactPerson),
    logo, hero, images, primary, accent, badge: str(b?.badgeText),
    programs, stats, people, stories, updates, volunteer, support, partners, faqs, gallery, videos, reports, social,
    firstProgram: programs[0] || empty(), firstStory: stories[0] || emptyStory(), firstValue: values[0] || '',
    year: String(new Date().getFullYear()),
    titleLine: str(p?.tagline) ? `${name} — ${str(p?.tagline)}` : name,
    has: {
      tagline: Boolean(str(p?.tagline)), mission: Boolean(str(p?.missionStatement)), vision: Boolean(str(p?.visionStatement)), about: Boolean(str(p?.aboutDescription)), values: values.length > 0,
      programs: programs.length > 0, stats: stats.length > 0, people: people.length > 0, stories: stories.length > 0, updates: updates.length > 0, volunteer: volunteer.enabled,
      support: Boolean(support.headline || support.text), partners: partners.length > 0, faqs: faqs.length > 0, gallery: gallery.length > 0, videos: videos.length > 0, reports: reports.length > 0,
      social: social.length > 0, email: Boolean(email), phone: Boolean(phone), address: Boolean(address), logo: Boolean(logo), hero: Boolean(hero), contact: Boolean(email || phone || address),
    },
    isDemo: Boolean(props.isDemo),
  };
}
