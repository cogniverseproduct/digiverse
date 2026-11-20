// Must stay the first import: prepares the isolated test environment before the app loads.
import { baseUrl } from './helpers/testContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { synthesizeWebsite } from '../src/services/aiGenerator.js';
import { OrganizationCategory, ClientRequirements, DriveMediaItem, YouTubeVideo } from '../src/types/index.js';

describe('Phase 5: AI Website Generation Engine & Multi-Archetype Synthesis', () => {
  let adminToken = '';
  let superAdminToken = '';

  before(async () => {
    // Authenticate Admin operator
    const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({
        email: 'admin@digiverse.internal',
        password: 'Digiverse@2026!'
      })
    });
    const adminData = await adminLogin.json();
    adminToken = adminData.token;

    // Authenticate Super Admin
    const superLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({
        email: 'superadmin@digiverse.internal',
        password: 'SuperAdmin@2026!'
      })
    });
    const superData = await superLogin.json();
    superAdminToken = superData.token;
  });

  test('should enforce authentication on generation and Admin-only design editing', async () => {
    const unauthRes = await fetch(`${baseUrl}/api/projects/proj_fake/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({})
    });
    assert.strictEqual(unauthRes.status, 401);
    await unauthRes.text();

    // Design customization is Admin-only: the Super Admin is refused before any project lookup.
    const forbidRes = await fetch(`${baseUrl}/api/projects/proj_fake/customize`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
        Connection: 'close'
      },
      body: JSON.stringify({})
    });
    assert.strictEqual(forbidRes.status, 403);
    await forbidRes.text();
  });

  test('should synthesize website for cultural society with heritage editorial layout', () => {
    const reqs: ClientRequirements = {
      organizationName: 'Kolkata Classical Music Guild',
      category: 'cultural',
      tagline: 'Preserving Centuries of Ragas and Sitar Traditions',
      aboutText: 'A dedicated society organizing annual winter music festivals and vocal academies.',
      primaryColor: '#991b1b',
      accentColor: '#d97706',
      typographyStyle: 'heritage',
      websiteLanguage: 'bilingual',
      enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true },
      events: [
        { id: '1', title: 'Winter Classical Music Festival', category: 'Classical', date: 'Dec 15, 2026', time: '6:00 PM', venue: 'Grand Auditorium' },
        { id: '2', title: 'Vocal Academy Recital', category: 'Recital', date: 'Dec 20, 2026', time: '5:00 PM', venue: 'Chamber Hall' },
        { id: '3', title: 'Sitar Masterclass', category: 'Workshop', date: 'Jan 05, 2027', time: '10:00 AM', venue: 'Studio A' }
      ],
      committee: [
        { id: 'c1', name: 'Alok Sen', role: 'President', department: 'Executive' },
        { id: 'c2', name: 'R. Banerjee', role: 'General Secretary', department: 'Executive' },
        { id: 'c3', name: 'S. Mitra', role: 'Treasurer', department: 'Finance' }
      ],
      gallery: []
    };

    const website = synthesizeWebsite(reqs);

    assert.strictEqual(website.themeAccent, 'crimson-gold');
    assert.strictEqual(website.layoutPreset, 'editorial');
    assert.ok(website.fontFamily.includes('Georgia') || website.fontFamily.includes('serif'));
    // The Cultural engine keeps its programme and committee content in `culturalData`, not in the legacy `eventsList`/`committeeList`.
    assert.ok(website.culturalData, 'cultural websites carry their own structured data');
    assert.ok(website.pages && website.pages.length >= 4);
    assert.ok(website.navigationBar?.ctaButton?.label);
    assert.strictEqual(website.simulatedDomain, 'kolkata-classical-music-guild.digiverse.site');
  });

  test('should synthesize website for puja committee with sacred amber theme and rituals', () => {
    const reqs: ClientRequirements = {
      organizationName: 'Baghbazar Sarbojanin Durgotsav',
      category: 'puja_committee',
      tagline: 'Centenary Celebrations of Sharadotsav and Traditional Pratima',
      aboutText: 'One of the oldest and most revered public Durga Puja samitis of North Kolkata.',
      primaryColor: '#c2410c',
      accentColor: '#eab308',
      typographyStyle: 'heritage',
      websiteLanguage: 'bengali',
      enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true },
      events: [
        { id: '1', title: 'মহা অষ্টমী অঞ্জলি ও পুষ্পাঞ্জলি (Maha Ashtami)', category: 'Ritual', date: 'Oct 2026', time: '10:00 AM', venue: 'Pandal' }
      ],
      committee: [
        { id: '1', name: 'Subhash Roy', role: 'Purohit & Samiti President', department: 'Ritual' }
      ],
      gallery: []
    };

    const website = synthesizeWebsite(reqs);

    assert.strictEqual(website.themeAccent, 'sunset-amber');
    assert.strictEqual(website.layoutPreset, 'editorial');
    assert.ok(website.culturalData, 'puja websites carry their own structured data');
    assert.strictEqual(website.navigationBar?.ctaButton?.label, 'View Puja Schedule');
    assert.ok(website.navigationBar?.ctaButton?.label);
  });

  test('should synthesize website for sports club with athletic neon-cyan split layout', () => {
    const reqs: ClientRequirements = {
      organizationName: 'Bengal Warriors Athletic Club',
      category: 'sports',
      tagline: 'Home of Champions and Youth Football Development',
      aboutText: 'Premier sports complex featuring FIFA-standard turf and youth coaching.',
      primaryColor: '#0284c7',
      accentColor: '#06b6d4',
      typographyStyle: 'athletic',
      websiteLanguage: 'english',
      enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true },
      events: [
        { id: '1', title: 'Youth Football League Tournament', category: 'Football', date: 'Nov 2026', time: '3:00 PM', venue: 'Main Turf' }
      ],
      committee: [
        { id: '1', name: 'P. Bose', role: 'Head Coach', department: 'Coaching' }
      ],
      gallery: []
    };

    const website = synthesizeWebsite(reqs);

    assert.strictEqual(website.themeAccent, 'neon-cyan');
    assert.strictEqual(website.layoutPreset, 'split');
    assert.ok(website.eventsList.some(e => e.category === 'Football' || e.title.includes('Tournament') || e.title.includes('League')));
    assert.ok(website.committeeList.some(c => c.role.includes('Coach') || c.role.includes('President')));
    assert.ok(website.navigationBar?.ctaButton?.label);
  });

  test('should synthesize website for health and wellness club with forest emerald theme', () => {
    const reqs: ClientRequirements = {
      organizationName: 'Prana Vedic Yoga & Wellness',
      category: 'health_wellness',
      tagline: 'Holistic Mind-Body Alignment and Restorative Healing',
      aboutText: 'A wellness sanctuary offering daily sunrise hatha yoga and sound healing.',
      primaryColor: '#059669',
      accentColor: '#14b8a6',
      typographyStyle: 'modern',
      websiteLanguage: 'english',
      enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true },
      events: [
        { id: '1', title: 'Daily Sunrise Hatha Yoga', category: 'Yoga', date: 'Daily', time: '6:00 AM', venue: 'Yoga Shala' }
      ],
      committee: [],
      gallery: []
    };

    const website = synthesizeWebsite(reqs);

    assert.strictEqual(website.themeAccent, 'clinical-trust');
    assert.strictEqual(website.layoutPreset, 'split');
    assert.ok(website.eventsList.some(e => e.category === 'Yoga' || e.title.includes('Yoga') || e.title.includes('Nutrition')));
    assert.ok(website.navigationBar?.ctaButton?.label);
  });

  test('should synthesize website for NGO with ruby theme, donor transparency and donation cause', () => {
    const reqs: ClientRequirements = {
      organizationName: 'Arogya Child Welfare Trust',
      category: 'ngo_social',
      tagline: 'Empowering Underprivileged Children Through Education and Healthcare',
      aboutText: 'Registered non-profit providing noon meals, mobile healthcare clinics, and school supplies.',
      primaryColor: '#be123c',
      accentColor: '#fb7185',
      typographyStyle: 'modern',
      websiteLanguage: 'english',
      donationsInfo: {
        title: 'Support Our Initiatives',
        description: 'Empowering children with education and healthcare',
        taxExemptStatus: '80G Tax Exempt Certified',
        accountDetails: 'Child Welfare Trust'
      },
      requiredPages: {
        home: true,
        about: true,
        events: true,
        committee: true,
        gallery: true,
        announcements: true,
        donations: true,
        contact: true
      },
      enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true },
      events: [],
      committee: [],
      gallery: []
    };

    const website = synthesizeWebsite(reqs);

    assert.strictEqual(website.themeAccent, 'impact-green');
    assert.strictEqual(website.layoutPreset, 'split');
    // The Social & NGO engine keeps donation content in `ngoData`; its call to action leads to the donate page.
    assert.ok(website.ngoData, 'NGO websites carry their own structured data');
    assert.strictEqual(website.navigationBar?.ctaButton?.href, '/donate');
    assert.ok(website.navigationBar?.ctaButton?.label);
  });

  test('should synthesize website for educational institution with royal indigo theme', () => {
    const reqs: ClientRequirements = {
      organizationName: 'Victoria Heritage Academy of Sciences',
      category: 'educational',
      tagline: 'Cultivating Scientific Curiosity and Academic Distinction',
      aboutText: 'Founded in 1965, the academy offers premier secondary and collegiate curricula.',
      primaryColor: '#3730a3',
      accentColor: '#6366f1',
      typographyStyle: 'academic',
      websiteLanguage: 'english',
      enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true },
      events: [
        { id: '1', title: 'Annual Science Conclave & Colloquium', category: 'Science', date: 'Jan 2027', time: '10:00 AM', venue: 'Hall 1' }
      ],
      committee: [
        { id: '1', name: 'Dr. A. Ray', role: 'Dean of Sciences & Research', department: 'Faculty' }
      ],
      gallery: []
    };

    const website = synthesizeWebsite(reqs);

    assert.strictEqual(website.themeAccent, 'academic-blue');
    assert.strictEqual(website.layoutPreset, 'editorial');
    assert.ok(website.eventsList.some(e => e.category === 'Science' || e.title.includes('Conclave') || e.title.includes('Colloquium')));
    assert.ok(website.committeeList.some(c => c.role.includes('Dean') || c.role.includes('Research')));
  });

  test('should synthesize website for professional association with charcoal slate theme', () => {
    const reqs: ClientRequirements = {
      organizationName: 'Chamber of Corporate Practitioners',
      category: 'professional',
      tagline: 'Ethical Leadership and Continuing Professional Excellence',
      aboutText: 'The statutory council governing accredited management and corporate advisors.',
      primaryColor: '#334155',
      accentColor: '#38bdf8',
      typographyStyle: 'civic',
      websiteLanguage: 'english',
      enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true },
      events: [],
      committee: [
        { id: '1', name: 'B. Sen', role: 'Council President', department: 'Executive' }
      ],
      gallery: []
    };

    const website = synthesizeWebsite(reqs);

    assert.strictEqual(website.themeAccent, 'corporate-blue');
    assert.strictEqual(website.layoutPreset, 'split');
    assert.ok(website.committeeList.some(c => c.role.includes('President') || c.role.includes('Secretary')));
    assert.ok(website.navigationBar?.ctaButton?.label);
  });

  test('should synthesize website for hobby club with amethyst purple theme', () => {
    const reqs: ClientRequirements = {
      organizationName: 'Cosmos Astrophotography & Stargazing Guild',
      category: 'hobby_club',
      tagline: 'Capturing the Wonders of the Deep Night Sky',
      aboutText: 'A collective of amateur and professional photographers chasing deep sky nebulas.',
      primaryColor: '#7c3aed',
      accentColor: '#c084fc',
      typographyStyle: 'modern',
      websiteLanguage: 'english',
      enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true },
      events: [
        { id: '1', title: 'Deep Sky Astrophotography Camp', category: 'Astronomy', date: 'Nov 2026', time: '8:00 PM', venue: 'Observatory Hill' }
      ],
      committee: [],
      gallery: []
    };

    const website = synthesizeWebsite(reqs);

    assert.strictEqual(website.themeAccent, 'creative-purple');
    assert.strictEqual(website.layoutPreset, 'grid');
    assert.ok(website.eventsList.some(e => e.category === 'Astronomy' || e.title.includes('Astrophotography') || e.title.includes('Photography')));
  });

  test('should synthesize website for community RWA with ocean blue theme and civic sections', () => {
    const reqs: ClientRequirements = {
      organizationName: 'Lakeview Township Resident Welfare Association',
      category: 'community',
      tagline: 'Clean Neighborhoods, 24/7 Security and Resident Solidarity',
      aboutText: 'Representing over 1,200 homeowner households in Lakeview Township.',
      primaryColor: '#0369a1',
      accentColor: '#38bdf8',
      typographyStyle: 'civic',
      websiteLanguage: 'english',
      enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true },
      events: [
        { id: '1', title: 'Annual General Meeting & Neighborhood Cleanup', category: 'Meeting', date: 'Dec 2026', time: '10:00 AM', venue: 'Community Center' }
      ],
      committee: [],
      gallery: []
    };

    const website = synthesizeWebsite(reqs);

    assert.strictEqual(website.themeAccent, 'community-blue');
    assert.strictEqual(website.layoutPreset, 'grid');
    assert.ok(website.eventsList.some(e => e.title.includes('Meeting') || e.title.includes('Cleanup') || e.title.includes('AGM')));
    assert.ok(website.navigationBar?.ctaButton?.label);
  });

  test('should prioritize user uploaded coverImageUrl over default photography', () => {
    const customCover = '/api/media/uploads/custom_banner_123.jpg';
    const reqs: ClientRequirements = {
      organizationName: 'Custom Photography Guild',
      category: 'cultural',
      coverImageUrl: customCover,
      tagline: 'Showcasing Local Art',
      aboutText: 'Art society for young artists.',
      primaryColor: '#991b1b',
      accentColor: '#d97706',
      typographyStyle: 'heritage',
      enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true },
      events: [],
      committee: [],
      gallery: []
    };

    const website = synthesizeWebsite(reqs);
    assert.strictEqual(website.heroImage, customCover);
  });

  test('keeps the hero banner separate from the Google Drive gallery (Drive images feed the gallery only)', () => {
    const reqs: ClientRequirements = {
      organizationName: 'Drive Integrated Guild',
      category: 'sports',
      tagline: 'Drive Connected Club',
      aboutText: 'Connecting Google Drive media directly.',
      primaryColor: '#0284c7',
      accentColor: '#06b6d4',
      typographyStyle: 'athletic',
      enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true },
      events: [],
      committee: [],
      gallery: []
    };

    const driveItems: DriveMediaItem[] = [
      {
        id: 'd_1',
        driveFileId: 'file_hero_drive_999',
        name: 'stadium_hero_view.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1048576,
        isApproved: true,
        sectionAssignment: 'hero',
        mediaType: 'image'
      }
    ];

    const website = synthesizeWebsite(reqs, driveItems);
    // Documented design rule in the generator: the hero banner comes only from an explicit cover image, never from Drive.
    assert.notStrictEqual(website.heroImage, '/api/media/drive/proxy/file_hero_drive_999');
    assert.ok(website.galleryPhotos.some(p => p.url === '/api/media/drive/proxy/file_hero_drive_999'), 'the Drive image is available in the gallery');
  });

  test('should execute full operational website generation via POST /api/projects/:id/generate', async () => {
    // 1. Create a project as Admin
    const createRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      },
      body: JSON.stringify({
        organizationName: `End to End Generation Org ${Date.now()}`,
        category: 'puja_committee',
        tagline: 'Full Pipeline Generation Verification',
        aboutText: 'Testing complete generation endpoint behavior.',
        primaryColor: '#c2410c',
        accentColor: '#eab308',
        typographyStyle: 'heritage',
        websiteLanguage: 'bilingual',
        events: [
          { id: '1', title: 'Grand Inauguration Ceremony', category: 'Ritual', date: 'Oct 2026', time: '10:00 AM', venue: 'Main Hall' }
        ]
      })
    });

    assert.strictEqual(createRes.status, 201);
    const created = await createRes.json();
    const projectId = created.project.id;

    // 2. Trigger generation as Admin
    const genRes = await fetch(`${baseUrl}/api/projects/${projectId}/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      }
    });

    assert.strictEqual(genRes.status, 200);
    const genData = await genRes.json();
    assert.strictEqual(genData.project.status, 'preview_ready');
    assert.ok(genData.project.generatedWebsite);
    assert.strictEqual(genData.project.generatedWebsite.themeAccent, 'sunset-amber');
    assert.ok(genData.project.generatedWebsite.culturalData, 'the generated puja website carries its structured data');
    assert.ok(genData.project.generatedWebsite.pages.length > 0);
    assert.ok(genData.project.generatedWebsite.sections.length > 0);
  });
});
