/**
 * /api/super-admins: Super Admin account management.
 *
 * EVERY route requires a valid session whose role is read from the database (never from the
 * client) and is SUPER_ADMIN; impersonated Admin-view sessions are refused by requireRole.
 * Mutations additionally need the acting Super Admin's current password (fresh re-authentication).
 * Business rules live in db/superAdminAccounts.ts; this file only maps HTTP and writes the audit trail.
 */
import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireRole, recordAudit, AuthenticatedRequest } from '../middleware/auth.js';
import {
  AccountError,
  listSuperAdmins,
  createSuperAdmin,
  updateSuperAdminDetails,
  setSuperAdminPassword,
  setSuperAdminStatus,
  revokeSuperAdminAccess,
  getTransferState,
  initiateTransfer,
  acceptTransfer,
  cancelTransfer
} from '../db/superAdminAccounts.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRole('SUPER_ADMIN'));

function fail(res: Response, error: unknown, label: string, req?: AuthenticatedRequest): void {
  if (error instanceof AccountError) {
    if (error.code === 'REAUTH_FAILED' && req) {
      void recordAudit(req, 'SUPER_ADMIN_REAUTH_FAILED', 'users', req.user?.id, { route: req.path });
    }
    res.status(error.status).json({ error: error.message, code: error.code });
    return;
  }
  console.error(`[Super Admin ${label} Error]:`, error);
  res.status(500).json({ error: `Failed to ${label}.` });
}

const body = (req: AuthenticatedRequest): Record<string, any> => (req.body && typeof req.body === 'object' ? req.body : {});

router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [list, transfer] = await Promise.all([listSuperAdmins(req.user!), getTransferState(req.user!)]);
    res.json({
      ...list,
      transfer: transfer.transfer,
      transferRole: transfer.viewerRole,
      you: { id: req.user!.id, isOwner: Boolean(req.user!.isPlatformOwner) }
    });
  } catch (error) {
    fail(res, error, 'load Super Admin accounts');
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const b = body(req);
    const account = await createSuperAdmin(req.user!, {
      name: b.name, email: b.email, username: b.username,
      password: b.password, confirmPassword: b.confirmPassword,
      status: b.status, currentPassword: b.currentPassword
    });
    await recordAudit(req, 'SUPER_ADMIN_CREATED', 'users', account.id, {
      email: account.email, username: account.username, name: account.name, status: account.accountStatus
    });
    res.status(201).json({ message: 'Super Admin account created.', account });
  } catch (error) {
    fail(res, error, 'create the Super Admin account', req);
  }
});

router.patch('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const b = body(req);
    const { account, changes } = await updateSuperAdminDetails(req.user!, String(req.params.id), {
      name: b.name, email: b.email, username: b.username, currentPassword: b.currentPassword
    });
    await recordAudit(req, 'SUPER_ADMIN_DETAILS_UPDATED', 'users', account.id, { changes });
    res.json({ message: 'Super Admin details updated.', account });
  } catch (error) {
    fail(res, error, 'update the Super Admin account', req);
  }
});

router.post('/:id/password', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const b = body(req);
    const result = await setSuperAdminPassword(req.user!, String(req.params.id), {
      newPassword: b.newPassword, confirmPassword: b.confirmPassword, currentPassword: b.currentPassword
    });
    await recordAudit(req, 'SUPER_ADMIN_PASSWORD_CHANGED', 'users', result.account.id, {
      self: result.self, sessionsRevoked: true
    });

    // The new password revokes every existing session. Keep the person who just changed their own password signed in.
    let token: string | undefined;
    const secret = process.env.JWT_SECRET;
    if (result.self && secret && secret.trim().length >= 32) {
      token = jwt.sign({ id: result.account.id, version: result.tokenVersion }, secret, { algorithm: 'HS256', expiresIn: '12h' });
    }
    res.json({
      message: result.self
        ? 'Your password was changed. Your other sessions were signed out.'
        : 'Password changed. That Super Admin was signed out everywhere and must use the new password.',
      account: result.account,
      ...(token ? { token } : {})
    });
  } catch (error) {
    fail(res, error, 'change the password', req);
  }
});

