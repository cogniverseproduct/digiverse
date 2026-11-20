import { Router, Response } from 'express';
import { authenticateToken, requireRole, recordAudit, AuthenticatedRequest } from '../middleware/auth.js';
import { publishedSiteRepository } from '../db/publishedSiteRepository.js';
import { repository } from '../db/repository.js';
import { canAccessProject, guardProjectParam } from '../middleware/projectAccess.js';
import { publishingService } from '../services/publishingService.js';
import { buildSiteUrl } from '../services/siteRouting.js';
import { isVercelDomainsConfigured } from '../services/vercelDomainsService.js';
import { getDb } from '../db/database.js';
import { siteDeploymentRepository } from '../db/siteDeploymentRepository.js';
import { deploymentService } from '../services/publishing/deploymentService.js';
import {
  getMediaStorageDriver,
  getPublicAppUrl,
  getSitesRootDomain,
  isVercelRuntime
} from '../config.js';
import { requestOrigin } from '../services/requestOrigin.js';

/**
 * Central publishing management for all client websites served by the
 * single DigiVerse deployment.
 */
const router = Router();

router.use(authenticateToken);
router.use(requireRole('ADMIN', 'SUPER_ADMIN'));
// Per-project routes below only reach projects the signed-in user owns (Super Admin: all).
router.use('/:projectId', guardProjectParam([], 'projectId'));


/** Hosting facts for one site: which provider serves it, whether that is only a simulation, and the real live URL. */
async function hostingSummary(projectId: string, fallbackUrl: string, siteStatus: string) {
  const hosting = await siteDeploymentRepository.getHosting(projectId);
  const latest = await siteDeploymentRepository.getLatest(projectId);
  const ready = await siteDeploymentRepository.getLatestReadyPublish(projectId);
  const platform = hosting ? hosting.provider : 'digiverse_shared';
  return {
    platform,
    simulated: platform === 'mock',
    deploymentStatus: latest?.status,
    deploymentUpdatedAt: latest?.updatedAt,
    url: hosting && siteStatus === 'live' && ready?.url && platform === 'vercel' ? ready.url : fallbackUrl
  };
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * GET /api/sites/config
 * Deployment readiness summary for the publishing UI. Never returns secrets.
 */
router.get('/config', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const db = await getDb();

  res.json({
    runtime: isVercelRuntime() ? 'vercel' : 'local',
    database: { driver: db.driverName, dialect: db.dialect },
    mediaStorage: getMediaStorageDriver(),
    publicAppUrl: getPublicAppUrl() || requestOrigin(req),
    routing: {
      pathPattern: `${getPublicAppUrl() || requestOrigin(req)}/live/<slug>`,
      sitesRootDomain: getSitesRootDomain() || null,
      subdomainRoutingEnabled: Boolean(getSitesRootDomain())
    },
    customDomains: {
      vercelConnected: isVercelDomainsConfigured()
    },
    publishing: deploymentService.describeConfig()
  });
});

/** GET /api/sites - All published (live or suspended) client websites. */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const all = await publishedSiteRepository.list();
  const sites = req.user!.role === 'SUPER_ADMIN'
    ? all
    : (await Promise.all(all.map(async (site) => {
        const project = await repository.getProjectById(site.projectId);
        return project && (await canAccessProject(req.user!, project)) ? site : null;
      }))).filter((site): site is NonNullable<typeof site> => site !== null);

  res.json({
    sites: await Promise.all(sites.map(async (site) => {
      const fallbackUrl = buildSiteUrl(site.slug, requestOrigin(req), site.domainStatus === 'active' ? site.customDomain : undefined);
      const hosting = await hostingSummary(site.projectId, fallbackUrl, site.status);
      return {
        ...site,
        url: site.domainStatus === 'active' && site.customDomain ? fallbackUrl : hosting.url,
        pathUrl: buildSiteUrl(site.slug, requestOrigin(req)),
        hosting
      };
    }))
  });
});

/** GET /api/sites/:projectId */
router.get('/:projectId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const site = await publishedSiteRepository.getByProjectId(String(req.params.projectId));

  if (!site) {
    res.status(404).json({ error: 'This project has not been published yet.' });
    return;
  }

  const { website: _omit, ...summary } = site;
  const fallbackUrl = buildSiteUrl(site.slug, requestOrigin(req), site.domainStatus === 'active' ? site.customDomain : undefined);
  const hosting = await hostingSummary(site.projectId, fallbackUrl, site.status);
  res.json({
    site: {
      ...summary,
      url: site.domainStatus === 'active' && site.customDomain ? fallbackUrl : hosting.url,
      pathUrl: buildSiteUrl(site.slug, requestOrigin(req)),
      hosting
    }
  });
});

/** PATCH /api/sites/:projectId/seo */
router.patch('/:projectId/seo', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const projectId = String(req.params.projectId);

  try {
    const seo = await publishingService.updateSiteSeo(projectId, req.body?.seo ?? req.body);
    await recordAudit(req, 'UPDATE_SITE_SEO', 'published_sites', projectId, { seo });
    res.json({ message: 'SEO settings updated.', seo });
  } catch (error) {
    res.status(400).json({ error: errorMessage(error, 'Failed to update SEO settings.') });
  }
});

/** POST /api/sites/:projectId/domain  { domain } */
router.post('/:projectId/domain', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const projectId = String(req.params.projectId);

  try {
    const site = await publishingService.setCustomDomain(projectId, req.body?.domain);
    await recordAudit(req, 'CONNECT_CUSTOM_DOMAIN', 'published_sites', projectId, {
      domain: site.customDomain,
      domainStatus: site.domainStatus
    });
    res.json({ message: site.domainDetails?.message || 'Custom domain saved.', site });
  } catch (error) {
    res.status(400).json({ error: errorMessage(error, 'Failed to connect custom domain.') });
  }
});

/** POST /api/sites/:projectId/domain/refresh */
router.post('/:projectId/domain/refresh', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const site = await publishingService.refreshCustomDomain(String(req.params.projectId));
    res.json({ message: site.domainDetails?.message || 'Domain status refreshed.', site });
  } catch (error) {
    res.status(400).json({ error: errorMessage(error, 'Failed to refresh domain status.') });
  }
});

/** DELETE /api/sites/:projectId/domain */
router.delete('/:projectId/domain', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const projectId = String(req.params.projectId);

  try {
    const result = await publishingService.removeCustomDomain(projectId);
    await recordAudit(req, 'REMOVE_CUSTOM_DOMAIN', 'published_sites', projectId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: errorMessage(error, 'Failed to remove custom domain.') });
  }
});

export default router;
