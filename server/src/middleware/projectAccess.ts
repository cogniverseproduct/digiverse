import type { Response, NextFunction } from 'express';
import { repository } from '../db/repository.js';
import type { ClientProject, Tenant, User } from '../types/index.js';
import { authenticateToken, type AuthenticatedRequest } from './auth.js';

/**
 * Project and tenant ownership.
 *
 * - SUPER_ADMIN sees and manages every organization.
 * - ADMIN sees only organizations assigned to them (`tenants.assigned_admin_id`), which project creation sets to the creator.
 * - An organization with no assignee (legacy rows) is visible to SUPER_ADMIN only, so nothing is exposed by accident.
 *
 * A Super Admin impersonating an Admin holds that Admin's identity and role, so the Admin's limits apply to them.
 * Denied access answers 404, the same as a missing record, so ids cannot be probed.
 */
export function canAccessTenant(user: Pick<User, 'id' | 'role'>, tenant: Pick<Tenant, 'assignedAdminId' | 'createdByAdminId'> | null | undefined): boolean {
  if (user.role === 'SUPER_ADMIN') return true;
  if (!tenant) return false;
  if (tenant.assignedAdminId) return tenant.assignedAdminId === user.id;
  // Older rows have no assignee. The Admin who created one still owns it; with no creator evidence only a Super Admin can resolve it.
  return Boolean(tenant.createdByAdminId) && tenant.createdByAdminId === user.id;
}

/** Shown to an Admin who hits a name they do not own. It never reveals who does. */
export function organizationUnavailableMessage(name: string): string {
  return `An organisation named “${name.trim()}” already exists and is not in your workspace. If it is your client, ask a Super Admin to assign it to you (Super Admin → Organisations). Otherwise choose a different name, for example add the city or year.`;
}

/** The public address segment for an organisation name. */
export function organizationSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function canAccessProject(user: Pick<User, 'id' | 'role'>, project: Pick<ClientProject, 'tenantId'>): Promise<boolean> {
  if (user.role === 'SUPER_ADMIN') return true;
  if (!project.tenantId) return false;
  return canAccessTenant(user, await repository.getTenantById(project.tenantId));
}

/**
 * Loads a project for the signed-in user. Sends the 404 and returns null when it does not exist or is not theirs.
 * Use after `authenticateToken`.
 */
export async function loadAccessibleProject(req: AuthenticatedRequest, res: Response, projectId: string, notFound = 'Client project not found.'): Promise<ClientProject | null> {
  const project = await repository.getProjectById(projectId);
  if (!project || !req.user || !(await canAccessProject(req.user, project))) {
    res.status(404).json({ error: notFound });
    return null;
  }
  return project;
}

/**
 * Router-level guard for `/:id/...` routes: authenticates, then refuses projects the user does not own.
 * Missing projects fall through so each handler keeps its own 404 wording.
 * `publicSubpaths` lists POST endpoints that are intentionally open to website visitors (they skip this guard entirely).
 */
export function guardProjectParam(publicSubpaths: string[] = [], param = 'id') {
  const open = new Set(publicSubpaths);
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (req.method === 'POST' && open.has(req.path)) { next(); return; }
    void authenticateToken(req, res, async () => {
      try {
        const project = await repository.getProjectById(String(req.params[param]));
        if (project && !(await canAccessProject(req.user!, project))) {
          res.status(404).json({ error: 'Client project not found.' });
          return;
        }
        next();
      } catch (error) {
        console.error('[Project access check failed]', error);
        res.status(500).json({ error: 'Could not verify access to this project.' });
      }
    });
  };
}
