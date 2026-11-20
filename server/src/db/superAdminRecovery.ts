/**
 * Controlled recovery for an EXISTING Super Admin account that cannot sign in.
 *
 * This is deliberately not an HTTP feature: it needs shell access to the server (or
 * the production DATABASE_URL), which is the same authority as the database itself,
 * so it does not weaken the one-time first-run setup rules. It never creates accounts,
 * never touches Admin accounts, and every change is journaled so it can be rolled back.
 *
 *   diagnose   read-only report (identities masked, no hashes)
 *   plan/apply reset the password and/or reactivate and/or change the email of ONE Super Admin
 *   rollback   restores the exact previous values from the journal
 *
 * --make-owner is the lock-out recovery for ownership: it makes ONE named account (even a former
 * owner who was demoted) an active Super Admin and the Product Owner, and clears the owner flag on
 * everyone else. It needs shell/database access, so it does not weaken the in-app rules.
 */

import { randomUUID } from 'node:crypto';
import type { Database } from './driver.js';
import { isValidEmail, normalizeEmail } from '../utils/email.js';
import { isRetiredPlatformEmail } from '../config.js';

export const MIN_RECOVERY_PASSWORD_LENGTH = 12;

export interface SuperAdminDiagnosisRow {
  id: string;
  username: string | null;
  emailMasked: string | null;
  accountStatus: string;
  enabled: boolean;
  passwordHash: 'bcrypt' | 'missing' | 'unrecognized';
  tokenVersion: number;
  lastLoginAt: string | null;
  usable: boolean;
  emailMatchesOfficial: boolean;
  emailIsRetired: boolean;
}

export interface SuperAdminDiagnosis {
  rows: SuperAdminDiagnosisRow[];
  activeCount: number;
  setupOpen: boolean;
  verdict: string;
  nextSteps: string[];
}

function mask(email: string | null): string | null {
  return email ? email.replace(/^(.{1,2}).*(@.*)$/, '$1***$2') : null;
}

export async function diagnoseSuperAdmins(db: Database, officialEmail: string): Promise<SuperAdminDiagnosis> {
  const records = await db.all<any>(
    `SELECT id, username, email, account_status, is_active, password_hash, token_version, last_login_at
     FROM users WHERE upper(role) = 'SUPER_ADMIN' ORDER BY created_at`
  );

  const rows: SuperAdminDiagnosisRow[] = records.map((row) => {
    const status = row.account_status || (row.is_active === 0 ? 'DISABLED' : 'ACTIVE');
    const enabled = status === 'ACTIVE' && Number(row.is_active ?? 1) === 1;
    const hash: string = row.password_hash || '';
    const passwordHash = !hash ? 'missing' : /^\$2[aby]\$\d{2}\$.{53}$/.test(hash) ? 'bcrypt' : 'unrecognized';
    const email: string | null = row.email ? String(row.email).toLowerCase() : null;
    return {
      id: row.id,
      username: row.username ?? null,
      emailMasked: mask(email),
      accountStatus: status,
      enabled,
      passwordHash,
      tokenVersion: Number(row.token_version ?? 1),
      lastLoginAt: row.last_login_at ?? null,
      usable: enabled && passwordHash !== 'missing',
      emailMatchesOfficial: Boolean(email) && email === officialEmail.toLowerCase(),
      emailIsRetired: Boolean(email) && isRetiredPlatformEmail(email!)
    };
  });

  const activeCount = rows.filter((row) => row.usable).length;
  const nextSteps: string[] = [];
  let verdict: string;

  if (rows.length === 0) {
    verdict = 'No Super Admin account exists. First-time setup is open (local machine, or SETUP_KEY remotely).';
  } else if (activeCount === 0) {
    verdict = 'A Super Admin account exists but is not usable (disabled/removed or no password). First-time setup is open, but recovering the existing account is preferred.';
    nextSteps.push('Reactivate and reset the password: npm run auth:recover-super-admin -- --reset-password --reactivate --apply');
  } else {
    verdict = 'A usable Super Admin account exists. First-time setup is closed.';
    const owner = rows.find((row) => row.usable)!;
    if (owner.emailIsRetired) {
      nextSteps.push('The Super Admin still uses the retired email. Move it: npm run db:migrate-email -- --apply  (or --set-email below).');
    } else if (!owner.emailMatchesOfficial) {
      nextSteps.push(`The Super Admin email is not the official ${officialEmail}. Sign in with the username, or set it: npm run auth:recover-super-admin -- --set-email ${officialEmail} --apply`);
    }
    nextSteps.push('If the password is lost: npm run auth:recover-super-admin -- --reset-password --apply');
  }

  return { rows, activeCount, setupOpen: activeCount === 0, verdict, nextSteps };
}

