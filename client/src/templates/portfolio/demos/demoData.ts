import type { ClientRequirements, GeneratedWebsite } from '../../../types/admin';
import type { PortfolioArchetype, PortfolioWebsiteData, PortfolioProjectItem, PortfolioIdentity } from '../../../types/portfolio';
import { art, type ArtKind, type PaletteName } from '../kit/art';
import type { PortfolioTemplateId } from '../types';

/**
 * Demo content for the template gallery and live previews. Every person, company, URL and image here is
 * fictional/generated (SVG art, example.* domains): nothing is hotlinked and no real person is depicted.
 */

interface DemoSpec {
  id: PortfolioTemplateId;
  templateName: string;
  archetype: PortfolioArchetype;
  category: string;
  domain: string;
  identity: PortfolioIdentity;
  about: NonNullable<PortfolioWebsiteData['about']>;
  data: Partial<PortfolioWebsiteData>;
  heroHeadline: string;
  metrics: { value: string; label: string }[];
  coverKind: ArtKind;
  palette: PaletteName;
  cta?: string;
}

const proj = (kind: ArtKind, palette: PaletteName, p: PortfolioProjectItem): PortfolioProjectItem => ({
  ...p,
  featuredImageUrl: art(kind, p.id, palette),
  galleryImages: p.galleryImages
});

function build(spec: DemoSpec): { requirements: ClientRequirements; portfolioData: PortfolioWebsiteData; website: GeneratedWebsite } {
  const portrait = art('portrait', spec.identity.fullName, spec.palette);
  const cover = art(spec.coverKind, `${spec.identity.fullName}:cover`, spec.palette);
  const portfolioData: PortfolioWebsiteData = {
    schemaVersion: '1.0',
    archetype: spec.archetype,
    identity: { ...spec.identity, displayName: spec.identity.displayName || spec.identity.fullName, profilePhotoUrl: portrait, heroCoverUrl: cover },
    about: spec.about,
    skills: [],
    projects: [],
    experience: [],
    navigationConfig: { ctaButtonText: spec.cta || 'Get in touch' },
    ...spec.data
  };
  const selectedTemplate = {
    templateId: spec.id,
    templateVersion: '2.0.0',
    templateName: spec.templateName,
    websiteCategory: spec.category,
    selectedAt: '2026-01-01T00:00:00.000Z'
  };
  const requirements = {
    organizationName: spec.identity.fullName,
    category: 'portfolio',
    portfolioArchetype: spec.archetype,
    tagline: spec.identity.headline || '',
    aboutText: spec.about.bio,
    contactEmail: spec.identity.email || '',
    contactPhone: spec.identity.phone || '',
    primaryColor: '#111111',
    accentColor: '#3DD6A5',
    typographyStyle: 'modern',
    logoUrl: portrait,
    coverImageUrl: cover,
    enabledSections: { hero: true, events: false, about: true, committee: false, gallery: true, contact: true },
    events: [],
    committee: [],
    gallery: [],
    portfolioData,
    selectedTemplate
  } as unknown as ClientRequirements;
  const website: GeneratedWebsite = {
    themeAccent: spec.id,
    layoutPreset: 'editorial',
    fontFamily: 'Inter, sans-serif',
    simulatedDomain: spec.domain,
    heroHeadline: spec.heroHeadline,
    heroDescription: spec.identity.headline || '',
    heroImage: cover,
    metrics: spec.metrics,
    eventsTitle: '',
    eventsList: [],
    aboutContent: spec.about.bio,
    committeeTitle: '',
    committeeList: [],
    galleryTitle: '',
    galleryList: [],
    portfolioData,
    selectedTemplate
  };
  return { requirements, portfolioData, website };
}

const skill = (id: string, name: string, category: string, level: string, years?: number) => ({ id, name, category, proficiency: level, yearsOfExperience: years });

