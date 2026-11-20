/**
 * Simulated deployments for local development.
 *
 * Nothing leaves this machine and nothing is uploaded anywhere. Every record
 * this provider creates is stored with provider = 'mock' and shown as
 * "Simulated" in the Publishing Console; it is never presented as a Vercel
 * deployment. The "URL" is the local shared /live/<slug> route.
 *
 * The state advances from timestamps (queued -> building -> ready) when it is
 * read, so no background timer is needed. Only available outside Vercel and
 * production (see getPublishingConfig).
 */

import { randomBytes } from 'node:crypto';
import { getPublishingConfig } from '../../../config.js';
import type { SiteDeployment, SiteHosting } from '../../../db/siteDeploymentRepository.js';
import { buildSiteUrl } from '../../siteRouting.js';
import type {
  DeployInput,
  DeployResult,
  DeploymentProvider,
  DeploymentState,
  EnsureHostingInput,
  ProviderLogLine
} from './types.js';

export class MockProvider implements DeploymentProvider {
  readonly name = 'mock' as const;

  async ensureHosting(input: EnsureHostingInput): Promise<SiteHosting> {
    if (input.existing && input.existing.provider === 'mock') {
      return { ...input.existing, productionUrl: buildSiteUrl(input.siteSlug, input.origin) };
    }
    const now = new Date().toISOString();
    return {
      projectId: input.projectId,
      provider: 'mock',
      providerProjectId: undefined,
      providerProjectName: `simulated-${input.siteSlug}`,
      productionUrl: buildSiteUrl(input.siteSlug, input.origin),
      createdAt: now,
      updatedAt: now
    };
  }

  async deploy(_input: DeployInput): Promise<DeployResult> {
    return {
      providerDeploymentId: `mock_${randomBytes(8).toString('hex')}`,
      status: 'queued'
    };
  }

  async getState(deployment: SiteDeployment, hosting: SiteHosting | null): Promise<DeploymentState> {
    const config = getPublishingConfig();
    const step = config.mockStepMs;
    const elapsed = Date.now() - new Date(deployment.createdAt).getTime();

    if (step > 0 && elapsed < step) return { status: 'queued' };
    if (step > 0 && elapsed < step * 2) return { status: 'building' };

    if (config.mockOutcome === 'fail') {
      return {
        status: 'failed',
        errorCode: 'MOCK_FAILURE',
        errorMessage: 'Simulated failure (PUBLISH_MOCK_OUTCOME=fail). No real deployment was attempted.'
      };
    }

    return { status: 'ready', url: hosting?.productionUrl };
  }

  async getLogs(deployment: SiteDeployment): Promise<ProviderLogLine[]> {
    const base = new Date(deployment.createdAt).getTime();
    const lines: ProviderLogLine[] = [
      { type: 'stdout', text: '[simulated] No real deployment is happening: Vercel is not connected.', createdAt: base },
      { type: 'stdout', text: `[simulated] Prepared ${deployment.fileCount ?? 0} files for ${deployment.siteSlug || 'the site'}.`, createdAt: base + 1 }
    ];
    if (deployment.status === 'ready') lines.push({ type: 'deployment-state', text: '[simulated] Ready.', createdAt: base + 2 });
    if (deployment.status === 'failed') lines.push({ type: 'stderr', level: 'error', text: `[simulated] ${deployment.errorMessage || 'Failed.'}`, createdAt: base + 2 });
    return lines;
  }

  async releaseHosting(): Promise<void> {
    // Nothing exists outside the local database.
  }

  domainProjectId(): string | undefined {
    return undefined;
  }
}
