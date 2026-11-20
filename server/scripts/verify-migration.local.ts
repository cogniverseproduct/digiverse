/**
 * Local rehearsal of the SQLite -> Postgres migration (no cloud account).
 * Copies the given SQLite file into an in-memory Postgres (PGlite), then
 * reads every project back through the normal repository code.
 *
 * Usage: npx tsx scripts/verify-migration.local.ts --source <path-to-copy-of-digiverse.db>
 */
import path from 'node:path';

process.env.DATABASE_DRIVER = 'pglite';
process.env.MIGRATION_KEEP_CONNECTION = '1';
delete process.env.DATABASE_URL;

const sourceIndex = process.argv.indexOf('--source');
const source = sourceIndex > -1 ? path.resolve(process.argv[sourceIndex + 1]) : path.resolve('data/digiverse.db');

const { migrateSqliteToPostgres } = await import('./migrate-sqlite-to-postgres.js');
const reports = await migrateSqliteToPostgres({ source, dryRun: false });
console.table(reports.map((r) => ({ table: r.table, sourceRows: r.sourceRows, inserted: r.inserted, targetRowsAfter: r.targetRowsAfter })));

const { repository } = await import('../src/db/repository.js');
const { closeDb } = await import('../src/db/database.js');

const projects = await repository.listProjects();
const tenants = await repository.listTenants();
const users = await repository.listUsers();
let revisionsReadable = 0;
for (const project of projects) {
  const revisions = await repository.listRevisionsByProject(project.id);
  revisionsReadable += revisions.length;
  await repository.getCommercialRecord(project.id);
  await repository.getDriveMediaByProject(project.id);
}

const mismatches = reports.filter((r) => r.targetRowsAfter !== r.sourceRows);
console.log(JSON.stringify({
  projectsReadable: projects.length,
  tenantsReadable: tenants.length,
  usersReadable: users.length,
  revisionsReadable,
  mismatchedTables: mismatches.map((r) => r.table)
}, null, 2));

await closeDb();
process.exit(mismatches.length ? 1 : 0);