/* ------------------------------------------------------------------ */
const ENGINEER = () => build({
  id: 'engineer-blueprint', templateName: 'Systems Engineer Blueprint', archetype: 'developer', category: 'developer', domain: 'arjun-menon.example.dev',
  coverKind: 'blueprint', palette: 'ocean', cta: 'Start a conversation',
  heroHeadline: 'Staff Software Engineer',
  metrics: [{ value: '9+', label: 'Years' }, { value: '850K', label: 'Peak req/s' }, { value: '99.99%', label: 'Uptime' }],
  identity: { fullName: 'Arjun Menon', professionalTitle: 'Staff Software Engineer · Distributed Systems', headline: 'I design resilient backends, developer platforms and the quiet infrastructure that keeps products fast.', location: 'Bengaluru, India', email: 'arjun.menon@example.dev', currentCompany: 'Northwind Labs', currentRole: 'Staff Engineer', availableForHire: true, yearsOfExperience: 9, socialLinks: { github: 'https://github.com/example', linkedin: 'https://www.linkedin.com/in/example', twitter: 'https://x.com/example' } },
  about: { bio: 'Nine years building high-throughput services, event pipelines and internal platforms. I care about boring reliability, readable code and teams that ship on a Friday without fear.', story: 'I started with embedded C, moved into backend services, and now lead platform work: schema registries, deploy tooling and the observability stack that other engineers rely on.', interests: ['rust', 'distributed-systems', 'open-source', 'observability'] },
  data: {
    skills: [
      skill('s1', 'TypeScript', 'Languages', 'expert', 8), skill('s2', 'Go', 'Languages', 'advanced', 5), skill('s3', 'Rust', 'Languages', 'intermediate', 2), skill('s4', 'Python', 'Languages', 'advanced', 7),
      skill('s5', 'PostgreSQL', 'Data', 'expert', 8), skill('s6', 'Kafka', 'Data', 'advanced', 5), skill('s7', 'Redis', 'Data', 'advanced', 6),
      skill('s8', 'Kubernetes', 'Platform', 'advanced', 5), skill('s9', 'Terraform', 'Platform', 'proficient', 4), skill('s10', 'OpenTelemetry', 'Platform', 'advanced', 3),
      skill('s11', 'React', 'Frontend', 'proficient', 6), skill('s12', 'GraphQL', 'Frontend', 'proficient', 4)
    ],
    projects: [
      proj('ui', 'ocean', { id: 'p1', title: 'Streamline: event pipeline', summary: 'A multi-region ingestion pipeline processing 850K events/sec with exactly-once semantics.', detailedDescription: 'Replaced a fragile batch system with a partitioned log, idempotent consumers and a replay tool. Cut end-to-end latency from minutes to under 400 ms and made backfills a one-command operation.', role: 'Tech lead', year: '2025', technologies: ['Go', 'Kafka', 'Postgres', 'Kubernetes'], liveUrl: 'https://example.com', sourceUrl: 'https://github.com/example', metrics: [{ label: 'p99 latency', value: '380ms' }, { label: 'events/sec', value: '850K' }], featured: true }),
      proj('blueprint', 'ocean', { id: 'p2', title: 'Lattice: deploy platform', summary: 'Internal developer platform giving 120 engineers one-click, auditable deploys.', detailedDescription: 'Designed the control plane, policy engine and rollback flow. Deploy frequency tripled while change-failure rate halved.', role: 'Architect', year: '2024', technologies: ['TypeScript', 'Terraform', 'Argo CD'], sourceUrl: 'https://github.com/example', metrics: [{ label: 'deploys/day', value: '140' }], featured: true }),
      proj('chart', 'ocean', { id: 'p3', title: 'Pulse: observability kit', summary: 'Open-source tracing and SLO dashboards with sensible defaults.', role: 'Maintainer', year: '2023', technologies: ['Rust', 'OpenTelemetry'], sourceUrl: 'https://github.com/example', metrics: [{ label: 'GitHub stars', value: '3.4k' }], featured: true }),
      proj('mesh', 'slate', { id: 'p4', title: 'Ledgerline: billing core', summary: 'Double-entry ledger service handling subscription and usage billing.', role: 'Senior engineer', year: '2022', technologies: ['Go', 'Postgres'], featured: false })
    ],
    experience: [
      { id: 'e1', title: 'Staff Software Engineer', company: 'Northwind Labs', location: 'Remote', startDate: '2022', current: true, description: 'Lead the platform group of 14 engineers across ingestion, deploy tooling and observability.', highlights: ['Cut infrastructure spend 31% through right-sizing and autoscaling', 'Introduced SLOs and error budgets across 40 services'], technologies: ['Go', 'Kafka', 'Kubernetes'] },
      { id: 'e2', title: 'Senior Software Engineer', company: 'Helix Payments', location: 'Bengaluru', startDate: '2019', endDate: '2022', description: 'Built the ledger and reconciliation services behind a payments product.', highlights: ['Designed idempotent payment flows with zero double-charges in production'], technologies: ['Java', 'Postgres'] },
      { id: 'e3', title: 'Software Engineer', company: 'Kite Systems', location: 'Pune', startDate: '2016', endDate: '2019', description: 'Embedded and backend development for IoT fleet management.', highlights: [], technologies: ['C', 'Python'] }
    ],
    education: [{ id: 'ed1', degree: 'B.Tech, Computer Science', institution: 'National Institute of Technology', year: '2016', honors: 'First class' }],
    publications: [{ id: 'pb1', title: 'Exactly-once is a lie (and how to live with it)', publisher: 'Conference talk', year: '2024', type: 'Talk' }]
  }
});

