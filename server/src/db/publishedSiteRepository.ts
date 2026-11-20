import { getDb } from './database.js';
import type { GeneratedWebsite } from '../types/index.js';

export type PublishedSiteStatus = 'live' | 'suspended';

export type DomainStatus =
  | 'awaiting_vercel_connection'
  | 'pending_verification'
  | 'misconfigured'
  | 'active'
  | 'error';

export interface SiteSeoSettings {
  title?: string;
  description?: string;
  ogImageUrl?: string;
  keywords?: string[];
  noIndex?: boolean;
}

export interface DomainDetails {
  verified?: boolean;
  misconfigured?: boolean;
  verification?: Array<{ type: string; domain: string; value: string; reason?: string }>;
  recommendedRecords?: Array<{ type: string; name: string; value: string }>;
  lastCheckedAt?: string;
  message?: string;
}

export interface PublishedSite {
  projectId: string;
  slug: string;
  status: PublishedSiteStatus;
  revisionId?: string;
  organizationName: string;
  category?: string;
  website: GeneratedWebsite;
  seo: SiteSeoSettings;
  customDomain?: string;
  domainStatus?: DomainStatus;
  domainDetails?: DomainDetails;
  publishedByAdminId?: string;
  publishedAt: string;
  updatedAt: string;
}

/** Lightweight listing row (no website snapshot). */
export type PublishedSiteSummary = Omit<PublishedSite, 'website'>;

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string' || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapSummary(row: any): PublishedSiteSummary {
  return {
    projectId: row.project_id,
    slug: row.slug,
    status: row.status,
    revisionId: row.revision_id || undefined,
    organizationName: row.organization_name,
    category: row.category || undefined,
    seo: parseJson<SiteSeoSettings>(row.seo_json, {}),
    customDomain: row.custom_domain || undefined,
    domainStatus: row.domain_status || undefined,
    domainDetails: parseJson<DomainDetails | undefined>(row.domain_details_json, undefined),
    publishedByAdminId: row.published_by_admin_id || undefined,
    publishedAt: row.published_at,
    updatedAt: row.updated_at
  };
}

function mapRow(row: any): PublishedSite {
  return {
    ...mapSummary(row),
    website: parseJson<GeneratedWebsite>(row.website_json, {} as GeneratedWebsite)
  };
}

const SUMMARY_COLUMNS = `
  project_id, slug, status, revision_id, organization_name, category, seo_json,
  custom_domain, domain_status, domain_details_json, published_by_admin_id,
  published_at, updated_at
`;

export const publishedSiteRepository = {
  async getByProjectId(projectId: string): Promise<PublishedSite | null> {
    const db = await getDb();
    const row = await db.get('SELECT * FROM published_sites WHERE project_id = ?', [projectId]);
    return row ? mapRow(row) : null;
  },

  async getBySlug(slug: string): Promise<PublishedSite | null> {
    const db = await getDb();
    const row = await db.get('SELECT * FROM published_sites WHERE slug = ?', [
      slug.trim().toLowerCase()
    ]);
    return row ? mapRow(row) : null;
  },

  async getByCustomDomain(domain: string): Promise<PublishedSite | null> {
    const db = await getDb();
    const row = await db.get('SELECT * FROM published_sites WHERE custom_domain = ?', [
      domain.trim().toLowerCase()
    ]);
    return row ? mapRow(row) : null;
  },

  async list(): Promise<PublishedSiteSummary[]> {
    const db = await getDb();
    const rows = await db.all(
      `SELECT ${SUMMARY_COLUMNS} FROM published_sites ORDER BY updated_at DESC`
    );
    return rows.map(mapSummary);
  },

  /** Inserts or replaces the published snapshot for a project. */
  async upsert(site: {
    projectId: string;
    slug: string;
    status: PublishedSiteStatus;
    revisionId?: string;
    organizationName: string;
    category?: string;
    website: GeneratedWebsite;
    seo: SiteSeoSettings;
    publishedByAdminId?: string;
    publishedAt: string;
  }): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO published_sites (
        project_id, slug, status, revision_id, organization_name, category,
        website_json, seo_json, published_by_admin_id, published_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(project_id) DO UPDATE SET
        slug = excluded.slug,
        status = excluded.status,
        revision_id = excluded.revision_id,
        organization_name = excluded.organization_name,
        category = excluded.category,
        website_json = excluded.website_json,
        seo_json = excluded.seo_json,
        published_by_admin_id = excluded.published_by_admin_id,
        published_at = excluded.published_at,
        updated_at = excluded.updated_at`,
      [
        site.projectId,
        site.slug.toLowerCase(),
        site.status,
        site.revisionId || null,
        site.organizationName,
        site.category || null,
        JSON.stringify(site.website),
        JSON.stringify(site.seo || {}),
        site.publishedByAdminId || null,
        site.publishedAt,
        now
      ]
    );
  },

  async setStatus(projectId: string, status: PublishedSiteStatus): Promise<boolean> {
    const db = await getDb();
    const result = await db.run(
      'UPDATE published_sites SET status = ?, updated_at = ? WHERE project_id = ?',
      [status, new Date().toISOString(), projectId]
    );
    return result.changes > 0;
  },

  async updateSeo(projectId: string, seo: SiteSeoSettings): Promise<boolean> {
    const db = await getDb();
    const result = await db.run(
      'UPDATE published_sites SET seo_json = ?, updated_at = ? WHERE project_id = ?',
      [JSON.stringify(seo), new Date().toISOString(), projectId]
    );
    return result.changes > 0;
  },

  async setCustomDomain(
    projectId: string,
    domain: string | null,
    status: DomainStatus | null,
    details: DomainDetails | null
  ): Promise<boolean> {
    const db = await getDb();
    const result = await db.run(
      `UPDATE published_sites
       SET custom_domain = ?, domain_status = ?, domain_details_json = ?, updated_at = ?
       WHERE project_id = ?`,
      [
        domain ? domain.toLowerCase() : null,
        status,
        details ? JSON.stringify(details) : null,
        new Date().toISOString(),
        projectId
      ]
    );
    return result.changes > 0;
  },

  async isSlugTakenByOtherProject(slug: string, projectId: string): Promise<boolean> {
    const db = await getDb();
    const row = await db.get(
      'SELECT project_id FROM published_sites WHERE slug = ? AND project_id <> ?',
      [slug.toLowerCase(), projectId]
    );
    return Boolean(row);
  },

  async isDomainTakenByOtherProject(domain: string, projectId: string): Promise<boolean> {
    const db = await getDb();
    const row = await db.get(
      'SELECT project_id FROM published_sites WHERE custom_domain = ? AND project_id <> ?',
      [domain.toLowerCase(), projectId]
    );
    return Boolean(row);
  }
};
