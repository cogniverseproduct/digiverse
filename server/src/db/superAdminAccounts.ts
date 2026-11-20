/**
 * Super Admin account management: create, edit, deactivate, revoke and transfer ownership.
 *
 * Every rule that protects the platform lives here, inside transactions, so the HTTP
 * layer cannot bypass it:
 *   - only a usable Super Admin acts (the caller passes the authenticated user, never a client-supplied role);
 *   - every mutation needs the acting Super Admin's current password (fresh re-authentication, rate limited);
 *   - the last usable Super Admin can never be deactivated or revoked;
 *   - the Product Owner (one Super Admin) is protected from peers and can only change through an
 *     ownership transfer that the new owner accepts while signed in;
 *   - existing user ids, password hashes (unless explicitly changed), audit history and project links are never touched.
 */

import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { getDb } from './database.js';
import type { Database } from './database.js';
import { backfillPlatformOwner } from './schema.js';
import { isValidEmail, normalizeEmail } from '../utils/email.js';
import { isRetiredPlatformEmail } from '../config.js';
import type { User } from '../types/index.js';

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_BYTES = 72; // bcrypt ignores everything past 72 bytes
export const TRANSFER_PHRASE = 'TRANSFER OWNERSHIP';
export const REVOKE_PHRASE = 'REVOKE SUPER ADMIN';
export const TRANSFER_TTL_MS = 48 * 60 * 60 * 1000;

/** Arbitrary constant: serializes every Super Admin mutation on Postgres (SQLite already has one writer). */
const SUPER_ADMIN_LOCK = 7243002;

