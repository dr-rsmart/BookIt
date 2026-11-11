/**
 * Operational Metrics Counters (Prometheus-compatible)
 */

const counters = {
  httpRequestsTotal: 0,
  http2xx: 0,
  http4xx: 0,
  http5xx: 0,
  bookingsCreated: 0,
  bookingsCancelled: 0,
  auditWriteFailures: 0,
};

export function recordHttpRequest(statusCode: number): void {
  counters.httpRequestsTotal++;
  if (statusCode >= 200 && statusCode < 300) counters.http2xx++;
  else if (statusCode >= 400 && statusCode < 500) counters.http4xx++;
  else if (statusCode >= 500) counters.http5xx++;
}

export function recordBookingCreated(): void {
  counters.bookingsCreated++;
}

export function recordBookingCancelled(): void {
  counters.bookingsCancelled++;
}

export function recordAuditWriteFailure(): void {
  counters.auditWriteFailures++;
}

export function getMetricsSnapshot() {
  return { ...counters };
}