const UX = () => build({
  id: 'editorial-ux', templateName: 'Editorial UX Portfolio', archetype: 'designer', category: 'ui_ux', domain: 'maya-iyer.example.design',
  coverKind: 'ui', palette: 'sand', cta: 'Work with me',
  heroHeadline: 'Product designer',
  metrics: [{ value: '8', label: 'Years' }, { value: '+38%', label: 'Conversion' }, { value: '12', label: 'Case studies' }],
  identity: { fullName: 'Maya Iyer', professionalTitle: 'Senior Product Designer', headline: 'I turn complicated products into calm, usable experiences, from research to shipped interface.', location: 'Mumbai, India', email: 'maya.iyer@example.design', availableForHire: true, yearsOfExperience: 8, socialLinks: { dribbble: 'https://dribbble.com/example', linkedin: 'https://www.linkedin.com/in/example', figma: 'https://www.figma.com/@example' } },
  about: { bio: 'Eight years designing fintech, health and marketplace products. I work from user research through prototyping to design systems, and I stay close to engineering until things ship.', story: 'My background is in graphic design, which is why I sweat typography and rhythm as much as flows and states.', interests: ['design systems', 'accessibility', 'research', 'typography'] },
  data: {
    skills: [skill('s1', 'User research', 'Research', 'expert'), skill('s2', 'Information architecture', 'Research', 'advanced'), skill('s3', 'Figma', 'Craft', 'expert'), skill('s4', 'Prototyping', 'Craft', 'advanced'), skill('s5', 'Design systems', 'Craft', 'expert'), skill('s6', 'Accessibility (WCAG)', 'Craft', 'advanced'), skill('s7', 'Front-end basics', 'Collaboration', 'proficient')],
    projects: [
      proj('ui', 'sand', { id: 'u1', title: 'Fintrack: money, simplified', subtitle: 'Mobile banking redesign', summary: 'Redesigned onboarding and daily budgeting for 2M users.', detailedDescription: 'Ran 24 interviews, mapped the money-anxiety journey and rebuilt onboarding around one decision per screen. Activation rose 38% and support tickets fell by a fifth.', role: 'Lead designer', year: '2025', category: 'Fintech', tags: ['Research', 'Mobile', 'Design system'], metrics: [{ label: 'Activation', value: '+38%' }, { label: 'Tickets', value: '-21%' }], featured: true, caseStudyUrl: 'https://example.com' }),
      proj('mesh', 'dusk', { id: 'u2', title: 'Wellspring Health', subtitle: 'Patient portal', summary: 'An accessible patient portal that older adults actually enjoy using.', role: 'Senior designer', year: '2024', category: 'Health', tags: ['Accessibility', 'Web'], metrics: [{ label: 'SUS score', value: '86' }], featured: true }),
      proj('poster', 'sand', { id: 'u3', title: 'Bazaar: marketplace system', subtitle: 'Design system', summary: 'A token-driven design system shared by five product teams.', role: 'Design systems lead', year: '2023', category: 'Systems', tags: ['Figma', 'Tokens'], featured: true }),
      proj('blueprint', 'slate', { id: 'u4', title: 'Atlas: logistics dashboard', summary: 'Operational dashboards for warehouse managers.', role: 'Product designer', year: '2022', category: 'B2B', tags: ['Data viz'], featured: false })
    ],
    experience: [
      { id: 'e1', title: 'Senior Product Designer', company: 'Fintrack', startDate: '2022', current: true, description: 'Own design for onboarding, budgeting and the shared design system.', highlights: ['Built the 140-component system now used by 5 teams'] },
      { id: 'e2', title: 'Product Designer', company: 'Wellspring Health', startDate: '2019', endDate: '2022', description: 'Designed patient-facing experiences with a strong accessibility focus.', highlights: [] },
      { id: 'e3', title: 'Graphic Designer', company: 'Studio Marigold', startDate: '2016', endDate: '2019', description: 'Brand and editorial design for retail clients.', highlights: [] }
    ],
    testimonials: [
      { id: 't1', quote: 'Maya has an unusual ability to make hard problems feel obvious. Our team shipped faster and users noticed.', authorName: 'Rohan Desai', authorTitle: 'VP Product', clientCompany: 'Fintrack' },
      { id: 't2', quote: 'The design system she built is the reason five teams could finally ship in a consistent voice.', authorName: 'Anita Shah', authorTitle: 'Head of Engineering', clientCompany: 'Bazaar' }
    ],
    education: [{ id: 'ed1', degree: 'B.Des, Communication Design', institution: 'National Design Institute', year: '2016' }]
  }
});

const PHOTO = () => {
  const cats = ['Landscape', 'City', 'Interior', 'Portrait'];
  const kinds: ArtKind[] = ['landscape', 'skyline', 'interior', 'orb', 'elevation', 'mesh', 'landscape', 'skyline'];
  const pals: PaletteName[] = ['dusk', 'slate', 'sand', 'ember', 'forest', 'ocean', 'neon', 'mono'];
  const mk = (i: number): PortfolioProjectItem => ({ id: `ph${i}`, title: ['Blue hour, Ladakh', 'Neon rain', 'Quiet room', 'Ember', 'Concrete morning', 'Tidal', 'Last light', 'Midnight line'][i], category: cats[i % 4], year: '2025', featuredImageUrl: art(kinds[i], `ph${i}`, pals[i]), summary: 'Shot on medium format, edited with restraint.' });
  return build({
    id: 'photo-fullscreen', templateName: 'Full-Screen Photography', archetype: 'photographer', category: 'photography', domain: 'neel-sarkar.example.photo',
    coverKind: 'landscape', palette: 'dusk', cta: 'Book a shoot',
    heroHeadline: 'Photographer',
    metrics: [{ value: '14', label: 'Exhibitions' }, { value: '60+', label: 'Countries' }, { value: '2', label: 'Books' }],
    identity: { fullName: 'Neel Sarkar', professionalTitle: 'Landscape & Documentary Photographer', headline: 'Quiet light, long roads and the geometry of places people forget to look at.', location: 'Kolkata, India', email: 'neel@example.photo', availableForHire: true, yearsOfExperience: 12, socialLinks: { instagram: 'https://instagram.com/example', behance: 'https://behance.net/example', youtube: 'https://youtube.com/@example' } },
    about: { bio: 'Twelve years photographing landscapes, architecture and the people who live in between. My work has been exhibited in fourteen shows and published in two books.', story: 'I shoot mostly on medium format and edit lightly. A good photograph should feel found, not made.', interests: ['analog', 'travel', 'architecture'] },
    data: {
      projects: [0, 1, 2, 3, 4, 5, 6, 7].map(mk),
      skills: [skill('s1', 'Landscape', 'Genres', 'expert'), skill('s2', 'Documentary', 'Genres', 'advanced'), skill('s3', 'Architecture', 'Genres', 'advanced'), skill('s4', 'Lightroom & Capture One', 'Tools', 'expert'), skill('s5', 'Medium format', 'Tools', 'expert')],
      services: [{ id: 'sv1', title: 'Commissions', description: 'Editorial and brand commissions, shot on location.', startingPrice: 'From ₹60,000' }, { id: 'sv2', title: 'Prints', description: 'Archival pigment prints, signed and numbered editions.', startingPrice: 'From ₹8,500' }],
      experience: []
    }
  });
};

