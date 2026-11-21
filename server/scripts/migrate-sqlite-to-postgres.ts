/**
 * One-time data copy: local SQLite database  ->  Postgres (e.g. Neon on Vercel).
 *
 * The engine lives in scripts/lib/sqliteToPostgres.ts. Read docs/deployment/MIGRATION_RUNBOOK.md first.
 *
 * Safety summary:
 *   - The original SQLite files (db, -wal, -shm) are only read. A consistent snapshot is retained in
 *     server/data/backups/ together with a JSON report; SHA-256 of the originals is checked after.
 *   - --dry-run migrates into a disposable in-memory PGlite database and ignores DATABASE_URL.
 *   - A real run needs DATABASE_URL and --confirm-target <host-from-the-url>, writes in ONE transaction,
 *     never overwrites existing rows and refuses a non-empty target unless --allow-nonempty.
 *   - Success means every verification check passed (keys, row content hashes, relationships,
 *     indexes/unique constraints, Super Admin/owner identity) - not just matching row counts.
 *
 * Usage (from the server/ folder):
 *   npx tsx scripts/migrate-sqlite-to-postgres.ts --dry-run
 *   DATABASE_URL=postgres://... npx tsx scripts/migrate-sqlite-to-postgres.ts --confirm-target <host>
 * Options:
 *   --source <file>            SQLite file (default server/data/digiverse.db; -wal/-shm are included)
 *   --backup-dir <dir>         where the snapshot and report go (default server/data/backups)
 *   --allow-nonempty           allow re-running against a target that already has rows (idempotent)
 *   --accept-unmanaged <t,..>  acknowledge unmanaged source tables that hold rows and will not be migrated
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_BACKUP_DIR, DEFAULT_SOURCE, runMigration, type MigrationOptions } from './lib/sqliteToPostgres.js';

function parseArgs(argv: string[]): MigrationOptions {
  const options: MigrationOptions = {
    source: DEFAULT_SOURCE,
    dryRun: false,
    backupDir: DEFAULT_BACKUP_DIR
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--source') options.source = path.resolve(argv[++i]);
    else if (arg === '--backup-dir') options.backupDir = path.resolve(argv[++i]);
    else if (arg === '--confirm-target') options.confirmTarget = argv[++i];
    else if (arg === '--allow-nonempty') options.allowNonEmptyTarget = true;
    else if (arg === '--accept-unmanaged') options.acceptUnmanaged = (argv[++i] || '').split(',').filter(Boolean);
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    const options = parseArgs(process.argv.slice(2));
    console.log(`${options.dryRun ? '[REHEARSAL - disposable in-memory Postgres] ' : '[REAL MIGRATION] '}${options.source}`);

    const report = await runMigration(options);

    console.table(
      report.tables.map((t) => ({
        table: t.table,
        source: t.sourceRows,
        inserted: t.inserted,
        alreadyPresent: t.alreadyPresent,
        targetAfter: t.targetRowsAfter,
        missingPk: t.missingPrimaryKeys,
        mismatched: t.mismatchedRows,
        skippedSourceCols: t.skippedSourceColumns.join(', ')
      }))
    );
    for (const u of report.unmanagedTables) console.log(`Unmanaged source table "${u.table}" (${u.rows} rows): ${u.decision}`);
    if (report.ownerNote) console.log(report.ownerNote);

    const failed = report.checks.filter((c) => !c.ok);
    console.log(`Checks: ${report.checks.length - failed.length}/${report.checks.length} passed`);
    for (const check of failed) console.error(`  FAILED: ${check.name}${check.detail ? ` - ${check.detail}` : ''}`);
    console.log(`Snapshot: ${report.source.snapshotPath}\nReport:   ${report.reportPath}`);
    console.log(`Original source unchanged: ${report.source.unchanged ? 'yes' : 'NO - investigate immediately'}`);

    if (!report.ok) {
      console.error('MIGRATION NOT VERIFIED. Do not switch the application to this database.');
      process.exit(1);
    }
    console.log(options.dryRun ? 'Rehearsal verified. Nothing was written to any real database.' : 'Migration verified.');
  } catch (error) {
    console.error('Migration failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
