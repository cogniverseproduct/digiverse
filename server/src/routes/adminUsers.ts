import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  randomUUID,
  randomBytes,
  createHash
} from 'node:crypto';

import {
  authenticateToken,
  requireRole,
  recordAudit,
  AuthenticatedRequest
} from '../middleware/auth.js';

import { repository } from '../db/repository.js';
import { getDb } from '../db/database.js';
import { adminAccessRequestRepository } from '../db/adminAccessRequestRepository.js';
import { passwordResetRepository } from '../db/passwordResetRepository.js';
import { emailService } from '../services/emailService.js';
import { isValidEmail } from '../utils/email.js';

const router = Router();

/** Error that aborts a transaction and maps to an HTTP response. */
class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

function getJwtSecret(): string | null {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    return null;
  }
  return secret;
}

function sanitizeUser(user: any) {
  if (!user) return null;

  const {
    passwordHash,
    password,
    ...safeUser
  } = user;

  return safeUser;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// ----------------------------------------------------
// PUBLIC: ADMIN ACCESS REQUESTS
// ----------------------------------------------------

// Submit a new Admin access request
router.post('/access-requests', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, reason } = req.body ?? {};

    if (typeof name !== 'string' || typeof email !== 'string') {
      res.status(400).json({
        error: 'Name and email are required.'
      });
      return;
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanReason = typeof reason === 'string' && reason.trim() ? reason.trim().slice(0, 500) : undefined;

    if (cleanName.length < 2 || cleanName.length > 100) {
      res.status(400).json({
        error: 'Name must contain between 2 and 100 characters.'
      });
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      res.status(400).json({
        error: 'Please provide a valid email address.'
      });
      return;
    }

    const requestToken = randomBytes(32).toString('hex');
    const requestTokenHash = hashToken(requestToken);

    const accessRequest = await adminAccessRequestRepository.create(
      cleanName,
      cleanEmail,
      requestTokenHash,
      cleanReason
    );

    // Notify Super Admin asynchronously
    void emailService.notifySuperAdminNewAccessRequest(
      cleanName,
      cleanEmail,
      cleanReason
    );

    res.status(201).json({
      message: 'Admin access request submitted successfully. Awaiting Super Admin review.',
      request: {
        id: accessRequest.id,
        name: accessRequest.name,
        email: accessRequest.email,
        reason: accessRequest.reason,
        status: accessRequest.status,
        createdAt: accessRequest.createdAt
      },
      requestToken
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'PENDING_REQUEST_EXISTS'
    ) {
      res.status(409).json({
        error: 'A pending request already exists for this email address.'
      });
      return;
    }

    console.error('[Admin Access Request Error]:', error);

    res.status(500).json({
      error: 'Unable to submit Admin access request.'
    });
  }
});

// Check request status
router.post(
  '/access-requests/status',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { requestToken, setupToken } = req.body ?? {};
      const token = typeof setupToken === 'string' && setupToken ? setupToken : requestToken;

      if (
        typeof token !== 'string' ||
        !/^[a-f0-9]{64}$/i.test(token)
      ) {
        res.status(400).json({
          error: 'A valid request session token is required.'
        });
        return;
      }

      const request = await adminAccessRequestRepository.getByTokenHash(hashToken(token));

      if (!request) {
        res.status(404).json({
          error: 'Access request not found.'
        });
        return;
      }

      res.json({
        request: {
          id: request.id,
          name: request.name,
          email: request.email,
          status: request.status,
          createdAt: request.createdAt,
          reviewedAt: request.reviewedAt,
          accountCreated: Boolean(request.accountCreatedAt)
        }
      });
    } catch (error) {
      console.error('[Access Request Status Error]:', error);

      res.status(500).json({
        error: 'Unable to retrieve access request status.'
      });
    }
  }
);

