import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { User, UserRole } from '../types/index.js';
import { repository } from '../db/repository.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  isImpersonated?: boolean;
  impersonatedBy?: string;
}

/**
 * Retrieves the JWT secret securely.
 * The application must never fall back to a hardcoded secret.
 */
function getJwtSecret(): string | null {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.trim().length < 32) {
    return null;
  }

  return secret;
}

/**
 * Checks whether a value is one of the two supported platform roles.
 */
function isValidUserRole(role: unknown): role is UserRole {
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}

/** The only routes usable while a password change is pending: read the profile and change the password. */
function isPasswordChangeRoute(req: Request): boolean {
  if (req.baseUrl !== '/api/auth') return false;
  return (req.method === 'GET' && req.path === '/me') || (req.method === 'POST' && req.path === '/change-password');
}

/**
 * Authenticates requests using a signed JWT.
 *
 * Security measures:
 * - Requires a Bearer token.
 * - Rejects missing or weak JWT configuration.
 * - Accepts only HS256 tokens.
 * - Validates token payload and token_version for instant revocation.
 * - Reloads the user from the database on every request.
 * - Enforces immediate account suspension (DISABLED or REMOVED).
 * - Distinguishes Super Admin impersonation sessions.
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    res.status(401).json({
      error: 'Access denied. Authorization token required.'
    });
    return;
  }

  const bearerMatch = authorizationHeader.match(/^Bearer\s+(\S+)$/i);

  if (!bearerMatch) {
    res.status(401).json({
      error: 'Invalid authorization header format. Use Bearer token.'
    });
    return;
  }

  const token = bearerMatch[1];
  const secret = getJwtSecret();

  if (!secret) {
    console.error(
      '[Authentication Configuration Error] JWT_SECRET is missing or too weak.'
    );

    res.status(500).json({
      error: 'Authentication service is not properly configured.'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256']
    });

    if (
      typeof decoded === 'string' ||
      !decoded ||
      typeof decoded !== 'object'
    ) {
      res.status(401).json({
        error: 'Invalid authorization token.'
      });
      return;
    }

    const payload = decoded as JwtPayload & {
      id?: string;
      version?: number;
      isImpersonated?: boolean;
      impersonatedBy?: string;
    };

    if (typeof payload.id !== 'string' || !payload.id.trim()) {
      res.status(401).json({
        error: 'Invalid authorization token payload.'
      });
      return;
    }

    // Always retrieve the latest account information from the database.
    const freshUser = await repository.getUserById(payload.id);

    if (!freshUser) {
      res.status(401).json({
        error: 'User account not found or has been removed.'
      });
      return;
    }

    // Token version check for instant session revocation
    if (
      freshUser.tokenVersion !== undefined &&
      typeof payload.version === 'number' &&
      payload.version < freshUser.tokenVersion
    ) {
      res.status(401).json({
        error: 'Session has been revoked. Please sign in again.'
      });
      return;
    }

    // Account status check
    if (freshUser.accountStatus === 'REMOVED') {
      res.status(403).json({
        error: 'Your account has been removed. Access denied.'
      });
      return;
    }

    if (freshUser.accountStatus === 'DISABLED' || !freshUser.isActive) {
      res.status(403).json({
        error: 'Account has been deactivated. Please contact your Super Administrator.'
      });
      return;
    }

    // Only the two explicitly supported roles are permitted.
    if (!isValidUserRole(freshUser.role)) {
      res.status(403).json({
        error: 'Access denied. Invalid account role.'
      });
      return;
    }

    // A password somebody else chose for this person must be replaced before anything else works.
    if (freshUser.mustChangePassword && !isPasswordChangeRoute(req)) {
      res.status(403).json({
        error: 'You must choose a new password before continuing.',
        code: 'PASSWORD_CHANGE_REQUIRED'
      });
      return;
    }

    req.user = freshUser;

    if (payload.isImpersonated) {
      req.isImpersonated = true;
      req.impersonatedBy = payload.impersonatedBy;
    }

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Session expired. Please sign in again.'
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Invalid authorization token.'
      });
      return;
    }

    console.error('[Authentication Error]:', error);

    res.status(500).json({
      error: 'An authentication error occurred.'
    });
  }
};

/**
 * Role-based access control.
 *
 * Supported roles:
 * - SUPER_ADMIN
 * - ADMIN
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required.'
      });
      return;
    }

    if (!isValidUserRole(req.user.role)) {
      res.status(403).json({
        error: 'Access denied. Invalid account role.'
      });
      return;
    }

    // Impersonated sessions must never execute SUPER_ADMIN operations
    if (req.isImpersonated && allowedRoles.includes('SUPER_ADMIN')) {
      res.status(403).json({
        error: 'Platform governance operations are disabled during Admin impersonation view.'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Role '${req.user.role}' lacks sufficient privileges to access this resource.`
      });
      return;
    }

    next();
  };
};

/**
 * Records administrative and operational audit events.
 */
export async function recordAudit(
  req: AuthenticatedRequest,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, any>
): Promise<void> {
  if (!req.user) {
    return;
  }

  try {
    const ipAddress =
      req.ip ||
      req.socket.remoteAddress ||
      undefined;

    const auditDetails = req.isImpersonated
      ? { ...details, _isImpersonated: true, _impersonatedBy: req.impersonatedBy }
      : details;

    await repository.createAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action,
      resourceType,
      resourceId,
      details: auditDetails,
      ipAddress
    });
  } catch (error) {
    // Audit failure must not expose internal details to the client.
    console.error('[Audit Logger Error]:', error);
  }
}
