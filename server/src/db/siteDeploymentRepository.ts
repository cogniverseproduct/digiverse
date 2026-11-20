/**
 * Persistence for centralized publishing: one hosting identity per client
 * site (site_hosting) and its independent deployment history (site_deployments).
 *
 * Every read is keyed by project id, so one client's deployment data can never
 * be returned for another project. Nothing in these tables is a credential.
 */

import { randomUUID } from 'node:crypto';
import { getDb } from './database.js';

export type DeploymentProviderName = 'vercel' | 'mock';
export type DeploymentKind = 'publish' | 'offline';
export type DeploymentStatus = 'queued' | 'building' | 'ready' | 'failed' | 'canceled';

export interface SiteHosting {
  projectId: string;
  provider: DeploymentProviderName;
  providerProjectId?: string;
  providerProjectName?: string;
  productionUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SiteDeployment {
  id: string;
  projectId: string;
  provider: DeploymentProviderName;
  kind: DeploymentKind;
  providerDeploymentId?: string;
  status: DeploymentStatus;
  url?: string;
  inspectorUrl?: string;
  revisionId?: string;
  siteSlug?: string;
  bundleHash?: string;
  fileCount?: number;
  errorCode?: string;
  errorMessage?: string;
  triggeredByAdminId?: string;
  createdAt: string;
  readyAt?: string;
  updatedAt: string;
}

const TERMINAL: DeploymentStatus[] = ['ready', 'failed', 'canceled'];

export function isTerminalStatus(status: DeploymentStatus): boolean {
  return TERMINAL.includes(status);
}

function mapHosting(row: any): SiteHosting {
  return {
    projectId: row.project_id,
    provider: row.provider,
    providerProjectId: row.provider_project_id || undefined,
    providerProjectName: row.provider_project_name || undefined,
    productionUrl: row.production_url || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapDeployment(row: any): SiteDeployment {
  return {
    id: row.id,
    projectId: row.project_id,
    provider: row.provider,
    kind: row.kind,
    providerDeploymentId: row.provider_deployment_id || undefined,
    status: row.status,
    url: row.url || undefined,
    inspectorUrl: row.inspector_url || undefined,
    revisionId: row.revision_id || undefined,
    siteSlug: row.site_slug || undefined,
    bundleHash: row.bundle_hash || undefined,
    fileCount: row.file_count === null || row.file_count === undefined ? undefined : Number(row.file_count),
    errorCode: row.error_code || undefined,
    errorMessage: row.error_message || undefined,
    triggeredByAdminId: row.triggered_by_admin_id || undefined,
    createdAt: row.created_at,
    readyAt: row.ready_at || undefined,
    updatedAt: row.updated_at
  };
}

export const siteDeploymentRepository = {
  async getHosting(projectId: string): Promise<SiteHosting | null> {
    const db = await getDb();
    const row = await db.get('SELECT * FROM site_hosting WHERE project_id = ?', [projectId]);
    return row ? mapHosting(row) : null;
  },

  async saveHosting(hosting: Omit<SiteHosting, 'createdAt' | 'updatedAt'> & { createdAt?: string }): Promise<SiteHosting> {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO site_hosting (
        project_id, provider, provider_project_id, provider_project_name, production_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(project_id) DO UPDATE SET
        provider = excluded.provider,
        provider_project_id = excluded.provider_project_id,
        provider_project_name = excluded.provider_project_name,
        production_url = excluded.production_url,
        updated_at = excluded.updated_at`,
      [
        hosting.projectId,
        hosting.provider,
        hosting.providerProjectId || null,
        hosting.providerProjectName || null,
        hosting.productionUrl || null,
        hosting.createdAt || now,
        now
      ]
    );
    return (await this.getHosting(hosting.projectId))!;
  },

  async createDeployment(input: {
    projectId: string;
    provider: DeploymentProviderName;
    kind: DeploymentKind;
    status?: DeploymentStatus;
    providerDeploymentId?: string;
    url?: string;
    inspectorUrl?: string;
    revisionId?: string;
    siteSlug?: string;
    bundleHash?: string;
    fileCount?: number;
    errorCode?: string;
    errorMessage?: string;
    triggeredByAdminId?: string;
  }): Promise<SiteDeployment> {
    const db = await getDb();
    const now = new Date().toISOString();
    const id = `dep_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
    await db.run(
      `INSERT INTO site_deployments (
        id, project_id, provider, kind, provider_deployment_id, status, url, inspector_url,
        revision_id, site_slug, bundle_hash, file_count, error_code, error_message,
        triggered_by_admin_id, created_at, ready_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.projectId,
        input.provider,
        input.kind,
        input.providerDeploymentId || null,
        input.status || 'queued',
        input.url || null,
        input.inspectorUrl || null,
        input.revisionId || null,
        input.siteSlug || null,
        input.bundleHash || null,
        input.fileCount ?? null,
        input.errorCode || null,
        input.errorMessage || null,
        input.triggeredByAdminId || null,
        now,
        null,
        now
      ]
    );
    return (await this.getDeployment(input.projectId, id))!;
  },

  /** Always scoped by project id: a deployment id from another project is never returned. */
  async getDeployment(projectId: string, id: string): Promise<SiteDeployment | null> {
    const db = await getDb();
    const row = await db.get('SELECT * FROM site_deployments WHERE project_id = ? AND id = ?', [projectId, id]);
    return row ? mapDeployment(row) : null;
  },

  /** Used only by the signed webhook, which has no project context. */
  async getByProviderDeploymentId(providerDeploymentId: string): Promise<SiteDeployment | null> {
    const db = await getDb();
    const row = await db.get('SELECT * FROM site_deployments WHERE provider_deployment_id = ?', [providerDeploymentId]);
    return row ? mapDeployment(row) : null;
  },

  async listForProject(projectId: string, limit = 25): Promise<SiteDeployment[]> {
    const db = await getDb();
    const rows = await db.all(
      'SELECT * FROM site_deployments WHERE project_id = ? ORDER BY created_at DESC, id DESC LIMIT ?',
      [projectId, Math.max(1, Math.min(limit, 100))]
    );
    return rows.map(mapDeployment);
  },

  async getLatest(projectId: string): Promise<SiteDeployment | null> {
    const list = await this.listForProject(projectId, 1);
    return list[0] || null;
  },

  /** Newest finished, successful PUBLISH deployment (what visitors currently see). */
  async getLatestReadyPublish(projectId: string): Promise<SiteDeployment | null> {
    const db = await getDb();
    const row = await db.get(
      `SELECT * FROM site_deployments
       WHERE project_id = ? AND kind = 'publish' AND status = 'ready'
       ORDER BY created_at DESC, id DESC LIMIT 1`,
      [projectId]
    );
    return row ? mapDeployment(row) : null;
  },

  async update(
    projectId: string,
    id: string,
    patch: Partial<Pick<SiteDeployment,
      'status' | 'url' | 'inspectorUrl' | 'providerDeploymentId' | 'errorCode' | 'errorMessage' | 'readyAt'>>
  ): Promise<SiteDeployment | null> {
    const db = await getDb();
    const fields: string[] = [];
    const values: Array<string | null> = [];
    const map: Record<string, string> = {
      status: 'status',
      url: 'url',
      inspectorUrl: 'inspector_url',
      providerDeploymentId: 'provider_deployment_id',
      errorCode: 'error_code',
      errorMessage: 'error_message',
      readyAt: 'ready_at'
    };
    for (const [key, column] of Object.entries(map)) {
      if (key in patch) {
        fields.push(`${column} = ?`);
        const value = (patch as any)[key];
        values.push(value === undefined || value === '' ? null : String(value));
      }
    }
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    await db.run(
      `UPDATE site_deployments SET ${fields.join(', ')} WHERE project_id = ? AND id = ?`,
      [...values, projectId, id]
    );
    return this.getDeployment(projectId, id);
  }
};
