import { Router, Request, Response } from 'express';
import { repository } from '../db/repository.js';
import { publishedSiteRepository, type PublishedSite } from '../db/publishedSiteRepository.js';
import { sanitizeWebsiteForPublic } from '../services/publicSiteSanitizer.js';
import { slugFromHostname, buildSiteUrl } from '../services/siteRouting.js';
import { requestOrigin } from '../services/requestOrigin.js';

const router = Router();


function toPublicPayload(site: PublishedSite, req: Request) {
  const activeDomain = site.domainStatus === 'active' ? site.customDomain : undefined;
  const url = buildSiteUrl(site.slug, requestOrigin(req), activeDomain);

  return {
    success: true,
    slug: site.slug,
    organizationName: site.organizationName,
    category: site.category,
    // Snapshots are sanitised when published; serving through the same sanitiser keeps older snapshots safe too.
    generatedWebsite: sanitizeWebsiteForPublic(site.website),
    seo: { ...site.seo, canonicalUrl: url },
    deploymentDetails: {
      platform: 'digiverse_shared',
      deployedUrl: url,
      deployedAt: site.publishedAt,
      customDomain: activeDomain
    },
    publishedAt: site.publishedAt
  };
}

async function sendSite(site: PublishedSite | null, label: string, req: Request, res: Response): Promise<void> {
  if (!site) {
    res.status(404).json({ error: `Live website for '${label}' not found.`, code: 'SITE_NOT_FOUND' });
    return;
  }

  if (site.status !== 'live') {
    res.status(404).json({
      error: `Website for '${site.organizationName}' is not currently published.`,
      code: 'SITE_NOT_PUBLISHED'
    });
    return;
  }

  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  res.json(toPublicPayload(site, req));
}

/**
 * GET /api/live/by-host/:host
 * Resolves a site from a hostname: either <slug>.<SITES_ROOT_DOMAIN> or a
 * verified custom domain attached to the site.
 */
router.get('/by-host/:host', async (req: Request, res: Response): Promise<void> => {
  const host = String(req.params.host).trim().toLowerCase().replace(/:\d+$/, '');

  const slug = slugFromHostname(host);
  if (slug) {
    await sendSite(await publishedSiteRepository.getBySlug(slug), host, req, res);
    return;
  }

  const site = await publishedSiteRepository.getByCustomDomain(host);
  if (site && site.domainStatus !== 'active') {
    res.status(404).json({ error: `Domain '${host}' is not active yet.`, code: 'DOMAIN_NOT_ACTIVE' });
    return;
  }

  await sendSite(site, host, req, res);
});

/**
 * GET /api/live/:slug - Public published website.
 */
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug).trim().toLowerCase();
  const site = await publishedSiteRepository.getBySlug(slug);

  if (site) {
    await sendSite(site, slug, req, res);
    return;
  }

  // Fallback for projects deployed before published_sites existed.
  const project = await repository.getProjectBySlug(slug);

  if (!project || project.status !== 'deployed' || !project.generatedWebsite) {
    res.status(404).json({
      error: `Live website for slug '${slug}' not found.`,
      code: 'SITE_NOT_FOUND'
    });
    return;
  }

  res.json({
    success: true,
    slug: project.tenantSlug,
    organizationName: project.requirements.organizationName,
    category: project.requirements.category || project.requirements.organizationType,
    generatedWebsite: sanitizeWebsiteForPublic(project.generatedWebsite),
    seo: {},
    deploymentDetails: {
      platform: project.deploymentDetails?.platform,
      deployedUrl: project.deploymentDetails?.deployedUrl,
      deployedAt: project.deploymentDetails?.deployedAt
    },
    publishedAt: project.deploymentDetails?.deployedAt
  });
});

export default router;
