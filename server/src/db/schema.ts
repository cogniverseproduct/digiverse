/**
 * DigiVerse database schema: one definition for SQLite and Postgres.
 *
 * Column definitions use portable SQL. The only dialect-specific type is
 * REAL, which becomes DOUBLE PRECISION on Postgres so money amounts keep
 * full precision.
 *
 * SQLite (local development) additionally runs the legacy upgrade path that
 * existed before this file (users-table rebuild and ALTER TABLE for columns
 * added over time), so existing local databases keep working unchanged.
 *
 * Postgres starts from the final schema. A schema_meta version row prevents
 * re-running the column pass on every serverless cold start.
 */

import type { Database, Dialect } from './driver.js';
import { setDatabaseInitializer } from './driver.js';
import { applyAuthSchemaMigrations } from './authSchemaMigration.js';

export const SCHEMA_VERSION = 5;

interface TableDefinition {
  name: string;
  columns: string[];
  /** Extra constraints appended after the column list. */
  constraints?: string[];
}

export const TABLES: TableDefinition[] = [
  {
    name: 'users',
    columns: [
      'id TEXT PRIMARY KEY',
      'email TEXT UNIQUE',
      'username TEXT UNIQUE',
      'password_hash TEXT NOT NULL',
      'name TEXT NOT NULL',
      "role TEXT NOT NULL DEFAULT 'ADMIN'",
      'is_active INTEGER NOT NULL DEFAULT 1',
      "account_status TEXT NOT NULL DEFAULT 'ACTIVE'",
      'disabled_reason TEXT',
      'disabled_at TEXT',
      'last_login_at TEXT',
      'token_version INTEGER NOT NULL DEFAULT 1',
      // Exactly one active Super Admin is the Product Owner; only the owner can transfer ownership.
      'is_platform_owner INTEGER NOT NULL DEFAULT 0',
      // 1 = the password was set by someone else (e.g. the owner creating a transfer account); the
      // person must choose their own before anything else works. Cleared when they change it.
      'must_change_password INTEGER NOT NULL DEFAULT 0',
      'created_at TEXT NOT NULL',
      'updated_at TEXT NOT NULL'
    ]
  },
  {
    name: 'audit_logs',
    columns: [
      'id TEXT PRIMARY KEY',
      'user_id TEXT NOT NULL',
      'user_email TEXT NOT NULL',
      'user_role TEXT NOT NULL',
      'action TEXT NOT NULL',
      'resource_type TEXT NOT NULL',
      'resource_id TEXT',
      'details_json TEXT',
      'ip_address TEXT',
      'created_at TEXT NOT NULL'
    ]
  },
  {
    name: 'demo_inquiries',
    columns: [
      'id TEXT PRIMARY KEY',
      'name TEXT NOT NULL',
      'organization TEXT NOT NULL',
      'email TEXT NOT NULL',
      'phone TEXT',
      'organization_type TEXT NOT NULL',
      'preferred_language TEXT NOT NULL',
      'requirements TEXT',
      'created_at TEXT NOT NULL'
    ]
  },
  {
    name: 'tenants',
    columns: [
      'id TEXT PRIMARY KEY',
      'slug TEXT UNIQUE NOT NULL',
      'name TEXT NOT NULL',
      // Legacy column kept for compatibility with existing local databases,
      // where it is NOT NULL. Always written with the tenant category.
      'organization_type TEXT',
      "category TEXT NOT NULL DEFAULT 'cultural'",
      'subcategory TEXT',
      "contact_person TEXT NOT NULL DEFAULT 'Primary Contact'",
      "contact_email TEXT NOT NULL DEFAULT 'contact@organization.internal'",
      'contact_phone TEXT',
      'address TEXT',
      "website_language TEXT NOT NULL DEFAULT 'bilingual'",
      "created_by_admin_id TEXT NOT NULL DEFAULT ''",
      "assigned_admin_id TEXT NOT NULL DEFAULT ''",
      'created_at TEXT NOT NULL',
      'updated_at TEXT NOT NULL'
    ]
  },
  {
    name: 'projects',
    columns: [
      'id TEXT PRIMARY KEY',
      'tenant_id TEXT',
      'tenant_slug TEXT NOT NULL',
      "title TEXT NOT NULL DEFAULT 'Main Website Project'",
      'status TEXT NOT NULL',
      'requirements_json TEXT NOT NULL',
      'generated_website_json TEXT',
      'active_revision_id TEXT',
      'approved_revision_id TEXT',
      'approval_details_json TEXT',
      'deployment_details_json TEXT',
      'created_at TEXT NOT NULL',
      'updated_at TEXT NOT NULL'
    ]
  },
  {
    name: 'project_requirements',
    columns: [
      'project_id TEXT PRIMARY KEY',
      'organization_name TEXT NOT NULL',
      'category TEXT NOT NULL',
      'subcategory TEXT',
      'tagline TEXT',
      'description TEXT',
      'logo_url TEXT',
      'cover_image_url TEXT',
      'primary_color TEXT NOT NULL',
      'accent_color TEXT NOT NULL',
      'typography_style TEXT NOT NULL',
      'preferred_language TEXT NOT NULL',
      'social_links_json TEXT',
      'enabled_pages_json TEXT NOT NULL',
      'required_features_json TEXT',
      'reference_websites_json TEXT',
      'events_json TEXT',
      'committee_json TEXT',
      'gallery_json TEXT',
      'design_notes TEXT',
      'additional_branding_images_json TEXT',
      'drive_gallery_url TEXT',
      'drive_video_url TEXT',
      'youtube_urls_json TEXT',
      'selected_template_json TEXT',
      'created_at TEXT NOT NULL',
      'updated_at TEXT NOT NULL'
    ]
  },
  {
    name: 'project_revisions',
    columns: [
      'id TEXT PRIMARY KEY',
      'project_id TEXT NOT NULL',
      'version_number INTEGER NOT NULL',
      'variation_label TEXT NOT NULL',
      'website_data_json TEXT NOT NULL',
      'is_approved INTEGER NOT NULL DEFAULT 0',
      'created_by_admin_id TEXT NOT NULL',
      'changelog_notes TEXT',
      'created_at TEXT NOT NULL'
    ]
  },
  {
    name: 'commercial_records',
    columns: [
      'id TEXT PRIMARY KEY',
      'project_id TEXT UNIQUE NOT NULL',
      'quotation_number TEXT',
      'quotation_amount REAL NOT NULL DEFAULT 0',
      "currency TEXT NOT NULL DEFAULT 'INR'",
      "quotation_status TEXT NOT NULL DEFAULT 'draft'",
      'scope_items TEXT',
      'payment_terms TEXT',
      'valid_until TEXT',
      "payment_status TEXT NOT NULL DEFAULT 'unquoted'",
      'invoice_number TEXT',
      'invoice_date TEXT',
      'due_date TEXT',
      "invoice_status TEXT NOT NULL DEFAULT 'unissued'",
      'amount_paid REAL NOT NULL DEFAULT 0',
      'payment_method TEXT',
      'payment_reference TEXT',
      'payment_date TEXT',
      "commercial_status TEXT NOT NULL DEFAULT 'proposal_stage'",
      'notes TEXT',
      'created_at TEXT NOT NULL',
      'updated_at TEXT NOT NULL'
    ]
  },
  {
    name: 'commercial_transactions',
    columns: [
      'id TEXT PRIMARY KEY',
      'commercial_record_id TEXT NOT NULL',
      'project_id TEXT NOT NULL',
      'amount REAL NOT NULL',
      "currency TEXT NOT NULL DEFAULT 'INR'",
      'payment_method TEXT NOT NULL',
      'transaction_reference TEXT',
      'recorded_by_admin_id TEXT NOT NULL',
      'notes TEXT',
      'created_at TEXT NOT NULL'
    ]
  },
  {
    name: 'client_feedback',
    columns: [
      'id TEXT PRIMARY KEY',
      'project_id TEXT NOT NULL',
      'revision_id TEXT NOT NULL',
      'author_name TEXT NOT NULL',
      'author_email TEXT',
      'author_role TEXT',
      'feedback_type TEXT NOT NULL',
      "section TEXT NOT NULL DEFAULT 'general'",
      'rating INTEGER',
      'message TEXT NOT NULL',
      'resolved INTEGER NOT NULL DEFAULT 0',
      'created_at TEXT NOT NULL'
    ]
  },
  {
    name: 'preview_tokens',
    columns: [
      'id TEXT PRIMARY KEY',
      'project_id TEXT NOT NULL',
      'revision_id TEXT NOT NULL',
      'token TEXT UNIQUE NOT NULL',
      'is_active INTEGER NOT NULL DEFAULT 1',
      'view_count INTEGER NOT NULL DEFAULT 0',
      'last_viewed_at TEXT',
      'created_by_admin_id TEXT',
      'expires_at TEXT NOT NULL',
      'created_at TEXT NOT NULL'
    ]
  },
  {
    name: 'media_sources',
    columns: [
      'id TEXT PRIMARY KEY',
      'project_id TEXT NOT NULL',
      'source_type TEXT NOT NULL',
      'folder_id TEXT',
      'folder_url TEXT',
      'status TEXT NOT NULL',
      'sync_status TEXT NOT NULL',
      'last_synced_at TEXT',
      'error_message TEXT',
      'created_at TEXT NOT NULL'
    ]
  },
  {
    name: 'drive_media_items',
    columns: [
      'id TEXT PRIMARY KEY',
      'project_id TEXT NOT NULL',
      'source_id TEXT',
      'drive_file_id TEXT NOT NULL',
      'name TEXT NOT NULL',
      'mime_type TEXT NOT NULL',
      'media_type TEXT NOT NULL',
      'size_bytes INTEGER',
      'thumbnail_url TEXT',
      'is_approved INTEGER NOT NULL DEFAULT 1',
      "section_assignment TEXT NOT NULL DEFAULT 'gallery'",
      'created_at TEXT NOT NULL'
    ]
  },
  {
    name: 'youtube_videos',
    columns: [
      'id TEXT PRIMARY KEY',
      'project_id TEXT NOT NULL',
      'video_id TEXT NOT NULL',
      'original_url TEXT NOT NULL',
      'embed_url TEXT NOT NULL',
      'title TEXT NOT NULL',
      'thumbnail_url TEXT',
      "category TEXT NOT NULL DEFAULT 'cultural'",
      'display_order INTEGER NOT NULL DEFAULT 0',
      'is_published INTEGER NOT NULL DEFAULT 1',
      "video_type TEXT DEFAULT 'video'",
      'created_at TEXT NOT NULL'
    ]
  },
  {
    name: 'admin_access_requests',
    columns: [
      'id TEXT PRIMARY KEY',
      'name TEXT NOT NULL',
      'email TEXT NOT NULL',
      'reason TEXT',
      "status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED'))",
      'created_at TEXT NOT NULL',
      'reviewed_at TEXT',
      'reviewed_by TEXT',
      'request_token_hash TEXT',
      'setup_token_hash TEXT',
      'setup_token_expires_at TEXT',
      'account_created_at TEXT',
      'created_user_id TEXT'
    ]
  },
  {
    name: 'admin_password_resets',
    columns: [
      'id TEXT PRIMARY KEY',
      'admin_id TEXT NOT NULL',
      'admin_email TEXT NOT NULL',
      'admin_username TEXT NOT NULL',
      'reason TEXT',
      "status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'EXPIRED'))",
      'reset_token_hash TEXT',
      'expires_at TEXT',
      'created_at TEXT NOT NULL',
      'reviewed_at TEXT',
      'reviewed_by TEXT',
      'completed_at TEXT'
    ],
    constraints: ['FOREIGN KEY(admin_id) REFERENCES users(id) ON DELETE CASCADE']
  },
  {
    name: 'ownership_transfers',
    columns: [
      'id TEXT PRIMARY KEY',
      'current_owner_id TEXT NOT NULL',
      'current_owner_email TEXT NOT NULL',
      'target_name TEXT NOT NULL',
      'target_email TEXT NOT NULL',
      'transfer_token TEXT UNIQUE NOT NULL',
      "status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ACCEPTED', 'CONFIRMED', 'CANCELLED', 'EXPIRED'))",
      'candidate_username TEXT',
      'candidate_password_hash TEXT',
      // Account-based transfers: the target is an existing Super Admin who must sign in and accept.
      'target_user_id TEXT',
      "former_owner_access TEXT NOT NULL DEFAULT 'KEEP_SUPER_ADMIN'",
      'expires_at TEXT NOT NULL',
      'accepted_at TEXT',
      'confirmed_at TEXT',
      'created_at TEXT NOT NULL',
      'updated_at TEXT NOT NULL'
    ]
  },
  {
    // One row per published client website (One Project - Many Sites).
    // website_json is a sanitized, frozen snapshot of the approved revision,
    // so later edits in the studio never change the live site until the
    // Admin publishes again.
    name: 'published_sites',
    columns: [
      'project_id TEXT PRIMARY KEY',
      'slug TEXT UNIQUE NOT NULL',
      "status TEXT NOT NULL DEFAULT 'live'",
      'revision_id TEXT',
      'organization_name TEXT NOT NULL',
      'category TEXT',
      'website_json TEXT NOT NULL',
      'seo_json TEXT',
      'custom_domain TEXT UNIQUE',
      'domain_status TEXT',
      'domain_details_json TEXT',
      'published_by_admin_id TEXT',
      'published_at TEXT NOT NULL',
      'updated_at TEXT NOT NULL'
    ]
  },
  {
    // Centralized publishing: one hosting identity per client site. The hosting
    // account is the DigiVerse-owned Vercel team; clients never have accounts.
    // provider is 'vercel' or 'mock' (a simulated deployment, never a real one).
    name: 'site_hosting',
    columns: [
      'project_id TEXT PRIMARY KEY',
      "provider TEXT NOT NULL DEFAULT 'vercel'",
      'provider_project_id TEXT',
      'provider_project_name TEXT',
      'production_url TEXT',
      'created_at TEXT NOT NULL',
      'updated_at TEXT NOT NULL'
    ]
  },
  {
    // Independent deployment history per client site. kind is 'publish' or
    // 'offline' (an unpublish deploys a static offline page). status is one of
    // queued | building | ready | failed | canceled.
    name: 'site_deployments',
    columns: [
      'id TEXT PRIMARY KEY',
      'project_id TEXT NOT NULL',
      "provider TEXT NOT NULL DEFAULT 'vercel'",
      "kind TEXT NOT NULL DEFAULT 'publish'",
      'provider_deployment_id TEXT',
      "status TEXT NOT NULL DEFAULT 'queued'",
      'url TEXT',
      'inspector_url TEXT',
      'revision_id TEXT',
      'site_slug TEXT',
      'bundle_hash TEXT',
      'file_count INTEGER',
      'error_code TEXT',
      'error_message TEXT',
      'triggered_by_admin_id TEXT',
      'created_at TEXT NOT NULL',
      'ready_at TEXT',
      'updated_at TEXT NOT NULL'
    ]
  },
  {
    name: 'schema_meta',
    columns: ['key TEXT PRIMARY KEY', 'value TEXT NOT NULL']
  }
];