// Create an Admin account after Super Admin approval (Applicant sets their own password)
router.post(
  '/access-requests/complete',
  async (req: Request, res: Response): Promise<void> => {

    try {
      const {
        requestToken,
        setupToken,
        name,
        username,
        password,
        confirmPassword
      } = req.body ?? {};

      const tokenToVerify = typeof setupToken === 'string' && setupToken.trim()
        ? setupToken.trim()
        : typeof requestToken === 'string' && requestToken.trim()
          ? requestToken.trim()
          : '';

      if (
        !tokenToVerify ||
        !/^[a-f0-9]{64}$/i.test(tokenToVerify)
      ) {
        res.status(400).json({
          error: 'A valid 64-character account setup token is required.'
        });
        return;
      }

      if (
        typeof username !== 'string' ||
        typeof password !== 'string' ||
        typeof confirmPassword !== 'string'
      ) {
        res.status(400).json({
          error: 'Username, password and confirmation are required.'
        });
        return;
      }

      const cleanUsername = username.trim().toLowerCase();

      if (!/^[a-z0-9._-]{3,30}$/.test(cleanUsername)) {
        res.status(400).json({
          error: 'Username must be 3–30 characters and use letters, numbers, dots, underscores or hyphens.'
        });
        return;
      }

      if (password.length < 12 || password.length > 128) {
        res.status(400).json({
          error: 'Password must contain between 12 and 128 characters.'
        });
        return;
      }

      if (password !== confirmPassword) {
        res.status(400).json({
          error: 'Password and Confirm Password do not match.'
        });
        return;
      }

      const tokenHash = hashToken(tokenToVerify);
      const db = await getDb();

      const createdUser = await db.transaction(async () => {

      const accessRequest = await adminAccessRequestRepository.getByTokenHash(tokenHash);

      if (!accessRequest) {
        throw new HttpError(404, 'Setup token is invalid or does not match any request.');
      }

      if (accessRequest.status !== 'APPROVED') {
        throw new HttpError(403, 'Your Admin access request has not been approved yet.');
      }

      if (accessRequest.accountCreatedAt) {
        throw new HttpError(409, 'An Admin account has already been created for this request. Setup links are single-use.');
      }

      // Check setup token expiration if set
      if (accessRequest.setupTokenExpiresAt) {
        const expiresAt = new Date(accessRequest.setupTokenExpiresAt).getTime();
        if (Date.now() > expiresAt) {
          throw new HttpError(410, 'This account setup link has expired. Please submit a new access request.');
        }
      }

      if (await repository.getUserByUsername(cleanUsername)) {
        throw new HttpError(409, 'This username is already taken. Please choose another username.');
      }

      const cleanName = typeof name === 'string' && name.trim().length >= 2
        ? name.trim()
        : accessRequest.name;

      const passwordHash = await bcrypt.hash(password, 12);

      const createdUser = await repository.createUser({
        id: `usr_admin_${randomUUID()}`,
        email: accessRequest.email,
        username: cleanUsername,
        passwordHash,
        name: cleanName,
        role: 'ADMIN',
        isActive: true
      });

      const marked = await adminAccessRequestRepository.markAccountCreated(
        accessRequest.id,
        createdUser.id
      );

      if (!marked) {
        throw new Error('ADMIN_ACCOUNT_CREATION_ALREADY_COMPLETED');
      }

        return createdUser;
      });

      res.status(201).json({
        message: 'Admin account created successfully. You can now log in using your username and password.',
        user: sanitizeUser(createdUser)
      });
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.status).json({ error: error.message });
        return;
      }

      console.error('[Admin Account Creation Error]:', error);

      res.status(500).json({
        error: 'Unable to create Admin account.'
      });
    }
  }
);

// ----------------------------------------------------
// PUBLIC / OPERATOR: PASSWORD RESETS
// ----------------------------------------------------

