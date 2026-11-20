/**
 * Email identity migration (reversible).
 *
 * Moves the identity stored for the Super Admin to a new address WITHOUT touching
 * account ids, password hashes, roles, status, token versions, ownership or project
 * links. By default ONLY `users.email` changes: audit logs and other historical
 * records are left exactly as written. Pass `includeHistory` to also rewrite the
 * old address inside those records (opt-in, journaled, reversible).
 *
 *   plan     read-only: what would change, plus precondition errors
 *   apply    one transaction; each UPDATE is guarded by the old value
 *   rollback restores the exact old values from the journal (guarded by the new value)
 *   verify   compares account snapshots and checks no old-address rows remain
 *
 * No schema change. The journal (JSON) records every row, column, old and new value.
 */

import type { Database } from './driver.js';

export interface MigrationChange {
  table: string;
  rowId: string;
  column: string;
  oldValue: string;
  newValue: string;
}

export interface MigrationPlan {
  from: string;
  to: string;
  errors: string[];
  changes: MigrationChange[];
}

export interface MigrationJournal {
  version: 1;
  appliedAt: string;
  from: string;
  to: string;
  changes: MigrationChange[];
}

export interface AccountSnapshotRow {
  id: string;
  password_hash: string;
  role: string;
  account_status: string;
  is_active: number;
  token_version: number;
  created_at: string;
  username: string | null;
  name: string;
}

/** Columns that hold an email address and may name the old identity. */
const EMAIL_COLUMNS: Array<{ table: string; column: string }> = [
  { table: 'audit_logs', column: 'user_email' },
  { table: 'admin_access_requests', column: 'email' },
  { table: 'admin_password_resets', column: 'admin_email' },
  { table: 'ownership_transfers', column: 'current_owner_email' },
  { table: 'ownership_transfers', column: 'target_email' }
];

/** Free-text JSON columns that may quote the old address. */
const JSON_COLUMNS: Array<{ table: string; column: string }> = [
  { table: 'audit_logs', column: 'details_json' }
];

function lc(value: string): string {
  return value.trim().toLowerCase();
}

