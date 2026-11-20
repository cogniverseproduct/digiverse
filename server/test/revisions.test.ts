// Must stay the first import: prepares the isolated test environment before the app loads.
import { baseUrl } from './helpers/testContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert';

describe('Phase 8: Revision and Version Management', () => {
  let adminToken = '';
  let projectId = '';
  let rev1Id = '';
  let rev2Id = '';

  before(async () => {
    // 1. Authenticate Admin operator
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@digiverse.internal',
        password: 'Digiverse@2026!'
      })
    });
    const loginData = await loginRes.json();
    adminToken = loginData.token;

    // 2. Create client project for revision testing
    const createRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        organizationName: `Revisions Test Society ${Date.now()}`,
        category: 'cultural',
        tagline: 'Cultural Heritage Versioning Demo',
        aboutText: 'Preserving tradition across design revisions.',
        primaryColor: '#991b1b',
        accentColor: '#d97706',
        typographyStyle: 'heritage',
        websiteLanguage: 'bilingual'
      })
    });
    const created = await createRes.json();
    projectId = created.project.id;

    // 3. Generate initial website (creates Design V1)
    const genRes = await fetch(`${baseUrl}/api/projects/${projectId}/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const genData = await genRes.json();
    rev1Id = genData.project.activeRevisionId;
  });

  test('1. Unauthenticated request to list revisions should be rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}/revisions`);
    assert.strictEqual(res.status, 401);
  });

  test('2. Admin can list all revisions for a project and see active flag on V1', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}/revisions`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.revisions));
    assert.strictEqual(data.revisions.length, 1);
    assert.strictEqual(data.revisions[0].id, rev1Id);
    assert.strictEqual(data.revisions[0].isActive, true);
    assert.strictEqual(data.revisions[0].versionNumber, 1);
  });

  test('3. Admin can create a second design revision (Design V2) with alternative theme & layout', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}/variations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        label: 'Design V2 Modern Split',
        layoutPreset: 'split',
        themeAccent: 'neon-cyan',
        changelogNotes: 'Modernized split layout for tech-forward members'
      })
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.ok(data.variation);
    rev2Id = data.variation.id;
    assert.strictEqual(data.variation.versionNumber, 2);
    assert.strictEqual(data.variation.variationLabel, 'Design V2 Modern Split');
    assert.strictEqual(data.variation.websiteData.themeAccent, 'neon-cyan');
    assert.strictEqual(data.variation.websiteData.layoutPreset, 'split');
  });

  test('4. Admin can retrieve a specific revision snapshot via GET /api/projects/:id/revisions/:revisionId', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}/revisions/${rev2Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.revision);
    assert.strictEqual(data.revision.id, rev2Id);
    assert.strictEqual(data.revision.versionNumber, 2);
    assert.strictEqual(data.revision.websiteData.layoutPreset, 'split');
  });

  test('5. Admin can compare two design revisions (V1 vs V2) and receive visual & property diffs', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}/revisions/compare?baseRevisionId=${rev1Id}&targetRevisionId=${rev2Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.diff, 'Comparison diff must be returned');

    // Theme comparison
    assert.strictEqual(data.diff.theme.themeAccent.changed, true);
    assert.strictEqual(data.diff.theme.themeAccent.base, 'crimson-gold');
    assert.strictEqual(data.diff.theme.themeAccent.target, 'neon-cyan');

    // Layout comparison
    assert.strictEqual(data.diff.layout.layoutPreset.changed, true);
    assert.strictEqual(data.diff.layout.layoutPreset.base, 'editorial');
    assert.strictEqual(data.diff.layout.layoutPreset.target, 'split');

    // Changes summary text
    assert.ok(Array.isArray(data.diff.changesSummary));
    assert.ok(data.diff.changesSummary.some((s: string) => s.includes('neon-cyan')));
  });

  test('6. Admin can update changelog notes and variation label for a revision', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}/revisions/${rev2Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        changelogNotes: 'Audited and calibrated for executive presentation',
        variationLabel: 'Design V2 Calibrated'
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.revision.variationLabel, 'Design V2 Calibrated');
    assert.strictEqual(data.revision.changelogNotes, 'Audited and calibrated for executive presentation');
  });

  test('7. Activating Design V2 makes it the active website design', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}/variations/${rev2Id}/activate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.activeRevisionId, rev2Id);
    assert.strictEqual(data.project.generatedWebsite.themeAccent, 'neon-cyan');
  });

  test('8. Client approval no longer exists: the approve route is gone and no revision becomes approved', async () => {
    const tokenRes = await fetch(`${baseUrl}/api/projects/${projectId}/preview-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ revisionId: rev1Id })
    });
    const tokenData = await tokenRes.json();

    const approveRes = await fetch(`${baseUrl}/api/preview/${tokenData.previewToken.token}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approved', approvedBy: 'Cultural President' })
    });
    assert.strictEqual(approveRes.status, 404);

    const approvedRes = await fetch(`${baseUrl}/api/projects/${projectId}/revisions/approved`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(approvedRes.status, 200);
    const approvedData = await approvedRes.json();
    assert.strictEqual(approvedData.hasApprovedRevision, false);
  });

  test('9. Rollback to Design V1 restores active design while preserving revision history', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}/revisions/${rev1Id}/rollback`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.activeRevisionId, rev1Id);
    assert.strictEqual(data.project.generatedWebsite.themeAccent, 'crimson-gold');
    assert.strictEqual(data.project.generatedWebsite.layoutPreset, 'editorial');
    assert.notStrictEqual(data.project.status, 'client_approved', 'nothing is approved any more');

    // Confirm that all revisions still exist in the database (never destroyed)
    const listRes = await fetch(`${baseUrl}/api/projects/${projectId}/revisions`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const listData = await listRes.json();
    assert.strictEqual(listData.revisions.length, 2);
  });

  test('10. Rolling back to an already active revision returns 400', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}/revisions/${rev1Id}/rollback`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes('already the active design'));
  });

  test('11. Rolling back to Design V2 switches the active design and keeps every revision', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}/revisions/${rev2Id}/rollback`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.activeRevisionId, rev2Id);
    assert.ok(!data.project.approvedRevisionId, 'no revision is locked as approved');
  });
});