// Submit password reset request (can be requested by Admin or from Staff portal)
router.post('/password-resets/request', async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, reason } = req.body ?? {};

    if (typeof identifier !== 'string' || !identifier.trim()) {
      res.status(400).json({
        error: 'Admin username or registered email is required.'
      });
      return;
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const user = await repository.getUserByUsername(cleanIdentifier) || await repository.getUserByEmail(cleanIdentifier);

    if (!user) {
      // Do not reveal user existence for invalid usernames
      res.status(200).json({
        message: 'If an active Admin account exists for this identifier, a password reset request has been submitted for Super Admin review.'
      });
      return;
    }

    if (user.role !== 'ADMIN') {
      res.status(400).json({
        error: 'Password reset requests via this route are for Admin staff only.'
      });
      return;
    }

    if (user.accountStatus === 'REMOVED' || user.accountStatus === 'DISABLED' || !user.isActive) {
      res.status(403).json({
        error: 'This account has been deactivated or removed. Please contact the platform owner.'
      });
      return;
    }

    if (await passwordResetRepository.hasPendingRequest(user.id)) {
      res.status(409).json({
        error: 'A password reset request is already pending Super Admin approval for this account.'
      });
      return;
    }

    const resetRequest = await passwordResetRepository.create(
      user.id,
      user.email,
      user.username || user.email,
      typeof reason === 'string' ? reason.trim().slice(0, 500) : undefined
    );

    res.status(201).json({
      message: 'Password reset request submitted successfully. Awaiting Super Admin review and approval.',
      requestId: resetRequest.id
    });
  } catch (error) {
    console.error('[Password Reset Request Error]:', error);
    res.status(500).json({
      error: 'Unable to submit password reset request.'
    });
  }
});

// Complete password reset using single-use reset token
router.post('/password-resets/complete', async (req: Request, res: Response): Promise<void> => {

  try {
    const { resetToken, password, confirmPassword } = req.body ?? {};

    if (typeof resetToken !== 'string' || !/^[a-f0-9]{64}$/i.test(resetToken)) {
      res.status(400).json({
        error: 'A valid 64-character reset token is required.'
      });
      return;
    }

    if (typeof password !== 'string' || typeof confirmPassword !== 'string') {
      res.status(400).json({
        error: 'New password and confirmation are required.'
      });
      return;
    }

    if (password.length < 12 || password.length > 128) {
      res.status(400).json({
        error: 'Password must contain between 12 and 128 characters.'
      });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({
        error: 'Password and Confirm Password do not match.'
      });
      return;
    }

    const tokenHash = hashToken(resetToken);
    const db = await getDb();

    await db.transaction(async () => {

    const resetRequest = await passwordResetRepository.getByTokenHash(tokenHash);

    if (!resetRequest) {
      throw new HttpError(404, 'Reset token is invalid or does not match any approved request.');
    }

    if (resetRequest.status !== 'APPROVED') {
      throw new HttpError(403, 'This password reset request is not approved or has already been used.');
    }

    if (resetRequest.expiresAt) {
      const expiresAt = new Date(resetRequest.expiresAt).getTime();
      if (Date.now() > expiresAt) {
        throw new HttpError(410, 'This password reset link has expired. Please submit a new request.');
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Updates password and increments token_version to invalidate existing sessions
    const updated = await repository.updateUserPassword(resetRequest.adminId, passwordHash);

    if (!updated) {
      throw new HttpError(500, 'Failed to update user password.');
    }

    await passwordResetRepository.markCompleted(resetRequest.id);

    });

    res.json({
      message: 'Password has been updated successfully. You can now sign in with your new password.'
    });
  } catch (error) {
    if (error instanceof HttpError) {
        res.status(error.status).json({ error: error.message });
        return;
      }

    console.error('[Password Reset Completion Error]:', error);
    res.status(500).json({
      error: 'Unable to complete password reset.'
    });
  }
});

// Exit impersonation view
router.post('/impersonate/exit', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.isImpersonated) {
    res.status(400).json({
      error: 'Current session is not an impersonation session.'
    });
    return;
  }

  await recordAudit(req, 'SUPER_ADMIN_IMPERSONATE_END', 'users', req.user!.id, {
    adminUsername: req.user!.username,
    adminEmail: req.user!.email
  });

  res.json({
    message: 'Impersonation view ended successfully.'
  });
});

// ----------------------------------------------------
// ALL ROUTES BELOW REQUIRE SUPER_ADMIN AUTHENTICATION
// ----------------------------------------------------

router.use(authenticateToken);
router.use(requireRole('SUPER_ADMIN'));