const GRAPHIC = () => build({
  id: 'graphic-bold', templateName: 'Bold Graphic Designer', archetype: 'designer', category: 'creative', domain: 'tara-bose.example.art',
  coverKind: 'poster', palette: 'candy', cta: "Let's make something loud",
  heroHeadline: 'Graphic designer & illustrator',
  metrics: [{ value: '120+', label: 'Posters' }, { value: '9', label: 'Awards' }, { value: '40', label: 'Brands' }],
  identity: { fullName: 'Tara Bose', professionalTitle: 'Graphic Designer & Illustrator', headline: 'Loud colour, honest shapes and identities that refuse to blend in.', location: 'Delhi, India', email: 'tara@example.art', availableForHire: true, yearsOfExperience: 7, socialLinks: { instagram: 'https://instagram.com/example', behance: 'https://behance.net/example', dribbble: 'https://dribbble.com/example' } },
  about: { bio: 'I design identities, posters and packaging for brands that want to be remembered. Seven years, forty brands and a drawer full of rejected logos that made the final ones better.', interests: ['risograph', 'type', 'zines'] },
  data: {
    skills: [skill('s1', 'Brand identity', 'Design', 'expert'), skill('s2', 'Illustration', 'Design', 'expert'), skill('s3', 'Packaging', 'Design', 'advanced'), skill('s4', 'Typography', 'Design', 'expert'), skill('s5', 'Illustrator', 'Tools', 'expert'), skill('s6', 'Procreate', 'Tools', 'advanced')],
    projects: [
      proj('poster', 'candy', { id: 'g1', title: 'Chaat Club', subtitle: 'Brand identity', summary: 'A street-food brand that looks as good as it tastes.', category: 'Branding', year: '2025', tags: ['Logo', 'Packaging'], featured: true }),
      proj('stripes', 'candy', { id: 'g2', title: 'Monsoon Fest', subtitle: 'Poster series', summary: 'Twelve posters for a music festival, one per night.', category: 'Posters', year: '2025', featured: true }),
      proj('orb', 'neon', { id: 'g3', title: 'Pixel Pantry', subtitle: 'Packaging', summary: 'Playful packaging for a snack startup.', category: 'Packaging', year: '2024', featured: true }),
      proj('poster', 'ember', { id: 'g4', title: 'Rang', subtitle: 'Editorial illustration', summary: 'A magazine series on colour in everyday life.', category: 'Illustration', year: '2024' }),
      proj('mesh', 'candy', { id: 'g5', title: 'Loop Records', subtitle: 'Album art', summary: 'Cover art for an independent label.', category: 'Illustration', year: '2023' }),
      proj('stripes', 'ember', { id: 'g6', title: 'Kala Ghoda', subtitle: 'Festival identity', summary: 'Wayfinding and print for an arts festival.', category: 'Branding', year: '2023' })
    ],
    experience: [{ id: 'e1', title: 'Independent designer', company: 'Studio Tara', startDate: '2021', current: true, description: 'Identity, poster and packaging projects for forty brands.', highlights: [] }, { id: 'e2', title: 'Junior designer', company: 'Pop & Co', startDate: '2018', endDate: '2021', description: 'Campaign and social design.', highlights: [] }],
    testimonials: [{ id: 't1', quote: 'Tara made our brand impossible to ignore. Sales counters were full of people photographing the packaging.', authorName: 'Imran Khan', authorTitle: 'Founder', clientCompany: 'Chaat Club' }]
  }
});

const MOTION = () => build({
  id: 'motion-immersive', templateName: 'Immersive 3D & Motion', archetype: 'motion_3d', category: 'creative', domain: 'kai-nakamura.example.studio',
  coverKind: 'orb', palette: 'neon', cta: 'Request a quote',
  heroHeadline: '3D artist & motion designer',
  metrics: [{ value: '300+', label: 'Renders' }, { value: '18', label: 'Showreels' }, { value: '6', label: 'Years' }],
  identity: { fullName: 'Kai Nakamura', professionalTitle: '3D Artist & Motion Designer', headline: 'Worlds built in light: product renders, title sequences and looping motion.', location: 'Osaka, Japan', email: 'kai@example.studio', availableForHire: true, yearsOfExperience: 6, socialLinks: { artstation: 'https://artstation.com/example', vimeo: 'https://vimeo.com/example', instagram: 'https://instagram.com/example' } },
  about: { bio: 'Six years crafting 3D product visuals, broadcast titles and looping social motion. I enjoy the point where simulation, lighting and typography meet.', interests: ['simulation', 'lighting', 'typography'] },
  data: {
    skills: [skill('s1', 'Blender', 'Software', 'expert'), skill('s2', 'Cinema 4D', 'Software', 'advanced'), skill('s3', 'After Effects', 'Software', 'expert'), skill('s4', 'Houdini', 'Software', 'intermediate'), skill('s5', 'Look development', 'Craft', 'expert'), skill('s6', 'Lighting', 'Craft', 'expert'), skill('s7', 'Motion typography', 'Craft', 'advanced')],
    projects: [
      proj('orb', 'neon', { id: 'm1', title: 'Hyperlight', subtitle: 'Product launch film', summary: 'A 45-second launch film for a wearable device.', category: '3D', year: '2025', tags: ['Blender', 'Redshift'], featured: true }),
      proj('mesh', 'ocean', { id: 'm2', title: 'Tidal', subtitle: 'Fluid simulation', summary: 'A liquid sculpture loop for a fragrance brand.', category: 'Simulation', year: '2025', tags: ['Houdini'], featured: true }),
      proj('orb', 'ember', { id: 'm3', title: 'Ember Sequence', subtitle: 'Broadcast titles', summary: 'Opening titles for a documentary series.', category: 'Motion', year: '2024', tags: ['After Effects'], featured: true }),
      proj('poster', 'neon', { id: 'm4', title: 'Glyphs', subtitle: 'Kinetic type', summary: 'A kinetic typography study in 3D.', category: 'Motion', year: '2024' }),
      proj('mesh', 'forest', { id: 'm5', title: 'Moss', subtitle: 'Environment', summary: 'A stylised forest scene lit by volumetric fog.', category: '3D', year: '2023' })
    ],
    experience: [{ id: 'e1', title: 'Freelance 3D & motion', company: 'Studio Kai', startDate: '2021', current: true, description: 'Product visuals and motion for brands and agencies.', highlights: [] }, { id: 'e2', title: 'Motion designer', company: 'Frame Factory', startDate: '2019', endDate: '2021', description: 'Broadcast graphics and social loops.', highlights: [] }],
    media: { youtubeUrls: ['https://www.youtube.com/watch?v=aqz-KE-bpKQ'] }
  }
});

