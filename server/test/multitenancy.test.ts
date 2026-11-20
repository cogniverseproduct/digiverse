// Must stay the first import: prepares the isolated test environment before the app loads.
import { baseUrl, getDatabase } from './helpers/testContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { repository } from '../src/db/repository.js';
import { Tenant, ClientProject, ProjectRevision, CommercialRecord } from '../src/types/index.js';

describe('Phase 3: Relational Database, Multi-Tenancy & Core Backend', () => {
  let adminToken = '';

  before(async () => {
    // Login as Admin to obtain valid operational JWT token
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

  test('should create a new client organization tenant with complete metadata', async () => {
    const orgName = `Bengal Heritage Society ${Date.now()}`;
    const res = await fetch(`${baseUrl}/api/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: orgName,
        category: 'cultural',
        subcategory: 'Heritage Foundation',
        contactPerson: 'Arup Majumder',
        contactEmail: 'contact@bengalheritage.org',
        contactPhone: '+91 98301 99999',
        address: '14 Southern Avenue, Kolkata',
        websiteLanguage: 'bilingual'
      })
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.tenant.name, orgName);
    assert.ok(data.tenant.id.startsWith('tenant_'));
    assert.strictEqual(data.tenant.contactPerson, 'Arup Majumder');
  });

  test('should reject duplicate tenant slugs with 409 Conflict', async () => {
    const orgName = 'Identical Unique Organization Name';
    // Create first
    await fetch(`${baseUrl}/api/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: orgName,
        category: 'cultural',
        contactPerson: 'Secretary',
        contactEmail: 'dup1@org.internal'
      })
    });

    // Attempt second with identical name
    const dupRes = await fetch(`${baseUrl}/api/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: orgName,
        category: 'cultural',
        contactPerson: 'Secretary',
        contactEmail: 'dup2@org.internal'
      })
    });

    assert.strictEqual(dupRes.status, 409);
    const dupData = await dupRes.json();
    assert.ok(dupData.error.includes('already exists'));
  });

  test('should enforce strict tenant data isolation between different client organizations', async () => {
    const tenant1Id = `tenant_iso_1_${Date.now()}`;
    const tenant2Id = `tenant_iso_2_${Date.now()}`;

    // Seed two independent tenants directly in repository
    await repository.saveTenant({
      id: tenant1Id,
      slug: `org-alpha-${Date.now()}`,
      name: 'Alpha Sports Academy',
      category: 'sports',
      contactPerson: 'Coach Rahul',
      contactEmail: 'alpha@sports.internal',
      websiteLanguage: 'english',
      createdByAdminId: 'usr_admin_01',
      assignedAdminId: 'usr_admin_01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await repository.saveTenant({
      id: tenant2Id,
      slug: `org-beta-${Date.now()}`,
      name: 'Beta Welfare Trust',
      category: 'community',
      contactPerson: 'Director Priya',
      contactEmail: 'beta@trust.internal',
      websiteLanguage: 'bilingual',
      createdByAdminId: 'usr_admin_01',
      assignedAdminId: 'usr_admin_01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Create a project under Tenant 1
    const project1Id = `proj_alpha_${Date.now()}`;
    await repository.saveProject({
      id: project1Id,
      tenantId: tenant1Id,
      tenantSlug: 'alpha-sports',
      requirements: {
        organizationName: 'Alpha Sports Academy',
        organizationType: 'sports',
        tagline: 'Striving for Athletic Excellence',
        contactEmail: 'alpha@sports.internal',
        contactPhone: '+91 99999 11111',
        primaryColor: '#0284C7',
        accentColor: '#38BDF8',
        typographyStyle: 'athletic',
        aboutText: 'Premier athletic training academy.',
        enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true },
        events: [],
        committee: [],
        gallery: []
      },
      status: 'requirements_collected',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Create a project under Tenant 2
    const project2Id = `proj_beta_${Date.now()}`;
    await repository.saveProject({
      id: project2Id,
      tenantId: tenant2Id,
      tenantSlug: 'beta-welfare',
      requirements: {
        organizationName: 'Beta Welfare Trust',
        organizationType: 'community',
        tagline: 'Empowering Underprivileged Communities',
        contactEmail: 'beta@trust.internal',
        contactPhone: '+91 99999 22222',
        primaryColor: '#059669',
        accentColor: '#10B981',
        typographyStyle: 'civic',
        aboutText: 'Dedicated to grassroots community support.',
        enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true },
        events: [],
        committee: [],
        gallery: []
      },
      status: 'requirements_collected',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Verify isolation via repository:
    const tenant1Projects = await repository.listProjects(tenant1Id);
    assert.strictEqual(tenant1Projects.length, 1);
    assert.strictEqual(tenant1Projects[0].id, project1Id);
    assert.strictEqual(tenant1Projects[0].requirements.organizationName, 'Alpha Sports Academy');

    const tenant2Projects = await repository.listProjects(tenant2Id);
    assert.strictEqual(tenant2Projects.length, 1);
    assert.strictEqual(tenant2Projects[0].id, project2Id);
    assert.strictEqual(tenant2Projects[0].requirements.organizationName, 'Beta Welfare Trust');

    // Confirm that Tenant 1 never sees Tenant 2 project
    assert.ok(!tenant1Projects.some(p => p.id === project2Id));
    assert.ok(!tenant2Projects.some(p => p.id === project1Id));
  });

  test('should support multiple design revisions (V1, V2) under same project', async () => {
    const testProjectId = `proj_rev_test_${Date.now()}`;
    await repository.saveProject({
      id: testProjectId,
      tenantSlug: 'rev-test',
      requirements: {
        organizationName: 'Revision Test Organization',
        organizationType: 'cultural',
        tagline: 'Test Motto',
        contactEmail: 'test@org.internal',
        contactPhone: '+91 00000 00000',
        primaryColor: '#880000',
        accentColor: '#FFBB00',
        typographyStyle: 'heritage',
        aboutText: 'Testing revision branch management.',
        enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true },
        events: [],
        committee: [],
        gallery: []
      },
      status: 'generating',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Create Revision V1
    const rev1 = await repository.createRevision({
      id: `rev_1_${Date.now()}`,
      projectId: testProjectId,
      versionNumber: 1,
      variationLabel: 'V1 - Classic Editorial',
      websiteData: {
        themeAccent: 'crimson-gold',
        layoutPreset: 'editorial',
        fontFamily: 'Inter, serif',
        simulatedDomain: 'rev-test.digiverse.site',
        heroHeadline: 'Classic Editorial Headline',
        heroDescription: 'V1 Description',
        metrics: [],
        eventsTitle: 'Events',
        eventsList: [],
        aboutContent: 'About V1',
        committeeTitle: 'Committee',
        committeeList: [],
        galleryTitle: 'Gallery',
        galleryList: []
      },
      isApproved: false,
      createdByAdminId: 'usr_admin_01',
      changelogNotes: 'Baseline generation',
      createdAt: new Date().toISOString()
    });

    // Create Revision V2
    const rev2 = await repository.createRevision({
      id: `rev_2_${Date.now()}`,
      projectId: testProjectId,
      versionNumber: 2,
      variationLabel: 'V2 - Modern Split Screen',
      websiteData: {
        themeAccent: 'neon-cyan',
        layoutPreset: 'split',
        fontFamily: 'Inter, sans-serif',
        simulatedDomain: 'rev-test.digiverse.site',
        heroHeadline: 'Modern Split Screen Headline',
        heroDescription: 'V2 Description with updated accent',
        metrics: [],
        eventsTitle: 'Events',
        eventsList: [],
        aboutContent: 'About V2',
        committeeTitle: 'Committee',
        committeeList: [],
        galleryTitle: 'Gallery',
        galleryList: []
      },
      isApproved: false,
      createdByAdminId: 'usr_admin_01',
      changelogNotes: 'Modernized layout preset to split screen with neon accent',
      createdAt: new Date().toISOString()
    });

    // Query revisions list
    const revisions = await repository.listRevisionsByProject(testProjectId);
    assert.strictEqual(revisions.length, 2);
    assert.strictEqual(revisions[0].versionNumber, 1);
    assert.strictEqual(revisions[0].variationLabel, 'V1 - Classic Editorial');
    assert.strictEqual(revisions[1].versionNumber, 2);
    assert.strictEqual(revisions[1].variationLabel, 'V2 - Modern Split Screen');
  });

  test('should manage commercial records and payment status for project', async () => {
    const testProjectId = `proj_comm_test_${Date.now()}`;
    const commRecord: CommercialRecord = {
      id: `comm_${Date.now()}`,
      projectId: testProjectId,
      quotationAmount: 45000,
      currency: 'INR',
      paymentStatus: 'advance_paid',
      invoiceNumber: 'INV-2026-042',
      commercialStatus: 'contract_signed',
      notes: '50% advance received upon requirements signoff.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await repository.saveCommercialRecord(commRecord);

    const fetched = await repository.getCommercialRecord(testProjectId);
    assert.ok(fetched);
    assert.strictEqual(fetched.quotationAmount, 45000);
    assert.strictEqual(fetched.paymentStatus, 'advance_paid');
    assert.strictEqual(fetched.invoiceNumber, 'INV-2026-042');

    // Update to fully_paid
    commRecord.paymentStatus = 'fully_paid';
    commRecord.commercialStatus = 'completed';
    commRecord.updatedAt = new Date().toISOString();
    await repository.saveCommercialRecord(commRecord);

    const updated = await repository.getCommercialRecord(testProjectId);
    assert.ok(updated);
    assert.strictEqual(updated.paymentStatus, 'fully_paid');
    assert.strictEqual(updated.commercialStatus, 'completed');
  });

  test('should cascade delete tenant and all associated projects and assets', async () => {
    const cascadeTenantId = `tenant_cascade_${Date.now()}`;
    const cascadeProjectId = `proj_cascade_${Date.now()}`;

    await repository.saveTenant({
      id: cascadeTenantId,
      slug: `cascade-test-${Date.now()}`,
      name: 'Cascade Test Club',
      category: 'sports',
      contactPerson: 'Manager',
      contactEmail: 'cascade@test.internal',
      websiteLanguage: 'english',
      createdByAdminId: 'usr_admin_01',
      assignedAdminId: 'usr_admin_01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await repository.saveProject({
      id: cascadeProjectId,
      tenantId: cascadeTenantId,
      tenantSlug: 'cascade-test',
      requirements: {
        organizationName: 'Cascade Test Club',
        organizationType: 'sports',
        tagline: 'Testing Cascade',
        contactEmail: 'cascade@test.internal',
        contactPhone: '+91 00000 11111',
        primaryColor: '#111111',
        accentColor: '#EEEEEE',
        typographyStyle: 'athletic',
        aboutText: 'Cascade test description.',
        enabledSections: { hero: true, events: true, about: true, committee: true, gallery: true, contact: true },
        events: [],
        committee: [],
        gallery: []
      },
      status: 'requirements_collected',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Delete tenant
    const deleted = await repository.deleteTenant(cascadeTenantId);
    assert.strictEqual(deleted, true);

    // Verify tenant is gone
    const tenantCheck = await repository.getTenantById(cascadeTenantId);
    assert.strictEqual(tenantCheck, null);

    // Verify project under tenant was cascaded
    const projectCheck = await repository.getProjectById(cascadeProjectId);
    assert.strictEqual(projectCheck, null);
  });
});