// ----------------------------------------------------
// SUPER ADMIN: ACCESS REQUESTS INBOX
// ----------------------------------------------------

router.get(
  '/access-requests',
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const requests = await adminAccessRequestRepository.list();
      res.json({ requests });
    } catch (error) {
      console.error('[List Access Requests Error]:', error);
      res.status(500).json({
        error: 'Failed to retrieve access requests.'
      });
    }
  }
);

// Approve access request and generate 48-hour secure setup link
router.post(
  '/access-requests/:id/approve',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const accessRequest = await adminAccessRequestRepository.getById(id);

      if (!accessRequest) {
        res.status(404).json({
          error: 'Access request not found.'
        });
        return;
      }

      if (accessRequest.status !== 'PENDING') {
        res.status(409).json({
          error: `This access request has already been ${accessRequest.status.toLowerCase()}.`
        });
        return;
      }

      const setupToken = randomBytes(32).toString('hex');
      const setupTokenHash = hashToken(setupToken);
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      const approved = await adminAccessRequestRepository.approveWithSetupToken(
        id,
        setupTokenHash,
        expiresAt,
        req.user!.id
      );

      if (!approved) {
        res.status(409).json({
          error: 'This access request could not be approved.'
        });
        return;
      }

      await recordAudit(
        req,
        'APPROVE_ADMIN_ACCESS_REQUEST',
        'admin_access_requests',
        id,
        {
          requestEmail: accessRequest.email,
          setupTokenExpiresAt: expiresAt
        }
      );

      const setupLink = `/staff-portal?setupToken=${setupToken}`;

      void emailService.sendAdminSetupLink(
        accessRequest.email,
        accessRequest.name,
        setupLink
      );

      res.json({
        message: 'Admin access request approved. Secure setup link generated (valid for 48 hours).',
        requestId: id,
        status: 'APPROVED',
        setupToken,
        setupLink
      });
    } catch (error) {
      console.error('[Approve Access Request Error]:', error);
      res.status(500).json({
        error: 'Failed to approve access request.'
      });
    }
  }
);

// Reject access request
router.post(
  '/access-requests/:id/reject',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { reason } = req.body ?? {};

      const accessRequest = await adminAccessRequestRepository.getById(id);

      if (!accessRequest) {
        res.status(404).json({
          error: 'Access request not found.'
        });
        return;
      }

      if (accessRequest.status !== 'PENDING') {
        res.status(409).json({
          error: `This access request has already been ${accessRequest.status.toLowerCase()}.`
        });
        return;
      }

      const rejected = await adminAccessRequestRepository.review(
        id,
        'REJECTED',
        req.user!.id
      );

      if (!rejected) {
        res.status(409).json({
          error: 'This access request could not be rejected.'
        });
        return;
      }

      await recordAudit(req, 'REJECT_ADMIN_ACCESS_REQUEST', 'admin_access_requests', id, {
        requestEmail: accessRequest.email,
        reason: reason || undefined
      });

      void emailService.notifyRequestRejection(
        accessRequest.email,
        'ACCESS_REQUEST',
        reason
      );

      res.json({
        message: 'Admin access request rejected successfully.',
        requestId: id,
        status: 'REJECTED'
      });
    } catch (error) {
      console.error('[Reject Access Request Error]:', error);
      res.status(500).json({
        error: 'Failed to reject access request.'
      });
    }
  }
);

// ----------------------------------------------------
// SUPER ADMIN: PASSWORD RESET REQUESTS INBOX
// ----------------------------------------------------

router.get(
  '/password-resets',
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const requests = await passwordResetRepository.list();
      res.json({ requests });
    } catch (error) {
      console.error('[List Password Resets Error]:', error);
      res.status(500).json({
        error: 'Failed to retrieve password reset requests.'
      });
    }
  }
);

