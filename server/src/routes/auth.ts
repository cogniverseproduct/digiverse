import { Router, Request, Response } from 'express';
import { randomUUID, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { User, UserRole } from '../types/index.js';
import {
  authenticateToken,
  AuthenticatedRequest,
  recordAudit
} from '../middleware/auth.js';
import { repository } from '../db/repository.js';
import { getDb } from '../db/database.js';
import { getSetupKey, getPlatformEmails, isVercelRuntime, isRetiredPlatformEmail } from '../config.js';
import { isValidEmail, normalizeEmail } from '../utils/email.js';

const router = Router();

const JWT_EXPIRY = '12h';
const MIN_PASSWORD_LENGTH = 12;

function getJwtSecret(): string | null {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.trim().length < 32) {
    return null;
  }

  return secret;
}

function isValidRole(role: unknown): role is UserRole {
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}

function createToken(userId: string, secret: string, version = 1): string {
  return jwt.sign(
    { id: userId, version },
    secret,
    {
      algorithm: 'HS256',
      expiresIn: JWT_EXPIRY
    }
  );
}

function isLocalRequest(req: Request): boolean {
  // On Vercel every request arrives through the platform proxy; never trust a "local" address there.
  if (isVercelRuntime()) {
    return false;
  }

  const address = (
    req.ip ||
    req.socket.remoteAddress ||
    ''
  ).toLowerCase();

  return (
    address === '127.0.0.1' ||
    address === '::1' ||
    address === '::ffff:127.0.0.1'
  );
}

function safeEqual(a: string, b: string): boolean {
  const left = createHash('sha256').update(a).digest();
  const right = createHash('sha256').update(b).digest();
  return timingSafeEqual(left, right);
}

/**
 * Decides whether the one-time Super Admin setup may run for this request.
 *
 * - Local requests (127.0.0.1 / ::1) are always allowed (local development).
 * - Remote requests (e.g. on Vercel, where no request is local) are allowed
 *   only when SETUP_KEY is configured and the request supplies the same key.
 */
export function evaluateSetupAccess(
  isLocal: boolean,
  configuredKey: string | undefined,
  suppliedKey: unknown
): { allowed: boolean; reason?: string } {
  if (isLocal) {
    return { allowed: true };
  }

  if (!configuredKey) {
    return {
      allowed: false,
      reason:
        'Initial Super Admin setup must be performed locally, or SETUP_KEY must be configured in the server environment.'
    };
  }

  if (typeof suppliedKey !== 'string' || !suppliedKey || !safeEqual(suppliedKey, configuredKey)) {
    return { allowed: false, reason: 'A valid setup key is required to create the initial Super Admin.' };
  }

  return { allowed: true };
}

/**
 * True when a usable Super Admin exists (SUPER_ADMIN role, ACTIVE, enabled, has a password).
 * First-run setup is available only while this is false. A disabled/removed Super Admin
 * does not count, but is never overwritten either (see the setup collision checks).
 */
async function superAdminExists(): Promise<boolean> {
  return (await repository.countSuperAdmins()).active > 0;
}

// Failed setup attempts per client address (best effort; serverless instances do not share memory).
const SETUP_FAILURE_LIMIT = 5;
const SETUP_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const setupFailures = new Map<string, { count: number; first: number }>();

export function setupAttemptsExhausted(key: string, now = Date.now()): boolean {
  const entry = setupFailures.get(key);
  if (!entry) return false;
  if (now - entry.first > SETUP_FAILURE_WINDOW_MS) {
    setupFailures.delete(key);
    return false;
  }
  return entry.count >= SETUP_FAILURE_LIMIT;
}

export function recordSetupFailure(key: string, now = Date.now()): void {
  const entry = setupFailures.get(key);
  if (!entry || now - entry.first > SETUP_FAILURE_WINDOW_MS) {
    setupFailures.set(key, { count: 1, first: now });
  } else {
    entry.count += 1;
  }
}

export function resetSetupFailuresForTests(): void {
  setupFailures.clear();
}

/** Arbitrary constant used as a Postgres advisory-lock key so concurrent setups serialize. */
const SETUP_ADVISORY_LOCK = 7243001;

function getPublicUser(userRecord: User & { passwordHash?: string }): User {
  return {
    id: userRecord.id,
    email: userRecord.email,
    username: userRecord.username,
    name: userRecord.name,
    role: userRecord.role,
    isActive: userRecord.isActive,
    accountStatus: userRecord.accountStatus,
    disabledReason: userRecord.disabledReason,
    disabledAt: userRecord.disabledAt,
    lastLoginAt: userRecord.lastLoginAt,
    tokenVersion: userRecord.tokenVersion,
    mustChangePassword: Boolean(userRecord.mustChangePassword),
    createdAt: userRecord.createdAt,
    updatedAt: userRecord.updatedAt
  };
}

