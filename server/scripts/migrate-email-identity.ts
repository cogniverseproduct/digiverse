/**
 * Moves the Super Admin identity from the old Gmail address to the official DigiVerse
 * address. Only `users.email` changes by default (audit history is left untouched).
 * Reversible. See
 * docs/deployment/EMAIL_IDENTITY_MIGRATION.md.
 *
 * Usage (from the server folder, with the DigiVerse dev server STOPPED):
 *   npm run db:migrate-email                          dry run (changes nothing)
 *   npm run db:migrate-email -- --apply               backup, migrate, verify
 *   npm run db:migrate-email -- --rollback <journal>  restore the old values
 *
 * Options:
 *   --db <path>   use this SQLite file instead of server/data/digiverse.db
 *   --rewrite-history  ALSO rewrite the old address inside audit logs, access requests
 *                 and transfers (off by default; journaled and reversible)
 *   --from <e>    old address (default: the previous Gmail identity)
 *   --to <e>      new address (default: PLATFORM_PRIMARY_EMAIL / contact@cogniverse.co.in)
 *
 * It never changes account ids, password hashes, roles or project links, and never
 * creates an account. Postgres: no file backup is possible here, so take a database
 * backup (e.g. a Neon branch) first; the journal still allows --rollback.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const option = (name: string): string | undefined => {
  const index = args.indexOf(name);
  return index > -1 ? args[index + 1] : undefined;
};

// Written once, here: the identity being retired. (This is the only place it remains in code.)
const RETIRED_ADDRESS = 'cogniverse.digiverse@gmail.com';

const dbOption = option('--db');
if (dbOption) {
  process.env.SQLITE_PATH = path.resolve(dbOption);
  delete process.env.DATABASE_URL;
  delete process.env.DATABASE_DRIVER;
}

const { getPlatformEmails } = await import('../src/config.js');
const { getDb, getDbUninitialized, closeDb } = await import('../src/db/database.js');
const { getDefaultSqlitePath } = await import('../src/db/driver.js');
const {
  planEmailMigration, applyEmailMigration, rollbackEmailMigration,
  snapshotAccounts, verifyEmailMigration
} = await import('../src/db/emailIdentityMigration.js');

const from = (option('--from') || RETIRED_ADDRESS).toLowerCase();
const to = (option('--to') || getPlatformEmails().primary).toLowerCase();

function mask(email: string): string {
  return email.replace(/^(.).*(@.*)$/, '$1***$2');
}

async function main(): Promise<number> {
  // Open WITHOUT the application schema upgrade: dry runs must not alter the database, and the
  // backup must capture the database as it was before any upgrade.
  let db = await getDbUninitialized();
  const isSqlite = db.dialect === 'sqlite';
  const dataDir = isSqlite ? path.dirname(getDefaultSqlitePath()) : path.resolve('data');
  console.log(`Database: ${db.describe()}`);

  const rollbackFile = option('--rollback');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');

  if (flag('--apply') && !rollbackFile) {
    if (isSqlite) {
      // VACUUM INTO writes a consistent snapshot even while another process (the dev server) has the file open.
      const source = getDefaultSqlitePath();
      const backup = `${source}.pre-email-migration-${stamp}`;
      await db.exec(`VACUUM INTO '${backup.replace(/'/g, "''")}'`);
      console.log(`Backup written (taken BEFORE any schema upgrade): ${backup}`);
    } else {
      console.log('Postgres: make sure you have a database backup/branch before continuing.');
    }
  }

  if (flag('--apply') || rollbackFile) {
    db = await getDb(); // creates/upgrades the schema now that a backup exists
  }

  if (rollbackFile) {
    const journal = JSON.parse(fs.readFileSync(path.resolve(rollbackFile), 'utf8'));
    const result = await rollbackEmailMigration(db, journal);
    console.log(`Restored ${result.restored} value(s).`);
    for (const skipped of result.skipped) {
      console.log(`  skipped ${skipped.table}.${skipped.column} (${skipped.rowId}): ${skipped.reason}`);
    }
    return result.skipped.length ? 2 : 0;
  }

  const includeHistory = flag('--rewrite-history');
  const plan = await planEmailMigration(db, from, to, { includeHistory });
  console.log(`Migration: ${mask(plan.from)} -> ${plan.to}`);
  if (plan.errors.length) {
    for (const error of plan.errors) console.log(`  CANNOT MIGRATE: ${error}`);
    return 1;
  }

  const perTable = new Map<string, number>();
  for (const change of plan.changes) {
    const key = `${change.table}.${change.column}`;
    perTable.set(key, (perTable.get(key) ?? 0) + 1);
  }
  console.table([...perTable].map(([target, rows]) => ({ target, rows })));

  if (!flag('--apply')) {
    console.log('Dry run only. Nothing was changed. Re-run with --apply to migrate.');
    return 0;
  }

  const before = await snapshotAccounts(db);
  const journal = await applyEmailMigration(db, plan);
  fs.mkdirSync(dataDir, { recursive: true });
  const journalPath = path.join(dataDir, `email-migration-${stamp}.journal.json`);
  fs.writeFileSync(journalPath, JSON.stringify(journal, null, 2));
  console.log(`Applied ${journal.changes.length} change(s). Journal: ${journalPath}`);

  const report = await verifyEmailMigration(db, before, from, to, { includeHistory });
  if (!report.ok) {
    console.log('VERIFICATION FAILED:');
    for (const problem of report.problems) console.log(`  - ${problem}`);
    console.log(`Roll back with: npm run db:migrate-email -- --rollback "${journalPath}"`);
    return 3;
  }
  console.log(`Verified: ${before.length} account(s) identical except email; no account still holds the old address; ${to} resolves to the Super Admin.`);
  console.log('The Super Admin can log in with the username or the new email. Keep the journal to roll back.');
  return 0;
}

let code = 1;
try {
  code = await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
} finally {
  await closeDb();
}
process.exit(code);