// Approve password reset request and generate 24-hour reset link
router.post(
  '/password-resets/:id/approve',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const resetRequest = await passwordResetRepository.getById(id);

      if (!resetRequest) {
        res.status(404).json({
          error: 'Password reset request not found.'
        });
        return;
      }

      if (resetRequest.status !== 'PENDING') {
        res.status(409).json({
          error: `This password reset request has already been ${resetRequest.status.toLowerCase()}.`
        });
        return;
      }

      const resetToken = randomBytes(32).toString('hex');
      const resetTokenHash = hashToken(resetToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const approved = await passwordResetRepository.approve(
        id,
        resetTokenHash,
        expiresAt,
        req.user!.id
      );

      if (!approved) {
        res.status(409).json({
          error: 'Failed to approve password reset request.'
        });
        return;
      }

      await recordAudit(req, 'APPROVE_ADMIN_PASSWORD_RESET', 'admin_password_resets', id, {
        targetAdminId: resetRequest.adminId,
        targetEmail: resetRequest.adminEmail
      });

      const resetLink = `/staff-portal?resetToken=${resetToken}`;

      void emailService.sendPasswordResetLink(
        resetRequest.adminEmail,
        resetRequest.adminUsername,
        resetLink
      );

      res.json({
        message: 'Password reset request approved. Single-use reset link generated (valid for 24 hours).',
        requestId: id,
        status: 'APPROVED',
        resetToken,
        resetLink
      });
    } catch (error) {
      console.error('[Approve Password Reset Error]:', error);
      res.status(500).json({
        error: 'Failed to approve password reset request.'
      });
    }
  }
);

// Reject password reset request
router.post(
  '/password-resets/:id/reject',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { reason } = req.body ?? {};
      const resetRequest = await passwordResetRepository.getById(id);

      if (!resetRequest) {
        res.status(404).json({
          error: 'Password reset request not found.'
        });
        return;
      }

      if (resetRequest.status !== 'PENDING') {
        res.status(409).json({
          error: `This password reset request has already been ${resetRequest.status.toLowerCase()}.`
        });
        return;
      }

      const rejected = await passwordResetRepository.reject(id, req.user!.id);

      if (!rejected) {
        res.status(409).json({
          error: 'Failed to reject password reset request.'
        });
        return;
      }

      await recordAudit(req, 'REJECT_ADMIN_PASSWORD_RESET', 'admin_password_resets', id, {
        targetAdminId: resetRequest.adminId,
        targetEmail: resetRequest.adminEmail,
        reason: reason || undefined
      });

      void emailService.notifyRequestRejection(
        resetRequest.adminEmail,
        'PASSWORD_RESET',
        reason
      );

      res.json({
        message: 'Password reset request rejected successfully.',
        requestId: id,
        status: 'REJECTED'
      });
    } catch (error) {
      console.error('[Reject Password Reset Error]:', error);
      res.status(500).json({
        error: 'Failed to reject password reset request.'
      });
    }
  }
);

// ----------------------------------------------------
// SUPER ADMIN: ADMIN USER MANAGEMENT & PROFILES
// ----------------------------------------------------

// List all users
router.get('/users', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = await repository.listUsers();
    res.json({
      users: users.map(sanitizeUser)
    });
  } catch (error) {
    console.error('[List Users Error]:', error);
    res.status(500).json({
      error: 'Failed to retrieve user accounts.'
    });
  }
});

// Get detailed Admin profile
router.get('/users/:id/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const targetUser = await repository.getUserById(id);

    if (!targetUser) {
      res.status(404).json({
        error: 'User account not found.'
      });
      return;
    }

    const projects = await repository.listProjects();
    const assignedProjects = projects.filter(
      p => p.requirements?.contactEmail?.toLowerCase() === targetUser.email?.toLowerCase()
    );

    const logs = await repository.listAuditLogs(100);
    const userLogs = logs.filter(l => l.userId === targetUser.id || l.resourceId === targetUser.id);

    res.json({
      user: sanitizeUser(targetUser),
      assignedProjectsCount: assignedProjects.length,
      recentActivity: userLogs.slice(0, 10),
      auditHistoryCount: userLogs.length
    });
  } catch (error) {
    console.error('[Get Admin Profile Error]:', error);
    res.status(500).json({
      error: 'Failed to retrieve user profile.'
    });
  }
});

