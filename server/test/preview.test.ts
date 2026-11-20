// Must stay the first import: prepares the isolated test environment before the app loads.
import { baseUrl } from './helpers/testContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert';

describe('Phase 7: Client Preview and Feedback System', () => {
  let adminToken = '';
  let projectId = '';
  let activeTokenString = '';
  let activeTokenId = '';
  let feedbackId = '';

  before(async () => {
    // 1. Authenticate internal Admin operator
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

    // 2. Create client project for preview testing
    const createRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        organizationName: `Client Preview Test Org ${Date.now()}`,
        category: 'puja_committee',
        tagline: 'Festive Community Preview Tagline',
        aboutText: 'Puja committee dedicated to preserving tradition and community bonding.',
        primaryColor: '#b91c1c',
        accentColor: '#f59e0b',
        typographyStyle: 'heritage',
        websiteLanguage: 'bilingual'
      })
    });
    const created = await createRes.json();
    projectId = created.project.id;

    // 3. Generate initial website for the project
    await fetch(`${baseUrl}/api/projects/${projectId}/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
  });

  test('1. Unauthenticated request to generate preview token should be rejected (401)', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}/preview-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresInHours: 24 })
    });

    assert.strictEqual(res.status, 401, 'Should require authentication');
  });

  test('2. Admin can successfully generate a cryptographically secure client preview link', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}/preview-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ expiresInHours: 72 })
    });

    assert.strictEqual(res.status, 201, 'Token generation should return 201 Created');
    const data = await res.json();
    assert.ok(data.previewToken, 'Should include previewToken object');
    assert.ok(data.previewToken.token.startsWith('prev_'), 'Token should have prev_ prefix');
    assert.strictEqual(data.previewToken.isActive, true, 'Token should be active');
    assert.ok(data.previewUrl.startsWith('/preview/prev_'), 'Should return previewUrl');

    activeTokenString = data.previewToken.token;
    activeTokenId = data.previewToken.id;
  });

  test('3. Admin can list all preview tokens generated for a project', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}/preview-tokens`, {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.tokens), 'Should return tokens array');
    const found = data.tokens.find((t: any) => t.id === activeTokenId);
    assert.ok(found, 'Generated token must be in the project token list');
  });

  test('4. Public client can access read-only preview without admin credentials', async () => {
    const res = await fetch(`${baseUrl}/api/preview/${activeTokenString}`);

    assert.strictEqual(res.status, 200, 'Public preview endpoint must be accessible without login');
    const data = await res.json();

    // Verify sanitized structure
    assert.ok(data.organizationName.includes('Client Preview Test Org'), 'Should match organization name');
    assert.strictEqual(data.category, 'puja_committee');
    assert.ok(data.website, 'Website data must be present');
    assert.ok(data.website.heroHeadline, 'Hero headline must be present');
    assert.strictEqual(data.token, activeTokenString);
    assert.strictEqual(data.viewCount >= 1, true, 'View count must be incremented');

    // Security assertions: Sensitive internal admin fields must NEVER be returned
    assert.strictEqual((data as any).passwordHash, undefined, 'No passwordHash in client response');
    assert.strictEqual((data as any).users, undefined, 'No users in client response');
    assert.strictEqual((data as any).auditLogs, undefined, 'No audit logs in client response');
    assert.strictEqual((data as any).googleAccessToken, undefined, 'No Google credentials in client response');
  });

  test('5. Nonexistent preview token returns 404 with TOKEN_NOT_FOUND', async () => {
    const res = await fetch(`${baseUrl}/api/preview/prev_nonexistent_random_token_12345`);
    assert.strictEqual(res.status, 404);
    const data = await res.json();
    assert.strictEqual(data.code, 'TOKEN_NOT_FOUND');
  });

  test('6. Client submitting feedback validates required author and message fields', async () => {
    const res = await fetch(`${baseUrl}/api/preview/${activeTokenString}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorName: '',
        message: ''
      })
    });

    assert.strictEqual(res.status, 400, 'Should reject empty author and message');
  });

  test('7. Client can submit feedback and change requests on a specific section', async () => {
    const res = await fetch(`${baseUrl}/api/preview/${activeTokenString}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorName: 'Subhasish Roy',
        authorEmail: 's.roy@committee.org',
        authorRole: 'Committee Secretary',
        feedbackType: 'change_request',
        section: 'Hero Section',
        rating: 4,
        message: 'Please emphasize our golden jubilee year in the hero headline.'
      })
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.feedback, 'Feedback record should be created');
    assert.strictEqual(data.feedback.authorName, 'Subhasish Roy');
    assert.strictEqual(data.feedback.section, 'Hero Section');
    assert.strictEqual(data.feedback.rating, 4);

    feedbackId = data.feedback.id;

    // Verify project status transitioned to in_revision
    const projRes = await fetch(`${baseUrl}/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const projData = await projRes.json();
    assert.strictEqual(projData.project.status, 'in_revision', 'Project status should be in_revision');
  });

  test('8. Admin can view the client feedback queue for the project', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}/feedback`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.feedback), 'Should return feedback array');
    const item = data.feedback.find((f: any) => f.id === feedbackId);
    assert.ok(item, 'Submitted feedback should appear in admin queue');
    assert.strictEqual(item.authorName, 'Subhasish Roy');
    assert.strictEqual(item.resolved, false);
  });

  test('9. Admin can mark a feedback item as resolved', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}/feedback/${feedbackId}/resolve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ resolved: true })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.resolved, true);
  });

  test('10. The formal client approval endpoint was removed (clients keep feedback and change requests)', async () => {
    const res = await fetch(`${baseUrl}/api/preview/${activeTokenString}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approved', approvedBy: 'Debabrata Mukherjee' })
    });
    assert.strictEqual(res.status, 404);

    const projRes = await fetch(`${baseUrl}/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const projData = await projRes.json();
    assert.notStrictEqual(projData.project.status, 'client_approved');
  });

  test('11. Admin can revoke an active preview token', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}/preview-tokens/${activeTokenId}/revoke`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.message.includes('revoked'));
  });

  test('12. Accessing a revoked preview token returns 410 with TOKEN_REVOKED', async () => {
    const res = await fetch(`${baseUrl}/api/preview/${activeTokenString}`);
    assert.strictEqual(res.status, 410, 'Revoked token must return 410 Gone');
    const data = await res.json();
    assert.strictEqual(data.code, 'TOKEN_REVOKED');
  });

  test('13. Generating an already expired token and accessing it returns 410 with TOKEN_EXPIRED', async () => {
    // Generate token with negative expiry to simulate expiration
    const tokenRes = await fetch(`${baseUrl}/api/projects/${projectId}/preview-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ expiresInHours: -1 })
    });
    const tokenData = await tokenRes.json();
    const expiredToken = tokenData.previewToken.token;

    const accessRes = await fetch(`${baseUrl}/api/preview/${expiredToken}`);
    assert.strictEqual(accessRes.status, 410, 'Expired token must return 410 Gone');
    const accessData = await accessRes.json();
    assert.strictEqual(accessData.code, 'TOKEN_EXPIRED');
  });
});
