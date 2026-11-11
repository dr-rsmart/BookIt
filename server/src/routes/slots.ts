/**
 * Availability Slot Routes (/api/slots)
 * -------------------------------------
 * Query open/booked slots, bulk-generate availability slots across weeks,
 * update slot status, and remove unbooked slots.
 */

import { Router, type Request, type Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../prisma.js';
import { logger } from '../logger.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { serializeSlot } from '../serializers.js';
import { logAudit, getClientIp, computeChanges } from '../audit.js';
import { broadcastEvent } from '../sse.js';
import { canManageProvider } from '../tenantPolicy.js';
import { filterNonOverlappingSlots, isValidTimeWindow, timesOverlap } from '../overlap.js';
import { parsePagination, setPageHeaders } from '../pagination.js';
import { badRequest, notFound, accessDenied, conflictError, internalError } from '../errorResponse.js';

const router = Router();

// ── GET /api/slots ──
router.get('/', optionalAuth, async (req, res) => {
  try {
    const providerId = (req.query.provider_id || req.query.providerId) as string | undefined;
    const professionalId = (req.query.professional_id || req.query.professionalId) as
      | string
      | undefined;
    const serviceId = (req.query.service_id || req.query.serviceId) as string | undefined;
    const date = req.query.date as string | undefined;
    const dateGte = (req.query.date_gte || req.query.date_from) as string | undefined;
    const status = req.query.status as string | undefined;
    const meta = parsePagination(req, { defaultLimit: 300, maxLimit: 1000 });

    const where: Prisma.SlotWhereInput = {};
    if (providerId) where.providerId = providerId;
    if (professionalId) where.professionalId = professionalId;
    if (serviceId) where.serviceId = serviceId;
    if (date) {
      where.date = date;
    } else if (dateGte) {
      where.date = { gte: dateGte };
    }
    if (status === 'open' || status === 'booked' || status === 'blocked') {
      where.status = status;
    }

    const [slots, total] = await Promise.all([
      prisma.slot.findMany({
        where,
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        take: meta.limit,
        skip: meta.offset,
      }),
      prisma.slot.count({ where }),
    ]);

    setPageHeaders(res, total, meta);
    return res.json({
      items: slots.map(serializeSlot),
      total,
      limit: meta.limit,
      offset: meta.offset,
    });
  } catch (err) {
    logger.error({ err }, '[slots] List error:');
    return internalError(res, 'listing availability slots');
  }
});

// ── POST /api/slots ──
router.post('/', requireAuth, async (req, res) => {
  try {
    const authUser = req.authUser!;
    const body = req.body || {};
    const providerId = String(body.provider_id || body.providerId || authUser.providerId || '').trim();
    const professionalId = String(body.professional_id || body.professionalId || '').trim();
    const date = String(body.date || '').trim();
    const startTime = String(body.start_time || body.startTime || '').trim();
    const endTime = String(body.end_time || body.endTime || '').trim();

    if (!providerId || !professionalId || !date || !startTime || !endTime) {
      return badRequest(res, 'Provider, professional, date, start time, and end time are required.');
    }

    if (!isValidTimeWindow(startTime, endTime)) {
      return badRequest(res, 'End time must be after start time (HH:mm format).');
    }

    if (!(await canManageProvider(authUser, providerId))) {
      return accessDenied(res, 'You do not have permission to open slots for this business.');
    }

    const existingOnDay = await prisma.slot.findMany({
      where: { providerId, professionalId, date },
      select: { startTime: true, endTime: true },
    });

    if (existingOnDay.some((ex) => timesOverlap(startTime, endTime, ex.startTime, ex.endTime))) {
      return conflictError(res, 'This time slot overlaps with an existing slot for this professional.');
    }

    const created = await prisma.slot.create({
      data: {
        providerId,
        professionalId,
        serviceId: body.service_id || body.serviceId || null,
        date,
        startTime,
        endTime,
        status: body.status === 'blocked' ? 'blocked' : 'open',
      },
    });

    const serialized = serializeSlot(created);
    broadcastEvent('slot:created', { slot: serialized }, { providerId });
    return res.status(201).json(serialized);
  } catch (err) {
    logger.error({ err }, '[slots] Create error:');
    return internalError(res, 'creating slot');
  }
});

// ── POST /api/slots/bulk ──
router.post('/bulk', requireAuth, async (req, res) => {
  try {
    const authUser = req.authUser!;
    const items = Array.isArray(req.body)
      ? req.body
      : Array.isArray(req.body?.items)
        ? req.body.items
        : [];

    if (items.length === 0) {
      return badRequest(res, 'At least one slot is required.');
    }

    const providerId = String(
      items[0].provider_id || items[0].providerId || authUser.providerId || '',
    ).trim();

    if (!(await canManageProvider(authUser, providerId))) {
      return accessDenied(res, 'You do not have permission to open slots for this business.');
    }

    interface CandidateSlot {
      providerId: string;
      professionalId: string;
      serviceId: string | null;
      date: string;
      startTime: string;
      endTime: string;
      status: 'open' | 'blocked';
    }

    const candidates: CandidateSlot[] = items.map((item: any) => ({
      providerId: String(item.provider_id || item.providerId || providerId),
      professionalId: String(item.professional_id || item.professionalId),
      serviceId: (item.service_id || item.serviceId || null) as string | null,
      date: String(item.date),
      startTime: String(item.start_time || item.startTime),
      endTime: String(item.end_time || item.endTime),
      status: (item.status === 'blocked' ? 'blocked' : 'open') as 'open' | 'blocked',
    }));

    const dates: string[] = [...new Set(candidates.map((c) => c.date))];
    const proIds: string[] = [...new Set(candidates.map((c) => c.professionalId))];

    const existingSlots = await prisma.slot.findMany({
      where: {
        providerId,
        professionalId: { in: proIds },
        date: { in: dates },
      },
      select: {
        date: true,
        professionalId: true,
        startTime: true,
        endTime: true,
      },
    });

    const { accepted, skippedCount } = filterNonOverlappingSlots(candidates, existingSlots);

    const result =
      accepted.length > 0
        ? await prisma.slot.createMany({
            data: accepted,
            skipDuplicates: true,
          })
        : { count: 0 };

    logAudit({
      entity: 'Slot',
      entityId: providerId,
      action: 'bulk_create',
      actorId: authUser.id,
      actorEmail: authUser.email,
      actorRole: authUser.role,
      ipAddress: getClientIp(req),
      providerId,
      justification: `Opened ${result.count} availability time slots (${skippedCount} overlapping skipped)`,
    });

    broadcastEvent('slots:bulk_created', { count: result.count, skippedCount, providerId }, { providerId });
    return res.status(201).json({ count: result.count, skippedCount });
  } catch (err) {
    logger.error({ err }, '[slots] Bulk create error:');
    return internalError(res, 'creating availability slots');
  }
});

// ── PUT & PATCH /api/slots/:id ──
async function handleUpdateSlot(req: Request, res: Response) {
  try {
    const authUser = req.authUser!;
    const id = String(req.params.id);
    const existing = await prisma.slot.findUnique({ where: { id } });
    if (!existing) return notFound(res, 'Slot');

    if (!(await canManageProvider(authUser, existing.providerId))) {
      return accessDenied(res, 'You do not have permission to update this slot.');
    }

    const body = req.body || {};
    const data: Prisma.SlotUpdateInput = {};
    if (body.status === 'open' || body.status === 'booked' || body.status === 'blocked') {
      data.status = body.status;
    }
    if (body.booking_id !== undefined || body.bookingId !== undefined) {
      data.bookingId = body.booking_id ?? body.bookingId ?? null;
    }

    const updated = await prisma.slot.update({
      where: { id },
      data,
    });

    const beforeObj = serializeSlot(existing) as unknown as Record<string, unknown>;
    const afterObj = serializeSlot(updated) as unknown as Record<string, unknown>;

    logAudit({
      entity: 'Slot',
      entityId: updated.id,
      action: 'update',
      actorId: authUser.id,
      actorEmail: authUser.email,
      actorRole: authUser.role,
      changes: computeChanges(beforeObj, afterObj),
      ipAddress: getClientIp(req),
      providerId: updated.providerId,
    });

    const serialized = serializeSlot(updated);
    broadcastEvent('slot:updated', { slot: serialized }, { providerId: updated.providerId });
    return res.json(serialized);
  } catch (err) {
    logger.error({ err }, '[slots] Update error:');
    return internalError(res, 'updating slot');
  }
}

router.put('/:id', requireAuth, handleUpdateSlot);
router.patch('/:id', requireAuth, handleUpdateSlot);

// ── DELETE /api/slots/:id ──
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const authUser = req.authUser!;
    const id = String(req.params.id);
    const existing = await prisma.slot.findUnique({ where: { id } });
    if (!existing) return notFound(res, 'Slot');

    if (!(await canManageProvider(authUser, existing.providerId))) {
      return accessDenied(res, 'You do not have permission to remove this slot.');
    }

    if (existing.status === 'booked') {
      return badRequest(res, 'Cannot delete a booked slot. Cancel the booking first.');
    }

    await prisma.slot.delete({ where: { id } });

    logAudit({
      entity: 'Slot',
      entityId: id,
      action: 'delete',
      actorId: authUser.id,
      actorEmail: authUser.email,
      actorRole: authUser.role,
      ipAddress: getClientIp(req),
      providerId: existing.providerId,
      justification: `Removed open slot ${existing.date} ${existing.startTime}`,
    });

    broadcastEvent('slot:deleted', { slotId: id }, { providerId: existing.providerId });
    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, '[slots] Delete error:');
    return internalError(res, 'removing slot');
  }
});

export default router;
