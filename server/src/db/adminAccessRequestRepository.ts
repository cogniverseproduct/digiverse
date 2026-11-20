import { randomUUID } from 'node:crypto';
import { getDb } from './database.js';
import { isValidEmail, normalizeEmail } from '../utils/email.js';

export type AccessRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export interface AdminAccessRequest {
  id: string;
  name: string;
  email: string;
  reason?: string;
  status: AccessRequestStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  requestTokenHash?: string;
  setupTokenHash?: string;
  setupTokenExpiresAt?: string;
  accountCreatedAt?: string;
  createdUserId?: string;
}

function mapRow(row: any): AdminAccessRequest {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    reason: row.reason || undefined,
    status: row.status,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at || undefined,
    reviewedBy: row.reviewed_by || undefined,
    requestTokenHash: row.request_token_hash || undefined,
    setupTokenHash: row.setup_token_hash || undefined,
    setupTokenExpiresAt: row.setup_token_expires_at || undefined,
    accountCreatedAt: row.account_created_at || undefined,
    createdUserId: row.created_user_id || undefined
  };
}

export const adminAccessRequestRepository = {
  async create(
    name: string,
    email: string,
    requestTokenHash?: string,
    reason?: string
  ): Promise<AdminAccessRequest> {

    const db = await getDb();
    const id = randomUUID();
    const now = new Date().toISOString();
    const cleanEmail = normalizeEmail(email);
    if (!isValidEmail(cleanEmail)) {
      throw new Error('INVALID_EMAIL');
    }

    const existing = await db.get(`
      SELECT id
      FROM admin_access_requests
      WHERE lower(email) = ?
      AND status = 'PENDING'
    `, [cleanEmail]);

    if (existing) {
      throw new Error('PENDING_REQUEST_EXISTS');
    }

    await db.run(`
      INSERT INTO admin_access_requests (
        id,
        name,
        email,
        reason,
        status,
        created_at,
        request_token_hash
      )
      VALUES (?, ?, ?, ?, 'PENDING', ?, ?)
    `, [id,
      name.trim(),
      cleanEmail,
      reason ? reason.trim() : null,
      now,
      requestTokenHash ?? null]);

    return {
      id,
      name: name.trim(),
      email: cleanEmail,
      reason: reason ? reason.trim() : undefined,
      status: 'PENDING',
      createdAt: now,
      requestTokenHash: requestTokenHash ?? undefined
    };
  },

  async list(status?: AccessRequestStatus): Promise<AdminAccessRequest[]> {

    const db = await getDb();

    const rows = status
      ? await db.all(`
          SELECT *
          FROM admin_access_requests
          WHERE status = ?
          ORDER BY created_at DESC
        `, [status])
      : await db.all(`
          SELECT *
          FROM admin_access_requests
          ORDER BY created_at DESC
        `);

    return (rows as any[]).map(mapRow);
  },

  async getById(id: string): Promise<AdminAccessRequest | null> {

    const db = await getDb();

    const row = await db.get(`
      SELECT *
      FROM admin_access_requests
      WHERE id = ?
    `, [id]) as any;

    return row ? mapRow(row) : null;
  },

  async getByTokenHash(tokenHash: string): Promise<AdminAccessRequest | null> {

    const db = await getDb();

    const row = await db.get(`
      SELECT *
      FROM admin_access_requests
      WHERE request_token_hash = ?
         OR setup_token_hash = ?
    `, [tokenHash, tokenHash]) as any;

    return row ? mapRow(row) : null;
  },

  async getBySetupTokenHash(setupTokenHash: string): Promise<AdminAccessRequest | null> {

    const db = await getDb();

    const row = await db.get(`
      SELECT *
      FROM admin_access_requests
      WHERE setup_token_hash = ?
    `, [setupTokenHash]) as any;

    return row ? mapRow(row) : null;
  },

  async review(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    reviewedBy: string
  ): Promise<boolean> {

    const db = await getDb();

    const result = await db.run(`
      UPDATE admin_access_requests
      SET
        status = ?,
        reviewed_at = ?,
        reviewed_by = ?
      WHERE id = ?
      AND status = 'PENDING'
    `, [status,
      new Date().toISOString(),
      reviewedBy,
      id]);

    return result.changes > 0;
  },

  async approveWithSetupToken(
    id: string,
    setupTokenHash: string,
    expiresAt: string,
    reviewedBy: string
  ): Promise<boolean> {

    const db = await getDb();

    const result = await db.run(`
      UPDATE admin_access_requests
      SET
        status = 'APPROVED',
        setup_token_hash = ?,
        setup_token_expires_at = ?,
        reviewed_at = ?,
        reviewed_by = ?
      WHERE id = ?
      AND status = 'PENDING'
    `, [setupTokenHash,
      expiresAt,
      new Date().toISOString(),
      reviewedBy,
      id]);

    return result.changes > 0;
  },

  async markAccountCreated(
    id: string,
    userId: string
  ): Promise<boolean> {

    const db = await getDb();

    const result = await db.run(`
      UPDATE admin_access_requests
      SET
        account_created_at = ?,
        created_user_id = ?
      WHERE id = ?
      AND status = 'APPROVED'
      AND account_created_at IS NULL
    `, [new Date().toISOString(),
      userId,
      id]);

    return result.changes > 0;
  }
};