/**
 * GET /setup/status
 *
 * Checks whether the initial Super Admin setup is required.
 */
router.get('/setup/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const counts = await repository.countSuperAdmins();
    const setupRequired = counts.active === 0;
    const isLocal = isLocalRequest(req);

    res.status(200).json({
      setupRequired,
      // ACTIVE: normal login. NONE: first-run setup. INACTIVE_ONLY: an owner account exists but is
      // disabled/removed (recover it on the server). No account details are ever returned here.
      superAdminState: counts.active > 0 ? 'ACTIVE' : counts.total > 0 ? 'INACTIVE_ONLY' : 'NONE',
      defaultName: 'Satyaki Maiti',
      email: getPlatformEmails().primary,
      // Remote setup (e.g. on Vercel) needs the one-time SETUP_KEY.
      requiresSetupKey: setupRequired && !isLocal,
      remoteSetupAvailable: setupRequired && !isLocal ? Boolean(getSetupKey()) : undefined
    });
  } catch (error) {
    console.error('[Setup Status Error]:', error);

    res.status(500).json({
      error: 'Unable to check setup status.'
    });
  }
});

/**
 * POST /setup
 *
 * Creates the initial Super Admin.
 *
 * Security:
 * - One-time setup only (refused once any Super Admin exists).
 * - Local requests are allowed; remote requests require SETUP_KEY.
 * - No public Super Admin registration.
 */
