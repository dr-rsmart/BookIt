/**
 * Auth Routes
 * -----------
 * POST /api/auth/login           — authenticate and issue JWT cookie
 * POST /api/auth/register        — create customer/business account and sign in
 * POST /api/auth/logout          — clear session & bump pwdEpoch
 * GET  /api/auth/me              — return current user profile + linked provider
 * PUT  /api/auth/profile         — update user profile
 * POST /api/auth/change-password — rotate password & bump pwdEpoch
 * POST /api/auth/keep-password   — clear mustChangePassword flag
 * POST /api/auth/forgot-password — initiate password reset flow
 */

import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../prisma.js';
import { logger } from '../logger.js';
import {
  signToken,
  verifyToken,
  requireAuth,
  invalidateLiveRoleCache,
} from '../middleware/auth.js';
import { loginRateLimit } from '../middleware/rateLimit.js';
import {
  validate,
  loginSchema,
  registerSchema,
  changePasswordSchema,
  deleteAccountSchema,
  resetPasswordTokenSchema,
} from '../validation.js';
import { logAudit, getClientIp } from '../audit.js';
import { isDefaultPasswordHash } from '../passwords.js';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS, getAuthToken } from '../authSession.js';
import { disconnectUserClients, broadcastEvent } from '../sse.js';
import { businessNow } from '../timezone.js';
import {
  badRequest,
  unauthorized,
  duplicateRecord,
  conflictError,
  internalError,
  sendError,
} from '../errorResponse.js';

const router = Router();

async function buildUserPayload(userId: string, overrides?: {
  role?: any;
  providerId?: string | null;
  originalRole?: any;
  demoEmail?: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      provider: true,
      ownedProviders: {
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
  });
  if (!user) return null;

  const effectiveProviderId =
    overrides?.providerId !== undefined
      ? overrides.providerId
      : user.providerId || user.ownedProviders[0]?.id || null;

  const effectiveProvider = effectiveProviderId
    ? await prisma.provider.findUnique({
        where: { id: effectiveProviderId },
        select: { id: true, name: true, category: true, status: true, isActive: true },
      })
    : null;

  const usingDefaultPassword = await isDefaultPasswordHash(user.passwordHash);

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    full_name: user.fullName,
    phone: user.phone ?? null,
    role: overrides?.role || user.role,
    providerId: effectiveProviderId,
    provider: effectiveProvider,
    mustChangePassword: user.mustChangePassword,
    usingDefaultPassword,
    ...(overrides?.originalRole ? { originalRole: overrides.originalRole } : {}),
    ...(overrides?.demoEmail ? { demoEmail: overrides.demoEmail } : {}),
  };
}