const FREELANCE = () => build({
  id: 'freelancer-services', templateName: 'Freelancer Services & Clients', archetype: 'personal_brand', category: 'freelancer', domain: 'sofia-reyes.example.studio',
  coverKind: 'mesh', palette: 'ocean', cta: 'Request a proposal',
  heroHeadline: 'Freelance web designer & developer',
  metrics: [{ value: '60+', label: 'Projects' }, { value: '4.9', label: 'Avg rating' }, { value: '5 days', label: 'Typical start' }],
  identity: { fullName: 'Sofia Reyes', professionalTitle: 'Freelance Web Designer & Developer', headline: 'I help small businesses launch fast, good-looking websites that actually bring in customers.', location: 'Remote · Lisbon, Portugal', email: 'hello@example.studio', availableForHire: true, availabilityStatus: 'Booking projects for next month', yearsOfExperience: 7, socialLinks: { linkedin: 'https://www.linkedin.com/in/example', dribbble: 'https://dribbble.com/example', github: 'https://github.com/example' } },
  about: { bio: 'Independent designer-developer with 60+ launches for cafés, clinics, coaches and startups. Clear scope, fixed prices and weekly updates, so you always know where things stand.', interests: ['small business', 'performance', 'copywriting'] },
  data: {
    skills: [skill('s1', 'Web design', 'Services', 'expert'), skill('s2', 'React & Next.js', 'Services', 'advanced'), skill('s3', 'Shopify', 'Services', 'advanced'), skill('s4', 'SEO basics', 'Services', 'proficient'), skill('s5', 'Copywriting', 'Services', 'proficient')],
    services: [
      { id: 'sv1', title: 'Landing page', description: 'A single, high-converting page built around one goal.', deliverables: ['Custom design', 'Mobile-first build', 'Basic SEO', '1 round of revisions'], startingPrice: 'From $900', timeline: '1 week' },
      { id: 'sv2', title: 'Business website', description: 'A complete 5–8 page site you can edit yourself.', deliverables: ['Brand-matched design', 'CMS setup', 'Analytics', 'Training video'], startingPrice: 'From $2,400', timeline: '3 weeks', featured: true },
      { id: 'sv3', title: 'Online store', description: 'A Shopify store tuned for trust and checkout.', deliverables: ['Theme customisation', 'Product import', 'Payments & shipping setup'], startingPrice: 'From $3,800', timeline: '4 weeks' }
    ],
    projects: [
      proj('ui', 'ocean', { id: 'f1', title: 'Fika Café', summary: 'New site and online ordering for a neighbourhood café.', category: 'Hospitality', year: '2025', metrics: [{ label: 'Online orders', value: '+64%' }], featured: true }),
      proj('mesh', 'sand', { id: 'f2', title: 'Bloom Clinic', summary: 'Booking-first website for a physiotherapy clinic.', category: 'Health', year: '2025', metrics: [{ label: 'Bookings', value: '+41%' }], featured: true }),
      proj('poster', 'candy', { id: 'f3', title: 'Pedal Co.', summary: 'Shopify store for a cargo-bike brand.', category: 'E-commerce', year: '2024', featured: true }),
      proj('blueprint', 'slate', { id: 'f4', title: 'Northbound Coaching', summary: 'Authority site and course landing pages.', category: 'Coaching', year: '2024' })
    ],
    testimonials: [
      { id: 't1', quote: 'Sofia delivered in two weeks what two agencies quoted three months for. Bookings went up the week we launched.', authorName: 'Dr. Lena Fischer', authorTitle: 'Owner', clientCompany: 'Bloom Clinic', rating: 5 },
      { id: 't2', quote: 'Communication was effortless. Fixed price, weekly updates, zero surprises.', authorName: 'Marco Bianchi', authorTitle: 'Founder', clientCompany: 'Pedal Co.', rating: 5 },
      { id: 't3', quote: 'Our café site finally looks like our café. Customers mention it constantly.', authorName: 'Elin Berg', authorTitle: 'Owner', clientCompany: 'Fika Café', rating: 5 }
    ],
    experience: [{ id: 'e1', title: 'Independent designer-developer', company: 'Studio Reyes', startDate: '2019', current: true, description: 'Sixty-plus websites and stores for small businesses.', highlights: [] }]
  }
});

