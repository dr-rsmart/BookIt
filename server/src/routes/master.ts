/**
 * Master Platform Routes (/api/master)
 * ------------------------------------
 * Cross-tenant platform KPIs, business onboarding & suspension,
 * operator management, tenant impersonation, and simulator quick-login.
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import prisma from '../prisma.js';
import { logger } from '../logger.js';
import {
  requireAuth,
  signToken,
  invalidateLiveRoleCache,
  invalidateProviderActiveCache,
} from '../middleware/auth.js';
import { isMasterAuthorized } from '../masterAuth.js';
import { logAudit, getClientIp, computeChanges } from '../audit.js';
import { disconnectTenantClients } from '../sse.js';
import { DEFAULT_PASSWORD } from '../passwords.js';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '../authSession.js';
import { businessNow } from '../timezone.js';
import { DEFAULT_WORKING_HOURS, inferTemplateId, serializeProvider } from '../serializers.js';
import { broadcastEvent } from '../sse.js';
import {
  badRequest,
  notFound,
  accessDenied,
  duplicateRecord,
  internalError,
} from '../errorResponse.js';

const router = Router();

function requireMaster(req: any, res: any, next: any) {
  if (isMasterAuthorized(req.authUser, req.path)) {
    return next();
  }
  return accessDenied(res, 'Platform Master access required.');
}

router.use(requireAuth);
router.use(requireMaster);

// ── GET /api/master/stats ──
const STATS_TTL_MS = 30_000;
let statsCache: { data: Record<string, number>; expiresAt: number } | null = null;

router.get('/stats', async (req, res) => {
  try {
    if (statsCache && Date.now() < statsCache.expiresAt && req.query.fresh !== 'true') {
      return res.json(statsCache.data);
    }

    const { dateStr: today } = businessNow();

    const [
      totalProviders,
      publishedProviders,
      activeProviders,
      totalProfessionals,
      totalServices,
      totalUsers,
      totalBookings,
      todayBookings,
      openSlots,
      completedRevenueAgg,
    ] = await Promise.all([
      prisma.provider.count(),
      prisma.provider.count({ where: { status: 'published', isActive: true } }),
      prisma.provider.count({ where: { isActive: true } }),
      prisma.professional.count(),
      prisma.service.count(),
      prisma.user.count(),
      prisma.booking.count(),
      prisma.booking.count({
        where: { date: today, status: { in: ['pending', 'confirmed'] } },
      }),
      prisma.slot.count({
        where: { date: { gte: today }, status: 'open' },
      }),
      prisma.booking.aggregate({
        where: { status: 'completed' },
        _sum: { price: true },
      }),
    ]);

    const completedRevenue = completedRevenueAgg._sum.price
      ? Number(completedRevenueAgg._sum.price)
      : 0;

    const payload = {
      totalProviders,
      publishedProviders,
      activeProviders,
      totalProfessionals,
      totalServices,
      totalUsers,
      totalBookings,
      todayBookings,
      openSlots,
      completedRevenue,
    };

    statsCache = { data: payload, expiresAt: Date.now() + STATS_TTL_MS };
    return res.json(payload);
  } catch (err) {
    logger.error({ err }, '[master] Stats error:');
    return internalError(res, 'retrieving platform statistics');
  }
});

// ── GET /api/master/providers ──
router.get('/providers', async (_req, res) => {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            services: true,
            professionals: true,
            bookings: true,
            slots: true,
          },
        },
        owner: {
          select: { id: true, email: true, fullName: true },
        },
      },
    });

    const items = providers.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      templateId: inferTemplateId(p.category, p.templateId),
      city: p.city || 'South Africa',
      status: p.status,
      isActive: p.isActive,
      billingTier: p.billingTier,
      phone: p.phone || '',
      email: p.email || '',
      street: p.street || '',
      vatNumber: p.vatNumber || '',
      registrationNumber: p.registrationNumber || '',
      primaryContactName: p.primaryContactName || '',
      ownerEmail: p.owner?.email || p.ownerEmail,
      ownerFullName: p.owner?.fullName || p.primaryContactName || 'Business Owner',
      serviceCount: p._count.services,
      professionalCount: p._count.professionals,
      bookingCount: p._count.bookings,
      slotCount: p._count.slots,
      createdAt: p.createdAt.toISOString(),
    }));

    return res.json({ items });
  } catch (err) {
    logger.error({ err }, '[master] List providers error:');
    return internalError(res, 'retrieving business tenants');
  }
});

// ── POST /api/master/providers (Onboard Business Tenant) ──
router.post('/providers', async (req, res) => {
  try {
    const {
      name,
      category,
      city,
      phone,
      street,
      billingTier,
      vatNumber,
      registrationNumber,
      primaryContactName,
      adminEmail,
      adminFirstName,
      adminSurname,
    } = req.body;

    if (!name || !adminEmail || !adminFirstName || !adminSurname) {
      return badRequest(res, 'Business Name, Admin Email, First Name and Surname are required.');
    }

    const normalizedEmail = String(adminEmail).toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return duplicateRecord(res, 'Administrator', 'email');
    }

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const fullName = `${adminFirstName} ${adminSurname}`.trim();
    const resolvedCategory = String(category || 'Hair, Beauty & Wellness').trim();
    const resolvedTemplateId = inferTemplateId(
      resolvedCategory,
      req.body?.template_id ?? req.body?.templateId,
    );

    const result = await prisma.$transaction(async (tx) => {
      const provider = await tx.provider.create({
        data: {
          name: String(name).trim(),
          category: resolvedCategory,
          templateId: resolvedTemplateId,
          city: String(city || 'Johannesburg'),
          phone: String(phone || ''),
          email: normalizedEmail,
          street: String(street || ''),
          country: 'South Africa',
          billingTier: String(billingTier || 'standard'),
          vatNumber: String(vatNumber || ''),
          registrationNumber: String(registrationNumber || ''),
          primaryContactName: String(primaryContactName || fullName),
          ownerEmail: normalizedEmail,
          workingHours: DEFAULT_WORKING_HOURS as unknown as Prisma.InputJsonValue,
          status: 'published',
          isActive: true,
        },
      });

      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          fullName,
          role: 'admin',
          passwordHash,
          mustChangePassword: true,
          providerId: provider.id,
        },
      });

      const updatedProvider = await tx.provider.update({
        where: { id: provider.id },
        data: { ownerUserId: user.id },
      });

      return { provider: updatedProvider, user };
    });

    logAudit({
      entity: 'Provider',
      entityId: result.provider.id,
      action: 'onboard',
      actorId: req.authUser!.id,
      actorEmail: req.authUser!.email,
      actorRole: req.authUser!.role,
      justification: `Onboarded business tenant "${name}" with admin ${normalizedEmail}`,
      ipAddress: getClientIp(req),
      providerId: result.provider.id,
    });

    return res.status(201).json({
      success: true,
      providerId: result.provider.id,
      message: 'Business tenant onboarded successfully.',
      temporaryPassword: DEFAULT_PASSWORD,
    });
  } catch (err) {
    logger.error({ err }, '[master] Onboard provider error:');
    return internalError(res, 'onboarding business tenant');
  }
});

// ── PATCH /api/master/providers/:id/status (Suspend / Reactivate) ──
router.patch('/providers/:id/status', async (req, res) => {
  try {
    const id = String(req.params.id);
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return badRequest(res, 'isActive boolean is required.');
    }

    const existing = await prisma.provider.findUnique({ where: { id } });
    if (!existing) return notFound(res, 'Business');

    const updated = await prisma.provider.update({
      where: { id },
      data: { isActive },
    });

    invalidateProviderActiveCache();
    if (!isActive) {
      disconnectTenantClients(id);
    }

    logAudit({
      entity: 'Provider',
      entityId: id,
      action: isActive ? 'reactivate' : 'suspend',
      actorId: req.authUser!.id,
      actorEmail: req.authUser!.email,
      actorRole: req.authUser!.role,
      changes: computeChanges({ isActive: existing.isActive }, { isActive: updated.isActive }),
      justification: `${isActive ? 'Reactivated' : 'Suspended'} business "${updated.name}"`,
      ipAddress: getClientIp(req),
      providerId: id,
    });

    return res.json({
      success: true,
      isActive: updated.isActive,
      message: `Business "${updated.name}" ${isActive ? 'reactivated' : 'suspended'}.`,
    });
  } catch (err) {
    logger.error({ err }, '[master] Toggle status error:');
    return internalError(res, 'updating business status');
  }
});

// ── PATCH /api/master/providers/:id/category (Master-only Category Assignment) ──
router.patch('/providers/:id/category', async (req, res) => {
  try {
    const id = String(req.params.id);
    const rawCategory = String(req.body?.category || '').trim();
    if (!rawCategory) {
      return badRequest(res, 'Category is required.');
    }

    const existing = await prisma.provider.findUnique({ where: { id } });
    if (!existing) return notFound(res, 'Business');

    const resolvedTemplateId = inferTemplateId(
      rawCategory,
      req.body?.template_id ?? req.body?.templateId ?? rawCategory,
    );

    const updated = await prisma.provider.update({
      where: { id },
      data: {
        category: rawCategory,
        templateId: resolvedTemplateId,
      },
    });

    logAudit({
      entity: 'Provider',
      entityId: id,
      action: 'update_category',
      actorId: req.authUser!.id,
      actorEmail: req.authUser!.email,
      actorRole: req.authUser!.role,
      changes: computeChanges(
        { category: existing.category, templateId: existing.templateId },
        { category: updated.category, templateId: updated.templateId },
      ),
      justification: `Master updated category for "${updated.name}" to "${updated.category}"`,
      ipAddress: getClientIp(req),
      providerId: id,
    });

    const serialized = serializeProvider(updated);
    broadcastEvent('provider:updated', { provider: serialized }, { providerId: updated.id });

    return res.json({
      success: true,
      category: updated.category,
      templateId: resolvedTemplateId,
      message: `Category for "${updated.name}" updated to "${updated.category}".`,
    });
  } catch (err) {
    logger.error({ err }, '[master] Update category error:');
    return internalError(res, 'updating business category');
  }
});

// ── POST /api/master/impersonate/:providerId ──
router.post('/impersonate/:providerId', async (req, res) => {
  try {
    const masterUser = req.authUser!;
    const providerId = String(req.params.providerId);

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: { owner: true },
    });
    if (!provider) return notFound(res, 'Business');

    const targetUser =
      provider.owner ||
      (await prisma.user.findFirst({
        where: {
          OR: [
            { providerId: provider.id },
            { email: { equals: provider.ownerEmail, mode: 'insensitive' } },
          ],
        },
      }));

    if (!targetUser) {
      return badRequest(res, 'No owner account is linked to this business.');
    }

    if (targetUser.providerId !== provider.id) {
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { providerId: provider.id },
      });
    }
    invalidateLiveRoleCache(targetUser.id);

    const token = signToken({
      id: targetUser.id,
      email: targetUser.email,
      fullName: targetUser.fullName,
      role: 'admin',
      providerId: provider.id,
      originalRole: 'master',
      originalUserId: masterUser.originalUserId || masterUser.id,
      originalEmail: masterUser.originalEmail || masterUser.email,
    });

    res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

    logAudit({
      entity: 'Provider',
      entityId: provider.id,
      action: 'impersonate_start',
      actorId: masterUser.id,
      actorEmail: masterUser.email,
      actorRole: 'master',
      justification: `Started impersonating business "${provider.name}" (${targetUser.email})`,
      ipAddress: getClientIp(req),
      providerId: provider.id,
    });

    return res.json({
      success: true,
      token,
      providerId: provider.id,
      message: `Now viewing as ${provider.name}`,
    });
  } catch (err) {
    logger.error({ err }, '[master] Impersonate error:');
    return internalError(res, 'starting impersonation');
  }
});

// ── POST /api/master/demo-login (Platform Simulator) ──
router.post('/demo-login', async (req, res) => {
  try {
    const masterUser = req.authUser!;
    const email = String(req.body?.email || '').toLowerCase().trim();
    const requestedProviderId = String(req.body?.providerId || req.body?.provider_id || '').trim();

    if (!email && !requestedProviderId) {
      return badRequest(res, 'Persona email or providerId is required.');
    }

    let targetProvider = requestedProviderId
      ? await prisma.provider.findUnique({
          where: { id: requestedProviderId },
          include: { owner: true },
        })
      : null;

    let targetUser = email
      ? await prisma.user.findUnique({
          where: { email },
          include: { ownedProviders: { take: 1 } },
        })
      : null;

    if (!targetUser && targetProvider) {
      const ownerFromProvider =
        targetProvider.owner ||
        (await prisma.user.findFirst({
          where: {
            OR: [
              { providerId: targetProvider.id },
              { email: { equals: targetProvider.ownerEmail, mode: 'insensitive' } },
            ],
          },
        }));
      if (ownerFromProvider) {
        targetUser = await prisma.user.findUnique({
          where: { id: ownerFromProvider.id },
          include: { ownedProviders: { take: 1 } },
        });
      }
    }

    if (!targetUser) return notFound(res, 'Demo persona user');

    const realMasterId = masterUser.originalUserId || masterUser.id;
    const realMasterEmail = masterUser.originalEmail || masterUser.email;
    const isReturningToMaster = targetUser.role === 'master';

    if (!targetProvider && !isReturningToMaster && targetUser.role !== 'customer') {
      const candidateId = targetUser.providerId || targetUser.ownedProviders[0]?.id;
      if (candidateId) {
        targetProvider = await prisma.provider.findUnique({
          where: { id: candidateId },
          include: { owner: true },
        });
      }
      if (!targetProvider) {
        targetProvider = await prisma.provider.findFirst({
          where: {
            OR: [
              { ownerUserId: targetUser.id },
              { ownerEmail: { equals: targetUser.email, mode: 'insensitive' } },
            ],
          },
          include: { owner: true },
        });
      }
    }

    const effectiveProviderId = isReturningToMaster
      ? null
      : targetProvider?.id || targetUser.providerId || targetUser.ownedProviders[0]?.id || null;

    // Self-heal User.providerId and Provider.ownerUserId if needed
    if (effectiveProviderId && targetUser.providerId !== effectiveProviderId) {
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { providerId: effectiveProviderId },
      });
    }
    if (targetProvider && !targetProvider.ownerUserId && targetUser.role !== 'customer') {
      await prisma.provider.update({
        where: { id: targetProvider.id },
        data: { ownerUserId: targetUser.id },
      });
    }

    invalidateLiveRoleCache(targetUser.id);

    const token = signToken({
      id: targetUser.id,
      email: targetUser.email,
      fullName: targetUser.fullName,
      role: targetUser.role,
      providerId: effectiveProviderId,
      pwdEpoch: targetUser.pwdEpoch,
      ...(isReturningToMaster
        ? {}
        : {
            originalRole: 'master',
            originalUserId: realMasterId,
            originalEmail: realMasterEmail,
            demoEmail: targetUser.email,
          }),
    });

    res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

    logAudit({
      entity: 'User',
      entityId: targetUser.id,
      action: 'demo_persona_launch',
      actorId: realMasterId,
      actorEmail: realMasterEmail,
      actorRole: 'master',
      justification: `Launched simulator persona ${targetUser.email} (${targetUser.role})${targetProvider ? ` for "${targetProvider.name}"` : ''}`,
      ipAddress: getClientIp(req),
      providerId: effectiveProviderId,
    });

    return res.json({
      success: true,
      token,
      providerId: effectiveProviderId,
      message: targetProvider
        ? `Simulator active: ${targetProvider.name} (${targetUser.fullName})`
        : `Simulator active: ${targetUser.fullName} (${targetUser.role})`,
    });
  } catch (err) {
    logger.error({ err }, '[master] Demo login error:');
    return internalError(res, 'launching simulator persona');
  }
});

// ── POST /api/master/stop-impersonation ──
router.post('/stop-impersonation', async (req, res) => {
  try {
    const authUser = req.authUser!;
    const masterId = authUser.originalUserId || authUser.id;

    let master = await prisma.user.findUnique({ where: { id: masterId } });
    if (!master || master.role !== 'master') {
      master = await prisma.user.findFirst({ where: { role: 'master' } });
    }
    if (!master) return notFound(res, 'Master operator');

    invalidateLiveRoleCache(master.id);

    const token = signToken({
      id: master.id,
      email: master.email,
      fullName: master.fullName,
      role: 'master',
      providerId: null,
      pwdEpoch: master.pwdEpoch,
    });

    res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

    logAudit({
      entity: 'User',
      entityId: master.id,
      action: 'impersonate_stop',
      actorId: master.id,
      actorEmail: master.email,
      actorRole: 'master',
      justification: 'Restored Platform Master session',
      ipAddress: getClientIp(req),
    });

    return res.json({
      success: true,
      token,
      message: 'Restored Master Console session.',
    });
  } catch (err) {
    logger.error({ err }, '[master] Stop impersonation error:');
    return internalError(res, 'restoring master session');
  }
});

// ── GET /api/master/operators ──
router.get('/operators', async (_req, res) => {
  try {
    const operators = await prisma.user.findMany({
      where: { role: 'master' },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({
      items: operators.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    logger.error({ err }, '[master] List operators error:');
    return internalError(res, 'listing master operators');
  }
});

export default router;