// ── POST /login ──
router.post('/login', loginRateLimit, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email as string).toLowerCase().trim();

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        ownedProviders: { take: 1 },
      },
    });

    // Self-healing case-insensitive lookup
    if (!user) {
      const rescued = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM "User" WHERE lower(trim(email)) = $1 LIMIT 1`,
        normalizedEmail,
      );
      if (rescued.length > 0) {
        user = await prisma.user.findUnique({
          where: { id: rescued[0].id },
          include: { ownedProviders: { take: 1 } },
        });
      }
    }

    if (!user || !user.passwordHash) {
      logAudit({
        entity: 'User',
        entityId: user?.id ?? 'unknown',
        action: 'login_denied_no_account',
        actorId: 'unknown',
        actorRole: 'unknown',
        actorEmail: normalizedEmail,
        justification: 'Login denied — no account exists for this email',
        ipAddress: getClientIp(req),
      });
      return unauthorized(res, 'Invalid email or password.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return unauthorized(res, 'Invalid email or password.');
    }

    const effectiveProviderId = user.providerId || user.ownedProviders[0]?.id || null;

    if (effectiveProviderId && user.role !== 'master') {
      const provider = await prisma.provider.findUnique({
        where: { id: effectiveProviderId },
        select: { isActive: true, name: true },
      });
      if (provider && !provider.isActive) {
        logAudit({
          entity: 'User',
          entityId: user.id,
          action: 'login_denied_suspended',
          actorId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          justification: `Login denied — business "${provider.name}" is suspended`,
          ipAddress: getClientIp(req),
          providerId: effectiveProviderId,
        });
        return sendError(
          res,
          403,
          'Your business account has been suspended. Please contact platform support.',
          { code: 'COMPANY_SUSPENDED' },
        );
      }
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      providerId: effectiveProviderId,
      pwdEpoch: user.pwdEpoch,
    });

    res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

    logAudit({
      entity: 'User',
      entityId: user.id,
      action: 'login',
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      ipAddress: getClientIp(req),
      providerId: effectiveProviderId,
    });

    const userPayload = await buildUserPayload(user.id);
    return res.json({ user: userPayload, token });
  } catch (err) {
    logger.error({ err }, '[auth] Login error:');
    return internalError(res, 'logging in');
  }
});

// ── POST /register ──
router.post('/register', loginRateLimit, validate(registerSchema), async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;
    const normalizedEmail = (email as string).toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return duplicateRecord(res, 'Account', 'email');
    }

    const effectivePassword = String(password).trim();
    if (effectivePassword.length < 6) {
      return badRequest(res, 'Password must be at least 6 characters.');
    }
    const passwordHash = await bcrypt.hash(effectivePassword, 10);
    const derivedName =
      (fullName && String(fullName).trim()) ||
      normalizedEmail
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName: derivedName,
        phone: phone ? String(phone).trim() : null,
        role: 'customer',
        passwordHash,
        mustChangePassword: false,
      },
    });

    const token = signToken({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      providerId: null,
      pwdEpoch: user.pwdEpoch,
    });

    res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

    logAudit({
      entity: 'User',
      entityId: user.id,
      action: 'register',
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      ipAddress: getClientIp(req),
    });

    const userPayload = await buildUserPayload(user.id);
    return res.status(201).json({ user: userPayload, token });
  } catch (err) {
    logger.error({ err }, '[auth] Register error:');
    return internalError(res, 'creating account');
  }
});

// ── POST /logout ──
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const authUser = req.authUser!;
    if (!authUser.originalRole) {
      await prisma.user.update({
        where: { id: authUser.id },
        data: { pwdEpoch: { increment: 1 } },
      });
      invalidateLiveRoleCache(authUser.id);
      disconnectUserClients(authUser.id);
    }

    res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
    res.clearCookie('tt_token', { path: '/' });

    logAudit({
      entity: 'User',
      entityId: authUser.id,
      action: 'logout',
      actorId: authUser.id,
      actorEmail: authUser.email,
      actorRole: authUser.role,
      ipAddress: getClientIp(req),
      providerId: authUser.providerId,
    });

    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, '[auth] Logout error:');
    return internalError(res, 'logging out');
  }
});

// ── GET /session (200-OK anonymous-safe session probe for SPA boot) ──
router.get('/session', async (req, res) => {
  try {
    const token = getAuthToken(req);
    if (!token) return res.json({ authenticated: false, user: null });
    const decoded = verifyToken(token);
    if (!decoded) return res.json({ authenticated: false, user: null });

    const isImpersonated = decoded.originalRole === 'master';
    if (!isImpersonated && typeof decoded.pwdEpoch === 'number') {
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { pwdEpoch: true },
      });
      if (!dbUser || decoded.pwdEpoch !== dbUser.pwdEpoch) {
        return res.json({ authenticated: false, user: null });
      }
    }

    const payload = await buildUserPayload(decoded.id, {
      role: decoded.role,
      providerId: decoded.providerId,
      originalRole: decoded.originalRole,
      demoEmail: decoded.demoEmail,
    });
    if (!payload) return res.json({ authenticated: false, user: null });
    return res.json({ authenticated: true, user: payload });
  } catch {
    return res.json({ authenticated: false, user: null });
  }
});

// ── GET /me ──
router.get('/me', requireAuth, async (req, res) => {
  try {
    const authUser = req.authUser!;
    const payload = await buildUserPayload(authUser.id, {
      role: authUser.role,
      providerId: authUser.providerId,
      originalRole: authUser.originalRole,
      demoEmail: authUser.demoEmail,
    });
    if (!payload) return unauthorized(res, 'User not found.');
    return res.json(payload);
  } catch (err) {
    logger.error({ err }, '[auth] /me error:');
    return internalError(res, 'fetching profile');
  }
});

// ── PUT /profile ──
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const authUser = req.authUser!;
    const { fullName, phone } = req.body;
    if (!fullName || !String(fullName).trim()) {
      return badRequest(res, 'Full name is required.');
    }

    await prisma.user.update({
      where: { id: authUser.id },
      data: {
        fullName: String(fullName).trim(),
        phone: phone !== undefined ? String(phone).trim() : undefined,
      },
    });

    logAudit({
      entity: 'User',
      entityId: authUser.id,
      action: 'update_profile',
      actorId: authUser.id,
      actorEmail: authUser.email,
      actorRole: authUser.role,
      ipAddress: getClientIp(req),
      providerId: authUser.providerId,
    });

    const payload = await buildUserPayload(authUser.id);
    return res.json({ user: payload });
  } catch (err) {
    logger.error({ err }, '[auth] Update profile error:');
    return internalError(res, 'updating profile');
  }
});

// ── POST /change-password ──
router.post('/change-password', requireAuth, validate(changePasswordSchema), async (req, res) => {
  try {
    const authUser = req.authUser!;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: authUser.id } });
    if (!user || !user.passwordHash) return unauthorized(res);

    if (!user.mustChangePassword && currentPassword) {
      const matches = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!matches) {
        return badRequest(res, 'Current password is incorrect.');
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        pwdEpoch: { increment: 1 },
      },
    });
    invalidateLiveRoleCache(user.id);

    const token = signToken({
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      role: updated.role,
      providerId: updated.providerId,
      pwdEpoch: updated.pwdEpoch,
    });
    res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

    logAudit({
      entity: 'User',
      entityId: user.id,
      action: 'change_password',
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      ipAddress: getClientIp(req),
      providerId: user.providerId,
    });

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    logger.error({ err }, '[auth] Change password error:');
    return internalError(res, 'changing password');
  }
});

// ── POST /keep-password ──
router.post('/keep-password', requireAuth, async (req, res) => {
  try {
    const authUser = req.authUser!;
    const user = await prisma.user.findUnique({ where: { id: authUser.id } });
    if (!user) return unauthorized(res);

    if (await isDefaultPasswordHash(user.passwordHash)) {
      return badRequest(res, 'You cannot keep the default temporary password. Please choose a new password.');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { mustChangePassword: false },
    });

    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, '[auth] Keep password error:');
    return internalError(res, 'keeping password');
  }
});

// ── POST /forgot-password ──
router.post('/forgot-password', loginRateLimit, async (req, res) => {
  try {
    const email = String(req.body?.email || '').toLowerCase().trim();
    if (!email) {
      return badRequest(res, 'Email address is required.');
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        provider: {
          include: { owner: true },
        },
      },
    });

    const pro = !user
      ? await prisma.professional.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
          include: {
            provider: {
              include: { owner: true },
            },
          },
        })
      : null;

    if (user) {
      const rawResetToken = crypto.randomBytes(24).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');
      const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { resetTokenHash, resetTokenExpiresAt },
      });
    }

    const provider = user?.provider || pro?.provider || null;
    const adminEmail =
      provider?.owner?.email ||
      provider?.ownerEmail ||
      (user?.role === 'master' ? 'master@smartpatel.co.za' : 'support@bookit.co.za');
    const adminName =
      provider?.owner?.fullName || provider?.primaryContactName || 'BookIt! Support & Admin';
    const providerName = provider?.name || 'BookIt!';

    logAudit({
      entity: 'User',
      entityId: user?.id ?? 'unknown',
      action: 'forgot_password_request',
      actorId: user?.id ?? 'unknown',
      actorEmail: email,
      actorRole: user?.role ?? 'unknown',
      justification: 'Self-service password recovery requested',
      ipAddress: getClientIp(req),
      providerId: user?.providerId ?? null,
    });

    return res.json({
      success: true,
      message:
        'If an account exists for this email address, password recovery instructions have been recorded. For workspace staff accounts, you may also contact your business administrator.',
      adminEmail,
      adminName,
      providerName,
    });
  } catch (err) {
    logger.error({ err }, '[auth] Forgot password error:');
    return internalError(res, 'requesting password reset');
  }
});

// ── POST /reset-password (token-based password reset) ──
router.post(
  '/reset-password',
  loginRateLimit,
  validate(resetPasswordTokenSchema),
  async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      const tokenHash = crypto
        .createHash('sha256')
        .update(String(token).trim())
        .digest('hex');

      const user = await prisma.user.findFirst({
        where: {
          resetTokenHash: tokenHash,
          resetTokenExpiresAt: { gt: new Date() },
        },
      });

      if (!user) {
        return badRequest(res, 'This password reset link is invalid or has expired.');
      }

      const passwordHash = await bcrypt.hash(String(newPassword), 10);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          mustChangePassword: false,
          resetTokenHash: null,
          resetTokenExpiresAt: null,
          pwdEpoch: { increment: 1 },
        },
      });

      invalidateLiveRoleCache(user.id);
      disconnectUserClients(user.id);

      logAudit({
        entity: 'User',
        entityId: user.id,
        action: 'password_reset_completed',
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        ipAddress: getClientIp(req),
        providerId: user.providerId,
      });

      return res.json({
        success: true,
        message: 'Your password has been reset. You can now log in with your new password.',
      });
    } catch (err) {
      logger.error({ err }, '[auth] Reset password error:');
      return internalError(res, 'resetting password');
    }
  },
);

// ── DELETE /account (In-App Account & Personal Data Deletion — Apple 5.1.1(v) & Google Play) ──
router.delete(
  '/account',
  requireAuth,
  validate(deleteAccountSchema),
  async (req, res) => {
    try {
      const authUser = req.authUser!;
      if (authUser.role === 'master' || authUser.originalRole === 'master') {
        return badRequest(
          res,
          'Platform Master operator accounts cannot be deleted via self-service.',
        );
      }

      const { password, reason } = req.body;
      const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: { ownedProviders: true },
      });

      if (!user || !user.passwordHash) {
        return unauthorized(res, 'Account not found.');
      }

      const passwordMatches = await bcrypt.compare(String(password), user.passwordHash);
      if (!passwordMatches) {
        return badRequest(res, 'Current password is incorrect.');
      }

      const { dateStr: today } = businessNow();
      const ownedProviderIds = user.ownedProviders.map((p) => p.id);

      if (ownedProviderIds.length > 0) {
        const activeBusinessBookings = await prisma.booking.count({
          where: {
            providerId: { in: ownedProviderIds },
            date: { gte: today },
            status: { in: ['pending', 'confirmed'] },
            NOT: { customerId: user.id },
          },
        });
        if (activeBusinessBookings > 0) {
          return conflictError(
            res,
            'Your business has upcoming confirmed or pending customer appointments. Please cancel or complete them before deleting your business owner account.',
          );
        }
      }

      const { cancelledBookingsCount, releasedSlots } = await prisma.$transaction(async (tx) => {
        // 1. Find all bookings placed by this customer
        const customerBookings = await tx.booking.findMany({
          where: {
            OR: [
              { customerId: user.id },
              { customerEmail: { equals: user.email, mode: 'insensitive' } },
            ],
          },
        });

        const activeCustomerBookings = customerBookings.filter(
          (b) => b.status === 'pending' || b.status === 'confirmed',
        );
        const slotIdsToRelease = activeCustomerBookings
          .map((b) => b.slotId)
          .filter((id): id is string => Boolean(id));

        const slotsToBroadcast = slotIdsToRelease.length
          ? await tx.slot.findMany({ where: { id: { in: slotIdsToRelease } } })
          : [];

        if (slotIdsToRelease.length > 0) {
          await tx.slot.updateMany({
            where: { id: { in: slotIdsToRelease } },
            data: { status: 'open', bookingId: null },
          });
        }

        // Cancel active customer bookings and scrub PII across all historical bookings
        for (const booking of customerBookings) {
          const nextStatus =
            booking.status === 'pending' || booking.status === 'confirmed'
              ? 'cancelled'
              : booking.status;
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: nextStatus,
              customerId: null,
              customerName: 'Deleted User',
              customerEmail: 'deleted@bookit.invalid',
              customerPhone: '',
              notes: '',
            },
          });
        }

        // 2. Scrub PII from AuditLog rows created by this user
        await tx.auditLog.updateMany({
          where: {
            OR: [
              { actorId: user.id },
              { actorEmail: { equals: user.email, mode: 'insensitive' } },
            ],
          },
          data: {
            actorEmail: 'deleted@bookit.invalid',
            ipAddress: null,
          },
        });

        // 3. Remove any staff email link on Professional records
        await tx.professional.updateMany({
          where: { email: { equals: user.email, mode: 'insensitive' } },
          data: { email: null },
        });

        // 4. Delete owned providers (if any, verified above to have 0 upcoming customer bookings)
        if (ownedProviderIds.length > 0) {
          await tx.provider.deleteMany({
            where: { id: { in: ownedProviderIds } },
          });
        }

        // 5. Permanently delete the User record
        await tx.user.delete({
          where: { id: user.id },
        });

        // 6. Record anonymized erasure audit entry
        await tx.auditLog.create({
          data: {
            entity: 'User',
            entityId: user.id,
            action: 'account_deleted',
            actorId: 'deleted',
            actorEmail: 'deleted@bookit.invalid',
            actorRole: user.role,
            justification: reason
              ? `Self-service account deletion (${reason})`
              : 'Self-service account & personal data deletion (POPIA / Apple 5.1.1(v) / Google Play)',
            providerId: null,
          },
        });

        return {
          cancelledBookingsCount: activeCustomerBookings.length,
          releasedSlots: slotsToBroadcast,
        };
      });

      invalidateLiveRoleCache(user.id);
      disconnectUserClients(user.id);

      for (const slot of releasedSlots) {
        broadcastEvent(
          'slot:updated',
          {
            slot: {
              id: slot.id,
              provider_id: slot.providerId,
              status: 'open',
              booking_id: null,
              date: slot.date,
              start_time: slot.startTime,
              end_time: slot.endTime,
            },
          },
          { providerId: slot.providerId, public: true },
        );
      }

      res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
      res.clearCookie('tt_token', { path: '/' });

      return res.json({
        success: true,
        message: 'Your account and personal data have been permanently deleted.',
        cancelledBookingsCount,
      });
    } catch (err) {
      logger.error({ err }, '[auth] Delete account error:');
      return internalError(res, 'deleting account');
    }
  },
);

export default router;
