// Must stay the first import: prepares the isolated test environment before the app loads.
import { baseUrl, getDatabase } from './helpers/testContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { repository } from '../src/db/repository.js';
import { OrganizationCategory, ClientRequirements } from '../src/types/index.js';

describe('Phase 4: Structured Requirement Builder & Client Management', () => {
  let adminToken = '';
  let createdProjectId = '';

  before(async () => {
    // Authenticate as Admin operator
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@digiverse.internal',
        password: 'Digiverse@2026!'
      })
    });
    const data = await loginRes.json();
    adminToken = data.token;
  });

  test('should reject unauthenticated project creation with 401', async () => {
    const res = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationName: 'Unauthorized Org'
      })
    });
    assert.strictEqual(res.status, 401);
  });

  test('should reject unauthenticated media upload with 401', async () => {
    const res = await fetch(`${baseUrl}/api/media/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'logo.png',
        fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      })
    });
    assert.strictEqual(res.status, 401);
  });

  test('should successfully upload media asset and serve it through protected static route', async () => {
    // 1x1 transparent PNG base64
    const pngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const uploadRes = await fetch(`${baseUrl}/api/media/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        filename: 'test-org-logo.png',
        fileData: pngBase64
      })
    });

    assert.strictEqual(uploadRes.status, 201);
    const uploadData = await uploadRes.json();
    assert.ok(uploadData.url);
    assert.ok(uploadData.filename.includes('test-org-logo'));

    // Retrieve uploaded file
    const getFileRes = await fetch(`${baseUrl}${uploadData.url}`);
    assert.strictEqual(getFileRes.status, 200);
    assert.strictEqual(getFileRes.headers.get('content-type'), 'image/png');
  });

  test('should support creating client projects across all 10 organization categories', async () => {
    const categories: OrganizationCategory[] = [
      'cultural',
      'puja_committee',
      'sports',
      'health_wellness',
      'ngo_social',
      'educational',
      'professional',
      'hobby_club',
      'community',
      'custom'
    ];

    for (const cat of categories) {
      const orgName = `Auto Test ${cat} Org ${Date.now()}`;
      const payload: Partial<ClientRequirements> = {
        organizationName: orgName,
        category: cat,
        organizationType: cat,
        subcategory: `${cat} Unit`,
        contactPerson: 'Lead Coordinator',
        contactEmail: `contact@${cat}.test`,
        contactPhone: '+91 90000 00000',
        tagline: `Preserving ${cat} heritage`,
        aboutText: `Detailed description for ${cat} organization.`,
        primaryColor: '#6366f1',
        accentColor: '#ec4899',
        typographyStyle: 'heritage',
        websiteLanguage: 'bilingual',
        enabledSections: {
          hero: true,
          events: true,
          about: true,
          committee: true,
          gallery: true,
          contact: true
        },
        events: [],
        committee: [],
        gallery: []
      };

      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });

      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.project.requirements.category, cat);
      assert.strictEqual(data.project.requirements.organizationName, orgName);
      assert.ok(data.project.tenantSlug);

      if (!createdProjectId) {
        createdProjectId = data.project.id;
      }
    }
  });

  test('should save and retrieve full extended requirements (pages, functionality, social links, references)', async () => {
    const fullOrgName = `Highland Arts Guild ${Date.now()}`;
    const comprehensiveReqs: ClientRequirements = {
      organizationName: fullOrgName,
      category: 'cultural',
      subcategory: 'Highland Folk & Arts',
      contactPerson: 'Director Ronald Smith',
      contactEmail: 'director@highlandarts.org',
      contactPhone: '+91 98311 22334',
      address: '74 Park Street, Kolkata, WB',
      tagline: 'Art, Heritage, and Harmony',
      aboutText: 'The Highland Arts Guild was established in 1985 to promote regional arts.',
      primaryColor: '#0ea5e9',
      accentColor: '#f59e0b',
      typographyStyle: 'classic',
      websiteLanguage: 'bilingual',
      preferredLanguage: 'bilingual',
      googleDriveUrl: 'https://drive.google.com/drive/folders/test1234',
      youtubeUrls: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
      socialLinks: {
        facebook: 'https://facebook.com/highlandarts',
        instagram: 'https://instagram.com/highlandarts',
        youtube: 'https://youtube.com/@highlandarts',
        twitter: 'https://twitter.com/highlandarts',
        linkedin: 'https://linkedin.com/company/highlandarts',
        whatsapp: '+91 98311 22334'
      },
      requiredPages: {
        home: true,
        about: true,
        events: true,
        committee: true,
        gallery: true,
        announcements: true,
        donations: true,
        contact: true,
        customPages: ['Heritage Archive', 'Past Laureates']
      },
      requiredFunctionality: {
        onlineInquiries: true,
        eventCalendar: true,
        photoGallery: true,
        youtubeVideoPlayer: true,
        googleDriveSync: true,
        donorWall: true,
        memberDirectory: true,
        bilingualToggle: true
      },
      referenceWebsites: [
        'https://nationalartscouncil.org',
        'https://tate.org.uk'
      ],
      additionalRequirements: 'Require prominent bilingual Bengali & English display on all pages.',
      enabledSections: {
        hero: true,
        events: true,
        about: true,
        committee: true,
        gallery: true,
        contact: true
      },
      events: [
        {
          id: 'ev-1',
          title: 'Annual Classical Gala',
          date: 'Nov 15, 2026',
          time: '6:00 PM',
          venue: 'Grand Auditorium',
          category: 'Music'
        }
      ],
      committee: [
        {
          id: 'cm-1',
          name: 'Ronald Smith',
          role: 'President & Patron',
          department: 'Executive Board'
        }
      ],
      gallery: [
        {
          id: 'gal-1',
          title: 'Spring Festival Inauguration',
          subtitle: 'Main Stage lighting ceremony',
          category: 'Festival',
          iconType: 'Sparkles'
        }
      ]
    };

    const res = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify(comprehensiveReqs)
    });

    assert.strictEqual(res.status, 201);
    const created = await res.json();
    const projId = created.project.id;

    // Fetch the project back
    const getRes = await fetch(`${baseUrl}/api/projects/${projId}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });

    assert.strictEqual(getRes.status, 200);
    const fetched = await getRes.json();
    const reqs = fetched.project.requirements;

    assert.strictEqual(reqs.organizationName, fullOrgName);
    assert.strictEqual(reqs.subcategory, 'Highland Folk & Arts');
    assert.strictEqual(reqs.address, '74 Park Street, Kolkata, WB');
    assert.strictEqual(reqs.socialLinks?.facebook, 'https://facebook.com/highlandarts');
    assert.strictEqual(reqs.socialLinks?.whatsapp, '+91 98311 22334');
    assert.strictEqual(reqs.requiredPages?.announcements, true);
    assert.strictEqual(reqs.requiredPages?.donations, true);
    assert.deepStrictEqual(reqs.requiredPages?.customPages, ['Heritage Archive', 'Past Laureates']);
    assert.strictEqual(reqs.requiredFunctionality?.bilingualToggle, true);
    assert.strictEqual(reqs.requiredFunctionality?.donorWall, true);
    assert.deepStrictEqual(reqs.referenceWebsites, ['https://nationalartscouncil.org', 'https://tate.org.uk']);
    assert.strictEqual(reqs.events.length, 1);
    assert.strictEqual(reqs.committee.length, 1);
    assert.strictEqual(reqs.gallery.length, 1);
  });

  test('should update existing project requirements with PUT /api/projects/:id', async () => {
    assert.ok(createdProjectId, 'createdProjectId must be set');

    const updatedTagline = 'Updated Tagline for Automated Test';
    const putRes = await fetch(`${baseUrl}/api/projects/${createdProjectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        tagline: updatedTagline,
        primaryColor: '#10b981'
      })
    });

    assert.strictEqual(putRes.status, 200);
    const putData = await putRes.json();
    assert.strictEqual(putData.project.requirements.tagline, updatedTagline);
    assert.strictEqual(putData.project.requirements.primaryColor, '#10b981');
  });

  test('should delete project and associated records with DELETE /api/projects/:id', async () => {
    assert.ok(createdProjectId, 'createdProjectId must be set');

    const delRes = await fetch(`${baseUrl}/api/projects/${createdProjectId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });

    assert.strictEqual(delRes.status, 200);
    const delData = await delRes.json();
    assert.strictEqual(delData.success, true);

    // Verify subsequent GET returns 404
    const getRes = await fetch(`${baseUrl}/api/projects/${createdProjectId}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });

    assert.strictEqual(getRes.status, 404);
  });
});
