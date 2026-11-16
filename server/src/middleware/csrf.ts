/**
 * CSRF Origin Validation Middleware
 */

import type { Request, Response, NextFunction } from 'express';
import config from '../config.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const MOBILE_SCHEME_ORIGINS = new Set([
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost',
]);

export function csrfOriginCheck(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  // Requests authenticated via explicit Authorization: Bearer header (such as
  // Expo / React Native mobile clients) are not ambient-cookie CSRF vectors.
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
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
    MOBILE_SCHEME_ORIGINS.has(origin) ||
    origin.startsWith('bookit://') ||
    origin.startsWith('exp://') ||
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
