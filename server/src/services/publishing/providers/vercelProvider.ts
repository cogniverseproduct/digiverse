/**
 * Real Vercel deployments through the centralized DigiVerse team.
 *
 * One Vercel project per client site, created on first publish; every publish
 * is a new production deployment of that project (static files, no build).
 * Clients never have Vercel accounts and never see the token.
 *
 * NOT exercised against the live Vercel API in this repository (no account is
 * connected). Unit tests drive it with a mocked fetch.
 */

import { randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import type { SiteDeployment, SiteHosting } from '../../../db/siteDeploymentRepository.js';
import {
  VercelApiError,
  VercelClient,
  mapReadyState,
  type DeploymentFileInput,
  type VercelDeploymentInfo
} from '../vercelClient.js';
import type { ExportedFile } from '../siteExporter.js';
import {
  PublishingProviderError,
  type DeployInput,
  type DeployResult,
  type DeploymentProvider,
  type DeploymentState,
  type EnsureHostingInput,
  type ProviderLogLine
} from './types.js';

const UPLOAD_CONCURRENCY = 8;

function projectNameFor(slug: string): string {
  // Lowercase letters, digits and hyphens only; the random suffix avoids clashes inside the team.
  return `dv-${slug}-${randomBytes(3).toString('hex')}`.slice(0, 100);
}

function productionUrlFor(projectName: string): string {
  return `https://${projectName}.vercel.app`;
}

async function readAsset(file: ExportedFile): Promise<Buffer> {
  if (file.content) return file.content;
  if (!file.absolutePath) throw new PublishingProviderError('BUNDLE_INVALID', `File ${file.path} has no source.`);
  return fs.readFile(file.absolutePath);
}

async function mapLimit<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  let index = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await worker(current);
    }
  });
  await Promise.all(runners);
}

export class VercelProvider implements DeploymentProvider {
  readonly name = 'vercel' as const;
  readonly #client: VercelClient;

  constructor(client: VercelClient) {
    this.#client = client;
  }

  async ensureHosting(input: EnsureHostingInput): Promise<SiteHosting> {
    const existing = input.existing;
    if (existing && existing.provider === 'vercel' && existing.providerProjectId) {
      return {
        ...existing,
        productionUrl: existing.productionUrl || (existing.providerProjectName ? productionUrlFor(existing.providerProjectName) : undefined)
      };
    }
    return this.#createHosting(input.projectId, input.siteSlug);
  }

  async #createHosting(projectId: string, siteSlug: string): Promise<SiteHosting> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const name = projectNameFor(siteSlug);
      try {
        const project = await this.#client.createProject(name);
        const now = new Date().toISOString();
        return {
          projectId,
          provider: 'vercel',
          providerProjectId: project.id,
          providerProjectName: project.name,
          productionUrl: productionUrlFor(project.name),
          createdAt: now,
          updatedAt: now
        };
      } catch (error) {
        lastError = error;
        if (error instanceof VercelApiError && error.code === 'VERCEL_CONFLICT') continue; // name taken: new suffix
        throw error;
      }
    }
    throw lastError;
  }

  async #toInputs(files: ExportedFile[]): Promise<DeploymentFileInput[]> {
    const inputs: DeploymentFileInput[] = [];
    for (const file of files) {
      if (file.content) {
        inputs.push({ file: file.path, data: file.content.toString('base64'), encoding: 'base64' });
      } else {
        inputs.push({ file: file.path, sha: file.sha1, size: file.size });
      }
    }
    return inputs;
  }

  async #create(hosting: SiteHosting, input: DeployInput) {
    const files = await this.#toInputs(input.site.files);
    const meta = { digiverseProject: input.projectId, digiverseKind: input.kind, digiverseSlug: input.siteSlug };
    const call = () => this.#client.createDeployment({
      name: hosting.providerProjectName || projectNameFor(input.siteSlug),
      projectId: hosting.providerProjectId!,
      files,
      target: 'production',
      meta
    });

    try {
      return await call();
    } catch (error) {
      if (!(error instanceof VercelApiError) || error.code !== 'VERCEL_MISSING_FILES') throw error;

      // Vercel does not have some referenced files yet: upload them, then retry once.
      const assets = input.site.files.filter((f) => !f.content);
      const wanted = error.missing && error.missing.length > 0 ? new Set(error.missing) : null;
      const toUpload = wanted ? assets.filter((f) => wanted.has(f.sha1)) : assets;
      await mapLimit(toUpload, UPLOAD_CONCURRENCY, async (file) => {
        await this.#client.uploadFile(file.sha1, await readAsset(file));
      });
      return call();
    }
  }

  async deploy(input: DeployInput): Promise<DeployResult> {
    let hosting = input.hosting;
    let created: VercelDeploymentInfo;
    let replacedHosting: SiteHosting | undefined;

    try {
      created = await this.#create(hosting, input);
    } catch (error) {
      // The Vercel project was deleted outside DigiVerse: create a new one once and retry.
      if (error instanceof VercelApiError && error.code === 'VERCEL_NOT_FOUND') {
        hosting = await this.#createHosting(input.projectId, input.siteSlug);
        replacedHosting = hosting;
        created = await this.#create(hosting, input);
      } else {
        throw error;
      }
    }

    return {
      providerDeploymentId: created.id,
      status: mapReadyState(created.readyState),
      url: created.url ? `https://${created.url}` : undefined,
      inspectorUrl: created.inspectorUrl,
      hosting: replacedHosting
    };
  }

  async getState(deployment: SiteDeployment, hosting: SiteHosting | null): Promise<DeploymentState> {
    if (!deployment.providerDeploymentId) {
      return { status: 'failed', errorCode: 'NO_PROVIDER_ID', errorMessage: 'The deployment has no Vercel deployment id.' };
    }
    const info = await this.#client.getDeployment(deployment.providerDeploymentId);
    const status = mapReadyState(info.readyState);
    let url: string | undefined;

    if (status === 'ready') {
      const preferred = hosting?.providerProjectName ? `${hosting.providerProjectName}.vercel.app` : undefined;
      const alias = (preferred && info.alias.includes(preferred) ? preferred : undefined) || info.alias[0];
      url = alias ? `https://${alias}` : info.url ? `https://${info.url}` : hosting?.productionUrl;
    }

    return {
      status,
      url,
      inspectorUrl: info.inspectorUrl,
      errorCode: status === 'failed' || status === 'canceled' ? info.errorCode || (status === 'canceled' ? 'CANCELED' : 'BUILD_FAILED') : undefined,
      errorMessage: status === 'failed' || status === 'canceled'
        ? info.errorMessage || (status === 'canceled' ? 'The deployment was canceled.' : 'Vercel reported that the deployment failed.')
        : undefined
    };
  }

  async getLogs(deployment: SiteDeployment): Promise<ProviderLogLine[]> {
    if (!deployment.providerDeploymentId) return [];
    return this.#client.getDeploymentLogs(deployment.providerDeploymentId);
  }

  async releaseHosting(hosting: SiteHosting): Promise<void> {
    if (hosting.provider !== 'vercel' || !hosting.providerProjectId) return;
    await this.#client.deleteProject(hosting.providerProjectId);
  }

  domainProjectId(hosting: SiteHosting | null): string | undefined {
    return hosting?.provider === 'vercel' ? hosting.providerProjectId : undefined;
  }
}
