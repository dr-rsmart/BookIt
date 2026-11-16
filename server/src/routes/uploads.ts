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

const ALLOWED_DATA_URI_PREFIXES = [
  'data:image/jpeg;base64,',
  'data:image/jpg;base64,',
  'data:image/png;base64,',
  'data:image/webp;base64,',
  'data:image/svg+xml;base64,',
];

router.post('/', requireAuth, async (req, res) => {
  const { dataUrl, url } = req.body || {};
  const resolved = typeof dataUrl === 'string' ? dataUrl.trim() : typeof url === 'string' ? url.trim() : '';
  if (!resolved) {
    return badRequest(res, 'Image dataUrl or url is required.');
  }

  const isHttpsUrl = resolved.startsWith('https://');
  const isAllowedDataUri = ALLOWED_DATA_URI_PREFIXES.some((prefix) =>
    resolved.toLowerCase().startsWith(prefix),
  );

  // Validate allowed format (HTTPS CDN URL or permitted image data URI)
  if (!isHttpsUrl && !isAllowedDataUri) {
    return badRequest(
      res,
      'Uploaded image must be an HTTPS URL or valid image data URI (JPEG, PNG, WebP).',
    );
  }

  // Enforce 2MB payload limit on inline data URLs to prevent mobile OOM on directory lists
  if (isAllowedDataUri && resolved.length > 2 * 1024 * 1024) {
    return badRequest(res, 'Image exceeds maximum 2MB size limit. Please choose a smaller image.');
  }

  return res.json({ file_url: resolved });
});

export default router;
