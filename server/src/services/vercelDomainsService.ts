/**
 * Custom-domain management for published client websites.
 *
 * Architecture: a client website that was published through the centralized
 * Vercel integration has its own Vercel project (site_hosting.provider_project_id);
 * its custom domain is attached to THAT project. Legacy sites still hosted by
 * the shared DigiVerse project use DIGIVERSE_VERCEL_PROJECT_ID instead.
 *
 * This service fails closed: without a token and a project id it never calls
 * Vercel and reports `awaiting_vercel_connection`.
 *
 * Endpoints used (Vercel REST API):
 *   POST   /v10/projects/{projectId}/domains            add domain
 *   GET    /v9/projects/{projectId}/domains/{domain}    project-domain status
 *   POST   /v9/projects/{projectId}/domains/{domain}/verify
 *   DELETE /v9/projects/{projectId}/domains/{domain}
 *   GET    /v6/domains/{domain}/config                  DNS configuration check
 *
 * NOT VERIFIED against the live Vercel API in this repository (no account is
 * connected). Unit tests exercise it with a mocked fetch.
 */

import { getVercelDomainsConfig, type VercelDomainsConfig } from '../config.js';
import type { DomainDetails, DomainStatus } from '../db/publishedSiteRepository.js';

const VERCEL_API = 'https://api.vercel.com';

export interface DomainOperationResult {
  status: DomainStatus;
  details: DomainDetails;
}

const HOSTNAME_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** Validates and normalizes a bare hostname such as "www.example.org". */
export function normalizeCustomDomain(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('A custom domain is required.');
  }

  const hostname = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');

  if (
    !hostname ||
    /[/?#@:\s]/.test(hostname) ||
    !HOSTNAME_PATTERN.test(hostname)
  ) {
    throw new Error('Invalid custom domain. Provide a hostname such as www.example.org.');
  }

  if (hostname.endsWith('.vercel.app')) {
    throw new Error('*.vercel.app addresses cannot be attached as custom domains.');
  }

  return hostname;
}

export function isVercelDomainsConfigured(): boolean {
  return getVercelDomainsConfig() !== null;
}

/** Resolves the credentials plus the Vercel project a domain call applies to. */
function resolveConfig(projectIdOverride?: string): VercelDomainsConfig | null {
  const config = getVercelDomainsConfig();
  if (!config) return null;
  const projectId = projectIdOverride || config.projectId;
  return projectId ? { ...config, projectId } : null;
}

function withTeam(url: string, config: VercelDomainsConfig): string {
  if (!config.teamId) return url;
  return `${url}${url.includes('?') ? '&' : '?'}teamId=${encodeURIComponent(config.teamId)}`;
}

async function vercelRequest(
  config: VercelDomainsConfig,
  method: string,
  path: string,
  body?: unknown
): Promise<{ ok: boolean; status: number; data: any }> {
  const response = await fetch(withTeam(`${VERCEL_API}${path}`, config), {
    method,
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json'
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

function awaitingConnection(domain: string): DomainOperationResult {
  return {
    status: 'awaiting_vercel_connection',
    details: {
      lastCheckedAt: new Date().toISOString(),
      message:
        `Domain ${domain} is reserved for this site in DigiVerse, but no Vercel account is connected yet. ` +
        'Configure VERCEL_ENABLED, VERCEL_TOKEN (and publish the site) to attach it automatically, ' +
        'or add it manually in the Vercel dashboard (Project → Settings → Domains).'
    }
  };
}

function interpretProjectDomain(domain: string, projectDomain: any, config: any): DomainOperationResult {
  const verified = Boolean(projectDomain?.verified);
  const misconfigured = Boolean(config?.misconfigured);
  const verification = Array.isArray(projectDomain?.verification)
    ? projectDomain.verification.map((v: any) => ({
        type: String(v.type),
        domain: String(v.domain),
        value: String(v.value),
        reason: v.reason ? String(v.reason) : undefined
      }))
    : undefined;

  const isApex = domain.split('.').length === 2;
  const recommendedRecords = isApex
    ? [{ type: 'A', name: '@', value: '76.76.21.21' }]
    : [{ type: 'CNAME', name: domain.split('.')[0], value: 'cname.vercel-dns.com' }];

  let status: DomainStatus = 'active';
  let message = `Domain ${domain} is verified and correctly configured.`;

  if (!verified) {
    status = 'pending_verification';
    message = `Domain ${domain} was added to Vercel and is waiting for ownership verification.`;
  } else if (misconfigured) {
    status = 'misconfigured';
    message = `Domain ${domain} is verified but its DNS records do not point to Vercel yet.`;
  }

  return {
    status,
    details: {
      verified,
      misconfigured,
      verification,
      recommendedRecords,
      lastCheckedAt: new Date().toISOString(),
      message
    }
  };
}

async function fetchStatus(config: VercelDomainsConfig, domain: string): Promise<DomainOperationResult> {
  const projectDomain = await vercelRequest(
    config,
    'GET',
    `/v9/projects/${encodeURIComponent(config.projectId)}/domains/${encodeURIComponent(domain)}`
  );

  if (!projectDomain.ok) {
    return {
      status: 'error',
      details: {
        lastCheckedAt: new Date().toISOString(),
        message: projectDomain.data?.error?.message || `Vercel returned HTTP ${projectDomain.status}.`
      }
    };
  }

  const dnsConfig = await vercelRequest(config, 'GET', `/v6/domains/${encodeURIComponent(domain)}/config`);
  return interpretProjectDomain(domain, projectDomain.data, dnsConfig.ok ? dnsConfig.data : undefined);
}

export const vercelDomainsService = {
  async attachDomain(domain: string, projectIdOverride?: string): Promise<DomainOperationResult> {
    const config = resolveConfig(projectIdOverride);
    if (!config) return awaitingConnection(domain);

    const added = await vercelRequest(
      config,
      'POST',
      `/v10/projects/${encodeURIComponent(config.projectId)}/domains`,
      { name: domain }
    );

    // 409 = already attached to this project; treat as success and read status.
    if (!added.ok && added.status !== 409) {
      return {
        status: 'error',
        details: {
          lastCheckedAt: new Date().toISOString(),
          message: added.data?.error?.message || `Vercel returned HTTP ${added.status} while adding the domain.`
        }
      };
    }

    return fetchStatus(config, domain);
  },

  async refreshStatus(domain: string, projectIdOverride?: string): Promise<DomainOperationResult> {
    const config = resolveConfig(projectIdOverride);
    if (!config) return awaitingConnection(domain);

    // Ask Vercel to re-check verification, then read the current state.
    await vercelRequest(
      config,
      'POST',
      `/v9/projects/${encodeURIComponent(config.projectId)}/domains/${encodeURIComponent(domain)}/verify`
    ).catch(() => undefined);

    return fetchStatus(config, domain);
  },

  async detachDomain(domain: string, projectIdOverride?: string): Promise<{ removed: boolean; message: string }> {
    const config = resolveConfig(projectIdOverride);
    if (!config) {
      return { removed: true, message: 'Domain released in DigiVerse (no Vercel account connected).' };
    }

    const result = await vercelRequest(
      config,
      'DELETE',
      `/v9/projects/${encodeURIComponent(config.projectId)}/domains/${encodeURIComponent(domain)}`
    );

    if (!result.ok && result.status !== 404) {
      return {
        removed: false,
        message: result.data?.error?.message || `Vercel returned HTTP ${result.status} while removing the domain.`
      };
    }

    return { removed: true, message: `Domain ${domain} removed from the Vercel project.` };
  }
};
