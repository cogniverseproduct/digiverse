/**
 * Legacy local uploads -> Vercel Blob (opt-in, report-first).
 *
 * Locally, uploaded logos/hero images are stored in server/data/uploads and referenced in the database
 * as `/api/media/uploads/<file>`. Vercel has no persistent disk, so after moving to Postgres those
 * references would 404. This tool:
 *
 *   1. (default, always safe) LISTS every reference found in the SQLite file and whether the file still exists
 *      locally. It opens the database read-only and changes nothing anywhere.
 *   2. (--apply) uploads the referenced files to Vercel Blob (`uploads/<file>`, same path scheme the app uses) and
 *      rewrites the references in the POSTGRES TARGET database only. The SQLite source is never modified.
 *      Requires BLOB_READ_WRITE_TOKEN, DATABASE_URL and --confirm-target <host>. Run it only after the
 *      SQLite -> Postgres migration has been verified and you have authorised it.
 *
 * Usage (from server/):
 *   npx tsx scripts/migrate-uploads-to-blob.ts [--db <sqlite file or snapshot>] [--uploads-dir <dir>]
 *   BLOB_READ_WRITE_TOKEN=... DATABASE_URL=... npx tsx scripts/migrate-uploads-to-blob.ts --apply --confirm-target <host>
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SOURCE } from './lib/sqliteToPostgres.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const option = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

const dbFile = path.resolve(option('--db') ?? DEFAULT_SOURCE);
const uploadsDir = path.resolve(option('--uploads-dir') ?? path.resolve(__dirname, '../data/uploads'));
const REFERENCE = /(?:https?:\/\/[^"'\s\\]+)?\/api\/media\/uploads\/([A-Za-z0-9._%\-]+)/g;

interface Hit {
  table: string;
  pk: string;
  pkValue: string;
  column: string;
  files: string[];
}

const { TABLES } = await import('../src/db/schema.js');
const { DatabaseSync } = await import('node:sqlite');

function filesIn(text: string): string[] {
  return [...text.matchAll(REFERENCE)].map((m) => decodeURIComponent(m[1]));
}

// ---- 1. scan (read-only) -------------------------------------------------------------------------
const hits: Hit[] = [];
const source = new DatabaseSync(dbFile, { readOnly: true });
try {
  const existing = new Set(
    (source.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as Array<{ name: string }>).map((r) => r.name)
  );
  for (const table of TABLES) {
    if (!existing.has(table.name) || table.name === 'schema_meta') continue;
    const pk = table.columns.find((c) => /PRIMARY KEY/i.test(c))!.split(/\s+/)[0];
    const sourceColumns = new Set(
      (source.prepare(`PRAGMA table_info(${table.name})`).all() as Array<{ name: string }>).map((c) => c.name)
    );
    for (const definition of table.columns) {
      const column = definition.split(/\s+/)[0];
      if (!sourceColumns.has(column) || !/\bTEXT\b/i.test(definition)) continue;
      const rows = source
        .prepare(`SELECT ${pk} AS pk, ${column} AS value FROM ${table.name} WHERE ${column} LIKE '%/api/media/uploads/%'`)
        .all() as Array<{ pk: string; value: string }>;
      for (const row of rows) {
        const files = [...new Set(filesIn(String(row.value)))];
        if (files.length) hits.push({ table: table.name, pk, pkValue: String(row.pk), column, files });
      }
    }
  }
} finally {
  source.close();
}

const allFiles = [...new Set(hits.flatMap((h) => h.files))].sort();
console.log(`Database scanned (read-only): ${dbFile}`);
console.table(
  allFiles.map((file) => {
    const local = path.join(uploadsDir, path.basename(file));
    return {
      file,
      existsLocally: fs.existsSync(local),
      bytes: fs.existsSync(local) ? fs.statSync(local).size : 0,
      references: hits.filter((h) => h.files.includes(file)).length
    };
  })
);
console.table(hits.map((h) => ({ table: h.table, column: h.column, id: h.pkValue, files: h.files.length })));

const missing = allFiles.filter((f) => !fs.existsSync(path.join(uploadsDir, path.basename(f))));
if (missing.length) console.log(`WARNING: ${missing.length} referenced file(s) are not on disk and cannot be uploaded: ${missing.join(', ')}`);

if (!flag('--apply')) {
  console.log('\nReport only. Nothing was uploaded or changed. See the header of this script for --apply.');
  process.exit(0);
}

// ---- 2. apply (Postgres target only) -------------------------------------------------------------
const url = process.env.DATABASE_URL?.trim();
if (!url || !process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
  console.error('--apply needs DATABASE_URL (the Postgres target) and BLOB_READ_WRITE_TOKEN.');
  process.exit(1);
}
const host = new URL(url).hostname;
if (option('--confirm-target')?.toLowerCase() !== host.toLowerCase()) {
  console.error(`Refusing to write: pass --confirm-target ${host} to confirm the Postgres host.`);
  process.exit(1);
}
if (missing.length) {
  console.error('Refusing to continue while referenced files are missing. Restore them or remove the references first.');
  process.exit(1);
}

process.env.DATABASE_DRIVER = 'postgres';
const { storeUpload, CONTENT_TYPES } = await import('../src/services/mediaStorage.js');
const { getDb, closeDb } = await import('../src/db/database.js');

const urlByFile = new Map<string, string>();
for (const file of allFiles) {
  const name = path.basename(file);
  const stored = await storeUpload(name, fs.readFileSync(path.join(uploadsDir, name)), CONTENT_TYPES[path.extname(name).toLowerCase()] ?? 'application/octet-stream');
  urlByFile.set(file, stored.url);
  console.log(`uploaded ${name}`);
}

const target = await getDb();
let rewritten = 0;
await target.transaction(async () => {
  for (const hit of hits) {
    const row = await target.get<{ value: string }>(`SELECT ${hit.column} AS value FROM ${hit.table} WHERE ${hit.pk} = ?`, [hit.pkValue]);
    if (!row?.value) continue; // not migrated to the target yet: nothing to rewrite
    const next = String(row.value).replace(REFERENCE, (whole, file: string) => urlByFile.get(decodeURIComponent(file)) ?? whole);
    if (next !== row.value) {
      await target.run(`UPDATE ${hit.table} SET ${hit.column} = ? WHERE ${hit.pk} = ?`, [next, hit.pkValue]);
      rewritten++;
    }
  }
});
await closeDb();
console.log(`Rewrote ${rewritten} reference column(s) in the Postgres target. The SQLite source was not modified.`);
