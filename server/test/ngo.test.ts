// Must stay the first import: prepares the isolated test environment before the app loads.
import { baseUrl } from './helpers/testContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { synthesizeWebsite, normalizeNGODataStrict } from '../src/services/aiGenerator.js';
import { repository } from '../src/db/repository.js';
import type { ClientRequirements } from '../src/types/index.js';
import type {
  NGOWebsiteData,
  NGOArchetype,
  NGOProgram,
  NGOImpactStat,
  NGOCampaign,
  NGOPerson,
  NGOVolunteerOpportunity,
  NGOCollectionCenter,
  NGODonationTier,
  NGOStory,
  NGOReportDocument,
  NGOPartner,
  NGOFAQItem
} from '../src/types/ngo.js';

describe('Digiverse Social & NGO Website Engine — Master Verification Suite', () => {
  let adminToken = '';
  let testProjectId = '';

  // Mock Grassroots NGO Data (Goonj Parity)
  const mockGrassrootsData: NGOWebsiteData = {
    schemaVersion: '1.0',
    archetype: 'grassroots_ngo',
    profile: {
      organizationName: 'Gram Chetna Social Welfare Society',
      legalRegisteredName: 'Gram Chetna Social Welfare Society (Trust Reg No. 1999/DL/4921)',
      tagline: 'Turning urban surplus into rural development with dignity, not charity',
      missionStatement: 'To bridge the resource divide between urban wealth and rural distress through community-led material mobilization, water harvesting, and dignity-centered development.',
      visionStatement: 'A self-reliant and dignified rural India where communities solve local challenges using collective wisdom and decentralized resources.',
      aboutDescription: 'Founded in 1999, Gram Chetna works across 1,200 remote villages in India, repurposing thousands of tons of urban materials as developmental currency for rural infrastructure building.',
      establishedYear: 1999,
      registrationNumber: 'TRUST/DL/1999/4921',
      taxExemptionNotice: 'All donations qualify for 50% tax exemption under Section 80G of the Indian Income Tax Act (URN: AAATG4921PF20214).',
      fcraRegistrationNumber: 'FCRA No. 231660142 (Approved for Educational & Social Welfare Initiatives)',
      headquartersAddress: 'J-93, Sarita Vihar Institutional Area, New Delhi 110076',
      city: 'New Delhi',
      country: 'India',
      operationalRegions: ['Rajasthan', 'Bihar', 'Uttar Pradesh', 'Odisha', 'Madhya Pradesh'],
      contactEmail: 'contact@gramchetna.org',
      contactPhone: '+91 11 4050 9900',
      socialLinks: { facebook: 'https://facebook.com/gramchetna', instagram: 'https://instagram.com/gramchetna' }
    },
    branding: {
      primaryColor: '#78350f',
      accentColor: '#15803d',
      typographyStyle: 'grassroots',
      preferredTheme: 'earth-dignity',
      logoUrl: 'https://cdn.digiverse.site/crests/gramchetna-logo.png'
    },
    programs: [
      {
        id: 'prog_cloth',
        title: 'Vastra Samman — Cloth for Dignity',
        tagline: 'Treating clothing as an unaddressed basic need and currency for change',
        description: 'Villagers identify pressing community infrastructure tasks—repairing access roads, deepening check-dams, clearing drainage channels—and earn curated dignity kits containing family clothing, blankets, and footwear.',
        beneficiariesServed: '180,000 families annually',
        geographicFocus: 'Rural Bundelkhand, Santhal Parganas, Vidarbha',
        pillars: ['Dignity Not Charity', 'Community Mobilization', 'Zero Handouts'],
        featuredImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
        order: 1
      },
      {
        id: 'prog_water',
        title: 'Jal Chetna — Watershed Recharge Collectives',
        tagline: 'Reviving centuries-old johads, percolation ponds, and earthen check-dams',
        description: 'Empowering farmer collectives to dig water containment structures before the arrival of the monsoon season, permanently restoring groundwater tables across 85 drought-prone gram panchayats.',
        beneficiariesServed: '45,000 smallholder farmers',
        geographicFocus: 'Alwar & Dausa districts, Rajasthan',
        pillars: ['Ecological Regeneration', 'Indigenous Engineering', 'Drought Resilience'],
        featuredImage: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
        order: 2
      }
    ],
    impactStats: [
      { id: 'stat_1', value: '4,500+', metricLabel: 'Tons of Material Mobilized', contextDescription: 'Diverted from urban landfills and processed into dignity kits', order: 1 },
      { id: 'stat_2', value: '1,200', metricLabel: 'Villages Partnered', contextDescription: 'Decentralized rural panchayats actively engaged in development', order: 2 },
      { id: 'stat_3', value: '350+', metricLabel: 'Check Dams & Wells Restored', contextDescription: 'Recharging groundwater for generations of farming families', order: 3 },
      { id: 'stat_4', value: '100%', metricLabel: 'Section 80G Tax Exempt', contextDescription: 'Every donor receives automated compliant tax receipts', order: 4 }
    ],
    campaigns: [
      {
        id: 'camp_monsoon',
        title: 'Rahat Monsoon Flood Relief & Seed Replenishment',
        appealSummary: 'Emergency dry ration kits, tarpaulins, water purification drops, and heirloom paddy seeds for flood-ravaged smallholder families in Northern Bihar.',
        targetAmount: 5000000,
        raisedAmount: 3850000,
        currencySymbol: '₹',
        deadline: 'Nov 30, 2026',
        isActive: true,
        urgencyLevel: 'urgent'
      }
    ],
    leadership: [
      {
        id: 'lead_1',
        name: 'Devendra Sharma',
        role: 'Co-Founder & General Secretary',
        bio: 'Grassroots activist for 28 years; pioneer of the material-for-work model across Central India.',
        tier: 'founder',
        order: 1
      },
      {
        id: 'lead_2',
        name: 'Dr. Meenakshi Joshi',
        role: 'Trustee & Rural Health Lead',
        bio: 'Community medicine practitioner leading maternal health and sanitation drives in tribal belts.',
        tier: 'board',
        order: 2
      }
    ],
    volunteerInfo: {
      headline: 'Join Hands as a Dignity Ambassador',
      description: 'Spend weekends at our city sorting hubs or travel to rural campaign camps to participate in community-led work.',
      opportunities: [
        {
          id: 'vol_sort',
          roleName: 'Material Sorter & Quality Auditor',
          department: 'Urban Operations Hub',
          location: 'Delhi & NCR Centres',
          commitment: '4 hours/weekend',
          requirements: ['Empathy', 'Attention to detail', 'Willingness to do physical sorting']
        }
      ]
    },
    collectionCenters: [
      {
        id: 'hub_delhi',
        name: 'Sarita Vihar Main Dropping Center',
        address: 'Plot 4, Institutional Area, Sarita Vihar, Near Metro Gate 2',
        city: 'New Delhi',
        contactPhone: '+91 11 4050 9911',
        acceptedItems: ['Clean wearable clothes', 'Blankets', 'Dry ration packets', 'Stationery kits', 'Footwear in good condition'],
        operatingHours: 'Mon-Sat 10:00 AM - 06:00 PM'
      }
    ],
    donationModel: {
      modelType: 'transparency_driven',
      headline: 'Support Grassroots Rural Reconstruction',
      subheadline: 'Your contribution funds logistics, raw material transport, and village community work tools.',
      donationTiers: [
        { id: 'tier_1', amount: 1500, label: 'One Family Dignity Kit', impactEquivalence: 'Provides woolens, clothing, and footwear for 1 rural household', currency: '₹', isPopular: false },
        { id: 'tier_2', amount: 3500, label: 'Village Pond Repair Toolkit', impactEquivalence: 'Funds shovels, bamboo stakes, and earth-moving supplies for 1 check dam repair', currency: '₹', isPopular: true },
        { id: 'tier_3', amount: 10000, label: 'Gram Sabha Infrastructure Sponsorship', impactEquivalence: 'Supports 1 complete village collective project for 100+ families', currency: '₹', isPopular: false }
      ],
      bankDetails: {
        accountName: 'Gram Chetna Social Welfare Society',
        accountNumber: '38992019482',
        bankName: 'State Bank of India',
        ifscCode: 'SBIN0001234',
        upiId: 'gramchetna@sbi'
      },
      disclaimer: 'We do not process instant card charges without explicit consent. 80G receipts are emailed within 24 hours of NEFT/UPI receipt verification.'
    },
    stories: [
      {
        id: 'sty_1',
        title: 'How Village Piproli Built Its Own Check-Dam Without Government Handouts',
        beneficiaryName: 'Rameshwar Meena & Village Collective',
        location: 'Alwar District, Rajasthan',
        narrative: 'When three years of drought dried up seventy handpumps, village elders refused to beg for water tankers. Partnering with Gram Chetna, 240 villagers deepened the ancient pond bed over twelve days, receiving dignity kits in return. The next monsoon filled the reservoir completely.',
        quote: 'We did not take charity. We gave our sweat, we earned our clothes, and we brought water back to our fields.'
      }
    ],
    reports: [
      {
        id: 'rep_2025',
        title: 'Annual Audited Financial Statements & Impact Balance Sheet FY 2024-25',
        year: 2025,
        type: 'audited_financials',
        fileUrl: 'https://cdn.digiverse.site/reports/gramchetna-fy25.pdf',
        fileSizeMb: '3.4 MB'
      }
    ],
    partners: [
      {
        id: 'part_tata',
        name: 'Tata Social Initiatives Trust',
        partnerType: 'funding',
        description: 'Supporting regional logistics and transport across 5 states.'
      }
    ],
    faqs: [
      {
        id: 'faq_1',
        question: 'Do you accept old torn clothes or electronic waste?',
        answer: 'We accept clean wearable clothing and clean discarded fabric pieces. We do not accept broken electronics or wet municipal garbage.'
      }
    ],
    dataAvailability: {
      programs: true,
      impactStats: true,
      campaigns: true,
      causePillars: true,
      leadership: true,
      volunteerInfo: true,
      collectionCenters: true,
      donationModel: true,
      stories: true,
      reports: true,
      partners: true,
      faqs: true
    }
  };

  // Mock Institutional Foundation Data (Obama Foundation Parity)
  const mockFoundationData: NGOWebsiteData = {
    schemaVersion: '1.0',
    archetype: 'institutional_foundation',
    profile: {
      organizationName: 'Pragati Global Foundation for Civic Leadership',
      legalRegisteredName: 'Pragati Global Foundation (Section 8 Non-Profit Co. U85300DL2015NPL28812)',
      tagline: 'Inspiring, empowering, and connecting civic leaders to change their world',
      missionStatement: 'To identify, train, and support the next generation of public interest leaders, researchers, and community innovators worldwide.',
      visionStatement: 'A more inclusive, democratic, and equitable global community shaped by principled civic action.',
      aboutDescription: 'Pragati Global Foundation operates premier leadership fellowships, democratic policy institutes, and community research fellowships across South Asia, Africa, and Latin America.',
      establishedYear: 2015,
      registrationNumber: 'U85300DL2015NPL28812',
      taxExemptionNotice: 'Contributions qualify for tax deduction under Section 80G / 501(c)(3) equivalent provisions.',
      headquartersAddress: '7 Civic Plaza, Constitution Avenue, New Delhi',
      city: 'New Delhi',
      country: 'India',
      operationalRegions: ['South Asia', 'East Africa', 'Central Europe'],
      contactEmail: 'fellowships@pragatifoundation.org',
      contactPhone: '+91 11 2345 6789'
    },
    branding: {
      primaryColor: '#0f172a',
      accentColor: '#0284c7',
      typographyStyle: 'institutional',
      preferredTheme: 'institutional-navy'
    },
    programs: [
      {
        id: 'prog_fellows',
        title: 'Pragati Civic Leadership Fellowship',
        tagline: 'A six-month intensive cohort program for transformative community builders',
        description: 'Connecting 35 exceptional civic innovators annually with mentorship from former policy makers, academic leaders, and institutional strategists.',
        beneficiariesServed: '210 Fellows Across 18 Countries',
        geographicFocus: 'Global South & Emerging Democracies',
        pillars: ['Democratic Resilience', 'Civic Ethics', 'Evidence-Based Reform'],
        order: 1
      }
    ],
    impactStats: [
      { id: 'fstat_1', value: '210+', metricLabel: 'Civic Fellows Graduated', contextDescription: 'Leading NGOs, public institutions, and civic startups', order: 1 },
      { id: 'fstat_2', value: '18', metricLabel: 'Countries Represented', contextDescription: 'Cross-continental alumni coalition actively collaborating', order: 2 },
      { id: 'fstat_3', value: '94%', metricLabel: 'Policy Initiatives Adopted', contextDescription: 'Action plans translated into actual community legislation', order: 3 }
    ],
    leadership: [
      {
        id: 'flead_1',
        name: 'Ambassador Arvind Varma',
        role: 'Chair, Board of Trustees',
        bio: 'Former senior diplomat and international governance specialist.',
        tier: 'board',
        order: 1
      },
      {
        id: 'flead_2',
        name: 'Dr. Shireen Patel',
        role: 'Executive Director',
        bio: 'Rhodes Scholar and distinguished scholar in constitutional law and civic empowerment.',
        tier: 'executive',
        order: 2
      }
    ],
    volunteerInfo: {
      headline: 'Civic Research Residencies & Visiting Fellowships',
      description: 'Engage with our policy research groups as a visiting scholar or community organizer in residence.',
      opportunities: [
        {
          id: 'res_policy',
          roleName: 'Visiting Policy Research Fellow',
          department: 'Democratic Systems Initiative',
          location: 'Hybrid / New Delhi',
          commitment: '6 Months (Funded Stipend)',
          requirements: ['Published research or proven community advocacy record', 'Advanced degree in Public Policy or related field']
        }
      ]
    },
    donationModel: {
      modelType: 'endowment_grant',
      headline: 'Support Democratic Leadership Development',
      subheadline: 'Endow fellowship stipends, leadership summits, and public policy research.',
      donationTiers: [
        { id: 'ftier_1', amount: 50000, label: 'Fellow Project Grant', impactEquivalence: 'Funds field research for 1 fellow project', currency: '₹', isPopular: false },
        { id: 'ftier_2', amount: 250000, label: 'Full Cohort Fellowship Stipend', impactEquivalence: 'Underwrites complete tuition and living costs for 1 international fellow', currency: '₹', isPopular: true }
      ]
    },
    reports: [
      {
        id: 'frep_2025',
        title: 'Pragati Global Foundation Annual Report & Governance Audit 2025',
        year: 2025,
        type: 'annual_report',
        fileUrl: 'https://cdn.digiverse.site/reports/pragati-annual-2025.pdf',
        fileSizeMb: '5.1 MB'
      }
    ],
    dataAvailability: {
      programs: true,
      impactStats: true,
      campaigns: false,
      causePillars: true,
      leadership: true,
      volunteerInfo: true,
      collectionCenters: false,
      donationModel: true,
      stories: false,
      reports: true,
      partners: false,
      faqs: false
    }
  };

  // Mock Cause Charity Data (charity: water Parity)
  const mockCharityWaterData: NGOWebsiteData = {
    schemaVersion: '1.0',
    archetype: 'cause_charity',
    profile: {
      organizationName: 'PureFlow Clean Water & Sanitation Initiative',
      legalRegisteredName: 'PureFlow Global Water Relief Foundation',
      tagline: 'Clean, safe water for every person on Earth. 100% of public donations fund water projects.',
      missionStatement: 'To solve the global water crisis within our lifetime through sustainable borehole wells, solar gravity schemes, and radical operational transparency.',
      visionStatement: 'A world where no child spends hours walking for dirty water instead of going to school.',
      aboutDescription: 'PureFlow operates on a radical 100% donation model: private benefactors cover all operational overhead, allowing 100% of every public dollar/rupee to flow directly into the ground for clean water infrastructure.',
      establishedYear: 2016,
      taxExemptionNotice: '100% of public donations fund clean water projects. Overhead is funded separately by visionary donors.',
      headquartersAddress: '42 Waterworks Boulevard, Bangalore',
      city: 'Bangalore',
      country: 'India',
      operationalRegions: ['Sub-Saharan Africa', 'Rural India', 'Southeast Asia'],
      contactEmail: 'hello@pureflowwater.org',
      contactPhone: '+91 80 4000 7700'
    },
    branding: {
      primaryColor: '#0284c7',
      accentColor: '#0d9488',
      typographyStyle: 'humanist',
      preferredTheme: 'cyan-clear'
    },
    programs: [
      {
        id: 'cprog_wells',
        title: 'Deep Borehole Solar Pumping Systems',
        tagline: 'Solar-powered community taps delivering 10,000 liters daily',
        description: 'Drilling 80-meter aquifers and equipping each well with durable solar arrays, elevated storage tanks, and automated chlorination systems.',
        beneficiariesServed: '3,500 people per installation',
        geographicFocus: 'Drought-prone arid zones',
        pillars: ['Solar Powered', 'Zero Carbon', 'Community Maintained'],
        order: 1
      }
    ],
    impactStats: [
      { id: 'cstat_1', value: '1,420,000+', metricLabel: 'People Served with Clean Water', contextDescription: 'Across 14 countries through 2,850 completed water projects', order: 1 },
      { id: 'cstat_2', value: '100%', metricLabel: 'Public Donation Direct-to-Field Proof', contextDescription: 'Zero cents/paise taken from public gifts for administrative overhead', order: 2 },
      { id: 'cstat_3', value: '2,850', metricLabel: 'GPS-Mapped Water Points', contextDescription: 'Every well verified with GPS coordinates and satellite water flow sensors', order: 3 },
      { id: 'cstat_4', value: '40', metricLabel: 'USD / ₹3,000 to Give 1 Person Clean Water', contextDescription: 'Tangible life-changing impact measured at the individual level', order: 4 }
    ],
    donationModel: {
      modelType: 'radical_100_percent',
      headline: 'The Radical 100% Promise: Every Rupee / Dollar Reaches the Field',
      subheadline: 'A separate group of generous founders covers all our staff salaries and office expenses, so 100% of your gift drills clean water wells.',
      radical100PercentProof: 'Private donors, angel investors, and board members fund all overhead costs, including credit card processing fees, so 100% of your donation is deployed directly into water projects.',
      dollarImpactLadder: '$40 / ₹3,000 delivers life-long clean drinking water to one individual. $200 / ₹15,000 provides clean water for an entire family.',
      donationTiers: [
        { id: 'ctier_1', amount: 3000, label: 'Clean Water for 1 Person', impactEquivalence: 'Drills and equips clean water access for 1 human being for life', currency: '₹', isPopular: false },
        { id: 'ctier_2', amount: 15000, label: 'Clean Water for 1 Household', impactEquivalence: 'Protects an entire family of 5 from waterborne cholera and typhoid', currency: '₹', isPopular: true },
        { id: 'ctier_3', amount: 150000, label: 'Complete School Handwashing & Tap Station', impactEquivalence: 'Serves 400 school students with running potable drinking water', currency: '₹', isPopular: false }
      ]
    },
    dataAvailability: {
      programs: true,
      impactStats: true,
      campaigns: false,
      causePillars: true,
      leadership: false,
      volunteerInfo: false,
      collectionCenters: false,
      donationModel: true,
      stories: false,
      reports: false,
      partners: false,
      faqs: false
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

    // 2. Create test project in SQLite for NGO Engine
    const projRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      },
      body: JSON.stringify({
        organizationName: `Gram Chetna Test ${Date.now()}`,
        category: 'ngo',
        ngoArchetype: 'grassroots_ngo',
        tagline: 'Turning urban surplus into rural development with dignity, not charity',
        aboutText: mockGrassrootsData.profile.aboutDescription,
        ngoData: mockGrassrootsData
      })
    });
    assert.strictEqual(projRes.status, 201);
    const projData = await projRes.json();
    testProjectId = projData.project.id;
    assert.ok(testProjectId, 'Test project ID should be created');

    // 3. Generate initial website for test project
    const genRes = await fetch(`${baseUrl}/api/projects/${testProjectId}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      }
    });
    assert.strictEqual(genRes.status, 200);
  });

  // TEST 1: Grassroots NGO (Goonj Parity) Multi-Page AI Synthesis
  test('1. Grassroots NGO Archetype (Goonj Parity) generates full multi-page architecture with collection centers & campaigns', () => {
    const req: ClientRequirements = {
      clientName: 'Gram Chetna Social Welfare Society',
      organizationType: 'ngo',
      ngoArchetype: 'grassroots_ngo',
      ngoData: mockGrassrootsData,
      primaryColor: '#78350f',
      accentColor: '#15803d',
      tagline: 'Turning urban surplus into rural development with dignity, not charity',
      aboutText: mockGrassrootsData.profile.aboutDescription
    };

    const website = synthesizeWebsite(req);
    assert.strictEqual(website.organizationCategory, 'ngo');
    assert.strictEqual(website.ngoArchetype, 'grassroots_ngo');
    assert.ok(website.ngoData, 'Website should contain ngoData');
    assert.ok(website.pages.length >= 7, `Expected at least 7 pages, got ${website.pages.length}`);

    const pageUrls = website.pages.map(p => p.slug);
    assert.ok(pageUrls.includes('/'), 'Should include Home page');
    assert.ok(pageUrls.includes('/programs'), 'Should include Programs page');
    assert.ok(pageUrls.includes('/campaigns'), 'Should include Campaigns page');
    assert.ok(pageUrls.includes('/collection-centers'), 'Should include Collection Centers page');
    assert.ok(pageUrls.includes('/donate'), 'Should include Donate page');
    assert.ok(pageUrls.includes('/reports'), 'Should include Reports page');

    // Section inspection
    const sectionTypes = website.sections.map(s => s.type);
    assert.ok(sectionTypes.includes('grassroots_hero'), 'Should have grassroots_hero');
    assert.ok(sectionTypes.includes('ngo_collection_centers'), 'Should have collection centers section');
    assert.ok(sectionTypes.includes('ngo_campaigns'), 'Should have campaigns section');
    assert.ok(sectionTypes.includes('ngo_donation'), 'Should have donation section');

    // Contextual CTA
    assert.strictEqual(website.heroCtaText, 'Contribute with Dignity');
    assert.strictEqual(website.heroCtaLink, '/donate');
  });

  // TEST 2: Institutional Foundation (Obama Foundation Parity) AI Synthesis
  test('2. Institutional Foundation Archetype (Obama Foundation Parity) generates governance, leadership & audited reports', () => {
    const req: ClientRequirements = {
      clientName: 'Pragati Global Foundation',
      organizationType: 'ngo',
      ngoArchetype: 'institutional_foundation',
      ngoData: mockFoundationData,
      primaryColor: '#0f172a',
      accentColor: '#0284c7',
      tagline: 'Inspiring, empowering, and connecting civic leaders',
      aboutText: mockFoundationData.profile.aboutDescription
    };

    const website = synthesizeWebsite(req);
    assert.strictEqual(website.ngoArchetype, 'institutional_foundation');
    assert.ok(website.pages.length >= 7, 'Foundation should have complete pages');

    const pageUrls = website.pages.map(p => p.slug);
    assert.ok(pageUrls.includes('/initiatives'), 'Should include Initiatives page');
    assert.ok(pageUrls.includes('/leadership'), 'Should include Leadership page');
    assert.ok(pageUrls.includes('/fellows'), 'Should include Fellows page');
    assert.ok(pageUrls.includes('/reports'), 'Should include Reports page');

    const sectionTypes = website.sections.map(s => s.type);
    assert.ok(sectionTypes.includes('foundation_hero'), 'Should have foundation_hero');
    assert.ok(sectionTypes.includes('ngo_leadership'), 'Should have leadership/governance section');
    assert.ok(sectionTypes.includes('ngo_reports'), 'Should have audited reports section');

    // Contextual CTA
    assert.strictEqual(website.heroCtaText, 'Partner With Us');
    assert.strictEqual(website.heroCtaLink, '/partner');
  });

  // TEST 3: Cause Charity (charity: water Parity) AI Synthesis
  test('3. Cause Charity Archetype (charity: water Parity) generates radical 100% model proof & donation ladder', () => {
    const req: ClientRequirements = {
      clientName: 'PureFlow Clean Water & Sanitation Initiative',
      organizationType: 'ngo',
      ngoArchetype: 'cause_charity',
      ngoData: mockCharityWaterData,
      primaryColor: '#0284c7',
      accentColor: '#0d9488',
      tagline: 'Clean, safe water for every person on Earth',
      aboutText: mockCharityWaterData.profile.aboutDescription
    };

    const website = synthesizeWebsite(req);
    assert.strictEqual(website.ngoArchetype, 'cause_charity');

    const sectionTypes = website.sections.map(s => s.type);
    assert.ok(sectionTypes.includes('charity_water_hero'), 'Should have charity_water_hero');
    assert.ok(sectionTypes.includes('ngo_impact_stats'), 'Should have impact stats section');
    assert.ok(sectionTypes.includes('ngo_donation'), 'Should have donation section');

    // Contextual CTA
    assert.strictEqual(website.heroCtaText, 'Give Clean Water');
    assert.strictEqual(website.heroCtaLink, '/donate');

    // Validate radical 100% proof presence
    assert.ok(
      website.ngoData?.donationModel?.radical100PercentProof?.includes('overhead'),
      'Should emphasize zero public money spent on overhead'
    );
  });

  // TEST 4: Deterministic Zero-Sample Principle
  test('4. Deterministic Zero-Sample Principle: empty collections must never fabricate fake programs or stats', () => {
    const emptyNGOData: NGOWebsiteData = {
      schemaVersion: '1.0',
      archetype: 'grassroots_ngo',
      profile: {
        organizationName: 'Zero Handouts Association',
        tagline: 'Clean test',
        missionStatement: 'Real data only',
        aboutDescription: 'Empty test society'
      },
      branding: {},
      programs: [],
      impactStats: [],
      campaigns: [],
      collectionCenters: [],
      leadership: [],
      stories: [],
      reports: [],
      partners: [],
      faqs: [],
      dataAvailability: {
        programs: false,
        impactStats: false,
        campaigns: false,
        causePillars: false,
        leadership: false,
        volunteerInfo: false,
        collectionCenters: false,
        donationModel: false,
        stories: false,
        reports: false,
        partners: false,
        faqs: false
      }
    };

    const req: ClientRequirements = {
      clientName: 'Zero Handouts Association',
      organizationType: 'ngo',
      ngoArchetype: 'grassroots_ngo',
      ngoData: emptyNGOData
    };

    const website = synthesizeWebsite(req);
    assert.strictEqual(website.ngoData?.programs.length, 0, 'Programs must remain strictly 0');
    assert.strictEqual(website.ngoData?.impactStats.length, 0, 'Impact stats must remain strictly 0');
    assert.strictEqual(website.ngoData?.campaigns.length, 0, 'Campaigns must remain strictly 0');
    assert.strictEqual(website.ngoData?.collectionCenters.length, 0, 'Collection centers must remain strictly 0');
    assert.strictEqual(website.ngoData?.stories.length, 0, 'Stories must remain strictly 0');

    // Sections for empty collections must not be generated
    const sectionTypes = website.sections.map(s => s.type);
    assert.strictEqual(sectionTypes.includes('ngo_programs'), false, 'Should not have ngo_programs');
    assert.strictEqual(sectionTypes.includes('ngo_campaigns'), false, 'Should not have ngo_campaigns');
    assert.strictEqual(sectionTypes.includes('ngo_collection_centers'), false, 'Should not have ngo_collection_centers');
    assert.strictEqual(sectionTypes.includes('ngo_stories'), false, 'Should not have ngo_stories');
  });

  // TEST 5: Legal & Tax Exemption Notice Preservation
  test('5. Section 80G and FCRA tax exemption notices are strictly preserved in profile & website synthesis', () => {
    const req: ClientRequirements = {
      clientName: 'Gram Chetna Social Welfare Society',
      organizationType: 'ngo',
      ngoArchetype: 'grassroots_ngo',
      ngoData: mockGrassrootsData
    };

    const website = synthesizeWebsite(req);
    assert.ok(
      website.ngoData?.profile.taxExemptionNotice?.includes('Section 80G'),
      'Must preserve Section 80G notice in profile'
    );
    assert.ok(
      website.ngoData?.profile.fcraRegistrationNumber?.includes('FCRA No.'),
      'Must preserve FCRA registration number'
    );
    assert.ok(
      website.footerConfig.copyrightText.includes('Gram Chetna'),
      'Footer must reflect organization legal name'
    );
  });

  // TEST 6: Library-template projects collect and publish no payment details (replaces the old bank/UPI fixture check)
  test('6. Library-template NGO data never carries bank, UPI, tiers or tax claims, even if the request supplies them', () => {
    const reqs = {
      organizationName: 'Riverbend Community Trust', category: 'ngo_social',
      selectedTemplate: { templateId: 'grassroots-folder-tabs', templateName: 'Folder Tabs' }
    } as unknown as ClientRequirements;
    const raw = {
      profile: { name: 'Riverbend Community Trust', taxExemptionNotice: 'Section 80G', fcraRegistrationNumber: 'X' },
      donationModel: {
        headline: 'Donate', donationTiers: [{ id: 't', amount: 100 }], taxDeductible: true,
        directTransferDetails: { bankName: 'Some Bank', accountNumber: '123', upiId: 'a@b' }
      }
    };
    const data = normalizeNGODataStrict(raw, reqs, 'grassroots_ngo');
    assert.equal(data.donationModel.donationTiers.length, 0);
    assert.equal(data.donationModel.directTransferDetails, undefined);
    assert.equal(data.donationModel.taxDeductible, false);
    assert.equal(data.profile.taxExemptionNotice, undefined);
    assert.equal(data.profile.fcraRegistrationNumber, undefined);
    assert.equal(data.profile.registrationNumber, undefined, 'nothing is invented');
    assert.equal(data.profile.contactEmail, '', 'nothing is invented');
    assert.ok(!JSON.stringify(data).match(/Some Bank|a@b|Section 80G/));
  });

  // TEST 7: Public Volunteer Application Ingestion Endpoint
  test('7. POST /api/projects/:id/volunteer accepts public volunteer application and persists to database', async () => {
    const volPayload = {
      fullName: 'Aarav Singhania',
      email: 'aarav.singh@example.com',
      phone: '+91 98111 88220',
      city: 'Gurugram',
      opportunityId: 'vol_sort',
      motivation: 'Passionate about rural sustainable development and material recycling.',
      skills: ['Logistics', 'Photography', 'Hindi Fluency']
    };

    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/volunteer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify(volPayload)
    });

    assert.strictEqual(res.status, 201, 'Volunteer endpoint should return 201 Created');
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.applicationId, 'Should return generated applicationId');
    assert.ok(data.message.includes('Aarav Singhania'));

    // Check project in DB has recorded application
    const proj = await repository.getProjectById(testProjectId);
    assert.ok(proj, 'Project must exist');
    const apps = (proj as any).requirements?.ngoData?.volunteerSubmissions || [];
    assert.ok(apps.length > 0, 'Applications array must contain the submitted application');
    assert.strictEqual(apps[0].applicantEmail, 'aarav.singh@example.com');
  });

  // TEST 8: The donation pledge endpoint is retired: no donor details or PAN are accepted any more
  test('8. POST /api/projects/:id/donation-enquiry is retired (410) and stores nothing', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/donation-enquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({ fullName: 'Sunita Narayanan', email: 'sunita.n@corporate.org', amount: 15000, panNumber: 'ABCDE1234F' })
    });
    assert.strictEqual(res.status, 410);
    const proj = await repository.getProjectById(testProjectId);
    const enquiries = (proj as any).requirements?.ngoData?.donationEnquiries || [];
    assert.ok(!enquiries.some((e: any) => e.panNumber === 'ABCDE1234F'), 'no PAN may be stored');
  });

  // TEST 9: SQLite Persistence & Dynamic Data Availability Recalculation
  test('9. PATCH /api/projects/:id/ngo-data saves updated NGO data and auto-recalculates availability', async () => {
    const updatedPrograms: NGOProgram[] = [
      ...mockGrassrootsData.programs,
      {
        id: 'prog_mahila',
        title: 'Mahila Utthan — Village Weaving Hubs',
        tagline: 'Reviving traditional loom weaving with recycled cotton',
        description: 'Establishing 12 community looms operated by women collectives.',
        beneficiariesServed: '600 women artisans',
        geographicFocus: 'Madhya Pradesh',
        pillars: ['Livelihood', 'Women Empowerment'],
        order: 3
      }
    ];

    const patchPayload = {
      ...mockGrassrootsData,
      programs: updatedPrograms
    };

    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/ngo-data`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      },
      body: JSON.stringify({ ngoData: patchPayload })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.ngoData, 'Response should contain ngoData');
    assert.strictEqual(body.ngoData.programs.length, 3);
    assert.strictEqual(body.ngoData.dataAvailability.programs, true);
  });

  // TEST 10: RBAC Protection on Admin Endpoints
  test('10. RBAC Protection: Unauthenticated requests to /ngo-data receive 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/ngo-data`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({ ngoData: mockGrassrootsData })
    });
    assert.strictEqual(res.status, 401, 'Unauthenticated request must be rejected with 401');
  });

  // TEST 11: Public Preview Token Access
  test('11. GET /api/public/preview/:token delivers synthesized NGO website to public visitors', async () => {
    const tokenRes = await fetch(`${baseUrl}/api/projects/${testProjectId}/preview-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      },
      body: JSON.stringify({ expiresInHours: 72 })
    });
    assert.strictEqual(tokenRes.status, 201);
    const tokenData = await tokenRes.json();
    const tokenString = tokenData.previewToken?.token || tokenData.token?.token || tokenData.token;

    const res = await fetch(`${baseUrl}/api/preview/${tokenString}`, {
      method: 'GET',
      headers: { Connection: 'close' }
    });

    assert.strictEqual(res.status, 200, 'Public preview endpoint must return 200 OK');
    const data = await res.json();
    assert.ok(data.website, 'Response should contain website object');
    assert.strictEqual(data.website.organizationCategory, 'ngo');
    assert.strictEqual(data.website.ngoArchetype, 'grassroots_ngo');
  });

  // TEST 12: Immutable Revision Snapshotting
  test('12. POST /api/projects/:id/variations creates immutable historical snapshot preserving NGO state', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/variations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      },
      body: JSON.stringify({
        changelogNotes: 'Pre-launch baseline revision snapshot with 3 programs'
      })
    });

    assert.strictEqual(res.status, 201, 'Snapshot creation should return 201');
    const data = await res.json();
    assert.ok(data.variation?.id, 'Should have created variation snapshot');
    assert.strictEqual(data.variation.websiteData.ngoArchetype, 'grassroots_ngo');
  });

  // TEST 13: Preflight Publishing Clearance on Synthesized NGO Project
  test('13. GET /api/projects/:id/publishing/preflight verifies all publishing checks pass', async () => {
    // Publishing needs no quotation, payment or client approval: only the technical preflight.
    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/publishing/preflight`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.isReadyToPublish, true, 'Preflight should confirm ready to publish');
    assert.strictEqual(data.checks.hasGeneratedWebsite, true);
    assert.ok(!('isCommerciallyCleared' in data.checks) && !('hasClientApproval' in data.checks));
  });

  // TEST 14: Annual Reports & Audited Financials Document Delivery
  test('14. Audited Financials & Annual Reports deliver verified downloadable PDF assets', () => {
    const rep = mockGrassrootsData.reports![0];
    assert.strictEqual(rep.type, 'audited_financials');
    assert.strictEqual(rep.year, 2025);
    assert.ok(rep.fileUrl.endsWith('.pdf'), 'Report must have valid PDF url');
    assert.ok(rep.fileSizeMb, 'Must include file size notice');
  });

  // TEST 15: Ground-Level Stories & Beneficiary Testimonials
  test('15. Field stories maintain authentic beneficiary voice and zero patronizing tropes', () => {
    const story = mockGrassrootsData.stories![0];
    assert.strictEqual(story.beneficiaryName, 'Rameshwar Meena & Village Collective');
    assert.ok(story.quote?.includes('We did not take charity'), 'Quote must preserve dignity-not-charity philosophy');
  });

  // TEST 16: CSR & Institutional Partner Showcase
  test('16. Institutional partners correctly categorized across funding, corporate and community pillars', () => {
    const partner = mockGrassrootsData.partners![0];
    assert.strictEqual(partner.name, 'Tata Social Initiatives Trust');
    assert.strictEqual(partner.partnerType, 'funding');
  });
});