const GRAD = () => build({
  id: 'graduate-profile', templateName: 'Fresh Graduate Profile', archetype: 'academic_pro', category: 'student', domain: 'riya-das.example.me',
  coverKind: 'mesh', palette: 'ocean', cta: 'Contact me',
  heroHeadline: 'Computer science graduate',
  metrics: [{ value: '9.1', label: 'CGPA' }, { value: '5', label: 'Projects' }, { value: '4', label: 'Certificates' }],
  identity: { fullName: 'Riya Das', professionalTitle: 'B.Tech Computer Science Graduate', headline: 'Curious, hands-on and ready for my first full-time role in software and data.', location: 'Kolkata, India', email: 'riya.das@example.me', availableForHire: true, availabilityStatus: 'Open to graduate roles from July', yearsOfExperience: 0, socialLinks: { linkedin: 'https://www.linkedin.com/in/example', github: 'https://github.com/example' } },
  about: { bio: 'Final-year Computer Science graduate with two internships, a published campus project and a habit of building things to understand them. I enjoy data, web apps and good documentation.', interests: ['web', 'data', 'teaching', 'chess'] },
  data: {
    skills: [skill('s1', 'Python', 'Programming', 'advanced'), skill('s2', 'JavaScript / React', 'Programming', 'advanced'), skill('s3', 'SQL', 'Programming', 'proficient'), skill('s4', 'Java', 'Programming', 'proficient'), skill('s5', 'Git & GitHub', 'Tools', 'advanced'), skill('s6', 'Figma', 'Tools', 'intermediate'), skill('s7', 'Communication', 'Soft skills', 'advanced'), skill('s8', 'Teamwork', 'Soft skills', 'advanced')],
    education: [
      { id: 'ed1', degree: 'B.Tech, Computer Science & Engineering', institution: 'Jadavpur Institute of Technology', year: '2022 – 2026', honors: 'CGPA 9.1 / 10 · Dean’s list' },
      { id: 'ed2', degree: 'Higher Secondary (Science)', institution: 'St. Xavier’s Collegiate School', year: '2022', honors: '96%' }
    ],
    projects: [
      proj('ui', 'ocean', { id: 'r1', title: 'CampusConnect', summary: 'A student event and club platform used by 1,800 students.', category: 'Web app', year: '2025', technologies: ['React', 'Node.js', 'PostgreSQL'], role: 'Team lead', sourceUrl: 'https://github.com/example', featured: true }),
      proj('chart', 'forest', { id: 'r2', title: 'Crop Yield Predictor', summary: 'A regression model forecasting yields from weather and soil data.', category: 'Data science', year: '2025', technologies: ['Python', 'scikit-learn'], featured: true }),
      proj('mesh', 'dusk', { id: 'r3', title: 'StudyBuddy', summary: 'A spaced-repetition flashcard app.', category: 'Mobile', year: '2024', technologies: ['React Native'], featured: true })
    ],
    experience: [
      { id: 'e1', title: 'Software Engineering Intern', company: 'Northwind Labs', startDate: 'May 2025', endDate: 'Jul 2025', description: 'Built an internal dashboard and wrote integration tests for the billing service.', highlights: ['Shipped to production in week 5', 'Raised test coverage from 52% to 78%'], technologies: ['TypeScript', 'React'] },
      { id: 'e2', title: 'Teaching Assistant, Data Structures', company: 'Jadavpur Institute of Technology', startDate: '2024', endDate: '2025', description: 'Ran weekly labs for 60 students.', highlights: [] }
    ],
    publications: [
      { id: 'c1', title: 'Google Data Analytics Professional Certificate', publisher: 'Coursera', year: '2025', type: 'Certification' },
      { id: 'c2', title: 'AWS Cloud Practitioner', publisher: 'Amazon Web Services', year: '2025', type: 'Certification' },
      { id: 'c3', title: 'Smart India Hackathon, Finalist', publisher: 'Govt. of India', year: '2024', type: 'Award' }
    ]
  }
});