function replaceAllInsensitive(text: string, from: string, to: string): string {
  return text.split(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')).join(to);
}

export interface MigrationOptions {
  /** Also rewrite the old address in audit logs, requests and transfers. Default false. */
  includeHistory?: boolean;
}

export async function planEmailMigration(
  db: Database, fromRaw: string, toRaw: string, options: MigrationOptions = {}
): Promise<MigrationPlan> {
  const from = lc(fromRaw);
  const to = lc(toRaw);
  const plan: MigrationPlan = { from, to, errors: [], changes: [] };

  if (!from || !to || from === to) {
    plan.errors.push('The old and new addresses must both be set and different.');
    return plan;
  }

  const holders = await db.all<{ id: string; role: string }>(
    'SELECT id, role FROM users WHERE lower(email) = ?', [from]
  );
  const target = await db.all<{ id: string }>('SELECT id FROM users WHERE lower(email) = ?', [to]);

  if (holders.length === 0) {
    plan.errors.push(`No account uses ${from}. Nothing to migrate (already migrated?).`);
  } else if (holders.length > 1) {
    plan.errors.push(`${holders.length} accounts use ${from}; expected exactly one.`);
  } else if (holders[0].role !== 'SUPER_ADMIN') {
    plan.errors.push(`The account using ${from} is not the Super Admin (role ${holders[0].role}); refusing to change it.`);
  }
  if (target.length > 0) {
    plan.errors.push(`${to} already belongs to an account (${target[0].id}); refusing to create a duplicate.`);
  }
  if (plan.errors.length) return plan;

  const owner = await db.get<{ id: string; email: string }>(
    'SELECT id, email FROM users WHERE lower(email) = ?', [from]
  );
  plan.changes.push({ table: 'users', rowId: owner!.id, column: 'email', oldValue: owner!.email, newValue: to });

  if (!options.includeHistory) {
    return plan;
  }

  for (const { table, column } of EMAIL_COLUMNS) {
    const rows = await db.all<{ id: string; value: string }>(
      `SELECT id, ${column} AS value FROM ${table} WHERE lower(${column}) = ?`, [from]
    );
    for (const row of rows) {
      plan.changes.push({ table, rowId: row.id, column, oldValue: row.value, newValue: to });
    }
  }

  for (const { table, column } of JSON_COLUMNS) {
    const rows = await db.all<{ id: string; value: string }>(
      `SELECT id, ${column} AS value FROM ${table} WHERE lower(${column}) LIKE ?`, [`%${from}%`]
    );
    for (const row of rows) {
      plan.changes.push({
        table, rowId: row.id, column, oldValue: row.value,
        newValue: replaceAllInsensitive(row.value, from, to)
      });
    }
  }

  return plan;
}

export async function snapshotAccounts(db: Database): Promise<AccountSnapshotRow[]> {
  return db.all<AccountSnapshotRow>(
    `SELECT id, password_hash, role, account_status, is_active, token_version, created_at, username, name
     FROM users ORDER BY id`
  );
}

async function updateGuarded(
  db: Database, change: MigrationChange, setTo: string, mustCurrentlyBe: string
): Promise<number> {
  const result = await db.run(
    `UPDATE ${change.table} SET ${change.column} = ? WHERE id = ? AND ${change.column} = ?`,
    [setTo, change.rowId, mustCurrentlyBe]
  );
  return result.changes;
}

export async function applyEmailMigration(db: Database, plan: MigrationPlan): Promise<MigrationJournal> {
  if (plan.errors.length) {
    throw new Error(`Refusing to apply: ${plan.errors.join(' ')}`);
  }

  await db.transaction(async () => {
    for (const change of plan.changes) {
      const changed = await updateGuarded(db, change, change.newValue, change.oldValue);
      if (changed !== 1) {
        // Throwing rolls the whole transaction back.
        throw new Error(`Row ${change.table}.${change.rowId} changed while migrating; nothing was applied.`);
      }
    }
  });

  return {
    version: 1,
    appliedAt: new Date().toISOString(),
    from: plan.from,
    to: plan.to,
    changes: plan.changes
  };
}

export interface RollbackResult {
  restored: number;
  skipped: Array<{ table: string; rowId: string; column: string; reason: string }>;
}

export async function rollbackEmailMigration(db: Database, journal: MigrationJournal): Promise<RollbackResult> {
  if (!journal || journal.version !== 1 || !Array.isArray(journal.changes)) {
    throw new Error('This is not a valid email migration journal.');
  }

  const result: RollbackResult = { restored: 0, skipped: [] };
  await db.transaction(async () => {
    for (const change of [...journal.changes].reverse()) {
      if (change.table === 'users') {
        // Do not hand the old address back if somebody else took it in the meantime.
        const taken = await db.get<{ id: string }>(
          'SELECT id FROM users WHERE lower(email) = ? AND id <> ?', [lc(change.oldValue), change.rowId]
        );
        if (taken) {
          result.skipped.push({ table: change.table, rowId: change.rowId, column: change.column, reason: 'old address now used by another account' });
          continue;
        }
      }
      const changed = await updateGuarded(db, change, change.oldValue, change.newValue);
      if (changed === 1) {
        result.restored += 1;
      } else {
        result.skipped.push({ table: change.table, rowId: change.rowId, column: change.column, reason: 'value was edited after the migration' });
      }
    }
  });
  return result;
}

export interface VerificationReport {
  ok: boolean;
  problems: string[];
  remainingOldAddressRows: number;
  newAddressResolvesTo: string | null;
}

/** Compares account snapshots (everything but email must be identical) and counts leftovers. */
export async function verifyEmailMigration(
  db: Database, before: AccountSnapshotRow[], from: string, to: string, options: MigrationOptions = {}
): Promise<VerificationReport> {
  const problems: string[] = [];
  const after = await snapshotAccounts(db);

  if (after.length !== before.length) {
    problems.push(`Account count changed from ${before.length} to ${after.length}.`);
  }
  const byId = new Map(after.map((row) => [row.id, row]));
  for (const row of before) {
    const now = byId.get(row.id);
    if (!now) {
      problems.push(`Account ${row.id} is missing after the migration.`);
      continue;
    }
    for (const key of Object.keys(row) as Array<keyof AccountSnapshotRow>) {
      if (row[key] !== now[key]) problems.push(`Account ${row.id}: ${key} changed.`);
    }
  }

  let remaining = 0;
  const own = await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM users WHERE lower(email) = ?', [lc(from)]);
  remaining += Number(own?.n ?? 0);
  // Historical records are only checked when the migration was asked to rewrite them.
  if (options.includeHistory) {
    for (const { table, column } of EMAIL_COLUMNS) {
      const row = await db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table} WHERE lower(${column}) = ?`, [lc(from)]);
      remaining += Number(row?.n ?? 0);
    }
    for (const { table, column } of JSON_COLUMNS) {
      const row = await db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table} WHERE lower(${column}) LIKE ?`, [`%${lc(from)}%`]);
      remaining += Number(row?.n ?? 0);
    }
  }
  if (remaining > 0) problems.push(`${remaining} row(s) still contain the old address.`);

  const resolved = await db.get<{ id: string }>('SELECT id FROM users WHERE lower(email) = ?', [lc(to)]);
  if (!resolved) problems.push('The new address does not resolve to an account.');

  return { ok: problems.length === 0, problems, remainingOldAddressRows: remaining, newAddressResolvesTo: resolved?.id ?? null };
}
