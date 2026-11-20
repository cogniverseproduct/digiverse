import { randomUUID } from 'node:crypto';
import { getDb } from './database.js';
import type { AdminPasswordReset, PasswordResetStatus } from '../types/index.js';

function mapRow(row: any): AdminPasswordReset {
  return {
    id: row.id,
    adminId: row.admin_id,
    adminEmail: row.admin_email,
    adminUsername: row.admin_username,
    reason: row.reason || undefined,
    status: row.status,
    resetTokenHash: row.reset_token_hash || undefined,
    expiresAt: row.expires_at || undefined,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at || undefined,
    reviewedBy: row.reviewed_by || undefined,
    completedAt: row.completed_at || undefined
  };
}

export const passwordResetRepository = {
  async create(
    adminId: string,
    adminEmail: string,
    adminUsername: string,
    reason?: string
  ): Promise<AdminPasswordReset> {

    const db = await getDb();
    const id = randomUUID();
    const now = new Date().toISOString();

    const pending = await db.get(`
      SELECT id FROM admin_password_resets
      WHERE admin_id = ? AND status = 'PENDING'
    `, [adminId]);

    if (pending) {
      throw new Error('PENDING_RESET_EXISTS');
    }

    await db.run(`
      INSERT INTO admin_password_resets (
        id,
        admin_id,
        admin_email,
        admin_username,
        reason,
        status,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, 'PENDING', ?)
    `, [id,
      adminId,
      adminEmail.trim().toLowerCase(),
      adminUsername.trim().toLowerCase(),
      reason ? reason.trim() : null,
      now]);

    return {
      id,
      adminId,
      adminEmail: adminEmail.trim().toLowerCase(),
      adminUsername: adminUsername.trim().toLowerCase(),
      reason: reason ? reason.trim() : undefined,
      status: 'PENDING',
      createdAt: now
    };
  },

  async hasPendingRequest(adminId: string): Promise<boolean> {

    const db = await getDb();
    const row = await db.get(`
      SELECT id FROM admin_password_resets
      WHERE admin_id = ? AND status = 'PENDING'
    `, [adminId]);

    return Boolean(row);
  },

  async list(status?: PasswordResetStatus): Promise<AdminPasswordReset[]> {

    const db = await getDb();

    const rows = status
      ? await db.all(`
          SELECT * FROM admin_password_resets
          WHERE status = ?
          ORDER BY created_at DESC
        `, [status])
      : await db.all(`
          SELECT * FROM admin_password_resets
          ORDER BY created_at DESC
        `);

    return (rows as any[]).map(mapRow);
  },

  async getById(id: string): Promise<AdminPasswordReset | null> {

    const db = await getDb();
    const row = await db.get(`
      SELECT * FROM admin_password_resets
      WHERE id = ?
    `, [id]) as any;

    return row ? mapRow(row) : null;
  },

  async getByTokenHash(tokenHash: string): Promise<AdminPasswordReset | null> {

    const db = await getDb();
    const row = await db.get(`
      SELECT * FROM admin_password_resets
      WHERE reset_token_hash = ?
    `, [tokenHash]) as any;

    return row ? mapRow(row) : null;
  },

  async approve(
    id: string,
    resetTokenHash: string,
    expiresAt: string,
    reviewedBy: string
  ): Promise<boolean> {

    const db = await getDb();
    const result = await db.run(`
      UPDATE admin_password_resets
      SET
        status = 'APPROVED',
        reset_token_hash = ?,
        expires_at = ?,
        reviewed_at = ?,
        reviewed_by = ?
      WHERE id = ? AND status = 'PENDING'
    `, [resetTokenHash,
      expiresAt,
      new Date().toISOString(),
      reviewedBy,
      id]);

    return result.changes > 0;
  },

  async reject(id: string, reviewedBy: string): Promise<boolean> {

    const db = await getDb();
    const result = await db.run(`
      UPDATE admin_password_resets
      SET
        status = 'REJECTED',
        reviewed_at = ?,
        reviewed_by = ?
      WHERE id = ? AND status = 'PENDING'
    `, [new Date().toISOString(),
      reviewedBy,
      id]);

    return result.changes > 0;
  },

  async markCompleted(id: string): Promise<boolean> {

    const db = await getDb();
    const result = await db.run(`
      UPDATE admin_password_resets
      SET
        status = 'COMPLETED',
        completed_at = ?
      WHERE id = ? AND status = 'APPROVED'
    `, [new Date().toISOString(),
      id]);

    return result.changes > 0;
  }
};
