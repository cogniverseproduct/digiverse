/**
 * SQLite -> Postgres data migration engine (used by the CLI scripts and by tests).
 *
 * Guarantees:
 *  - The source database (and its -wal/-shm files) is only ever READ as files. It is copied,
 *    the copy is checkpointed into a retained, hash-manifested snapshot (VACUUM INTO), and all
 *    reading happens from that snapshot opened read-only. Hashes of the original files are
 *    compared before/after to prove they were not modified.
 *  - Every table found in the source is classified. A table that is not part of the current
 *    schema (TABLES) is reported; if it holds rows the migration refuses to continue unless the
 *    operator explicitly accepts it. Known legacy tables are documented in KNOWN_LEGACY_TABLES.
 *  - The copy runs in ONE target transaction. Existing target rows are never overwritten.
 *  - Success is decided by verification, never by row counts alone: primary-key set equality,
 *    per-row content hashes, relationship (orphan) parity, unique/index presence and
 *    Super Admin / platform-owner identity checks.
 *  - Reports never contain row values, password hashes or secrets.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_SOURCE = path.resolve(__dirname, '../../data/digiverse.db');
export const DEFAULT_BACKUP_DIR = path.resolve(__dirname, '../../data/backups');

/** Tables that exist in historical SQLite files but are not part of the current schema. */
export const KNOWN_LEGACY_TABLES: Record<string, string> = {
  email_verification_otps:
    'Abandoned email-OTP feature from an earlier code version. Not referenced anywhere in the current ' +
    'source, tests or docs; the product has no OTP flow. 0 rows in every inspected database file. ' +
    'Intentionally NOT migrated to Postgres. Migration refuses to continue if it ever holds rows.'
};

/** Logical (undeclared) relationships whose orphan counts must be identical before and after. */
const RELATIONSHIPS: Array<[table: string, column: string, refTable: string, refColumn: string]> = [
  ['projects', 'tenant_id', 'tenants', 'id'],
  ['projects', 'tenant_slug', 'tenants', 'slug'],
  ['projects', 'active_revision_id', 'project_revisions', 'id'],
  ['project_requirements', 'project_id', 'projects', 'id'],
  ['project_revisions', 'project_id', 'projects', 'id'],
  ['commercial_records', 'project_id', 'projects', 'id'],
  ['commercial_transactions', 'project_id', 'projects', 'id'],
  ['commercial_transactions', 'commercial_record_id', 'commercial_records', 'id'],
  ['client_feedback', 'project_id', 'projects', 'id'],
  ['preview_tokens', 'project_id', 'projects', 'id'],
  ['media_sources', 'project_id', 'projects', 'id'],
  ['drive_media_items', 'project_id', 'projects', 'id'],
  ['youtube_videos', 'project_id', 'projects', 'id'],
  ['admin_password_resets', 'admin_id', 'users', 'id'],
  ['ownership_transfers', 'current_owner_id', 'users', 'id'],
  ['published_sites', 'project_id', 'projects', 'id'],
  ['site_hosting', 'project_id', 'projects', 'id'],
  ['site_deployments', 'project_id', 'projects', 'id']
];

export interface MigrationOptions {
  source: string;
  /** Rehearsal: target is a disposable in-memory PGlite database; DATABASE_URL is ignored. */
  dryRun: boolean;
  backupDir: string;
  /** Real Postgres only: must equal the DATABASE_URL hostname (guards against wrong target). */
  confirmTarget?: string;
  /** Allow a target that already holds rows (re-run / idempotency). Existing rows are never overwritten. */
  allowNonEmptyTarget?: boolean;
  /** Names of unmanaged source tables with rows that the operator has decided to leave behind. */
  acceptUnmanaged?: string[];
  /** Keep the target connection open (tests, rehearsal follow-ups). */
  keepConnection?: boolean;
}

export interface TableResult {
  table: string;
  sourceRows: number;
  targetRowsBefore: number;
  inserted: number;
  alreadyPresent: number;
  targetRowsAfter: number;
  skippedSourceColumns: string[];
  targetOnlyColumns: string[];
  missingPrimaryKeys: number;
  unexpectedPrimaryKeys: number;
  mismatchedRows: number;
  /** Primary keys of up to 10 mismatching rows (keys only, never values). */
  mismatchSample: string[];
}