router.post('/setup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, username, email, password, confirmPassword, setupKey } = req.body ?? {};

    const clientKey = req.ip || req.socket.remoteAddress || 'unknown';
    if (setupAttemptsExhausted(clientKey)) {
      res.status(429).json({ error: 'Too many failed setup attempts. Try again in 15 minutes.' });
      return;
    }

    const access = evaluateSetupAccess(isLocalRequest(req), getSetupKey(), setupKey);
    if (!access.allowed) {
      recordSetupFailure(clientKey);
      res.status(403).json({ error: access.reason });
      return;
    }

    // Any syntactically valid address is accepted (no provider or domain restriction). The address
    // is an identity only: setup authority comes from the local-machine / SETUP_KEY gate above.
    const requestedEmail = normalizeEmail(
      typeof email === 'string' && email.trim() ? email : getPlatformEmails().primary
    );
    if (!isValidEmail(requestedEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address for the Super Admin account.' });
      return;
    }
    if (isRetiredPlatformEmail(requestedEmail)) {
      res.status(400).json({ error: 'That address is a retired DigiVerse identity. Use the official Super Admin email.' });
      return;
    }

    const profileName = typeof name === 'string' && name.trim().length >= 2
      ? name.trim()
      : 'Satyaki Maiti';

    if (
      typeof username !== 'string' ||
      username.trim().length < 3 ||
      username.trim().length > 50
    ) {
      res.status(400).json({
        error: 'A valid username of at least 3 characters is required.'
      });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      res.status(400).json({
        error: 'Username can only contain letters, numbers, underscores, and hyphens.'
      });
      return;
    }

    if (
      typeof password !== 'string' ||
      typeof confirmPassword !== 'string'
    ) {
      res.status(400).json({
        error: 'Password and Confirm Password are required.'
      });
      return;
    }

    if (
      password.length < MIN_PASSWORD_LENGTH ||
      password.length > 1024
    ) {
      res.status(400).json({
        error: `Password must contain at least ${MIN_PASSWORD_LENGTH} characters.`
      });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({
        error: 'Password and Confirm Password do not match.'
      });
      return;
    }

    const secret = getJwtSecret();

    if (!secret) {
      res.status(500).json({
        error: 'JWT_SECRET is missing or too weak in server environment.'
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const db = await getDb();

    const outcome = await db.transaction(async () => {
      // Serialize concurrent setups on Postgres (SQLite already runs one writer transaction at a time).
      if (db.dialect === 'postgres') {
        await db.get('SELECT pg_advisory_xact_lock(?)', [SETUP_ADVISORY_LOCK]);
      }

      if (await superAdminExists()) {
        return { status: 403 as const, error: 'Super Admin setup has already been completed.' };
      }

      if (await repository.getUserByUsername(cleanUsername)) {
        return { status: 409 as const, error: 'This username is already taken. Please choose another.' };
      }

      if (await repository.getUserByEmail(requestedEmail)) {
        return {
          status: 409 as const,
          error: 'An account with this email already exists. It will not be overwritten: recover it on the server instead (npm run auth:recover-super-admin).'
        };
      }

      const created = await repository.createUser({
        id: randomUUID(),
        email: requestedEmail,
        username: cleanUsername,
        passwordHash,
        name: profileName,
        role: 'SUPER_ADMIN',
        isActive: true,
        // The first Super Admin of an installation is its Product Owner.
        isPlatformOwner: true
      });

      return { status: 201 as const, user: created };
    });

    if (outcome.status !== 201) {
      res.status(outcome.status).json({ error: outcome.error });
      return;
    }

    const user = outcome.user;
    const token = createToken(user.id, secret);

    try {
      const auditRequest = {
        user,
        ip: req.ip,
        socket: req.socket
      } as AuthenticatedRequest;

      await recordAudit(
        auditRequest,
        'SUPER_ADMIN_INITIAL_SETUP',
        'users',
        user.id,
        {
          role: user.role,
          username: cleanUsername,
          email: requestedEmail,
          setupMethod: isLocalRequest(req) ? 'local' : 'setup_key'
        }
      );
    } catch (auditError) {
      console.error('[Setup Audit Error]:', auditError);
    }

    res.status(201).json({
      message: 'Super Admin account created successfully.',
      token,
      user
    });
  } catch (error) {
    console.error('[Super Admin Setup Error]:', error);

    res.status(500).json({
      error: 'Unable to complete Super Admin setup.'
    });
  }
});

/**
 * POST /login
 *
 * Super Admin: username + password (email supported).
 * Admin: username + password.
 *
 * The identifier field is preferred.
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, username, email, password } = req.body ?? {};

    const loginIdentifier =
      typeof identifier === 'string'
        ? identifier
        : typeof username === 'string'
          ? username
          : typeof email === 'string'
            ? email
            : '';

    if (
      !loginIdentifier.trim() ||
      typeof password !== 'string' ||
      !password
    ) {
      res.status(400).json({
        error: 'Username or email and password are required.'
      });
      return;
    }

    if (loginIdentifier.length > 254 || password.length > 1024) {
      res.status(400).json({
        error: 'Invalid login input.'
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

    const cleanIdentifier = loginIdentifier.trim().toLowerCase();

    // Check username first, then fallback to email
    const userRecord =
      await repository.getUserByUsername(cleanIdentifier) ||
      await repository.getUserByEmail(cleanIdentifier);

    if (!userRecord) {
      res.status(401).json({
        error: 'Invalid username/email or password.'
      });
      return;
    }

    if (userRecord.accountStatus === 'REMOVED') {
      res.status(403).json({
        error: 'Your account has been removed. Access denied.'
      });
      return;
    }

    if (userRecord.accountStatus === 'DISABLED' || !userRecord.isActive) {
      res.status(403).json({
        error: 'Account has been deactivated. Please contact your Super Administrator.'
      });
      return;
    }

    if (!isValidRole(userRecord.role)) {
      res.status(403).json({
        error: 'Account access is not permitted.'
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      userRecord.passwordHash
    );

    if (!isPasswordValid) {
      res.status(401).json({
        error: 'Invalid username/email or password.'
      });
      return;
    }

    await repository.updateLastLogin(userRecord.id);

    const user = getPublicUser({
      ...userRecord,
      lastLoginAt: new Date().toISOString()
    });
    const token = createToken(user.id, secret, userRecord.tokenVersion ?? 1);

    try {
      const auditRequest = {
        user,
        ip: req.ip,
        socket: req.socket
      } as AuthenticatedRequest;

      await recordAudit(
        auditRequest,
        'USER_LOGIN',
        'users',
        user.id,
        { role: user.role }
      );
    } catch (auditError) {
      console.error('[Login Audit Error]:', auditError);
    }

    res.status(200).json({
      message: 'Authentication successful.',
      token,
      user
    });
  } catch (error) {
    console.error('[Login Error]:', error);

    res.status(500).json({
      error: 'Unable to process login at this time.'
    });
  }
});

/**
 * GET /me
 *
 * Returns the authenticated user's current profile.
 */
router.get(
  '/me',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required.'
      });
      return;
    }

    res.status(200).json({
      user: req.user
    });
  }
);

/**
 * PATCH /profile
 *
 * Updates display name and/or username for the authenticated user.
 * Note: Fixed registered email cannot be changed through profile settings.
 */
