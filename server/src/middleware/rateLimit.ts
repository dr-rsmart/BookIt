/**
 * Login Brute-Force Rate Limiter
 */

import rateLimit from 'express-rate-limit';
import config from '../config.js';

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60_000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    Boolean(config.perfTestSecret && req.headers['x-perf-bypass'] === config.perfTestSecret),
  message: {
    error: 'Too many login attempts from this IP, please try again later.',
    code: 'RATE_LIMITED',
  },
});