// Disable Admin account (Immediate session revocation & login block; preserves all client data)
router.post('/users/:id/disable', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { reason } = req.body ?? {};

    const targetUser = await repository.getUserById(id);

    if (!targetUser) {
      res.status(404).json({
        error: 'User account not found.'
      });
      return;
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      res.status(403).json({
        error: 'The Super Admin account cannot be disabled.'
      });
      return;
    }

    const disabled = await repository.disableUser(id, reason);

    if (!disabled) {
      res.status(500).json({
        error: 'Failed to disable user account.'
      });
      return;
    }

    await recordAudit(req, 'DISABLE_ADMIN_ACCOUNT', 'users', id, {
      targetUsername: targetUser.username,
      targetEmail: targetUser.email,
      reason: reason || undefined
    });

    res.json({
      message: `Admin account '${targetUser.username || targetUser.email}' has been disabled. All active sessions have been revoked.`,
      userId: id,
      accountStatus: 'DISABLED',
      isActive: false
    });
  } catch (error) {
    console.error('[Disable Admin Error]:', error);
    res.status(500).json({
      error: 'Failed to disable Admin account.'
    });
  }
});

// Enable Admin account
router.post('/users/:id/enable', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const targetUser = await repository.getUserById(id);

    if (!targetUser) {
      res.status(404).json({
        error: 'User account not found.'
      });
      return;
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      res.status(403).json({
        error: 'The Super Admin account does not require enabling.'
      });
      return;
    }

    const enabled = await repository.enableUser(id);

    if (!enabled) {
      res.status(500).json({
        error: 'Failed to enable user account.'
      });
      return;
    }

    await recordAudit(req, 'ENABLE_ADMIN_ACCOUNT', 'users', id, {
      targetUsername: targetUser.username,
      targetEmail: targetUser.email
    });

    res.json({
      message: `Admin account '${targetUser.username || targetUser.email}' has been enabled. The user can now log in with their credentials.`,
      userId: id,
      accountStatus: 'ACTIVE',
      isActive: true
    });
  } catch (error) {
    console.error('[Enable Admin Error]:', error);
    res.status(500).json({
      error: 'Failed to enable Admin account.'
    });
  }
});

// Remove Admin account (Soft delete; preserves all client projects and audit records)
router.post('/users/:id/remove', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { reason } = req.body ?? {};

    const targetUser = await repository.getUserById(id);

    if (!targetUser) {
      res.status(404).json({
        error: 'User account not found.'
      });
      return;
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      res.status(403).json({
        error: 'The Super Admin account cannot be removed.'
      });
      return;
    }

    const removed = await repository.removeUser(id, reason);

    if (!removed) {
      res.status(500).json({
        error: 'Failed to remove user account.'
      });
      return;
    }

    await recordAudit(req, 'REMOVE_ADMIN_ACCOUNT', 'users', id, {
      targetUsername: targetUser.username,
      targetEmail: targetUser.email,
      reason: reason || undefined
    });

    res.json({
      message: `Admin account '${targetUser.username || targetUser.email}' has been removed. Historical records and client projects are preserved.`,
      userId: id,
      accountStatus: 'REMOVED',
      isActive: false
    });
  } catch (error) {
    console.error('[Remove Admin Error]:', error);
    res.status(500).json({
      error: 'Failed to remove Admin account.'
    });
  }
});

// Revoke all active sessions for a user
router.post('/users/:id/revoke-sessions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const targetUser = await repository.getUserById(id);

    if (!targetUser) {
      res.status(404).json({
        error: 'User account not found.'
      });
      return;
    }

    // Signing out another Super Admin is a Super Admin account operation: it needs fresh re-authentication
    // and owner protection, which live in Super Admin Account Management.
    if (targetUser.role === 'SUPER_ADMIN' && targetUser.id !== req.user?.id) {
      res.status(403).json({
        error: 'Super Admin sessions are managed in Super Admin Account Management (password change or deactivation signs them out).'
      });
      return;
    }

    await repository.incrementTokenVersion(id);

    await recordAudit(req, 'REVOKE_USER_SESSIONS', 'users', id, {
      targetUsername: targetUser.username,
      targetEmail: targetUser.email
    });

    res.json({
      message: `All active sessions for '${targetUser.username || targetUser.email}' have been revoked.`
    });
  } catch (error) {
    console.error('[Revoke Sessions Error]:', error);
    res.status(500).json({
      error: 'Failed to revoke user sessions.'
    });
  }
});

