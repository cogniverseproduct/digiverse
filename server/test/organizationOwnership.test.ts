// Must stay the first import: prepares the isolated test environment (temporary database, no real server) before the app loads.
import { baseUrl, getDatabase, FIXTURE_ADMIN, FIXTURE_SUPER_ADMIN } from './helpers/testContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

/**
 * Organisation ownership: who may create a project under an existing organisation name, how a blocked Admin is told,
 * and how a Super Admin resolves organisations whose owner is missing or disabled.
 */

async function call(method: string, route: string, body?: unknown, token?: string): Promise<{ status: number; data: any; text: string }> {
  const res = await fetch(`${baseUrl}${route}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { data = null; }
  return { status: res.status, data, text };
}

let adminToken = ''; let adminId = '';
let otherToken = ''; let otherId = '';
let superToken = '';
let disabledId = '';

async function login(identity: { email: string; password: string }) {
  const r = await call('POST', '/api/auth/login', { email: identity.email, password: identity.password });
  assert.equal(r.status, 200, `login failed for ${identity.email}: ${r.text}`);
  return { token: r.data.token as string, id: r.data.user.id as string };
}

const portfolio = (name: string) => ({ requirements: { organizationName: name, category: 'portfolio', portfolioArchetype: 'developer', tagline: 'Test portfolio', aboutText: 'Created by the ownership tests.' } });

/** Inserts a tenant row directly, the way older databases hold them. */
function insertTenant(slug: string, createdBy: string, assignedTo: string) {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO tenants (id, slug, name, organization_type, category, contact_person, contact_email, website_language, created_by_admin_id, assigned_admin_id, created_at, updated_at)
              VALUES (?, ?, ?, 'portfolio', 'portfolio', 'Test', 'legacy@example.test', 'english', ?, ?, ?, ?)`)
    .run(`tenant_${randomUUID()}`, slug, slug, createdBy, assignedTo, now, now);
  return slug;
}

before(async () => {
  ({ token: adminToken, id: adminId } = await login(FIXTURE_ADMIN));
  ({ token: superToken } = await login(FIXTURE_SUPER_ADMIN));

  const [{ repository }, bcrypt] = await Promise.all([import('../src/db/repository.js'), import('bcryptjs')]);
  const other = { email: 'owner-test-second@digiverse.internal', username: 'owner-test-second', password: 'SecondAdmin@2026!' };
  await repository.createUser({ id: randomUUID(), email: other.email, username: other.username, passwordHash: await bcrypt.default.hash(other.password, 10), name: 'Second Admin', role: 'ADMIN', isActive: true });
  ({ token: otherToken, id: otherId } = await login(other));

  // A disabled Admin who still owns organisations (the situation of the original seed account).
  disabledId = randomUUID();
  await repository.createUser({ id: disabledId, email: 'disabled-owner@digiverse.internal', username: 'disabled-owner', passwordHash: await bcrypt.default.hash('Disabled@2026!', 10), name: 'Former Admin', role: 'ADMIN', isActive: true });
  await repository.disableUser(disabledId, 'ownership test');
});

