/**
 * Standardized API Error Responses
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from './logger.js';

export function sendError(
  res: Response,
  status: number,
  error: string,
  extra: Record<string, unknown> = {},
): Response {
  return res.status(status).json({ error, ...extra });
}

export function badRequest(
  res: Response,
  message: string,
  extra: Record<string, unknown> = {},
): Response {
  return sendError(res, 400, message, { code: 'BAD_REQUEST', ...extra });
}

export function unauthorized(
  res: Response,
  message = 'Authentication required.',
  extra: Record<string, unknown> = {},
): Response {
  return sendError(res, 401, message, { code: 'UNAUTHENTICATED', ...extra });
}

export function accessDenied(
  res: Response,
  message = 'Access denied.',
  extra: Record<string, unknown> = {},
): Response {
  return sendError(res, 403, message, { code: 'ACCESS_DENIED', ...extra });
}

export function notFound(res: Response, resource = 'Resource'): Response {
  return sendError(res, 404, `${resource} not found.`, { code: 'NOT_FOUND' });
}

export function duplicateRecord(res: Response, entity: string, field: string): Response {
  return sendError(res, 409, `${entity} with this ${field} already exists.`, {
    code: 'DUPLICATE_RECORD',
    field,
  });
}

export function conflictError(res: Response, message: string): Response {
  return sendError(res, 409, message, { code: 'CONFLICT' });
}

export function internalError(res: Response, action = 'processing request'): Response {
  return sendError(res, 500, `An unexpected error occurred while ${action}.`, {
    code: 'INTERNAL_ERROR',
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
  });
}

export function errorHandler(
  err: Error & { status?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error({ err }, '[server] Unhandled error:');
  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
    code: err.code || 'INTERNAL_ERROR',
  });
}
