import type { PortfolioTemplateProps } from '../types';
import { art, type ArtKind, type PaletteName } from './art';

/**
 * Turns the loosely-typed PortfolioWebsiteData (many optional / duplicate fields) into one stable shape
 * every template reads. Missing content never throws: sections simply report `has.x === false` and the
 * template hides them, so a sparse client profile still renders as a finished design.
 */

export interface NSocial { key: string; label: string; url: string }
export interface NSkill { id: string; name: string; category: string; level: string; score: number; years?: number; featured: boolean }
export interface NProject {
  id: string; title: string; subtitle?: string; summary: string; description: string; category: string;
  image: string; hasRealImage: boolean; gallery: string[]; liveUrl?: string; sourceUrl?: string; caseStudyUrl?: string;
  tags: string[]; tech: string[]; role?: string; year?: string; metrics: { label: string; value: string }[]; featured: boolean;
}
export interface NExp {
  id: string; role: string; company: string; location?: string; period: string; current: boolean;
  description: string; highlights: string[]; tech: string[];
}
export interface NEdu { id: string; degree: string; institution: string; location?: string; year?: string; honors?: string }
export interface NPub { id: string; title: string; venue?: string; year?: string; url?: string; authors: string[]; abstract?: string; bibtex?: string; type?: string; doi?: string }
export interface NService { id: string; title: string; description: string; deliverables: string[]; price?: string; timeline?: string; featured: boolean }
export interface NTestimonial { id: string; quote: string; author: string; role?: string; avatar?: string; rating?: number }
export interface NStat { value: string; label: string }
/** An award or a certification, flattened so templates can list them together. */
export interface NRecognition { id: string; title: string; issuer?: string; year?: string; url?: string; description?: string; kind: 'award' | 'certification' }
export interface NVideo { id: string; url: string; embed: string; thumb: string; title: string }
export interface NPhoto { id: string; src: string; title: string; category: string; ratio: number }

export interface NormalizedPortfolio {
  name: string; firstName: string; initials: string; title: string; headline: string; bio: string; story?: string;
  avatar: string; hasRealAvatar: boolean; cover: string; location?: string; email?: string; phone?: string;
  available: boolean; availabilityLabel: string; years?: number; company?: string; role?: string; cta: string;
  interests: string[]; socials: NSocial[];
  skills: NSkill[]; skillGroups: { name: string; items: NSkill[] }[];
  projects: NProject[]; featuredProjects: NProject[]; projectCategories: string[];
  experience: NExp[]; education: NEdu[]; publications: NPub[]; services: NService[]; testimonials: NTestimonial[];
  videos: NVideo[];
  photos: NPhoto[];
  /** Up to three headline numbers. Derived from the client's own content (see below). */
  stats: NStat[];
  recognition: NRecognition[];
  resumeUrl?: string;
  has: { skills: boolean; projects: boolean; experience: boolean; education: boolean; publications: boolean; services: boolean; testimonials: boolean; media: boolean; photos: boolean; recognition: boolean };
  isDemo: boolean;
}

const SOCIAL_LABELS: Record<string, string> = {
  github: 'GitHub', linkedin: 'LinkedIn', twitter: 'X / Twitter', x: 'X / Twitter', instagram: 'Instagram', youtube: 'YouTube',
  dribbble: 'Dribbble', behance: 'Behance', facebook: 'Facebook', website: 'Website', medium: 'Medium', tiktok: 'TikTok',
  scholar: 'Google Scholar', googlescholar: 'Google Scholar', orcid: 'ORCID', kaggle: 'Kaggle', figma: 'Figma', vimeo: 'Vimeo',
  whatsapp: 'WhatsApp', pinterest: 'Pinterest', twitch: 'Twitch', spotify: 'Spotify', threads: 'Threads', artstation: 'ArtStation'
};

const LEVEL_SCORE: Record<string, number> = { expert: 0.95, master: 0.95, advanced: 0.82, proficient: 0.75, intermediate: 0.6, familiar: 0.45, beginner: 0.35, novice: 0.3 };

