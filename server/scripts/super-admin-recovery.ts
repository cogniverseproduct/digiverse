/**
 * Recovery for an EXISTING Super Admin account that cannot sign in. Needs shell access
 * to the server (or the production DATABASE_URL). It never creates accounts, never
 * touches Admin accounts, and every change is journaled and reversible.
 * See docs/deployment/EMAIL_IDENTITY_MIGRATION.md (section "Super Admin recovery").
 *
 *   npm run auth:recover-super-admin                          diagnose only (changes nothing)
 *   npm run auth:recover-super-admin -- --reset-password --apply
 *   npm run auth:recover-super-admin -- --reactivate --apply
 *   npm run auth:recover-super-admin -- --set-email contact@cogniverse.co.in --apply
 *   npm run auth:recover-super-admin -- --make-owner --user <username|email> --apply
 *                                   restore Product Owner access after an accidental ownership transfer
 *   npm run auth:recover-super-admin -- --rollback <journal.json>
 *
 * Options: --user <username|email>  --db <sqlite file>  (combine --reset-password,
 * --reactivate and --set-email freely). The new password is typed twice at a hidden
 * prompt, or read from RECOVERY_NEW_PASSWORD for non-interactive use. It is never
 * printed, logged or written to the journal (the journal holds the OLD hash so the
 * change can be undone: keep that file private and delete it when no longer needed).
 */
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const option = (name: string): string | undefined => {
  const index = args.indexOf(name);
  return index > -1 ? args[index + 1] : undefined;
};

const dbOption = option('--db');
if (dbOption) {
  process.env.SQLITE_PATH = path.resolve(dbOption);
  delete process.env.DATABASE_URL;
  delete process.env.DATABASE_DRIVER;
}

const { getPlatformEmails } = await import('../src/config.js');
const { getDb, closeDb } = await import('../src/db/database.js');
const { getDefaultSqlitePath } = await import('../src/db/driver.js');
const {
  diagnoseSuperAdmins, planRecovery, applyRecovery, rollbackRecovery, validateRecoveryPassword
} = await import('../src/db/superAdminRecovery.js');

function promptHidden(label: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error('No terminal available for a hidden prompt. Set RECOVERY_NEW_PASSWORD instead.'));
      return;
    }
    process.stdout.write(label);
    let value = '';
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.off('data', onData);
          process.stdout.write('\n');
          resolve(value);
          return;
        }
        if (char === '\u0003') {
          process.stdin.setRawMode(false);
          process.stdout.write('\n');
          reject(new Error('Cancelled.'));
          return;
        }
        if (char === '\u007f' || char === '\b') {
          value = value.slice(0, -1);
        } else {
          value += char;
        }
      }
    };
    process.stdin.on('data', onData);
  });
}

async function readNewPassword(): Promise<string> {
  const fromEnv = process.env.RECOVERY_NEW_PASSWORD;
  const password = fromEnv ?? (await promptHidden('New Super Admin password (hidden): '));
  const problem = validateRecoveryPassword(password);
  if (problem) throw new Error(problem);
  if (fromEnv === undefined) {
    const again = await promptHidden('Repeat the new password: ');
    if (again !== password) throw new Error('The two passwords do not match.');
  }
  return password;
}

async function main(): Promise<number> {
  const db = await getDb();
  console.log(`Database: ${db.describe()}`);
  const official = getPlatformEmails().primary;

  const rollbackFile = option('--rollback');
  if (rollbackFile) {
    const journal = JSON.parse(fs.readFileSync(path.resolve(rollbackFile), 'utf8'));
    const result = await rollbackRecovery(db, journal);
    console.log(result.restored ? 'Rolled back: the previous values were restored.' : `Not rolled back: ${result.reason}.`);
    return result.restored ? 0 : 2;
  }

  const wantsChange = flag('--reset-password') || flag('--reactivate') || flag('--make-owner') || Boolean(option('--set-email'));

  if (!wantsChange) {
    const report = await diagnoseSuperAdmins(db, official);
    console.log(`\nSuper Admin accounts: ${report.rows.length}, usable: ${report.activeCount}`);
    if (report.rows.length) console.table(report.rows.map((row) => ({
      username: row.username, email: row.emailMasked, status: row.accountStatus, enabled: row.enabled,
      password: row.passwordHash, lastLogin: row.lastLoginAt, officialEmail: row.emailMatchesOfficial, retiredEmail: row.emailIsRetired
    })));
    console.log(`\n${report.verdict}`);
    for (const step of report.nextSteps) console.log(`  -> ${step}`);
    return 0;
  }

  const newPassword = flag('--reset-password') ? await readNewPassword() : undefined;
  const plan = await planRecovery(db, {
    target: option('--user'),
    newPasswordHash: newPassword ? await bcrypt.hash(newPassword, 12) : undefined,
    reactivate: flag('--reactivate'),
    makeOwner: flag('--make-owner'),
    setEmail: option('--set-email')
  });

  if (plan.errors.length) {
    for (const error of plan.errors) console.log(`CANNOT RECOVER: ${error}`);
    return 1;
  }
  console.log('Planned changes (account ' + plan.userId + '):');
  for (const line of plan.summary) console.log(`  - ${line}`);

  if (!flag('--apply')) {
    console.log('\nDry run only. Nothing was changed. Re-run with --apply.');
    return 0;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dataDir = db.dialect === 'sqlite' ? path.dirname(getDefaultSqlitePath()) : path.resolve('data');
  if (db.dialect === 'sqlite') {
    const source = getDefaultSqlitePath();
    const backup = `${source}.pre-super-admin-recovery-${stamp}`;
    await db.exec(`VACUUM INTO '${backup.replace(/'/g, "''")}'`);
    console.log(`Backup written: ${backup}`);
  } else {
    console.log('Postgres: make sure you have a database backup/branch before continuing.');
  }

  const journal = await applyRecovery(db, plan);
  fs.mkdirSync(dataDir, { recursive: true });
  const journalPath = path.join(dataDir, `super-admin-recovery-${stamp}.journal.json`);
  fs.writeFileSync(journalPath, JSON.stringify(journal, null, 2), { mode: 0o600 });
  console.log(`Applied. Journal (contains the previous password hash, keep private): ${journalPath}`);
  console.log(`Undo with: npm run auth:recover-super-admin -- --rollback "${journalPath}"`);
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
