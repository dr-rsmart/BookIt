/**
 * Audit Log Routes (/api/audit)
 * -----------------------------
 * Immutable audit trail with entity/action filters and POPIA IP redaction
 * for non-master/admin users.
 */

import { Router } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../prisma.js';
import { logger } from '../logger.js';
import { requireAuth } from '../middleware/auth.js';
import { redactIp } from '../audit.js';
import { parsePagination, setPageHeaders } from '../pagination.js';
import { accessDenied, internalError } from '../errorResponse.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const authUser = req.authUser!;
    if (!['master', 'admin', 'manager'].includes(authUser.role)) {
      return accessDenied(res, 'Audit logs are restricted to administrators and managers.');
    }

    const entity = (req.query.entity as string | undefined)?.trim();
    const action = (req.query.action as string | undefined)?.trim();
    const search = (req.query.search as string | undefined)?.trim();
    const meta = parsePagination(req, { defaultLimit: 100, maxLimit: 500 });

    const where: Prisma.AuditLogWhereInput = {};

    if (authUser.role !== 'master') {
      where.providerId = authUser.providerId ?? '__none__';
    } else if (req.query.providerId) {
      where.providerId = String(req.query.providerId);
    }

    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (search) {
      where.OR = [
        { actorEmail: { contains: search, mode: 'insensitive' } },
        { entity: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { justification: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: meta.limit,
        skip: meta.offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const canSeeFullIp = authUser.role === 'master' || authUser.role === 'admin';

    setPageHeaders(res, total, meta);
    return res.json({
      items: logs.map((l) => ({
        id: l.id,
        entity: l.entity,
        entityId: l.entityId,
        action: l.action,
        actorId: l.actorId,
        actorEmail: l.actorEmail,
        actorRole: l.actorRole,
        changes: l.changes as Record<string, { before: unknown; after: unknown }> | null,
        justification: l.justification ?? null,
        ipAddress: canSeeFullIp ? l.ipAddress : redactIp(l.ipAddress),
        providerId: l.providerId ?? null,
        timestamp: l.timestamp.toISOString(),
      })),
      total,
      limit: meta.limit,
      offset: meta.offset,
    });
  } catch (err) {
    logger.error({ err }, '[audit] List error:');
    return internalError(res, 'loading audit logs');
  }
});

export default router;
