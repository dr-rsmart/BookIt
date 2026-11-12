/**
 * Prometheus Metrics Endpoint
 */

import { Router } from 'express';
import { getMetricsSnapshot } from '../metrics.js';
import { getClientCount } from '../sse.js';

const router = Router();

router.get('/', (_req, res) => {
  const m = getMetricsSnapshot();
  const sseClients = getClientCount();
  const lines = [
    '# HELP bookit_http_requests_total Total HTTP requests handled',
    '# TYPE bookit_http_requests_total counter',
    `bookit_http_requests_total ${m.httpRequestsTotal}`,
    `bookit_http_responses_2xx_total ${m.http2xx}`,
    `bookit_http_responses_4xx_total ${m.http4xx}`,
    `bookit_http_responses_5xx_total ${m.http5xx}`,
    '# HELP bookit_bookings_created_total Total bookings created',
    '# TYPE bookit_bookings_created_total counter',
    `bookit_bookings_created_total ${m.bookingsCreated}`,
    `bookit_bookings_cancelled_total ${m.bookingsCancelled}`,
    '# HELP bookit_sse_active_clients Active SSE connections',
    '# TYPE bookit_sse_active_clients gauge',
    `bookit_sse_active_clients ${sseClients}`,
    '',
  ];
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(lines.join('\n'));
});

export default router;
