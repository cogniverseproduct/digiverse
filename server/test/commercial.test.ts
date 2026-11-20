// Must stay the first import: prepares the isolated test environment before the app loads.
import { baseUrl } from './helpers/testContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert';

describe('Phase 9: Billing, Quotations & Commercial Workflow', () => {
  let adminToken = '';
  let superAdminToken = '';
  let testProjectId = '';
  let generatedQuotationNumber = '';
  let generatedInvoiceNumber = '';

  before(async () => {
    // 1. Authenticate Admin Operator
    const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@digiverse.internal',
        password: 'Digiverse@2026!'
      })
    });
    const adminData = await adminLogin.json();
    adminToken = adminData.token;

    // 2. Authenticate Super Admin / Product Owner
    const superLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@digiverse.internal',
        password: 'SuperAdmin@2026!'
      })
    });
    const superData = await superLogin.json();
    superAdminToken = superData.token;

    // 3. Onboard a fresh client project for commercial tests
    const projectRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        organizationName: `Commercial Test Org ${Date.now()}`,
        category: 'cultural',
        tagline: 'Commercial Workflow Testing Suite',
        aboutText: 'Cultural society for testing billing and quotations workflow.',
        primaryColor: '#7c3aed',
        accentColor: '#06b6d4',
        typographyStyle: 'modern',
        websiteLanguage: 'bilingual'
      })
    });
    const projectData = await projectRes.json();
    testProjectId = projectData.project.id;
  });

  test('1. GET /api/projects/:id/commercial returns initial unquoted commercial baseline', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/commercial`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();

    assert.ok(data.commercialRecord, 'Should have commercialRecord');
    assert.strictEqual(data.commercialRecord.projectId, testProjectId);
    assert.strictEqual(data.commercialRecord.quotationAmount, 0);
    assert.strictEqual(data.commercialRecord.paymentStatus, 'unquoted');
    assert.strictEqual(data.commercialRecord.commercialStatus, 'proposal_stage');
    assert.strictEqual(data.clearance.isClearedForDelivery, false);
    assert.strictEqual(data.clearance.clearanceStatus, 'payment_pending');
  });

  test('2. POST /api/projects/:id/quotation creates structured quotation with line items and auto-calculated total', async () => {
    const scopeItems = [
      { id: 'item_1', description: 'AI Portal Synthesis & Custom Layout', quantity: 1, unitPrice: 20000, total: 20000 },
      { id: 'item_2', description: 'Google Drive Media Pipe & YouTube Sync', quantity: 1, unitPrice: 8000, total: 8000 },
      { id: 'item_3', description: '1-Year Enterprise Edge Hosting', quantity: 1, unitPrice: 7000, total: 7000 }
    ];

    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/quotation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        scopeItems,
        currency: 'INR',
        paymentTerms: '50% advance on signoff, 50% upon client approval prior to live publishing',
        validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
        notes: 'Official quotation for custom AI portal.'
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.commercialRecord.quotationAmount, 35000); // 20000 + 8000 + 7000
    assert.strictEqual(data.commercialRecord.paymentStatus, 'quotation_sent');
    assert.ok(data.commercialRecord.quotationNumber.startsWith('QUO-'));
    generatedQuotationNumber = data.commercialRecord.quotationNumber;
    assert.strictEqual(data.commercialRecord.scopeItems?.length, 3);
  });

  test('3. Quotation status transition to "accepted" automatically advances commercial status to "contract_signed"', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/quotation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        quotationNumber: generatedQuotationNumber,
        quotationStatus: 'accepted'
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.commercialRecord.quotationStatus, 'accepted');
    assert.strictEqual(data.commercialRecord.commercialStatus, 'contract_signed');
  });

  test('4. POST /api/projects/:id/invoice issues official invoice with generated invoice number', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        notes: 'Invoice for 50% advance payment.'
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.commercialRecord.invoiceNumber.startsWith('INV-'));
    generatedInvoiceNumber = data.commercialRecord.invoiceNumber;
    assert.strictEqual(data.commercialRecord.invoiceStatus, 'issued');
    assert.ok(data.commercialRecord.invoiceDate);
  });

  test('5. Delivery clearance remains pending prior to any payment', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/commercial`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert.strictEqual(data.clearance.isClearedForDelivery, false);
    assert.strictEqual(data.clearance.clearanceStatus, 'payment_pending');
  });

  test('6. POST /api/projects/:id/payments records partial advance payment, transitioning payment status to advance_paid', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        amount: 17500,
        currency: 'INR',
        paymentMethod: 'upi',
        transactionReference: 'UPI-TEST-987654',
        notes: 'Received 50% advance via UPI.'
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.commercialRecord.amountPaid, 17500);
    assert.strictEqual(data.commercialRecord.paymentStatus, 'advance_paid');
    assert.strictEqual(data.clearance.isClearedForDelivery, true);
    assert.strictEqual(data.clearance.clearanceStatus, 'advance_cleared');
    assert.strictEqual(data.commercialRecord.transactions?.length, 1);
  });

  test('7. POST /api/projects/:id/payments records remaining balance, transitioning status to fully_paid and invoice to paid', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        amount: 17500,
        currency: 'INR',
        paymentMethod: 'bank_transfer',
        transactionReference: 'NEFT-HDFC-112233',
        notes: 'Received final 50% settlement via NEFT.'
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.commercialRecord.amountPaid, 35000);
    assert.strictEqual(data.commercialRecord.paymentStatus, 'fully_paid');
    assert.strictEqual(data.commercialRecord.invoiceStatus, 'paid');
    assert.strictEqual(data.clearance.isClearedForDelivery, true);
    assert.strictEqual(data.clearance.clearanceStatus, 'cleared');
    assert.strictEqual(data.commercialRecord.transactions?.length, 2);
  });

  test('8. PATCH /api/projects/:id/commercial-status updates stage to completed', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/commercial-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        commercialStatus: 'completed',
        notes: 'Commercial engagement fulfilled and fully closed.'
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.commercialRecord.commercialStatus, 'completed');
  });

  test('9. Commercial on_hold status suspends delivery clearance even if fully paid', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/commercial-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        commercialStatus: 'on_hold',
        notes: 'Client requested hold due to governance changes.'
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.commercialRecord.commercialStatus, 'on_hold');
    assert.strictEqual(data.clearance.isClearedForDelivery, false);
    assert.strictEqual(data.clearance.clearanceStatus, 'on_hold');

    // Restore back to completed
    await fetch(`${baseUrl}/api/projects/${testProjectId}/commercial-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ commercialStatus: 'completed' })
    });
  });

  test('10. GET /api/commercial/overview gives Super Admin aggregated financial analytics', async () => {
    const res = await fetch(`${baseUrl}/api/commercial/overview`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.overview, 'Should contain overview object');
    assert.ok(data.overview.totalQuotedPipeline >= 35000);
    assert.ok(data.overview.totalRevenueCollected >= 35000);
    assert.ok(data.overview.totalInvoicesIssued >= 1);
    assert.ok(data.overview.recentTransactions.length >= 2);
  });

  test('11. GET /api/commercial/overview rejects non-Super-Admin with 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/commercial/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.ok(data.error.includes('privileges') || data.error.includes('permission') || data.error.includes('Forbidden') || data.error.includes('Access denied'));
  });

  test('12. Unauthenticated requests to commercial endpoints are strictly rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/commercial`);
    assert.strictEqual(res.status, 401);
  });
});