describe('Organisation names and ownership', () => {
  test('a genuinely new organisation can be created and is persisted', async () => {
    const r = await call('POST', '/api/projects', portfolio('Ownership New Person'), adminToken);
    assert.equal(r.status, 201, r.text);
    assert.equal(r.data.reusedOrganization, false);
    const stored = await call('GET', `/api/projects/${r.data.project.id}`, undefined, adminToken);
    assert.equal(stored.status, 200);
    assert.equal(stored.data.project.requirements.organizationName, 'Ownership New Person');
    const tenant = getDatabase().prepare('SELECT assigned_admin_id a, created_by_admin_id c FROM tenants WHERE slug = ?').get('ownership-new-person') as any;
    assert.equal(tenant.a, adminId);
    assert.equal(tenant.c, adminId);
  });

  test('the same Admin reuses their organisation; the stored organisation record is left unchanged', async () => {
    const first = await call('POST', '/api/projects', portfolio('Ownership Reuse Person'), adminToken);
    assert.equal(first.status, 201);
    const before = JSON.stringify(getDatabase().prepare('SELECT * FROM tenants WHERE slug = ?').get('ownership-reuse-person'));

    const second = await call('POST', '/api/projects', portfolio('Ownership Reuse Person'), adminToken);
    assert.equal(second.status, 201, second.text);
    assert.equal(second.data.reusedOrganization, true);
    assert.equal(second.data.project.tenantId, first.data.project.tenantId);
    assert.equal(JSON.stringify(getDatabase().prepare('SELECT * FROM tenants WHERE slug = ?').get('ownership-reuse-person')), before, 'tenant row must not be overwritten');
    const count = getDatabase().prepare('SELECT COUNT(*) n FROM projects WHERE tenant_id = ?').get(first.data.project.tenantId) as any;
    assert.equal(count.n, 2);
  });

  test('another Admin is refused with an actionable message that does not reveal the owner', async () => {
    const mine = await call('POST', '/api/projects', portfolio('Ownership Private Person'), adminToken);
    assert.equal(mine.status, 201);

    const r = await call('POST', '/api/projects', portfolio('Ownership Private Person'), otherToken);
    assert.equal(r.status, 409);
    assert.equal(r.data.code, 'ORGANIZATION_NOT_AVAILABLE');
    assert.match(r.data.error, /ask a Super Admin to assign it to you/i);
    assert.match(r.data.error, /choose a different name/i);
    for (const secret of [FIXTURE_ADMIN.email, FIXTURE_ADMIN.username, adminId, 'Fixture Admin']) assert.ok(!r.text.includes(secret), `message leaked "${secret}"`);

    // and they cannot reach it any other way
    assert.equal((await call('GET', `/api/projects/${mine.data.project.id}`, undefined, otherToken)).status, 404);
    assert.equal((await call('GET', `/api/tenants/${mine.data.project.tenantId}`, undefined, otherToken)).status, 404);
  });

  test('legacy organisations with no assignee: the creator keeps access, everyone else is blocked, a Super Admin sees them', async () => {
    insertTenant('ownership-legacy-mine', adminId, '');
    insertTenant('ownership-legacy-nobody', '', '');
    insertTenant('ownership-legacy-theirs', otherId, '');

    assert.equal((await call('POST', '/api/projects', portfolio('Ownership Legacy Mine'), adminToken)).status, 201, 'the creator keeps access');
    const nobody = await call('POST', '/api/projects', portfolio('Ownership Legacy Nobody'), adminToken);
    assert.equal(nobody.status, 409, 'no creator evidence means Super Admin only');
    assert.equal(nobody.data.code, 'ORGANIZATION_NOT_AVAILABLE');
    assert.equal((await call('POST', '/api/projects', portfolio('Ownership Legacy Theirs'), adminToken)).status, 409);
    assert.equal((await call('POST', '/api/projects', portfolio('Ownership Legacy Nobody'), superToken)).status, 201, 'a Super Admin is never blocked by ownership');

    const list = await call('GET', '/api/tenants', undefined, adminToken);
    const slugs = list.data.tenants.map((t: any) => t.slug);
    assert.ok(slugs.includes('ownership-legacy-mine'));
    assert.ok(!slugs.includes('ownership-legacy-nobody'));
  });

  test('name-check reports available, yours and unavailable', async () => {
    await call('POST', '/api/projects', portfolio('Ownership Check Person'), adminToken);
    const get = (name: string, token: string) => call('GET', `/api/projects/name-check?name=${encodeURIComponent(name)}`, undefined, token);
    assert.equal((await get('Ownership Never Used Name', adminToken)).data.status, 'available');
    assert.equal((await get('Ownership Check Person', adminToken)).data.status, 'yours');
    const taken = await get('Ownership Check Person', otherToken);
    assert.equal(taken.data.status, 'unavailable');
    assert.match(taken.data.message, /Super Admin/);
    assert.equal((await get('', adminToken)).status, 400);
    assert.equal((await call('GET', '/api/projects/name-check?name=x')).status, 401);
  });
});

