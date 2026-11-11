/**
 * JWT Authentication & RBAC Middleware
 * ------------------------------------
 * Verifies signed JWT from httpOnly cookie or Bearer header,
 * enforces pwdEpoch session revocation, and checks tenant suspension.
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config.js';
import prisma from '../prisma.js';
import { getAuthToken } from '../authSession.js';
import { unauthorized, accessDenied, sendError } from '../errorResponse.js';
import type { Role } from '@prisma/client';

export interface AuthTokenPayload {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  providerId: string | null;
  pwdEpoch?: number;
  originalRole?: Role;
  originalUserId?: string;
  originalEmail?: string;
  demoEmail?: string;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthTokenPayload;
    }
  }
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, config.jwtSecret);
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
  } catch {
    return null;
  }
}

// Short-lived cache for live user status & company suspension checks
const userStateCache = new Map<
  string,
  {
    pwdEpoch: number;
    role: Role;
    providerId: string | null;
    providerActive: boolean;
    expiresAt: number;
  }
>();
const CACHE_TTL_MS = 10_000;

export function invalidateLiveRoleCache(userId?: string): void {
  if (userId) userStateCache.delete(userId);
  else userStateCache.clear();
}

export function invalidateProviderActiveCache(): void {
  userStateCache.clear();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = getAuthToken(req);
  if (!token) {
    unauthorized(res, 'Authentication required.');
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    unauthorized(res, 'Invalid or expired authentication token.');
    return;
  }

  // If this is a Master Impersonation or Demo session, preserve the simulated persona
  const isImpersonated = decoded.originalRole === 'master';

  let cached = userStateCache.get(decoded.id);
  if (!cached || Date.now() >= cached.expiresAt) {
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        provider: {
          select: { isActive: true },
        },
      },
    });

    if (!dbUser) {
      unauthorized(res, 'User account no longer exists.');
      return;
    }

    cached = {
      pwdEpoch: dbUser.pwdEpoch,
      role: dbUser.role,
      providerId: dbUser.providerId,
      providerActive: dbUser.provider ? dbUser.provider.isActive : true,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    userStateCache.set(decoded.id, cached);
  }

  // Check password rotation revocation epoch (skip for master impersonation tokens)
  if (
    !isImpersonated &&
    typeof decoded.pwdEpoch === 'number' &&
    decoded.pwdEpoch !== cached.pwdEpoch
  ) {
    unauthorized(res, 'Session expired due to password change. Please log in again.');
    return;
  }

  // Check tenant suspension (skip for master)
  if (!isImpersonated && cached.role !== 'master' && !cached.providerActive) {
    sendError(
      res,
      403,
      'Your business account has been suspended. Please contact platform support.',
      { code: 'COMPANY_SUSPENDED' },
    );
    return;
  }

  req.authUser = {
    ...decoded,
    role: isImpersonated ? decoded.role : cached.role,
    providerId: isImpersonated ? decoded.providerId : cached.providerId,
  };

  next();
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = getAuthToken(req);
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.authUser = decoded;
    }
  }
  next();
}

export function requireRoles(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      unauthorized(res);
      return;
    }
    if (!roles.includes(req.authUser.role)) {
      accessDenied(res, 'You do not have permission to perform this action.');
      return;
    }
    next();
  };
}