router.post('/:id/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const b = body(req);
    const { account, cancelledTransfers } = await setSuperAdminStatus(req.user!, String(req.params.id), {
      status: b.status, reason: b.reason, currentPassword: b.currentPassword
    });
    await recordAudit(req, account.isActive ? 'SUPER_ADMIN_ACTIVATED' : 'SUPER_ADMIN_DEACTIVATED', 'users', account.id, {
      email: account.email, reason: b.reason || undefined, cancelledTransfers
    });
    res.json({
      message: account.isActive ? 'Super Admin account activated.' : 'Super Admin account deactivated and signed out everywhere.',
      account
    });
  } catch (error) {
    fail(res, error, 'change the account status', req);
  }
});

router.post('/:id/revoke', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const b = body(req);
    const { account, cancelledTransfers } = await revokeSuperAdminAccess(req.user!, String(req.params.id), {
      confirmationPhrase: b.confirmationPhrase, currentPassword: b.currentPassword
    });
    await recordAudit(req, 'SUPER_ADMIN_ACCESS_REVOKED', 'users', account.id, {
      email: account.email, newRole: 'ADMIN', cancelledTransfers
    });
    res.json({ message: 'Super Admin access revoked. The account remains an ordinary Admin.', account });
  } catch (error) {
    fail(res, error, 'revoke Super Admin access', req);
  }
});

// ---------------- Ownership transfer ----------------

router.post('/transfer', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const b = body(req);
    const { transfer, createdAccount } = await initiateTransfer(req.user!, {
      currentPassword: b.currentPassword,
      confirmationPhrase: b.confirmationPhrase,
      targetUserId: b.targetUserId,
      newAccount: b.newAccount && typeof b.newAccount === 'object' ? b.newAccount : undefined,
      formerOwnerAccess: b.formerOwnerAccess
    });
    if (createdAccount) {
      await recordAudit(req, 'SUPER_ADMIN_CREATED', 'users', createdAccount.id, {
        email: createdAccount.email, username: createdAccount.username, name: createdAccount.name,
        status: createdAccount.accountStatus, viaOwnershipTransfer: transfer.id
      });
    }
    await recordAudit(req, 'OWNERSHIP_TRANSFER_INITIATED', 'ownership_transfers', transfer.id, {
      targetUserId: transfer.targetUserId, targetEmail: transfer.targetEmail,
      formerOwnerAccess: transfer.formerOwnerAccess, expiresAt: transfer.expiresAt, newAccount: Boolean(createdAccount)
    });
    res.status(201).json({
      message: 'Ownership transfer started. It takes effect only when the new owner signs in and accepts it.',
      transfer
    });
  } catch (error) {
    fail(res, error, 'start the ownership transfer', req);
  }
});

router.post('/transfer/accept', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const b = body(req);
    const result = await acceptTransfer(req.user!, { transferId: b.transferId, currentPassword: b.currentPassword });
    await recordAudit(req, 'OWNERSHIP_TRANSFER_ACCEPTED', 'ownership_transfers', result.transferId, {
      previousOwnerId: result.previousOwnerId, newOwnerId: result.newOwnerId, formerOwnerAccess: result.formerOwnerAccess
    });
    res.json({
      message: 'You are now the Product Owner.',
      previousOwnerId: result.previousOwnerId,
      formerOwnerAccess: result.formerOwnerAccess
    });
  } catch (error) {
    fail(res, error, 'accept the ownership transfer', req);
  }
});

router.post('/transfer/cancel', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { transferId, by } = await cancelTransfer(req.user!);
    await recordAudit(req, by === 'OWNER' ? 'OWNERSHIP_TRANSFER_CANCELLED' : 'OWNERSHIP_TRANSFER_DECLINED', 'ownership_transfers', transferId, {});
    res.json({ message: by === 'OWNER' ? 'Ownership transfer cancelled.' : 'You declined the ownership transfer.' });
  } catch (error) {
    fail(res, error, 'cancel the ownership transfer');
  }
});

export default router;