describe('Super Admin ownership resolution', () => {
  test('the ownership list is Super-Admin only and shows owner state and project counts', async () => {
    insertTenant('ownership-orphan-disabled', disabledId, disabledId);
    insertTenant('ownership-orphan-missing', 'ghost-user', 'ghost-user');

    assert.equal((await call('GET', '/api/tenants/ownership', undefined, adminToken)).status, 403);
    assert.equal((await call('GET', '/api/tenants/ownership')).status, 401);

    const r = await call('GET', '/api/tenants/ownership', undefined, superToken);
    assert.equal(r.status, 200);
    const by = (slug: string) => r.data.organizations.find((o: any) => o.slug === slug);
    assert.equal(by('ownership-orphan-disabled').ownerState, 'disabled');
    assert.equal(by('ownership-orphan-missing').ownerState, 'missing');
    assert.equal(by('ownership-legacy-nobody').ownerState, 'unassigned');
    assert.equal(by('ownership-reuse-person').ownerState, 'active');
    assert.equal(by('ownership-reuse-person').projectCount, 2);
    assert.ok(r.data.admins.every((a: any) => a.id && a.email), 'assignable Admins are listed');
    assert.ok(!r.data.admins.some((a: any) => a.id === disabledId), 'disabled Admins are not assignable');
  });

  test('reassignment needs an existing, active Admin; an Admin cannot do it', async () => {
    const tenant = getDatabase().prepare('SELECT id FROM tenants WHERE slug = ?').get('ownership-orphan-disabled') as any;
    const patch = (assignedAdminId: string, token: string) => call('PATCH', `/api/tenants/${tenant.id}`, { assignedAdminId }, token);

    assert.equal((await patch(otherId, adminToken)).status, 404, 'an Admin cannot even see it');
    // Rejections are tried on a different organisation, so no target equals the current owner (that would be a no-op).
    const other = getDatabase().prepare('SELECT id FROM tenants WHERE slug = ?').get('ownership-orphan-missing') as any;
    const patchOther = (assignedAdminId: string) => call('PATCH', `/api/tenants/${other.id}`, { assignedAdminId }, superToken);
    for (const bad of ['no-such-user', disabledId]) assert.equal((await patchOther(bad)).status, 400, `target ${bad} must be refused`);
    const superRow = getDatabase().prepare("SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1").get() as any;
    assert.equal((await patchOther(superRow.id)).status, 400, 'a Super Admin is not a valid owner');
    assert.equal((getDatabase().prepare('SELECT assigned_admin_id a FROM tenants WHERE id = ?').get(other.id) as any).a, 'ghost-user', 'refused changes leave the owner untouched');

    const ok = await patch(otherId, superToken);
    assert.equal(ok.status, 200, ok.text);
    const row = getDatabase().prepare('SELECT assigned_admin_id a FROM tenants WHERE id = ?').get(tenant.id) as any;
    assert.equal(row.a, otherId);

    const audit = await call('GET', '/api/admin/audit-logs', undefined, superToken);
    const event = audit.data.logs.find((l: any) => l.action === 'REASSIGN_ORGANIZATION' && l.resourceId === tenant.id);
    assert.ok(event, 'a REASSIGN_ORGANIZATION audit event exists');
    assert.equal(event.details.newAssignedAdminId, otherId);

    // after the hand-over the new owner can create under the name and the previous Admin cannot
    assert.equal((await call('POST', '/api/projects', portfolio('Ownership Orphan Disabled'), otherToken)).status, 201);
    assert.equal((await call('POST', '/api/projects', portfolio('Ownership Orphan Disabled'), adminToken)).status, 409);
  });

  test('bulk "orphaned" reassignment moves only organisations without an active owner', async () => {
    const before = getDatabase().prepare("SELECT slug, assigned_admin_id a FROM tenants WHERE slug IN ('ownership-reuse-person','ownership-orphan-missing','ownership-legacy-nobody')").all() as any[];
    const owner = (slug: string) => before.find((b) => b.slug === slug).a;

    assert.equal((await call('POST', '/api/tenants/reassign', { fromAdminId: 'orphaned', toAdminId: adminId }, adminToken)).status, 403);
    assert.equal((await call('POST', '/api/tenants/reassign', { fromAdminId: 'orphaned', toAdminId: 'nobody' }, superToken)).status, 400);

    const r = await call('POST', '/api/tenants/reassign', { fromAdminId: 'orphaned', toAdminId: adminId }, superToken);
    assert.equal(r.status, 200, r.text);
    assert.ok(r.data.moved >= 2);

    const after = getDatabase().prepare("SELECT slug, assigned_admin_id a FROM tenants WHERE slug IN ('ownership-reuse-person','ownership-orphan-missing','ownership-legacy-nobody')").all() as any[];
    const now = (slug: string) => after.find((b) => b.slug === slug).a;
    assert.equal(now('ownership-orphan-missing'), adminId, 'missing owner replaced');
    assert.equal(now('ownership-legacy-nobody'), adminId, 'unassigned replaced');
    assert.equal(now('ownership-reuse-person'), owner('ownership-reuse-person'), 'an organisation with an active owner is untouched');
  });
});