function levelScore(level?: string): number {
  if (!level) return 0.7;
  const n = parseFloat(level);
  if (!Number.isNaN(n)) return Math.max(0.1, Math.min(1, n > 1 ? n / 100 : n));
  return LEVEL_SCORE[level.toLowerCase().trim()] ?? 0.7;
}

export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  return m ? m[1] : null;
}

const toStr = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const arr = <T,>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : []);

export interface NormalizeOptions {
  /** Style of generated artwork used for projects without a real image. */
  art?: ArtKind;
  palette?: PaletteName;
  portraitPalette?: PaletteName;
}

/**
 * Headline numbers. The generator's `website.metrics` are generic placeholders (events, keynotes, media
 * assets) that mean nothing for a portfolio, so real sites show facts derived from the client's own content.
 * Demo previews show the curated `website.metrics` instead.
 */
function buildStats(
  props: PortfolioTemplateProps,
  n: { years?: number; projects: number; skills: number; publications: number; testimonials: number; videos: number; photos: number; services: number }
): NStat[] {
  if (props.isDemo && Array.isArray(props.website?.metrics) && props.website.metrics.length) {
    return props.website.metrics.slice(0, 3).map((m) => ({ value: String(m.value), label: String(m.label) }));
  }
  const out: NStat[] = [];
  if (n.years && n.years > 0) out.push({ value: `${n.years}+`, label: n.years === 1 ? 'Year of experience' : 'Years of experience' });
  if (n.projects > 0) out.push({ value: String(n.projects), label: n.projects === 1 ? 'Project' : 'Projects' });
  if (n.publications > 0) out.push({ value: String(n.publications), label: n.publications === 1 ? 'Publication' : 'Publications' });
  if (n.photos > 3) out.push({ value: String(n.photos), label: 'Photographs' });
  if (n.videos > 0) out.push({ value: String(n.videos), label: n.videos === 1 ? 'Video' : 'Videos' });
  if (n.services > 0) out.push({ value: String(n.services), label: n.services === 1 ? 'Service' : 'Services' });
  if (n.skills > 0) out.push({ value: String(n.skills), label: 'Skills' });
  if (n.testimonials > 0) out.push({ value: String(n.testimonials), label: n.testimonials === 1 ? 'Client review' : 'Client reviews' });
  return out.slice(0, 3);
}