const DATA = () => build({
  id: 'data-ai-lab', templateName: 'Data & AI Research Lab', archetype: 'academic_pro', category: 'ai_data', domain: 'dr-leila-haddad.example.ai',
  coverKind: 'chart', palette: 'slate', cta: 'Collaborate',
  heroHeadline: 'Machine learning researcher',
  metrics: [{ value: '24', label: 'Publications' }, { value: '1.8k', label: 'Citations' }, { value: '11', label: 'h-index' }],
  identity: { fullName: 'Dr. Leila Haddad', professionalTitle: 'Machine Learning Researcher', headline: 'Building reliable, interpretable models for healthcare and climate data.', location: 'Toronto, Canada', email: 'leila.haddad@example.ai', currentCompany: 'Vector Applied Research', currentRole: 'Senior Research Scientist', availableForHire: true, yearsOfExperience: 10, socialLinks: { scholar: 'https://scholar.google.com/', github: 'https://github.com/example', linkedin: 'https://www.linkedin.com/in/example', kaggle: 'https://kaggle.com/example' } },
  about: { bio: 'I study how to make machine-learning systems trustworthy: calibrated, interpretable and robust under distribution shift. My work spans clinical risk prediction, climate forecasting and tooling for reproducible research.', interests: ['interpretability', 'time series', 'causal inference', 'MLOps'] },
  data: {
    skills: [skill('s1', 'PyTorch', 'Modelling', 'expert', 7), skill('s2', 'Probabilistic ML', 'Modelling', 'expert', 8), skill('s3', 'Causal inference', 'Modelling', 'advanced', 5), skill('s4', 'Python', 'Engineering', 'expert', 10), skill('s5', 'Spark', 'Engineering', 'advanced', 5), skill('s6', 'MLflow', 'Engineering', 'advanced', 4), skill('s7', 'Experiment design', 'Research', 'expert', 8), skill('s8', 'Scientific writing', 'Research', 'expert', 10)],
    publications: [
      { id: 'p1', title: 'Calibrated Risk Prediction under Distribution Shift in Clinical Time Series', authors: ['L. Haddad', 'M. Okafor', 'J. Lindqvist'], publisher: 'NeurIPS', year: '2025', type: 'Conference', abstract: 'We propose a calibration-aware training objective that preserves reliability when hospital populations change.', bibtex: '@inproceedings{haddad2025calibrated,\n  title={Calibrated Risk Prediction under Distribution Shift},\n  author={Haddad, Leila and Okafor, M. and Lindqvist, J.},\n  booktitle={NeurIPS},\n  year={2025}\n}' },
      { id: 'p2', title: 'Interpretable Forecasting of Regional Climate Anomalies', authors: ['L. Haddad', 'S. Tan'], publisher: 'Nature Climate Informatics', year: '2024', type: 'Journal', abstract: 'A sparse additive model that matches deep baselines while exposing the drivers behind each forecast.' },
      { id: 'p3', title: 'Reproducible ML: a checklist and toolkit', authors: ['L. Haddad'], publisher: 'ICML Workshop', year: '2023', type: 'Workshop' }
    ],
    projects: [
      proj('chart', 'slate', { id: 'a1', title: 'ClinCal', summary: 'Open-source library for calibrating clinical risk models.', category: 'Healthcare AI', year: '2025', technologies: ['PyTorch', 'scikit-learn'], sourceUrl: 'https://github.com/example', metrics: [{ label: 'GitHub stars', value: '1.2k' }], featured: true }),
      proj('mesh', 'ocean', { id: 'a2', title: 'ClimateLens', summary: 'Interactive explorer for interpretable climate forecasts.', category: 'Climate', year: '2024', technologies: ['JAX', 'D3'], liveUrl: 'https://example.com', featured: true }),
      proj('blueprint', 'slate', { id: 'a3', title: 'RepliKit', summary: 'Experiment-tracking templates for reproducible research.', category: 'MLOps', year: '2023', technologies: ['MLflow', 'DVC'], featured: true })
    ],
    experience: [
      { id: 'e1', title: 'Senior Research Scientist', company: 'Vector Applied Research', startDate: '2021', current: true, description: 'Lead a six-person team on reliable ML for healthcare partners.', highlights: ['Deployed a calibrated sepsis-risk model across 9 hospitals'] },
      { id: 'e2', title: 'Postdoctoral Fellow', company: 'University of Toronto', startDate: '2018', endDate: '2021', description: 'Probabilistic methods for time series.', highlights: [] }
    ],
    education: [{ id: 'ed1', degree: 'PhD, Computer Science (Machine Learning)', institution: 'University of Toronto', year: '2018' }, { id: 'ed2', degree: 'MSc, Statistics', institution: 'McGill University', year: '2014' }]
  }
});

const ARCH = () => build({
  id: 'architect-minimal', templateName: 'Architecture Minimal', archetype: 'photographer', category: 'architecture', domain: 'studio-verma.example.arch',
  coverKind: 'elevation', palette: 'sand', cta: 'Discuss a project',
  heroHeadline: 'Architecture & interior design',
  metrics: [{ value: '42', label: 'Projects' }, { value: '11', label: 'Years' }, { value: '5', label: 'Awards' }],
  identity: { fullName: 'Aditi Verma', displayName: 'Studio Verma', professionalTitle: 'Architect & Interior Designer', headline: 'Calm, light-filled spaces built from honest materials.', location: 'Pune, India', email: 'studio@example.arch', availableForHire: true, yearsOfExperience: 11, socialLinks: { instagram: 'https://instagram.com/example', linkedin: 'https://www.linkedin.com/in/example' } },
  about: { bio: 'Studio Verma designs houses, workplaces and hospitality spaces with a quiet, material-led approach. Eleven years, forty-two completed projects, five design awards.', story: 'We begin with light, climate and the way people actually move, and let the form follow. Fewer materials, better detailed.', interests: ['daylight', 'craft', 'adaptive reuse'] },
  data: {
    skills: [skill('s1', 'Residential architecture', 'Practice', 'expert'), skill('s2', 'Interior design', 'Practice', 'expert'), skill('s3', 'Adaptive reuse', 'Practice', 'advanced'), skill('s4', 'Sustainable design', 'Practice', 'advanced'), skill('s5', 'Revit & ArchiCAD', 'Tools', 'expert'), skill('s6', 'Rhino', 'Tools', 'advanced')],
    projects: [
      proj('elevation', 'sand', { id: 'a1', title: 'Courtyard House', subtitle: 'Residential', summary: 'A family home organised around a shaded courtyard.', category: 'Residential', year: '2025', role: 'Architect', metrics: [{ label: 'Area', value: '320 m²' }], featured: true }),
      proj('interior', 'sand', { id: 'a2', title: 'Terra Café', subtitle: 'Hospitality', summary: 'A warm, earthy café fitted into a heritage shopfront.', category: 'Interior', year: '2025', role: 'Interior design', featured: true }),
      proj('skyline', 'mono', { id: 'a3', title: 'Lumen Offices', subtitle: 'Workplace', summary: 'Daylight-first offices for a design consultancy.', category: 'Commercial', year: '2024', role: 'Architect', featured: true }),
      proj('elevation', 'forest', { id: 'a4', title: 'Hill Retreat', subtitle: 'Residential', summary: 'A timber-and-stone weekend home on a slope.', category: 'Residential', year: '2023', role: 'Architect' }),
      proj('interior', 'ember', { id: 'a5', title: 'Maison Loft', subtitle: 'Interior', summary: 'A warehouse converted into a double-height loft.', category: 'Interior', year: '2023', role: 'Interior design' })
    ],
    experience: [{ id: 'e1', title: 'Principal', company: 'Studio Verma', startDate: '2018', current: true, description: 'Lead architect on residential, hospitality and workplace projects.', highlights: [] }, { id: 'e2', title: 'Associate architect', company: 'Mehta & Partners', startDate: '2014', endDate: '2018', description: 'Mixed-use and residential towers.', highlights: [] }],
    education: [{ id: 'ed1', degree: 'B.Arch', institution: 'School of Planning and Architecture', year: '2014' }],
    testimonials: [{ id: 't1', quote: 'She listened more than she talked, and the house feels like it was always meant to be here.', authorName: 'The Kapoor family', authorTitle: 'Courtyard House' }]
  }
});