// Super Admin Impersonation: "Login as Admin"
router.post(
  '/users/:id/impersonate',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { superAdminPassword, reason } = req.body ?? {};

      if (typeof superAdminPassword !== 'string' || !superAdminPassword) {
        res.status(400).json({
          error: 'Super Admin password re-authentication is required to access Admin view.'
        });
        return;
      }

      // Re-authenticate Super Admin
      const superAdminUser = await repository.getUserById(req.user!.id);
      if (!superAdminUser) {
        res.status(401).json({ error: 'Super Admin account not found.' });
        return;
      }

      const superAdminRecord = await repository.getUserByEmail(superAdminUser.email);
      if (!superAdminRecord) {
        res.status(401).json({ error: 'Super Admin credentials verification failed.' });
        return;
      }

      const isPasswordValid = await bcrypt.compare(
        superAdminPassword,
        superAdminRecord.passwordHash
      );

      if (!isPasswordValid) {
        res.status(401).json({
          error: 'Incorrect Super Admin password. Impersonation request denied.'
        });
        return;
      }

      const targetUser = await repository.getUserById(id);

      if (!targetUser) {
        res.status(404).json({
          error: 'Target Admin account not found.'
        });
        return;
      }

      if (targetUser.role !== 'ADMIN') {
        res.status(400).json({
          error: 'Only Admin accounts can be accessed in impersonation view.'
        });
        return;
      }

      if (targetUser.accountStatus !== 'ACTIVE' || !targetUser.isActive) {
        res.status(403).json({
          error: 'Disabled or removed Admin accounts cannot be accessed in impersonation view.'
        });
        return;
      }

      const secret = getJwtSecret();
      if (!secret) {
        res.status(500).json({
          error: 'Authentication service is not properly configured.'
        });
        return;
      }

      // Short-lived 1-hour impersonation token
      const impersonationToken = jwt.sign(
        {
          id: targetUser.id,
          role: 'ADMIN',
          isImpersonated: true,
          impersonatedBy: req.user!.id,
          version: targetUser.tokenVersion ?? 1
        },
        secret,
        {
          algorithm: 'HS256',
          expiresIn: '1h'
        }
      );

      await recordAudit(req, 'SUPER_ADMIN_IMPERSONATE_START', 'users', targetUser.id, {
        targetUsername: targetUser.username,
        targetEmail: targetUser.email,
        reason: reason || undefined
      });

      res.json({
        message: `Impersonation session created for '${targetUser.username || targetUser.email}'.`,
        token: impersonationToken,
        user: sanitizeUser(targetUser),
        impersonation: {
          active: true,
          impersonatedBy: req.user!.name,
          expiresIn: '1h'
        }
      });
    } catch (error) {
      console.error('[Impersonation Error]:', error);
      res.status(500).json({
        error: 'Failed to initiate Admin impersonation session.'
      });
    }
  }
);

// Backward-compatible status toggle endpoint
router.patch(
  '/users/:id/status',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { isActive } = req.body ?? {};

      if (typeof isActive !== 'boolean') {
        res.status(400).json({
          error: 'isActive must be a boolean value.'
        });
        return;
      }

      const targetUser = await repository.getUserById(id);

      if (!targetUser) {
        res.status(404).json({
          error: 'Target user account not found.'
        });
        return;
      }

      if (targetUser.role === 'SUPER_ADMIN') {
        res.status(403).json({
          error: 'Super Admin account status cannot be changed through this endpoint.'
        });
        return;
      }

      const updated = isActive
        ? await repository.enableUser(id)
        : await repository.disableUser(id);

      if (!updated) {
        res.status(500).json({
          error: 'Failed to update user status.'
        });
        return;
      }

      await recordAudit(req, 'UPDATE_USER_STATUS', 'users', id, {
        targetEmail: targetUser.email,
        newStatus: isActive ? 'ACTIVE' : 'DISABLED'
      });

      res.json({
        message: `Account '${targetUser.email}' has been ${isActive ? 'activated' : 'deactivated'}.`,
        userId: id,
        isActive
      });
    } catch (error) {
      console.error('[Update User Status Error]:', error);
      res.status(500).json({
        error: 'Failed to update account status.'
      });
    }
  }
);

