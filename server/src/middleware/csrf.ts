/**
 * CSRF Origin Validation Middleware
 */

import type { Request, Response, NextFunction } from 'express';
import config from '../config.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function csrfOriginCheck(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const origin = req.headers.origin;
  if (!origin) {
    // Same-origin non-browser or server-to-server calls without Origin header pass through
    next();
    return;
  }

  const allowedOrigins = config.corsOrigin.split(',').map((o) => o.trim());
  const hostOrigin = `${req.protocol}://${req.get('host')}`;

  if (
    allowedOrigins.includes(origin) ||
    origin === hostOrigin ||
    (!config.isProduction && origin.startsWith('http://localhost:')) ||
    (!config.isProduction && origin.startsWith('http://127.0.0.1:'))
  ) {
    next();
    return;
  }

  res.status(403).json({
    error: 'Cross-origin request blocked by CSRF protection.',
    code: 'ACCESS_DENIED',
  });
}
