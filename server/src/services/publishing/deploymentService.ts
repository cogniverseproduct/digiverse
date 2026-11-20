/**
 * Centralized publishing: the one place that publishes, redeploys, unpublishes
 * and reports the state of a client website.
 *
 *   preflight (technical only) -> snapshot (sanitised) -> ensure the client's hosting project
 *   -> export a standalone static bundle -> provider.deploy -> deployment record -> state refresh
 *
 * Publishing never depends on client approval, a design-revision lock, quotations,
 * payments or billing. Only genuine technical and security checks block it.
 *
 * Status is refreshed when it is read (and by the signed webhook), never by a
 * background timer, so it works on serverless hosting.
 */

import { repository } from '../../db/repository.js';
import { publishedSiteRepository, type SiteSeoSettings } from '../../db/publishedSiteRepository.js';
import {
  siteDeploymentRepository,
  isTerminalStatus,
  type DeploymentKind,
  type DeploymentProviderName,
  type SiteDeployment,
  type SiteHosting
} from '../../db/siteDeploymentRepository.js';
import { getPublishingConfig, type PublishingConfig, type PublishingMode } from '../../config.js';
import { sanitizeWebsiteForPublic } from '../publicSiteSanitizer.js';
import { buildSiteUrl } from '../siteRouting.js';
import { defaultSeo, publishingService, validateSeoSettings } from '../publishingService.js';
import { normalizeCustomDomain } from '../vercelDomainsService.js';
import type { ClientProject, PublishingPreflightResult } from '../../types/index.js';
import {
  ExportError,
  exportOfflinePage,
  exportSite,
  loadSiteBundle,
  type ExportedSite
} from './siteExporter.js';
import { VercelApiError, VercelClient, scrubSecrets } from './vercelClient.js';
import { VercelProvider } from './providers/vercelProvider.js';
import { MockProvider } from './providers/mockProvider.js';
import type { DeploymentProvider, ProviderLogLine } from './providers/types.js';

/** The six user-facing states, plus "not_ready" when the site itself still has something to fix. */
export type PublishState =
  | 'not_configured'
  | 'not_ready'
  | 'ready_to_publish'
  | 'queued'
  | 'building'
  | 'ready'
  | 'failed';

export class PublishingError extends Error {
  readonly code: string;
  readonly httpStatus: number;
  readonly blockers?: string[];
  deployment?: DeploymentView;

  constructor(code: string, message: string, httpStatus = 400, blockers?: string[]) {
    super(message);
    this.name = 'PublishingError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.blockers = blockers;
  }
}

export interface DeploymentView {
  id: string;
  kind: DeploymentKind;
  provider: DeploymentProviderName;
  /** True for local simulated deployments. They are never real Vercel deployments. */
  isSimulated: boolean;
  status: SiteDeployment['status'];
  url?: string;
  inspectorUrl?: string;
  providerDeploymentId?: string;
  revisionId?: string;
  siteSlug?: string;
  fileCount?: number;
  errorCode?: string;
  errorMessage?: string;
  triggeredByAdminId?: string;
  createdAt: string;
  readyAt?: string;
}

export interface PublishingStatusView {
  mode: PublishingMode;
  state: PublishState;
  isSimulated: boolean;
  /** Human sentence for the console header. */
  message: string;
  preflight: PublishingPreflightResult;
  hosting?: {
    provider: DeploymentProviderName;
    productionUrl?: string;
    projectName?: string;
  };
  /** The URL visitors can open right now (only when a publish deployment is ready). */
  liveUrl?: string;
  isLive: boolean;
  /** True when the newest deployment failed but an earlier version is still live. */
  previousVersionLive: boolean;
  latestDeployment?: DeploymentView;
  customDomain?: string;
}

const IN_PROGRESS_STALE_MS = 10 * 60 * 1000;

/* ------------------------------------------------------------------ helpers */

function toView(d: SiteDeployment): DeploymentView {
  return {
    id: d.id,
    kind: d.kind,
    provider: d.provider,
    isSimulated: d.provider === 'mock',
    status: d.status,
    url: d.url,
    inspectorUrl: d.inspectorUrl,
    providerDeploymentId: d.providerDeploymentId,
    revisionId: d.revisionId,
    siteSlug: d.siteSlug,
    fileCount: d.fileCount,
    errorCode: d.errorCode,
    errorMessage: d.errorMessage,
    triggeredByAdminId: d.triggeredByAdminId,
    createdAt: d.createdAt,
    readyAt: d.readyAt
  };
}