// Invite Admin (Super Admin generates access request with setup token so applicant sets their own password)
router.post(
  '/users',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { email, name } = req.body ?? {};

      if (typeof email !== 'string' || typeof name !== 'string') {
        res.status(400).json({
          error: 'Name and email are required to invite an Admin.'
        });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();

      if (!isValidEmail(cleanEmail)) {
        res.status(400).json({
          error: 'Please provide a valid email address.'
        });
        return;
      }

      if (await repository.getUserByEmail(cleanEmail)) {
        res.status(409).json({
          error: 'An account with this email address already exists.'
        });
        return;
      }

      const setupToken = randomBytes(32).toString('hex');
      const setupTokenHash = hashToken(setupToken);
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      const accessRequest = await adminAccessRequestRepository.create(
        cleanName,
        cleanEmail,
        setupTokenHash,
        'Direct invitation from Super Admin'
      );

      await adminAccessRequestRepository.approveWithSetupToken(
        accessRequest.id,
        setupTokenHash,
        expiresAt,
        req.user!.id
      );

      await recordAudit(req, 'INVITE_ADMIN', 'admin_access_requests', accessRequest.id, {
        invitedEmail: cleanEmail,
        invitedName: cleanName
      });

      const setupLink = `/staff-portal?setupToken=${setupToken}`;

      void emailService.sendAdminSetupLink(cleanEmail, cleanName, setupLink);

      res.status(201).json({
        message: `Admin invitation created for ${cleanName}. A setup link has been generated. The Admin must establish their own password.`,
        setupToken,
        setupLink
      });
    } catch (error) {
      console.error('[Invite Admin Error]:', error);
      res.status(500).json({
        error: 'Failed to invite Admin.'
      });
    }
  }
);

// Audit logs
router.get(
  '/audit-logs',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const requestedLimit = Number(req.query.limit ?? 100);

      if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
        res.status(400).json({
          error: 'Audit log limit must be a positive integer.'
        });
        return;
      }

      const limit = Math.min(requestedLimit, 200);
      const logs = await repository.listAuditLogs(limit);

      res.json({ logs });
    } catch (error) {
      console.error('[Audit Logs Error]:', error);
      res.status(500).json({
        error: 'Failed to retrieve audit logs.'
      });
    }
  }
);

// Telemetry overview
router.get(
  '/overview',
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const users = await repository.listUsers();
      const projects = await repository.listProjects();
      const inquiries = await repository.listInquiries();
      const logs = await repository.listAuditLogs(10);
      const pendingRequests = await adminAccessRequestRepository.list('PENDING');
      const pendingResets = await passwordResetRepository.list('PENDING');

      const stats = {
        totalUsers: users.length,
        activeAdmins: users.filter(
          user => user.role === 'ADMIN' && user.accountStatus === 'ACTIVE'
        ).length,
        disabledAdmins: users.filter(
          user => user.role === 'ADMIN' && user.accountStatus === 'DISABLED'
        ).length,
        superAdmins: users.filter(
          user => user.role === 'SUPER_ADMIN'
        ).length,
        pendingAccessRequests: pendingRequests.length,
        pendingPasswordResets: pendingResets.length,
        totalProjects: projects.length,
        totalInquiries: inquiries.length,
        latestAuditEvents: logs.slice(0, 5)
      };

      res.json({ stats });
    } catch (error) {
      console.error('[Admin Overview Error]:', error);
      res.status(500).json({
        error: 'Failed to retrieve platform overview.'
      });
    }
  }
);

export default router;
