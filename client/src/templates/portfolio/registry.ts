import type { PortfolioArchetype } from '../../types/portfolio';
import type {
  LegacyPortfolioTemplateId,
  PortfolioFilterCategory,
  PortfolioSectionConfig,
  PortfolioTemplateDefinition,
  PortfolioTemplateId
} from './types';
import { DEMO_BUILDERS } from './demos/demoData';

/**
 * Active Portfolio Engine template library (v2). Every entry is an original design implemented in
 * ./designs; see LICENSES.md for sources, references and font licences.
 * Templates created before the v2 library keep working through ./legacy (see LEGACY_TEMPLATES).
 */

const preview = (id: PortfolioTemplateId) => `/images/portfolio-templates/${id}.jpg`;
const original = (inspiration: string[], note: string) => ({ kind: 'original' as const, inspiration, note });
const sec = (id: PortfolioSectionConfig['id'], label: string, needs?: PortfolioSectionConfig['needs']): PortfolioSectionConfig => ({ id, label, needs });

const ALL_FIELDS = ['identity.fullName', 'identity.professionalTitle', 'identity.headline', 'identity.location', 'identity.email', 'identity.socialLinks', 'about.bio'];

export const PORTFOLIO_TEMPLATES: Record<PortfolioTemplateId, PortfolioTemplateDefinition> = {
  'engineer-blueprint': {
    id: 'engineer-blueprint', name: 'Systems Engineer Blueprint', tagline: 'Dark engineering canvas with a terminal intro and repo-style projects.',
    description: 'A developer portfolio built like a well-organised repository: a fixed side rail, a typed terminal introduction, a skills matrix, project cards with architecture notes, and a commit-style career timeline.',
    category: 'developer', categoryLabel: 'Software Engineer', archetype: 'developer', version: '2.0.0', author: 'DigiVerse Design', badge: 'Developer',
    designStyle: 'Dark · Monospace · Blueprint',
    designDirection: 'Technical, precise and calm: blueprint grid, mono labels, mint accent.',
    highlights: ['Fixed side navigation with active-section tracking', 'Typed terminal intro', 'Skills matrix with proficiency bars', 'Expandable architecture notes per project', 'Print-ready résumé'],
    tokens: { primaryColor: '#070B16', accentColor: '#3DD6A5', secondaryColor: '#5B8CFF', background: '#070B16', textColor: '#D6E2FF', fontFamily: 'Inter', headingFont: 'Space Grotesk / JetBrains Mono', layoutPreset: 'Side rail + single column' },
    pages: [{ slug: 'home', title: 'Home', navLabel: 'Home' }],
    sections: [sec('hero', 'Terminal intro'), sec('about', 'About'), sec('skills', 'Stack matrix', 'skills'), sec('projects', 'Projects', 'projects'), sec('experience', 'Experience', 'experience'), sec('education', 'Credentials', 'education'), sec('contact', 'Contact')],
    contentFields: [...ALL_FIELDS, 'identity.currentCompany', 'identity.yearsOfExperience', 'skills[]', 'projects[]', 'experience[]', 'education[]', 'publications[]'],
    assetRequirements: { portrait: 'unused', projectImages: 'recommended', minProjectImages: 0, notes: 'Project screenshots (16:10) and one wide cover image. Generated artwork is used when none is supplied.' },
    animation: { style: 'Scroll reveals, typed text, animated bars', reducedMotion: 'static', features: ['Typing intro', 'Reveal on scroll', 'Hover glow cards'] },
    previewImage: preview('engineer-blueprint'),
    source: original(['General developer-portfolio conventions (terminal/README aesthetics)'], 'Original layout and code. No third-party template code or assets.'),
    getDemoData: DEMO_BUILDERS['engineer-blueprint']
  },
  'editorial-ux': {
    id: 'editorial-ux', name: 'Editorial UX Portfolio', tagline: 'A printed-monograph feel for product and UX designers.',
    description: 'Warm paper tones, oversized serif headlines and alternating case-study spreads. Includes a masthead navigation, expandable stories, a skills ledger and pull-quote testimonials.',
    category: 'ui_ux', categoryLabel: 'UI/UX & Product Designer', archetype: 'designer', version: '2.0.0', author: 'DigiVerse Design', badge: 'UI/UX',
    designStyle: 'Light · Editorial serif · Paper',
    designDirection: 'Calm and considered: generous whitespace, large serif type, thin rules.',
    highlights: ['Masthead navigation', 'Alternating case-study spreads', 'Expandable project stories with metrics', 'Pull-quote testimonial carousel', 'Experience ledger'],
    tokens: { primaryColor: '#1E1A14', accentColor: '#2F8F5B', background: '#F6F1E7', textColor: '#1E1A14', fontFamily: 'Inter', headingFont: 'Fraunces', layoutPreset: 'Editorial spreads' },
    pages: [{ slug: 'home', title: 'Home', navLabel: 'Home' }],
    sections: [sec('hero', 'Masthead hero'), sec('projects', 'Selected work', 'projects'), sec('about', 'About'), sec('skills', 'Skills', 'skills'), sec('experience', 'Experience', 'experience'), sec('testimonials', 'Kind words', 'testimonials'), sec('contact', 'Contact')],
    contentFields: [...ALL_FIELDS, 'about.story', 'skills[]', 'projects[] (metrics, tags, caseStudyUrl)', 'experience[]', 'testimonials[]'],
    assetRequirements: { portrait: 'recommended', projectImages: 'required', minProjectImages: 3, notes: 'Case-study covers at 4:3. A 4:5 portrait for the About section.' },
    animation: { style: 'Slow reveals, image zoom on hover', reducedMotion: 'static', features: ['Directional reveal', 'Hover zoom', 'Fade carousel'] },
    previewImage: preview('editorial-ux'),
    source: original(['Editorial/print layout principles'], 'Original layout. Fraunces (SIL OFL) via Google Fonts.'),
    getDemoData: DEMO_BUILDERS['editorial-ux']
  },
  'photo-fullscreen': {
    id: 'photo-fullscreen', name: 'Full-Screen Photography', tagline: 'A black gallery wall with an immersive lightbox.',
    description: 'Edge-to-edge hero with a slow zoom, transparent floating navigation, a filterable masonry grid and a keyboard-friendly lightbox. Prints and commissions sit below the portfolio.',
    category: 'photography', categoryLabel: 'Photography', archetype: 'photographer', version: '2.0.0', author: 'DigiVerse Design', badge: 'Photography',
    designStyle: 'Dark · Gallery · Full-bleed',
    designDirection: 'Let the photographs lead: black canvas, light serif italics, almost no chrome.',
    highlights: ['Full-viewport hero with slow zoom', 'Category-filtered masonry', 'Lightbox with arrow-key navigation', 'Prints & commissions list', 'Uses uploaded gallery photos'],
    tokens: { primaryColor: '#000000', accentColor: '#EDE9E3', background: '#000000', textColor: '#EDE9E3', fontFamily: 'Jost', headingFont: 'Cormorant Garamond', layoutPreset: 'Full-bleed + masonry' },
    pages: [{ slug: 'home', title: 'Home', navLabel: 'Home' }],
    sections: [sec('hero', 'Full-screen hero'), sec('projects', 'Gallery', 'media'), sec('about', 'The photographer'), sec('services', 'Prints & commissions', 'services'), sec('contact', 'Contact')],
    contentFields: [...ALL_FIELDS, 'website.galleryPhotos[]', 'projects[] (images)', 'media.additionalBrandingImages[]', 'services[]'],
    assetRequirements: { portrait: 'recommended', projectImages: 'required', minProjectImages: 6, notes: 'At least six photographs, any aspect ratio. The first image becomes the full-screen hero.' },
    animation: { style: 'Ken Burns hero, fade-in grid', reducedMotion: 'static', features: ['Slow hero zoom', 'Staggered reveal', 'Hover caption overlay'] },
    previewImage: preview('photo-fullscreen'),
    source: original(['Photographer-portfolio conventions: masonry grid + lightbox'], 'Original layout and code.'),
    getDemoData: DEMO_BUILDERS['photo-fullscreen']
  },
  'graphic-bold': {
    id: 'graphic-bold', name: 'Bold Graphic Designer', tagline: 'Loud colour blocks, thick outlines and a never-ending marquee.',
    description: 'A neo-brutalist portfolio for illustrators and brand designers. Every work card sits on its own colour with offset shadows, stickers tilt on hover, and a marquee carries your disciplines.',
    category: 'creative', categoryLabel: 'Graphic Designer / Creative Artist', archetype: 'graphic_artist', version: '2.0.0', author: 'DigiVerse Design', badge: 'Creative',
    designStyle: 'Colourful · Neo-brutalist · Playful',
    designDirection: 'Unapologetically loud: saturated palette, 3px outlines, hard shadows.',
    highlights: ['Sticky pill header', 'Skills marquee', 'Colour-coded work cards with filters', 'Lightbox for artwork', 'Hover tilt & offset shadows'],
    tokens: { primaryColor: '#000000', accentColor: '#FF3D81', secondaryColor: '#FFD400', background: '#FFF8E7', textColor: '#000000', fontFamily: 'Space Grotesk', headingFont: 'Unbounded', layoutPreset: 'Colour-block grid' },
    pages: [{ slug: 'home', title: 'Home', navLabel: 'Home' }],
    sections: [sec('hero', 'Poster hero'), sec('projects', 'Work', 'projects'), sec('about', 'About'), sec('testimonials', 'Kind words', 'testimonials'), sec('contact', 'Contact')],
    contentFields: [...ALL_FIELDS, 'skills[] (marquee)', 'projects[] (category filter)', 'experience[]', 'testimonials[]'],
    assetRequirements: { portrait: 'recommended', projectImages: 'required', minProjectImages: 4, notes: 'Square-ish artwork works best. A portrait is shown in an organic blob mask.' },
    animation: { style: 'Bouncy hover, marquee, floating shapes', reducedMotion: 'static', features: ['Marquee', 'Floating shapes', 'Tilt on hover'] },
    previewImage: preview('graphic-bold'),
    source: original(['Neo-brutalism as a general design movement'], 'Original design. Unbounded and Space Grotesk (SIL OFL).'),
    getDemoData: DEMO_BUILDERS['graphic-bold']
  },
  'motion-immersive': {
    id: 'motion-immersive', name: 'Immersive 3D & Motion', tagline: 'A CSS-3D ring of work, a snap-scroll reel and a light/dark toggle.',
    description: 'A stage-like canvas for 3D artists and motion designers. Projects orbit in a pure-CSS 3D ring, live in a horizontal reel, and a showreel player sits below. The visitor can flip between dark and light.',
    category: 'creative', categoryLabel: '3D Artist / Motion Designer', archetype: 'motion_3d', version: '2.0.0', author: 'DigiVerse Design', badge: '3D & Motion',
    designStyle: 'Dark/Light · Gradient · 3D',
    designDirection: 'Cinematic and weightless: deep violet, glowing gradients, floating pill navigation.',
    highlights: ['CSS-3D rotating hero ring (no WebGL)', 'Dark / light mode toggle', 'Horizontal snap-scroll reel', 'Showreel player (YouTube)', 'Floating pill navigation'],
    tokens: { primaryColor: '#07060F', accentColor: '#A855F7', secondaryColor: '#22D3EE', background: '#07060F', textColor: '#F2EEFF', fontFamily: 'Manrope', headingFont: 'Syne', layoutPreset: 'Stage + reel' },
    pages: [{ slug: 'home', title: 'Home', navLabel: 'Home' }],
    sections: [sec('hero', '3D ring hero'), sec('projects', 'Reel', 'projects'), sec('media', 'Showreel', 'media'), sec('about', 'About & toolkit'), sec('contact', 'Contact')],
    contentFields: [...ALL_FIELDS, 'projects[] (portrait images)', 'media.youtubeUrls[]', 'skills[]', 'experience[]'],
    assetRequirements: { portrait: 'optional', projectImages: 'required', minProjectImages: 4, notes: 'Portrait-oriented renders (4:5). Add a YouTube link to enable the showreel.' },
    animation: { style: 'CSS 3D transforms, gradient drift, snap scroll', reducedMotion: 'static', features: ['3D ring rotation', 'Gradient headline', 'Snap reel'] },
    previewImage: preview('motion-immersive'),
    source: original(['CSS 3D carousel technique (public-domain technique)'], 'Original code using CSS transforms only.'),
    getDemoData: DEMO_BUILDERS['motion-immersive']
  },
  'freelancer-services': {
    id: 'freelancer-services', name: 'Freelancer Services & Clients', tagline: 'Pricing-style services, client proof and a topic-aware enquiry form.',
    description: 'A conversion-focused freelancer site: sticky header with a call to action, service cards with fixed prices and deliverables, a how-it-works strip, case-study results, testimonials and an enquiry form that opens the visitor’s mail app.',
    category: 'freelancer', categoryLabel: 'Freelancer / Digital Creator', archetype: 'freelancer', version: '2.0.0', author: 'DigiVerse Design', badge: 'Freelancer',
    designStyle: 'Light · Clean · SaaS-style',
    designDirection: 'Trustworthy and clear: white space, blue/violet gradient accents, rounded cards.',
    highlights: ['Pricing-style service cards', 'Availability badge', 'Results-led case studies', 'Star-rated client testimonials', 'Topic-aware enquiry form'],
    tokens: { primaryColor: '#2563EB', accentColor: '#7C3AED', secondaryColor: '#0F172A', background: '#FFFFFF', textColor: '#0F172A', fontFamily: 'Plus Jakarta Sans', headingFont: 'Plus Jakarta Sans', layoutPreset: 'Conversion landing' },
    pages: [{ slug: 'home', title: 'Home', navLabel: 'Home' }],
    sections: [sec('hero', 'Hero + availability'), sec('services', 'Services', 'services'), sec('projects', 'Recent work', 'projects'), sec('testimonials', 'Clients', 'testimonials'), sec('contact', 'Enquiry')],
    contentFields: [...ALL_FIELDS, 'identity.availableForHire', 'services[] (price, timeline, deliverables)', 'projects[] (metrics)', 'testimonials[] (rating)'],
    assetRequirements: { portrait: 'recommended', projectImages: 'recommended', minProjectImages: 2, notes: 'A friendly portrait (4:5) and 16:10 project screenshots.' },
    animation: { style: 'Soft lifts and reveals', reducedMotion: 'static', features: ['Card lift on hover', 'Pulsing availability dot', 'Floating rating chip'] },
    previewImage: preview('freelancer-services'),
    source: original(['Common landing-page patterns for service businesses'], 'Original layout and copy. Plus Jakarta Sans (SIL OFL).'),
    getDemoData: DEMO_BUILDERS['freelancer-services']
  },
  'graduate-profile': {
    id: 'graduate-profile', name: 'Fresh Graduate Profile', tagline: 'Résumé-first layout with education leading the story.',
    description: 'A friendly profile for students and new graduates: a sticky profile card, education first, internships, projects with code links, certifications and awards, skill bars and a print-ready CV.',
    category: 'student', categoryLabel: 'Student / Fresh Graduate', archetype: 'student_grad', version: '2.0.0', author: 'DigiVerse Design', badge: 'Student',
    designStyle: 'Light · Friendly · Résumé',
    designDirection: 'Approachable and organised: sky-to-violet gradients, soft cards, clear hierarchy.',
    highlights: ['Sticky profile card', 'Education-first timeline', 'Certifications & awards', 'Project cards with code links', 'Download CV (print)'],
    tokens: { primaryColor: '#0EA5E9', accentColor: '#6366F1', secondaryColor: '#A855F7', background: '#F0F9FF', textColor: '#0B1B2B', fontFamily: 'Inter', headingFont: 'Outfit', layoutPreset: 'Sidebar + résumé' },
    pages: [{ slug: 'home', title: 'Home', navLabel: 'Home' }],
    sections: [sec('about', 'About'), sec('education', 'Education', 'education'), sec('experience', 'Internships', 'experience'), sec('projects', 'Projects', 'projects'), sec('publications', 'Certifications', 'publications'), sec('skills', 'Skills', 'skills'), sec('contact', 'Contact')],
    contentFields: [...ALL_FIELDS, 'identity.phone', 'education[]', 'experience[]', 'projects[]', 'publications[] (as certifications/awards)', 'skills[]'],
    assetRequirements: { portrait: 'recommended', projectImages: 'optional', minProjectImages: 0, notes: 'A square portrait. Project images are optional; artwork is generated.' },
    animation: { style: 'Gentle reveals', reducedMotion: 'static', features: ['Reveal on scroll', 'Card lift', 'Active nav pill'] },
    previewImage: preview('graduate-profile'),
    source: original(['Résumé / CV layout conventions'], 'Original layout and code. Outfit and Inter (SIL OFL).'),
    getDemoData: DEMO_BUILDERS['graduate-profile']
  },
  'data-ai-lab': {
    id: 'data-ai-lab', name: 'Data & AI Research Lab', tagline: 'Publications with abstracts and BibTeX, plus an animated neural network.',
    description: 'A research-group homepage for data scientists and AI engineers: scholarly metrics, publications with filters, abstracts and copyable BibTeX, project cards for repositories and demos, methods rated at a glance and a CV.',
    category: 'ai_data', categoryLabel: 'Data Scientist / AI Engineer', archetype: 'data_scientist', version: '2.0.0', author: 'DigiVerse Design', badge: 'AI & Data',
    designStyle: 'Dark · Scientific · Teal',
    designDirection: 'Analytical and credible: navy canvas, teal data accents, serif abstracts.',
    highlights: ['Animated neural-network motif', 'Publications by type with abstracts', 'Copyable BibTeX', 'Repo/demo project cards', 'Methods proficiency meters'],
    tokens: { primaryColor: '#070D1A', accentColor: '#2DD4BF', secondaryColor: '#38BDF8', background: '#070D1A', textColor: '#CBD5E1', fontFamily: 'IBM Plex Sans', headingFont: 'IBM Plex Sans / Serif', layoutPreset: 'Research group' },
    pages: [{ slug: 'home', title: 'Home', navLabel: 'Home' }],
    sections: [sec('hero', 'Hero + network'), sec('about', 'Bio'), sec('publications', 'Publications', 'publications'), sec('projects', 'Projects', 'projects'), sec('skills', 'Methods', 'skills'), sec('experience', 'CV', 'experience'), sec('contact', 'Contact')],
    contentFields: [...ALL_FIELDS, 'publications[] (authors, abstract, bibtex, type, url)', 'projects[] (technologies, metrics)', 'skills[] (years)', 'experience[]', 'education[]'],
    assetRequirements: { portrait: 'optional', projectImages: 'optional', minProjectImages: 0, notes: 'A small square portrait. Charts or figures for projects are optional.' },
    animation: { style: 'Data-flow lines, blinking nodes', reducedMotion: 'static', features: ['Network flow animation', 'Reveal on scroll', 'Expandable abstracts'] },
    previewImage: preview('data-ai-lab'),
    source: original(['Academic lab-site conventions'], 'Original layout and code. IBM Plex (SIL OFL).'),
    getDemoData: DEMO_BUILDERS['data-ai-lab']
  },
  'architect-minimal': {
    id: 'architect-minimal', name: 'Architecture Minimal', tagline: 'A white gallery with hairline rules and full-bleed project spreads.',
    description: 'A near-colourless portfolio for architects and interior designers: vertical wordmark rail, a hover-preview project index, full-width spreads, a drag-to-compare slider, studio statement and a dark enquiry block.',
    category: 'architecture', categoryLabel: 'Architect / Interior Designer', archetype: 'architect', version: '2.0.0', author: 'DigiVerse Design', badge: 'Architecture',
    designStyle: 'Light · Minimal · Condensed type',
    designDirection: 'Quiet confidence: white space, hairlines, tall condensed capitals, huge imagery.',
    highlights: ['Hover-preview project index', 'Full-bleed project spreads', 'Drag-to-compare slider', 'Vertical wordmark rail', 'Dark contact block'],
    tokens: { primaryColor: '#111111', accentColor: '#111111', background: '#FFFFFF', textColor: '#111111', fontFamily: 'Barlow', headingFont: 'Barlow Condensed', layoutPreset: 'Gallery index' },
    pages: [{ slug: 'home', title: 'Home', navLabel: 'Home' }],
    sections: [sec('hero', 'Statement + hero image'), sec('projects', 'Projects', 'projects'), sec('about', 'Studio'), sec('skills', 'Services', 'skills'), sec('experience', 'Practice', 'experience'), sec('contact', 'Contact')],
    contentFields: [...ALL_FIELDS, 'projects[] (large images)', 'skills[] (as services)', 'experience[]', 'testimonials[]'],
    assetRequirements: { portrait: 'optional', projectImages: 'required', minProjectImages: 4, notes: 'Wide, high-resolution project photography. At least two projects enable the compare slider.' },
    animation: { style: 'Fades and slow image transitions', reducedMotion: 'static', features: ['Fade-in spreads', 'Index hover preview', 'Compare slider'] },
    previewImage: preview('architect-minimal'),
    source: original(['Architecture-studio website conventions'], 'Original layout and code. Barlow (SIL OFL).'),
    getDemoData: DEMO_BUILDERS['architect-minimal']
  },
  'creator-media': {
    id: 'creator-media', name: 'Creator Media Hub', tagline: 'A link-in-bio hero, video wall and brand-collab packages.',
    description: 'A vibrant home for content creators: centred profile with a stack of social buttons, in-page video player, a top-content grid, collaboration packages and a brand-partner enquiry.',
    category: 'content_creator', categoryLabel: 'Content Creator / Personal Brand', archetype: 'content_creator', version: '2.0.0', author: 'DigiVerse Design', badge: 'Creator',
    designStyle: 'Dark · Vibrant gradients · Rounded',
    designDirection: 'Playful and personal: neon gradients on deep purple, glass cards, pill controls.',
    highlights: ['Link-in-bio social button stack', 'In-page YouTube player', 'Top-content mosaic', 'Collaboration packages', 'Audience stats'],
    tokens: { primaryColor: '#14081F', accentColor: '#F72585', secondaryColor: '#4CC9F0', background: '#14081F', textColor: '#FFFFFF', fontFamily: 'Sora', headingFont: 'Sora', layoutPreset: 'Centered column' },
    pages: [{ slug: 'home', title: 'Home', navLabel: 'Home' }],
    sections: [sec('hero', 'Profile + links'), sec('media', 'Videos', 'media'), sec('projects', 'Top content', 'projects'), sec('services', 'Collaborations', 'services'), sec('about', 'About'), sec('contact', 'Contact')],
    contentFields: [...ALL_FIELDS, 'media.youtubeUrls[]', 'website.featuredVideos[]', 'projects[] (as content)', 'services[] (as packages)', 'testimonials[]'],
    assetRequirements: { portrait: 'required', projectImages: 'recommended', minProjectImages: 4, notes: 'A clear portrait and thumbnails (4:5 or square). Add YouTube links for the video wall.' },
    animation: { style: 'Floating gradients, springy hovers', reducedMotion: 'static', features: ['Animated avatar ring', 'Floating blobs', 'Hover scale'] },
    previewImage: preview('creator-media'),
    source: original(['Link-in-bio page conventions'], 'Original layout and code. Sora (SIL OFL).'),
    getDemoData: DEMO_BUILDERS['creator-media']
  }
};

