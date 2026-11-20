import { getDb } from './database.js';
import { isValidEmail } from '../utils/email.js';
import {
  AuditLog,
  ClientFeedback,
  ClientProject,
  CommercialRecord,
  CommercialScopeItem,
  CommercialTransaction,
  DemoInquiry,
  DriveMediaItem,
  MediaSource,
  OwnershipTransfer,
  OwnershipTransferStatus,
  PlatformCommercialOverview,
  PreviewToken,
  ProjectRevision,
  Tenant,
  User,
  UserRole,
  AccountStatus,
  YouTubeVideo
} from '../types/index.js';

export const repository = {
  // --- INQUIRIES ---
  async saveInquiry(inquiry: DemoInquiry): Promise<void> {
    const db = await getDb();
    await db.run(`
      INSERT INTO demo_inquiries (
        id, name, organization, email, phone, organization_type, preferred_language, requirements, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [inquiry.id,
      inquiry.name,
      inquiry.organization,
      inquiry.email,
      inquiry.phone || null,
      inquiry.organizationType,
      inquiry.preferredLanguage,
      inquiry.requirements || null,
      inquiry.createdAt]);
  },

  async listInquiries(): Promise<DemoInquiry[]> {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM demo_inquiries ORDER BY created_at DESC') as any[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      organization: r.organization,
      email: r.email,
      phone: r.phone || undefined,
      organizationType: r.organization_type,
      preferredLanguage: r.preferred_language,
      requirements: r.requirements || undefined,
      createdAt: r.created_at
    }));
  },

  // --- PROJECTS ---
  async listProjects(tenantId?: string, assignedAdminId?: string): Promise<ClientProject[]> {
    const db = await getDb();
    let query = `
      SELECT p.* FROM projects p
      LEFT JOIN tenants t ON p.tenant_id = t.id
    `;
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (tenantId) {
      whereClauses.push('p.tenant_id = ?');
      params.push(tenantId);
    }
    if (assignedAdminId) {
      // Same rule as canAccessTenant: assigned to them, or unassigned and created by them.
      whereClauses.push("(t.assigned_admin_id = ? OR (t.assigned_admin_id = '' AND t.created_by_admin_id = ?))");
      params.push(assignedAdminId, assignedAdminId);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }
    query += ' ORDER BY p.updated_at DESC';

    const rows = await db.all(query, [...params]) as any[];
    return rows.map(mapRowToProject);
  },

  async getProjectById(id: string): Promise<ClientProject | null> {
    const db = await getDb();
    const row = await db.get('SELECT * FROM projects WHERE id = ?', [id]) as any;
    if (!row) return null;
    return mapRowToProject(row);
  },

  async getProjectBySlug(slug: string): Promise<ClientProject | null> {
    const db = await getDb();
    const row = await db.get('SELECT * FROM projects WHERE lower(tenant_slug) = ? ORDER BY updated_at DESC LIMIT 1', [slug.trim().toLowerCase()]) as any;
    if (!row) return null;
    return mapRowToProject(row);
  },

  async saveProject(project: ClientProject): Promise<void> {
    const db = await getDb();
    const existing = await db.get('SELECT id FROM projects WHERE id = ?', [project.id]);

    if (existing) {
      await db.run(`
        UPDATE projects SET
          tenant_id = ?,
          tenant_slug = ?,
          title = ?,
          status = ?,
          requirements_json = ?,
          generated_website_json = ?,
          active_revision_id = ?,
          approved_revision_id = ?,
          approval_details_json = ?,
          deployment_details_json = ?,
          updated_at = ?
        WHERE id = ?
      `, [project.tenantId || null,
        project.tenantSlug,
        project.requirements.organizationName || 'Main Website Project',
        project.status,
        JSON.stringify(project.requirements),
        project.generatedWebsite ? JSON.stringify(project.generatedWebsite) : null,
        project.activeRevisionId || null,
        project.approvedRevisionId || null,
        project.approvalDetails ? JSON.stringify(project.approvalDetails) : null,
        project.deploymentDetails ? JSON.stringify(project.deploymentDetails) : null,
        project.updatedAt,
        project.id]);
    } else {
      await db.run(`
        INSERT INTO projects (
          id, tenant_id, tenant_slug, title, status, requirements_json,
          generated_website_json, active_revision_id, approved_revision_id,
          approval_details_json, deployment_details_json,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [project.id,
        project.tenantId || null,
        project.tenantSlug,
        project.requirements.organizationName || 'Main Website Project',
        project.status,
        JSON.stringify(project.requirements),
        project.generatedWebsite ? JSON.stringify(project.generatedWebsite) : null,
        project.activeRevisionId || null,
        project.approvedRevisionId || null,
        project.approvalDetails ? JSON.stringify(project.approvalDetails) : null,
        project.deploymentDetails ? JSON.stringify(project.deploymentDetails) : null,
        project.createdAt,
        project.updatedAt]);
    }

    // Keep normalized project_requirements table synchronized
    try {
      const req = project.requirements;
      await db.run(`
        INSERT INTO project_requirements (
          project_id, organization_name, category, subcategory, tagline, description,
          logo_url, cover_image_url, primary_color, accent_color, typography_style,
          preferred_language, enabled_pages_json, selected_template_json,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(project_id) DO UPDATE SET
          organization_name = excluded.organization_name,
          category = excluded.category,
          subcategory = excluded.subcategory,
          tagline = excluded.tagline,
          description = excluded.description,
          logo_url = excluded.logo_url,
          cover_image_url = excluded.cover_image_url,
          primary_color = excluded.primary_color,
          accent_color = excluded.accent_color,
          typography_style = excluded.typography_style,
          preferred_language = excluded.preferred_language,
          enabled_pages_json = excluded.enabled_pages_json,
          selected_template_json = excluded.selected_template_json,
          updated_at = excluded.updated_at
      `, [project.id,
        req.organizationName || 'Main Website Project',
        req.category || 'general',
        (req as any).subcategory || null,
        req.tagline || null,
        req.aboutText || null,
        req.logoUrl || null,
        req.coverImageUrl || null,
        req.primaryColor || '#000000',
        req.accentColor || '#ffffff',
        req.typographyStyle || 'modern',
        req.preferredLanguage || 'en',
        JSON.stringify(req.enabledSections || {}),
        req.selectedTemplate ? JSON.stringify(req.selectedTemplate) : null,
        project.createdAt,
        project.updatedAt]);
    } catch {
      // Safe fallback if optional table structure varies
    }
  },

  async deleteProject(id: string): Promise<boolean> {
    const db = await getDb();

    return db.transaction(async () => {
      await db.run('DELETE FROM drive_media_items WHERE project_id = ?', [id]);
      await db.run('DELETE FROM media_sources WHERE project_id = ?', [id]);
      await db.run('DELETE FROM youtube_videos WHERE project_id = ?', [id]);
      await db.run('DELETE FROM project_revisions WHERE project_id = ?', [id]);
      await db.run('DELETE FROM commercial_transactions WHERE project_id = ?', [id]);
      await db.run('DELETE FROM commercial_records WHERE project_id = ?', [id]);
      await db.run('DELETE FROM client_feedback WHERE project_id = ?', [id]);
      await db.run('DELETE FROM preview_tokens WHERE project_id = ?', [id]);
      await db.run('DELETE FROM project_requirements WHERE project_id = ?', [id]);
      await db.run('DELETE FROM published_sites WHERE project_id = ?', [id]);
      await db.run('DELETE FROM site_deployments WHERE project_id = ?', [id]);
      await db.run('DELETE FROM site_hosting WHERE project_id = ?', [id]);
      const res = await db.run('DELETE FROM projects WHERE id = ?', [id]);
      return res.changes > 0;
    });
  },

  // --- TENANTS & MULTI-TENANCY ---
  async saveTenant(tenant: Tenant): Promise<void> {
    const db = await getDb();
    const existing = await db.get('SELECT id FROM tenants WHERE id = ?', [tenant.id]);

    if (existing) {
      await db.run(`
        UPDATE tenants SET
          slug = ?, name = ?, organization_type = ?, category = ?, subcategory = ?, contact_person = ?,
          contact_email = ?, contact_phone = ?, address = ?, website_language = ?,
          assigned_admin_id = ?, updated_at = ?
        WHERE id = ?
      `, [tenant.slug, tenant.name, tenant.category, tenant.category, tenant.subcategory || null, tenant.contactPerson,
        tenant.contactEmail, tenant.contactPhone || null, tenant.address || null, tenant.websiteLanguage,
        tenant.assignedAdminId, tenant.updatedAt, tenant.id]);
    } else {
      await db.run(`
        INSERT INTO tenants (
          id, slug, name, organization_type, category, subcategory, contact_person, contact_email,
          contact_phone, address, website_language, created_by_admin_id, assigned_admin_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [tenant.id, tenant.slug, tenant.name, tenant.category, tenant.category, tenant.subcategory || null, tenant.contactPerson,
        tenant.contactEmail, tenant.contactPhone || null, tenant.address || null, tenant.websiteLanguage,
        tenant.createdByAdminId, tenant.assignedAdminId, tenant.createdAt, tenant.updatedAt]);
    }
  },

  async getTenantById(id: string): Promise<Tenant | null> {
    const db = await getDb();
    const row = await db.get('SELECT * FROM tenants WHERE id = ?', [id]) as any;
    if (!row) return null;
    return mapRowToTenant(row);
  },

  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const db = await getDb();
    const row = await db.get('SELECT * FROM tenants WHERE lower(slug) = ?', [slug.trim().toLowerCase()]) as any;
    if (!row) return null;
    return mapRowToTenant(row);
  },

  /** Number of projects per organisation, for the Super Admin ownership panel. */
  async countProjectsByTenant(): Promise<Record<string, number>> {
    const db = await getDb();
    const rows = await db.all('SELECT tenant_id, COUNT(*) AS n FROM projects WHERE tenant_id IS NOT NULL GROUP BY tenant_id', []) as any[];
    return Object.fromEntries(rows.map((r) => [String(r.tenant_id), Number(r.n)]));
  },

  async listTenants(assignedAdminId?: string): Promise<Tenant[]> {
    const db = await getDb();
    let query = 'SELECT * FROM tenants';
    const params: any[] = [];

    if (assignedAdminId) {
      query += " WHERE (assigned_admin_id = ? OR (assigned_admin_id = '' AND created_by_admin_id = ?))";
      params.push(assignedAdminId, assignedAdminId);
    }

    query += ' ORDER BY updated_at DESC';
    const rows = await db.all(query, [...params]) as any[];
    return rows.map(mapRowToTenant);
  },

  async deleteTenant(id: string): Promise<boolean> {
    const db = await getDb();
    return db.transaction(async () => {
      const tenantProjects = await db.all('SELECT id FROM projects WHERE tenant_id = ?', [id]) as any[];

      for (const p of tenantProjects) {
        await this.deleteProject(p.id);
      }

      const res = await db.run('DELETE FROM tenants WHERE id = ?', [id]);
      return res.changes > 0;
    });
  },

  // --- MEDIA SOURCES (Google Drive) ---
  async saveMediaSource(source: MediaSource): Promise<void> {
    const db = await getDb();
    const existing = await db.get('SELECT id FROM media_sources WHERE id = ?', [source.id]);

    if (existing) {
      await db.run(`
        UPDATE media_sources SET
          project_id = ?,
          source_type = ?,
          folder_id = ?,
          folder_url = ?,
          status = ?,
          sync_status = ?,
          last_synced_at = ?,
          error_message = ?
        WHERE id = ?
      `, [source.projectId,
        source.sourceType,
        source.folderId || null,
        source.folderUrl || null,
        source.status,
        source.syncStatus,
        source.lastSyncedAt || null,
        source.errorMessage || null,
        source.id]);
    } else {
      await db.run(`
        INSERT INTO media_sources (
          id, project_id, source_type, folder_id, folder_url,
          status, sync_status, last_synced_at, error_message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [source.id,
        source.projectId,
        source.sourceType,
        source.folderId || null,
        source.folderUrl || null,
        source.status,
        source.syncStatus,
        source.lastSyncedAt || null,
        source.errorMessage || null,
        source.createdAt]);
    }
  },

  async getMediaSourcesByProject(projectId: string): Promise<MediaSource[]> {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM media_sources WHERE project_id = ? ORDER BY created_at ASC, id ASC', [projectId]) as any[];

    return rows.map(mapRowToMediaSource);
  },

  // Older code compatibility.
  async getMediaSourceByProject(projectId: string): Promise<MediaSource | null> {
    return (await this.getMediaSourcesByProject(projectId))[0] || null;
  },

  // Delete one source and its media items atomically.
  async deleteMediaSource(sourceId: string, projectId: string): Promise<boolean> {
    const db = await getDb();

    return db.transaction(async () => {
      await db.run('DELETE FROM drive_media_items WHERE source_id = ? AND project_id = ?', [sourceId, projectId]);

      const result = await db.run('DELETE FROM media_sources WHERE id = ? AND project_id = ?', [sourceId, projectId]);

      return result.changes > 0;
    });
  },

  // --- DRIVE MEDIA ITEMS ---
  async saveDriveMediaItem(item: DriveMediaItem): Promise<void> {
    const db = await getDb();
    const existing = await db.get('SELECT id FROM drive_media_items WHERE id = ?', [item.id]);

    if (existing) {
      await db.run(`
        UPDATE drive_media_items SET
          project_id = ?,
          source_id = ?,
          drive_file_id = ?,
          name = ?,
          mime_type = ?,
          media_type = ?,
          size_bytes = ?,
          thumbnail_url = ?,
          is_approved = ?,
          section_assignment = ?
        WHERE id = ?
      `, [item.projectId,
        item.sourceId || null,
        item.driveFileId,
        item.name,
        item.mimeType,
        item.mediaType,
        item.sizeBytes || null,
        item.thumbnailUrl || null,
        item.isApproved ? 1 : 0,
        item.sectionAssignment,
        item.id]);
    } else {
      await db.run(`
        INSERT INTO drive_media_items (
          id, project_id, source_id, drive_file_id, name,
          mime_type, media_type, size_bytes, thumbnail_url,
          is_approved, section_assignment, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [item.id,
        item.projectId,
        item.sourceId || null,
        item.driveFileId,
        item.name,
        item.mimeType,
        item.mediaType,
        item.sizeBytes || null,
        item.thumbnailUrl || null,
        item.isApproved ? 1 : 0,
        item.sectionAssignment,
        item.createdAt]);
    }
  },

  // Replace media records for one Drive source.
  // Existing approvals and assignments are preserved for files that remain.
  async replaceDriveMediaItemsForSource(
    sourceId: string,
    projectId: string,
    items: DriveMediaItem[]
  ): Promise<void> {
    const db = await getDb();

    await db.transaction(async () => {
      const existingRows = await db.all('SELECT * FROM drive_media_items WHERE source_id = ? AND project_id = ?', [sourceId, projectId]) as any[];

      const existingByDriveId = new Map<string, any>(
        existingRows.map((row) => [row.drive_file_id, row])
      );

      await db.run('DELETE FROM drive_media_items WHERE source_id = ? AND project_id = ?', [sourceId, projectId]);

      for (const item of items) {
        if (item.projectId !== projectId || item.sourceId !== sourceId) {
          throw new Error('Drive media item project/source does not match replacement scope.');
        }

        const previous = existingByDriveId.get(item.driveFileId);

        const itemToSave: DriveMediaItem = previous
          ? {
              ...item,
              id: previous.id,
              isApproved: Boolean(previous.is_approved),
              sectionAssignment: previous.section_assignment,
              createdAt: previous.created_at
            }
          : item;

        await this.saveDriveMediaItem(itemToSave);
      }
    });
  },

  async getDriveMediaByProject(projectId: string): Promise<DriveMediaItem[]> {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM drive_media_items WHERE project_id = ? ORDER BY created_at ASC', [projectId]) as any[];

    return rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      sourceId: r.source_id || undefined,
      driveFileId: r.drive_file_id,
      name: r.name,
      mimeType: r.mime_type,
      mediaType: r.media_type,
      sizeBytes: r.size_bytes || undefined,
      thumbnailUrl: r.thumbnail_url || undefined,
      isApproved: Boolean(r.is_approved),
      sectionAssignment: r.section_assignment,
      createdAt: r.created_at
    }));
  },

  /** Owning project of a Drive media item (used to check ownership before changing an item that is addressed by its own id). */
  async getDriveMediaProjectId(id: string): Promise<string | null> {
    const db = await getDb();
    const row = await db.get('SELECT project_id FROM drive_media_items WHERE id = ?', [id]) as any;
    return row ? String(row.project_id) : null;
  },

  async updateDriveMediaAssignment(
    id: string,
    assignment: 'hero' | 'events' | 'gallery' | 'unassigned',
    isApproved: boolean
  ): Promise<boolean> {
    const db = await getDb();
    const res = await db.run(`
      UPDATE drive_media_items SET
        section_assignment = ?,
        is_approved = ?
      WHERE id = ?
    `, [assignment, isApproved ? 1 : 0, id]);

    return res.changes > 0;
  },

  // --- YOUTUBE VIDEOS ---
  async saveYouTubeVideo(video: YouTubeVideo): Promise<void> {
    const db = await getDb();
    const existing = await db.get('SELECT id FROM youtube_videos WHERE id = ?', [video.id]);

    if (existing) {
      await db.run(`
        UPDATE youtube_videos SET
          title = ?,
          category = ?,
          display_order = ?,
          is_published = ?
        WHERE id = ?
      `, [video.title,
        video.category,
        video.displayOrder,
        video.isPublished ? 1 : 0,
        video.id]);
    } else {
      await db.run(`
        INSERT INTO youtube_videos (
          id, project_id, video_id, original_url, embed_url,
          title, thumbnail_url, category, display_order, is_published, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [video.id,
        video.projectId,
        video.videoId,
        video.originalUrl,
        video.embedUrl,
        video.title,
        video.thumbnailUrl || null,
        video.category,
        video.displayOrder,
        video.isPublished ? 1 : 0,
        video.createdAt]);
    }
  },

  async getYouTubeVideosByProject(projectId: string): Promise<YouTubeVideo[]> {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM youtube_videos WHERE project_id = ? ORDER BY display_order ASC, created_at ASC', [projectId]) as any[];

    return rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      videoId: r.video_id,
      originalUrl: r.original_url,
      embedUrl: r.embed_url,
      title: r.title,
      thumbnailUrl: r.thumbnail_url || undefined,
      category: r.category,
      displayOrder: r.display_order,
      isPublished: Boolean(r.is_published),
      createdAt: r.created_at
    }));
  },

  async deleteYouTubeVideo(id: string, projectId: string): Promise<boolean> {
    const db = await getDb();
    const res = await db.run('DELETE FROM youtube_videos WHERE id = ? AND project_id = ?', [id, projectId]);

    return res.changes > 0;
  },

    // --- USERS & RBAC ---

  async getUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    const db = await getDb();

    const row = await db.get('SELECT * FROM users WHERE lower(email) = ?', [email.trim().toLowerCase()]) as any;

    if (!row) return null;

    const isActive = Boolean(row.is_active ?? 1);
    const accountStatus: AccountStatus = row.account_status
      ? (row.account_status as AccountStatus)
      : (isActive ? 'ACTIVE' : 'DISABLED');

    return {
      id: row.id,
      email: row.email ?? '',
      username: row.username ?? undefined,
      name: row.name,
      role: (
        row.role.toUpperCase() === 'SUPER_ADMIN'
          ? 'SUPER_ADMIN'
          : 'ADMIN'
      ) as UserRole,
      isActive: accountStatus === 'ACTIVE',
      accountStatus,
      disabledReason: row.disabled_reason || undefined,
      disabledAt: row.disabled_at || undefined,
      lastLoginAt: row.last_login_at || undefined,
      tokenVersion: Number(row.token_version ?? 1),
      mustChangePassword: Number(row.must_change_password ?? 0) === 1,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  async getUserByUsername(username: string): Promise<(User & { passwordHash: string }) | null> {
    const db = await getDb();

    const row = await db.get('SELECT * FROM users WHERE lower(username) = ?', [username.trim().toLowerCase()]) as any;

    if (!row) return null;

    const isActive = Boolean(row.is_active ?? 1);
    const accountStatus: AccountStatus = row.account_status
      ? (row.account_status as AccountStatus)
      : (isActive ? 'ACTIVE' : 'DISABLED');

    return {
      id: row.id,
      email: row.email ?? '',
      username: row.username ?? undefined,
      name: row.name,
      role: (
        row.role.toUpperCase() === 'SUPER_ADMIN'
          ? 'SUPER_ADMIN'
          : 'ADMIN'
      ) as UserRole,
      isActive: accountStatus === 'ACTIVE',
      accountStatus,
      disabledReason: row.disabled_reason || undefined,
      disabledAt: row.disabled_at || undefined,
      lastLoginAt: row.last_login_at || undefined,
      tokenVersion: Number(row.token_version ?? 1),
      mustChangePassword: Number(row.must_change_password ?? 0) === 1,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  async getUserById(id: string): Promise<User | null> {
    const db = await getDb();

    const row = await db.get('SELECT * FROM users WHERE id = ?', [id]) as any;

    if (!row) return null;

    const isActive = Boolean(row.is_active ?? 1);
    const accountStatus: AccountStatus = row.account_status
      ? (row.account_status as AccountStatus)
      : (isActive ? 'ACTIVE' : 'DISABLED');

    return {
      id: row.id,
      email: row.email ?? '',
      username: row.username ?? undefined,
      name: row.name,
      role: (
        row.role.toUpperCase() === 'SUPER_ADMIN'
          ? 'SUPER_ADMIN'
          : 'ADMIN'
      ) as UserRole,
      isActive: accountStatus === 'ACTIVE',
      accountStatus,
      disabledReason: row.disabled_reason || undefined,
      disabledAt: row.disabled_at || undefined,
      lastLoginAt: row.last_login_at || undefined,
      tokenVersion: Number(row.token_version ?? 1),
      isPlatformOwner: Number(row.is_platform_owner ?? 0) === 1 && row.role.toUpperCase() === 'SUPER_ADMIN',
      mustChangePassword: Number(row.must_change_password ?? 0) === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  async listUsers(): Promise<User[]> {
    const db = await getDb();

    const rows = await db.all(`
      SELECT
        id,
        email,
        username,
        name,
        role,
        is_active,
        account_status,
        disabled_reason,
        disabled_at,
        last_login_at,
        token_version,
        is_platform_owner,
        must_change_password,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at ASC
    `) as any[];

    return rows.map((row) => {
      const isActive = Boolean(row.is_active ?? 1);
      const accountStatus: AccountStatus = row.account_status
        ? (row.account_status as AccountStatus)
        : (isActive ? 'ACTIVE' : 'DISABLED');

      return {
        id: row.id,
        email: row.email ?? '',
        username: row.username ?? undefined,
        name: row.name,
        role: (
          row.role.toUpperCase() === 'SUPER_ADMIN'
            ? 'SUPER_ADMIN'
            : 'ADMIN'
        ) as UserRole,
        isActive: accountStatus === 'ACTIVE',
        accountStatus,
        disabledReason: row.disabled_reason || undefined,
        disabledAt: row.disabled_at || undefined,
        lastLoginAt: row.last_login_at || undefined,
        tokenVersion: Number(row.token_version ?? 1),
        isPlatformOwner: Number(row.is_platform_owner ?? 0) === 1 && String(row.role).toUpperCase() === 'SUPER_ADMIN',
        mustChangePassword: Number(row.must_change_password ?? 0) === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });
  },

  /**
   * Super Admin accounts by state. "Active" means a usable account: role SUPER_ADMIN,
   * ACTIVE status, enabled, with a password hash. Used to decide whether first-run
   * setup may open; it never reads or returns identities.
   */
  async countSuperAdmins(): Promise<{ active: number; total: number }> {
    const db = await getDb();
    const row = await db.get<{ total: number; active: number }>(`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(CASE
          WHEN COALESCE(account_status, 'ACTIVE') = 'ACTIVE'
           AND COALESCE(is_active, 1) = 1
           AND password_hash IS NOT NULL AND password_hash <> ''
          THEN 1 ELSE 0 END), 0) AS active
      FROM users
      WHERE upper(role) = 'SUPER_ADMIN'
    `);
    return { active: Number(row?.active ?? 0), total: Number(row?.total ?? 0) };
  },

  async createUser(user: {
    id: string;
    email?: string | null;
    username?: string | null;
    passwordHash: string;
    name: string;
    role: UserRole;
    isActive: boolean;
    isPlatformOwner?: boolean;
  }): Promise<User> {
    const db = await getDb();

    const now = new Date().toISOString();

    const email = user.email?.trim().toLowerCase() || null;
    const username = user.username?.trim().toLowerCase() || null;

    // Syntax only (any provider/domain). Username-only Admins may have no email.
    if (email && !isValidEmail(email)) {
      throw new Error('INVALID_EMAIL');
    }

    if (user.role === 'ADMIN' && !username) {
      throw new Error('ADMIN_USERNAME_REQUIRED');
    }

    if (user.role === 'SUPER_ADMIN' && !email) {
      throw new Error('SUPER_ADMIN_EMAIL_REQUIRED');
    }

    await db.run(`
      INSERT INTO users (
        id,
        email,
        username,
        password_hash,
        name,
        role,
        is_active,
        is_platform_owner,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [user.id,
      email,
      username,
      user.passwordHash,
      user.name.trim(),
      user.role,
      user.isActive ? 1 : 0,
      user.isPlatformOwner && user.role === 'SUPER_ADMIN' ? 1 : 0,
      now,
      now]);

    return {
      id: user.id,
      email: email ?? '',
      username: username ?? undefined,
      name: user.name.trim(),
      role: user.role,
      isActive: user.isActive,
      isPlatformOwner: Boolean(user.isPlatformOwner && user.role === 'SUPER_ADMIN'),
      createdAt: now,
      updatedAt: now
    };
  },

  async updateUserStatus(id: string, isActive: boolean): Promise<boolean> {
    const db = await getDb();
    const now = new Date().toISOString();
    const accountStatus = isActive ? 'ACTIVE' : 'DISABLED';

    const result = await db.run(`
      UPDATE users
      SET is_active = ?, account_status = ?, token_version = token_version + 1, updated_at = ?
      WHERE id = ?
    `, [isActive ? 1 : 0,
      accountStatus,
      now,
      id]);

    return result.changes > 0;
  },

  async disableUser(id: string, reason?: string): Promise<boolean> {
    const db = await getDb();
    const now = new Date().toISOString();

    const result = await db.run(`
      UPDATE users
      SET
        account_status = 'DISABLED',
        is_active = 0,
        disabled_reason = ?,
        disabled_at = ?,
        token_version = token_version + 1,
        updated_at = ?
      WHERE id = ? AND role != 'SUPER_ADMIN'
    `, [reason ? reason.trim() : null,
      now,
      now,
      id]);

    return result.changes > 0;
  },

  async enableUser(id: string): Promise<boolean> {
    const db = await getDb();
    const now = new Date().toISOString();

    const result = await db.run(`
      UPDATE users
      SET
        account_status = 'ACTIVE',
        is_active = 1,
        disabled_reason = NULL,
        disabled_at = NULL,
        updated_at = ?
      WHERE id = ? AND role != 'SUPER_ADMIN'
    `, [now,
      id]);

    return result.changes > 0;
  },

  async removeUser(id: string, reason?: string): Promise<boolean> {
    const db = await getDb();
    const now = new Date().toISOString();

    const result = await db.run(`
      UPDATE users
      SET
        account_status = 'REMOVED',
        is_active = 0,
        disabled_reason = ?,
        disabled_at = ?,
        token_version = token_version + 1,
        updated_at = ?
      WHERE id = ? AND role != 'SUPER_ADMIN'
    `, [reason ? reason.trim() : null,
      now,
      now,
      id]);

    return result.changes > 0;
  },

  async incrementTokenVersion(id: string): Promise<boolean> {
    const db = await getDb();
    const now = new Date().toISOString();

    const result = await db.run(`
      UPDATE users
      SET token_version = token_version + 1, updated_at = ?
      WHERE id = ?
    `, [now, id]);

    return result.changes > 0;
  },

  async updateLastLogin(id: string): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();

    await db.run(`
      UPDATE users
      SET last_login_at = ?
      WHERE id = ?
    `, [now, id]);
  },

  async updateUserProfile(id: string, updates: { name?: string; username?: string }): Promise<User> {
    const db = await getDb();
    const existing = await this.getUserById(id);
    if (!existing) {
      throw new Error('USER_NOT_FOUND');
    }

    const now = new Date().toISOString();
    const newName = updates.name !== undefined ? updates.name.trim() : existing.name;
    let newUsername = existing.username;

    if (updates.username !== undefined) {
      const cleanUsername = updates.username.trim().toLowerCase();
      if (cleanUsername) {
        const conflict = await db.get('SELECT id FROM users WHERE lower(username) = ? AND id != ?', [cleanUsername, id]);
        if (conflict) {
          throw new Error('USERNAME_ALREADY_TAKEN');
        }
        newUsername = cleanUsername;
      }
    }

    await db.run(`
      UPDATE users
      SET name = ?, username = ?, updated_at = ?
      WHERE id = ?
    `, [newName, newUsername || null, now, id]);

    return {
      ...existing,
      name: newName,
      username: newUsername || undefined,
      updatedAt: now
    };
  },

  async updateUserPassword(id: string, passwordHash: string): Promise<boolean> {
    const db = await getDb();
    const now = new Date().toISOString();
    const result = await db.run(`
      UPDATE users
      SET password_hash = ?, token_version = token_version + 1, must_change_password = 0, updated_at = ?
      WHERE id = ?
    `, [passwordHash, now, id]);

    return result.changes > 0;
  },

  // --- OWNERSHIP TRANSFERS ---
  async createOwnershipTransfer(transfer: OwnershipTransfer): Promise<OwnershipTransfer> {
    const db = await getDb();
    await db.run(`
      INSERT INTO ownership_transfers (
        id, current_owner_id, current_owner_email, target_name, target_email,
        transfer_token, status, candidate_username, candidate_password_hash,
        expires_at, accepted_at, confirmed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [transfer.id,
      transfer.currentOwnerId,
      transfer.currentOwnerEmail.trim().toLowerCase(),
      transfer.targetName.trim(),
      transfer.targetEmail.trim().toLowerCase(),
      transfer.transferToken,
      transfer.status,
      transfer.candidateUsername || null,
      transfer.candidatePasswordHash || null,
      transfer.expiresAt,
      transfer.acceptedAt || null,
      transfer.confirmedAt || null,
      transfer.createdAt,
      transfer.updatedAt]);

    return transfer;
  },

  async getOwnershipTransferById(id: string): Promise<OwnershipTransfer | null> {
    const db = await getDb();
    const row = await db.get('SELECT * FROM ownership_transfers WHERE id = ?', [id]) as any;
    if (!row) return null;
    return mapRowToOwnershipTransfer(row);
  },

  async getOwnershipTransferByToken(token: string): Promise<OwnershipTransfer | null> {
    const db = await getDb();
    const row = await db.get('SELECT * FROM ownership_transfers WHERE transfer_token = ?', [token]) as any;
    if (!row) return null;
    return mapRowToOwnershipTransfer(row);
  },

  async getActiveOwnershipTransfer(): Promise<OwnershipTransfer | null> {
    const db = await getDb();
    const now = new Date().toISOString();
    const row = await db.get(`
      SELECT * FROM ownership_transfers
      WHERE status IN ('PENDING', 'ACCEPTED') AND expires_at > ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [now]) as any;
    if (!row) return null;
    return mapRowToOwnershipTransfer(row);
  },

  async updateOwnershipTransfer(
    id: string,
    updates: Partial<Pick<OwnershipTransfer, 'status' | 'candidateUsername' | 'candidatePasswordHash' | 'acceptedAt' | 'confirmedAt'>>
  ): Promise<boolean> {
    const db = await getDb();
    const fields: string[] = ['updated_at = ?'];
    const now = new Date().toISOString();
    const params: any[] = [now];

    if (updates.status !== undefined) {
      fields.push('status = ?');
      params.push(updates.status);
    }
    if (updates.candidateUsername !== undefined) {
      fields.push('candidate_username = ?');
      params.push(updates.candidateUsername);
    }
    if (updates.candidatePasswordHash !== undefined) {
      fields.push('candidate_password_hash = ?');
      params.push(updates.candidatePasswordHash);
    }
    if (updates.acceptedAt !== undefined) {
      fields.push('accepted_at = ?');
      params.push(updates.acceptedAt);
    }
    if (updates.confirmedAt !== undefined) {
      fields.push('confirmed_at = ?');
      params.push(updates.confirmedAt);
    }

    params.push(id);
    const result = await db.run(`UPDATE ownership_transfers SET ${fields.join(', ')} WHERE id = ?`, [...params]);
    return result.changes > 0;
  },

  // --- AUDIT LOGS ---
  async createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const db = await getDb();
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    await db.run(`
      INSERT INTO audit_logs (id, user_id, user_email, user_role, action, resource_type, resource_id, details_json, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id,
      log.userId,
      log.userEmail,
      log.userRole,
      log.action,
      log.resourceType,
      log.resourceId || null,
      log.details ? JSON.stringify(log.details) : null,
      log.ipAddress || null,
      now]);

    return {
      id,
      ...log,
      createdAt: now
    };
  },

  async listAuditLogs(limit = 100): Promise<AuditLog[]> {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?', [limit]) as any[];

    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      userEmail: r.user_email,
      userRole: r.user_role as UserRole,
      action: r.action,
      resourceType: r.resource_type,
      resourceId: r.resource_id || undefined,
      details: r.details_json ? JSON.parse(r.details_json) : undefined,
      ipAddress: r.ip_address || undefined,
      createdAt: r.created_at
    }));
  },

  // --- REVISIONS & VERSION MANAGEMENT ---
  async createRevision(rev: ProjectRevision): Promise<ProjectRevision> {
    const db = await getDb();

    await db.run(`
      INSERT INTO project_revisions (
        id, project_id, version_number, variation_label, website_data_json, is_approved, created_by_admin_id, changelog_notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [rev.id,
      rev.projectId,
      rev.versionNumber,
      rev.variationLabel,
      JSON.stringify(rev.websiteData),
      rev.isApproved ? 1 : 0,
      rev.createdByAdminId,
      rev.changelogNotes || null,
      rev.createdAt]);

    return rev;
  },

  async getRevisionById(id: string): Promise<ProjectRevision | null> {
    const db = await getDb();
    const row = await db.get('SELECT * FROM project_revisions WHERE id = ?', [id]) as any;

    if (!row) return null;
    return mapRowToRevision(row);
  },

  async listRevisionsByProject(projectId: string): Promise<ProjectRevision[]> {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM project_revisions WHERE project_id = ? ORDER BY version_number ASC, created_at ASC', [projectId]) as any[];

    return rows.map(mapRowToRevision);
  },

  async markRevisionApproved(id: string): Promise<boolean> {
    const db = await getDb();
    const res = await db.run('UPDATE project_revisions SET is_approved = 1 WHERE id = ?', [id]);

    return res.changes > 0;
  },

  async updateRevision(
    id: string,
    updates: { changelogNotes?: string; variationLabel?: string }
  ): Promise<boolean> {
    const db = await getDb();
    const existing = await db.get('SELECT * FROM project_revisions WHERE id = ?', [id]) as any;

    if (!existing) return false;

    const newNotes = updates.changelogNotes !== undefined
      ? updates.changelogNotes
      : existing.changelog_notes;

    const newLabel = updates.variationLabel !== undefined
      ? updates.variationLabel
      : existing.variation_label;

    const res = await db.run('UPDATE project_revisions SET changelog_notes = ?, variation_label = ? WHERE id = ?', [newNotes, newLabel, id]);

    return res.changes > 0;
  },

  async getApprovedRevision(projectId: string): Promise<ProjectRevision | null> {
    const db = await getDb();
    const row = await db.get('SELECT * FROM project_revisions WHERE project_id = ? AND is_approved = 1 ORDER BY version_number DESC LIMIT 1', [projectId]) as any;

    if (!row) return null;
    return mapRowToRevision(row);
  },

  // --- COMMERCIAL RECORDS ---
  async getCommercialRecord(projectId: string): Promise<CommercialRecord | null> {
    const db = await getDb();
    const row = await db.get('SELECT * FROM commercial_records WHERE project_id = ?', [projectId]) as any;

    if (!row) return null;

    let scopeItems: CommercialScopeItem[] | undefined;

    if (row.scope_items) {
      try {
        scopeItems = JSON.parse(row.scope_items);
      } catch {
        scopeItems = [];
      }
    }

    const txRows = await db.all('SELECT * FROM commercial_transactions WHERE project_id = ? ORDER BY created_at DESC', [projectId]) as any[];

    const transactions: CommercialTransaction[] = txRows.map(tx => ({
      id: tx.id,
      commercialRecordId: tx.commercial_record_id,
      projectId: tx.project_id,
      amount: tx.amount,
      currency: tx.currency,
      paymentMethod: tx.payment_method,
      transactionReference: tx.transaction_reference || undefined,
      recordedByAdminId: tx.recorded_by_admin_id,
      notes: tx.notes || undefined,
      createdAt: tx.created_at
    }));

    return {
      id: row.id,
      projectId: row.project_id,
      quotationNumber: row.quotation_number || undefined,
      quotationAmount: row.quotation_amount,
      currency: row.currency,
      quotationStatus: row.quotation_status || 'draft',
      scopeItems,
      paymentTerms: row.payment_terms || undefined,
      validUntil: row.valid_until || undefined,
      paymentStatus: row.payment_status,
      invoiceNumber: row.invoice_number || undefined,
      invoiceDate: row.invoice_date || undefined,
      dueDate: row.due_date || undefined,
      invoiceStatus: row.invoice_status || 'unissued',
      amountPaid: row.amount_paid || 0,
      paymentMethod: row.payment_method || undefined,
      paymentReference: row.payment_reference || undefined,
      paymentDate: row.payment_date || undefined,
      commercialStatus: row.commercial_status,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      transactions
    };
  },

  async saveCommercialRecord(record: CommercialRecord): Promise<void> {
    const db = await getDb();
    const existing = await db.get('SELECT id FROM commercial_records WHERE project_id = ?', [record.projectId]);

    const scopeItemsJson = record.scopeItems
      ? JSON.stringify(record.scopeItems)
      : null;

    if (existing) {
      await db.run(`
        UPDATE commercial_records SET
          quotation_number = ?, quotation_amount = ?, currency = ?, quotation_status = ?,
          scope_items = ?, payment_terms = ?, valid_until = ?,
          payment_status = ?, invoice_number = ?, invoice_date = ?, due_date = ?, invoice_status = ?,
          amount_paid = ?, payment_method = ?, payment_reference = ?, payment_date = ?,
          commercial_status = ?, notes = ?, updated_at = ?
        WHERE project_id = ?
      `, [record.quotationNumber || null, record.quotationAmount, record.currency, record.quotationStatus || 'draft',
        scopeItemsJson, record.paymentTerms || null, record.validUntil || null,
        record.paymentStatus, record.invoiceNumber || null, record.invoiceDate || null, record.dueDate || null, record.invoiceStatus || 'unissued',
        record.amountPaid || 0, record.paymentMethod || null, record.paymentReference || null, record.paymentDate || null,
        record.commercialStatus, record.notes || null, record.updatedAt, record.projectId]);
    } else {
      await db.run(`
        INSERT INTO commercial_records (
          id, project_id, quotation_number, quotation_amount, currency, quotation_status,
          scope_items, payment_terms, valid_until,
          payment_status, invoice_number, invoice_date, due_date, invoice_status,
          amount_paid, payment_method, payment_reference, payment_date,
          commercial_status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [record.id, record.projectId, record.quotationNumber || null, record.quotationAmount, record.currency, record.quotationStatus || 'draft',
        scopeItemsJson, record.paymentTerms || null, record.validUntil || null,
        record.paymentStatus, record.invoiceNumber || null, record.invoiceDate || null, record.dueDate || null, record.invoiceStatus || 'unissued',
        record.amountPaid || 0, record.paymentMethod || null, record.paymentReference || null, record.paymentDate || null,
        record.commercialStatus, record.notes || null, record.createdAt, record.updatedAt]);
    }
  },

  async createCommercialTransaction(tx: CommercialTransaction): Promise<void> {
    const db = await getDb();

    await db.run(`
      INSERT INTO commercial_transactions (
        id, commercial_record_id, project_id, amount, currency, payment_method,
        transaction_reference, recorded_by_admin_id, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [tx.id, tx.commercialRecordId, tx.projectId, tx.amount, tx.currency, tx.paymentMethod,
      tx.transactionReference || null, tx.recordedByAdminId, tx.notes || null, tx.createdAt]);
  },

  async getCommercialTransactions(projectId: string): Promise<CommercialTransaction[]> {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM commercial_transactions WHERE project_id = ? ORDER BY created_at DESC', [projectId]) as any[];

    return rows.map(tx => ({
      id: tx.id,
      commercialRecordId: tx.commercial_record_id,
      projectId: tx.project_id,
      amount: tx.amount,
      currency: tx.currency,
      paymentMethod: tx.payment_method,
      transactionReference: tx.transaction_reference || undefined,
      recordedByAdminId: tx.recorded_by_admin_id,
      notes: tx.notes || undefined,
      createdAt: tx.created_at
    }));
  },

  async getPlatformCommercialOverview(): Promise<PlatformCommercialOverview> {
    const db = await getDb();
    const allRecords = await db.all('SELECT * FROM commercial_records') as any[];
    const txRows = await db.all('SELECT * FROM commercial_transactions ORDER BY created_at DESC LIMIT 20') as any[];

    let totalQuotedPipeline = 0;
    let totalRevenueCollected = 0;
    let totalInvoicesIssued = 0;

    const commercialStatusCounts: Record<string, number> = {};
    const paymentStatusCounts: Record<string, number> = {};
    const quotationStatusCounts: Record<string, number> = {};

    for (const r of allRecords) {
      totalQuotedPipeline += (r.quotation_amount || 0);
      totalRevenueCollected += (r.amount_paid || 0);

      if (r.invoice_number) {
        totalInvoicesIssued++;
      }

      const cs = r.commercial_status || 'proposal_stage';
      commercialStatusCounts[cs] = (commercialStatusCounts[cs] || 0) + 1;

      const ps = r.payment_status || 'unquoted';
      paymentStatusCounts[ps] = (paymentStatusCounts[ps] || 0) + 1;

      const qs = r.quotation_status || 'draft';
      quotationStatusCounts[qs] = (quotationStatusCounts[qs] || 0) + 1;
    }

    const totalOutstanding = Math.max(0, totalQuotedPipeline - totalRevenueCollected);

    const recentTransactions: CommercialTransaction[] = txRows.map(tx => ({
      id: tx.id,
      commercialRecordId: tx.commercial_record_id,
      projectId: tx.project_id,
      amount: tx.amount,
      currency: tx.currency,
      paymentMethod: tx.payment_method,
      transactionReference: tx.transaction_reference || undefined,
      recordedByAdminId: tx.recorded_by_admin_id,
      notes: tx.notes || undefined,
      createdAt: tx.created_at
    }));

    return {
      totalQuotedPipeline,
      totalRevenueCollected,
      totalOutstanding,
      totalInvoicesIssued,
      totalProjects: allRecords.length,
      statusBreakdown: {
        commercialStatus: commercialStatusCounts,
        paymentStatus: paymentStatusCounts,
        quotationStatus: quotationStatusCounts
      },
      recentTransactions
    };
  },

  // --- CLIENT FEEDBACK ---
  async createFeedback(feedback: ClientFeedback): Promise<void> {
    const db = await getDb();

    await db.run(`
      INSERT INTO client_feedback (
        id, project_id, revision_id, author_name, author_email, author_role, feedback_type, section, rating, message, resolved, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [feedback.id, feedback.projectId, feedback.revisionId, feedback.authorName,
      feedback.authorEmail || null, feedback.authorRole || null, feedback.feedbackType,
      feedback.section || 'general', feedback.rating !== undefined ? feedback.rating : null,
      feedback.message, feedback.resolved ? 1 : 0, feedback.createdAt]);
  },

  async listFeedbackByProject(projectId: string): Promise<ClientFeedback[]> {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM client_feedback WHERE project_id = ? ORDER BY created_at DESC', [projectId]) as any[];

    return rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      revisionId: r.revision_id,
      authorName: r.author_name,
      authorEmail: r.author_email || undefined,
      authorRole: r.author_role || undefined,
      feedbackType: r.feedback_type,
      section: r.section || 'general',
      rating: r.rating !== null && r.rating !== undefined ? Number(r.rating) : undefined,
      message: r.message,
      resolved: Boolean(r.resolved),
      createdAt: r.created_at
    }));
  },

  async resolveFeedback(feedbackId: string, resolved: boolean): Promise<boolean> {
    const db = await getDb();
    const res = await db.run('UPDATE client_feedback SET resolved = ? WHERE id = ?', [resolved ? 1 : 0, feedbackId]);

    return res.changes > 0;
  },

  // --- PREVIEW TOKENS ---
  async createPreviewToken(tokenData: PreviewToken): Promise<void> {
    const db = await getDb();

    await db.run(`
      INSERT INTO preview_tokens (id, project_id, revision_id, token, is_active, view_count, last_viewed_at, created_by_admin_id, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [tokenData.id, tokenData.projectId, tokenData.revisionId, tokenData.token,
      tokenData.isActive ? 1 : 0, tokenData.viewCount || 0, tokenData.lastViewedAt || null,
      tokenData.createdByAdminId || null, tokenData.expiresAt, tokenData.createdAt]);
  },

  async getPreviewToken(token: string): Promise<PreviewToken | null> {
    const db = await getDb();
    const row = await db.get('SELECT * FROM preview_tokens WHERE token = ?', [token]) as any;

    if (!row) return null;

    return {
      id: row.id,
      projectId: row.project_id,
      revisionId: row.revision_id,
      token: row.token,
      isActive: Boolean(row.is_active),
      viewCount: row.view_count || 0,
      lastViewedAt: row.last_viewed_at || undefined,
      createdByAdminId: row.created_by_admin_id || undefined,
      expiresAt: row.expires_at,
      createdAt: row.created_at
    };
  },

  async listPreviewTokensByProject(projectId: string): Promise<PreviewToken[]> {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM preview_tokens WHERE project_id = ? ORDER BY created_at DESC', [projectId]) as any[];

    return rows.map((row) => ({
      id: row.id,
      projectId: row.project_id,
      revisionId: row.revision_id,
      token: row.token,
      isActive: Boolean(row.is_active),
      viewCount: row.view_count || 0,
      lastViewedAt: row.last_viewed_at || undefined,
      createdByAdminId: row.created_by_admin_id || undefined,
      expiresAt: row.expires_at,
      createdAt: row.created_at
    }));
  },

  async revokePreviewToken(tokenId: string): Promise<boolean> {
    const db = await getDb();
    const res = await db.run('UPDATE preview_tokens SET is_active = 0 WHERE id = ?', [tokenId]);

    return res.changes > 0;
  },

  async recordTokenView(token: string): Promise<void> {
    const db = await getDb();

    await db.run(`
      UPDATE preview_tokens
      SET view_count = view_count + 1, last_viewed_at = ?
      WHERE token = ?
    `, [new Date().toISOString(), token]);
  }
};

// --- DATABASE ROW MAPPERS ---

function mapRowToProject(row: any): ClientProject {
  return {
    id: row.id,
    tenantId: row.tenant_id || undefined,
    tenantSlug: row.tenant_slug,
    status: row.status,
    activeRevisionId: row.active_revision_id || undefined,
    approvedRevisionId: row.approved_revision_id || undefined,
    requirements: JSON.parse(row.requirements_json),
    generatedWebsite: row.generated_website_json ? JSON.parse(row.generated_website_json) : undefined,
    approvalDetails: row.approval_details_json ? JSON.parse(row.approval_details_json) : undefined,
    deploymentDetails: row.deployment_details_json ? JSON.parse(row.deployment_details_json) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapRowToMediaSource(row: any): MediaSource {
  return {
    id: row.id,
    projectId: row.project_id,
    sourceType: row.source_type,
    folderId: row.folder_id || undefined,
    folderUrl: row.folder_url || undefined,
    status: row.status,
    syncStatus: row.sync_status,
    lastSyncedAt: row.last_synced_at || undefined,
    errorMessage: row.error_message || undefined,
    createdAt: row.created_at
  };
}

function mapRowToTenant(row: any): Tenant {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory || undefined,
    contactPerson: row.contact_person,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone || undefined,
    address: row.address || undefined,
    websiteLanguage: row.website_language || 'bilingual',
    createdByAdminId: row.created_by_admin_id,
    assignedAdminId: row.assigned_admin_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapRowToRevision(row: any): ProjectRevision {
  return {
    id: row.id,
    projectId: row.project_id,
    versionNumber: row.version_number,
    variationLabel: row.variation_label,
    websiteData: JSON.parse(row.website_data_json),
    isApproved: Boolean(row.is_approved),
    createdByAdminId: row.created_by_admin_id,
    changelogNotes: row.changelog_notes || undefined,
    createdAt: row.created_at
  };
}

function mapRowToOwnershipTransfer(row: any): OwnershipTransfer {
  return {
    id: row.id,
    currentOwnerId: row.current_owner_id,
    currentOwnerEmail: row.current_owner_email,
    targetName: row.target_name,
    targetEmail: row.target_email,
    transferToken: row.transfer_token,
    status: row.status as OwnershipTransferStatus,
    candidateUsername: row.candidate_username || undefined,
    candidatePasswordHash: row.candidate_password_hash || undefined,
    targetUserId: row.target_user_id || undefined,
    formerOwnerAccess: (row.former_owner_access || 'KEEP_SUPER_ADMIN') as 'KEEP_SUPER_ADMIN' | 'DEMOTE_TO_ADMIN',
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at || undefined,
    confirmedAt: row.confirmed_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}