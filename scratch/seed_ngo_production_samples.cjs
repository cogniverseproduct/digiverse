const { repository } = require('../server/dist/db/repository.js');
const { synthesizeWebsite } = require('../server/dist/services/aiGenerator.js');

const now = new Date().toISOString();

// SAMPLE 1: Grassroots NGO (Goonj Parity) - Gram Chetna Social Welfare Society
const gramChetnaData = {
  schemaVersion: '1.0',
  archetype: 'grassroots_ngo',
  profile: {
    name: 'Gram Chetna Social Welfare Society',
    legalRegisteredName: 'Gram Chetna Social Welfare Society (Trust Reg No. 1999/DL/4921)',
    tagline: 'Turning urban surplus into rural development with dignity, not charity',
    missionStatement: 'To bridge the resource divide between urban wealth and rural distress through community-led material mobilization, water harvesting, and dignity-centered development.',
    visionStatement: 'A self-reliant and dignified rural India where communities solve local challenges using collective wisdom and decentralized resources.',
    aboutDescription: 'Founded in 1999, Gram Chetna works across 1,200 remote villages in India, repurposing thousands of tons of urban materials as developmental currency for rural infrastructure building.',
    establishedYear: '1999',
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
    themePreset: 'earth-dignity',
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

// SAMPLE 2: Institutional Foundation (Obama Foundation Parity) - Pragati Global Foundation
const pragatiData = {
  schemaVersion: '1.0',
  archetype: 'institutional_foundation',
  profile: {
    name: 'Pragati Global Foundation for Civic Leadership',
    legalRegisteredName: 'Pragati Global Foundation (Section 8 Non-Profit Co. U85300DL2015NPL28812)',
    tagline: 'Inspiring, empowering, and connecting civic leaders to change their world',
    missionStatement: 'To identify, train, and support the next generation of public interest leaders, researchers, and community innovators worldwide.',
    visionStatement: 'A more inclusive, democratic, and equitable global community shaped by principled civic action.',
    aboutDescription: 'Pragati Global Foundation operates premier leadership fellowships, democratic policy institutes, and community research fellowships across South Asia, Africa, and Latin America.',
    establishedYear: '2015',
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
    themePreset: 'institutional-navy',
    logoUrl: 'https://cdn.digiverse.site/crests/pragati-logo.png'
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

// SAMPLE 3: Cause Charity (charity: water Parity) - PureFlow Clean Water Initiative
const pureFlowData = {
  schemaVersion: '1.0',
  archetype: 'cause_charity',
  profile: {
    name: 'PureFlow Clean Water & Sanitation Initiative',
    legalRegisteredName: 'PureFlow Global Water Relief Foundation',
    tagline: 'Clean, safe water for every person on Earth. 100% of public donations fund water projects.',
    missionStatement: 'To solve the global water crisis within our lifetime through sustainable borehole wells, solar gravity schemes, and radical operational transparency.',
    visionStatement: 'A world where no child spends hours walking for dirty water instead of going to school.',
    aboutDescription: 'PureFlow operates on a radical 100% donation model: private benefactors cover all operational overhead, allowing 100% of every public dollar/rupee to flow directly into the ground for clean water infrastructure.',
    establishedYear: '2016',
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
    themePreset: 'cyan-clear',
    logoUrl: 'https://cdn.digiverse.site/crests/pureflow-logo.png'
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

const samples = [
  {
    id: 'proj_ngo_gram_chetna',
    slug: 'gram-chetna',
    name: 'Gram Chetna Social Welfare Society',
    archetype: 'grassroots_ngo',
    token: 'prev_gram_chetna_live_sample',
    data: gramChetnaData,
    tier: 'earth-dignity'
  },
  {
    id: 'proj_ngo_pragati_foundation',
    slug: 'pragati-foundation',
    name: 'Pragati Global Foundation for Civic Leadership',
    archetype: 'institutional_foundation',
    token: 'prev_pragati_foundation_sample',
    data: pragatiData,
    tier: 'institutional-navy'
  },
  {
    id: 'proj_ngo_pureflow_water',
    slug: 'pureflow-water',
    name: 'PureFlow Clean Water & Sanitation Initiative',
    archetype: 'cause_charity',
    token: 'prev_pureflow_water_sample',
    data: pureFlowData,
    tier: 'cyan-clear'
  }
];

console.log('Seeding 3 production-grade Social & NGO sample projects into SQLite...');

samples.forEach(sample => {
  // 1. Tenant
  const tenant = {
    id: `tenant_${sample.slug}`,
    slug: sample.slug,
    name: sample.name,
    category: 'ngo',
    subcategory: sample.archetype,
    contactPerson: sample.data.profile.name + ' Desk',
    contactEmail: sample.data.profile.contactEmail,
    contactPhone: sample.data.profile.contactPhone,
    address: sample.data.profile.headquartersAddress,
    websiteLanguage: 'en',
    createdByAdminId: 'usr_admin_01',
    assignedAdminId: 'usr_admin_01',
    createdAt: now,
    updatedAt: now
  };
  repository.saveTenant(tenant);

  // 2. Requirements
  const requirements = {
    organizationName: sample.name,
    category: 'ngo',
    organizationType: 'ngo',
    ngoArchetype: sample.archetype,
    ngoData: sample.data,
    primaryColor: sample.data.branding.primaryColor,
    accentColor: sample.data.branding.accentColor,
    tagline: sample.data.profile.tagline,
    aboutText: sample.data.profile.aboutDescription,
    events: [],
    committee: [],
    gallery: [],
    enabledSections: {
      hero: true,
      events: false,
      about: true,
      committee: false,
      gallery: false,
      contact: true
    }
  };

  // 3. Synthesize Website
  const generatedWebsite = synthesizeWebsite(requirements);

  // 4. Project
  const project = {
    id: sample.id,
    tenantId: tenant.id,
    tenantSlug: sample.slug,
    requirements,
    generatedWebsite,
    status: 'client_approved',
    activeRevisionId: `rev_${sample.slug}_v1`,
    approvedRevisionId: `rev_${sample.slug}_v1`,
    approvalDetails: {
      approvedBy: sample.data.leadership?.[0]?.name || 'Board of Trustees',
      approvedByEmail: sample.data.profile.contactEmail,
      approvedAt: now,
      revisionId: `rev_${sample.slug}_v1`,
      notes: 'Production benchmark sample verified for reference-level parity.'
    },
    createdAt: now,
    updatedAt: now
  };
  repository.saveProject(project);

  // 5. Revision V1
  const revision = {
    id: `rev_${sample.slug}_v1`,
    projectId: sample.id,
    versionNumber: 1,
    variationLabel: 'Production Benchmark V1 (AI Synthesis)',
    websiteData: generatedWebsite,
    isApproved: true,
    createdByAdminId: 'usr_admin_01',
    changelogNotes: 'Production reference parity build for ' + sample.name,
    createdAt: now
  };
  repository.createRevision(revision);

  // 6. Preview Token
  const previewToken = {
    id: `pt_${sample.slug}`,
    projectId: sample.id,
    revisionId: revision.id,
    token: sample.token,
    isActive: true,
    viewCount: 1,
    createdByAdminId: 'usr_admin_01',
    expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
    createdAt: now
  };
  repository.createPreviewToken(previewToken);

  // 7. Commercial record
  repository.saveCommercialRecord({
    id: `comm_${sample.slug}`,
    projectId: sample.id,
    quotationAmount: 75000,
    currency: 'INR',
    quotationStatus: 'accepted',
    paymentStatus: 'fully_paid',
    invoiceStatus: 'paid',
    amountPaid: 75000,
    commercialStatus: 'completed',
    createdAt: now,
    updatedAt: now
  });

  console.log(`✓ Seeded ${sample.name} [${sample.archetype}] -> Preview Token: ${sample.token}`);
});

console.log('All 3 NGO production benchmark projects successfully persisted into SQLite.');