export const PORTFOLIO_TEMPLATE_IDS = Object.keys(PORTFOLIO_TEMPLATES) as PortfolioTemplateId[];

export function getPortfolioTemplateList(): PortfolioTemplateDefinition[] {
  return PORTFOLIO_TEMPLATE_IDS.map((id) => PORTFOLIO_TEMPLATES[id]);
}

/** Active templates only. Returns undefined for legacy or unknown ids (see isLegacyTemplateId). */
export function getPortfolioTemplateById(id: string | undefined | null): PortfolioTemplateDefinition | undefined {
  return id && id in PORTFOLIO_TEMPLATES ? PORTFOLIO_TEMPLATES[id as PortfolioTemplateId] : undefined;
}

export const FILTER_OPTIONS: { id: PortfolioFilterCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'developer', label: 'Developer' },
  { id: 'ui_ux', label: 'UI/UX Designer' },
  { id: 'photography', label: 'Photography' },
  { id: 'creative', label: 'Creative' },
  { id: 'freelancer', label: 'Freelancer' },
  { id: 'student', label: 'Student' },
  { id: 'ai_data', label: 'AI / Data Science' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'content_creator', label: 'Content Creator' }
];

/** Default template per archetype (used when a project has no template selected yet). */
export const DEFAULT_TEMPLATE_BY_ARCHETYPE: Record<PortfolioArchetype, PortfolioTemplateId> = {
  developer: 'engineer-blueprint',
  designer: 'editorial-ux',
  photographer: 'photo-fullscreen',
  graphic_artist: 'graphic-bold',
  motion_3d: 'motion-immersive',
  freelancer: 'freelancer-services',
  student_grad: 'graduate-profile',
  data_scientist: 'data-ai-lab',
  architect: 'architect-minimal',
  content_creator: 'creator-media',
  // Archetypes of projects created before the 10-profession flow.
  academic_pro: 'graduate-profile',
  personal_brand: 'freelancer-services'
};

