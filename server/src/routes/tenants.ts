import { Router, Response } from 'express';
import { authenticateToken, requireRole, recordAudit, AuthenticatedRequest } from '../middleware/auth.js';
import { repository } from '../db/repository.js';
import { canAccessTenant } from '../middleware/projectAccess.js';
import { Tenant } from '../types/index.js';

const router = Router();

// Protect all tenant routes with authentication
router.use(authenticateToken);

// GET /api/tenants - List organizations (Tenant isolation filter)
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  // Super Admin monitors all tenants; an Admin only ever sees the organizations assigned to them.
  const tenants = await repository.listTenants(user.role === 'ADMIN' ? user.id : req.query.myOnly === 'true' ? user.id : undefined);
  res.json({ tenants });
});

// Why an organisation is (or is not) usable by an Admin, for the Super Admin ownership panel.
type OwnerState = 'active' | 'disabled' | 'missing' | 'unassigned';

// GET /api/tenants/ownership - Every organisation with its owner and project count (SUPER_ADMIN only; declared before /:id)
router.get('/ownership', requireRole('SUPER_ADMIN'), async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const [tenants, users, counts] = await Promise.all([repository.listTenants(), repository.listUsers(), repository.countProjectsByTenant()]);
  const byId = new Map(users.map((u) => [u.id, u]));
  const describe = (id: string) => {
    const u = id ? byId.get(id) : undefined;
    return u ? { id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive } : null;
  };
  const organizations = tenants.map((t) => {
    const owner = t.assignedAdminId ? byId.get(t.assignedAdminId) : undefined;
    const ownerState: OwnerState = !t.assignedAdminId ? 'unassigned' : !owner ? 'missing' : owner.isActive ? 'active' : 'disabled';
    return {
      id: t.id, slug: t.slug, name: t.name, category: t.category, projectCount: counts[t.id] || 0,
      createdAt: t.createdAt, assignedAdmin: describe(t.assignedAdminId), createdByAdmin: describe(t.createdByAdminId), ownerState
    };
  });
  res.json({
    organizations,
    admins: users.filter((u) => u.role === 'ADMIN' && u.isActive).map((u) => ({ id: u.id, name: u.name, email: u.email }))
  });
});

// Shared by the single and bulk reassignment routes: the new owner must be an existing, active Admin.
async function resolveNewOwner(id: unknown) {
  const user = typeof id === 'string' && id ? await repository.getUserById(id) : null;
  return user && user.role === 'ADMIN' && user.isActive ? user : null;
}

// POST /api/tenants/reassign - Hand every organisation owned by a disabled/missing/unassigned owner (or one named Admin) to an active Admin (SUPER_ADMIN only)
router.post('/reassign', requireRole('SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { fromAdminId, toAdminId } = req.body ?? {};
  const target = await resolveNewOwner(toAdminId);
  if (!target) { res.status(400).json({ error: 'Choose an active Admin to receive the organisations.' }); return; }
  const [tenants, users] = await Promise.all([repository.listTenants(), repository.listUsers()]);
  const active = new Set(users.filter((u) => u.isActive && u.role === 'ADMIN').map((u) => u.id));
  const selector = fromAdminId === 'orphaned'
    ? (t: Tenant) => !active.has(t.assignedAdminId) // unassigned, owner missing, or owner disabled
    : (t: Tenant) => typeof fromAdminId === 'string' && fromAdminId !== '' && t.assignedAdminId === fromAdminId;
  const moved = tenants.filter((t) => selector(t) && t.assignedAdminId !== target.id);
  const now = new Date().toISOString();
  for (const t of moved) {
    const previous = t.assignedAdminId;
    t.assignedAdminId = target.id;
    t.updatedAt = now;
    await repository.saveTenant(t);
    await recordAudit(req, 'REASSIGN_ORGANIZATION', 'tenants', t.id, { name: t.name, previousAssignedAdminId: previous || null, newAssignedAdminId: target.id, bulk: true });
  }
  res.json({ message: `${moved.length} organisation${moved.length === 1 ? '' : 's'} assigned to ${target.name}.`, moved: moved.length });
});

// GET /api/tenants/:id - Get specific tenant dossier
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const tenant = await repository.getTenantById(id);
  if (!tenant || !canAccessTenant(req.user!, tenant)) {
    res.status(404).json({ error: 'Tenant organization not found.' });
    return;
  }

  // Also query projects under this tenant
  const projects = await repository.listProjects(tenant.id);

  res.json({ tenant, projects });
});

