import type { ClientRequirements, SelectedTemplateMetadata } from '../../../types/admin';
import type { PortfolioArchetype, PortfolioWebsiteData } from '../../../types/portfolio';
import { getProfession } from '../../../templates/portfolio/professions';

/* ------------------------------------------------------------------ entries */

export interface SkillEntry { id: string; name: string; category: string; proficiency: string }
export interface ExperienceEntry { id: string; role: string; company: string; location: string; startDate: string; endDate: string; current: boolean; description: string }
export interface EducationEntry { id: string; degree: string; institution: string; location: string; year: string; honors: string }
export interface ProjectEntry {
  id: string; title: string; summary: string; category: string; year: string; role: string; client: string;
  problem: string; process: string; outcome: string; location: string; area: string; tools: string;
  liveUrl: string; githubUrl: string; caseStudyUrl: string; videoUrl: string; image: string; gallery: string[];
}
export interface AchievementEntry { id: string; title: string; issuer: string; year: string; description: string; url: string }
export interface CertificationEntry { id: string; name: string; issuer: string; year: string; credentialUrl: string }
export interface PublicationEntry { id: string; title: string; venue: string; year: string; authors: string; url: string; abstract: string }
export interface ServiceEntry { id: string; title: string; description: string; price: string; timeline: string; deliverables: string }
export interface TestimonialEntry { id: string; quote: string; author: string; role: string; company: string }

export interface IntakeForm {
  // 1 identity
  fullName: string; email: string; phone: string; location: string;
  // 2 title and introduction
  title: string; headline: string; bio: string; yearsOfExperience: string; currentCompany: string; currentRole: string; availableForHire: boolean;
  // 3-7 lists
  experience: ExperienceEntry[]; skills: SkillEntry[]; education: EducationEntry[]; projects: ProjectEntry[];
  achievements: AchievementEntry[]; certifications: CertificationEntry[];
  publications: PublicationEntry[]; services: ServiceEntry[]; testimonials: TestimonialEntry[];
  // 8 assets
  profilePhoto: string; coverImage: string; additionalImages: string[];
  googleDriveGalleryUrl: string; googleDriveVideoUrl: string; googleDriveVideoUrls: string[]; youtubeUrls: string[]; youtubePlaylistUrls: string[];
  // 9 links
  resumeUrl: string; socialLinks: Record<string, string>;
  // 10 design
  template: SelectedTemplateMetadata;
}

export const STEP_TITLES = [
  'Identity', 'Introduction', 'Experience', 'Skills', 'Education', 'Work', 'Achievements', 'Assets', 'Links', 'Design & review'
] as const;

