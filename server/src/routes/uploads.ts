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

const DATA_IMAGE_URI_REGEX = /^data:image\/[a-z0-9.+-]+(?:;[^,]+)*;base64,[a-z0-9+/=\s]+$/i;
const MAX_DATA_URI_BYTES = 10 * 1024 * 1024; // 10MB base64 data URI ceiling

router.post('/', requireAuth, async (req, res) => {
  const { dataUrl, url } = req.body || {};
  const resolved = typeof dataUrl === 'string' ? dataUrl.trim() : typeof url === 'string' ? url.trim() : '';
  if (!resolved) {
    return badRequest(res, 'Image dataUrl or url is required.');
  }

  const isHttpUrl = /^https?:\/\/\S+$/i.test(resolved);
  const isAllowedDataUri = DATA_IMAGE_URI_REGEX.test(resolved);

  // Validate allowed format (HTTP/HTTPS URL or permitted image data URI)
  if (!isHttpUrl && !isAllowedDataUri) {
    return badRequest(
      res,
      'Uploaded image must be an HTTPS URL or valid image data URI (JPEG, PNG, WebP, GIF, AVIF, SVG).',
    );
  }

  // Enforce 10MB payload limit on inline data URLs
  if (isAllowedDataUri && resolved.length > MAX_DATA_URI_BYTES) {
    return badRequest(res, 'Image exceeds maximum 10MB size limit. Please choose a smaller image.');
  }

  return res.json({ file_url: resolved });
});

export default router;
