/**
 * Publishing Console API (centralized Vercel publishing).
 *
 * Every route requires an authenticated Admin or Super Admin, and every
 * per-project route is guarded by project ownership: an Admin can only reach
 * deployments of projects they own (Super Admin: all). A project that is not
 * accessible answers 404, never 403, so project ids cannot be probed.
 *
 *   GET  /api/publishing/config                         how publishing is configured (no secrets)
 *   POST /api/publishing/config/verify                  Super Admin: read-only credential check
 *   GET  /api/projects/:id/publishing/status            state, checks, live URL, latest deployment
 *   POST /api/projects/:id/publishing/publish           publish (also used to update the live site)
 *   POST /api/projects/:id/publishing/redeploy          deploy the current content again
 *   POST /api/projects/:id/publishing/unpublish         deploy the offline page
 *   GET  /api/projects/:id/publishing/deployments       deployment history
 *   GET  /api/projects/:id/publishing/deployments/:deploymentId
 *   GET  /api/projects/:id/publishing/deployments/:deploymentId/logs
 */

import { Router, Response } from 'express';
import { authenticateToken, requireRole, recordAudit, AuthenticatedRequest } from '../middleware/auth.js';
import { guardProjectParam } from '../middleware/projectAccess.js';
import { requestOrigin } from '../services/requestOrigin.js';
import { PublishingError, deploymentService } from '../services/publishing/deploymentService.js';
import { repository } from '../db/repository.js';

const router = Router();

/** Maps a failure to a safe JSON response. Internal error text is never sent to the browser. */
export function sendPublishingError(res: Response, error: unknown, fallback = 'Publishing failed.'): void {
  if (error instanceof PublishingError) {
    res.status(error.httpStatus).json({
      error: error.message,
      code: error.code,
      blockers: error.blockers,
      deployment: error.deployment
    });
    return;
  }
  console.error('[Publishing Error]:', error instanceof Error ? error.message : 'unknown');
  res.status(500).json({ error: fallback, code: 'PUBLISHING_FAILED' });
}

function readSiteBody(req: AuthenticatedRequest) {
  const body = (req.body ?? {}) as Record<string, unknown>;
  return { siteSlug: body.siteSlug, seo: body.seo, customDomain: body.customDomain };
}

/* ------------------------------------------------------------ shared handlers */

export async function publishHandler(req: AuthenticatedRequest, res: Response, requireExisting = false): Promise<void> {
  const id = String(req.params.id);
  try {
    const result = await deploymentService.publish(id, req.user!.id, {
      ...readSiteBody(req),
      requestOrigin: requestOrigin(req),
      requireExisting
    });

    await recordAudit(req, requireExisting ? 'REDEPLOY_PROJECT' : 'PUBLISH_PROJECT', 'projects', id, {
      deploymentId: result.deployment.id,
      provider: result.deployment.provider,
      simulated: result.deployment.isSimulated,
      siteSlug: result.deployment.siteSlug,
      status: result.deployment.status
    });

    const project = await repository.getProjectById(id);
    res.json({
      success: result.deployment.status !== 'failed',
      message: result.message,
      deployment: result.deployment,
      status: result.status,
      state: result.status.state,
      deployedUrl: result.status.liveUrl,
      project
    });
  } catch (error) {
    sendPublishingError(res, error);
  }
}

export async function unpublishHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const id = String(req.params.id);
  try {
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 300) : undefined;
    const result = await deploymentService.unpublish(id, req.user!.id, reason, requestOrigin(req));
    await recordAudit(req, 'UNPUBLISH_PROJECT', 'projects', id, {
      reason: reason || 'Operator unpublish action',
      deploymentId: result.deployment?.id,
      simulated: result.deployment?.isSimulated
    });
    const project = await repository.getProjectById(id);
    res.json({
      success: true,
      message: result.message,
      deployment: result.deployment,
      status: result.status,
      state: result.status.state,
      project
    });
  } catch (error) {
    sendPublishingError(res, error, 'Failed to unpublish the website.');
  }
}

/* ----------------------------------------------------------------- config */

router.get(
  '/publishing/config',
  authenticateToken,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  (_req: AuthenticatedRequest, res: Response): void => {
    res.json(deploymentService.describeConfig());
  }
);

router.post(
  '/publishing/config/verify',
  authenticateToken,
  requireRole('SUPER_ADMIN'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const result = await deploymentService.verifyCredentials();
    await recordAudit(req, 'VERIFY_PUBLISHING_CONFIG', 'platform', undefined, { ok: result.ok, mode: result.mode });
    res.status(result.ok ? 200 : 409).json(result);
  }
);

/* -------------------------------------------------------- per-project routes */

const guard = guardProjectParam([], 'id');
const adminOnly = requireRole('ADMIN', 'SUPER_ADMIN');

router.get('/projects/:id/publishing/status', authenticateToken, adminOnly, guard, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const project = await repository.getProjectById(String(req.params.id));
    if (!project) { res.status(404).json({ error: 'Project not found.' }); return; }
    res.json(await deploymentService.getStatus(project.id, {
      siteSlug: typeof req.query.siteSlug === 'string' ? req.query.siteSlug : undefined,
      requestOrigin: requestOrigin(req)
    }));
  } catch (error) {
    sendPublishingError(res, error, 'Could not read the publishing status.');
  }
});

router.post('/projects/:id/publishing/publish', authenticateToken, adminOnly, guard, (req: AuthenticatedRequest, res: Response) => publishHandler(req, res, false));
router.post('/projects/:id/publishing/redeploy', authenticateToken, adminOnly, guard, (req: AuthenticatedRequest, res: Response) => publishHandler(req, res, true));
router.post('/projects/:id/publishing/unpublish', authenticateToken, adminOnly, guard, unpublishHandler);

router.get('/projects/:id/publishing/deployments', authenticateToken, adminOnly, guard, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const project = await repository.getProjectById(String(req.params.id));
    if (!project) { res.status(404).json({ error: 'Project not found.' }); return; }
    res.json({ deployments: await deploymentService.listDeployments(project.id) });
  } catch (error) {
    sendPublishingError(res, error, 'Could not read the deployment history.');
  }
});

router.get('/projects/:id/publishing/deployments/:deploymentId', authenticateToken, adminOnly, guard, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const deployment = await deploymentService.getDeployment(String(req.params.id), String(req.params.deploymentId));
    if (!deployment) { res.status(404).json({ error: 'Deployment not found.' }); return; }
    res.json({ deployment });
  } catch (error) {
    sendPublishingError(res, error, 'Could not read the deployment.');
  }
});

router.get('/projects/:id/publishing/deployments/:deploymentId/logs', authenticateToken, adminOnly, guard, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const logs = await deploymentService.getLogs(String(req.params.id), String(req.params.deploymentId));
    if (!logs) { res.status(404).json({ error: 'Deployment not found.' }); return; }
    res.json(logs);
  } catch (error) {
    sendPublishingError(res, error, 'Could not read the deployment logs.');
  }
});

export default router;