// POST /api/tenants - Create new organization tenant (ADMIN only)
router.post('/', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const {
    name,
    category,
    subcategory,
    contactPerson,
    contactEmail,
    contactPhone,
    address,
    websiteLanguage = 'bilingual',
    assignedAdminId
  } = req.body;

  if (!name || !category || !contactPerson || !contactEmail) {
    res.status(400).json({ error: 'Organization name, category, contact person, and contact email are required.' });
    return;
  }

  const slug = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const existingSlug = await repository.getTenantBySlug(slug);
  if (existingSlug) {
    res.status(409).json({ error: `An organization with slug '${slug}' already exists.` });
    return;
  }

  const now = new Date().toISOString();
  const id = `tenant_${Date.now()}`;

  const newTenant: Tenant = {
    id,
    slug,
    name: String(name).trim(),
    category: String(category).trim(),
    subcategory: subcategory ? String(subcategory).trim() : undefined,
    contactPerson: String(contactPerson).trim(),
    contactEmail: String(contactEmail).trim().toLowerCase(),
    contactPhone: contactPhone ? String(contactPhone).trim() : undefined,
    address: address ? String(address).trim() : undefined,
    websiteLanguage: String(websiteLanguage),
    createdByAdminId: req.user!.id,
    assignedAdminId: assignedAdminId || req.user!.id,
    createdAt: now,
    updatedAt: now
  };

  await repository.saveTenant(newTenant);
  await recordAudit(req, 'CREATE_TENANT', 'tenants', id, { name: newTenant.name, slug: newTenant.slug });

  res.status(201).json({
    message: `Tenant organization '${newTenant.name}' created successfully.`,
    tenant: newTenant
  });
});

// PATCH /api/tenants/:id - Update tenant profile
router.patch('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const tenant = await repository.getTenantById(id);
  if (!tenant || !canAccessTenant(req.user!, tenant)) {
    res.status(404).json({ error: 'Tenant not found.' });
    return;
  }

  const {
    name,
    category,
    subcategory,
    contactPerson,
    contactEmail,
    contactPhone,
    address,
    websiteLanguage,
    assignedAdminId
  } = req.body;

  if (name) tenant.name = String(name).trim();
  if (category) tenant.category = String(category).trim();
  if (subcategory !== undefined) tenant.subcategory = subcategory;
  if (contactPerson) tenant.contactPerson = String(contactPerson).trim();
  if (contactEmail) tenant.contactEmail = String(contactEmail).trim().toLowerCase();
  if (contactPhone !== undefined) tenant.contactPhone = contactPhone;
  if (address !== undefined) tenant.address = address;
  if (websiteLanguage) tenant.websiteLanguage = websiteLanguage;
  // Handing an organization to another administrator is a Super Admin decision; an Admin cannot give themselves access to others'.
  let reassignedFrom: string | null | undefined;
  if (assignedAdminId && req.user!.role === 'SUPER_ADMIN' && assignedAdminId !== tenant.assignedAdminId) {
    const target = await resolveNewOwner(assignedAdminId);
    if (!target) { res.status(400).json({ error: 'The new owner must be an existing, active Admin.' }); return; }
    reassignedFrom = tenant.assignedAdminId || null;
    tenant.assignedAdminId = target.id;
  }

  tenant.updatedAt = new Date().toISOString();
  await repository.saveTenant(tenant);

  await recordAudit(req, 'UPDATE_TENANT', 'tenants', id, { updatedFields: req.body });
  if (reassignedFrom !== undefined) {
    await recordAudit(req, 'REASSIGN_ORGANIZATION', 'tenants', id, { name: tenant.name, previousAssignedAdminId: reassignedFrom, newAssignedAdminId: tenant.assignedAdminId });
  }

  res.json({ message: 'Tenant updated successfully.', tenant });
});

// DELETE /api/tenants/:id - Delete tenant and cascade all projects
router.delete('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const tenant = await repository.getTenantById(id);
  if (!tenant || !canAccessTenant(req.user!, tenant)) {
    res.status(404).json({ error: 'Tenant not found.' });
    return;
  }

  const success = await repository.deleteTenant(id);
  if (!success) {
    res.status(500).json({ error: 'Failed to delete tenant organization.' });
    return;
  }

  await recordAudit(req, 'DELETE_TENANT', 'tenants', id, { tenantName: tenant.name });
  res.json({ message: `Tenant '${tenant.name}' and all associated projects deleted successfully.` });
});

export default router;