const INDEXES = [
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL',
  'CREATE INDEX IF NOT EXISTS idx_admin_access_requests_status ON admin_access_requests(status, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_admin_password_resets_status ON admin_password_resets(status, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_ownership_transfers_status ON ownership_transfers(status, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_projects_tenant_slug ON projects(tenant_slug)',
  'CREATE INDEX IF NOT EXISTS idx_project_revisions_project ON project_revisions(project_id, version_number)',
  'CREATE INDEX IF NOT EXISTS idx_drive_media_items_project ON drive_media_items(project_id)',
  'CREATE INDEX IF NOT EXISTS idx_youtube_videos_project ON youtube_videos(project_id)',
  'CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_published_sites_status ON published_sites(status)',
  'CREATE INDEX IF NOT EXISTS idx_site_deployments_project ON site_deployments(project_id, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_site_deployments_provider_id ON site_deployments(provider_deployment_id)'
];

function columnType(definition: string, dialect: Dialect): string {
  return dialect === 'postgres'
    ? definition.replace(/\bREAL\b/g, 'DOUBLE PRECISION')
    : definition;
}

function createTableSql(table: TableDefinition, dialect: Dialect): string {
  const parts = [
    ...table.columns.map((column) => columnType(column, dialect)),
    ...(table.constraints ?? [])
  ];

  return `CREATE TABLE IF NOT EXISTS ${table.name} (\n  ${parts.join(',\n  ')}\n)`;
}

