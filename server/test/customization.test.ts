// Must stay the first import: prepares the isolated test environment before the app loads.
import { baseUrl, getDatabase } from './helpers/testContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert';

describe('Phase 6: Design Customization Studio & Design Variations', () => {
  let adminToken = '';
  let projectId = '';

  before(async () => {
    // Authenticate Admin operator
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

    // Create a client project for customization testing
    const createRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        organizationName: `Studio Test Guild ${Date.now()}`,
        category: 'cultural',
        tagline: 'Initial Heritage Culture Tagline',
        aboutText: 'Initial about text description.',
        primaryColor: '#991b1b',
        accentColor: '#d97706',
        typographyStyle: 'heritage',
        websiteLanguage: 'bilingual'
      })
    });
    const created = await createRes.json();
    projectId = created.project.id;

    // Generate initial website
    await fetch(`${baseUrl}/api/projects/${projectId}/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
  });

  test('should reject customization on non-existent project with 404', async () => {
    const res = await fetch(`${baseUrl}/api/projects/proj_non_existent/customize`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ themeAccent: 'neon-cyan' })
    });
    assert.strictEqual(res.status, 404);
  });

  test('should successfully customize theme accent, layout preset, and typography via PATCH /api/projects/:id/customize', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}/customize`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        themeAccent: 'neon-cyan',
        layoutPreset: 'split',
        fontFamily: 'Inter, sans-serif',
        heroHeadline: 'Customized Studio Headline'
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.project.generatedWebsite.themeAccent, 'neon-cyan');
    assert.strictEqual(data.project.generatedWebsite.layoutPreset, 'split');
    assert.strictEqual(data.project.generatedWebsite.fontFamily, 'Inter, sans-serif');
    assert.strictEqual(data.project.generatedWebsite.heroHeadline, 'Customized Studio Headline');
  });

  test('should regenerate hero section with AI via POST /api/projects/:id/regenerate-section', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}/regenerate-section`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ section: 'hero' })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.regeneratedSection, 'hero');
    assert.ok(data.project.generatedWebsite.heroHeadline);
    assert.ok(data.project.generatedWebsite.heroDescription);
  });

  test('should regenerate events section with AI', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}/regenerate-section`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ section: 'events' })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.regeneratedSection, 'events');
    assert.ok(data.project.generatedWebsite.eventsList.length > 0);
  });

  test('should regenerate executive committee leadership with AI', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}/regenerate-section`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ section: 'committee' })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.regeneratedSection, 'committee');
    assert.ok(data.project.generatedWebsite.committeeList.length > 0);
  });

  test('should create and persist multiple design variations (V1, V2)', async () => {
    // 1. Create Variation V1
    const v1Res = await fetch(`${baseUrl}/api/projects/${projectId}/variations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        variationLabel: 'V1 - Classical Editorial',
        layoutPreset: 'editorial',
        themeAccent: 'crimson-gold'
      })
    });
    assert.strictEqual(v1Res.status, 201);
    const v1Data = await v1Res.json();
    assert.strictEqual(v1Data.variation.variationLabel, 'V1 - Classical Editorial');
    assert.ok(v1Data.variation.versionNumber >= 1);

    // 2. Create Variation V2
    const v2Res = await fetch(`${baseUrl}/api/projects/${projectId}/variations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        variationLabel: 'V2 - Modern Athletic Split',
        layoutPreset: 'split',
        themeAccent: 'neon-cyan'
      })
    });
    assert.strictEqual(v2Res.status, 201);
    const v2Data = await v2Res.json();
    assert.strictEqual(v2Data.variation.variationLabel, 'V2 - Modern Athletic Split');
    assert.ok(v2Data.variation.versionNumber > v1Data.variation.versionNumber);

    // 3. List Variations
    const listRes = await fetch(`${baseUrl}/api/projects/${projectId}/variations`, {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    assert.ok(listData.variations.length >= 2);

    // 4. Activate Variation V2
    const activateRes = await fetch(`${baseUrl}/api/projects/${projectId}/variations/${v2Data.variation.id}/activate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    assert.strictEqual(activateRes.status, 200);
    const activateData = await activateRes.json();
    assert.strictEqual(activateData.activeRevisionId, v2Data.variation.id);
    assert.strictEqual(activateData.project.generatedWebsite.themeAccent, 'neon-cyan');
    assert.strictEqual(activateData.project.generatedWebsite.layoutPreset, 'split');
  });

  test('should record audit logs for customization and variation lifecycle events', async () => {
    // Login as Super Admin to verify audit trail
    const superLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@digiverse.internal',
        password: 'SuperAdmin@2026!'
      })
    });
    const superData = await superLogin.json();

    const auditRes = await fetch(`${baseUrl}/api/admin/audit-logs`, {
      headers: {
        Authorization: `Bearer ${superData.token}`
      }
    });
    assert.strictEqual(auditRes.status, 200);
    const auditData = await auditRes.json();

    const actions = auditData.logs.map((l: any) => l.action);
    assert.ok(actions.includes('CUSTOMIZE_WEBSITE'));
    assert.ok(actions.includes('REGENERATE_SECTION'));
    assert.ok(actions.includes('CREATE_DESIGN_VARIATION'));
    assert.ok(actions.includes('ACTIVATE_DESIGN_VARIATION'));
  });
});
