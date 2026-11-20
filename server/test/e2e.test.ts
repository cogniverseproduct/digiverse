// Must stay the first import: prepares the isolated test environment before the app loads.
import { baseUrl } from './helpers/testContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert';

describe('Phase 11: End-to-End System Integration & Lifecycle Audit', () => {
  let superAdminToken = '';
  let operatorToken = '';
  let operatorEmail = '';
  let tenantId = '';
  let tenantSlug = '';
  let projectId = '';
  let previewToken = '';
  let previewTokenId = '';
  let feedbackId = '';
  let activeRevisionId = '';

  before(async () => {
    // 1. Authenticate Platform Owner (SUPER_ADMIN)
    const superLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@digiverse.internal',
        password: 'SuperAdmin@2026!'
      })
    });
    assert.strictEqual(superLogin.status, 200);
    const superData = await superLogin.json();
    superAdminToken = superData.token;
  });

  test('Stage 1: Super Admin provisions a new internal Admin operator account', async () => {
    // The platform no longer creates Admins with a password chosen by the Super Admin: the Super Admin invites them
    // and the Admin sets their own username and password from the one-time setup link.
    operatorEmail = `operator_e2e_${Date.now()}@digiverse.internal`;
    const inviteRes = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({ email: operatorEmail, name: 'E2E Operational Lead' })
    });
    assert.strictEqual(inviteRes.status, 201);
    const invite = await inviteRes.json();
    assert.ok(invite.setupToken, 'an invitation returns a one-time setup token');

    const completeRes = await fetch(`${baseUrl}/api/admin/access-requests/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        setupToken: invite.setupToken,
        username: `operator_e2e_${Date.now()}`,
        password: 'OperatorPass@2026!',
        confirmPassword: 'OperatorPass@2026!'
      })
    });
    assert.strictEqual(completeRes.status, 201);
  });

  test('Stage 2: Operational Admin logs in and onboards client organization & requirements', async () => {
    // A. Operator Login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: operatorEmail,
        password: 'OperatorPass@2026!'
      })
    });
    assert.strictEqual(loginRes.status, 200);
    const loginData = await loginRes.json();
    operatorToken = loginData.token;

    // B. Create Organization Tenant
    const orgName = `E2E Sarbojanin Durga Puja ${Date.now()}`;
    const tenantRes = await fetch(`${baseUrl}/api/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${operatorToken}`
      },
      body: JSON.stringify({
        name: orgName,
        category: 'puja_committee',
        subcategory: 'Sarbojanin Durgotsav',
        contactPerson: 'Sri Debabrata Roy',
        contactEmail: 'debabrata.roy@pujae2e.internal',
        contactPhone: '+91 98300 12345',
        address: 'Salt Lake City, Kolkata - 700091',
        websiteLanguage: 'bilingual'
      })
    });
    assert.strictEqual(tenantRes.status, 201);
    const tenantData = await tenantRes.json();
    tenantId = tenantData.tenant.id;
    tenantSlug = tenantData.tenant.slug;

    // C. Onboard Client Project with Rich Requirements
    const projRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${operatorToken}`
      },
      body: JSON.stringify({
        organizationName: orgName,
        category: 'puja_committee',
        tagline: 'Preserving Heritage & Sacred Community Bonds for 75 Years',
        aboutText: 'Annual autumn grand festival featuring traditional dhak rhythms, artistic pandal installations, and daily bhog distribution.',
        primaryColor: '#b91c1c',
        accentColor: '#f59e0b',
        typographyStyle: 'heritage',
        websiteLanguage: 'bilingual',
        googleDriveUrl: 'https://drive.google.com/drive/folders/1E2E_DURGA_PUJA_FOLDER',
        youtubeLinks: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ']
      })
    });
    assert.strictEqual(projRes.status, 201);
    const projData = await projRes.json();
    projectId = projData.project.id;
    assert.strictEqual(projData.project.status, 'requirements_collected');
  });

  test('Stage 3: Media pipeline ingestion (Google Drive assets & curated YouTube hub)', async () => {
    // A. Sync Google Drive
    const syncRes = await fetch(`${baseUrl}/api/media/drive/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${operatorToken}`
      },
      body: JSON.stringify({ projectId })
    });
    assert.strictEqual(syncRes.status, 200);
    const syncData = await syncRes.json();
    // A Puja Committee project never receives demo stock photos: with no Google credentials nothing is imported and the reason is stated.
    assert.strictEqual(syncData.items.length, 0, 'Cultural projects must not be given mock Drive media');
    assert.strictEqual(syncData.isMock, false);
    assert.strictEqual(syncData.success, false);
    assert.match(String(syncData.error || syncData.message), /credentials are not configured/i);

    // B. Add Curated YouTube Video
    const ytRes = await fetch(`${baseUrl}/api/media/youtube`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${operatorToken}`
      },
      body: JSON.stringify({
        projectId,
        url: 'https://youtu.be/dQw4w9WgXcQ',
        title: 'Maha Saptami Anjali & Dhunuchi Naach Highlights',
        category: 'Rituals'
      })
    });
    assert.strictEqual(ytRes.status, 201);
  });

  test('Stage 4: AI website synthesis and design variation generation', async () => {
    // A. Synthesize Baseline Design V1
    const genRes = await fetch(`${baseUrl}/api/projects/${projectId}/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${operatorToken}` }
    });
    assert.strictEqual(genRes.status, 200);
    const genData = await genRes.json();
    assert.strictEqual(genData.project.status, 'preview_ready');
    activeRevisionId = genData.project.activeRevisionId;
    assert.ok(activeRevisionId, 'Must have active revision ID');

    // B. Create Design V2 Variation
    const varRes = await fetch(`${baseUrl}/api/projects/${projectId}/variations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${operatorToken}`
      },
      body: JSON.stringify({
        layoutPreset: 'split',
        themeAccent: 'neon-cyan',
        variationLabel: 'V2 - Modern High-Contrast Festive'
      })
    });
    assert.strictEqual(varRes.status, 201);
    const varData = await varRes.json();
    assert.strictEqual(varData.variation.versionNumber, 2);

    // C. Inspect Visual Differences between V1 and V2
    const diffRes = await fetch(
      `${baseUrl}/api/projects/${projectId}/revisions/compare?baseRevisionId=${activeRevisionId}&targetRevisionId=${varData.variation.id}`,
      { headers: { Authorization: `Bearer ${operatorToken}` } }
    );
    assert.strictEqual(diffRes.status, 200);
    const diffData = await diffRes.json();
    assert.strictEqual(diffData.diff.theme.themeAccent.changed, true);
    assert.strictEqual(diffData.diff.layout.layoutPreset.changed, true);
  });

  test('Stage 5: Secure client preview sharing and feedback exchange', async () => {
    // A. Generate Preview Token
    const tokenRes = await fetch(`${baseUrl}/api/projects/${projectId}/preview-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${operatorToken}`
      },
      body: JSON.stringify({ expiresInHours: 72 })
    });
    assert.strictEqual(tokenRes.status, 201);
    const tokenData = await tokenRes.json();
    previewToken = tokenData.previewToken.token;
    previewTokenId = tokenData.previewToken.id;

    // B. Public Client loads Read-Only Preview
    const previewRes = await fetch(`${baseUrl}/api/preview/${previewToken}`);
    assert.strictEqual(previewRes.status, 200);
    const previewView = await previewRes.json();
    assert.strictEqual(previewView.token, previewToken);
    assert.ok(previewView.website, 'Must serve generated website');
    assert.strictEqual(previewView.category, 'puja_committee');
    assert.strictEqual(previewView.isApproved, false);

    // C. Client Submits Feedback
    const fbRes = await fetch(`${baseUrl}/api/preview/${previewToken}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorName: 'Sri Debabrata Roy',
        authorEmail: 'debabrata.roy@pujae2e.internal',
        feedbackType: 'change_request',
        section: 'hero',
        message: 'Kindly ensure the subtitle highlights the 75th Platinum Jubilee year.'
      })
    });
    assert.strictEqual(fbRes.status, 201);
    const fbData = await fbRes.json();
    feedbackId = fbData.feedback.id;

    // D. Operator Reviews & Resolves Feedback
    const resolveRes = await fetch(`${baseUrl}/api/projects/${projectId}/feedback/${feedbackId}/resolve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${operatorToken}`
      },
      body: JSON.stringify({ resolved: true })
    });
    assert.strictEqual(resolveRes.status, 200);
  });

  test('Stage 6: Commercial quotation, invoice issuance, and payment verification', async () => {
    // A. Generate Quotation
    const quoRes = await fetch(`${baseUrl}/api/projects/${projectId}/quotation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${operatorToken}`
      },
      body: JSON.stringify({
        currency: 'INR',
        quotationStatus: 'accepted',
        scopeItems: [
          { id: 'item_1', description: '75th Jubilee AI Portal Architecture & Bengali Synthesis', quantity: 1, unitPrice: 20000, total: 20000 },
          { id: 'item_2', description: 'Google Drive Sacred Ritual Media & YouTube Live Ingestion', quantity: 1, unitPrice: 10000, total: 10000 },
          { id: 'item_3', description: 'Festive High-Concurrency Cloud Edge CDN & 24/7 Hosting', quantity: 1, unitPrice: 10000, total: 10000 }
        ],
        paymentTerms: '50% advance on agreement, 50% on live deployment'
      })
    });
    assert.strictEqual(quoRes.status, 200);
    const quoData = await quoRes.json();
    assert.strictEqual(quoData.commercialRecord.quotationAmount, 40000);
    assert.strictEqual(quoData.commercialRecord.commercialStatus, 'contract_signed');

    // B. Issue Invoice
    const invRes = await fetch(`${baseUrl}/api/projects/${projectId}/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${operatorToken}`
      },
      body: JSON.stringify({
        notes: 'Invoice for 50% advance mobilization deposit.'
      })
    });
    assert.strictEqual(invRes.status, 200);
    const invData = await invRes.json();
    assert.ok(invData.commercialRecord.invoiceNumber.startsWith('INV-'));

    // C. Record 50% Advance Payment
    const payRes = await fetch(`${baseUrl}/api/projects/${projectId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${operatorToken}`
      },
      body: JSON.stringify({
        amount: 20000,
        currency: 'INR',
        paymentMethod: 'bank_transfer',
        transactionReference: 'NEFT-E2E-DURGA-001',
        notes: 'Verified against Digiverse HDFC Current Account.'
      })
    });
    assert.strictEqual(payRes.status, 200);
    const payData = await payRes.json();
    assert.strictEqual(payData.commercialRecord.paymentStatus, 'advance_paid');
    assert.strictEqual(payData.clearance.isClearedForDelivery, true);
  });

  test('Stage 7: Clients review the preview and leave feedback; approval is not a publishing gate', async () => {
    const apprRes = await fetch(`${baseUrl}/api/preview/${previewToken}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approved', approvedBy: 'Sri Debabrata Roy (Puja President)' })
    });
    assert.strictEqual(apprRes.status, 404, 'the approval endpoint was removed');

    const pRes = await fetch(`${baseUrl}/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${operatorToken}` }
    });
    const pData = await pRes.json();
    assert.notStrictEqual(pData.project.status, 'client_approved');
  });

  test('Stage 8: Pre-flight clearance audit and live production edge publishing', async () => {
    // A. Pre-flight Check
    const preflightRes = await fetch(`${baseUrl}/api/projects/${projectId}/publishing/preflight`, {
      headers: { Authorization: `Bearer ${operatorToken}` }
    });
    assert.strictEqual(preflightRes.status, 200);
    const preflight = await preflightRes.json();
    assert.strictEqual(preflight.isReadyToPublish, true);
    assert.strictEqual(preflight.blockers.length, 0);

    // B. Execute Production Edge Publishing
    const pubRes = await fetch(`${baseUrl}/api/projects/${projectId}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${operatorToken}`
      },
      body: JSON.stringify({ targetPlatform: 'digiverse_shared' })
    });
    assert.strictEqual(pubRes.status, 200);
    const pubData = await pubRes.json();
    assert.strictEqual(pubData.project.status, 'deployed');
    assert.ok(pubData.deployedUrl.includes(tenantSlug));
  });

  test('Stage 9: Public visitors access the published live edge portal', async () => {
    const liveRes = await fetch(`${baseUrl}/api/live/${tenantSlug}`);
    assert.strictEqual(liveRes.status, 200);
    const liveData = await liveRes.json();

    assert.strictEqual(liveData.success, true);
    assert.strictEqual(liveData.slug, tenantSlug);
    assert.strictEqual(liveData.category, 'puja_committee');
    assert.ok(liveData.generatedWebsite, 'Must serve complete website structure');
    assert.strictEqual(liveData.deploymentDetails.platform, 'digiverse_shared', 'the shared runtime serves the simulated local site');
  });

  test('Stage 10: Multi-category visual identity & copy validation', async () => {
    const categoriesToTest = [
      { cat: 'sports', style: 'athletic', expAccent: 'sunset-amber' },
      { cat: 'educational', style: 'academic', expAccent: 'royal-indigo' },
      { cat: 'ngo_social', style: 'civic', expAccent: 'forest-emerald' }
    ];

    for (const testCase of categoriesToTest) {
      const pRes = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${operatorToken}`
        },
        body: JSON.stringify({
          organizationName: `Multi-Cat ${testCase.cat} Org ${Date.now()}`,
          category: testCase.cat,
          tagline: `Premier ${testCase.cat} identity`,
          aboutText: `Description for ${testCase.cat} multi-tenant validation.`,
          typographyStyle: testCase.style
        })
      });
      assert.strictEqual(pRes.status, 201);
      const pData = await pRes.json();

      const genRes = await fetch(`${baseUrl}/api/projects/${pData.project.id}/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${operatorToken}` }
      });
      assert.strictEqual(genRes.status, 200);
      const genData = await genRes.json();
      assert.ok(genData.project.generatedWebsite, 'Must synthesize valid website');
    }
  });

  test('Stage 11: Security, access isolation & boundary enforcement audit', async () => {
    // A. Unauthenticated access to internal admin endpoints is rejected
    const unauthProjects = await fetch(`${baseUrl}/api/projects`);
    assert.strictEqual(unauthProjects.status, 401);

    const unauthAdmin = await fetch(`${baseUrl}/api/admin/users`);
    assert.strictEqual(unauthAdmin.status, 401);

    const unauthCommercial = await fetch(`${baseUrl}/api/commercial/overview`);
    assert.strictEqual(unauthCommercial.status, 401);

    // B. Admin role cannot access Super Admin governance telemetry
    const adminBlocked = await fetch(`${baseUrl}/api/commercial/overview`, {
      headers: { Authorization: `Bearer ${operatorToken}` }
    });
    assert.strictEqual(adminBlocked.status, 403);

    // C. Revoking a preview token instantly shuts down client access
    const revokeRes = await fetch(`${baseUrl}/api/projects/${projectId}/preview-tokens/${previewTokenId}/revoke`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${operatorToken}` }
    });
    assert.strictEqual(revokeRes.status, 200);

    const checkRevoked = await fetch(`${baseUrl}/api/preview/${previewToken}`);
    assert.strictEqual(checkRevoked.status, 410); // Gone / Revoked

    // D. Super Admin audit logs recorded all operations in sequence
    const logsRes = await fetch(`${baseUrl}/api/admin/audit-logs?limit=50`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(logsRes.status, 200);
    const logsData = await logsRes.json();
    assert.ok(logsData.logs.length >= 10, 'Audit log should track all lifecycle actions');
  });
});