router.patch(
  '/profile',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const { name, username } = req.body ?? {};

      if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
        res.status(400).json({ error: 'Name must be at least 2 characters.' });
        return;
      }

      if (username !== undefined) {
        if (typeof username !== 'string' || username.trim().length < 3) {
          res.status(400).json({ error: 'Username must be at least 3 characters.' });
          return;
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
          res.status(400).json({ error: 'Username can only contain letters, numbers, underscores, and hyphens.' });
          return;
        }
      }

      const updatedUser = await repository.updateUserProfile(req.user.id, {
        name: name !== undefined ? name.trim() : undefined,
        username: username !== undefined ? username.trim().toLowerCase() : undefined
      });

      await recordAudit(req, 'UPDATE_PROFILE', 'users', req.user.id, {
        previousName: req.user.name,
        newName: updatedUser.name,
        previousUsername: req.user.username,
        newUsername: updatedUser.username
      });

      res.status(200).json({
        message: 'Profile updated successfully.',
        user: updatedUser
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'USERNAME_ALREADY_TAKEN') {
        res.status(409).json({ error: 'This username is already in use by another account.' });
        return;
      }
      console.error('[Profile Update Error]:', err);
      res.status(500).json({ error: 'Failed to update profile.' });
    }
  }
);

/**
 * POST /change-password
 *
 * Verifies current password, validates new password (min 12 chars), hashes and updates.
 */
router.post(
  '/change-password',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const { currentPassword, newPassword, confirmPassword } = req.body ?? {};

      if (typeof currentPassword !== 'string' || !currentPassword) {
        res.status(400).json({ error: 'Current password is required.' });
        return;
      }

      if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
        res.status(400).json({ error: `New password must contain at least ${MIN_PASSWORD_LENGTH} characters.` });
        return;
      }

      if (newPassword !== confirmPassword) {
        res.status(400).json({ error: 'New password and confirmation do not match.' });
        return;
      }

      // Verify current password against stored hash
      const userRecord = req.user.username
        ? await repository.getUserByUsername(req.user.username)
        : await repository.getUserByEmail(req.user.email);

      if (!userRecord || !userRecord.passwordHash) {
        res.status(401).json({ error: 'Unable to verify credentials.' });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, userRecord.passwordHash);
      if (!isMatch) {
        res.status(401).json({ error: 'Current password is incorrect.' });
        return;
      }

      const forced = Boolean(req.user.mustChangePassword);

      if (forced && newPassword === currentPassword) {
        res.status(400).json({ error: 'Choose a different password from the temporary one you were given.' });
        return;
      }

      const newHash = await bcrypt.hash(newPassword, 12);
      await repository.updateUserPassword(req.user.id, newHash);

      await recordAudit(req, forced ? 'FORCED_PASSWORD_CHANGED' : 'CHANGE_PASSWORD', 'users', req.user.id, {
        role: req.user.role
      });

      // Changing the password signs every session out (token_version + 1); hand back a fresh token
      // so the person who just changed it stays signed in.
      const secret = getJwtSecret();
      const refreshed = await repository.getUserById(req.user.id);
      const token = secret && refreshed ? createToken(refreshed.id, secret, refreshed.tokenVersion ?? 1) : undefined;

      res.status(200).json({
        message: 'Password changed successfully.',
        ...(token ? { token, user: getPublicUser(refreshed!) } : {})
      });
    } catch (err: unknown) {
      console.error('[Change Password Error]:', err);
      res.status(500).json({ error: 'Failed to change password.' });
    }
  }
);

/**
 * GET /security-status
 *
 * Real persistent telemetry for the Security settings tab.
 */
router.get(
  '/security-status',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const db = await getDb();
      const lastLoginRow = await db.get(`
        SELECT created_at FROM audit_logs
        WHERE user_id = ? AND action = 'USER_LOGIN'
        ORDER BY created_at DESC LIMIT 1 OFFSET 1
      `, [req.user.id]) as any;

      const lastPasswordChange = await db.get(`
        SELECT created_at FROM audit_logs
        WHERE user_id = ? AND action = 'CHANGE_PASSWORD'
        ORDER BY created_at DESC LIMIT 1
      `, [req.user.id]) as any;

      res.status(200).json({
        accountCreatedAt: req.user.createdAt,
        lastLoginAt: lastLoginRow?.created_at || req.user.createdAt,
        passwordUpdatedAt: lastPasswordChange?.created_at || req.user.createdAt,
        activeSessionsCount: 1,
        recoveryEmailConfigured: false,
        recoveryStatusMessage: 'SMTP delivery service is not configured. Automated recovery is disabled.'
      });
    } catch (err) {
      console.error('[Security Status Error]:', err);
      res.status(500).json({ error: 'Failed to retrieve security status.' });
    }
  }
);

/**
 * Legacy ownership-transfer endpoints (token link, unauthenticated accept, owner demotion) were
 * replaced by the account-based workflow in /api/super-admins/transfer, where the new owner must
 * sign in and accept. Anything still calling the old URLs gets a clear answer instead of a 404.
 */
router.all('/transfer-ownership/*path', (_req: Request, res: Response): void => {
  res.status(410).json({
    error: 'This ownership transfer endpoint was retired. Use Super Admin Account Management in the dashboard (/api/super-admins/transfer).'
  });
});

export default router;