export interface Check {
  name: string;
  ok: boolean;
  detail?: string;
}

export interface MigrationReport {
  ok: boolean;
  mode: 'rehearsal' | 'real';
  startedAt: string;
  target: string;
  source: {
    path: string;
    originalFiles: Array<{ file: string; bytes: number; sha256Before: string; sha256After: string }>;
    unchanged: boolean;
    snapshotPath: string;
    snapshotSha256: string;
    schemaVersion: number | null;
  };
  unmanagedTables: Array<{ table: string; rows: number; legacyNote?: string; decision: string }>;
  tables: TableResult[];
  checks: Check[];
  ownerNote?: string;
  reportPath?: string;
}

interface TableDef {
  name: string;
  columns: string[];
}

function sha256File(file: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function columnNameOf(definition: string): string {
  return definition.trim().split(/\s+/)[0];
}

function primaryKeyOf(table: TableDef): string {
  const pk = table.columns.find((c) => /\bPRIMARY KEY\b/i.test(c));
  if (!pk) throw new Error(`Table ${table.name} has no declared primary key.`);
  return columnNameOf(pk);
}

function needsValue(definition: string): boolean {
  return /\bNOT NULL\b/i.test(definition) && !/\bDEFAULT\b/i.test(definition) && !/\bPRIMARY KEY\b/i.test(definition);
}

function canonical(value: unknown): string {
  if (value === null || value === undefined) return '∅';
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? '1' : '0';
  return String(value);
}

function rowHash(columns: string[], row: Record<string, unknown>): string {
  const hash = crypto.createHash('sha256');
  for (const column of columns) {
    hash.update(canonical(row[column]));
    hash.update('\u0001');
  }
  return hash.digest('hex');
}

function sourceFiles(source: string): string[] {
  return ['', '-wal', '-shm'].map((suffix) => source + suffix).filter((file) => fs.existsSync(file));
}

function fingerprintFiles(files: string[]): string {
  return files.map((f) => `${f}:${fs.statSync(f).size}:${fs.statSync(f).mtimeMs}`).join('|');
}

/** Copies db/-wal/-shm to a temp dir, retrying if a writer changed them during the copy. */
function copyConsistently(source: string, destinationDir: string): void {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const files = sourceFiles(source);
    const before = fingerprintFiles(files);
    for (const file of files) {
      fs.copyFileSync(file, path.join(destinationDir, path.basename(source) + file.slice(source.length)));
    }
    if (fingerprintFiles(sourceFiles(source)) === before) return;
    if (attempt === 4) {
      throw new Error(
        'The source database kept changing while it was being copied. Stop the DigiVerse server ' +
        'and retry so a consistent snapshot can be taken.'
      );
    }
  }
}