export interface RecoveryRequest {
  /** Username or email of the Super Admin to repair. Optional only when exactly one exists. */
  target?: string;
  /** bcrypt hash of the new password (the caller hashes; plaintext is never passed here). */
  newPasswordHash?: string;
  reactivate?: boolean;
  setEmail?: string;
  /** Restore ownership to --user (promoting to Super Admin and reactivating if necessary). */
  makeOwner?: boolean;
}

export interface RecoveryFieldChange {
  column: 'password_hash' | 'token_version' | 'account_status' | 'is_active' | 'disabled_reason' | 'disabled_at' | 'email' | 'role' | 'is_platform_owner';
  /** Row the change belongs to; defaults to the plan main account. */
  userId?: string;
  before: string | number | null;
  after: string | number | null;
}

export interface RecoveryPlan {
  errors: string[];
  userId?: string;
  changes: RecoveryFieldChange[];
  /** Names only, safe to print. */
  summary: string[];
}

export interface RecoveryJournal {
  version: 1;
  kind: 'super-admin-recovery';
  appliedAt: string;
  userId: string;
  changes: RecoveryFieldChange[];
}

export function validateRecoveryPassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < MIN_RECOVERY_PASSWORD_LENGTH) {
    return `The new password must contain at least ${MIN_RECOVERY_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > 1024) return 'The new password is too long.';
  return null;
}

export async function planRecovery(db: Database, request: RecoveryRequest): Promise<RecoveryPlan> {
  const plan: RecoveryPlan = { errors: [], changes: [], summary: [] };

  if (!request.newPasswordHash && !request.reactivate && !request.setEmail && !request.makeOwner) {
    plan.errors.push('Nothing to do: choose --reset-password, --reactivate, --set-email and/or --make-owner.');
    return plan;
  }
  if (request.makeOwner && !request.target) {
    plan.errors.push('--make-owner needs --user <username|email> so ownership is never given by guesswork.');
    return plan;
  }

  const supers = await db.all<any>(
    request.makeOwner ? 'SELECT * FROM users' : "SELECT * FROM users WHERE upper(role) = 'SUPER_ADMIN'"
  );
  let row: any;
  if (request.target) {
    const t = request.target.trim().toLowerCase();
    row = supers.find((u) => (u.username || '').toLowerCase() === t || (u.email || '').toLowerCase() === t);
    if (!row) {
      plan.errors.push(request.makeOwner
        ? 'No account matches that username/email.'
        : 'No Super Admin matches that username/email. This tool only repairs Super Admin accounts.');
      return plan;
    }
  } else if (supers.length === 1) {
    row = supers[0];
  } else if (supers.length === 0) {
    plan.errors.push('There is no Super Admin account to recover. Use the First-Time Setup page instead.');
    return plan;
  } else {
    plan.errors.push('Several Super Admin accounts exist; pass --user <username|email>.');
    return plan;
  }

  plan.userId = row.id;

  if (request.newPasswordHash) {
    plan.changes.push({ column: 'password_hash', before: row.password_hash ?? null, after: request.newPasswordHash });
    // Revoke every session issued with the old credentials.
    plan.changes.push({ column: 'token_version', before: Number(row.token_version ?? 1), after: Number(row.token_version ?? 1) + 1 });
    plan.summary.push('password will be replaced and existing sessions revoked');
  }

  if (request.makeOwner) {
    if (!row.email) {
      plan.errors.push('A Super Admin needs an email address; set one first with --set-email.');
      return plan;
    }
    if (String(row.role).toUpperCase() !== 'SUPER_ADMIN') {
      plan.changes.push({ column: 'role', before: row.role ?? null, after: 'SUPER_ADMIN' });
      plan.summary.push('account will be promoted to Super Admin');
    }
    if (Number(row.is_platform_owner ?? 0) !== 1) {
      plan.changes.push({ column: 'is_platform_owner', before: Number(row.is_platform_owner ?? 0), after: 1 });
    }
    for (const other of supers) {
      if (other.id !== row.id && Number(other.is_platform_owner ?? 0) === 1) {
        plan.changes.push({ userId: other.id, column: 'is_platform_owner', before: 1, after: 0 });
      }
    }
    plan.summary.push('this account will become the Product Owner (owner flag removed from every other account)');
  }

  if (request.reactivate || request.makeOwner) {
    const status = row.account_status || 'ACTIVE';
    if (status !== 'ACTIVE') plan.changes.push({ column: 'account_status', before: row.account_status ?? null, after: 'ACTIVE' });
    if (Number(row.is_active ?? 1) !== 1) plan.changes.push({ column: 'is_active', before: row.is_active ?? null, after: 1 });
    if (row.disabled_reason) plan.changes.push({ column: 'disabled_reason', before: row.disabled_reason, after: null });
    if (row.disabled_at) plan.changes.push({ column: 'disabled_at', before: row.disabled_at, after: null });
    plan.summary.push(status === 'ACTIVE' && Number(row.is_active ?? 1) === 1 ? 'account is already active' : 'account will be reactivated');
  }

  if (request.setEmail) {
    const email = normalizeEmail(request.setEmail);
    if (!isValidEmail(email)) {
      plan.errors.push('--set-email is not a valid email address.');
    } else if (isRetiredPlatformEmail(email)) {
      plan.errors.push('--set-email is a retired DigiVerse identity.');
    } else {
      const holder = await db.get<{ id: string }>('SELECT id FROM users WHERE lower(email) = ? AND id <> ?', [email, row.id]);
      if (holder) {
        plan.errors.push('That email already belongs to another account; it will not be taken over.');
      } else if ((row.email || '').toLowerCase() !== email) {
        plan.changes.push({ column: 'email', before: row.email ?? null, after: email });
        plan.summary.push('email will be changed');
      } else {
        plan.summary.push('email already matches');
      }
    }
  }

  if (!plan.errors.length && plan.changes.length === 0) {
    plan.errors.push('Nothing needs to change for this account.');
  }
  return plan;
}

function groupByUser(changes: RecoveryFieldChange[], defaultUserId: string): Map<string, RecoveryFieldChange[]> {
  const groups = new Map<string, RecoveryFieldChange[]>();
  for (const change of changes) {
    const key = change.userId ?? defaultUserId;
    groups.set(key, [...(groups.get(key) ?? []), change]);
  }
  return groups;
}

export async function applyRecovery(db: Database, plan: RecoveryPlan): Promise<RecoveryJournal> {
  if (plan.errors.length || !plan.userId) {
    throw new Error(`Refusing to apply: ${plan.errors.join(' ') || 'no target account.'}`);
  }
  const userId = plan.userId;

  await db.transaction(async () => {
    const now = new Date().toISOString();
    for (const [rowId, changes] of groupByUser(plan.changes, userId)) {
      const current = await db.get<any>('SELECT * FROM users WHERE id = ?', [rowId]);
      if (!current) throw new Error('An account no longer exists; nothing was changed.');
      for (const change of changes) {
        if ((current[change.column] ?? null) !== change.before) {
          throw new Error(`The account changed while recovering (${change.column}); nothing was changed.`);
        }
      }
      const sets = changes.map((change) => `${change.column} = ?`);
      await db.run(
        `UPDATE users SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`,
        [...changes.map((change) => change.after), now, rowId]
      );
    }

    // Audit trail (column names only: never hashes or passwords).
    await db.run(
      `INSERT INTO audit_logs (id, user_id, user_email, user_role, action, resource_type, resource_id, details_json, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), 'system', 'system@digiverse.internal', 'SUPER_ADMIN', 'SUPER_ADMIN_RECOVERY', 'users', userId,
        JSON.stringify({ changed: plan.changes.map((change) => change.column), via: 'recovery-cli' }), 'local', now]
    );
  });

  return { version: 1, kind: 'super-admin-recovery', appliedAt: new Date().toISOString(), userId, changes: plan.changes };
}

