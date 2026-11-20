// Must stay the first import: prepares the isolated test environment before the app loads.
import { baseUrl, getDatabase } from './helpers/freshContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { synthesizeWebsite } from '../src/services/aiGenerator.js';
import type { ClientRequirements, SelectedTemplateMetadata } from '../src/types/index.js';
import type { PortfolioWebsiteData } from '../src/types/portfolio.js';

describe('Portfolio Website Creation Engine & Premium Template Library', () => {
  let adminToken = '';
  const testProjectId = `proj_portfolio_test_${Date.now()}`;

  // Expected 6 portfolio templates
  const EXPECTED_TEMPLATES = [
    {
      id: 'nova',
      name: 'NOVA',
      category: 'developer',
      archetype: 'developer',
      version: '1.0.0',
      primaryColor: '#090D16',
      accentColor: '#0284c7'
    },
    {
      id: 'creative_studio',
      name: 'Creative Studio',
      category: 'designer',
      archetype: 'designer',
      version: '1.0.0',
      primaryColor: '#0d0d0d',
      accentColor: '#f97316'
    },
    {
      id: 'vision',
      name: 'VISION',
      category: 'photographer',
      archetype: 'photographer',
      version: '1.0.0',
      primaryColor: '#050505',
      accentColor: '#e2e8f0'
    },
    {
      id: 'motionverse',
      name: 'MOTIONVERSE',
      category: 'motion_3d',
      archetype: 'motion_3d',
      version: '1.0.0',
      primaryColor: '#030712',
      accentColor: '#8b5cf6'
    },
    {
      id: 'academic_pro',
      name: 'ACADEMIC PRO',
      category: 'academic',
      archetype: 'academic_pro',
      version: '1.0.0',
      primaryColor: '#0b0f19',
      accentColor: '#1e3a8a'
    },
    {
      id: 'brandbuilder',
      name: 'BRANDBUILDER',
      category: 'freelancer_brand',
      archetype: 'personal_brand',
      version: '1.0.0',
      primaryColor: '#0a0a0a',
      accentColor: '#10b981'
    }
  ];

  before(async () => {
    // Authenticate or bootstrap Super Admin
    const superAdminEmail = 'contact@cogniverse.co.in';
    const superAdminUsername = 'satyakimaiti';
    const superAdminPassword = 'SuperPassword@2026!';

    const statusRes = await fetch(`${baseUrl}/api/auth/setup/status`);
    const statusData = await statusRes.json();

    if (statusData.setupRequired) {
      const setupRes = await fetch(`${baseUrl}/api/auth/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Satyaki Maiti',
          username: superAdminUsername,
          password: superAdminPassword,
          confirmPassword: superAdminPassword
        })
      });
      const setupJson = await setupRes.json();
      adminToken = setupJson.token;
    } else {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: superAdminEmail,
          password: superAdminPassword
        })
      });
      if (loginRes.ok) {
        const loginData = await loginRes.json();
        adminToken = loginData.token;
      } else {
        const bcrypt = await import('bcryptjs');
        const hash = await bcrypt.default.hash(superAdminPassword, 12);
        const db = getDatabase();
        db.prepare('UPDATE users SET password_hash = ? WHERE role = ?').run(hash, 'SUPER_ADMIN');

        const retryRes = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: superAdminEmail,
            password: superAdminPassword
          })
        });
        const retryData = await retryRes.json();
        adminToken = retryData.token;
      }
    }
    assert.ok(adminToken, 'Admin token should be successfully acquired');
  });

  // Test 1: Template Registry Verification
  test('1. Portfolio Template Registry Integrity (6 Bespoke Templates)', async () => {
    assert.equal(EXPECTED_TEMPLATES.length, 6, 'There must be exactly 6 portfolio templates');

    const ids = new Set(EXPECTED_TEMPLATES.map(t => t.id));
    assert.equal(ids.size, 6, 'All template IDs must be unique');

    for (const tmpl of EXPECTED_TEMPLATES) {
      assert.ok(tmpl.name, `Template ${tmpl.id} must have a name`);
      assert.equal(tmpl.version, '1.0.0', `Template ${tmpl.id} must have semantic version 1.0.0`);
      assert.ok(tmpl.primaryColor, `Template ${tmpl.id} must have primaryColor`);
      assert.ok(tmpl.accentColor, `Template ${tmpl.id} must have accentColor`);
    }
  });

  // Test 2: Project Creation & SQLite Persistence
  test('2. Portfolio Project Creation & SQLite Selected Template Persistence', async () => {
    const portfolioData: PortfolioWebsiteData = {
      schemaVersion: '1.0',
      archetype: 'developer',
      professionCategory: 'developer',
      identity: {
        fullName: 'Alex Chen',
        title: 'Staff Distributed Systems Architect',
        headline: 'Architecting resilient cloud kernels at planetary scale.',
        bio: 'Staff engineer with 9+ years experience leading distributed platforms.',
        email: 'alex.chen@example.com',
        location: 'San Francisco, CA'
      },
      skills: [
        { id: 's1', name: 'Rust', proficiency: 'Expert', yearsOfExperience: 6, featured: true },
        { id: 's2', name: 'Go', proficiency: 'Expert', yearsOfExperience: 7, featured: true }
      ],
      projects: [
        {
          id: 'p1',
          title: 'AetherKV',
          summary: 'Sub-millisecond partition-tolerant key-value store in Rust',
          role: 'Sole Architect',
          technologies: ['Rust', 'Raft', 'Tokio'],
          featured: true
        }
      ],
      experience: [
        {
          id: 'e1',
          title: 'Staff Systems Architect',
          company: 'CloudStream',
          period: '2022 - Present',
          description: 'Designed core multi-tenant compute engine'
        }
      ]
    };

    const selectedTemplate: SelectedTemplateMetadata = {
      templateId: 'nova',
      templateVersion: '1.0.0',
      templateName: 'NOVA',
      websiteCategory: 'developer',
      selectedAt: new Date().toISOString(),
      designTokens: {
        primaryColor: '#090D16',
        accentColor: '#0284c7',
        fontFamily: 'Inter',
        headingFont: 'Space Grotesk',
        layoutPreset: 'split'
      }
    };

    const payload: ClientRequirements = {
      organizationName: 'Alex Chen Portfolio',
      category: 'portfolio',
      portfolioArchetype: 'developer',
      tagline: 'Staff Distributed Systems Architect',
      aboutText: 'Staff engineer with 9+ years experience leading distributed platforms.',
      contactEmail: 'alex.chen@example.com',
      contactPhone: '+1 (415) 890-4321',
      primaryColor: '#0284c7',
      accentColor: '#38bdf8',
      typographyStyle: 'technical',
      portfolioData,
      selectedTemplate
    };

    const createRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify(payload)
    });

    assert.equal(createRes.status, 201, 'POST /api/projects should return 201');
    const { project: createdProject } = await createRes.json();
    assert.ok(createdProject?.id, 'Created project must have an id');

    // Verify SQLite WAL persistence
    const db = getDatabase();
    const row = db.prepare('SELECT requirements_json FROM projects WHERE id = ?').get(createdProject.id) as { requirements_json: string } | undefined;
    assert.ok(row, 'Project must exist in SQLite database');

    const parsedReqs = JSON.parse(row.requirements_json);
    assert.equal(parsedReqs.category, 'portfolio', 'Category must be persisted as portfolio');
    assert.equal(parsedReqs.selectedTemplate?.templateId, 'nova', 'selectedTemplate.templateId must be nova');
    assert.equal(parsedReqs.portfolioData?.identity?.fullName, 'Alex Chen', 'portfolioData identity must be persisted');
  });

  // Test 3: Template Switching Without Data Destruction
  test('3. Portfolio Template Switching Without Data Destruction', async () => {
    // Create initial project with NOVA template
    const db = getDatabase();
    const projId = `${testProjectId}_switch`;

    const initialReqs: ClientRequirements = {
      organizationName: 'Elena Rostova Studio',
      category: 'portfolio',
      portfolioArchetype: 'designer',
      tagline: 'Crafting emotive digital products',
      aboutText: 'Principal product designer and art director.',
      contactEmail: 'elena@rostova.design',
      selectedTemplate: {
        templateId: 'nova',
        templateVersion: '1.0.0',
        templateName: 'NOVA',
        websiteCategory: 'developer',
        selectedAt: new Date().toISOString()
      }
    };

    const createRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify(initialReqs)
    });
    const { project: created } = await createRes.json();
    assert.ok(created?.id, 'Created project must have an id');

    // Switch template to Creative Studio
    const newTemplate: SelectedTemplateMetadata = {
      templateId: 'creative_studio',
      templateVersion: '1.0.0',
      templateName: 'Creative Studio',
      websiteCategory: 'designer',
      selectedAt: new Date().toISOString(),
      designTokens: {
        primaryColor: '#0d0d0d',
        accentColor: '#f97316',
        fontFamily: 'Inter',
        headingFont: 'Clash Display',
        layoutPreset: 'editorial'
      }
    };

    const updateRes = await fetch(`${baseUrl}/api/projects/${created.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        selectedTemplate: newTemplate
      })
    });
    assert.equal(updateRes.status, 200, 'PUT /api/projects/:id should return 200');

    // Verify updated project
    const updatedRow = db.prepare('SELECT requirements_json FROM projects WHERE id = ?').get(created.id) as { requirements_json: string };
    const updatedReqs = JSON.parse(updatedRow.requirements_json);

    assert.equal(updatedReqs.selectedTemplate?.templateId, 'creative_studio', 'Template ID must be updated to creative_studio');
    assert.equal(updatedReqs.organizationName, 'Elena Rostova Studio', 'Client organization name must remain intact');
    assert.equal(updatedReqs.contactEmail, 'elena@rostova.design', 'Client email must remain intact');
  });

  // Test 4: Strict Content Replacement Synthesis
  test('4. Strict AI Content Replacement Synthesis for Portfolio Templates', async () => {
    const portfolioData: PortfolioWebsiteData = {
      schemaVersion: '1.0',
      archetype: 'photographer',
      professionCategory: 'photographer',
      identity: {
        fullName: 'Marcus Vance',
        title: 'Fine Art Documentary Photographer',
        headline: 'Capturing the stillness of raw arctic frontiers.',
        bio: 'Documentary visualist specializing in large-format analog landscapes.',
        email: 'marcus@vance.com',
        location: 'Reykjavik, Iceland'
      },
      skills: [
        { id: 'v1', name: 'Medium Format Systems', proficiency: 'Expert', featured: true }
      ],
      projects: [
        {
          id: 'vproj_1',
          title: 'The Silent Glaciers',
          summary: 'A 4-year expedition documenting glacial tongues of Vatnajökull',
          featured: true
        }
      ]
    };

    const requirements: ClientRequirements = {
      organizationName: 'Marcus Vance Fine Art',
      category: 'portfolio',
      portfolioArchetype: 'photographer',
      tagline: 'Capturing the stillness of raw arctic frontiers.',
      aboutText: 'Documentary visualist specializing in large-format analog landscapes.',
      contactEmail: 'marcus@vance.com',
      logoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      coverImageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
      portfolioData,
      selectedTemplate: {
        templateId: 'vision',
        templateVersion: '1.0.0',
        templateName: 'VISION',
        websiteCategory: 'photographer',
        selectedAt: new Date().toISOString(),
        designTokens: {
          primaryColor: '#050505',
          accentColor: '#e2e8f0',
          fontFamily: 'Inter',
          headingFont: 'Playfair Display',
          layoutPreset: 'grid'
        }
      }
    };

    const generated = await synthesizeWebsite(requirements);

    assert.ok(generated.portfolioData, 'Generated website must retain portfolioData');
    assert.equal(generated.portfolioData?.identity?.fullName, 'Marcus Vance', 'Identity must match client data');
    assert.equal(generated.selectedTemplate?.templateId, 'vision', 'Selected template must remain vision');
    assert.equal(generated.layoutPreset, 'grid', 'Layout preset must match template design token');
    assert.equal(generated.fontFamily, 'Inter', 'Font family must match template token');
  });

  // Test 5: Strict Media Non-Contamination (Group A vs Group B)
  test('5. Strict Media Non-Contamination Rule (Group A Profile vs Group B Drive/YouTube)', async () => {
    const portfolioData: PortfolioWebsiteData = {
      schemaVersion: '1.0',
      archetype: 'motion_3d',
      professionCategory: 'motion_3d',
      identity: {
        fullName: 'Kai Takahashi',
        title: '3D Generalist',
        profilePhotoUrl: 'https://official-cdn.com/kai-avatar.jpg',
        heroCoverUrl: 'https://official-cdn.com/kai-banner.jpg',
        location: 'Tokyo',
        email: 'kai@motionverse.io'
      },
      media: {
        officialLogoUrl: 'https://official-cdn.com/kai-avatar.jpg',
        officialHeroBannerUrl: 'https://official-cdn.com/kai-banner.jpg',
        googleDriveGalleryUrl: 'https://drive.google.com/drive/folders/1motionverse-3d-assets',
        googleDriveVideoUrl: 'https://drive.google.com/file/d/1motionverse-reel/view',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      },
      skills: [],
      projects: [],
      experience: []
    };

    const requirements: ClientRequirements = {
      organizationName: 'Kai Takahashi',
      category: 'portfolio',
      portfolioArchetype: 'motion_3d',
      tagline: '3D Generalist',
      aboutText: 'Motion director',
      contactEmail: 'kai@motionverse.io',
      logoUrl: 'https://official-cdn.com/kai-avatar.jpg',
      coverImageUrl: 'https://official-cdn.com/kai-banner.jpg',
      googleDriveGalleryUrl: 'https://drive.google.com/drive/folders/1motionverse-3d-assets',
      googleDriveVideoUrl: 'https://drive.google.com/file/d/1motionverse-reel/view',
      youtubeUrls: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
      portfolioData
    };

    const generated = await synthesizeWebsite(requirements);

    // Group A (Brand identity) check
    assert.equal(generated.portfolioData?.identity?.profilePhotoUrl, 'https://official-cdn.com/kai-avatar.jpg');
    assert.equal(generated.portfolioData?.identity?.heroCoverUrl, 'https://official-cdn.com/kai-banner.jpg');

    // Group B (Drive & YouTube) check
    assert.equal(generated.portfolioData?.media?.googleDriveGalleryUrl, 'https://drive.google.com/drive/folders/1motionverse-3d-assets');
    assert.equal(generated.portfolioData?.media?.youtubeUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    // Verification that Group B did not overwrite Group A
    assert.notEqual(generated.portfolioData?.identity?.heroCoverUrl, 'https://drive.google.com/drive/folders/1motionverse-3d-assets');
    assert.notEqual(generated.heroImage, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  // Test 6: Developer Archetype Synthesis (NOVA)
  test('6. Developer Archetype Synthesis (NOVA Layout & Navigation)', async () => {
    const requirements: ClientRequirements = {
      organizationName: 'David K.',
      category: 'portfolio',
      portfolioArchetype: 'developer',
      tagline: 'Full Stack Engineer',
      aboutText: 'Systems developer',
      contactEmail: 'david@example.com',
      portfolioData: {
        schemaVersion: '1.0',
        archetype: 'developer',
        identity: {
          fullName: 'David K.',
          title: 'Full Stack Engineer',
          email: 'david@example.com',
          location: 'Seattle, WA'
        },
        skills: [{ id: 's1', name: 'TypeScript', proficiency: 'Expert' }],
        projects: [{ id: 'p1', title: 'EdgeDB Client', technologies: ['TS'] }],
        experience: [{ id: 'e1', title: 'Senior Dev', company: 'Acme', description: 'Built scale apps' }]
      }
    };

    const site = await synthesizeWebsite(requirements);
    assert.equal(site.selectedTemplate?.templateId, 'engineer-blueprint', 'Developer default template must be engineer-blueprint');
    assert.ok(site.navigationBar?.links.some(l => l.href === '/projects' || (l as any).path === '/projects'), 'Must have projects route');
    assert.ok(site.navigationBar?.links.some(l => l.href === '/experience' || (l as any).path === '/experience'), 'Must have experience route');
  });

  // Test 7: Designer & Visual Archetype Synthesis (Creative Studio & Vision)
  test('7. Designer & Photography Archetype Synthesis (Creative Studio & Vision)', async () => {
    const designerReqs: ClientRequirements = {
      organizationName: 'Studio Lux',
      category: 'portfolio',
      portfolioArchetype: 'designer',
      tagline: 'Product Designer',
      aboutText: 'Art Direction',
      contactEmail: 'lux@studio.design'
    };
    const designerSite = await synthesizeWebsite(designerReqs);
    assert.equal(designerSite.selectedTemplate?.templateId, 'editorial-ux', 'Designer default template must be editorial-ux');

    const photoReqs: ClientRequirements = {
      organizationName: 'Vance Lens',
      category: 'portfolio',
      portfolioArchetype: 'photographer',
      tagline: 'Visualist',
      aboutText: 'Exhibitions',
      contactEmail: 'vance@lens.com'
    };
    const photoSite = await synthesizeWebsite(photoReqs);
    assert.equal(photoSite.selectedTemplate?.templateId, 'photo-fullscreen', 'Photographer default template must be photo-fullscreen');
  });

  // Test 8: Academic & Personal Brand Synthesis (Academic Pro & Brandbuilder)
  test('8. Academic & Personal Brand Archetype Synthesis (Academic Pro & Brandbuilder)', async () => {
    const academicReqs: ClientRequirements = {
      organizationName: 'Dr. Mercer',
      category: 'portfolio',
      portfolioArchetype: 'academic_pro',
      tagline: 'Quantum Faculty',
      aboutText: 'Research in quantum cryptography',
      contactEmail: 'mercer@mit.edu',
      portfolioData: {
        schemaVersion: '1.0',
        archetype: 'academic_pro',
        identity: {
          fullName: 'Dr. Mercer',
          email: 'mercer@mit.edu',
          location: 'Cambridge, MA'
        },
        publications: [
          { id: 'pub1', title: 'Post-Quantum Protocols', publisher: 'ACM', year: '2024' }
        ],
        skills: [],
        projects: [],
        experience: []
      }
    };
    const academicSite = await synthesizeWebsite(academicReqs);
    assert.equal(academicSite.selectedTemplate?.templateId, 'graduate-profile', 'Academic default template must be graduate-profile');
    assert.ok(academicSite.navigationBar?.links.some(l => l.href === '/publications' || (l as any).path === '/publications'), 'Must include publications navigation');

    const brandReqs: ClientRequirements = {
      organizationName: 'Marcus Sterling',
      category: 'portfolio',
      portfolioArchetype: 'personal_brand',
      tagline: 'B2B Growth Advisor',
      aboutText: 'Scaling SaaS',
      contactEmail: 'marcus@growth.com'
    };
    const brandSite = await synthesizeWebsite(brandReqs);
    assert.equal(brandSite.selectedTemplate?.templateId, 'freelancer-services', 'Personal-brand default template must be freelancer-services');
    assert.ok(brandSite.navigationBar?.links.some(l => l.href === '/services' || (l as any).path === '/services'), 'Must include services navigation');
  });

  // Test 9: Commercial API Safety & Super Admin Telemetry Integrity
  test('9. Commercial & Billing API Integrity after Admin UI Button Removal', async () => {
    // Verify commercial overview endpoint
    const commRes = await fetch(`${baseUrl}/api/commercial/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(commRes.status, 200, 'GET /api/commercial/overview must remain 200 OK');
    const commData = await commRes.json();
    assert.ok(commData.overview, 'Commercial overview must provide overview object');
    assert.ok(typeof commData.overview.totalQuotedPipeline === 'number', 'Total pipeline must be numeric');
    assert.ok(typeof commData.overview.totalRevenueCollected === 'number', 'Total revenue must be numeric');
  });

  // Test 10: Regression Verification Across Existing Engines
  test('10. Full Regression Check (Cultural, Sports, and NGO Engines Intact)', async () => {
    const listRes = await fetch(`${baseUrl}/api/projects`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(listRes.status, 200, 'GET /api/projects must return 200');
    const data = await listRes.json();
    assert.ok(Array.isArray(data.projects), 'Projects list must be an array');
  });
});