/** Creates the retained snapshot. Returns its path. The original files are only read. */
async function takeSnapshot(source: string, backupDir: string, stamp: string): Promise<string> {
  const { DatabaseSync } = await import('node:sqlite');
  fs.mkdirSync(backupDir, { recursive: true });
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'digiverse-snapshot-'));
  try {
    copyConsistently(source, work);
    const copy = path.join(work, path.basename(source));
    const snapshotPath = path.join(backupDir, `digiverse-snapshot-${stamp}.db`);
    if (fs.existsSync(snapshotPath)) throw new Error(`Snapshot already exists: ${snapshotPath}`);

    const db = new DatabaseSync(copy);
    try {
      db.exec(`VACUUM INTO '${snapshotPath.replace(/'/g, "''")}'`);
    } finally {
      db.close();
    }
    return snapshotPath;
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

async function readAll(db: any, sql: string): Promise<Array<Record<string, any>>> {
  return db.prepare(sql).all() as Array<Record<string, any>>;
}

export async function runMigration(options: MigrationOptions): Promise<MigrationReport> {
  if (!fs.existsSync(options.source)) {
    throw new Error(`Source SQLite database not found: ${options.source}`);
  }

  const source = path.resolve(options.source);
  const mode: 'rehearsal' | 'real' = options.dryRun ? 'rehearsal' : 'real';
  const startedAt = new Date().toISOString();
  const stamp = `${startedAt.replace(/[:.]/g, '-')}-${crypto.randomBytes(2).toString('hex')}`;

  // ---- target selection (before anything is written) ------------------------------------------
  if (options.dryRun) {
    process.env.DATABASE_DRIVER = 'pglite';
    delete process.env.DATABASE_URL;
    delete process.env.PGLITE_DATA_DIR;
  } else {
    const url = process.env.DATABASE_URL?.trim();
    if (!url) throw new Error('DATABASE_URL is required for a real migration (use --dry-run for a rehearsal).');
    let host = '';
    try {
      host = new URL(url).hostname;
    } catch {
      throw new Error('DATABASE_URL is not a valid URL.');
    }
    if (!options.confirmTarget || options.confirmTarget.toLowerCase() !== host.toLowerCase()) {
      throw new Error(
        `Refusing to write: pass --confirm-target ${host} to confirm the destination host. ` +
        `(Target host from DATABASE_URL: ${host}.)`
      );
    }
    process.env.DATABASE_DRIVER = 'postgres';
  }

  // ---- source: prove-unchanged hashes, snapshot, read-only open -------------------------------
  const originals = sourceFiles(source).map((file) => ({
    file,
    bytes: fs.statSync(file).size,
    sha256Before: sha256File(file)
  }));

  const snapshotPath = await takeSnapshot(source, options.backupDir, stamp);
  const snapshotSha256 = sha256File(snapshotPath);

  const { DatabaseSync } = await import('node:sqlite');
  const src = new DatabaseSync(snapshotPath, { readOnly: true });

  const { getDb, closeDb } = await import('../../src/db/database.js');
  const { TABLES, SCHEMA_VERSION, INDEXES, backfillPlatformOwner } = await import('../../src/db/schema.js');

  const checks: Check[] = [];
  const tableResults: TableResult[] = [];
  const unmanagedTables: MigrationReport['unmanagedTables'] = [];
  let ownerNote: string | undefined;
  let schemaVersion: number | null = null;
  let targetDescription = '';

  const managed = TABLES.filter((t) => t.name !== 'schema_meta') as TableDef[];

  try {
    // ---- inventory & classification -----------------------------------------------------------
    const sourceTableNames = (await readAll(src, "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")).map(
      (r) => r.name as string
    );

    if (sourceTableNames.includes('schema_meta')) {
      const row = (await readAll(src, "SELECT value FROM schema_meta WHERE key = 'schema_version'"))[0];
      schemaVersion = row ? Number(row.value) : null;
    }
    checks.push({
      name: 'source schema version <= target schema version',
      ok: schemaVersion === null || schemaVersion <= SCHEMA_VERSION,
      detail: `source=${schemaVersion ?? 'none'} target=${SCHEMA_VERSION}`
    });

    const accepted = new Set((options.acceptUnmanaged ?? []).map((n) => n.toLowerCase()));
    for (const name of sourceTableNames) {
      if (managed.some((t) => t.name === name) || name === 'schema_meta') continue;
      const rows = Number((await readAll(src, `SELECT COUNT(*) AS n FROM "${name}"`))[0].n);
      const legacyNote = KNOWN_LEGACY_TABLES[name];
      let decision: string;
      let ok: boolean;
      if (rows === 0) {
        decision = legacyNote ? 'empty known-legacy table: not migrated (documented)' : 'empty unmanaged table: not migrated';
        ok = true;
      } else if (accepted.has(name.toLowerCase())) {
        decision = `${rows} row(s) deliberately NOT migrated (operator accepted via --accept-unmanaged)`;
        ok = true;
      } else {
        decision = `${rows} row(s) would be LOST - refusing. Decide, then re-run with --accept-unmanaged ${name}`;
        ok = false;
      }
      unmanagedTables.push({ table: name, rows, legacyNote, decision });
      checks.push({ name: `unmanaged source table "${name}"`, ok, detail: decision });
    }

    // Missing NOT NULL columns without defaults would make inserts fail halfway; catch it up front.
    const plans = new Map<string, { shared: string[]; skipped: string[]; targetOnly: string[]; pk: string }>();
    for (const table of managed) {
      if (!sourceTableNames.includes(table.name)) {
        plans.set(table.name, { shared: [], skipped: [], targetOnly: table.columns.map(columnNameOf), pk: primaryKeyOf(table) });
        continue;
      }
      const sourceColumns = (await readAll(src, `PRAGMA table_info("${table.name}")`)).map((c) => c.name as string);
      const targetColumns = table.columns.map(columnNameOf);
      const shared = targetColumns.filter((c) => sourceColumns.includes(c));
      const skipped = sourceColumns.filter((c) => !targetColumns.includes(c));
      const targetOnly = targetColumns.filter((c) => !sourceColumns.includes(c));
      const unfillable = table.columns.filter((d) => needsValue(d) && targetOnly.includes(columnNameOf(d))).map(columnNameOf);
      checks.push({
        name: `${table.name}: every required column is present in the source`,
        ok: unfillable.length === 0,
        detail: unfillable.length ? `missing required: ${unfillable.join(', ')}` : undefined
      });
      plans.set(table.name, { shared, skipped, targetOnly, pk: primaryKeyOf(table) });
    }

    // NUL characters cannot be stored in Postgres text; surface them before writing anything.
    const rowsBySource = new Map<string, Array<Record<string, any>>>();
    for (const table of managed) {
      const plan = plans.get(table.name)!;
      if (!sourceTableNames.includes(table.name)) {
        rowsBySource.set(table.name, []);
        continue;
      }
      const rows = await readAll(src, `SELECT ${plan.shared.map((c) => `"${c}"`).join(', ')} FROM "${table.name}"`);
      const nul = rows.filter((row) => plan.shared.some((c) => typeof row[c] === 'string' && (row[c] as string).includes('\u0000')));
      checks.push({
        name: `${table.name}: no NUL characters in text values`,
        ok: nul.length === 0,
        detail: nul.length ? `${nul.length} row(s), e.g. pk ${nul[0][plan.pk]}` : undefined
      });
      rowsBySource.set(table.name, rows);
    }

    if (checks.some((c) => !c.ok)) {
      // Pre-flight failed: nothing has been written to the target.
      return finish(false);
    }

    // ---- target -------------------------------------------------------------------------------
    const target = await getDb();
    targetDescription = target.describe();
    if (target.dialect !== 'postgres') throw new Error('Target database is not Postgres.');

    const before = new Map<string, number>();
    for (const table of managed) {
      const row = await target.get<{ n: string | number }>(`SELECT COUNT(*) AS n FROM ${table.name}`);
      before.set(table.name, Number(row?.n ?? 0));
    }
    const nonEmpty = [...before.entries()].filter(([, n]) => n > 0);
    if (nonEmpty.length > 0 && !options.allowNonEmptyTarget) {
      checks.push({
        name: 'target is empty (or --allow-nonempty given for an idempotent re-run)',
        ok: false,
        detail: `non-empty: ${nonEmpty.map(([t, n]) => `${t}=${n}`).join(', ')}`
      });
      return finish(false);
    }

    // ---- copy (one transaction, never overwrites) ---------------------------------------------
    const results = new Map<string, TableResult>();
    await target.transaction(async () => {
      for (const table of managed) {
        const plan = plans.get(table.name)!;
        const rows = rowsBySource.get(table.name)!;
        let inserted = 0;

        if (rows.length > 0) {
          const placeholders = plan.shared.map(() => '?').join(', ');
          const sql =
            `INSERT INTO ${table.name} (${plan.shared.join(', ')}) VALUES (${placeholders}) ` +
            `ON CONFLICT (${plan.pk}) DO NOTHING`;
          for (const row of rows) {
            const result = await target.run(
              sql,
              plan.shared.map((c) => (typeof row[c] === 'bigint' ? Number(row[c]) : row[c]))
            );
            inserted += result.changes;
          }
        }

        results.set(table.name, {
          table: table.name,
          sourceRows: rows.length,
          targetRowsBefore: before.get(table.name) ?? 0,
          inserted,
          alreadyPresent: rows.length - inserted,
          targetRowsAfter: 0,
          skippedSourceColumns: plan.skipped,
          targetOnlyColumns: plan.targetOnly,
          missingPrimaryKeys: 0,
          unexpectedPrimaryKeys: 0,
          mismatchedRows: 0,
          mismatchSample: []
        });
      }

      // Legacy sources without an owner flag: pick the owner exactly like a normal upgrade would.
      const sourceHasOwnerColumn = plans.get('users')!.shared.includes('is_platform_owner');
      const sourceOwners = sourceHasOwnerColumn
        ? Number((await readAll(src, 'SELECT COUNT(*) AS n FROM users WHERE is_platform_owner = 1'))[0].n)
        : 0;
      if (sourceOwners === 0) {
        const targetBefore = await target.get<{ id: string }>('SELECT id FROM users WHERE is_platform_owner = 1');
        await backfillPlatformOwner(target);
        const targetAfter = await target.get<{ id: string }>('SELECT id FROM users WHERE is_platform_owner = 1');
        if (!targetBefore && targetAfter) {
          ownerNote = 'Source had no platform-owner flag; the earliest active Super Admin was marked owner (same rule as a normal upgrade).';
        }
      }
    });

    // ---- verification -------------------------------------------------------------------------
    for (const table of managed) {
      const plan = plans.get(table.name)!;
      const result = results.get(table.name)!;
      const srcRows = rowsBySource.get(table.name)!;

      const tgtRows = (await target.all(
        `SELECT ${plan.shared.length ? plan.shared.join(', ') : plan.pk} FROM ${table.name}`
      )) as Array<Record<string, any>>;
      result.targetRowsAfter = tgtRows.length;

      const srcByPk = new Map(srcRows.map((r) => [canonical(r[plan.pk]), rowHash(plan.shared, r)]));
      const tgtByPk = new Map(tgtRows.map((r) => [canonical(r[plan.pk]), rowHash(plan.shared, r)]));

      let missing = 0;
      const mismatched: string[] = [];
      for (const [pk, hash] of srcByPk) {
        const other = tgtByPk.get(pk);
        if (other === undefined) missing++;
        else if (other !== hash) mismatched.push(pk);
      }
      let unexpected = 0;
      for (const pk of tgtByPk.keys()) if (!srcByPk.has(pk)) unexpected++;

      result.missingPrimaryKeys = missing;
      result.mismatchedRows = mismatched.length;
      result.mismatchSample = mismatched.slice(0, 10);
      // Unexpected rows are only legitimate when an existing target was allowed.
      result.unexpectedPrimaryKeys = unexpected;

      checks.push({
        name: `${table.name}: primary keys match`,
        ok: missing === 0 && (unexpected === 0 || Boolean(options.allowNonEmptyTarget)),
        detail: `source=${srcRows.length} target=${tgtRows.length} missing=${missing} extra=${unexpected}`
      });
      checks.push({
        name: `${table.name}: every row content is identical (per-row SHA-256 over ${plan.shared.length} shared columns)`,
        ok: mismatched.length === 0,
        detail: mismatched.length ? `${mismatched.length} differing row(s), keys: ${mismatched.slice(0, 5).join(', ')}` : undefined
      });
      checks.push({
        name: `${table.name}: columns that were not copied are reported`,
        ok: true,
        detail:
          `source-only skipped=[${plan.skipped.join(', ')}] target-only defaulted=[${plan.targetOnly.join(', ')}]`
      });
      tableResults.push(result);
    }

    // Relationship parity: migrating must not create or hide orphans.
    for (const [table, column, refTable, refColumn] of RELATIONSHIPS) {
      const srcCols = plans.get(table)?.shared ?? [];
      const refCols = plans.get(refTable)?.shared ?? [];
      if (!srcCols.includes(column) || !refCols.includes(refColumn)) continue;
      const sql =
        `SELECT COUNT(*) AS n FROM ${table} t WHERE t.${column} IS NOT NULL AND t.${column} <> '' ` +
        `AND NOT EXISTS (SELECT 1 FROM ${refTable} r WHERE r.${refColumn} = t.${column})`;
      const s = Number((await readAll(src, sql))[0].n);
      const t = Number((await target.get<{ n: string | number }>(sql))?.n ?? 0);
      checks.push({
        name: `relationship ${table}.${column} -> ${refTable}.${refColumn}: orphan count equal`,
        ok: s === t,
        detail: `source orphans=${s} target orphans=${t}${s > 0 ? ' (pre-existing in source data)' : ''}`
      });
    }

    // Unique constraints and indexes exist on the target.
    const indexRows = await target.all<{ indexname: string }>(
      'SELECT indexname FROM pg_indexes WHERE schemaname = current_schema()'
    );
    const indexNames = new Set(indexRows.map((r) => r.indexname));
    for (const statement of INDEXES) {
      const match = /INDEX IF NOT EXISTS (\S+)/i.exec(statement);
      if (!match) continue;
      checks.push({ name: `index ${match[1]} exists`, ok: indexNames.has(match[1]) });
    }

    const uniques = await target.all<{ table_name: string; column_name: string }>(
      `SELECT t.relname AS table_name, a.attname AS column_name
       FROM pg_index i
       JOIN pg_class t ON t.oid = i.indrelid
       JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = i.indkey[0]
       WHERE i.indisunique AND i.indnatts = 1 AND t.relnamespace = current_schema()::regnamespace`
    );
    const uniqueSet = new Set(uniques.map((u) => `${u.table_name}.${u.column_name}`));
    for (const table of managed) {
      for (const definition of table.columns) {
        if (/\bUNIQUE\b/i.test(definition) || /\bPRIMARY KEY\b/i.test(definition)) {
          const key = `${table.name}.${columnNameOf(definition)}`;
          checks.push({ name: `unique/primary constraint ${key} exists`, ok: uniqueSet.has(key) });
        }
      }
    }

    // Super Admin / platform owner identity.
    if (plans.get('users')!.shared.includes('role')) {
      const identityColumns = plans.get('users')!.shared;
      const sourceSupers = (await readAll(
        src,
        `SELECT ${identityColumns.join(', ')} FROM users WHERE upper(role) = 'SUPER_ADMIN'`
      )) as Array<Record<string, any>>;
      let superMismatch = 0;
      for (const row of sourceSupers) {
        const other = await target.get<Record<string, any>>(
          `SELECT ${identityColumns.join(', ')} FROM users WHERE id = ?`,
          [row.id]
        );
        if (!other || rowHash(identityColumns, other) !== rowHash(identityColumns, row)) superMismatch++;
      }
      checks.push({
        name: 'every Super Admin account is identical in the target (id, email, username, password hash, role, status, token_version, flags)',
        ok: superMismatch === 0,
        detail: `${sourceSupers.length} Super Admin account(s) checked`
      });

      const sourceOwners = plans.get('users')!.shared.includes('is_platform_owner')
        ? ((await readAll(src, 'SELECT id FROM users WHERE is_platform_owner = 1')) as Array<{ id: string }>)
        : [];
      const targetOwners = await target.all<{ id: string }>('SELECT id FROM users WHERE is_platform_owner = 1');
      checks.push({
        name: 'exactly one platform owner in the target',
        ok: targetOwners.length === 1,
        detail: `target owners=${targetOwners.length}`
      });
      if (sourceOwners.length > 0) {
        checks.push({
          name: 'platform owner id is the same as in the source',
          ok: sourceOwners.length === 1 && targetOwners.length === 1 && sourceOwners[0].id === targetOwners[0].id,
          detail: `source owners=${sourceOwners.length}`
        });
      }
      const activeSupers = await target.get<{ n: string | number }>(
        "SELECT COUNT(*) AS n FROM users WHERE upper(role) = 'SUPER_ADMIN' AND account_status = 'ACTIVE'"
      );
      const sourceActiveSupers = sourceSupers.filter((r) => (r.account_status ?? 'ACTIVE') === 'ACTIVE').length;
      checks.push({
        name: 'no second Super Admin was created',
        ok: Number(activeSupers?.n ?? 0) === sourceActiveSupers,
        detail: `source active=${sourceActiveSupers} target active=${activeSupers?.n}`
      });
    }

    return finish(checks.every((c) => c.ok));
  } finally {
    src.close();
    if (!options.keepConnection) await closeDb();
  }

  function finish(ok: boolean): MigrationReport {
    const originalFiles = originals.map((o) => ({
      ...o,
      sha256After: fs.existsSync(o.file) ? sha256File(o.file) : 'missing'
    }));
    const unchanged = originalFiles.every((o) => o.sha256Before === o.sha256After);
    checks.push({ name: 'original source files were not modified (SHA-256 before == after)', ok: unchanged });

    const report: MigrationReport = {
      ok: ok && unchanged,
      mode,
      startedAt,
      target: targetDescription || (options.dryRun ? 'PGlite (in-memory, disposable)' : 'not reached'),
      source: {
        path: source,
        originalFiles,
        unchanged,
        snapshotPath,
        snapshotSha256,
        schemaVersion
      },
      unmanagedTables,
      tables: tableResults,
      checks,
      ownerNote
    };

    const reportPath = path.join(options.backupDir, `migration-report-${mode}-${stamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    report.reportPath = reportPath;
    return report;
  }
}