export function normalizePortfolio(props: PortfolioTemplateProps, opts: NormalizeOptions = {}): NormalizedPortfolio {
  const { requirements, portfolioData } = props;
  const id = portfolioData?.identity;
  const name = toStr(id?.displayName) || toStr(id?.fullName) || requirements?.organizationName || 'Your Name';
  const first = name.split(/\s+/)[0] || name;
  const kind = opts.art || 'mesh';
  const palette = opts.palette || 'dusk';

  const socialsRaw: Record<string, string> = { ...(portfolioData?.socialLinks || {}), ...(id?.socialLinks || {}) };
  const socials: NSocial[] = Object.entries(socialsRaw)
    .filter(([, url]) => typeof url === 'string' && url.trim())
    .map(([key, url]) => ({ key: key.toLowerCase(), label: SOCIAL_LABELS[key.toLowerCase()] || key, url: url.trim() }));

  const skills: NSkill[] = arr(portfolioData?.skills).map((s, i) => {
    const level = toStr(s.proficiency) || toStr(s.level);
    return {
      id: s.id || `skill-${i}`, name: s.name, category: s.category || 'Skills', level,
      score: levelScore(level), years: s.yearsOfExperience ?? s.yearsUsing, featured: !!s.featured
    };
  });
  const groupMap = new Map<string, NSkill[]>();
  skills.forEach((s) => groupMap.set(s.category, [...(groupMap.get(s.category) || []), s]));
  const skillGroups = [...groupMap.entries()].map(([n, items]) => ({ name: n, items }));

  const projects: NProject[] = arr(portfolioData?.projects)
    .slice()
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .map((p, i) => {
      const real = p.featuredImageUrl || p.imageUrl || arr(p.galleryImages)[0] || '';
      // Profession-specific details from the intake: shown as facts next to the project and as a short story.
      const facts = ([['Client', p.client], ['Location', p.location], ['Area', p.area]] as [string, string | undefined][])
        .filter(([, v]) => toStr(v)).map(([label, value]) => ({ label, value: toStr(value) }));
      const story = [p.problem && `The problem: ${toStr(p.problem)}`, p.process && `The process: ${toStr(p.process)}`, p.outcome && `The outcome: ${toStr(p.outcome)}`].filter(Boolean).join(' ');
      return {
        id: p.id || `project-${i}`, title: p.title, subtitle: p.subtitle,
        summary: toStr(p.summary) || toStr(p.description),
        description: toStr(p.detailedDescription) || [toStr(p.description) || toStr(p.summary), story].filter(Boolean).join(' ') || toStr(p.summary),
        category: p.category || 'Work',
        image: real || art(kind, `${p.title}:${i}`, palette), hasRealImage: !!real,
        gallery: arr(p.galleryImages).length ? arr(p.galleryImages) : [],
        liveUrl: p.liveUrl, sourceUrl: p.sourceUrl || p.githubUrl, caseStudyUrl: p.caseStudyUrl,
        tags: arr(p.tags), tech: arr(p.technologies), role: p.role, year: p.year,
        metrics: [...arr(p.metrics), ...facts], featured: !!p.featured
      };
    });

  const experience: NExp[] = arr(portfolioData?.experience).map((e, i) => ({
    id: e.id || `exp-${i}`,
    role: toStr(e.title) || toStr(e.role),
    company: toStr(e.company) || toStr(e.organization),
    location: e.location,
    period: e.period || [e.startDate, e.current || e.isCurrentRole ? 'Present' : e.endDate].filter(Boolean).join(' – '),
    current: !!(e.current || e.isCurrentRole),
    description: toStr(e.description), highlights: arr(e.highlights),
    tech: arr(e.technologies).length ? arr(e.technologies) : arr(e.technologiesUsed)
  }));

  const education: NEdu[] = arr(portfolioData?.education).map((e, i) => ({
    id: e.id || `edu-${i}`, degree: e.degree, institution: e.institution, location: e.location,
    year: e.year || e.yearGraduated, honors: e.honors
  }));

  const recognition: NRecognition[] = [
    ...arr(portfolioData?.certifications).map((c, i): NRecognition => ({ id: c.id || `cert-${i}`, title: c.name, issuer: c.issuer, year: c.year, url: c.credentialUrl, kind: 'certification' })),
    ...arr(portfolioData?.achievements).map((a, i): NRecognition => ({ id: a.id || `ach-${i}`, title: a.title, issuer: a.issuer, year: a.year, url: a.url, description: a.description, kind: 'award' }))
  ];

  const publications: NPub[] = arr(portfolioData?.publications).map((p, i) => ({
    id: p.id || `pub-${i}`, title: p.title, venue: p.publisher || p.publisherOrJournal,
    year: p.year || p.publicationDate, url: p.url || p.link, authors: arr(p.authors), abstract: p.abstract,
    bibtex: p.bibtex, type: p.type, doi: p.doi
  }));

  const services: NService[] = arr(portfolioData?.services).map((s, i) => ({
    id: s.id || `svc-${i}`, title: s.title, description: s.description, deliverables: arr(s.deliverables),
    price: s.startingPrice || s.price, timeline: s.timeline, featured: !!s.featured
  }));

  const testimonials: NTestimonial[] = arr(portfolioData?.testimonials).map((t, i) => ({
    id: t.id || `t-${i}`, quote: t.quote,
    author: toStr(t.authorName) || toStr(t.clientName) || 'Client',
    role: [t.authorTitle || t.clientRole, t.clientCompany || t.organization].filter(Boolean).join(' · ') || undefined,
    avatar: t.avatarUrl, rating: t.rating
  }));

  const media = portfolioData?.media;
  const ytUrls = [...arr(media?.youtubeUrls), ...(media?.youtubeUrl ? [media.youtubeUrl] : []), ...arr(media?.googleDriveVideoUrls)];
  const videos: NVideo[] = [];
  ytUrls.forEach((u, i) => {
    const vid = youtubeId(u);
    if (vid) videos.push({ id: `v-${i}`, url: u, embed: `https://www.youtube-nocookie.com/embed/${vid}`, thumb: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`, title: `Video ${videos.length + 1}` });
  });
  (props.website?.featuredVideos || []).forEach((v) => {
    if (v.provider === 'google_drive' || !v.embedUrl || videos.some((x) => x.embed === v.embedUrl)) return;
    videos.push({ id: v.id, url: v.originalUrl, embed: v.embedUrl, thumb: v.thumbnailUrl || (v.videoId ? `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg` : ''), title: v.title });
  });

  // Photo pool: uploaded gallery photos first, then project galleries and branding images (deduplicated).
  const ratios = [1.5, 0.75, 1.33, 1, 0.8, 1.78, 1.25];
  const photoSeen = new Set<string>();
  const photos: NPhoto[] = [];
  const addPhoto = (src: string | undefined, title: string, category: string) => {
    if (!src || photoSeen.has(src)) return;
    photoSeen.add(src);
    photos.push({ id: `ph-${photos.length}`, src, title, category: category || 'Work', ratio: ratios[photos.length % ratios.length] });
  };
  (props.website?.galleryPhotos || []).forEach((p) => addPhoto(p.url, p.title, p.category || ''));
  projects.forEach((p) => {
    if (p.hasRealImage) addPhoto(p.image, p.title, p.category);
    p.gallery.forEach((g, gi) => addPhoto(g, `${p.title} ${gi + 1}`, p.category));
  });
  arr(media?.additionalBrandingImages).forEach((u, i) => addPhoto(u, `Frame ${i + 1}`, 'Gallery'));

  const avatarReal = id?.profilePhotoUrl || id?.avatarUrl || requirements?.logoUrl || '';
  const cover = id?.heroCoverUrl || id?.coverImageUrl || media?.officialHeroBannerUrl || '';
  const availability = toStr(id?.availabilityStatus);
  const available = id?.availableForHire ?? /open|available|hire/i.test(availability);

  return {
    name, firstName: first, initials: name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || 'P',
    title: toStr(id?.professionalTitle) || toStr(id?.title) || toStr(id?.currentRole) || '',
    headline: toStr(id?.headline) || toStr(id?.tagline) || requirements?.tagline || '',
    bio: toStr(portfolioData?.about?.bio) || toStr(id?.bio) || requirements?.aboutText || '',
    story: portfolioData?.about?.story,
    avatar: avatarReal || art('portrait', name, opts.portraitPalette || palette), hasRealAvatar: !!avatarReal,
    cover: cover || art(kind, `${name}:cover`, palette),
    location: id?.location || requirements?.address, email: id?.email || requirements?.contactEmail, phone: id?.phone || requirements?.contactPhone,
    available: !!available,
    availabilityLabel: available ? (availability && !/^open_for/.test(availability) ? availability : 'Available for new projects') : 'Currently booked',
    years: id?.yearsOfExperience, company: id?.currentCompany, role: id?.currentRole,
    cta: portfolioData?.navigationConfig?.ctaButtonText || 'Get in touch',
    interests: arr(portfolioData?.about?.interests),
    socials, skills, skillGroups, projects,
    featuredProjects: projects.filter((p) => p.featured).length ? projects.filter((p) => p.featured) : projects.slice(0, 4),
    projectCategories: [...new Set(projects.map((p) => p.category))],
    experience, education, publications, services, testimonials, videos, photos,
    recognition, resumeUrl: toStr(portfolioData?.resumeUrl) || undefined,
    stats: buildStats(props, { years: id?.yearsOfExperience, projects: projects.length, skills: skills.length, publications: publications.length, testimonials: testimonials.length, videos: videos.length, photos: photos.length, services: services.length }),
    has: {
      skills: skills.length > 0, projects: projects.length > 0, experience: experience.length > 0, education: education.length > 0,
      publications: publications.length > 0, services: services.length > 0, testimonials: testimonials.length > 0, media: videos.length > 0, photos: photos.length > 0, recognition: recognition.length > 0
    },
    isDemo: !!props.isDemo
  };
}