let uid = 0;
export const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(uid++).toString(36)}`;

/** Start empty: nothing is invented for the client. Only the chosen template is pre-set. */
export function emptyForm(template: SelectedTemplateMetadata): IntakeForm {
  return {
    fullName: '', email: '', phone: '', location: '',
    title: '', headline: '', bio: '', yearsOfExperience: '', currentCompany: '', currentRole: '', availableForHire: true,
    experience: [], skills: [], education: [], projects: [], achievements: [], certifications: [], publications: [], services: [], testimonials: [],
    profilePhoto: '', coverImage: '', additionalImages: [], googleDriveGalleryUrl: '', googleDriveVideoUrl: '', googleDriveVideoUrls: [], youtubeUrls: [], youtubePlaylistUrls: [],
    resumeUrl: '', socialLinks: {},
    template
  };
}

export const emptyProject = (): ProjectEntry => ({
  id: newId('proj'), title: '', summary: '', category: '', year: '', role: '', client: '', problem: '', process: '', outcome: '',
  location: '', area: '', tools: '', liveUrl: '', githubUrl: '', caseStudyUrl: '', videoUrl: '', image: '', gallery: []
});

/* ------------------------------------------------------------------- pruning */

const filled = (o: object, keys: string[]) => keys.some((k) => {
  const v = (o as Record<string, unknown>)[k];
  return Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim() !== '' : false;
});

/** Drops cards the user added but never filled in, so they neither block a step nor reach the site. */
export function pruneBlank(f: IntakeForm): IntakeForm {
  const projectKeys = Object.keys(emptyProject()).filter((k) => k !== 'id');
  return {
    ...f,
    skills: f.skills.filter((x) => x.name.trim()),
    experience: f.experience.filter((x) => filled(x, ['role', 'company', 'location', 'startDate', 'endDate', 'description'])),
    education: f.education.filter((x) => filled(x, ['degree', 'institution', 'location', 'year', 'honors'])),
    projects: f.projects.filter((x) => filled(x, projectKeys)),
    achievements: f.achievements.filter((x) => filled(x, ['title', 'issuer', 'year', 'description', 'url'])),
    certifications: f.certifications.filter((x) => filled(x, ['name', 'issuer', 'year', 'credentialUrl'])),
    publications: f.publications.filter((x) => filled(x, ['title', 'venue', 'year', 'authors', 'url', 'abstract'])),
    services: f.services.filter((x) => filled(x, ['title', 'description', 'price', 'timeline', 'deliverables'])),
    testimonials: f.testimonials.filter((x) => filled(x, ['quote', 'author', 'role', 'company']))
  };
}

/* --------------------------------------------------------------- validation */

export type FieldErrors = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isEmail = (v: string) => EMAIL.test(v.trim());
export function isHttpUrl(v: string): boolean {
  try { const u = new URL(v.trim()); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
}
/** Uploaded assets are stored as site-relative paths (for example /uploads/x.jpg) as well as full URLs. */
export const isAssetUrl = (v: string) => v.startsWith('/') || isHttpUrl(v);

/** Errors for one step. An empty object means the step may be left. */
export function validateStep(step: number, form: IntakeForm, archetype: PortfolioArchetype): FieldErrors {
  const f = pruneBlank(form);
  const e: FieldErrors = {};
  const urlOk = (v: string) => !v.trim() || isHttpUrl(v);
  const prof = getProfession(archetype);
  switch (step) {
    case 1:
      if (f.fullName.trim().length < 2) e.fullName = 'Enter the client’s full name.';
      if (!f.email.trim()) e.email = 'Enter a contact email.';
      else if (!isEmail(f.email)) e.email = 'This email address does not look valid.';
      if (f.phone.trim() && f.phone.replace(/\D/g, '').length < 7) e.phone = 'Enter a phone number with at least 7 digits, or leave it blank.';
      break;
    case 2: {
      if (f.title.trim().length < 3) e.title = 'Enter the professional title, for example “' + prof.copy.titlePlaceholder.replace(/^e\.g\.\s*/, '') + '”.';
      if (f.headline.trim().length < 10) e.headline = 'Write a headline of at least 10 characters.';
      if (f.bio.trim().length < 30) e.bio = 'Write a short biography of at least 30 characters.';
      if (f.yearsOfExperience.trim()) {
        const n = Number(f.yearsOfExperience);
        if (!Number.isFinite(n) || n < 0 || n > 70) e.yearsOfExperience = 'Enter years as a number between 0 and 70.';
      }
      break;
    }
    case 3:
      for (const x of f.experience) if (!x.role.trim() || !x.company.trim()) e[`experience_${x.id}`] = 'Each experience entry needs a role and a company.';
      break;
    case 4:
      if (f.skills.length < 1) e.skills = 'Add at least one skill.';
      break;
    case 5:
      for (const x of f.education) if (!x.degree.trim() || !x.institution.trim()) e[`education_${x.id}`] = 'Each education entry needs a degree or qualification and an institution.';
      if (archetype === 'student_grad' && f.education.length < 1) e.education = 'Students and graduates need at least one education entry.';
      break;
    case 6: {
      const hasProjects = f.projects.length > 0;
      const ok = prof.requiredWork === 'projects' ? hasProjects
        : prof.requiredWork === 'projects_or_services' ? hasProjects || f.services.length > 0
        : hasProjects || f.education.length > 0;
      if (!ok) e.projects = prof.requiredWork === 'projects' ? `Add at least one ${prof.copy.projectNoun}.`
        : prof.requiredWork === 'projects_or_services' ? `Add at least one ${prof.copy.projectNoun} or one service.`
        : `Add at least one ${prof.copy.projectNoun} or an education entry.`;
      if (archetype === 'photographer' && hasProjects && f.projects.every((p) => !p.image)) e.projects = 'Add a cover image to at least one gallery.';
      for (const p of f.projects) {
        if (!p.title.trim()) e[`project_${p.id}`] = `Give this ${prof.copy.projectNoun} a title.`;
        else if (![p.liveUrl, p.githubUrl, p.caseStudyUrl, p.videoUrl].every(urlOk)) e[`project_${p.id}`] = 'Links must be full web addresses, starting with https://';
      }
      for (const x of f.services) if (!x.title.trim() || !x.description.trim()) e[`service_${x.id}`] = 'Each service needs a title and a short description.';
      for (const x of f.publications) if (!x.title.trim()) e[`publication_${x.id}`] = 'Give this publication a title.';
      else if (!urlOk(x.url)) e[`publication_${x.id}`] = 'The publication link must start with https://';
      break;
    }
    case 7:
      for (const x of f.achievements) if (!x.title.trim()) e[`achievement_${x.id}`] = 'Give each achievement a title.';
      for (const x of f.certifications) if (!x.name.trim()) e[`certification_${x.id}`] = 'Give each certification a name.';
      else if (!urlOk(x.credentialUrl)) e[`certification_${x.id}`] = 'The credential link must start with https://';
      for (const x of f.testimonials) if (!x.quote.trim()) e[`testimonial_${x.id}`] = 'Each testimonial needs the quote itself.';
      break;
    case 8:
      if (f.profilePhoto && !isAssetUrl(f.profilePhoto)) e.profilePhoto = 'The profile photo must be an uploaded file or a web link.';
      if (f.coverImage && !isAssetUrl(f.coverImage)) e.coverImage = 'The cover image must be an uploaded file or a web link.';
      break;
    case 9: {
      if (f.resumeUrl.trim() && !isAssetUrl(f.resumeUrl.trim())) e.resumeUrl = 'Enter a full link, starting with https://';
      for (const [k, v] of Object.entries(f.socialLinks)) if (v.trim() && !isHttpUrl(v)) e[`social_${k}`] = 'Enter a full link, starting with https://';
      break;
    }
    default:
      break;
  }
  return e;
}

/** All problems in the form, grouped by step (used by the final review). */
export function validateAll(f: IntakeForm, archetype: PortfolioArchetype): { step: number; errors: FieldErrors }[] {
  const out: { step: number; errors: FieldErrors }[] = [];
  for (let s = 1; s <= 9; s++) { const errors = validateStep(s, f, archetype); if (Object.keys(errors).length) out.push({ step: s, errors }); }
  return out;
}

/* ------------------------------------------------------------ build payload */

const csv = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean);
const clean = (v: string) => (v.trim() ? v.trim() : undefined);

/** Builds the requirements object the API stores. Empty fields are omitted rather than invented. */
export function buildRequirements(form: IntakeForm, archetype: PortfolioArchetype): ClientRequirements {
  const f = pruneBlank(form);
  const years = f.yearsOfExperience.trim() ? Number(f.yearsOfExperience) : undefined;
  const socialLinks = Object.fromEntries(Object.entries(f.socialLinks).filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()]));
  // Video links given on individual projects are added to the site's video list (YouTube links are embedded).
  const youtubeUrls = [...new Set([...f.youtubeUrls, ...f.projects.map((p) => p.videoUrl.trim()).filter(Boolean)])];
  const period = (x: ExperienceEntry) => [x.startDate.trim(), x.current ? 'Present' : x.endDate.trim()].filter(Boolean).join(' – ');

  const portfolioData: PortfolioWebsiteData = {
    schemaVersion: '1.0',
    archetype,
    professionCategory: archetype,
    identity: {
      fullName: f.fullName.trim(), displayName: f.fullName.trim(), title: f.title.trim(), professionalTitle: f.title.trim(),
      headline: f.headline.trim(), bio: f.bio.trim(),
      profilePhotoUrl: clean(f.profilePhoto), avatarUrl: clean(f.profilePhoto), heroCoverUrl: clean(f.coverImage), coverImageUrl: clean(f.coverImage),
      location: clean(f.location), email: f.email.trim(), phone: clean(f.phone),
      yearsOfExperience: years, currentCompany: clean(f.currentCompany), currentRole: clean(f.currentRole),
      availableForHire: f.availableForHire, availabilityStatus: f.availableForHire ? 'open_for_projects' : 'not_available',
      socialLinks
    },
    // The generator fills empty about-fields with sample copy; explicit empties keep client sites free of it.
    about: { bio: f.bio.trim(), interests: [] },
    skills: f.skills.map((s) => ({ id: s.id, name: s.name, category: s.category || undefined, proficiency: s.proficiency || undefined, level: s.proficiency ? s.proficiency.toLowerCase() : undefined, featured: true })),
    projects: f.projects.map((p, i) => ({
      id: p.id, title: p.title.trim(), summary: clean(p.summary), description: clean(p.summary), category: clean(p.category), year: clean(p.year), role: clean(p.role),
      client: clean(p.client), problem: clean(p.problem), process: clean(p.process), outcome: clean(p.outcome), location: clean(p.location), area: clean(p.area),
      tools: csv(p.tools), technologies: csv(p.tools),
      featuredImageUrl: clean(p.image), imageUrl: clean(p.image), galleryImages: p.gallery.filter(Boolean),
      liveUrl: clean(p.liveUrl), githubUrl: clean(p.githubUrl), sourceUrl: clean(p.githubUrl), caseStudyUrl: clean(p.caseStudyUrl),
      featured: i < 3, order: i + 1
    })),
    experience: f.experience.map((x) => ({
      id: x.id, title: x.role.trim(), role: x.role.trim(), company: x.company.trim(), location: clean(x.location), period: period(x) || undefined,
      startDate: clean(x.startDate), endDate: x.current ? undefined : clean(x.endDate), current: x.current, description: x.description.trim()
    })),
    education: f.education.map((x) => ({ id: x.id, degree: x.degree.trim(), institution: x.institution.trim(), location: clean(x.location), year: clean(x.year), honors: clean(x.honors) })),
    publications: f.publications.map((x) => ({ id: x.id, title: x.title.trim(), publisher: clean(x.venue), publisherOrJournal: clean(x.venue), year: clean(x.year), authors: csv(x.authors), url: clean(x.url), abstract: clean(x.abstract) })),
    services: f.services.map((x) => ({ id: x.id, title: x.title.trim(), description: x.description.trim(), price: clean(x.price), startingPrice: clean(x.price), timeline: clean(x.timeline), deliverables: csv(x.deliverables) })),
    testimonials: f.testimonials.map((x) => ({ id: x.id, quote: x.quote.trim(), authorName: clean(x.author), clientName: clean(x.author), authorTitle: clean(x.role), clientRole: clean(x.role), clientCompany: clean(x.company) })),
    achievements: f.achievements.map((x) => ({ id: x.id, title: x.title.trim(), issuer: clean(x.issuer), year: clean(x.year), description: clean(x.description), url: clean(x.url) })),
    certifications: f.certifications.map((x) => ({ id: x.id, name: x.name.trim(), issuer: clean(x.issuer), year: clean(x.year), credentialUrl: clean(x.credentialUrl) })),
    resumeUrl: clean(f.resumeUrl),
    socialLinks,
    media: {
      officialLogoUrl: clean(f.profilePhoto), officialHeroBannerUrl: clean(f.coverImage), additionalBrandingImages: f.additionalImages,
      googleDriveGalleryUrl: clean(f.googleDriveGalleryUrl), googleDriveVideoUrl: clean(f.googleDriveVideoUrl), googleDriveVideoUrls: f.googleDriveVideoUrls,
      youtubeUrl: youtubeUrls[0], youtubeUrls, youtubePlaylistUrls: f.youtubePlaylistUrls
    },
    navigationConfig: { enabledPages: ['/', '/projects', '/experience', '/contact'], ctaButtonText: 'Get in Touch' }
  };

  return {
    organizationName: f.fullName.trim(),
    category: 'portfolio',
    portfolioArchetype: archetype,
    tagline: f.headline.trim(),
    aboutText: f.bio.trim(),
    contactEmail: f.email.trim(),
    contactPhone: f.phone.trim(),
    address: f.location.trim(),
    primaryColor: f.template.designTokens?.primaryColor || '#0284c7',
    accentColor: f.template.designTokens?.accentColor || '#38bdf8',
    typographyStyle: 'futuristic',
    logoUrl: f.profilePhoto,
    coverImageUrl: f.coverImage,
    additionalBrandingImages: f.additionalImages,
    googleDriveGalleryUrl: f.googleDriveGalleryUrl,
    googleDriveVideoUrl: f.googleDriveVideoUrl,
    googleDriveVideoUrls: f.googleDriveVideoUrls,
    youtubeUrls,
    youtubePlaylistUrls: f.youtubePlaylistUrls,
    enabledSections: { hero: true, events: false, about: true, committee: false, gallery: true, contact: true },
    events: [], committee: [], gallery: [],
    portfolioData,
    selectedTemplate: f.template
  } as ClientRequirements;
}

/* -------------------------------------------------------------------- drafts */

interface DraftEnvelope { v: 1; savedAt: string; step: number; archetype: PortfolioArchetype; form: IntakeForm }

const draftKey = (scope: string, archetype: string) => `dv:portfolio-draft:${scope}:${archetype}`;

/** Browser-local drafts. Every call is guarded: storage can be blocked or full. */
export const drafts = {
  available(): boolean {
    try { const k = '__dv_probe__'; window.localStorage.setItem(k, '1'); window.localStorage.removeItem(k); return true; } catch { return false; }
  },
  save(scope: string, archetype: PortfolioArchetype, step: number, form: IntakeForm): { ok: boolean; savedAt?: string; error?: string } {
    try {
      const env: DraftEnvelope = { v: 1, savedAt: new Date().toISOString(), step, archetype, form };
      window.localStorage.setItem(draftKey(scope, archetype), JSON.stringify(env));
      return { ok: true, savedAt: env.savedAt };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Storage unavailable' };
    }
  },
  load(scope: string, archetype: PortfolioArchetype): DraftEnvelope | null {
    try {
      const raw = window.localStorage.getItem(draftKey(scope, archetype));
      if (!raw) return null;
      const env = JSON.parse(raw) as DraftEnvelope;
      return env && env.v === 1 && env.form && typeof env.form.fullName === 'string' ? env : null;
    } catch { return null; }
  },
  clear(scope: string, archetype: PortfolioArchetype): void {
    try { window.localStorage.removeItem(draftKey(scope, archetype)); } catch { /* ignore */ }
  }
};

/** Merge a stored draft over a fresh form so fields added in newer versions never come back undefined. */
export function mergeDraft(base: IntakeForm, stored: IntakeForm): IntakeForm {
  return { ...base, ...stored, socialLinks: { ...base.socialLinks, ...(stored.socialLinks || {}) }, template: stored.template || base.template };
}