export class AccountError extends Error {
  constructor(public readonly status: number, message: string, public readonly code?: string) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Re-authentication (fresh password confirmation) with attempt limiting
// ---------------------------------------------------------------------------

const REAUTH_LIMIT = 5;
const REAUTH_WINDOW_MS = 15 * 60 * 1000;
const reauthFailures = new Map<string, { count: number; first: number }>();

export function resetReauthLimiterForTests(): void {
  reauthFailures.clear();
}

/** Confirms the acting Super Admin's current password. Throws 401 (wrong) or 429 (too many wrong). */
export async function verifyActorPassword(actorId: string, password: unknown, now = Date.now()): Promise<void> {
  const entry = reauthFailures.get(actorId);
  if (entry && now - entry.first <= REAUTH_WINDOW_MS && entry.count >= REAUTH_LIMIT) {
    throw new AccountError(429, 'Too many incorrect password confirmations. Try again in 15 minutes.', 'REAUTH_LOCKED');
  }

  if (typeof password !== 'string' || !password) {
    throw new AccountError(400, 'Your current password is required to confirm this action.', 'REAUTH_REQUIRED');
  }

  const db = await getDb();
  const row = await db.get<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = ?', [actorId]);
  const ok = Boolean(row?.password_hash) && (await bcrypt.compare(password, row!.password_hash));

  if (!ok) {
    if (!entry || now - entry.first > REAUTH_WINDOW_MS) {
      reauthFailures.set(actorId, { count: 1, first: now });
    } else {
      entry.count += 1;
    }
    throw new AccountError(401, 'Your current password is incorrect. Action not performed.', 'REAUTH_FAILED');
  }

  reauthFailures.delete(actorId);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Row = Record<string, any>;

export interface SuperAdminView {
  id: string;
  name: string;
  username: string | null;
  email: string;
  accountStatus: string;
  isActive: boolean;
  isOwner: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  disabledReason: string | null;
  mustChangePassword: boolean;
}

export interface TransferView {
  id: string;
  status: string;
  targetUserId: string;
  targetName: string;
  targetEmail: string;
  currentOwnerId: string;
  currentOwnerEmail: string;
  formerOwnerAccess: 'KEEP_SUPER_ADMIN' | 'DEMOTE_TO_ADMIN';
  expiresAt: string;
  createdAt: string;
}

const isSuper = (row: Row) => String(row.role).toUpperCase() === 'SUPER_ADMIN';
const statusOf = (row: Row): string => row.account_status || (Number(row.is_active ?? 1) === 1 ? 'ACTIVE' : 'DISABLED');
const isUsable = (row: Row) =>
  isSuper(row) && statusOf(row) === 'ACTIVE' && Number(row.is_active ?? 1) === 1 && Boolean(row.password_hash);

function view(row: Row): SuperAdminView {
  return {
    id: row.id,
    name: row.name,
    username: row.username ?? null,
    email: row.email ?? '',
    accountStatus: statusOf(row),
    isActive: statusOf(row) === 'ACTIVE' && Number(row.is_active ?? 1) === 1,
    isOwner: Number(row.is_platform_owner ?? 0) === 1 && isSuper(row),
    lastLoginAt: row.last_login_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
    disabledReason: row.disabled_reason ?? null,
    mustChangePassword: Number(row.must_change_password ?? 0) === 1
  };
}

function transferView(row: Row): TransferView {
  return {
    id: row.id,
    status: row.status,
    targetUserId: row.target_user_id,
    targetName: row.target_name,
    targetEmail: row.target_email,
    currentOwnerId: row.current_owner_id,
    currentOwnerEmail: row.current_owner_email,
    formerOwnerAccess: row.former_owner_access || 'KEEP_SUPER_ADMIN',
    expiresAt: row.expires_at,
    createdAt: row.created_at
  };
}

async function lockAndHeal(db: Database): Promise<void> {
  if (db.dialect === 'postgres') {
    await db.get('SELECT pg_advisory_xact_lock(?)', [SUPER_ADMIN_LOCK]);
  }
  // If a manual database edit removed the owner flag, restore it before any rule depends on it.
  await backfillPlatformOwner(db);
}

async function usableSuperAdminsExcluding(db: Database, excludeId: string): Promise<number> {
  const row = await db.get<{ n: number }>(
    `SELECT COUNT(*) AS n FROM users
     WHERE upper(role) = 'SUPER_ADMIN' AND id <> ?
       AND COALESCE(account_status, 'ACTIVE') = 'ACTIVE' AND COALESCE(is_active, 1) = 1
       AND password_hash IS NOT NULL AND password_hash <> ''`,
    [excludeId]
  );
  return Number(row?.n ?? 0);
}

function validatePassword(password: unknown, confirm: unknown): string {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new AccountError(400, `Password must contain at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    throw new AccountError(400, `Password must be at most ${MAX_PASSWORD_BYTES} bytes (the hashing limit).`);
  }
  if (password !== confirm) {
    throw new AccountError(400, 'Password and confirmation do not match.');
  }
  return password;
}

function validateName(name: unknown): string {
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    throw new AccountError(400, 'Full name must be between 2 and 100 characters.');
  }
  return name.trim();
}

function validateEmailAddress(email: unknown): string {
  // Syntax only: any provider or domain is accepted. Authority never depends on the domain.
  const clean = typeof email === 'string' ? normalizeEmail(email) : '';
  if (!isValidEmail(clean)) {
    throw new AccountError(400, 'Please enter a valid email address.');
  }
  if (isRetiredPlatformEmail(clean)) {
    throw new AccountError(400, 'That address is a retired DigiVerse identity and cannot be used.');
  }
  return clean;
}

function validateUsername(username: unknown): string | null {
  if (username === undefined || username === null || username === '') return null;
  if (typeof username !== 'string' || !/^[a-zA-Z0-9_-]{3,32}$/.test(username.trim())) {
    throw new AccountError(400, 'Username must be 3-32 characters: letters, numbers, underscores and hyphens.');
  }
  return username.trim().toLowerCase();
}

async function assertIdentityFree(db: Database, email: string | null, username: string | null, exceptId?: string): Promise<void> {
  if (email) {
    const holder = await db.get<Row>('SELECT id FROM users WHERE lower(email) = ? AND id <> ?', [email, exceptId ?? '']);
    if (holder) throw new AccountError(409, 'An account with this email already exists. Existing accounts are never overwritten or silently promoted.', 'EMAIL_TAKEN');
  }
  if (username) {
    const holder = await db.get<Row>('SELECT id FROM users WHERE lower(username) = ? AND id <> ?', [username, exceptId ?? '']);
    if (holder) throw new AccountError(409, 'This username is already taken.', 'USERNAME_TAKEN');
  }
}

async function loadSuperAdmin(db: Database, id: unknown): Promise<Row> {
  const row = typeof id === 'string' && id ? await db.get<Row>('SELECT * FROM users WHERE id = ?', [id]) : undefined;
  if (!row || !isSuper(row)) {
    throw new AccountError(404, 'Super Admin account not found.');
  }
  return row;
}

/** Only the Product Owner may change the owner's account; peers never can. */
function assertNotProtectedOwner(actor: User, target: Row, what: string): void {
  if (Number(target.is_platform_owner ?? 0) === 1 && target.id !== actor.id) {
    throw new AccountError(403, `Only the Product Owner can ${what} on the owner account.`, 'OWNER_PROTECTED');
  }
}

async function actorRow(db: Database, actor: User): Promise<Row> {
  const row = await db.get<Row>('SELECT * FROM users WHERE id = ?', [actor.id]);
  if (!row || !isUsable(row)) {
    throw new AccountError(403, 'Your Super Admin access is no longer active.');
  }
  return row;
}

async function cancelPendingTransfersFor(db: Database, userId: string, now: string): Promise<number> {
  const result = await db.run(
    `UPDATE ownership_transfers SET status = 'CANCELLED', updated_at = ?
     WHERE status = 'PENDING' AND target_user_id = ?`,
    [now, userId]
  );
  return result.changes;
}

async function expireStaleTransfers(db: Database, now: string): Promise<void> {
  await db.run(
    `UPDATE ownership_transfers SET status = 'EXPIRED', updated_at = ?
     WHERE status = 'PENDING' AND expires_at < ?`,
    [now, now]
  );
}

function deriveUsernameBase(row: Row): string {
  const source = String(row.username || String(row.email || 'admin').split('@')[0] || 'admin');
  const cleaned = source.toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 24);
  return cleaned.length >= 3 ? cleaned : `${cleaned}_admin`.slice(0, 24);
}

/** Admin accounts need a username; keep the existing one or derive a unique one. */
async function ensureUsername(db: Database, row: Row): Promise<string> {
  if (row.username) return row.username;
  const base = deriveUsernameBase(row);
  let candidate = base;
  for (let i = 2; await db.get('SELECT id FROM users WHERE lower(username) = ?', [candidate]); i += 1) {
    candidate = `${base}_${i}`;
  }
  return candidate;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function listSuperAdmins(actor: User): Promise<{
  accounts: Array<SuperAdminView & { isSelf: boolean }>;
  summary: { total: number; active: number; ownerId: string | null };
}> {
  const db = await getDb();
  const rows = await db.all<Row>("SELECT * FROM users WHERE upper(role) = 'SUPER_ADMIN' ORDER BY created_at ASC");
  const accounts = rows.map((row) => ({ ...view(row), isSelf: row.id === actor.id }));
  return {
    accounts,
    summary: {
      total: accounts.length,
      active: rows.filter(isUsable).length,
      ownerId: accounts.find((a) => a.isOwner)?.id ?? null
    }
  };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export interface CreateSuperAdminInput {
  name: unknown;
  email: unknown;
  username?: unknown;
  password: unknown;
  confirmPassword: unknown;
  status?: unknown;
}

async function insertSuperAdmin(
  db: Database,
  input: CreateSuperAdminInput,
  hash: string,
  status: 'ACTIVE' | 'DISABLED',
  now: string,
  mustChangePassword = false
): Promise<Row> {
  const email = validateEmailAddress(input.email);
  const username = validateUsername(input.username);
  await assertIdentityFree(db, email, username);

  const id = randomUUID();
  const active = status === 'ACTIVE';
  await db.run(
    `INSERT INTO users (id, email, username, password_hash, name, role, is_active, account_status,
                        disabled_reason, disabled_at, is_platform_owner, must_change_password, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'SUPER_ADMIN', ?, ?, ?, ?, 0, ?, ?, ?)`,
    [id, email, username, hash, validateName(input.name), active ? 1 : 0, status,
      active ? null : 'Created as inactive', active ? null : now, mustChangePassword ? 1 : 0, now, now]
  );
  return (await db.get<Row>('SELECT * FROM users WHERE id = ?', [id]))!;
}

function parseCreateStatus(status: unknown): 'ACTIVE' | 'DISABLED' {
  if (status === undefined || status === null || status === '' || status === 'ACTIVE') return 'ACTIVE';
  if (status === 'DISABLED' || status === 'INACTIVE') return 'DISABLED';
  throw new AccountError(400, 'Account status must be ACTIVE or DISABLED.');
}

export async function createSuperAdmin(actor: User, input: CreateSuperAdminInput & { currentPassword: unknown }): Promise<SuperAdminView> {
  // Validate and hash before the transaction so the lock is held briefly.
  validateName(input.name);
  validateEmailAddress(input.email);
  validateUsername(input.username);
  const status = parseCreateStatus(input.status);
  const password = validatePassword(input.password, input.confirmPassword);
  await verifyActorPassword(actor.id, input.currentPassword);
  const hash = await bcrypt.hash(password, 12);

  const db = await getDb();
  return db.transaction(async () => {
    await lockAndHeal(db);
    await actorRow(db, actor);
    // The creating Super Admin chose this password, so the new person must replace it at first sign-in.
    const row = await insertSuperAdmin(db, input, hash, status, new Date().toISOString(), true);
    return view(row);
  });
}

// ---------------------------------------------------------------------------
// Edit details / password / status / revoke
// ---------------------------------------------------------------------------

export async function updateSuperAdminDetails(
  actor: User,
  id: string,
  input: { name?: unknown; email?: unknown; username?: unknown; currentPassword: unknown }
): Promise<{ account: SuperAdminView; changes: Record<string, { from: string | null; to: string | null }> }> {
  if (input.name === undefined && input.email === undefined && input.username === undefined) {
    throw new AccountError(400, 'Nothing to change: provide a name, email or username.');
  }
  const name = input.name !== undefined ? validateName(input.name) : undefined;
  const email = input.email !== undefined ? validateEmailAddress(input.email) : undefined;
  const username = input.username !== undefined ? validateUsername(input.username) : undefined;
  await verifyActorPassword(actor.id, input.currentPassword);

  const db = await getDb();
  return db.transaction(async () => {
    await lockAndHeal(db);
    await actorRow(db, actor);
    const target = await loadSuperAdmin(db, id);
    assertNotProtectedOwner(actor, target, 'edit details');

    await assertIdentityFree(db, email && email !== (target.email || '').toLowerCase() ? email : null,
      username && username !== (target.username || '').toLowerCase() ? username : null, target.id);

    const changes: Record<string, { from: string | null; to: string | null }> = {};
    const next = {
      name: name ?? target.name,
      email: email ?? target.email,
      username: username === undefined ? target.username : username
    };
    if (next.name !== target.name) changes.name = { from: target.name, to: next.name };
    if ((next.email || '').toLowerCase() !== (target.email || '').toLowerCase()) changes.email = { from: target.email, to: next.email };
    if ((next.username ?? null) !== (target.username ?? null)) changes.username = { from: target.username ?? null, to: next.username ?? null };
    if (Object.keys(changes).length === 0) {
      throw new AccountError(400, 'No changes: the submitted details match the current ones.');
    }

    // Only these three columns are written: id, password hash, role, status and history stay exactly as they were.
    await db.run('UPDATE users SET name = ?, email = ?, username = ?, updated_at = ? WHERE id = ?',
      [next.name, next.email, next.username ?? null, new Date().toISOString(), target.id]);
    return { account: view((await db.get<Row>('SELECT * FROM users WHERE id = ?', [target.id]))!), changes };
  });
}

export async function setSuperAdminPassword(
  actor: User,
  id: string,
  input: { newPassword: unknown; confirmPassword: unknown; currentPassword: unknown }
): Promise<{ account: SuperAdminView; self: boolean; tokenVersion: number }> {
  const password = validatePassword(input.newPassword, input.confirmPassword);
  await verifyActorPassword(actor.id, input.currentPassword);
  const hash = await bcrypt.hash(password, 12);

  const db = await getDb();
  return db.transaction(async () => {
    await lockAndHeal(db);
    await actorRow(db, actor);
    const target = await loadSuperAdmin(db, id);
    assertNotProtectedOwner(actor, target, 'change the password');

    // token_version + 1 signs the account out everywhere (the caller re-issues a token for their own change).
    // Choosing your own password satisfies a pending forced change; a peer resetting it does not alter the flag.
    const own = target.id === actor.id;
    await db.run(
      `UPDATE users SET password_hash = ?, token_version = token_version + 1,
         must_change_password = CASE WHEN ? = 1 THEN 0 ELSE must_change_password END, updated_at = ? WHERE id = ?`,
      [hash, own ? 1 : 0, new Date().toISOString(), target.id]);
    const row = (await db.get<Row>('SELECT * FROM users WHERE id = ?', [target.id]))!;
    return { account: view(row), self: target.id === actor.id, tokenVersion: Number(row.token_version) };
  });
}

export async function setSuperAdminStatus(
  actor: User,
  id: string,
  input: { status: unknown; reason?: unknown; currentPassword: unknown }
): Promise<{ account: SuperAdminView; cancelledTransfers: number }> {
  if (input.status !== 'ACTIVE' && input.status !== 'DISABLED') {
    throw new AccountError(400, 'Status must be ACTIVE or DISABLED.');
  }
  const reason = typeof input.reason === 'string' && input.reason.trim() ? input.reason.trim().slice(0, 300) : null;
  await verifyActorPassword(actor.id, input.currentPassword);

  const db = await getDb();
  return db.transaction(async () => {
    await lockAndHeal(db);
    await actorRow(db, actor);
    const target = await loadSuperAdmin(db, id);
    const now = new Date().toISOString();

    if (input.status === 'DISABLED') {
      if (target.id === actor.id) {
        throw new AccountError(409, 'You cannot deactivate your own account. Ask another Super Admin to do it.', 'SELF_DEACTIVATE');
      }
      if (Number(target.is_platform_owner ?? 0) === 1) {
        throw new AccountError(403, 'The Product Owner account cannot be deactivated. Transfer ownership first.', 'OWNER_PROTECTED');
      }
      if (isUsable(target) && (await usableSuperAdminsExcluding(db, target.id)) === 0) {
        throw new AccountError(409, 'This is the last active Super Admin and cannot be deactivated.', 'LAST_SUPER_ADMIN');
      }
      await db.run(
        `UPDATE users SET account_status = 'DISABLED', is_active = 0, disabled_reason = ?, disabled_at = ?,
                token_version = token_version + 1, updated_at = ? WHERE id = ?`,
        [reason, now, now, target.id]
      );
      const cancelled = await cancelPendingTransfersFor(db, target.id, now);
      return { account: view((await db.get<Row>('SELECT * FROM users WHERE id = ?', [target.id]))!), cancelledTransfers: cancelled };
    }

    if (statusOf(target) === 'REMOVED') {
      throw new AccountError(409, 'A removed account cannot be reactivated here.');
    }
    await db.run(
      `UPDATE users SET account_status = 'ACTIVE', is_active = 1, disabled_reason = NULL, disabled_at = NULL, updated_at = ? WHERE id = ?`,
      [now, target.id]
    );
    return { account: view((await db.get<Row>('SELECT * FROM users WHERE id = ?', [target.id]))!), cancelledTransfers: 0 };
  });
}

/** Removes Super Admin privileges but keeps the person as an ordinary Admin (data and history are preserved). */
export async function revokeSuperAdminAccess(
  actor: User,
  id: string,
  input: { confirmationPhrase: unknown; currentPassword: unknown }
): Promise<{ account: { id: string; email: string; username: string; role: 'ADMIN' }; cancelledTransfers: number }> {
  if (input.confirmationPhrase !== REVOKE_PHRASE) {
    throw new AccountError(400, `Type "${REVOKE_PHRASE}" exactly to confirm.`, 'CONFIRMATION_REQUIRED');
  }
  await verifyActorPassword(actor.id, input.currentPassword);

  const db = await getDb();
  return db.transaction(async () => {
    await lockAndHeal(db);
    await actorRow(db, actor);
    const target = await loadSuperAdmin(db, id);
    const now = new Date().toISOString();

    if (target.id === actor.id) {
      throw new AccountError(409, 'You cannot revoke your own Super Admin access. Ask another Super Admin to do it.', 'SELF_REVOKE');
    }
    if (Number(target.is_platform_owner ?? 0) === 1) {
      throw new AccountError(403, 'The Product Owner cannot be revoked. Transfer ownership first.', 'OWNER_PROTECTED');
    }
    if (isUsable(target) && (await usableSuperAdminsExcluding(db, target.id)) === 0) {
      throw new AccountError(409, 'This is the last active Super Admin and cannot be revoked.', 'LAST_SUPER_ADMIN');
    }

    const username = await ensureUsername(db, target);
    await db.run(
      `UPDATE users SET role = 'ADMIN', username = ?, is_platform_owner = 0, token_version = token_version + 1, updated_at = ? WHERE id = ?`,
      [username, now, target.id]
    );
    const cancelled = await cancelPendingTransfersFor(db, target.id, now);
    return { account: { id: target.id, email: target.email, username, role: 'ADMIN' as const }, cancelledTransfers: cancelled };
  });
}

// ---------------------------------------------------------------------------
// Ownership transfer
// ---------------------------------------------------------------------------

export async function getTransferState(actor: User): Promise<{
  transfer: TransferView | null;
  viewerRole: 'OWNER' | 'TARGET' | 'OBSERVER' | null;
}> {
  const db = await getDb();
  await expireStaleTransfers(db, new Date().toISOString());
  const row = await db.get<Row>(
    "SELECT * FROM ownership_transfers WHERE status = 'PENDING' AND target_user_id IS NOT NULL ORDER BY created_at DESC LIMIT 1"
  );
  if (!row) return { transfer: null, viewerRole: null };
  return {
    transfer: transferView(row),
    viewerRole: row.current_owner_id === actor.id ? 'OWNER' : row.target_user_id === actor.id ? 'TARGET' : 'OBSERVER'
  };
}

export interface InitiateTransferInput {
  currentPassword: unknown;
  confirmationPhrase: unknown;
  targetUserId?: unknown;
  newAccount?: CreateSuperAdminInput;
  formerOwnerAccess?: unknown;
}

export async function initiateTransfer(
  actor: User,
  input: InitiateTransferInput
): Promise<{ transfer: TransferView; createdAccount: SuperAdminView | null }> {
  if (input.confirmationPhrase !== TRANSFER_PHRASE) {
    throw new AccountError(400, `Type "${TRANSFER_PHRASE}" exactly to confirm.`, 'CONFIRMATION_REQUIRED');
  }
  const hasTarget = typeof input.targetUserId === 'string' && input.targetUserId.length > 0;
  if (hasTarget === Boolean(input.newAccount)) {
    throw new AccountError(400, 'Choose either an existing Super Admin or provide details for a new account, not both.');
  }
  const access = input.formerOwnerAccess === undefined ? 'KEEP_SUPER_ADMIN' : input.formerOwnerAccess;
  if (access !== 'KEEP_SUPER_ADMIN' && access !== 'DEMOTE_TO_ADMIN') {
    throw new AccountError(400, 'formerOwnerAccess must be KEEP_SUPER_ADMIN or DEMOTE_TO_ADMIN.');
  }

  let newHash: string | null = null;
  if (input.newAccount) {
    validateName(input.newAccount.name);
    validateEmailAddress(input.newAccount.email);
    validateUsername(input.newAccount.username);
    newHash = await bcrypt.hash(validatePassword(input.newAccount.password, input.newAccount.confirmPassword), 12);
  }
  await verifyActorPassword(actor.id, input.currentPassword);

  const db = await getDb();
  return db.transaction(async () => {
    await lockAndHeal(db);
    const owner = await actorRow(db, actor);
    if (Number(owner.is_platform_owner ?? 0) !== 1) {
      throw new AccountError(403, 'Only the Product Owner can transfer ownership.', 'NOT_OWNER');
    }
    const now = new Date().toISOString();
    await expireStaleTransfers(db, now);
    const pending = await db.get<Row>("SELECT id FROM ownership_transfers WHERE status = 'PENDING' AND target_user_id IS NOT NULL");
    if (pending) {
      throw new AccountError(409, 'An ownership transfer is already pending. Cancel it or wait for it to be accepted or expire.', 'TRANSFER_PENDING');
    }

    let target: Row;
    let createdAccount: SuperAdminView | null = null;
    if (input.newAccount) {
      // The owner chose this password, so the new owner must replace it at first sign-in.
      target = await insertSuperAdmin(db, input.newAccount, newHash!, 'ACTIVE', now, true);
      createdAccount = view(target);
    } else {
      target = await loadSuperAdmin(db, input.targetUserId);
      if (target.id === owner.id) throw new AccountError(400, 'You already own the platform.');
      if (!isUsable(target)) throw new AccountError(409, 'The selected Super Admin account is not active.');
    }

    const id = `trans_${randomUUID()}`;
    await db.run(
      `INSERT INTO ownership_transfers (id, current_owner_id, current_owner_email, target_name, target_email, transfer_token,
         status, target_user_id, former_owner_access, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?)`,
      [id, owner.id, owner.email, target.name, target.email, `ot_${randomBytes(24).toString('hex')}`,
        target.id, access, new Date(Date.now() + TRANSFER_TTL_MS).toISOString(), now, now]
    );
    const row = (await db.get<Row>('SELECT * FROM ownership_transfers WHERE id = ?', [id]))!;
    return { transfer: transferView(row), createdAccount };
  });
}

export async function acceptTransfer(
  actor: User,
  input: { transferId: unknown; currentPassword: unknown }
): Promise<{ previousOwnerId: string; newOwnerId: string; formerOwnerAccess: string; transferId: string }> {
  const transferId = input.transferId;
  if (typeof transferId !== 'string' || !transferId) {
    throw new AccountError(400, 'Transfer ID is required.');
  }
  // The target proves who they are right now, with a fresh password check.
  await verifyActorPassword(actor.id, input.currentPassword);

  const db = await getDb();
  return db.transaction(async () => {
    await lockAndHeal(db);
    const me = await actorRow(db, actor);
    const now = new Date().toISOString();
    const transfer = await db.get<Row>('SELECT * FROM ownership_transfers WHERE id = ?', [transferId]);

    if (!transfer || !transfer.target_user_id) throw new AccountError(404, 'Transfer not found.');
    if (transfer.target_user_id !== me.id) {
      throw new AccountError(403, 'This transfer is addressed to a different Super Admin.', 'NOT_TARGET');
    }
    if (transfer.status !== 'PENDING') {
      throw new AccountError(409, `This transfer is no longer pending (${String(transfer.status).toLowerCase()}).`);
    }
    if (transfer.expires_at < now) {
      await db.run("UPDATE ownership_transfers SET status = 'EXPIRED', updated_at = ? WHERE id = ?", [now, transfer.id]);
      throw new AccountError(410, 'This transfer has expired. Ask the owner to start a new one.');
    }

    const owner = await db.get<Row>('SELECT * FROM users WHERE id = ?', [transfer.current_owner_id]);
    if (!owner || !isUsable(owner) || Number(owner.is_platform_owner ?? 0) !== 1) {
      await db.run("UPDATE ownership_transfers SET status = 'CANCELLED', updated_at = ? WHERE id = ?", [now, transfer.id]);
      throw new AccountError(409, 'The owner who started this transfer no longer owns the platform. The transfer was cancelled.');
    }

    await db.run('UPDATE users SET is_platform_owner = 0, updated_at = ? WHERE id = ?', [now, owner.id]);
    if (transfer.former_owner_access === 'DEMOTE_TO_ADMIN') {
      const username = await ensureUsername(db, owner);
      await db.run(
        "UPDATE users SET role = 'ADMIN', username = ?, token_version = token_version + 1 WHERE id = ?",
        [username, owner.id]
      );
    }
    await db.run('UPDATE users SET is_platform_owner = 1, updated_at = ? WHERE id = ?', [now, me.id]);
    await db.run(
      `UPDATE ownership_transfers SET status = 'CONFIRMED', accepted_at = ?, confirmed_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, now, transfer.id]
    );

    return {
      previousOwnerId: owner.id,
      newOwnerId: me.id,
      formerOwnerAccess: transfer.former_owner_access || 'KEEP_SUPER_ADMIN',
      transferId: transfer.id
    };
  });
}

/** The owner cancels; the invited Super Admin may decline. Safe actions: no password needed. */
export async function cancelTransfer(actor: User): Promise<{ transferId: string; by: 'OWNER' | 'TARGET' }> {
  const db = await getDb();
  return db.transaction(async () => {
    await lockAndHeal(db);
    const now = new Date().toISOString();
    await expireStaleTransfers(db, now);
    const row = await db.get<Row>("SELECT * FROM ownership_transfers WHERE status = 'PENDING' AND target_user_id IS NOT NULL");
    if (!row) throw new AccountError(404, 'There is no pending ownership transfer.');

    const by = row.current_owner_id === actor.id ? 'OWNER' : row.target_user_id === actor.id ? 'TARGET' : null;
    if (!by) throw new AccountError(403, 'Only the owner or the invited Super Admin can cancel this transfer.');

    await db.run("UPDATE ownership_transfers SET status = 'CANCELLED', updated_at = ? WHERE id = ?", [now, row.id]);
    return { transferId: row.id, by };
  });
}
