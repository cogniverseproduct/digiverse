/**
 * Local rehearsal of the SQLite -> Postgres migration (no cloud account).
 *
 * Runs the SAME engine and verification as the real migration into a disposable in-memory
 * Postgres (PGlite), then reads every project back through the normal repository code.
 * The original SQLite files are only read (their SHA-256 is verified unchanged).
 *
 * Usage: npx tsx scripts/verify-migration.local.ts [--source <path>] [--backup-dir <dir>]
 * Tip: point --source at a COPY of digiverse.db + -wal + -shm if the server is running.
 */
import path from 'node:path';
import { DEFAULT_BACKUP_DIR, DEFAULT_SOURCE, runMigration } from './lib/sqliteToPostgres.js';

const argValue = (name: string) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? path.resolve(process.argv[i + 1]) : undefined;
};

const report = await runMigration({
  source: argValue('--source') ?? DEFAULT_SOURCE,
  backupDir: argValue('--backup-dir') ?? DEFAULT_BACKUP_DIR,
  dryRun: true,
  keepConnection: true
});

console.table(
  report.tables.map((t) => ({ table: t.table, source: t.sourceRows, inserted: t.inserted, targetAfter: t.targetRowsAfter, mismatched: t.mismatchedRows }))
);

const failed = report.checks.filter((c) => !c.ok);
for (const c of failed) console.error(`FAILED: ${c.name}${c.detail ? ` - ${c.detail}` : ''}`);

let readback: Record<string, number> = {};
if (report.ok) {
  const { repository } = await import('../src/db/repository.js');
  const projects = await repository.listProjects();
  let revisionsReadable = 0;
  for (const project of projects) {
    revisionsReadable += (await repository.listRevisionsByProject(project.id)).length;
    await repository.getCommercialRecord(project.id);
    await repository.getDriveMediaByProject(project.id);
  }
  readback = {
    projectsReadable: projects.length,
    tenantsReadable: (await repository.listTenants()).length,
    usersReadable: (await repository.listUsers()).length,
    revisionsReadable
  };
}

console.log(JSON.stringify({ ok: report.ok, checks: `${report.checks.length - failed.length}/${report.checks.length}`, readback, report: report.reportPath }, null, 2));

const { closeDb } = await import('../src/db/database.js');
await closeDb();
process.exit(report.ok ? 0 : 1);
