/**
 * Standardized Pagination Helpers
 * -------------------------------
 * Clamps limit/offset and sets X-Total-Count, X-Limit, and X-Offset headers.
 */

import type { Request, Response } from 'express';

export interface PageMeta {
  limit: number;
  offset: number;
}

function clampInt(raw: unknown, fallback: number, min: number, max: number): number {
  if (typeof raw !== 'string' || raw.trim() === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

export function parsePagination(
  req: Request,
  defaults: { defaultLimit?: number; maxLimit?: number } = {},
): PageMeta {
  const maxLimit = defaults.maxLimit ?? 500;
  const defaultLimit = defaults.defaultLimit ?? 100;
  return {
    limit: clampInt(req.query.limit, defaultLimit, 1, maxLimit),
    offset: clampInt(req.query.offset, 0, 0, 100_000),
  };
}

export function setPageHeaders(res: Response, total: number, meta: PageMeta): void {
  res.setHeader('X-Total-Count', String(total));
  res.setHeader('X-Limit', String(meta.limit));
  res.setHeader('X-Offset', String(meta.offset));
}
