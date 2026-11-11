/**
 * File Upload Route (/api/uploads)
 * --------------------------------
 * Accepts base64 data URLs or image payloads for business cover photos
 * and professional avatars, returning `{ file_url }`.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { badRequest } from '../errorResponse.js';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  const { dataUrl, url } = req.body || {};
  const resolved = typeof dataUrl === 'string' ? dataUrl : typeof url === 'string' ? url : '';
  if (!resolved) {
    return badRequest(res, 'Image dataUrl or url is required.');
  }

  // Validate allowed format (HTTPS CDN URL or permitted image data URI)
  if (resolved.startsWith('http://') || (!resolved.startsWith('https://') && !resolved.startsWith('data:image/'))) {
    return badRequest(res, 'Uploaded image must be an HTTPS URL or valid image data URI (JPEG, PNG, WebP).');
  }

  // Enforce 5MB payload limit on inline data URLs
  if (resolved.startsWith('data:image/') && resolved.length > 5 * 1024 * 1024) {
    return badRequest(res, 'Image exceeds maximum 5MB size limit.');
  }

  return res.json({ file_url: resolved });
});

export default router;