function providerFor(config: PublishingConfig, name: DeploymentProviderName): DeploymentProvider | null {
  if (name === 'vercel') {
    if (config.mode !== 'live' || !config.token) return null;
    return new VercelProvider(new VercelClient({ token: config.token, teamId: config.teamId }));
  }
  if (name === 'mock') {
    return config.mockMode ? new MockProvider() : null;
  }
  return null;
}

function activeProvider(config: PublishingConfig): DeploymentProvider {
  if (config.mode === 'live') return providerFor(config, 'vercel')!;
  if (config.mode === 'mock') return providerFor(config, 'mock')!;
  throw new PublishingError(
    'NOT_CONFIGURED',
    'Vercel publishing is not set up yet. Add the Vercel credentials to the server environment (see docs/deployment/VERCEL.md).',
    409
  );
}

/** Audit records for events that have no HTTP request (status changes found by polling or the webhook). */
async function auditSystem(action: string, projectId: string, details: Record<string, unknown>): Promise<void> {
  try {
    await repository.createAuditLog({
      userId: 'system',
      userEmail: 'system@digiverse.internal',
      userRole: 'ADMIN',
      action,
      resourceType: 'project',
      resourceId: projectId,
      details
    });
  } catch (error) {
    console.error('[Publishing Audit Error]:', error instanceof Error ? error.message : 'unknown');
  }
}

function safeErrorMessage(error: unknown, config: PublishingConfig): { code: string; message: string } {
  if (error instanceof VercelApiError) {
    return { code: error.code, message: scrubSecrets(error.message, config.token) };
  }
  if (error instanceof ExportError) {
    return { code: error.code, message: error.message };
  }
  if (error instanceof PublishingError) {
    return { code: error.code, message: error.message };
  }
  return { code: 'DEPLOY_FAILED', message: 'The deployment could not be created. Check the server log.' };
}

function mapPublishStateFromDeployment(d: SiteDeployment): PublishState {
  if (d.status === 'queued') return 'queued';
  if (d.status === 'building') return 'building';
  if (d.status === 'ready') return d.kind === 'publish' ? 'ready' : 'ready_to_publish';
  return 'failed';
}

/* ------------------------------------------------------------------- service */

