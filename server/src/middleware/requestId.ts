/**
 * Request ID Middleware
 */

import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existing = req.headers['x-request-id'];
  const requestId = typeof existing === 'string' && existing.trim() ? existing.trim() : randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
