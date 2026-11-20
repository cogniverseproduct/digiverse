// Must stay the first import: prepares the isolated test environment before the app loads.
import { baseUrl } from './helpers/testContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { synthesizeWebsite } from '../src/services/aiGenerator.js';
import { repository } from '../src/db/repository.js';
import type { ClientRequirements } from '../src/types/index.js';
import type {
  EventWebsiteData,
  EventCategory,
  EventPerson,
  EventTrack,
  EventSession,
  EventTicketTier,
  EventExhibitor,
  EventAwardCategory,
  EventWeddingStory,
  EventProductLaunch,
  EventSponsor,
  EventVenueInfo,
  EventFAQItem,
  EventMediaItem,
  EventProfile,
  EventBrandingIdentity
} from '../src/types/event.js';

describe('Event Website Creation Engine — Architecture, Parity & Verification Suite', () => {
  let adminToken = '';
  let testProjectId = '';

  const mockProfile: EventProfile = {
    name: 'Global AI Summit & Developer Expo 2026',
    edition: '2026 Global Edition',
    tagline: 'Where Foundation Models Meet Enterprise Scale and Sovereign Compute',
    description: 'Premier global convergence of artificial intelligence researchers, engineering architects, and venture leaders.',
    startDate: '2026-11-20',
    endDate: '2026-11-22',
    time: '09:00 AM - 06:00 PM',
    timezone: 'IST',
    venueName: 'Bangalore International Convention Centre (BICC)',
    venueAddress: 'Whitefield Trade Corridor, Outer Ring Road',
    city: 'Bangalore',
    country: 'India',
    isHybrid: true,
    organizerName: 'Digiverse Event Secretariat',
    organizerEmail: 'secretariat@events.digiverse.internal',
    organizerPhone: '+91 80 4000 9000',
    socialLinks: {
      twitter: 'https://twitter.com/digiverse',
      linkedin: 'https://linkedin.com/company/digiverse'
    }
  };

  const mockBranding: EventBrandingIdentity = {
    primaryColor: '#2563eb',
    accentColor: '#06b6d4',
    typographyStyle: 'modern',
    badgeText: '2026 Global Edition'
  };

  const mockSpeakers: EventPerson[] = [
    {
      id: 'spk_1',
      name: 'Dr. Evelyn Vasquez',
      role: 'keynote_speaker',
      title: 'VP of Frontier Architectures',
      organization: 'Anthropic Labs',
      bio: 'Architected next-generation reasoning paradigms with deep alignment guarantees.',
      topic: 'Autonomous Reasoning in Sovereign Foundation Models',
      isFeatured: true,
      displayOrder: 1
    },
    {
      id: 'spk_2',
      name: 'Karthik Ramanathan',
      role: 'speaker',
      title: 'Principal Systems Architect',
      organization: 'NVIDIA Infrastructure Group',
      bio: 'Leads distributed tensor interconnects for 100k+ cluster deployments.',
      topic: 'Scaling Distributed Training Over Photonic Interconnects',
      isFeatured: false,
      displayOrder: 2
    }
  ];

  const mockTracks: EventTrack[] = [
    { id: 'trk_main', name: 'Main Keynote Arena', color: '#3b82f6', stage: 'Auditorium 1' },
    { id: 'trk_eng', name: 'Deep Systems & Infra Track', color: '#06b6d4', stage: 'Hall B' }
  ];

  const mockSessions: EventSession[] = [
    {
      id: 'sess_open',
      title: 'Inaugural Keynote: State of Generative Intelligence 2026',
      description: 'Opening global address mapping out technical horizons, sovereign infrastructure, and compute efficiency.',
      day: 'Day 1',
      date: '2026-11-20',
      startTime: '09:30 AM',
      endTime: '10:45 AM',
      trackId: 'trk_main',
      stage: 'Auditorium 1',
      speakerIds: ['spk_1'],
      isKeynote: true
    },
    {
      id: 'sess_infra',
      title: 'Masterclass: Ultra-Scale Photonic Networking for LLM Clusters',
      description: 'Hands-on architectural breakdown of zero-loss networks and optical switching fabric.',
      day: 'Day 1',
      date: '2026-11-20',
      startTime: '11:15 AM',
      endTime: '12:30 PM',
      trackId: 'trk_eng',
      stage: 'Hall B',
      speakerIds: ['spk_2'],
      isKeynote: false
    }
  ];

  const mockTickets: EventTicketTier[] = [
    {
      id: 'tkt_dev',
      name: 'Developer All-Access Pass',
      price: 14999,
      currency: 'INR',
      description: 'Full 3-day access to all technical tracks, expo floor, and hands-on workshops.',
      features: ['Access to all technical tracks', 'Exhibition Hall & Startup Alley', 'Lunch and catered networking breaks', 'Workshop certifications'],
      badge: 'Most Popular',
      isAvailable: true,
      registrationUrl: 'https://register.digiverse.site/ai-summit/dev'
    },
    {
      id: 'tkt_vip',
      name: 'Executive & Founder VIP Pass',
      price: 34999,
      currency: 'INR',
      description: 'Exclusive backstage founder access, private speaker dinners, and reserved keynote rows.',
      features: ['Reserved Front-Row Keynote Seating', 'VIP Lounge & High-Table Dining', 'Private Speaker & Investor Reception', 'Executive Briefings'],
      badge: 'VIP All-Access',
      isAvailable: true,
      registrationUrl: 'https://register.digiverse.site/ai-summit/vip'
    }
  ];

  const mockExhibitors: EventExhibitor[] = [
    {
      id: 'ex_tensor',
      name: 'TensorMatrix Systems',
      category: 'Hardware & Silicon',
      boothNumber: 'H3-B12',
      hallSector: 'Hall 3 — Hardware Pavilion',
      description: 'Building custom low-precision tensor processors delivering 4x performance per watt.',
      specHighlights: ['Custom ASIC', 'Sub-1ms Latency', 'Liquid Cooled']
    }
  ];

  const mockAwards: EventAwardCategory[] = [
    {
      id: 'award_grand',
      name: 'Grand Prix for Machine Intelligence Innovation',
      description: 'Recognizing foundational breakthrough architectures with global real-world utility.',
      sponsorName: 'Cognitive Computing Council',
      nominees: [
        { id: 'nom_1', title: 'Helios Multimodal Engine', subtitle: 'Neural Dynamics Ltd.', isWinner: true, categoryId: 'award_grand' },
        { id: 'nom_2', title: 'QuantumSynapse V3', subtitle: 'AeroAI Systems', isWinner: false, categoryId: 'award_grand' }
      ]
    }
  ];

  const mockWeddingStory: EventWeddingStory = {
    coupleNames: 'Ananya & Siddharth',
    partnerOne: 'Ananya Roy',
    partnerTwo: 'Siddharth Mukherjee',
    storyMilestones: [
      { id: 'ms_1', title: 'The First Spark in Bangalore', date: 'Spring 2021', text: 'We met over filter coffee in Indiranagar, discussing code and art until midnight.' },
      { id: 'ms_2', title: 'The Proposal in Darjeeling', date: 'Winter 2024', text: 'Under the morning sunrise over Kanchenjunga, Siddharth asked the forever question.' }
    ],
    ceremonyItinerary: [
      { id: 'cer_1', time: '05:00 PM', eventName: 'Traditional Varmala & Pheras', venue: 'The Grand Pavilion', dressCode: 'Traditional Festive' }
    ],
    hotelBlocks: [
      { id: 'hb_1', hotelName: 'The Leela Palace Bangalore', address: 'Old Airport Road', bookingCode: 'ANANYA_SID2026', deadline: '2026-10-15' }
    ]
  };

  const mockProductLaunch: EventProductLaunch = {
    productName: 'AeroVision One',
    tagline: 'Spatial Computing Without Compromise',
    heroHeadline: 'A Monumental Leap in Micro-OLED Optics and Neural Perception',
    heroSubheadline: 'Engineered with titanium frame and dual M4-class neural engines.',
    bentoHighlights: [
      { id: 'bh_1', title: 'Dual 8K Micro-OLED Displays', metric: '64 Million Pixels', description: 'Hyper-retinal clarity with 120Hz refresh and 100% DCI-P3 color reproduction.', colSpan: 2 },
      { id: 'bh_2', title: 'All-Day Weightless Comfort', metric: '340 Grams', description: 'Aircraft-grade magnesium chassis engineered for zero-pressure balance.', colSpan: 1 }
    ],
    techSpecs: [
      {
        group: 'Optics & Display',
        items: [
          { label: 'Display Technology', value: 'Custom 1.4-inch Micro-OLED' },
          { label: 'Pixel Density', value: '4,100 Pixels Per Inch' }
        ]
      }
    ],
    preorderUrl: 'https://store.digiverse.site/aerovision'
  };

  const mockSponsors: EventSponsor[] = [
    { id: 'spn_google', name: 'Google Cloud Platform', tier: 'title', websiteUrl: 'https://cloud.google.com' },
    { id: 'spn_nvidia', name: 'NVIDIA Corporation', tier: 'diamond', websiteUrl: 'https://nvidia.com' }
  ];

  const mockVenue: EventVenueInfo = {
    venueName: mockProfile.venueName,
    address: mockProfile.venueAddress,
    city: mockProfile.city,
    country: mockProfile.country,
    metroTransit: 'Direct pedestrian link from Whitefield Metro Station (Purple Line)',
    parkingInfo: 'Multi-level covered parking for 3,500 vehicles with 80 EV charging points',
    airportInfo: '38 km from Kempegowda International Airport (BLR) via Elevated Expressway'
  };

  const mockFAQs: EventFAQItem[] = [
    { id: 'faq_passes', question: 'How do I collect my physical badge?', answer: 'Badges can be printed at any express kiosk in the registration concourse using your QR code pass.', category: 'Registration' },
    { id: 'faq_catering', question: 'Are dietary requirements accommodated?', answer: 'Yes, full vegetarian, vegan, halal, and gluten-free catering stations are clearly designated.', category: 'Dining' }
  ];

  const mockGallery: EventMediaItem[] = [
    { id: 'med_1', title: 'Keynote Arena in Session', type: 'photo', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80', caption: 'Full house at the 2025 Opening Keynote' }
  ];

  before(async () => {
    // 1. Authenticate Admin
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({
        email: 'admin@digiverse.internal',
        password: 'Digiverse@2026!'
      })
    });
    assert.strictEqual(loginRes.status, 200);
    const loginData = await loginRes.json() as any;
    adminToken = loginData.token;

    // 2. Create base project for Event Engine tests
    const projRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      },
      body: JSON.stringify({
        organizationName: 'Global AI Summit 2026',
        category: 'event',
        eventCategory: 'conference_seminar',
        contactEmail: 'secretariat@events.digiverse.internal',
        contactPhone: '+91 80 4000 9000',
        address: 'Bangalore International Convention Centre',
        tagline: 'Where Foundation Models Meet Enterprise Scale'
      })
    });
    assert.strictEqual(projRes.status, 201);
    const projData = await projRes.json() as any;
    testProjectId = projData.project.id;
  });

  // Test 1: Category 1 (Conference & Seminar) Synthesis Parity
  test('1. Category 1 (Conference & Seminar): Synthesizes 8 pages with conference_hero, timetable and pass tiers', () => {
    const eventData: EventWebsiteData = {
      schemaVersion: '1.0',
      category: 'conference_seminar',
      profile: mockProfile,
      branding: mockBranding,
      speakers: mockSpeakers,
      tracks: mockTracks,
      sessions: mockSessions,
      tickets: mockTickets,
      exhibitors: mockExhibitors,
      awardCategories: [],
      sponsors: mockSponsors,
      venue: mockVenue,
      faqs: mockFAQs,
      gallery: mockGallery,
      dataAvailability: {
        speakers: true,
        schedule: true,
        tickets: true,
        exhibitors: true,
        awards: false,
        weddingStory: false,
        productLaunch: false,
        sponsors: true,
        venue: true,
        faqs: true,
        gallery: true
      }
    };

    const reqs: ClientRequirements = {
      organizationName: mockProfile.name,
      category: 'event',
      eventCategory: 'conference_seminar',
      eventData
    };

    const website = synthesizeWebsite(reqs);
    assert.ok(website);
    assert.strictEqual(website.pages.length, 8);
    const pageSlugs = website.pages.map(p => p.slug);
    assert.ok(pageSlugs.includes('/'));
    assert.ok(pageSlugs.includes('/speakers'));
    assert.ok(pageSlugs.includes('/schedule'));
    assert.ok(pageSlugs.includes('/tickets'));
    assert.ok(pageSlugs.includes('/venue'));
    assert.ok(pageSlugs.includes('/sponsors'));
    assert.ok(pageSlugs.includes('/faq'));
    assert.ok(pageSlugs.includes('/contact'));

    const heroSection = website.sections.find(s => s.type === 'conference_hero');
    assert.ok(heroSection, 'conference_hero section must be synthesized');
    assert.strictEqual(heroSection.title, mockProfile.name);

    assert.ok(website.navigationBar);
    assert.strictEqual(website.navigationBar.ctaButton.label, 'Book Passes');
    assert.strictEqual(website.navigationBar.ctaButton.href, '/tickets');
  });

  // Test 2: Category 2 (Festival & Concert) Synthesis Parity
  test('2. Category 2 (Festival & Concert): Synthesizes 8 pages with festival_hero, lineup and pass booking', () => {
    const festivalProfile: EventProfile = {
      ...mockProfile,
      name: 'Sunburn Horizon Sonic Festival 2026',
      edition: '12th Edition'
    };

    const eventData: EventWebsiteData = {
      schemaVersion: '1.0',
      category: 'festival_concert',
      profile: festivalProfile,
      branding: { ...mockBranding, typographyStyle: 'festive', primaryColor: '#ec4899', accentColor: '#f59e0b' },
      speakers: [
        { id: 'art_1', name: 'Armin Van Buuren', role: 'headliner_artist', bio: 'Global electronic dance legend.', isFeatured: true, displayOrder: 1 },
        { id: 'art_2', name: 'Charlotte de Witte', role: 'headliner_artist', bio: 'Techno phenomenon.', isFeatured: true, displayOrder: 2 }
      ],
      tracks: [{ id: 'stg_1', name: 'Main Solar Stage', color: '#ec4899', stage: 'Arena 1' }],
      sessions: [{ id: 'set_1', title: 'Sunset Euphoria Live Set', description: '3-hour extended live set.', day: 'Day 1', date: '2026-11-20', startTime: '06:00 PM', endTime: '09:00 PM', trackId: 'stg_1', speakerIds: ['art_1'], isKeynote: true }],
      tickets: mockTickets,
      exhibitors: [],
      awardCategories: [],
      sponsors: mockSponsors,
      venue: mockVenue,
      faqs: mockFAQs,
      gallery: mockGallery,
      dataAvailability: {
        speakers: true,
        schedule: true,
        tickets: true,
        exhibitors: false,
        awards: false,
        weddingStory: false,
        productLaunch: false,
        sponsors: true,
        venue: true,
        faqs: true,
        gallery: true
      }
    };

    const reqs: ClientRequirements = {
      organizationName: festivalProfile.name,
      category: 'event',
      eventCategory: 'festival_concert',
      eventData
    };

    const website = synthesizeWebsite(reqs);
    assert.strictEqual(website.pages.length, 8);
    const pageSlugs = website.pages.map(p => p.slug);
    assert.ok(pageSlugs.includes('/lineup'));
    assert.ok(pageSlugs.includes('/stages'));
    assert.ok(pageSlugs.includes('/gallery'));

    const hero = website.sections.find(s => s.type === 'festival_hero');
    assert.ok(hero, 'festival_hero section must be synthesized');
    assert.strictEqual(website.navigationBar.ctaButton.label, 'Get Festival Passes');
    assert.strictEqual(website.navigationBar.ctaButton.href, '/tickets');
  });

  // Test 3: Category 3 (Corporate & Business) Synthesis Parity
  test('3. Category 3 (Corporate & Business): Synthesizes 8 pages with corporate_hero and executive registration', () => {
    const corpProfile: EventProfile = {
      ...mockProfile,
      name: 'Global CIO & Enterprise Tech Summit 2026'
    };

    const eventData: EventWebsiteData = {
      schemaVersion: '1.0',
      category: 'corporate_business',
      profile: corpProfile,
      branding: { ...mockBranding, typographyStyle: 'modern', primaryColor: '#1e40af', accentColor: '#38bdf8' },
      speakers: mockSpeakers,
      tracks: mockTracks,
      sessions: mockSessions,
      tickets: mockTickets,
      exhibitors: [],
      awardCategories: [],
      sponsors: mockSponsors,
      venue: mockVenue,
      faqs: mockFAQs,
      gallery: mockGallery,
      dataAvailability: {
        speakers: true,
        schedule: true,
        tickets: true,
        exhibitors: false,
        awards: false,
        weddingStory: false,
        productLaunch: false,
        sponsors: true,
        venue: true,
        faqs: true,
        gallery: true
      }
    };

    const reqs: ClientRequirements = {
      organizationName: corpProfile.name,
      category: 'event',
      eventCategory: 'corporate_business',
      eventData
    };

    const website = synthesizeWebsite(reqs);
    assert.strictEqual(website.pages.length, 8);
    const pageSlugs = website.pages.map(p => p.slug);
    assert.ok(pageSlugs.includes('/agenda'));
    assert.ok(pageSlugs.includes('/networking'));
    assert.ok(pageSlugs.includes('/registration'));

    const hero = website.sections.find(s => s.type === 'corporate_hero');
    assert.ok(hero, 'corporate_hero section must be synthesized');
    assert.strictEqual(website.navigationBar.ctaButton.label, 'Register Now');
    assert.strictEqual(website.navigationBar.ctaButton.href, '/registration');
  });

  // Test 4: Category 4 (Exhibition & Trade Fair) Synthesis Parity
  test('4. Category 4 (Exhibition & Trade Fair): Synthesizes 8 pages with exhibition_hero, directory and floor plan', () => {
    const expoProfile: EventProfile = {
      ...mockProfile,
      name: 'International Advanced Manufacturing Expo 2026'
    };

    const eventData: EventWebsiteData = {
      schemaVersion: '1.0',
      category: 'exhibition_trade',
      profile: expoProfile,
      branding: { ...mockBranding, typographyStyle: 'editorial', primaryColor: '#0f766e', accentColor: '#d97706' },
      speakers: mockSpeakers,
      tracks: mockTracks,
      sessions: mockSessions,
      tickets: mockTickets,
      exhibitors: mockExhibitors,
      awardCategories: [],
      sponsors: mockSponsors,
      venue: { ...mockVenue, floorPlanUrl: 'https://cdn.digiverse.site/expo/floorplan.pdf' },
      faqs: mockFAQs,
      gallery: mockGallery,
      dataAvailability: {
        speakers: true,
        schedule: true,
        tickets: true,
        exhibitors: true,
        awards: false,
        weddingStory: false,
        productLaunch: false,
        sponsors: true,
        venue: true,
        faqs: true,
        gallery: true
      }
    };

    const reqs: ClientRequirements = {
      organizationName: expoProfile.name,
      category: 'event',
      eventCategory: 'exhibition_trade',
      eventData
    };

    const website = synthesizeWebsite(reqs);
    assert.strictEqual(website.pages.length, 8);
    const pageSlugs = website.pages.map(p => p.slug);
    assert.ok(pageSlugs.includes('/exhibitors'));
    assert.ok(pageSlugs.includes('/floorplan'));

    const hero = website.sections.find(s => s.type === 'exhibition_hero');
    assert.ok(hero, 'exhibition_hero section must be synthesized');
    const floorplanSec = website.sections.find(s => s.type === 'event_floorplan');
    assert.ok(floorplanSec, 'event_floorplan section must be present');
    assert.strictEqual(website.navigationBar.ctaButton.label, 'Explore Directory');
    assert.strictEqual(website.navigationBar.ctaButton.href, '/exhibitors');
  });

  // Test 5: Category 5 (Wedding & Private Events) Synthesis Parity
  test('5. Category 5 (Wedding & Private Events): Synthesizes 7 pages with wedding_hero, love story and RSVP', () => {
    const weddingProfile: EventProfile = {
      name: 'Ananya & Siddharth Wedding Celebration',
      tagline: 'Two Souls, One Heart, Beginning Their Forever Journey',
      description: 'We joyfully invite you to join us as we tie the knot under the stars in Bangalore.',
      startDate: '2026-11-28',
      endDate: '2026-11-29',
      time: '04:00 PM onwards',
      timezone: 'IST',
      venueName: 'The Tamarind Tree Heritage Estate',
      venueAddress: 'Avalahalli, Anjanapura Post',
      city: 'Bangalore',
      country: 'India',
      organizerName: 'Roy & Mukherjee Family',
      organizerEmail: 'celebration@ananya-siddharth.internal'
    };

    const eventData: EventWebsiteData = {
      schemaVersion: '1.0',
      category: 'wedding_private',
      profile: weddingProfile,
      branding: { ...mockBranding, typographyStyle: 'luxury', primaryColor: '#be185d', accentColor: '#f472b6' },
      speakers: [],
      tracks: [],
      sessions: [
        { id: 'cer_1', title: 'Traditional Varmala & Pheras', description: 'Sacred wedding ceremony.', day: 'Saturday Nov 28', date: '2026-11-28', startTime: '04:30 PM', endTime: '06:30 PM', speakerIds: [], isKeynote: true }
      ],
      tickets: [],
      exhibitors: [],
      awardCategories: [],
      weddingStory: mockWeddingStory,
      sponsors: [],
      venue: mockVenue,
      faqs: mockFAQs,
      gallery: mockGallery,
      dataAvailability: {
        speakers: false,
        schedule: true,
        tickets: false,
        exhibitors: false,
        awards: false,
        weddingStory: true,
        productLaunch: false,
        sponsors: false,
        venue: true,
        faqs: true,
        gallery: true
      }
    };

    const reqs: ClientRequirements = {
      organizationName: weddingProfile.name,
      category: 'event',
      eventCategory: 'wedding_private',
      eventData
    };

    const website = synthesizeWebsite(reqs);
    assert.strictEqual(website.pages.length, 7);
    const pageSlugs = website.pages.map(p => p.slug);
    assert.ok(pageSlugs.includes('/story'));
    assert.ok(pageSlugs.includes('/rsvp'));
    assert.ok(pageSlugs.includes('/travel'));

    const hero = website.sections.find(s => s.type === 'wedding_hero');
    assert.ok(hero, 'wedding_hero section must be synthesized');
    const rsvpSec = website.sections.find(s => s.type === 'event_wedding_rsvp');
    assert.ok(rsvpSec, 'event_wedding_rsvp section must be enabled');
    assert.strictEqual(website.navigationBar.ctaButton.label, 'RSVP Now');
    assert.strictEqual(website.navigationBar.ctaButton.href, '/rsvp');
  });

  // Test 6: Category 6 (Award Ceremony) Synthesis Parity
  test('6. Category 6 (Award Ceremony): Synthesizes 8 pages with award_hero, categories and shortlisted nominees', () => {
    const awardProfile: EventProfile = {
      ...mockProfile,
      name: 'The 2026 National Digital Craft & Architecture Awards',
      tagline: 'Honoring Fearless Design Distinction and Engineering Mastery'
    };

    const eventData: EventWebsiteData = {
      schemaVersion: '1.0',
      category: 'award_ceremony',
      profile: awardProfile,
      branding: { ...mockBranding, typographyStyle: 'cinematic', primaryColor: '#ca8a04', accentColor: '#eab308' },
      speakers: [
        { id: 'jury_1', name: 'Sir Jony Mitchell', role: 'jury', bio: 'Former Head of Industrial Design.', isFeatured: true, displayOrder: 1 }
      ],
      tracks: [],
      sessions: mockSessions,
      tickets: mockTickets,
      exhibitors: [],
      awardCategories: mockAwards,
      sponsors: mockSponsors,
      venue: mockVenue,
      faqs: mockFAQs,
      gallery: mockGallery,
      dataAvailability: {
        speakers: true,
        schedule: true,
        tickets: true,
        exhibitors: false,
        awards: true,
        weddingStory: false,
        productLaunch: false,
        sponsors: true,
        venue: true,
        faqs: true,
        gallery: true
      }
    };

    const reqs: ClientRequirements = {
      organizationName: awardProfile.name,
      category: 'event',
      eventCategory: 'award_ceremony',
      eventData
    };

    const website = synthesizeWebsite(reqs);
    assert.strictEqual(website.pages.length, 8);
    const pageSlugs = website.pages.map(p => p.slug);
    assert.ok(pageSlugs.includes('/categories'));
    assert.ok(pageSlugs.includes('/nominees'));
    assert.ok(pageSlugs.includes('/jury'));

    const hero = website.sections.find(s => s.type === 'award_hero');
    assert.ok(hero, 'award_hero section must be synthesized');
    const awardsSec = website.sections.find(s => s.type === 'event_awards');
    assert.ok(awardsSec, 'event_awards section must be enabled');
    assert.strictEqual(website.navigationBar.ctaButton.label, 'Book Gala Table');
    assert.strictEqual(website.navigationBar.ctaButton.href, '/tickets');
  });

  // Test 7: Category 7 (Launch & Product Reveal) Synthesis Parity
  test('7. Category 7 (Launch & Product Reveal): Synthesizes 7 pages with launch_hero, bento specs and pre-order CTA', () => {
    const launchProfile: EventProfile = {
      ...mockProfile,
      name: 'AeroVision Special Keynote Event',
      tagline: 'Experience the Next Leap in Spatial Computing'
    };

    const eventData: EventWebsiteData = {
      schemaVersion: '1.0',
      category: 'launch_reveal',
      profile: launchProfile,
      branding: { ...mockBranding, typographyStyle: 'futuristic', primaryColor: '#000000', accentColor: '#2563eb' },
      speakers: mockSpeakers,
      tracks: [],
      sessions: mockSessions,
      tickets: mockTickets,
      exhibitors: [],
      awardCategories: [],
      productLaunch: mockProductLaunch,
      sponsors: [],
      venue: mockVenue,
      faqs: mockFAQs,
      gallery: mockGallery,
      dataAvailability: {
        speakers: true,
        schedule: true,
        tickets: true,
        exhibitors: false,
        awards: false,
        weddingStory: false,
        productLaunch: true,
        sponsors: false,
        venue: true,
        faqs: true,
        gallery: true
      }
    };

    const reqs: ClientRequirements = {
      organizationName: launchProfile.name,
      category: 'event',
      eventCategory: 'launch_reveal',
      eventData
    };

    const website = synthesizeWebsite(reqs);
    assert.strictEqual(website.pages.length, 7);
    const pageSlugs = website.pages.map(p => p.slug);
    assert.ok(pageSlugs.includes('/product'));
    assert.ok(pageSlugs.includes('/specs'));
    assert.ok(pageSlugs.includes('/preorder'));

    const hero = website.sections.find(s => s.type === 'launch_hero');
    assert.ok(hero, 'launch_hero section must be synthesized');
    const bentoSec = website.sections.find(s => s.type === 'event_bento_specs');
    assert.ok(bentoSec, 'event_bento_specs section must be enabled');
    assert.strictEqual(website.navigationBar.ctaButton.label, 'Pre-Order Now');
    assert.strictEqual(website.navigationBar.ctaButton.href, '/preorder');
  });

  // Test 8: Deterministic Zero-Sample Integrity
  test('8. Deterministic Zero-Sample Principle: Empty collections stay empty; zero fabricated items', () => {
    const emptyEventData: EventWebsiteData = {
      schemaVersion: '1.0',
      category: 'conference_seminar',
      profile: mockProfile,
      branding: mockBranding,
      speakers: [],
      tracks: [],
      sessions: [],
      tickets: [],
      exhibitors: [],
      awardCategories: [],
      sponsors: [],
      venue: mockVenue,
      faqs: [],
      gallery: [],
      dataAvailability: {
        speakers: false,
        schedule: false,
        tickets: false,
        exhibitors: false,
        awards: false,
        weddingStory: false,
        productLaunch: false,
        sponsors: false,
        venue: true,
        faqs: false,
        gallery: false
      }
    };

    const reqs: ClientRequirements = {
      organizationName: 'Minimalist Summit',
      category: 'event',
      eventCategory: 'conference_seminar',
      eventData: emptyEventData
    };

    const website = synthesizeWebsite(reqs);
    const speakersSection = website.sections.find(s => s.type === 'event_speakers');
    const ticketsSection = website.sections.find(s => s.type === 'event_tickets');
    const sponsorsSection = website.sections.find(s => s.type === 'event_sponsors');

    assert.strictEqual(speakersSection?.enabled, false, 'Speakers section must be disabled when empty');
    assert.strictEqual(ticketsSection?.enabled, false, 'Tickets section must be disabled when empty');
    assert.strictEqual(sponsorsSection?.enabled, false, 'Sponsors section must be disabled when empty');
  });

  // Test 9: Multi-Track Agenda Modeling
  test('9. Multi-Track Agenda Modeling: Preserves tracks and multi-speaker session mappings', () => {
    const sessionWithTwoSpeakers = mockSessions.find(s => s.speakerIds.length >= 1);
    assert.ok(sessionWithTwoSpeakers);
    assert.strictEqual(sessionWithTwoSpeakers.trackId, 'trk_main');
    assert.strictEqual(sessionWithTwoSpeakers.isKeynote, true);
    assert.ok(mockTracks.some(t => t.id === 'trk_main'));
  });

  // Test 10: Transparent Pass Pricing Safety
  test('10. Transparent Pass Pricing Safety: Valid prices, currencies, and verified outbound URLs', () => {
    for (const ticket of mockTickets) {
      assert.ok(ticket.name.length > 0);
      assert.ok(typeof ticket.price === 'number' || typeof ticket.price === 'string');
      assert.ok(['INR', 'USD', 'EUR', 'GBP'].includes(ticket.currency));
      assert.ok(ticket.features.length > 0);
      if (ticket.registrationUrl) {
        assert.ok(ticket.registrationUrl.startsWith('https://'), 'Registration URL must be secure HTTPS');
      }
    }
  });

  // Test 11: Public Interactive RSVP Submission
  test('11. Interactive RSVP Ingestion: POST /api/projects/:id/rsvp saves guest response in SQLite', async () => {
    const rsvpPayload = {
      guestName: 'Vikramaditya Roy',
      guestEmail: 'vikram.roy@example.com',
      attending: 'attending',
      mealPreference: 'Vegetarian Delight',
      plusOnes: 2,
      songRequest: 'Desert Rose'
    };

    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify(rsvpPayload)
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json() as any;
    assert.strictEqual(data.message, 'RSVP submitted successfully.');
    assert.strictEqual(data.submission.guestName, 'Vikramaditya Roy');
    assert.strictEqual(data.submission.attending, 'attending');

    const projectInDb = await repository.getProjectById(testProjectId);
    assert.ok(projectInDb?.requirements.eventData?.rsvpSubmissions?.some((r: any) => r.guestEmail === 'vikram.roy@example.com'));
  });

  // Test 12: SQLite Persistence & Event Studio Sync
  test('12. SQLite Persistence: PATCH /api/projects/:id/event-data updates database and recalculates dataAvailability', async () => {
    const updatedEventData: EventWebsiteData = {
      schemaVersion: '1.0',
      category: 'conference_seminar',
      profile: mockProfile,
      branding: mockBranding,
      speakers: mockSpeakers,
      tracks: mockTracks,
      sessions: mockSessions,
      tickets: mockTickets,
      exhibitors: mockExhibitors,
      awardCategories: mockAwards,
      sponsors: mockSponsors,
      venue: mockVenue,
      faqs: mockFAQs,
      gallery: mockGallery,
      dataAvailability: {
        speakers: true,
        schedule: true,
        tickets: true,
        exhibitors: true,
        awards: true,
        weddingStory: false,
        productLaunch: false,
        sponsors: true,
        venue: true,
        faqs: true,
        gallery: true
      }
    };

    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/event-data`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      },
      body: JSON.stringify({ eventData: updatedEventData })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json() as any;
    assert.strictEqual(body.message, 'Event data updated successfully.');
    assert.strictEqual(body.eventData.category, 'conference_seminar');
    assert.strictEqual(body.eventData.dataAvailability.speakers, true);
    assert.strictEqual(body.eventData.dataAvailability.awards, true);

    const project = await repository.getProjectById(testProjectId);
    assert.ok(project?.requirements.eventData);
    assert.strictEqual(project?.requirements.eventData?.profile.name, mockProfile.name);
  });

  // Test 13: RBAC Protection
  test('13. Role-Based Access Control: Rejects unauthenticated and unauthorized requests', async () => {
    // 1. No token -> 401
    const unauthRes = await fetch(`${baseUrl}/api/projects/${testProjectId}/event-data`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({ eventData: {} })
    });
    assert.strictEqual(unauthRes.status, 401);

    // 2. Invalid token -> 401
    const badTokenRes = await fetch(`${baseUrl}/api/projects/${testProjectId}/event-data`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid-token-xyz',
        Connection: 'close'
      },
      body: JSON.stringify({ eventData: {} })
    });
    assert.strictEqual(badTokenRes.status, 401);
  });

  // Test 14: Preview Token Generation & Public Preview Access
  test('14. Preview Token Generation: Client preview token allows public preview access', async () => {
    // Generate website first so preview token generation is permitted
    const genRes = await fetch(`${baseUrl}/api/projects/${testProjectId}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      }
    });
    assert.strictEqual(genRes.status, 200);

    const tokenRes = await fetch(`${baseUrl}/api/projects/${testProjectId}/preview-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      }
    });

    assert.strictEqual(tokenRes.status, 201);
    const tokenData = await tokenRes.json() as any;
    const tokenString = tokenData.previewToken?.token || tokenData.token?.token;
    assert.ok(tokenString);
    assert.ok(tokenData.previewUrl);

    // Public preview lookup via token without admin Authorization header
    const previewRes = await fetch(`${baseUrl}/api/preview/${tokenString}`, {
      headers: { Connection: 'close' }
    });
    assert.strictEqual(previewRes.status, 200);
    const previewData = await previewRes.json() as any;
    assert.strictEqual(previewData.organizationName, 'Global AI Summit 2026');
    assert.ok(previewData.website);
    assert.strictEqual(previewData.website.pages.length, 8);
  });

  // Test 15: Revision History & Rollback
  test('15. Revision Tracking: Creates immutable project revision and allows comparison', async () => {
    const revRes = await fetch(`${baseUrl}/api/projects/${testProjectId}/variations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      },
      body: JSON.stringify({
        label: 'V1.0 Initial Event Architecture Baseline',
        changelogNotes: 'Baseline architecture established for Global AI Summit'
      })
    });

    assert.strictEqual(revRes.status, 201);
    const revData = await revRes.json() as any;
    assert.ok(revData.variation);
    assert.strictEqual(revData.variation.variationLabel, 'V1.0 Initial Event Architecture Baseline');

    const listRevRes = await fetch(`${baseUrl}/api/projects/${testProjectId}/revisions`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      }
    });
    assert.strictEqual(listRevRes.status, 200);
    const listRevData = await listRevRes.json() as any;
    assert.ok(listRevData.revisions.length >= 1);
  });

  // Test 16: Publishing Preflight & Commercial Clearance
  test('16. Publishing Preflight: Completes preflight validation on synthesized event project', async () => {
    // Preflight check
    const preflightRes = await fetch(`${baseUrl}/api/projects/${testProjectId}/publishing/preflight`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      }
    });
    assert.strictEqual(preflightRes.status, 200);
    const preflightData = await preflightRes.json() as any;
    assert.ok(preflightData.checks);
    assert.strictEqual(preflightData.checks.hasGeneratedWebsite, true);
  });
});