export const deploymentService = {
  /** Public, secret-free description of how publishing is configured. */
  describeConfig() {
    const config = getPublishingConfig();
    const problems: string[] = [];
    if (config.enabled && !config.token) problems.push('VERCEL_ENABLED is true but VERCEL_TOKEN is missing.');
    return {
      mode: config.mode,
      vercelEnabled: config.enabled,
      tokenConfigured: Boolean(config.token),
      teamConfigured: Boolean(config.teamId),
      webhookSecretConfigured: Boolean(config.webhookSecret),
      mockMode: config.mockMode,
      problems,
      message:
        config.mode === 'live'
          ? 'Publishing deploys client websites to the DigiVerse Vercel team.'
          : config.mode === 'mock'
            ? 'Simulated publishing (local test mode). Nothing is deployed to Vercel.'
            : 'Vercel setup is pending. Add the Vercel credentials to publish client websites.'
    };
  },

  /** Preflight plus the checks that depend on the publishing mode. */
  async preflight(projectId: string, options: { siteSlug?: unknown; requestOrigin?: string } = {}): Promise<PublishingPreflightResult> {
    const result = await publishingService.getPublishingPreflight(projectId, options);
    const config = getPublishingConfig();
    if (config.mode === 'live') {
      const bundle = await loadSiteBundle().catch(() => null);
      result.checks.isBundleAvailable = Boolean(bundle);
      if (!bundle) {
        result.blockers.push('The standalone site bundle has not been built. Run the DigiVerse build before publishing.');
        result.isReadyToPublish = false;
      }
    }
    return result;
  },

  async getStatus(projectId: string, options: { siteSlug?: unknown; requestOrigin?: string } = {}): Promise<PublishingStatusView> {
    const config = getPublishingConfig();
    let latest = await siteDeploymentRepository.getLatest(projectId);
    if (latest && !isTerminalStatus(latest.status)) {
      latest = await this.refreshDeployment(projectId, latest.id);
    }

    const preflight = await this.preflight(projectId, options);
    const hosting = await siteDeploymentRepository.getHosting(projectId);
    const latestReady = await siteDeploymentRepository.getLatestReadyPublish(projectId);
    const site = await publishedSiteRepository.getByProjectId(projectId);

    const publishIsLive = Boolean(
      latestReady &&
      latest &&
      // Live unless the newest deployment is a successful offline page.
      !(latest.kind === 'offline' && latest.status === 'ready')
    );

    let state: PublishState;
    if (latest && !isTerminalStatus(latest.status)) {
      state = mapPublishStateFromDeployment(latest);
    } else if (config.mode === 'not_configured') {
      state = 'not_configured';
    } else if (latest && latest.status !== 'ready') {
      state = 'failed';
    } else if (publishIsLive) {
      state = 'ready';
    } else if (!preflight.isReadyToPublish) {
      state = 'not_ready';
    } else {
      state = 'ready_to_publish';
    }

    const failedWhileLive = Boolean(latest && (latest.status === 'failed' || latest.status === 'canceled') && publishIsLive);
    const activeDomain = site?.domainStatus === 'active' ? site.customDomain : undefined;
    const liveUrl = publishIsLive ? (activeDomain ? `https://${activeDomain}` : latestReady?.url || hosting?.productionUrl) : undefined;

    const messages: Record<PublishState, string> = {
      not_configured: 'Vercel setup is pending. Publishing is disabled until the Vercel credentials are added.',
      not_ready: 'This website cannot be published yet. See what to fix below.',
      ready_to_publish: 'Ready to publish.',
      queued: 'The deployment is queued.',
      building: 'The deployment is building.',
      ready: 'The website is live.',
      failed: failedWhileLive ? 'The latest deployment failed. The previous version is still live.' : 'The latest deployment failed.'
    };

    return {
      mode: config.mode,
      state,
      isSimulated: (latest?.provider ?? (config.mode === 'mock' ? 'mock' : 'vercel')) === 'mock',
      message: messages[state],
      preflight,
      hosting: hosting
        ? { provider: hosting.provider, productionUrl: hosting.productionUrl, projectName: hosting.providerProjectName }
        : undefined,
      liveUrl,
      isLive: publishIsLive,
      previousVersionLive: failedWhileLive,
      latestDeployment: latest ? toView(latest) : undefined,
      customDomain: site?.customDomain
    };
  },

  async listDeployments(projectId: string): Promise<DeploymentView[]> {
    const latest = await siteDeploymentRepository.getLatest(projectId);
    if (latest && !isTerminalStatus(latest.status)) await this.refreshDeployment(projectId, latest.id);
    return (await siteDeploymentRepository.listForProject(projectId, 50)).map(toView);
  },

  async getDeployment(projectId: string, deploymentId: string): Promise<DeploymentView | null> {
    const dep = await siteDeploymentRepository.getDeployment(projectId, deploymentId);
    if (!dep) return null;
    return toView(isTerminalStatus(dep.status) ? dep : (await this.refreshDeployment(projectId, dep.id)) || dep);
  },

  async getLogs(projectId: string, deploymentId: string): Promise<{ simulated: boolean; lines: ProviderLogLine[] } | null> {
    const dep = await siteDeploymentRepository.getDeployment(projectId, deploymentId);
    if (!dep) return null;
    const config = getPublishingConfig();
    const provider = providerFor(config, dep.provider);
    const lines: ProviderLogLine[] = [];
    if (dep.errorMessage) lines.push({ type: 'stderr', level: 'error', text: dep.errorMessage });
    if (provider) {
      const hosting = await siteDeploymentRepository.getHosting(projectId);
      try {
        lines.unshift(...await provider.getLogs(dep, hosting));
      } catch {
        // Logs are best effort; the stored error above is still returned.
      }
    }
    return { simulated: dep.provider === 'mock', lines };
  },

  /**
   * Publishes (or republishes) the website. The deployment is created and
   * returned immediately; its progress is read through getStatus/refresh.
   */
  async publish(
    projectId: string,
    adminId: string,
    options: {
      siteSlug?: unknown;
      seo?: unknown;
      customDomain?: unknown;
      requestOrigin?: string;
      /** Redeploy requires an existing publication. */
      requireExisting?: boolean;
    } = {}
  ): Promise<{ deployment: DeploymentView; status: PublishingStatusView; message: string }> {
    if (!adminId || !adminId.trim()) {
      throw new PublishingError('UNAUTHENTICATED', 'Authenticated Admin ID is required for publishing.', 401);
    }

    const config = getPublishingConfig();
    const provider = activeProvider(config); // throws NOT_CONFIGURED

    const project = await repository.getProjectById(projectId);
    if (!project) throw new PublishingError('NOT_FOUND', 'Project not found.', 404);

    const existingSite = await publishedSiteRepository.getByProjectId(projectId);
    if (options.requireExisting && !existingSite) {
      throw new PublishingError('NOT_PUBLISHED', 'This website has not been published yet. Use Publish first.', 409);
    }

    let seoOverrides: SiteSeoSettings;
    let customDomain: string | undefined;
    try {
      seoOverrides = validateSeoSettings(options.seo);
      customDomain = options.customDomain !== undefined && options.customDomain !== null && options.customDomain !== ''
        ? normalizeCustomDomain(options.customDomain)
        : undefined;
    } catch (error) {
      throw new PublishingError('INVALID_INPUT', error instanceof Error ? error.message : 'Invalid publishing options.', 400);
    }

    const preflight = await this.preflight(projectId, {
      siteSlug: options.siteSlug ?? (options.requireExisting ? existingSite?.slug : undefined),
      requestOrigin: options.requestOrigin
    });
    if (!preflight.isReadyToPublish || !preflight.siteSlug) {
      throw new PublishingError(
        'PREFLIGHT_FAILED',
        `Publishing checks failed: ${preflight.blockers.join(' | ')}`,
        400,
        preflight.blockers
      );
    }

    // One deployment at a time per site.
    const latest = await siteDeploymentRepository.getLatest(projectId);
    if (latest && !isTerminalStatus(latest.status)) {
      const refreshed = (await this.refreshDeployment(projectId, latest.id)) || latest;
      if (!isTerminalStatus(refreshed.status) && Date.now() - new Date(refreshed.createdAt).getTime() < IN_PROGRESS_STALE_MS) {
        throw new PublishingError('IN_PROGRESS', 'A deployment is already in progress for this website.', 409);
      }
    }

    // Snapshot the CURRENT revision (publishing no longer needs an approved or locked one).
    const revision = project.activeRevisionId ? await repository.getRevisionById(project.activeRevisionId) : null;
    const source = (revision && revision.projectId === projectId ? revision.websiteData : null) || project.generatedWebsite;
    const snapshot = sanitizeWebsiteForPublic(source);
    const now = new Date().toISOString();

    const seo: SiteSeoSettings = {
      ...defaultSeo(project, snapshot as any),
      ...(existingSite?.seo || {}),
      ...seoOverrides
    };

    await publishedSiteRepository.upsert({
      projectId,
      slug: preflight.siteSlug,
      // A first publish stays suspended until the deployment is READY; a republish keeps serving the previous version.
      status: existingSite?.status ?? 'suspended',
      revisionId: revision?.id,
      organizationName: project.requirements.organizationName,
      category: project.requirements.category || project.requirements.organizationType,
      website: snapshot as any,
      seo,
      publishedByAdminId: adminId,
      publishedAt: now
    });

    const site = (await publishedSiteRepository.getByProjectId(projectId))!;

    // Hosting identity for this client (one Vercel project per site).
    let exported: ExportedSite;
    let hosting: SiteHosting;
    try {
      hosting = await provider.ensureHosting({
        projectId,
        siteSlug: site.slug,
        existing: await siteDeploymentRepository.getHosting(projectId),
        origin: options.requestOrigin
      });
      hosting = await siteDeploymentRepository.saveHosting(hosting);

      const activeDomain = site.domainStatus === 'active' ? site.customDomain : undefined;
      const canonicalUrl = activeDomain ? `https://${activeDomain}` : hosting.productionUrl || buildSiteUrl(site.slug, options.requestOrigin);
      exported = await exportSite({
        site,
        canonicalUrl,
        requestOrigin: options.requestOrigin,
        requireBundle: provider.name === 'vercel'
      });
    } catch (error) {
      throw await this._recordFailure(project, provider.name, 'publish', adminId, site.slug, revision?.id, error, config);
    }

    return this._deploy({
      project, provider, hosting, exported, kind: 'publish', adminId, site, revisionId: revision?.id, config,
      customDomain, requestOrigin: options.requestOrigin
    });
  },

  /** Unpublishing deploys a static "offline" page: reversible, and the deployment history is kept. */
  async unpublish(projectId: string, adminId: string, reason?: string, requestOrigin?: string): Promise<{ deployment: DeploymentView; status: PublishingStatusView; message: string }> {
    if (!adminId || !adminId.trim()) {
      throw new PublishingError('UNAUTHENTICATED', 'Authenticated Admin ID is required.', 401);
    }
    const config = getPublishingConfig();
    const project = await repository.getProjectById(projectId);
    if (!project) throw new PublishingError('NOT_FOUND', 'Project not found.', 404);

    const site = await publishedSiteRepository.getByProjectId(projectId);
    const latestReady = await siteDeploymentRepository.getLatestReadyPublish(projectId);
    const latest = await siteDeploymentRepository.getLatest(projectId);
    const isLive = Boolean(site && site.status === 'live');
    if (!isLive && !(latestReady && latest && latest.kind === 'publish')) {
      throw new PublishingError('NOT_PUBLISHED', 'This website is not currently published.', 409);
    }

    const hosting = await siteDeploymentRepository.getHosting(projectId);

    // Legacy sites hosted by the shared DigiVerse deployment have no hosting row: suspend them directly.
    if (!hosting) {
      await publishedSiteRepository.setStatus(projectId, 'suspended');
      project.status = 'preview_ready';
      if (project.deploymentDetails) {
        project.deploymentDetails.suspendedAt = new Date().toISOString();
        project.deploymentDetails.suspensionReason = reason || 'Operator unpublish action';
      }
      project.updatedAt = new Date().toISOString();
      await repository.saveProject(project);
      await auditSystem('UNPUBLISH_PROJECT', projectId, { platform: 'digiverse_shared', reason });
      return { deployment: undefined as any, status: await this.getStatus(projectId, { requestOrigin }), message: 'Website taken offline.' };
    }

    const provider = providerFor(config, hosting.provider);
    if (!provider) {
      throw new PublishingError(
        'NOT_CONFIGURED',
        hosting.provider === 'vercel'
          ? 'Vercel setup is pending, so this site cannot be taken offline from here.'
          : 'Simulated publishing is not enabled.',
        409
      );
    }

    const exported = exportOfflinePage(project.requirements.organizationName);
    return this._deploy({
      project, provider, hosting, exported, kind: 'offline', adminId, site: site!, revisionId: undefined, config,
      reason, requestOrigin
    });
  },

  async _deploy(input: {
    project: ClientProject;
    provider: DeploymentProvider;
    hosting: SiteHosting;
    exported: ExportedSite;
    kind: DeploymentKind;
    adminId: string;
    site: { slug: string; customDomain?: string };
    revisionId?: string;
    config: PublishingConfig;
    customDomain?: string;
    reason?: string;
    requestOrigin?: string;
  }) {
    const { project, provider, exported, kind, adminId, site, config } = input;
    let hosting = input.hosting;

    let result;
    try {
      result = await provider.deploy({
        projectId: project.id,
        siteSlug: site.slug,
        kind,
        hosting,
        site: exported,
        revisionId: input.revisionId
      });
    } catch (error) {
      throw await this._recordFailure(project, provider.name, kind, adminId, site.slug, input.revisionId, error, config);
    }

    if (result.hosting) {
      hosting = await siteDeploymentRepository.saveHosting(result.hosting);
    }

    const created = await siteDeploymentRepository.createDeployment({
      projectId: project.id,
      provider: provider.name,
      kind,
      providerDeploymentId: result.providerDeploymentId,
      status: result.status,
      url: result.url,
      inspectorUrl: result.inspectorUrl,
      revisionId: input.revisionId,
      siteSlug: site.slug,
      bundleHash: exported.bundleHash,
      fileCount: exported.fileCount,
      triggeredByAdminId: adminId
    });

    await auditSystem(kind === 'publish' ? 'PUBLISH_REQUESTED' : 'UNPUBLISH_REQUESTED', project.id, {
      deploymentId: created.id,
      provider: provider.name,
      siteSlug: site.slug,
      revisionId: input.revisionId,
      requestedByAdminId: adminId,
      reason: input.reason
    });

    if (input.customDomain && input.customDomain !== (await publishedSiteRepository.getByProjectId(project.id))?.customDomain) {
      try {
        await publishingService.setCustomDomain(project.id, input.customDomain);
      } catch (error) {
        // The deployment itself succeeded; the domain problem is reported by the domain card.
        console.error('[Publishing] custom domain attach failed:', error instanceof Error ? error.message : 'unknown');
      }
    }

    // Give fast providers (and the zero-delay simulator) a chance to report READY right away.
    const refreshed = (await this.refreshDeployment(project.id, created.id)) || created;
    const status = await this.getStatus(project.id, { requestOrigin: input.requestOrigin });
    const view = toView(refreshed);

    return {
      deployment: view,
      status,
      message:
        refreshed.status === 'ready'
          ? kind === 'publish' ? `Website is live at ${refreshed.url}.` : 'Website taken offline.'
          : refreshed.status === 'failed'
            ? `Deployment failed: ${refreshed.errorMessage || 'unknown error'}`
            : 'Deployment started.'
    };
  },

  async _recordFailure(
    project: ClientProject,
    providerName: DeploymentProviderName,
    kind: DeploymentKind,
    adminId: string,
    siteSlug: string,
    revisionId: string | undefined,
    error: unknown,
    config: PublishingConfig
  ): Promise<PublishingError> {
    const { code, message } = safeErrorMessage(error, config);
    const created = await siteDeploymentRepository.createDeployment({
      projectId: project.id,
      provider: providerName,
      kind,
      status: 'failed',
      revisionId,
      siteSlug,
      errorCode: code,
      errorMessage: message,
      triggeredByAdminId: adminId
    });
    await this._markProjectFailed(project.id, message);
    await auditSystem('DEPLOYMENT_FAILED', project.id, { deploymentId: created.id, provider: providerName, code });
    const status = error instanceof VercelApiError && error.code === 'VERCEL_AUTH' ? 401 : 502;
    const failure = new PublishingError(code, `Deployment failed: ${message}`, status === 401 ? 502 : status);
    failure.deployment = toView(created);
    return failure;
  },

  async _markProjectFailed(projectId: string, message: string): Promise<void> {
    const project = await repository.getProjectById(projectId);
    if (!project) return;
    const hasLive = Boolean(await siteDeploymentRepository.getLatestReadyPublish(projectId));
    if (!hasLive) project.status = 'deployment_failed';
    project.deploymentDetails = { ...(project.deploymentDetails || { platform: 'vercel' as const }), error: message };
    project.updatedAt = new Date().toISOString();
    await repository.saveProject(project);
  },

  /** Reads the provider's state for a deployment and persists every change (including side effects of READY/FAILED). */
  async refreshDeployment(projectId: string, deploymentId: string): Promise<SiteDeployment | null> {
    const dep = await siteDeploymentRepository.getDeployment(projectId, deploymentId);
    if (!dep) return null;
    if (isTerminalStatus(dep.status)) return dep;

    const config = getPublishingConfig();
    const provider = providerFor(config, dep.provider);
    if (!provider) return dep; // provider not usable in this process: leave the record unchanged

    const hosting = await siteDeploymentRepository.getHosting(projectId);
    let state;
    try {
      state = await provider.getState(dep, hosting);
    } catch (error) {
      // A temporary lookup failure must not turn a deployment into a failure.
      console.error('[Publishing] status lookup failed:', error instanceof Error ? scrubSecrets(error.message, config.token) : 'unknown');
      return dep;
    }

    if (state.status === dep.status && !state.url && !state.errorMessage) return dep;

    const patch: Parameters<typeof siteDeploymentRepository.update>[2] = {
      status: state.status,
      url: state.url ?? dep.url,
      inspectorUrl: state.inspectorUrl ?? dep.inspectorUrl
    };
    if (state.status === 'ready') patch.readyAt = new Date().toISOString();
    if (state.status === 'failed' || state.status === 'canceled') {
      patch.errorCode = state.errorCode;
      patch.errorMessage = state.errorMessage ? scrubSecrets(state.errorMessage, config.token) : undefined;
    }

    const updated = (await siteDeploymentRepository.update(projectId, dep.id, patch))!;

    if (updated.status !== dep.status) {
      if (updated.status === 'ready') await this._onReady(projectId, updated);
      if (updated.status === 'failed' || updated.status === 'canceled') {
        await this._markProjectFailed(projectId, updated.errorMessage || 'Deployment failed.');
        await auditSystem('DEPLOYMENT_FAILED', projectId, { deploymentId: updated.id, provider: updated.provider, code: updated.errorCode });
      }
    }
    return updated;
  },

  async _onReady(projectId: string, dep: SiteDeployment): Promise<void> {
    const project = await repository.getProjectById(projectId);
    const site = await publishedSiteRepository.getByProjectId(projectId);
    const hosting = await siteDeploymentRepository.getHosting(projectId);
    const now = new Date().toISOString();

    if (dep.kind === 'publish') {
      if (hosting && dep.url && dep.provider === 'vercel' && hosting.productionUrl !== dep.url) {
        await siteDeploymentRepository.saveHosting({ ...hosting, productionUrl: dep.url, createdAt: hosting.createdAt });
      }
      await publishedSiteRepository.setStatus(projectId, 'live');
      if (project) {
        const activeDomain = site?.domainStatus === 'active' ? site.customDomain : undefined;
        project.status = 'deployed';
        project.deploymentDetails = {
          platform: dep.provider === 'mock' ? 'mock' : 'vercel',
          deployedUrl: activeDomain ? `https://${activeDomain}` : dep.url,
          deployedAt: now,
          siteSlug: dep.siteSlug,
          publishedRevisionId: dep.revisionId,
          customDomain: site?.customDomain,
          deployedByAdminId: dep.triggeredByAdminId,
          vercelDeploymentId: dep.provider === 'vercel' ? dep.providerDeploymentId : undefined
        };
        project.updatedAt = now;
        await repository.saveProject(project);
      }
      await auditSystem('DEPLOYMENT_READY', projectId, { deploymentId: dep.id, provider: dep.provider, url: dep.url });
    } else {
      await publishedSiteRepository.setStatus(projectId, 'suspended');
      if (project) {
        project.status = 'preview_ready';
        if (project.deploymentDetails) {
          project.deploymentDetails.suspendedAt = now;
          project.deploymentDetails.suspensionReason = 'Taken offline from the Publishing Console';
        }
        project.updatedAt = now;
        await repository.saveProject(project);
      }
      await auditSystem('UNPUBLISH_COMPLETED', projectId, { deploymentId: dep.id, provider: dep.provider });
    }
  },

  /** Applies a verified webhook event to the deployment it names. Unknown ids are ignored. */
  async handleWebhookEvent(providerDeploymentId: string): Promise<{ handled: boolean }> {
    const dep = await siteDeploymentRepository.getByProviderDeploymentId(providerDeploymentId);
    if (!dep || dep.provider !== 'vercel') return { handled: false };
    await this.refreshDeployment(dep.projectId, dep.id);
    return { handled: true };
  },

  /** Best-effort removal of the client's hosting project when a DigiVerse project is deleted. */
  async releaseHosting(projectId: string): Promise<{ released: boolean; message?: string }> {
    const hosting = await siteDeploymentRepository.getHosting(projectId);
    if (!hosting) return { released: true };
    const provider = providerFor(getPublishingConfig(), hosting.provider);
    if (!provider) {
      return { released: false, message: 'Hosting provider is not configured; the external site was not removed.' };
    }
    try {
      await provider.releaseHosting(hosting);
      return { released: true };
    } catch (error) {
      return { released: false, message: error instanceof Error ? scrubSecrets(error.message, getPublishingConfig().token) : 'Release failed.' };
    }
  },

  /** Read-only credential and team check (production validation step). Never returns the token. */
  async verifyCredentials(): Promise<{ ok: boolean; mode: PublishingMode; details: Record<string, unknown>; error?: { code: string; message: string } }> {
    const config = getPublishingConfig();
    if (!config.enabled || !config.token) {
      return {
        ok: false,
        mode: config.mode,
        details: { vercelEnabled: config.enabled, tokenConfigured: Boolean(config.token) },
        error: { code: 'NOT_CONFIGURED', message: 'Set VERCEL_ENABLED=true and VERCEL_TOKEN, then run the check again.' }
      };
    }
    try {
      const access = await new VercelClient({ token: config.token, teamId: config.teamId }).verifyAccess();
      const bundle = await loadSiteBundle().catch(() => null);
      return {
        ok: true,
        mode: config.mode,
        details: {
          tokenValid: access.tokenValid,
          account: access.username,
          team: access.team,
          teamConfigured: Boolean(config.teamId),
          webhookSecretConfigured: Boolean(config.webhookSecret),
          siteBundleBuilt: Boolean(bundle),
          siteBundleFiles: bundle?.files.length ?? 0
        }
      };
    } catch (error) {
      return { ok: false, mode: config.mode, details: {}, error: safeErrorMessage(error, config) };
    }
  }
};