export interface RecoveryRollbackResult {
  restored: boolean;
  reason?: string;
}

export async function rollbackRecovery(db: Database, journal: RecoveryJournal): Promise<RecoveryRollbackResult> {
  if (!journal || journal.version !== 1 || journal.kind !== 'super-admin-recovery' || !Array.isArray(journal.changes)) {
    throw new Error('This is not a valid Super Admin recovery journal.');
  }

  let result: RecoveryRollbackResult = { restored: false };
  await db.transaction(async () => {
    const groups = groupByUser(journal.changes, journal.userId);
    for (const [rowId, changes] of groups) {
      const current = await db.get<any>('SELECT * FROM users WHERE id = ?', [rowId]);
      if (!current) {
        result = { restored: false, reason: 'an account no longer exists' };
        return;
      }
      for (const change of changes) {
        if ((current[change.column] ?? null) !== change.after) {
          result = { restored: false, reason: `${change.column} was changed after the recovery; nothing was rolled back` };
          return;
        }
      }
    }
    const now = new Date().toISOString();
    for (const [rowId, changes] of groups) {
      const sets = changes.map((change) => `${change.column} = ?`);
      await db.run(
        `UPDATE users SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`,
        [...changes.map((change) => change.before), now, rowId]
      );
    }
    result = { restored: true };
  });
  return result;
}
