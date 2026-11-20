import type { PortfolioWebsiteData } from '../../../types/portfolio';
import type { ClientRequirements, GeneratedWebsite } from '../../../types/admin';

// =========================================================================
// 1. NOVA DEMO DATA (Developer / Software Engineer)
// =========================================================================
export const getNovaDemo = (): {
  requirements: ClientRequirements;
  portfolioData: PortfolioWebsiteData;
  website: GeneratedWebsite;
} => {
  const portfolioData: PortfolioWebsiteData = {
    schemaVersion: '1.0',
    archetype: 'developer',
    professionCategory: 'developer',
    identity: {
      fullName: 'Alex Chen',
      title: 'Senior Full-Stack & Distributed Systems Architect',
      displayName: 'Alex Chen',
      profilePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      heroCoverUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80',
      location: 'San Francisco, CA & Remote',
      email: 'alex.chen.dev@example.com',
      phone: '+1 (415) 890-4321',
      headline: 'Architecting resilient distributed systems, high-throughput streaming kernels, and developer infrastructure at planetary scale.',
      bio: 'Staff systems engineer with 9+ years of experience leading core platform teams across Silicon Valley. Obsessed with zero-copy I/O, consensus protocols, and developer-first DX. Open-source contributor to Tokio, Raft, and cloud-native Kubernetes tooling.',
      yearsOfExperience: 9,
      currentCompany: 'CloudStream Systems',
      currentRole: 'Staff Infrastructure Architect',
      availabilityStatus: 'open_for_projects',
      socialLinks: {
        github: 'https://github.com/alexchen-dev',
        linkedin: 'https://linkedin.com/in/alexchen-dev',
        twitter: 'https://twitter.com/alexchen_code'
      }
    },
    skills: [
      { id: 'sk_1', name: 'Rust', category: 'Systems', proficiency: 'Expert', yearsOfExperience: 6, featured: true },
      { id: 'sk_2', name: 'Go', category: 'Backend', proficiency: 'Expert', yearsOfExperience: 7, featured: true },
      { id: 'sk_3', name: 'TypeScript', category: 'Frontend', proficiency: 'Expert', yearsOfExperience: 8, featured: true },
      { id: 'sk_4', name: 'Kubernetes & Docker', category: 'DevOps', proficiency: 'Advanced', yearsOfExperience: 6, featured: true },
      { id: 'sk_5', name: 'Distributed Consensus (Raft)', category: 'Architecture', proficiency: 'Expert', yearsOfExperience: 5, featured: true },
      { id: 'sk_6', name: 'ClickHouse & Kafka', category: 'Data', proficiency: 'Advanced', yearsOfExperience: 4, featured: false },
      { id: 'sk_7', name: 'WebAssembly (Wasm)', category: 'Systems', proficiency: 'Intermediate', yearsOfExperience: 3, featured: false },
      { id: 'sk_8', name: 'React / Next.js', category: 'Frontend', proficiency: 'Advanced', yearsOfExperience: 7, featured: false }
    ],
    projects: [
      {
        id: 'proj_1',
        title: 'AetherKV — Distributed In-Memory Key-Value Store',
        summary: 'A sub-millisecond, partition-tolerant key-value store built in Rust implementing the Raft consensus algorithm with zero-allocation socket rings and vectorized snapshotting.',
        detailedDescription: 'Engineered from scratch to achieve 850k ops/sec per node on bare-metal NVMe. Features atomic multi-key transactions, log compaction, dynamic cluster membership reconfiguration, and automated leader election failover under network partitions.',
        role: 'Sole Architect & Lead Engineer',
        liveUrl: 'https://aetherkv.dev',
        githubUrl: 'https://github.com/alexchen-dev/aetherkv',
        technologies: ['Rust', 'Tokio', 'Raft Consensus', 'eBPF', 'io_uring'],
        featuredImageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
        metrics: [
          { label: 'Throughput', value: '850K req/s' },
          { label: 'p99 Latency', value: '< 1.2ms' },
          { label: 'GitHub Stars', value: '3.4k' }
        ],
        featured: true,
        order: 1
      },
      {
        id: 'proj_2',
        title: 'KubeMesh-CLI — Zero-Trust Cluster Traffic Director',
        summary: 'High-performance cloud-native CLI and daemon for dynamic eBPF-based service mesh traffic inspection, mTLS certificate rotation, and latency anomaly alerting.',
        detailedDescription: 'Adopted by 40+ engineering organizations to diagnose inter-pod latency spikes without injecting heavyweight sidecar proxies into production pods.',
        role: 'Author & Maintainer',
        liveUrl: 'https://kubemesh.dev',
        githubUrl: 'https://github.com/alexchen-dev/kubemesh',
        technologies: ['Go', 'eBPF', 'Kubernetes CRDs', 'gRPC', 'Prometheus'],
        featuredImageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
        metrics: [
          { label: 'Active Clusters', value: '1,200+' },
          { label: 'Overhead', value: '< 0.5% CPU' }
        ],
        featured: true,
        order: 2
      },
      {
        id: 'proj_3',
        title: 'PulseStream — Real-time Telemetry Pipeline',
        summary: 'Massively scalable event ingestion pipeline processing 1.4M telemetry events per second over WebSockets and gRPC with guaranteed at-least-once delivery.',
        role: 'Principal Engineer',
        technologies: ['TypeScript', 'Kafka', 'ClickHouse', 'Node.js', 'Grafana'],
        featuredImageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
        featured: true,
        order: 3
      }
    ],
    experience: [
      {
        id: 'exp_1',
        title: 'Staff Systems Architect',
        company: 'CloudStream Systems',
        location: 'San Francisco, CA',
        period: '2022 - Present',
        description: 'Led technical design of the core multi-tenant compute engine powering 200M daily API transactions. Reduced global p99 query latency from 84ms to 12ms through SIMD-accelerated serialization.',
        technologies: ['Rust', 'Distributed Systems', 'Go', 'Kubernetes', 'AWS'],
        current: true,
        highlights: [
          'Reduced cloud infrastructure spend by $1.8M annually through memory optimization',
          'Authored internal engineering standards for zero-downtime database schema migrations'
        ]
      },
      {
        id: 'exp_2',
        title: 'Senior Backend Engineer',
        company: 'DataGrid Networks',
        location: 'San Francisco, CA',
        period: '2019 - 2022',
        description: 'Built high-throughput edge proxies routing encrypted financial data feeds across North American banking backbones with 99.999% SLA availability.',
        technologies: ['Go', 'PostgreSQL', 'Docker', 'Consul', 'Redis'],
        current: false,
        highlights: [
          'Scaled ingestion throughput 6x without expanding cluster footprint',
          'Mentored 7 junior and mid-level engineers across two scrum teams'
        ]
      }
    ],
    education: [
      {
        id: 'edu_1',
        degree: 'B.S. in Computer Science & Mathematics',
        institution: 'University of California, Berkeley',
        year: '2015 - 2019',
        honors: 'Summa Cum Laude, Dean’s Honors List'
      }
    ],
    publications: [
      {
        id: 'pub_1',
        title: 'Vectorized Consensus: Optimizing Raft Under Skewed Cloud Workloads',
        publisher: 'ACM Systems & Cloud Architecture Quarterly',
        year: '2024',
        link: 'https://doi.org/10.1145/example.nova.raft',
        type: 'journal'
      }
    ],
    media: {
      officialLogoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      officialHeroBannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80',
      googleDriveGalleryUrl: 'https://drive.google.com/drive/folders/1example-nova-architecture',
      googleDriveVideoUrl: 'https://drive.google.com/file/d/1example-nova-talk/view',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    navigationConfig: {
      enabledPages: ['/', '/projects', '/experience', '/contact'],
      ctaButtonText: 'Initialize Terminal Contact'
    }
  };

  const requirements: ClientRequirements = {
    organizationName: 'Alex Chen',
    category: 'portfolio',
    portfolioArchetype: 'developer',
    tagline: 'Architecting resilient distributed systems and developer infrastructure at planetary scale.',
    aboutText: 'Staff systems engineer with 9+ years of experience leading core platform teams across Silicon Valley. Obsessed with zero-copy I/O, consensus protocols, and developer-first DX.',
    contactEmail: 'alex.chen.dev@example.com',
    contactPhone: '+1 (415) 890-4321',
    primaryColor: '#0284c7',
    accentColor: '#38bdf8',
    typographyStyle: 'futuristic',
    logoUrl: portfolioData.identity.profilePhotoUrl,
    coverImageUrl: portfolioData.identity.heroCoverUrl,
    enabledSections: { hero: true, events: false, about: true, committee: false, gallery: true, contact: true },
    events: [],
    committee: [],
    gallery: [],
    portfolioData,
    selectedTemplate: {
      templateId: 'nova',
      templateVersion: '1.0.0',
      templateName: 'NOVA — Developer & Systems Engineer',
      websiteCategory: 'developer',
      selectedAt: new Date().toISOString()
    }
  };

  const website: GeneratedWebsite = {
    themeAccent: 'nova-terminal',
    layoutPreset: 'split',
    fontFamily: 'Space Grotesk, JetBrains Mono, monospace',
    simulatedDomain: 'alexchen.digiverse.dev',
    heroHeadline: 'Senior Full-Stack & Distributed Systems Architect',
    heroDescription: 'Architecting resilient distributed systems, high-throughput streaming kernels, and developer infrastructure at planetary scale.',
    heroImage: portfolioData.identity.heroCoverUrl,
    metrics: [
      { value: '9+', label: 'Years Experience' },
      { value: '850K', label: 'Max QPS Handled' },
      { value: '3.4k', label: 'GitHub Stars' },
      { value: '99.999%', label: 'Uptime Achieved' }
    ],
    eventsTitle: '',
    eventsList: [],
    aboutContent: portfolioData.identity.bio || '',
    committeeTitle: '',
    committeeList: [],
    galleryTitle: '',
    galleryList: [],
    portfolioData,
    selectedTemplate: requirements.selectedTemplate
  };

  return { requirements, portfolioData, website };
};

// =========================================================================
// 2. CREATIVE STUDIO DEMO DATA (UI/UX & Graphic Designer)
// =========================================================================
export const getCreativeStudioDemo = (): {
  requirements: ClientRequirements;
  portfolioData: PortfolioWebsiteData;
  website: GeneratedWebsite;
} => {
  const portfolioData: PortfolioWebsiteData = {
    schemaVersion: '1.0',
    archetype: 'designer',
    professionCategory: 'designer',
    identity: {
      fullName: 'Elena Rostova',
      title: 'Principal Product Designer & Art Director',
      displayName: 'Elena Rostova',
      profilePhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
      heroCoverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
      location: 'Stockholm, Sweden & London, UK',
      email: 'elena@rostovastudio.design',
      phone: '+46 8 555 321 00',
      headline: 'Crafting emotive digital products, expressive typography, and design systems that move people.',
      bio: 'Award-winning designer with 8+ years shaping interfaces for fintech, streaming media, and avant-garde luxury brands. Former lead designer at Spotify Design and Pentagram collaborator. Believes good design is clarity made unforgettable.',
      yearsOfExperience: 8,
      currentCompany: 'Rostova Studio',
      currentRole: 'Design Director',
      availabilityStatus: 'open_for_projects',
      socialLinks: {
        dribbble: 'https://dribbble.com/rostovadesign',
        behance: 'https://behance.net/elenarostova',
        linkedin: 'https://linkedin.com/in/elena-rostova'
      }
    },
    skills: [
      { id: 'cs_1', name: 'Design Systems', category: 'Core', proficiency: 'Expert', yearsOfExperience: 8, featured: true },
      { id: 'cs_2', name: 'UI / UX Architecture', category: 'Core', proficiency: 'Expert', yearsOfExperience: 8, featured: true },
      { id: 'cs_3', name: 'Figma & Token Systems', category: 'Tooling', proficiency: 'Expert', yearsOfExperience: 7, featured: true },
      { id: 'cs_4', name: 'Art Direction', category: 'Creative', proficiency: 'Expert', yearsOfExperience: 6, featured: true },
      { id: 'cs_5', name: 'Framer / Micro-Interactions', category: 'Prototyping', proficiency: 'Advanced', yearsOfExperience: 5, featured: true },
      { id: 'cs_6', name: 'Editorial Typography', category: 'Visual', proficiency: 'Expert', yearsOfExperience: 8, featured: false }
    ],
    projects: [
      {
        id: 'proj_cs1',
        title: 'Nordic FinTech Rebrand & Cross-Platform Design System',
        summary: 'Complete brand rejuvenation and tokenized design system for 4.2M Scandinavian digital banking users, driving +38% mobile onboarding completions.',
        detailedDescription: 'Unified 12 siloed engineering squads under a shared Figma-to-React component token pipeline with automated accessibility audits and dark-mode elevation scales.',
        role: 'Lead Design Strategist & Token Architect',
        liveUrl: 'https://nordicbank-example.design',
        technologies: ['Figma Tokens', 'Design System Architecture', 'WCAG AAA', 'Framer Prototypes'],
        featuredImageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
        metrics: [
          { label: 'Onboarding Lift', value: '+38%' },
          { label: 'Active Users', value: '4.2M' },
          { label: 'Components Built', value: '240+' }
        ],
        featured: true,
        order: 1
      },
      {
        id: 'proj_cs2',
        title: 'Solace Health — Calm Patient Care Interface',
        summary: 'Serene, high-contrast healthcare companion for chronic symptom tracking, remote clinical check-ins, and biometric summaries.',
        role: 'Product Designer',
        technologies: ['Mobile UX', 'Accessibility', 'Interaction Design', 'Microcopy'],
        featuredImageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
        metrics: [
          { label: 'App Store Rating', value: '4.9 ★' },
          { label: 'NPS Score', value: '+74' }
        ],
        featured: true,
        order: 2
      },
      {
        id: 'proj_cs3',
        title: 'Monolith Architectural Monograph — Digital Experience',
        summary: 'Asymmetric editorial web exhibition highlighting Scandinavian brutalist architecture with kinetic typography and responsive canvas shaders.',
        role: 'Art Director & Frontend Prototyper',
        technologies: ['Typography', 'WebGL', 'Editorial Layout', 'Art Direction'],
        featuredImageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        featured: true,
        order: 3
      }
    ],
    experience: [
      {
        id: 'exp_cs1',
        title: 'Founder & Creative Director',
        company: 'Rostova Studio',
        location: 'Stockholm, Sweden',
        period: '2021 - Present',
        description: 'Directing product design sprints and brand systems for fast-growing technology companies and cultural institutions across Europe.',
        current: true,
        highlights: ['Shipped 18 end-to-end design systems', 'Awwwards Site of the Day Winner (x3)']
      },
      {
        id: 'exp_cs2',
        title: 'Senior Product Designer',
        company: 'Spotify',
        location: 'Stockholm',
        period: '2018 - 2021',
        description: 'Co-led the mobile listening team focusing on personalized playlist discovery algorithms, haptic feedback, and artist page storytelling.',
        current: false
      }
    ],
    education: [
      {
        id: 'edu_cs1',
        degree: 'Master of Fine Arts in Visual Communication',
        institution: 'Konstfack University of Arts, Crafts and Design',
        year: '2014 - 2018',
        honors: 'Summa Cum Laude'
      }
    ],
    testimonials: [
      {
        id: 'test_cs1',
        clientName: 'Soren Lindqvist',
        clientRole: 'VP of Product',
        clientCompany: 'Nordic Financial Group',
        quote: 'Elena has an extraordinary capacity to synthesize deep technical constraints into breathtakingly clear, intuitive human interfaces. Our design velocity tripled under her guidance.',
        rating: 5
      }
    ],
    media: {
      officialLogoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
      officialHeroBannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
      googleDriveGalleryUrl: 'https://drive.google.com/drive/folders/1example-creative-studio',
      googleDriveVideoUrl: 'https://drive.google.com/file/d/1example-creative-showreel/view',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    navigationConfig: {
      enabledPages: ['/', '/case-studies', '/about', '/contact'],
      ctaButtonText: 'Initiate Project Dialogue'
    }
  };

  const requirements: ClientRequirements = {
    organizationName: 'Elena Rostova',
    category: 'portfolio',
    portfolioArchetype: 'designer',
    tagline: 'Crafting emotive digital products, expressive typography, and design systems.',
    aboutText: 'Award-winning designer with 8+ years shaping interfaces for fintech, streaming media, and avant-garde luxury brands.',
    contactEmail: 'elena@rostovastudio.design',
    contactPhone: '+46 8 555 321 00',
    primaryColor: '#f97316',
    accentColor: '#fb923c',
    typographyStyle: 'editorial',
    logoUrl: portfolioData.identity.profilePhotoUrl,
    coverImageUrl: portfolioData.identity.heroCoverUrl,
    enabledSections: { hero: true, events: false, about: true, committee: false, gallery: true, contact: true },
    events: [],
    committee: [],
    gallery: [],
    portfolioData,
    selectedTemplate: {
      templateId: 'creative_studio',
      templateVersion: '1.0.0',
      templateName: 'Creative Studio — UI/UX & Graphic Designer',
      websiteCategory: 'designer',
      selectedAt: new Date().toISOString()
    }
  };

  const website: GeneratedWebsite = {
    themeAccent: 'creative-editorial',
    layoutPreset: 'editorial',
    fontFamily: 'Clash Display, Syne, sans-serif',
    simulatedDomain: 'rostovastudio.digiverse.design',
    heroHeadline: 'Principal Product Designer & Art Director',
    heroDescription: 'Crafting emotive digital products, expressive typography, and design systems that move people.',
    heroImage: portfolioData.identity.heroCoverUrl,
    metrics: [
      { value: '8+', label: 'Years Directing' },
      { value: '38%', label: 'Avg Conversion Lift' },
      { value: '3x', label: 'Awwwards Honoree' },
      { value: '4M+', label: 'Active Users Served' }
    ],
    eventsTitle: '',
    eventsList: [],
    aboutContent: portfolioData.identity.bio || '',
    committeeTitle: '',
    committeeList: [],
    galleryTitle: '',
    galleryList: [],
    portfolioData,
    selectedTemplate: requirements.selectedTemplate
  };

  return { requirements, portfolioData, website };
};

// =========================================================================
// 3. VISION DEMO DATA (Photography & Visual Artist)
// =========================================================================
export const getVisionDemo = (): {
  requirements: ClientRequirements;
  portfolioData: PortfolioWebsiteData;
  website: GeneratedWebsite;
} => {
  const portfolioData: PortfolioWebsiteData = {
    schemaVersion: '1.0',
    archetype: 'photographer',
    professionCategory: 'photographer',
    identity: {
      fullName: 'Marcus Vance',
      title: 'Fine Art & Editorial Documentary Photographer',
      displayName: 'Marcus Vance',
      profilePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      heroCoverUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80',
      location: 'Reykjavik, Iceland & Vancouver, Canada',
      email: 'marcus@vancefineart.com',
      phone: '+354 555 8920',
      headline: 'Capturing the stillness of raw arctic frontiers, brutalist geometry, and human introspection in natural light.',
      bio: 'Renowned visual chronicler specializing in large-format analog and medium-format digital landscapes. Recipient of the International Fine Art Photography Award. Work exhibited across galleries in Tokyo, Berlin, and Zurich.',
      yearsOfExperience: 12,
      currentCompany: 'Marcus Vance Studios',
      currentRole: 'Principal Photographer',
      availabilityStatus: 'open_for_projects',
      socialLinks: {
        instagram: 'https://instagram.com/marcusvance_fineart',
        twitter: 'https://twitter.com/marcusvance'
      }
    },
    skills: [
      { id: 'v_1', name: 'Medium Format Systems (Hasselblad H6D)', category: 'Optics', proficiency: 'Expert', yearsOfExperience: 12, featured: true },
      { id: 'v_2', name: 'Natural Light Mastery', category: 'Craft', proficiency: 'Expert', yearsOfExperience: 12, featured: true },
      { id: 'v_3', name: 'Darkroom Silver Gelatin Printing', category: 'Print', proficiency: 'Expert', yearsOfExperience: 10, featured: true },
      { id: 'v_4', name: 'Capture One Color Science', category: 'Digital', proficiency: 'Expert', yearsOfExperience: 9, featured: true },
      { id: 'v_5', name: 'Expeditionary Logistics', category: 'Field', proficiency: 'Advanced', yearsOfExperience: 8, featured: false }
    ],
    projects: [
      {
        id: 'proj_v1',
        title: 'The Silent Glaciers: Icelandic Cryosphere in Transition',
        summary: 'A 4-year photographic expedition documenting the receding glacial tongues of Vatnajökull using high-fidelity medium-format optics.',
        detailedDescription: 'Curated as a 140-page cloth-bound monograph printed in Zurich with duotone stochastic screening to reproduce extreme shadow detail.',
        role: 'Expedition Lead & Photographer',
        liveUrl: 'https://vancefineart.com/series/glaciers',
        technologies: ['Hasselblad H6D-100c', 'HC 35-90mm', 'Natural Polar Light', 'Giclée Cotton Rag'],
        featuredImageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        metrics: [
          { label: 'Exhibition Visitors', value: '18,500' },
          { label: 'Limited Prints Sold', value: '75 / 75' },
          { label: 'Monograph Awards', value: 'Gold Award' }
        ],
        featured: true,
        order: 1
      },
      {
        id: 'proj_v2',
        title: 'Brutalist Monoliths: Berlin & Warsaw',
        summary: 'Architectural geometry captured strictly in overcast morning conditions to accentuate cold concrete massing and deep textural shadows.',
        role: 'Sole Artist',
        technologies: ['Leica M Monochrom', 'Summicron 28mm', 'Archival Baryta Print'],
        featuredImageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
        featured: true,
        order: 2
      },
      {
        id: 'proj_v3',
        title: 'Solitude on the Steppes: Mongolia',
        summary: 'Environmental portraits of nomadic falconers in the Altai mountains in late winter twilight.',
        role: 'Documentary Photographer',
        technologies: ['Medium Format', 'Ambient Twilight', 'Field Documentation'],
        featuredImageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
        featured: true,
        order: 3
      }
    ],
    experience: [
      {
        id: 'exp_v1',
        title: 'Independent Fine Art Photographer',
        company: 'Marcus Vance Studios',
        location: 'Reykjavik / Worldwide',
        period: '2014 - Present',
        description: 'Represented by Galerie KunstLicht (Zurich). Regular contributor to National Geographic Traveler and Condé Nast Architectural Series.',
        current: true
      }
    ],
    education: [
      {
        id: 'edu_v1',
        degree: 'B.F.A. in Fine Art Photography',
        institution: 'Emily Carr University of Art + Design',
        year: '2008 - 2012',
        honors: 'Governor General’s Medal in Visual Arts'
      }
    ],
    publications: [
      {
        id: 'pub_v1',
        title: 'Vatnajökull: A Monograph of Disappearing Light',
        publisher: 'Steidl / Vance Press',
        year: '2023',
        link: 'https://vancefineart.com/monograph',
        type: 'monograph'
      }
    ],
    media: {
      officialLogoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      officialHeroBannerUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80',
      googleDriveGalleryUrl: 'https://drive.google.com/drive/folders/1example-vision-gallery',
      googleDriveVideoUrl: 'https://drive.google.com/file/d/1example-vision-reel/view',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    navigationConfig: {
      enabledPages: ['/', '/series', '/gear', '/contact'],
      ctaButtonText: 'Acquire Archival Print'
    }
  };

  const requirements: ClientRequirements = {
    organizationName: 'Marcus Vance',
    category: 'portfolio',
    portfolioArchetype: 'photographer',
    tagline: 'Capturing the stillness of raw arctic frontiers, brutalist geometry, and human introspection.',
    aboutText: 'Renowned visual chronicler specializing in large-format analog and medium-format digital landscapes.',
    contactEmail: 'marcus@vancefineart.com',
    contactPhone: '+354 555 8920',
    primaryColor: '#e2e8f0',
    accentColor: '#94a3b8',
    typographyStyle: 'cinematic',
    logoUrl: portfolioData.identity.profilePhotoUrl,
    coverImageUrl: portfolioData.identity.heroCoverUrl,
    enabledSections: { hero: true, events: false, about: true, committee: false, gallery: true, contact: true },
    events: [],
    committee: [],
    gallery: [],
    portfolioData,
    selectedTemplate: {
      templateId: 'vision',
      templateVersion: '1.0.0',
      templateName: 'VISION — Photography & Visual Artist',
      websiteCategory: 'photographer',
      selectedAt: new Date().toISOString()
    }
  };

  const website: GeneratedWebsite = {
    themeAccent: 'vision-cinema',
    layoutPreset: 'grid',
    fontFamily: 'Playfair Display, Georgia, serif',
    simulatedDomain: 'vancefineart.digiverse.gallery',
    heroHeadline: 'Fine Art & Editorial Documentary Photographer',
    heroDescription: 'Capturing the stillness of raw arctic frontiers, brutalist geometry, and human introspection in natural light.',
    heroImage: portfolioData.identity.heroCoverUrl,
    metrics: [
      { value: '12+', label: 'Years in the Field' },
      { value: '18+', label: 'Gallery Solo Shows' },
      { value: '100MP', label: 'Medium Format Sensor' },
      { value: '75', label: 'Collector Editions' }
    ],
    eventsTitle: '',
    eventsList: [],
    aboutContent: portfolioData.identity.bio || '',
    committeeTitle: '',
    committeeList: [],
    galleryTitle: '',
    galleryList: [],
    portfolioData,
    selectedTemplate: requirements.selectedTemplate
  };

  return { requirements, portfolioData, website };
};

// =========================================================================
// 4. MOTIONVERSE DEMO DATA (Motion Graphics & 3D Artist)
// =========================================================================
export const getMotionverseDemo = (): {
  requirements: ClientRequirements;
  portfolioData: PortfolioWebsiteData;
  website: GeneratedWebsite;
} => {
  const portfolioData: PortfolioWebsiteData = {
    schemaVersion: '1.0',
    archetype: 'motion_3d',
    professionCategory: 'motion_3d',
    identity: {
      fullName: 'Kai Takahashi',
      title: '3D Generalist & Kinetic Motion Director',
      displayName: 'Kai Takahashi',
      profilePhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
      heroCoverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
      location: 'Tokyo, Japan & Los Angeles, CA',
      email: 'kai@motionverse3d.io',
      phone: '+81 3 4567 8901',
      headline: 'Pushing the boundaries of real-time computer graphics, procedural simulations, and cyberpunk title sequences.',
      bio: 'Motion director creating title sequences, commercials, and real-time interactive worlds for AAA game studios, luxury automotive brands, and electronic music artists. Fluent in Houdini procedural workflows, Octane Render, and Unreal Engine 5.',
      yearsOfExperience: 7,
      currentCompany: 'Motionverse Studio Tokyo',
      currentRole: 'Creative Director',
      availabilityStatus: 'open_for_projects',
      socialLinks: {
        youtube: 'https://youtube.com/@kai_motionverse',
        twitter: 'https://twitter.com/kai_takahashi3d'
      }
    },
    skills: [
      { id: 'm_1', name: 'Houdini (Pyro / Vellum / FLIP)', category: 'VFX', proficiency: 'Expert', yearsOfExperience: 6, featured: true },
      { id: 'm_2', name: 'Unreal Engine 5 (Lumen / Nanite)', category: 'Realtime', proficiency: 'Expert', yearsOfExperience: 5, featured: true },
      { id: 'm_3', name: 'Cinema 4D & Octane Render', category: '3D', proficiency: 'Expert', yearsOfExperience: 7, featured: true },
      { id: 'm_4', name: 'Redshift Shading', category: 'LookDev', proficiency: 'Advanced', yearsOfExperience: 6, featured: true },
      { id: 'm_5', name: 'After Effects Compositing', category: 'Comp', proficiency: 'Expert', yearsOfExperience: 7, featured: false }
    ],
    projects: [
      {
        id: 'proj_m1',
        title: 'NEO-TOKYO 2099 — Sci-Fi Title Sequence',
        summary: 'Procedurally generated dystopian metropolis with volumetric rain simulations, holograms, and dynamic camera choreography in Houdini + Octane.',
        detailedDescription: 'Rendered at 4K resolution using custom ACES color pipeline. Includes complete wireframe, clay shader, and beauty pass breakdowns.',
        role: 'Director, 3D Modeler & LookDev Artist',
        liveUrl: 'https://vimeo.com/example-neo-tokyo',
        technologies: ['Houdini', 'Octane Render', 'Cinema 4D', 'ACEScg', 'After Effects'],
        featuredImageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        metrics: [
          { label: 'Views', value: '420K' },
          { label: 'Render Hours', value: '180h' },
          { label: 'Vimeo Staff Pick', value: 'Yes' }
        ],
        featured: true,
        order: 1
      },
      {
        id: 'proj_m2',
        title: 'HyperDrive Supercar — Electric Reveal Commercial',
        summary: 'High-octane commercial spot highlighting carbon composite materials, aerodynamics vortex particles, and responsive cockpit lighting.',
        role: '3D Generalist & Animator',
        technologies: ['Unreal Engine 5', 'Substance Painter', 'Nanite', 'Lumen'],
        featuredImageUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80',
        featured: true,
        order: 2
      },
      {
        id: 'proj_m3',
        title: 'Acoustic Flora: Audio-Reactive Botanical Installation',
        summary: 'Algorithmic procedural plants vibrating to frequency bands in real-time, exhibited at Shibuya Digital Art Conclave.',
        role: 'Creative Technologist',
        technologies: ['TouchDesigner', 'Houdini VEX', 'Real-Time Shaders'],
        featuredImageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
        featured: true,
        order: 3
      }
    ],
    experience: [
      {
        id: 'exp_m1',
        title: 'Founder & Motion Director',
        company: 'Motionverse Studio Tokyo',
        location: 'Tokyo & Remote',
        period: '2020 - Present',
        description: 'Directing title sequences, procedural VFX, and commercials for international entertainment and gaming powerhouses.',
        current: true
      }
    ],
    education: [
      {
        id: 'edu_m1',
        degree: 'B.A. in Digital Media & Computer Animation',
        institution: 'Tokyo University of the Arts',
        year: '2015 - 2019'
      }
    ],
    media: {
      officialLogoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
      officialHeroBannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
      googleDriveGalleryUrl: 'https://drive.google.com/drive/folders/1example-motionverse-assets',
      googleDriveVideoUrl: 'https://drive.google.com/file/d/1example-motionverse-reel/view',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    navigationConfig: {
      enabledPages: ['/', '/breakdowns', '/clients', '/contact'],
      ctaButtonText: 'Commission Showreel Project'
    }
  };

  const requirements: ClientRequirements = {
    organizationName: 'Kai Takahashi',
    category: 'portfolio',
    portfolioArchetype: 'motion_3d',
    tagline: 'Pushing the boundaries of real-time computer graphics, procedural simulations, and title sequences.',
    aboutText: 'Motion director creating title sequences, commercials, and real-time interactive worlds for AAA game studios and luxury automotive brands.',
    contactEmail: 'kai@motionverse3d.io',
    contactPhone: '+81 3 4567 8901',
    primaryColor: '#8b5cf6',
    accentColor: '#a855f7',
    typographyStyle: 'futuristic',
    logoUrl: portfolioData.identity.profilePhotoUrl,
    coverImageUrl: portfolioData.identity.heroCoverUrl,
    enabledSections: { hero: true, events: false, about: true, committee: false, gallery: true, contact: true },
    events: [],
    committee: [],
    gallery: [],
    portfolioData,
    selectedTemplate: {
      templateId: 'motionverse',
      templateVersion: '1.0.0',
      templateName: 'MOTIONVERSE — Motion Graphics & 3D Artist',
      websiteCategory: 'motion_3d',
      selectedAt: new Date().toISOString()
    }
  };

  const website: GeneratedWebsite = {
    themeAccent: 'motionverse-violet',
    layoutPreset: 'split',
    fontFamily: 'Space Grotesk, sans-serif',
    simulatedDomain: 'kai.motionverse3d.site',
    heroHeadline: '3D Generalist & Kinetic Motion Director',
    heroDescription: 'Pushing the boundaries of real-time computer graphics, procedural simulations, and cyberpunk title sequences.',
    heroImage: portfolioData.identity.heroCoverUrl,
    metrics: [
      { value: '7+', label: 'Years in Motion' },
      { value: '4K', label: 'Native Master Specs' },
      { value: '1.2M', label: 'Showreel Plays' },
      { value: '5★', label: 'Studio Client NPS' }
    ],
    eventsTitle: '',
    eventsList: [],
    aboutContent: portfolioData.identity.bio || '',
    committeeTitle: '',
    committeeList: [],
    galleryTitle: '',
    galleryList: [],
    portfolioData,
    selectedTemplate: requirements.selectedTemplate
  };

  return { requirements, portfolioData, website };
};

// =========================================================================
// 5. ACADEMIC PRO DEMO DATA (Academic & Research Professional)
// =========================================================================
export const getAcademicProDemo = (): {
  requirements: ClientRequirements;
  portfolioData: PortfolioWebsiteData;
  website: GeneratedWebsite;
} => {
  const portfolioData: PortfolioWebsiteData = {
    schemaVersion: '1.0',
    archetype: 'academic_pro',
    professionCategory: 'academic',
    identity: {
      fullName: 'Dr. Julianne Mercer, Ph.D.',
      title: 'Associate Professor of Quantum Computing & Cryptography',
      displayName: 'Dr. Julianne Mercer',
      profilePhotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
      heroCoverUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80',
      location: 'Cambridge, MA, USA',
      email: 'j.mercer@mit.example.edu',
      phone: '+1 (617) 253-1000',
      headline: 'Advancing fault-tolerant quantum algorithms, lattice-based post-quantum cryptography, and formal security proofs.',
      bio: 'Tenured faculty researcher in theoretical computer science. Principal investigator of the Quantum Information & Security Lab. Author of over 35 peer-reviewed publications across STOC, FOCS, CRYPTO, and Nature Quantum Information. Dedicated to educating the next generation of cryptographic scientists.',
      yearsOfExperience: 14,
      currentCompany: 'Department of Electrical Engineering & Computer Science, MIT',
      currentRole: 'Associate Professor',
      availabilityStatus: 'mentoring',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/julianne-mercer-mit',
        twitter: 'https://twitter.com/dr_mercer_crypto'
      }
    },
    skills: [
      { id: 'ac_1', name: 'Post-Quantum Cryptography', category: 'Theory', proficiency: 'Expert', yearsOfExperience: 12, featured: true },
      { id: 'ac_2', name: 'Lattice-Based Cryptosystems', category: 'Algorithms', proficiency: 'Expert', yearsOfExperience: 11, featured: true },
      { id: 'ac_3', name: 'Quantum Error Correction', category: 'Quantum', proficiency: 'Expert', yearsOfExperience: 10, featured: true },
      { id: 'ac_4', name: 'Formal Proofs & Coq Verification', category: 'Logic', proficiency: 'Advanced', yearsOfExperience: 8, featured: true },
      { id: 'ac_5', name: 'Graduate Mentorship', category: 'Pedagogy', proficiency: 'Expert', yearsOfExperience: 12, featured: false }
    ],
    projects: [
      {
        id: 'proj_ac1',
        title: 'VeriCrypt-Q: Verified Post-Quantum Lattice Library',
        summary: 'Formally verified implementation of Module-LWE and Ring-LWE key encapsulation mechanisms with zero side-channel leakage proofs.',
        detailedDescription: 'Developed under an NSF CAREER award, providing mechanized security proofs in Coq against timing and power-analysis microarchitectural attacks.',
        role: 'Principal Investigator',
        liveUrl: 'https://mit.edu/lab/vericrypt-q',
        githubUrl: 'https://github.com/mit-crypto/vericrypt-q',
        technologies: ['Coq', 'C99', 'Formal Verification', 'Post-Quantum Crypto'],
        featuredImageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
        metrics: [
          { label: 'Citations', value: '480+' },
          { label: 'NSF Grant Support', value: '$650,000' },
          { label: 'Mechanized Proofs', value: '28,000 Lines' }
        ],
        featured: true,
        order: 1
      },
      {
        id: 'proj_ac2',
        title: 'Neutral-Atom Quantum Fault Tolerance Benchmarks',
        summary: 'Experimental framework evaluating threshold noise scaling across 256-qubit array architectures in collaboration with Harvard Physics.',
        role: 'Co-Principal Investigator',
        technologies: ['Quantum Computing', 'Surface Codes', 'Python', 'Qiskit'],
        featuredImageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
        featured: true,
        order: 2
      }
    ],
    experience: [
      {
        id: 'exp_ac1',
        title: 'Associate Professor (with Tenure)',
        company: 'MIT EECS',
        location: 'Cambridge, MA',
        period: '2021 - Present',
        description: 'Leading 8 doctoral researchers and 3 postdocs investigating lattice hardness and quantum circuit synthesis.',
        current: true,
        highlights: [
          'Awarded the MIT Graduate Council Teaching Award (2024)',
          'Chair of the Post-Quantum Transition Advisory Council'
        ]
      },
      {
        id: 'exp_ac2',
        title: 'Assistant Professor',
        company: 'Princeton University',
        location: 'Princeton, NJ',
        period: '2016 - 2021',
        description: 'Conducted fundamental investigations in short-vector lattice reduction and quantum oracle query complexities.',
        current: false
      }
    ],
    education: [
      {
        id: 'edu_ac1',
        degree: 'Ph.D. in Computer Science',
        institution: 'Stanford University',
        year: '2011 - 2016',
        honors: 'Arthur L. Samuel Best Doctoral Dissertation Award'
      },
      {
        id: 'edu_ac2',
        degree: 'B.S. in Mathematics with Highest Distinction',
        institution: 'Carnegie Mellon University',
        year: '2007 - 2011'
      }
    ],
    publications: [
      {
        id: 'pub_ac1',
        title: 'Sub-exponential Quantum Algorithms for Ideal Lattice Problems',
        publisher: 'Journal of the ACM (JACM), Vol. 71, Issue 4',
        year: '2025',
        link: 'https://doi.org/10.1145/3682910',
        doi: '10.1145/3682910',
        bibtex: `@article{mercer2025subexponential,
  title={Sub-exponential Quantum Algorithms for Ideal Lattice Problems},
  author={Mercer, Julianne and Vance, Kenneth},
  journal={Journal of the ACM (JACM)},
  volume={71},
  number={4},
  pages={1--42},
  year={2025},
  publisher={ACM New York, NY, USA}
}`,
        type: 'journal'
      },
      {
        id: 'pub_ac2',
        title: 'Provable Security Bounds for Next-Generation Post-Quantum Signatures',
        publisher: 'IEEE Symposium on Security and Privacy (S&P)',
        year: '2024',
        link: 'https://doi.org/10.1109/SP.2024.101',
        doi: '10.1109/SP.2024.101',
        type: 'conference'
      }
    ],
    media: {
      officialLogoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
      officialHeroBannerUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80',
      googleDriveGalleryUrl: 'https://drive.google.com/drive/folders/1example-academic-syllabi',
      googleDriveVideoUrl: 'https://drive.google.com/file/d/1example-academic-colloquium/view',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    navigationConfig: {
      enabledPages: ['/', '/publications', '/teaching', '/cv'],
      ctaButtonText: 'Download Complete Academic CV'
    }
  };

  const requirements: ClientRequirements = {
    organizationName: 'Dr. Julianne Mercer',
    category: 'portfolio',
    portfolioArchetype: 'academic_pro',
    tagline: 'Advancing fault-tolerant quantum algorithms and lattice-based post-quantum cryptography.',
    aboutText: 'Tenured faculty researcher in theoretical computer science. Principal investigator of the Quantum Information & Security Lab at MIT.',
    contactEmail: 'j.mercer@mit.example.edu',
    contactPhone: '+1 (617) 253-1000',
    primaryColor: '#1e3a8a',
    accentColor: '#60a5fa',
    typographyStyle: 'academic',
    logoUrl: portfolioData.identity.profilePhotoUrl,
    coverImageUrl: portfolioData.identity.heroCoverUrl,
    enabledSections: { hero: true, events: false, about: true, committee: false, gallery: true, contact: true },
    events: [],
    committee: [],
    gallery: [],
    portfolioData,
    selectedTemplate: {
      templateId: 'academic_pro',
      templateVersion: '1.0.0',
      templateName: 'ACADEMIC PRO — Academic & Research Professional',
      websiteCategory: 'academic',
      selectedAt: new Date().toISOString()
    }
  };

  const website: GeneratedWebsite = {
    themeAccent: 'academic-oxford',
    layoutPreset: 'editorial',
    fontFamily: 'Cinzel, Garamond, serif',
    simulatedDomain: 'mercer-lab.mit.digiverse.edu',
    heroHeadline: 'Associate Professor of Quantum Computing & Cryptography',
    heroDescription: 'Advancing fault-tolerant quantum algorithms, lattice-based post-quantum cryptography, and formal security proofs.',
    heroImage: portfolioData.identity.heroCoverUrl,
    metrics: [
      { value: '35+', label: 'Peer-Reviewed Papers' },
      { value: '2,800+', label: 'Total Citations' },
      { value: '$2.4M', label: 'Research Grants Won' },
      { value: '8', label: 'Doctoral Advisees' }
    ],
    eventsTitle: '',
    eventsList: [],
    aboutContent: portfolioData.identity.bio || '',
    committeeTitle: '',
    committeeList: [],
    galleryTitle: '',
    galleryList: [],
    portfolioData,
    selectedTemplate: requirements.selectedTemplate
  };

  return { requirements, portfolioData, website };
};

// =========================================================================
// 6. BRANDBUILDER DEMO DATA (Personal Brand & Freelancer)
// =========================================================================
export const getBrandbuilderDemo = (): {
  requirements: ClientRequirements;
  portfolioData: PortfolioWebsiteData;
  website: GeneratedWebsite;
} => {
  const portfolioData: PortfolioWebsiteData = {
    schemaVersion: '1.0',
    archetype: 'personal_brand',
    professionCategory: 'personal_brand',
    identity: {
      fullName: 'Marcus Sterling',
      title: 'B2B SaaS Growth Strategist & Executive Advisor',
      displayName: 'Marcus Sterling',
      profilePhotoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
      heroCoverUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
      location: 'Austin, Texas & New York, NY',
      email: 'marcus@sterlinggrowth.co',
      phone: '+1 (512) 800-9922',
      headline: 'Scaling B2B SaaS ventures from $1M to $25M ARR through battle-tested go-to-market systems and demand loops.',
      bio: 'Former 2x unicorn VP of Growth turned fractional advisor. Advised 45+ Series A and B enterprise SaaS leadership teams, driving over $180M in net-new enterprise pipeline. Keynote speaker and author of The SaaS Scale Playbook.',
      yearsOfExperience: 11,
      currentCompany: 'Sterling Growth Advisory',
      currentRole: 'Managing Partner',
      availabilityStatus: 'consulting',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/marcus-sterling',
        twitter: 'https://twitter.com/marcus_growth'
      }
    },
    skills: [
      { id: 'bb_1', name: 'B2B SaaS Go-To-Market Architecture', category: 'Growth', proficiency: 'Expert', yearsOfExperience: 11, featured: true },
      { id: 'bb_2', name: 'Product-Led Growth (PLG) Funnels', category: 'Conversion', proficiency: 'Expert', yearsOfExperience: 9, featured: true },
      { id: 'bb_3', name: 'Executive Revenue Mentorship', category: 'Advisory', proficiency: 'Expert', yearsOfExperience: 8, featured: true },
      { id: 'bb_4', name: 'Enterprise Pricing Calibration', category: 'Strategy', proficiency: 'Expert', yearsOfExperience: 10, featured: true },
      { id: 'bb_5', name: 'Demand Generation Flywheels', category: 'Marketing', proficiency: 'Advanced', yearsOfExperience: 9, featured: false }
    ],
    services: [
      {
        id: 'srv_1',
        title: 'GTM Strategy Sprint (8-Week Intensive)',
        description: 'Complete audit of pipeline conversion leakage, ideal customer profile (ICP) realignment, and customer onboarding restructuring.',
        price: '$18,500 One-Time',
        deliverables: [
          'Full pipeline funnel diagnostics report',
          'Updated ICP scoring and tiering matrix',
          'Turnkey sales playbook for account executives',
          'Bi-weekly executive steering sessions'
        ],
        featured: true
      },
      {
        id: 'srv_2',
        title: 'Fractional Chief Growth Officer (Retainer)',
        description: 'Dedicated strategic leadership embedded with your executive team to guide revenue operations, pricing iterations, and hiring.',
        price: '$12,500 / Month (6-Month Commitment)',
        deliverables: [
          'Weekly GTM alignment meetings',
          'Board presentation decks and metrics review',
          'Direct hiring interviews for senior marketing & sales leads',
          'On-demand Slack and asynchronous advisory'
        ],
        featured: true
      },
      {
        id: 'srv_3',
        title: 'Executive Keynote & Masterclass',
        description: 'High-impact 60-minute keynote address on modern B2B SaaS demand loops and AI-assisted sales velocity for corporate offsites.',
        price: '$10,000 + Travel',
        deliverables: ['Custom tailored deck for executive offsite', 'Post-keynote Q&A executive salon'],
        featured: false
      }
    ],
    projects: [
      {
        id: 'proj_bb1',
        title: 'CloudScale AI — 0 to $12M ARR Scaling Blueprint',
        summary: 'Redesigned outbound sales mechanics and self-serve trial onboarding, shortening sales cycle from 90 days to 28 days.',
        detailedDescription: 'Constructed an automated lead qualification engine integrating product telemetry with CRM pipelines.',
        role: 'Lead Growth Advisor',
        liveUrl: 'https://sterlinggrowth.co/case-study-cloudscale',
        technologies: ['PLG Funnel', 'Enterprise GTM', 'Revenue Architecture'],
        featuredImageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        metrics: [
          { label: 'ARR Grown', value: '$12.4M' },
          { label: 'Cycle Reduction', value: '-68%' },
          { label: 'ACV Increased', value: '+140%' }
        ],
        featured: true,
        order: 1
      },
      {
        id: 'proj_bb2',
        title: 'Hypermetrics — Series B Growth Turnaround',
        summary: 'Re-engineered pricing tiers and enterprise contracts, turning negative net revenue retention into +128% NRR.',
        role: 'Fractional CGO',
        technologies: ['Pricing Strategy', 'Enterprise Sales', 'Customer Retention'],
        featuredImageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80',
        metrics: [
          { label: 'Net Retention', value: '128%' },
          { label: 'Pipeline Added', value: '$34M' }
        ],
        featured: true,
        order: 2
      }
    ],
    experience: [
      {
        id: 'exp_bb1',
        title: 'Founder & Managing Partner',
        company: 'Sterling Growth Advisory',
        location: 'Austin, TX',
        period: '2020 - Present',
        description: 'Advising high-growth B2B venture-backed software enterprises on sustainable unit economics and sales momentum.',
        current: true
      },
      {
        id: 'exp_bb2',
        title: 'VP of Global Growth',
        company: 'DataFlow Enterprise',
        location: 'San Francisco, CA',
        period: '2016 - 2020',
        description: 'Scaled marketing and sales development team from 4 to 48 people, taking ARR from $4M to $52M through Series C.',
        current: false
      }
    ],
    testimonials: [
      {
        id: 'test_bb1',
        clientName: 'Sarah Jenkins',
        clientRole: 'CEO & Founder',
        clientCompany: 'CloudScale SaaS',
        quote: 'Marcus added $4.2M in annual recurring revenue to our pipeline in just 6 months. His frameworks are unmatched in clarity and speed of implementation.',
        rating: 5
      },
      {
        id: 'test_bb2',
        clientName: 'David Zhao',
        clientRole: 'Co-Founder & CTO',
        clientCompany: 'Hypermetrics Inc.',
        quote: 'The single best growth advisor we have ever worked with. Direct, analytical, and ruthlessly execution-oriented.',
        rating: 5
      }
    ],
    media: {
      officialLogoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
      officialHeroBannerUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
      googleDriveGalleryUrl: 'https://drive.google.com/drive/folders/1example-sterling-playbooks',
      googleDriveVideoUrl: 'https://drive.google.com/file/d/1example-sterling-keynote/view',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    navigationConfig: {
      enabledPages: ['/', '/services', '/results', '/contact'],
      ctaButtonText: 'Book Strategic Growth Advisory'
    }
  };

  const requirements: ClientRequirements = {
    organizationName: 'Marcus Sterling',
    category: 'portfolio',
    portfolioArchetype: 'personal_brand',
    tagline: 'Scaling B2B SaaS ventures from $1M to $25M ARR through battle-tested go-to-market systems.',
    aboutText: 'Former 2x unicorn VP of Growth turned fractional advisor. Advised 45+ Series A and B enterprise SaaS leadership teams, driving over $180M in net-new pipeline.',
    contactEmail: 'marcus@sterlinggrowth.co',
    contactPhone: '+1 (512) 800-9922',
    primaryColor: '#10b981',
    accentColor: '#34d399',
    typographyStyle: 'modern',
    logoUrl: portfolioData.identity.profilePhotoUrl,
    coverImageUrl: portfolioData.identity.heroCoverUrl,
    enabledSections: { hero: true, events: false, about: true, committee: false, gallery: true, contact: true },
    events: [],
    committee: [],
    gallery: [],
    portfolioData,
    selectedTemplate: {
      templateId: 'brandbuilder',
      templateVersion: '1.0.0',
      templateName: 'BRANDBUILDER — Personal Brand & Freelancer',
      websiteCategory: 'freelancer_brand',
      selectedAt: new Date().toISOString()
    }
  };

  const website: GeneratedWebsite = {
    themeAccent: 'brandbuilder-emerald',
    layoutPreset: 'split',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    simulatedDomain: 'sterlinggrowth.digiverse.co',
    heroHeadline: 'B2B SaaS Growth Strategist & Executive Advisor',
    heroDescription: 'Scaling B2B SaaS ventures from $1M to $25M ARR through battle-tested go-to-market systems and demand loops.',
    heroImage: portfolioData.identity.heroCoverUrl,
    metrics: [
      { value: '45+', label: 'SaaS Clients Scaled' },
      { value: '$180M+', label: 'Net-New Pipeline' },
      { value: '2x', label: 'Unicorn Exits' },
      { value: '65k', label: 'Newsletter Readers' }
    ],
    eventsTitle: '',
    eventsList: [],
    aboutContent: portfolioData.identity.bio || '',
    committeeTitle: '',
    committeeList: [],
    galleryTitle: '',
    galleryList: [],
    portfolioData,
    selectedTemplate: requirements.selectedTemplate
  };

  return { requirements, portfolioData, website };
};