/** Ids written by the pre-v2 library. They still render through ./legacy, but are not offered for new projects. */
export const LEGACY_TEMPLATES: Record<LegacyPortfolioTemplateId, { name: string; replacedBy: PortfolioTemplateId }> = {
  nova: { name: 'NOVA — Developer & Systems Engineer', replacedBy: 'engineer-blueprint' },
  creative_studio: { name: 'Creative Studio — UI/UX & Graphic Designer', replacedBy: 'editorial-ux' },
  vision: { name: 'VISION — Photographer', replacedBy: 'photo-fullscreen' },
  motionverse: { name: 'MOTIONVERSE — 3D & Motion', replacedBy: 'motion-immersive' },
  academic_pro: { name: 'ACADEMIC PRO — Researcher', replacedBy: 'data-ai-lab' },
  brandbuilder: { name: 'BRANDBUILDER — Personal Brand', replacedBy: 'freelancer-services' }
};

export function isLegacyTemplateId(id: string | undefined | null): id is LegacyPortfolioTemplateId {
  return !!id && Object.prototype.hasOwnProperty.call(LEGACY_TEMPLATES, id);
}

const LEGACY_ARCHETYPE: Record<LegacyPortfolioTemplateId, PortfolioArchetype> = {
  nova: 'developer', creative_studio: 'designer', vision: 'photographer', motionverse: 'motion_3d', academic_pro: 'academic_pro', brandbuilder: 'personal_brand'
};

/** Archetype a template belongs to (used to preselect the wizard's profession when starting from a template). */
export function portfolioArchetypeForTemplate(id: string | undefined | null): PortfolioArchetype {
  const active = getPortfolioTemplateById(id);
  if (active) return active.archetype;
  if (isLegacyTemplateId(id)) return LEGACY_ARCHETYPE[id];
  return 'freelancer';
}
