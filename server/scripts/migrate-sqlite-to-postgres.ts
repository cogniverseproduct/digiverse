/**
 * One-time data copy: local SQLite database  ->  Postgres (e.g. Neon on Vercel).
 *
 * Safety:
 *   - The source SQLite file (and its -wal/-shm files) is COPIED to a temporary
 *     folder first; the original is never opened for writing.
 *   - Rows are inserted with ON CONFLICT DO NOTHING, so the script can be
 *     re-run safely and never overwrites rows that already exist in Postgres.
 *   - --dry-run only reports what would be copied.
 *
 * Usage (from the server/ folder):
 *   DATABASE_URL="postgres://..." npx tsx scripts/migrate-sqlite-to-postgres.ts --dry-run
 *   DATABASE_URL="postgres://..." npx tsx scripts/migrate-sqlite-to-postgres.ts
 *   Optional: --source path/to/digiverse.db
 *
 * PowerShell:
 *   $env:DATABASE_URL="postgres://..."; npx tsx scripts/migrate-sqlite-to-postgres.ts --dry-run
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface Options {
  source: string;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Options {
  const options: Options = {
    source: path.resolve(__dirname, '../data/digiverse.db'),
    dryRun: false
  };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dry-run') options.dryRun = true;
    else if (argv[i] === '--source') options.source = path.resolve(argv[++i]);
  }

  return options;
}

export interface TableReport {
  table: string;
  sourceRows: number;
  inserted: number;
  targetRowsAfter: number;
  skippedColumns: string[];
}

export async function migrateSqliteToPostgres(options: Options): Promise<TableReport[]> {
  const driver = (process.env.DATABASE_DRIVER || (process.env.DATABASE_URL ? 'postgres' : '')).toLowerCase();
  if (driver !== 'postgres' && driver !== 'pglite') {
    throw new Error('Set DATABASE_URL (or DATABASE_DRIVER=pglite for a local test) to choose the Postgres target.');
  }
  process.env.DATABASE_DRIVER = driver;

  if (!fs.existsSync(options.source)) {
    throw new Error(`Source SQLite database not found: ${options.source}`);
  }

  // Work on a copy so the original database is never modified.
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'digiverse-migrate-'));
  const copyPath = path.join(tempDir, 'source.db');
  for (const suffix of ['', '-wal', '-shm']) {
    if (fs.existsSync(options.source + suffix)) {
      fs.copyFileSync(options.source + suffix, copyPath + suffix);
    }
  }

  const { DatabaseSync } = await import('node:sqlite');
  const source = new DatabaseSync(copyPath);

  const { getDb, closeDb } = await import('../src/db/database.js');
  const { TABLES } = await import('../src/db/schema.js');
  const target = await getDb();

  if (target.dialect !== 'postgres') {
    throw new Error('Target database is not Postgres.');
  }

  const sourceTables = new Set(
    (source.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as Array<{ name: string }>).map(
      (row) => row.name
    )
  );

  const reports: TableReport[] = [];

  try {
    for (const table of TABLES) {
      if (table.name === 'schema_meta' || !sourceTables.has(table.name)) continue;

      const targetColumns = table.columns.map((definition) => definition.trim().split(/\s+/)[0]);
      const sourceColumns = (source.prepare(`PRAGMA table_info(${table.name})`).all() as Array<{ name: string }>).map(
        (column) => column.name
      );
      const columns = targetColumns.filter((column) => sourceColumns.includes(column));
      const skippedColumns = sourceColumns.filter((column) => !targetColumns.includes(column));

      const rows = source.prepare(`SELECT ${columns.join(', ')} FROM ${table.name}`).all() as Array<Record<string, any>>;
      let inserted = 0;

      if (!options.dryRun && rows.length > 0) {
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO ${table.name} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

        await target.transaction(async () => {
          for (const row of rows) {
            const result = await target.run(
              sql,
              columns.map((column) => {
                const value = row[column];
                return typeof value === 'bigint' ? Number(value) : value;
              })
            );
            inserted += result.changes;
          }
        });
      }

      const after = await target.get<{ count: string | number }>(`SELECT COUNT(*) AS count FROM ${table.name}`);

      reports.push({
        table: table.name,
        sourceRows: rows.length,
        inserted,
        targetRowsAfter: Number(after?.count ?? 0),
        skippedColumns
      });
    }

    const notMigrated = [...sourceTables].filter(
      (name) => !TABLES.some((table) => table.name === name) && !name.startsWith('sqlite_')
    );
    if (notMigrated.length) {
      console.log(`Tables in SQLite that are not part of the current schema (not copied): ${notMigrated.join(', ')}`);
    }
  } finally {
    source.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
    if (!process.env.MIGRATION_KEEP_CONNECTION) {
      await closeDb();
    }
  }

  return reports;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const options = parseArgs(process.argv.slice(2));
  console.log(`${options.dryRun ? '[DRY RUN] ' : ''}Copying ${options.source} -> Postgres`);

  migrateSqliteToPostgres(options)
    .then((reports) => {
      console.table(reports.map((r) => ({ ...r, skippedColumns: r.skippedColumns.join(', ') })));
      const mismatched = reports.filter((r) => !options.dryRun && r.targetRowsAfter < r.sourceRows);
      if (mismatched.length) {
        console.error('Some tables have fewer rows in Postgres than in SQLite:', mismatched.map((r) => r.table));
        process.exit(1);
      }
      console.log(options.dryRun ? 'Dry run complete. No data was written.' : 'Migration complete.');
    })
    .catch((error) => {
      console.error('Migration failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