const CREATOR = () => build({
  id: 'creator-media', templateName: 'Creator Media Hub', archetype: 'personal_brand', category: 'content_creator', domain: 'zoe-park.example.tv',
  coverKind: 'mesh', palette: 'neon', cta: 'Collaborate with me',
  heroHeadline: 'Creator, storyteller, curious human',
  metrics: [{ value: '420K', label: 'Subscribers' }, { value: '38M', label: 'Total views' }, { value: '210', label: 'Videos' }],
  identity: { fullName: 'Zoe Park', professionalTitle: 'Tech & Lifestyle Creator', headline: 'Honest tech, slow living and the occasional disaster, made weekly for 420K friends.', location: 'Seoul · Los Angeles', email: 'collab@example.tv', availableForHire: true, availabilityStatus: 'Open for brand collaborations', yearsOfExperience: 5, socialLinks: { youtube: 'https://youtube.com/@example', instagram: 'https://instagram.com/example', tiktok: 'https://tiktok.com/@example', twitter: 'https://x.com/example' } },
  about: { bio: 'I make videos about technology that earns its place in your life, and the slower, more intentional habits around it. Five years, 210 videos and a community that talks back.', interests: ['gadgets', 'slow living', 'coffee', 'travel'] },
  data: {
    skills: [skill('s1', 'Video storytelling', 'Craft', 'expert'), skill('s2', 'Editing', 'Craft', 'expert'), skill('s3', 'Product reviews', 'Craft', 'advanced'), skill('s4', 'Community', 'Craft', 'advanced'), skill('s5', 'Brand partnerships', 'Business', 'advanced')],
    projects: [
      proj('mesh', 'neon', { id: 'c1', title: 'My desk setup, finally finished', summary: '1.2M views · The most-watched video of the year.', category: 'Setup', year: '2025', featured: true }),
      proj('orb', 'dusk', { id: 'c2', title: '30 days without a phone', summary: '860K views · An honest experiment.', category: 'Lifestyle', year: '2025', featured: true }),
      proj('ui', 'ocean', { id: 'c3', title: 'I tested every note-taking app', summary: '640K views · Which one actually sticks?', category: 'Tech', year: '2024', featured: true }),
      proj('poster', 'candy', { id: 'c4', title: 'Seoul coffee crawl', summary: '410K views · Eleven cafés, one day.', category: 'Travel', year: '2024' })
    ],
    services: [
      { id: 'sv1', title: 'Sponsored video', description: 'A dedicated, honestly reviewed integration with my audience.', startingPrice: 'Rate card on request', timeline: '3–4 weeks' },
      { id: 'sv2', title: 'Short-form series', description: 'Reels, Shorts and TikToks tailored to your launch.', timeline: '2 weeks' },
      { id: 'sv3', title: 'Ambassadorship', description: 'Long-term partnership across channels.', timeline: 'Quarterly' }
    ],
    testimonials: [{ id: 't1', quote: 'Zoe’s video drove our best launch week ever, and the comments were genuinely engaged.', authorName: 'Priya Nair', authorTitle: 'Brand Manager', clientCompany: 'Lumo Devices' }],
    media: { youtubeUrls: ['https://www.youtube.com/watch?v=aqz-KE-bpKQ'] },
    experience: []
  }
});

export const DEMO_BUILDERS: Record<PortfolioTemplateId, () => ReturnType<typeof build>> = {
  'engineer-blueprint': ENGINEER,
  'editorial-ux': UX,
  'photo-fullscreen': PHOTO,
  'graphic-bold': GRAPHIC,
  'motion-immersive': MOTION,
  'freelancer-services': FREELANCE,
  'graduate-profile': GRAD,
  'data-ai-lab': DATA,
  'architect-minimal': ARCH,
  'creator-media': CREATOR
};