function columnName(definition: string): string {
  return definition.trim().split(/\s+/)[0];
}

/**
 * Turns a column definition into one that can be added with ALTER TABLE.
 * PRIMARY KEY / UNIQUE cannot be added that way, and NOT NULL needs a default.
 */
function addableColumnDefinition(definition: string, dialect: Dialect): string {
  let result = columnType(definition, dialect)
    .replace(/\bPRIMARY KEY\b/gi, '')
    .replace(/\bUNIQUE\b/gi, '');

  if (/\bNOT NULL\b/i.test(result) && !/\bDEFAULT\b/i.test(result)) {
    result = result.replace(/\bNOT NULL\b/gi, '');
  }

  return result.replace(/\s+/g, ' ').trim();
}

async function getSchemaVersion(db: Database): Promise<number> {
  const row = await db.get<{ value: string }>(
    "SELECT value FROM schema_meta WHERE key = 'schema_version'"
  );
  return row ? Number(row.value) || 0 : 0;
}

async function setSchemaVersion(db: Database, version: number): Promise<void> {
  await db.run(
    `INSERT INTO schema_meta (key, value) VALUES ('schema_version', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [String(version)]
  );
}

/**
 * Databases created before ownership flags existed have a Super Admin but no owner.
 * Mark the earliest-created usable Super Admin as the Product Owner. Idempotent: does
 * nothing once an owner exists, and never touches installs with no Super Admin yet.
 */
export async function backfillPlatformOwner(db: Database): Promise<void> {
  const owner = await db.get<{ n: number }>(
    "SELECT COUNT(*) AS n FROM users WHERE is_platform_owner = 1 AND upper(role) = 'SUPER_ADMIN'"
  );
  if (Number(owner?.n ?? 0) > 0) return;

  const candidate = await db.get<{ id: string }>(
    `SELECT id FROM users
     WHERE upper(role) = 'SUPER_ADMIN' AND COALESCE(account_status, 'ACTIVE') = 'ACTIVE' AND COALESCE(is_active, 1) = 1
     ORDER BY created_at ASC, id ASC LIMIT 1`
  );
  if (candidate) {
    await db.run('UPDATE users SET is_platform_owner = 1 WHERE id = ?', [candidate.id]);
  }
}

async function initializeSqlite(db: Database): Promise<void> {
  for (const table of TABLES) {
    await db.exec(createTableSql(table, 'sqlite'));
  }

  // Legacy local databases: rebuild users if needed (nullable email, username).
  await applyAuthSchemaMigrations(db);

  // Add any columns introduced after a table was first created.
  for (const table of TABLES) {
    const existing = await db.all<{ name: string }>(`PRAGMA table_info(${table.name})`);
    const existingNames = new Set(existing.map((column) => column.name));

    for (const definition of table.columns) {
      const name = columnName(definition);
      if (!existingNames.has(name)) {
        await db.exec(
          `ALTER TABLE ${table.name} ADD COLUMN ${addableColumnDefinition(definition, 'sqlite')}`
        );
      }
    }
  }

  await db.exec(`
    UPDATE users
    SET role = 'ADMIN'
    WHERE lower(role) IN ('admin', 'sales')
  `);

  for (const statement of INDEXES) {
    await db.exec(statement);
  }

  await backfillPlatformOwner(db);
  await setSchemaVersion(db, SCHEMA_VERSION);
}

async function initializePostgres(db: Database): Promise<void> {
  await db.exec(createTableSql(TABLES.find((t) => t.name === 'schema_meta')!, 'postgres'));

  if ((await getSchemaVersion(db)) >= SCHEMA_VERSION) {
    return;
  }

  for (const table of TABLES) {
    await db.exec(createTableSql(table, 'postgres'));
  }

  for (const table of TABLES) {
    for (const definition of table.columns) {
      await db.exec(
        `ALTER TABLE ${table.name} ADD COLUMN IF NOT EXISTS ${addableColumnDefinition(definition, 'postgres')}`
      );
    }
  }

  for (const statement of INDEXES) {
    await db.exec(statement);
  }

  await backfillPlatformOwner(db);
  await setSchemaVersion(db, SCHEMA_VERSION);
}

export async function initializeSchema(db: Database): Promise<void> {
  if (db.dialect === 'postgres') {
    await initializePostgres(db);
  } else {
    await initializeSqlite(db);
  }
}

setDatabaseInitializer(initializeSchema);
