// Must stay the first import: prepares the isolated test environment before the app loads.
import { baseUrl } from './helpers/testContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { synthesizeWebsite } from '../src/services/aiGenerator.js';
import { repository } from '../src/db/repository.js';
import type { ClientRequirements } from '../src/types/index.js';
import type { CulturalWebsiteData, PujaRitualScheduleItem } from '../src/types/cultural.js';

describe('Cultural Website Creation Engine — Architecture, Parity & Verification Suite', () => {
  let adminToken = '';
  let testProjectId = '';

  const mockPujaSchedule: PujaRitualScheduleItem[] = [
    {
      id: 'sch_shasthi',
      dayName: 'Maha Shasthi',
      dayNameNative: 'মহা ষষ্ঠী',
      date: 'Oct 19, 2026',
      tithiInfo: 'Shasthi Tithi begins 08:24 AM IST',
      rituals: [
        { time: '09:00 AM', name: 'Pratima Kalparambha', nameNative: 'কল্পারম্ভ', description: 'Solemn pledge ceremony' },
        { time: '06:30 PM', name: 'Bodhon & Amantran', nameNative: 'বোধন ও আমন্ত্রণ', description: 'Awakening of the Goddess', isKeyRitual: true },
        { time: '07:30 PM', name: 'Ananda Mela Stalls Open', description: 'Traditional homemade culinary festival' }
      ]
    },
    {
      id: 'sch_saptami',
      dayName: 'Maha Saptami',
      dayNameNative: 'মহা সপ্তমী',
      date: 'Oct 20, 2026',
      tithiInfo: 'Saptami Tithi ends 04:12 PM IST',
      rituals: [
        { time: '06:15 AM', name: 'Nabapatrika Snan (Kola Bou Bath)', nameNative: 'নবপত্রিকা স্নান', description: 'Procession to river ghat for sacred ablution', isKeyRitual: true },
        { time: '09:30 AM', name: 'Prana Pratishtha & Saptami Puja', description: 'Consecration of the deity' },
        { time: '11:30 AM', name: 'Pushpanjali (Batches 1 to 4)', nameNative: 'পুষ্পাঞ্জলি', description: 'Devotional floral offerings by devotees', isKeyRitual: true },
        { time: '01:00 PM', name: 'Community Maha Bhog Distribution', nameNative: 'মহাভোগ বিতরণ', description: 'Distribution of Khichuri, Labra, Payesh and Chutney', isKeyRitual: true },
        { time: '07:00 PM', name: 'Sandhya Aarti & Resonant Dhaak Rhythms', nameNative: 'সন্ধ্যা আরতি', description: 'Evening brass lamp waving with synchronized drums' }
      ]
    },
    {
      id: 'sch_ashtami',
      dayName: 'Maha Ashtami & Sandhi Puja',
      dayNameNative: 'মহাষ্টমী ও সন্ধিপূজা',
      date: 'Oct 21, 2026',
      tithiInfo: 'Sandhi Tithi: 05:08 PM - 05:56 PM IST',
      rituals: [
        { time: '09:00 AM', name: 'Maha Ashtami Vrata & Pushpanjali', nameNative: 'মহাষ্টমী পুষ্পাঞ্জলি', description: 'Most auspicious floral worship of the year', isKeyRitual: true },
        { time: '11:00 AM', name: 'Kumari Puja', nameNative: 'কুমারী পূজা', description: 'Worship of the young girl embodying Goddess Durga' },
        { time: '01:00 PM', name: 'Maha Bhog Prasadam Service', description: 'Serving 5,000+ devotees' },
        { time: '05:08 PM', name: 'Sacred Sandhi Puja & 108 Deepam', nameNative: 'সন্ধিপূজা ১০৮ দীপ', description: 'Culmination worship with 108 lotus blossoms and 108 clay lamps', isKeyRitual: true },
        { time: '07:30 PM', name: 'Dhunuchi Naach Competition', nameNative: 'ধুনুচি নাচ', description: 'Traditional incense burner dance performance' }
      ]
    },
    {
      id: 'sch_nabami',
      dayName: 'Maha Nabami',
      dayNameNative: 'মহা নবমী',
      date: 'Oct 22, 2026',
      tithiInfo: 'Nabami Tithi ends 02:40 PM IST',
      rituals: [
        { time: '09:30 AM', name: 'Maha Nabami Puja & Homa (Yajna)', nameNative: 'যজ্ঞ ও নবমী পুজো', description: 'Sacred fire oblation with bel leaves and pure ghee', isKeyRitual: true },
        { time: '11:30 AM', name: 'Pushpanjali Offering', description: 'Final general flower offering ceremony' },
        { time: '01:00 PM', name: 'Special Nabami Bhog Distribution', description: 'Prasadam feast for community members' },
        { time: '07:30 PM', name: 'Gala Classical Recital Evening', description: 'Renowned vocalists and instrumentalists perform' }
      ]
    },
    {
      id: 'sch_dashami',
      dayName: 'Vijaya Dashami',
      dayNameNative: 'বিজয়া দশমী',
      date: 'Oct 23, 2026',
      tithiInfo: 'Aparajita Puja in afternoon',
      rituals: [
        { time: '09:00 AM', name: 'Dashami Puja & Darpan Visarjan', nameNative: 'দর্পণ বিসর্জন', description: 'Reflective mirror immersion ritual concluding worship', isKeyRitual: true },
        { time: '11:00 AM', name: 'Devi Boron & Traditional Sindoor Khela', nameNative: 'দেবী বরণ ও সিঁদুর খেলা', description: 'Married women bid farewell to the Goddess with sweets and vermillion', isKeyRitual: true },
        { time: '04:30 PM', name: 'Shobhayatra (Immersion Procession)', nameNative: 'শোভাযাত্রা', description: 'Grand procession with Dhaak and Tasha to immersion ghat' },
        { time: '07:00 PM', name: 'Visarjan at River Ghat', description: 'Solemn immersion of the clay Pratima into the sacred waters' },
        { time: '08:30 PM', name: 'Shubho Bijoya Greetings & Sweet Exchange', nameNative: 'শুভ বিজয়ার মিষ্টিমুখ', description: 'Community gathering sharing Rasgulla and Sandesh' }
      ]
    }
  ];

  const mockPujaData: CulturalWebsiteData = {
    schemaVersion: '1.0',
    websiteType: 'puja_committee',
    festivalType: 'durga_puja',
    organization: {
      name: 'Sarvajanik Durgotsav & Cultural Samiti',
      nativeName: 'সার্বজনীন দুর্গোৎসব ও সাংস্কৃতিক সমিতি',
      type: 'puja_committee',
      establishedYear: 1998,
      registrationNumber: 'REG/WB/1998/4521',
      tagline: 'Celebrating 28 Years of Sacred Traditions, Pandal Craftsmanship & Communal Harmony',
      description: 'Revered Durga Puja committee celebrated for master Kumartuli idol craftsmanship, terracotta architecture replicas, and extensive charitable relief outreach.',
      history: 'Founded in 1998 by neighborhood visionaries, our committee has grown from a local devotional pandal into one of the state\'s premier heritage festivals.',
      mission: 'To preserve sacred Hindu festive rituals, empower master traditional artisans, and nurture community brotherhood.',
      headquarters: 'Samiti Grounds, Sector 4, Metro Plaza',
      city: 'Kolkata',
      state: 'West Bengal',
      country: 'India',
      contactPerson: 'Subir Mukherjee',
      contactEmail: 'contact@durgotsav-samiti.org',
      contactPhone: '+91 98300 12345',
      socialLinks: { facebook: 'https://facebook.com/durgotsav', instagram: 'https://instagram.com/durgotsav' }
    },
    branding: {
      primaryLogoUrl: 'https://cdn.digiverse.site/crests/durgotsav.png',
      coverImageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80',
      primaryColor: '#991b1b',
      accentColor: '#d97706',
      typographyStyle: 'bilingual',
      preferredTheme: 'durga-puja'
    },
    leadership: [
      {
        id: 'lead_1',
        name: 'Soumitra Chatterjee',
        nativeName: 'সৌমিত্র চট্টোপাধ্যায়',
        designation: 'President',
        roleCategory: 'executive',
        bio: 'Distinguished cultural patron overseeing annual festival operations for 18 years.',
        displayOrder: 1
      },
      {
        id: 'lead_2',
        name: 'Subir Mukherjee',
        nativeName: 'সুবীর মুখোপাধ্যায়',
        designation: 'General Secretary',
        roleCategory: 'executive',
        bio: 'Directing community outreach, pandal logistics, and volunteer deployments.',
        displayOrder: 2
      },
      {
        id: 'lead_3',
        name: 'Pandit Debesh Chakraborty',
        nativeName: 'পণ্ডিত দেবেশ চক্রবর্তী',
        designation: 'Head Purohit (Chief Priest)',
        roleCategory: 'religious',
        bio: 'Vedic scholar and ceremonial priest leading worship rites since 2004.',
        displayOrder: 3
      }
    ],
    activities: [],
    events: [
      {
        id: 'evt_anandamela',
        title: 'Anandamela Homemade Culinary Festival',
        titleNative: 'আনন্দমেলা',
        category: 'Food & Craft',
        description: 'Traditional Bengali culinary competition featuring homemade savory and sweet delicacies.',
        startDate: 'Oct 19, 2026',
        time: '07:30 PM',
        venue: 'Samiti Community Grounds Stall Complex',
        status: 'upcoming'
      },
      {
        id: 'evt_dhunuchi',
        title: 'Inter-District Dhunuchi Naach Championship',
        titleNative: 'ধুনুচি নাচ প্রতিযোগিতা',
        category: 'Folk Performing Arts',
        description: 'Spectacular rhythmic incense dance to the resonant beat of classical Dhaak drums.',
        startDate: 'Oct 21, 2026',
        time: '08:00 PM',
        venue: 'Main Temple Stage',
        status: 'upcoming'
      }
    ],
    gallery: [
      {
        id: 'gal_1',
        title: 'Pratima Darshan & Golden Ornaments',
        category: 'Pratima',
        imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
        caption: 'Traditional Ekchala clay Pratima sculpted by master artisans'
      }
    ],
    sponsors: [
      {
        id: 'sp_1',
        name: 'Bengal Heritage Tea Guild',
        tier: 'principal'
      }
    ],
    news: [
      {
        id: 'news_1',
        title: 'Maha Sharadotsav 2026 Schedule & Metro Advisory Released',
        publishedAt: 'Oct 10, 2026',
        category: 'Festival Advisory',
        summary: 'Official notification regarding special metro trains running past midnight during Puja days.',
        content: 'Devotees are requested to utilize Central Metro Station Gate 3 for direct pandal walkway access.',
        isPublished: true
      }
    ],
    pujaSchedule: mockPujaSchedule,
    pujaTheme: {
      currentThemeName: 'Aitihasik Terracotta: Bengal Heritage Shrine',
      currentThemeNameNative: 'ঐতিহাসিক পোড়ামাটির মন্দির শিল্প',
      editionYear: '2026 (28th Annual Edition)',
      themeConcept: 'Recreating Bishnupur terracotta temple architecture using sustainable river clay, bamboo and hand-pressed earthen tiles.',
      idolArtisan: 'Master Sculptor Mintu Pal (Kumartuli, Kolkata)',
      pandalArchitecture: 'Terracotta Temple Facade Replica by Shri Partha Sarathi',
      lightingConcept: 'Chandannagar Dynamic Illumination by Babu Pal',
      themeImages: [
        {
          url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
          caption: 'Terracotta Temple Facade Replica with ornate archways',
          category: 'pandal'
        }
      ]
    },
    visitorGuide: {
      pandalLocation: 'Samiti Grounds, Sector 4, Metro Plaza',
      nearestMetro: 'Central Metro Station (Gate 3) — 450 meters walk',
      nearestRailway: 'Howrah Junction — 4.2 km (Direct feeder bus available)',
      nearestBusStop: 'Sector 4 Police Station Depot',
      parkingInfo: 'Designated parking available at Metro Parkade Ground A',
      visitingHours: 'Morning: 08:00 AM - 01:00 PM | Evening: 04:30 PM - 12:30 AM',
      crowdGuidelines: [
        'Separate queues maintained for Senior Citizens & Differently-Abled Devotees (Gate 2)',
        'Strictly keep moving in Darshan queue; photography prohibited inside sanctum sanctorum',
        'Bhog coupons must be pre-collected from Treasurer counter before 11:30 AM'
      ],
      safetyAccessibility: [
        '24/7 Red Cross First Aid Camp & St. John Ambulance Station located at Gate 1',
        'Fire tender station and water mist hydrants deployed in accordance with WB Fire Services',
        'Wheelchair accessibility ramps deployed across all entry gates'
      ],
      emergencyContactPhone: '+91 98300 12345'
    },
    donationInfo: {
      campaignTitle: 'Maha Sharadotsav Utsav Seva & Bhog Distribution',
      appealMessage: 'Our festival and charitable relief drives are powered by voluntary community contributions. We maintain 100% financial transparency.',
      causes: [
        { id: 'c_bhog', title: 'Community Maha Bhog Distribution', description: 'Providing sacred prasadam to 5,000+ devotees daily.' },
        { id: 'c_cloth', title: 'Underprivileged Children Clothing Drive', description: 'Distributing new festive garments to 1,200 children.' }
      ],
      transparencyNote: 'All voluntary contributions receive official stamped receipts. We do not process unverified online card payments.',
      contactForDonations: '+91 98300 12345'
    },
    dataAvailability: {
      leadership: true,
      activities: false,
      events: true,
      gallery: true,
      sponsors: true,
      news: true,
      pujaSchedule: true,
      pujaTheme: true,
      visitorGuide: true,
      donationInfo: true,
      membership: false
    }
  };

  const mockSocietyData: CulturalWebsiteData = {
    schemaVersion: '1.0',
    websiteType: 'cultural_society',
    festivalType: 'general_festival',
    organization: {
      name: 'Bengal Cultural Society of Arts & Literature',
      nativeName: 'বঙ্গীয় সংস্কৃতি ও সাহিত্য পরিষদ',
      type: 'cultural_society',
      establishedYear: 1985,
      registrationNumber: 'SOC/CAL/1985/0842',
      tagline: 'Fostering Traditional Performing Arts, Classical Music & Literary Discourse since 1985',
      description: 'Premier non-profit cultural association promoting Indian classical vocal music, Kathak and Rabindra Nritya dance academies, and multilingual literary journals.',
      history: 'Founded four decades ago, the society has nurtured generations of performing artists and hosted celebrated national symposia.',
      mission: 'To preserve traditional cultural heritage, provide subsidized arts training, and publish archival literary works.',
      headquarters: 'Tagore Cultural Complex, Arts Quarter',
      city: 'Kolkata',
      state: 'West Bengal',
      country: 'India',
      contactPerson: 'Dr. Ananya Roy',
      contactEmail: 'secretary@bengal-culture.org',
      contactPhone: '+91 98300 98765',
      socialLinks: { facebook: 'https://facebook.com/bengalculture' }
    },
    branding: {
      primaryColor: '#1e3a8a',
      accentColor: '#d97706',
      typographyStyle: 'heritage',
      preferredTheme: 'cultural-heritage'
    },
    leadership: [
      {
        id: 'soc_lead_1',
        name: 'Dr. Ananya Roy',
        nativeName: 'অনন্যা রায়',
        designation: 'General Secretary',
        roleCategory: 'executive',
        bio: 'Renowned classical vocalist and musicologist directing society arts curricula.',
        displayOrder: 1
      }
    ],
    activities: [
      {
        id: 'act_vocal',
        title: 'Hindustani Classical Vocal Academy',
        titleNative: 'শাস্ত্রীয় সংগীত শিক্ষা',
        category: 'music',
        description: 'Comprehensive vocal training in Dhrupad, Khayal and traditional Ragas by master Gurus.',
        schedule: 'Saturdays & Sundays, 09:00 AM - 12:00 PM',
        venue: 'Auditorium Hall B',
        isUpcoming: true
      },
      {
        id: 'act_dance',
        title: 'Kathak & Classical Dance Academy',
        titleNative: 'কত্থক নৃত্য কর্মশালা',
        category: 'dance',
        description: 'Rigorous training in Jaipur and Lucknow gharana Kathak, footwork and Abhinaya.',
        schedule: 'Fridays & Sundays, 04:00 PM - 07:00 PM',
        venue: 'Studio 1 Dance Hall',
        isUpcoming: true
      }
    ],
    events: [
      {
        id: 'evt_vasant',
        title: 'Annual Basant Utsav Classical Music Festival',
        titleNative: 'বসন্ত উৎসব শাস্ত্রীয় সম্মেলন',
        category: 'Music Festival',
        description: 'Two-day all-night classical music convention featuring maestros from across India.',
        startDate: 'March 14, 2027',
        time: '06:00 PM',
        venue: 'Kalamandir Cultural Center',
        status: 'upcoming'
      }
    ],
    gallery: [
      {
        id: 'gal_soc_1',
        title: 'Annual Felicitation & Convocation Ceremony',
        category: 'Convocations',
        imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
        caption: 'Honoring senior classical masters with Lifetime Heritage Medals'
      }
    ],
    sponsors: [
      {
        id: 'sp_soc_1',
        name: 'National Performing Arts Trust',
        tier: 'principal'
      }
    ],
    news: [
      {
        id: 'news_soc_1',
        title: 'Spring Term Admissions Open for Classical Performing Arts',
        publishedAt: 'Nov 01, 2026',
        category: 'Academy Enrolment',
        summary: 'Applications invited for junior and senior vocal, sitar and dance training programmes.',
        content: 'Audition trials will be held on the first weekend of next month.',
        isPublished: true
      }
    ],
    membershipInfo: {
      enabled: true,
      membershipTypes: [
        {
          name: 'Life Patron Member',
          fee: '₹25,000 one-time',
          benefits: ['Voting rights in Annual General Assembly', 'Reserved VIP seating at all conventions', 'Quarterly literary journal subscription']
        },
        {
          name: 'Annual General Member',
          fee: '₹1,200 annually',
          benefits: ['Access to library archives', 'Discounts on masterclasses', 'Festival delegate passes']
        },
        {
          name: 'Student Performing Artist',
          fee: '₹500 annually',
          benefits: ['Subsidized tuition fees', 'Eligibility for academy scholarships']
        }
      ],
      guidelines: 'Membership applications are reviewed monthly by the Executive Committee.'
    },
    dataAvailability: {
      leadership: true,
      activities: true,
      events: true,
      gallery: true,
      sponsors: true,
      news: true,
      pujaSchedule: false,
      pujaTheme: false,
      visitorGuide: false,
      donationInfo: false,
      membership: true
    }
  };

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
    const data = await loginRes.json();
    adminToken = data.token;

    // 2. Create a test project for Cultural Engine tests
    const projRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      },
      body: JSON.stringify({
        organizationName: `Puja Samiti Test ${Date.now()}`,
        category: 'puja_committee',
        culturalArchetype: 'puja_committee',
        tagline: 'Sharadotsav Traditions and Community Harmony',
        aboutText: 'Dedicated festival organization preserving sacred rituals and artisanal excellence.',
        culturalData: mockPujaData
      })
    });
    assert.strictEqual(projRes.status, 201);
    const pData = await projRes.json();
    testProjectId = pData.project.id;
  });

  // TEST 1: Model 01 Synthesis: Cultural Society Architecture (CultureSuite / Mera Samaj Parity)
  test('Model 01: synthesizeWebsite produces complete multi-page architecture for Cultural Society', () => {
    const reqs: ClientRequirements = {
      organizationName: 'Bengal Cultural Society of Arts & Literature',
      category: 'cultural',
      culturalArchetype: 'cultural_society',
      culturalData: mockSocietyData,
      enabledSections: { hero: true, about: true, events: true, committee: true, gallery: true, contact: true }
    };

    const site = synthesizeWebsite(reqs);

    assert.ok(site);
    assert.ok(site.culturalData);
    assert.strictEqual(site.culturalData.websiteType, 'cultural_society');

    // Multi-page navigation verification
    const pageSlugs = site.pages.map(p => p.slug);
    assert.ok(pageSlugs.includes('/'), 'Includes Home route');
    assert.ok(pageSlugs.includes('/about'), 'Includes About route');
    assert.ok(pageSlugs.includes('/activities'), 'Includes Programmes route');
    assert.ok(pageSlugs.includes('/events'), 'Includes Events route');
    assert.ok(pageSlugs.includes('/committee'), 'Includes Committee route');
    assert.ok(pageSlugs.includes('/membership'), 'Includes Membership route');
    assert.ok(pageSlugs.includes('/gallery'), 'Includes Gallery route');
    assert.ok(pageSlugs.includes('/sponsors'), 'Includes Sponsors route');
    assert.ok(pageSlugs.includes('/contact'), 'Includes Contact route');

    // Section definitions
    const sectionTypes = site.sections.map(s => s.type);
    assert.ok(sectionTypes.includes('cultural_hero'), 'Includes cultural_hero section');
    assert.ok(sectionTypes.includes('cultural_story'), 'Includes cultural_story section');
    assert.ok(sectionTypes.includes('cultural_programmes'), 'Includes cultural_programmes section');
    assert.ok(sectionTypes.includes('cultural_events'), 'Includes cultural_events section');
    assert.ok(sectionTypes.includes('cultural_committee'), 'Includes cultural_committee section');
    assert.ok(sectionTypes.includes('cultural_membership'), 'Includes cultural_membership section');

    // Call to Action
    assert.strictEqual(site.navigationBar?.ctaButton.label, 'Explore Programmes');
    assert.strictEqual(site.navigationBar?.ctaButton.href, '/activities');
  });

  // TEST 2: Model 02 Synthesis: Puja Committee Architecture (Temple Hub Parity)
  test('Model 02: synthesizeWebsite produces complete multi-page architecture for Puja Committee', () => {
    const reqs: ClientRequirements = {
      organizationName: 'Sarvajanik Durgotsav & Cultural Samiti',
      category: 'puja_committee',
      culturalArchetype: 'puja_committee',
      culturalData: mockPujaData,
      enabledSections: { hero: true, about: true, events: true, committee: true, gallery: true, contact: true }
    };

    const site = synthesizeWebsite(reqs);

    assert.ok(site);
    assert.ok(site.culturalData);
    assert.strictEqual(site.culturalData.websiteType, 'puja_committee');

    // Puja Multi-page navigation verification
    const pageSlugs = site.pages.map(p => p.slug);
    assert.ok(pageSlugs.includes('/'), 'Includes Home route');
    assert.ok(pageSlugs.includes('/schedule'), 'Includes Puja Schedule route');
    assert.ok(pageSlugs.includes('/theme'), 'Includes Theme & Pratima route');
    assert.ok(pageSlugs.includes('/visitor-guide'), 'Includes Visitor Transit Guide route');
    assert.ok(pageSlugs.includes('/events'), 'Includes Celebrations route');
    assert.ok(pageSlugs.includes('/committee'), 'Includes Committee route');
    assert.ok(pageSlugs.includes('/gallery'), 'Includes Gallery route');
    assert.ok(pageSlugs.includes('/contribute'), 'Includes Donations & Bhog route');
    assert.ok(pageSlugs.includes('/sponsors'), 'Includes Sponsors route');
    assert.ok(pageSlugs.includes('/contact'), 'Includes Contact route');

    // Section definitions
    const sectionTypes = site.sections.map(s => s.type);
    assert.ok(sectionTypes.includes('puja_hero'), 'Includes puja_hero section');
    assert.ok(sectionTypes.includes('puja_theme'), 'Includes puja_theme section');
    assert.ok(sectionTypes.includes('puja_schedule'), 'Includes puja_schedule section');
    assert.ok(sectionTypes.includes('puja_programmes'), 'Includes puja_programmes section');
    assert.ok(sectionTypes.includes('puja_organizers'), 'Includes puja_organizers section');
    assert.ok(sectionTypes.includes('puja_visitor_guide'), 'Includes puja_visitor_guide section');
    assert.ok(sectionTypes.includes('puja_donations'), 'Includes puja_donations section');

    // Call to Action
    assert.strictEqual(site.navigationBar?.ctaButton.label, 'View Puja Schedule');
    assert.strictEqual(site.navigationBar?.ctaButton.href, '/schedule');
  });

  // TEST 3: 5-Day Tithi & Ritual Timetable Verification
  test('Puja Schedule: Correctly preserves 5-day Tithi timeline and ritual details', () => {
    const reqs: ClientRequirements = {
      organizationName: 'Sarvajanik Durgotsav',
      category: 'puja_committee',
      culturalData: mockPujaData
    };
    const site = synthesizeWebsite(reqs);
    const schedule = site.culturalData?.pujaSchedule;

    assert.ok(Array.isArray(schedule));
    assert.strictEqual(schedule.length, 5, 'Contains all 5 days from Shasthi to Dashami');

    // Verify Maha Ashtami Sandhi Puja details
    const ashtami = schedule.find(d => d.dayName.includes('Ashtami'));
    assert.ok(ashtami, 'Maha Ashtami exists');
    assert.ok(ashtami.dayNameNative?.includes('মহাষ্টমী'));

    const sandhiRitual = ashtami.rituals.find(r => r.name.includes('Sandhi Puja'));
    assert.ok(sandhiRitual, 'Sandhi Puja ritual present');
    assert.strictEqual(sandhiRitual.isKeyRitual, true, 'Sandhi Puja is flagged as key ritual');
    assert.ok(sandhiRitual.nameNative?.includes('সন্ধিপূজা'));

    // Verify Vijaya Dashami Sindoor Khela
    const dashami = schedule.find(d => d.dayName.includes('Dashami'));
    assert.ok(dashami, 'Vijaya Dashami exists');
    const sindoorKhela = dashami.rituals.find(r => r.name.includes('Sindoor Khela'));
    assert.ok(sindoorKhela, 'Sindoor Khela exists');
    assert.strictEqual(sindoorKhela.isKeyRitual, true);
  });

  // TEST 4: Deterministic Zero-Sample Integrity
  test('Zero-Sample Real Data Principle: Empty cultural datasets do not fabricate dates, rituals or priests', () => {
    const emptyPujaData: CulturalWebsiteData = {
      schemaVersion: '1.0',
      websiteType: 'puja_committee',
      organization: {
        name: 'Empty Puja Samiti',
        type: 'puja_committee',
        description: 'New committee forming this season.',
        headquarters: 'North Sector',
        city: 'Kolkata',
        state: 'West Bengal',
        country: 'India',
        contactPerson: 'Secretary',
        contactEmail: 'contact@empty.org',
        contactPhone: '+91 90000 00000'
      },
      branding: {
        primaryColor: '#991b1b',
        accentColor: '#d97706',
        typographyStyle: 'heritage'
      },
      leadership: [],
      activities: [],
      events: [],
      gallery: [],
      sponsors: [],
      news: [],
      pujaSchedule: [],
      dataAvailability: {
        leadership: false,
        activities: false,
        events: false,
        gallery: false,
        sponsors: false,
        news: false,
        pujaSchedule: false
      }
    };

    const site = synthesizeWebsite({
      organizationName: 'Empty Puja Samiti',
      category: 'puja_committee',
      culturalData: emptyPujaData
    });

    assert.strictEqual(site.culturalData?.pujaSchedule?.length, 0, 'Puja schedule remains empty without fabricated tithis');
    assert.strictEqual(site.culturalData?.leadership.length, 0, 'Leadership remains empty without fake committee members');
    assert.strictEqual(site.culturalData?.events.length, 0, 'Events remain empty without invented dates');

    // Section for schedule remains disabled when empty
    const scheduleSec = site.sections.find(s => s.type === 'puja_schedule');
    assert.strictEqual(scheduleSec?.enabled, false, 'puja_schedule section disabled when zero data');
  });

  // TEST 5: Kumartuli Master Idol Sculptor and Theme Tribute
  test('Theme & Artisan Tribute: Accurately attaches theme concept and master sculptor tribute', () => {
    const site = synthesizeWebsite({
      organizationName: 'Sarvajanik Durgotsav',
      category: 'puja_committee',
      culturalData: mockPujaData
    });

    const themeSec = site.sections.find(s => s.type === 'puja_theme');
    assert.ok(themeSec, 'puja_theme section exists');
    assert.strictEqual(themeSec.title, 'Aitihasik Terracotta: Bengal Heritage Shrine');
    assert.ok(themeSec.subtitle?.includes('Mintu Pal'), 'Kumartuli master artisan credited');
    assert.ok(themeSec.metadata?.pujaTheme?.pandalArchitecture?.includes('Terracotta'));
    assert.ok(themeSec.metadata?.pujaTheme?.lightingConcept?.includes('Chandannagar'));
  });

  // TEST 6: Visitor Transit and Metro Guide
  test('Visitor Guide: Correctly includes Metro Station Gate and transit coordinates', () => {
    const site = synthesizeWebsite({
      organizationName: 'Sarvajanik Durgotsav',
      category: 'puja_committee',
      culturalData: mockPujaData
    });

    const guideSec = site.sections.find(s => s.type === 'puja_visitor_guide');
    assert.ok(guideSec, 'puja_visitor_guide section exists');
    assert.ok(guideSec.metadata?.visitorGuide?.nearestMetro?.includes('Central Metro Station (Gate 3)'));
    assert.ok(guideSec.metadata?.visitorGuide?.crowdGuidelines?.length > 0);
    assert.ok(guideSec.metadata?.visitorGuide?.safetyAccessibility?.some((s: string) => s.includes('Red Cross')));
  });

  // TEST 7: Voluntary Donation Appeal & Transparency Safety
  test('Donation Integrity: Voluntary appeal provides 100% transparency note without fake payment gateways', () => {
    const site = synthesizeWebsite({
      organizationName: 'Sarvajanik Durgotsav',
      category: 'puja_committee',
      culturalData: mockPujaData
    });

    const donSec = site.sections.find(s => s.type === 'puja_donations');
    assert.ok(donSec, 'puja_donations section exists');
    assert.ok(donSec.metadata?.donationInfo?.transparencyNote?.includes('official stamped receipts'));
    assert.ok(donSec.metadata?.donationInfo?.causes?.some((c: any) => c.title.includes('Maha Bhog')));
  });

  // TEST 8: Typography Direction
  test('Typography System: Applies classical, heritage and bilingual typography styles', () => {
    // Classical
    const classicalSite = synthesizeWebsite({
      organizationName: 'Society',
      category: 'cultural',
      typographyStyle: 'classical'
    });
    assert.ok(classicalSite.themeConfig.fontFamily.includes('Cinzel'));

    // Heritage
    const heritageSite = synthesizeWebsite({
      organizationName: 'Society',
      category: 'cultural',
      typographyStyle: 'heritage'
    });
    assert.ok(heritageSite.themeConfig.fontFamily.includes('Playfair Display') || heritageSite.themeConfig.fontFamily.includes('Georgia'));

    // Bilingual
    const bilingualSite = synthesizeWebsite({
      organizationName: 'Samiti',
      category: 'puja_committee',
      typographyStyle: 'bilingual'
    });
    assert.ok(bilingualSite.themeConfig.fontFamily.includes('Tiro Bangla') || bilingualSite.themeConfig.fontFamily.includes('Cormorant'));
  });

  // TEST 9: PATCH /api/projects/:id/cultural-data updates and recalculates dataAvailability
  test('API PATCH /api/projects/:id/cultural-data persists data to SQLite and recalculates availability', async () => {
    const patchRes = await fetch(`${baseUrl}/api/projects/${testProjectId}/cultural-data`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      },
      body: JSON.stringify({ culturalData: mockPujaData })
    });

    assert.strictEqual(patchRes.status, 200);
    const body = await patchRes.json();
    assert.strictEqual(body.message, 'Cultural data updated successfully.');
    assert.ok(body.culturalData);
    assert.strictEqual(body.culturalData.dataAvailability.pujaSchedule, true);
    assert.strictEqual(body.culturalData.dataAvailability.pujaTheme, true);
    assert.strictEqual(body.culturalData.dataAvailability.visitorGuide, true);

    // Verify repository direct fetch from SQLite
    const saved = await repository.getProjectById(testProjectId);
    assert.ok(saved);
    assert.strictEqual(saved?.requirements.culturalData?.organization.name, mockPujaData.organization.name);
    assert.strictEqual(saved?.requirements.culturalData?.pujaSchedule?.length, 5);
  });

  // TEST 10: PATCH /api/projects/:id/cultural-data RBAC Protection
  test('RBAC: Non-admin unauthorized request to /api/projects/:id/cultural-data is rejected with 401/403', async () => {
    const unauthRes = await fetch(`${baseUrl}/api/projects/${testProjectId}/cultural-data`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Connection: 'close'
      },
      body: JSON.stringify({ culturalData: mockPujaData })
    });
    assert.strictEqual(unauthRes.status, 401);
    await unauthRes.text();
  });

  // TEST 11: End-to-End Website Generation via API retains cultural data
  test('API POST /api/projects/:id/generate builds complete cultural website', async () => {
    const genRes = await fetch(`${baseUrl}/api/projects/${testProjectId}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      }
    });

    assert.strictEqual(genRes.status, 200);
    const body = await genRes.json();
    assert.ok(body.project.generatedWebsite);
    assert.ok(body.project.generatedWebsite.culturalData);

    const generated = body.project.generatedWebsite;
    assert.strictEqual(generated.culturalData.websiteType, 'puja_committee');
    assert.ok(generated.pages.some((p: any) => p.slug === '/schedule'));
    assert.ok(generated.pages.some((p: any) => p.slug === '/theme'));
    assert.ok(generated.pages.some((p: any) => p.slug === '/visitor-guide'));
  });

  // TEST 12: Revisions snapshot retains culturalData
  test('Revisions: Generated revision history records culturalData in revision snapshots', async () => {
    const varRes = await fetch(`${baseUrl}/api/projects/${testProjectId}/variations`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      }
    });
    assert.strictEqual(varRes.status, 200);
    const { variations } = await varRes.json();
    assert.ok(variations && variations.length > 0);

    const latestRev = variations[variations.length - 1];
    assert.ok(latestRev.websiteData.culturalData);
    assert.strictEqual(latestRev.websiteData.culturalData?.websiteType, 'puja_committee');
    assert.strictEqual(latestRev.websiteData.culturalData?.pujaSchedule?.length, 5);
  });

  // TEST 13: Client Preview Token resolves cultural website
  test('Client Preview: Generated preview token allows external preview of cultural site', async () => {
    const tokRes = await fetch(`${baseUrl}/api/projects/${testProjectId}/preview-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      },
      body: JSON.stringify({ expiresInHours: 72 })
    });

    assert.strictEqual(tokRes.status, 201);
    const tokData = await tokRes.json();
    const tokenString = tokData.previewToken?.token || tokData.token?.token || tokData.token;

    // Access public preview
    const pubRes = await fetch(`${baseUrl}/api/preview/${tokenString}`, {
      headers: { Connection: 'close' }
    });
    assert.strictEqual(pubRes.status, 200);
    const pubData = await pubRes.json();
    assert.ok(pubData.website.culturalData);
    assert.strictEqual(pubData.website.culturalData.organization.name, mockPujaData.organization.name);
  });

  // TEST 14: Commercial Invoicing and Edge Publishing Readiness for Cultural Project
  test('Publishing: Invoicing and approval allows cultural site to pass edge publishing checks', async () => {
    // 1. Record quotation
    const quoteRes = await fetch(`${baseUrl}/api/commercial/project/${testProjectId}/quotation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      },
      body: JSON.stringify({
        quotationAmount: 50000,
        currency: 'INR',
        scopeSummary: 'Maha Sharadotsav 2026 Official Festival Portal'
      })
    });
    assert.strictEqual(quoteRes.status, 200);
    await quoteRes.text();

    // 2. Record full payment
    const payRes = await fetch(`${baseUrl}/api/commercial/project/${testProjectId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      },
      body: JSON.stringify({
        amount: 50000,
        paymentMethod: 'bank_transfer',
        transactionReference: 'TXN-CULT-99124'
      })
    });
    assert.strictEqual(payRes.status, 200);
    await payRes.text();

    // 3. Technical publishing preflight
    const preflightRes = await fetch(`${baseUrl}/api/projects/${testProjectId}/publishing/preflight`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      }
    });
    assert.strictEqual(preflightRes.status, 200);
    const preflightData = await preflightRes.json();
    assert.strictEqual(preflightData.isReadyToPublish, true);
    assert.strictEqual(preflightData.checks.hasGeneratedWebsite, true);
    assert.ok(!('hasClientApproval' in preflightData.checks), 'approval is not a publishing check');
  });

  // TEST 15: Society Membership Module Configuration
  test('Society Membership: Tier fees and benefits structure are accurately configured', () => {
    const site = synthesizeWebsite({
      organizationName: 'Bengal Cultural Society',
      category: 'cultural',
      culturalData: mockSocietyData
    });

    const memSec = site.sections.find(s => s.type === 'cultural_membership');
    assert.ok(memSec, 'cultural_membership section exists');
    assert.ok(memSec.metadata?.membershipInfo?.membershipTypes?.length === 3);

    const lifePatron = memSec.metadata?.membershipInfo?.membershipTypes?.find((m: any) => m.name.includes('Life Patron'));
    assert.ok(lifePatron);
    assert.ok(lifePatron.benefits.some((b: string) => b.includes('Voting rights')));
  });
});
