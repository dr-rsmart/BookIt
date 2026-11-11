/**
 * Server-Sent Events (SSE) Real-Time Broadcaster
 * ----------------------------------------------
 * Managed client registry with heartbeats, per-user connection caps,
 * and tenant/provider-scoped broadcasts.
 */

import type { Response } from 'express';
import { logger } from './logger.js';

export interface SSEClientMeta {
  id: string;
  role: string;
  providerId: string | null;
}

interface ConnectedClient {
  clientId: string;
  res: Response;
  meta: SSEClientMeta;
  connectedAt: number;
}

const clients = new Map<string, ConnectedClient>();
const MAX_CONN_PER_USER = 5;
let eventSequence = 0;

const heartbeatInterval = setInterval(() => {
  for (const [clientId, client] of clients.entries()) {
    try {
      client.res.write(`: heartbeat ${Date.now()}\n\n`);
    } catch {
      clients.delete(clientId);
    }
  }
}, 25_000);
heartbeatInterval.unref?.();

export function addClient(res: Response, meta: SSEClientMeta): void {
  // Enforce per-user cap (evict oldest connection)
  const userConns = [...clients.values()]
    .filter((c) => c.meta.id === meta.id)
    .sort((a, b) => a.connectedAt - b.connectedAt);

  while (userConns.length >= MAX_CONN_PER_USER) {
    const oldest = userConns.shift();
    if (oldest) {
      try {
        oldest.res.end();
      } catch {
        // ignore
      }
      clients.delete(oldest.clientId);
    }
  }

  const clientId = `${meta.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, status: 'live' })}\n\n`);

  clients.set(clientId, {
    clientId,
    res,
    meta,
    connectedAt: Date.now(),
  });

  res.on('close', () => {
    clients.delete(clientId);
  });
}

export interface BroadcastScope {
  providerId?: string | null;
  customerId?: string | null;
  public?: boolean;
}

const PUBLIC_EVENT_TYPES = new Set([
  'provider:created',
  'provider:updated',
  'service:created',
  'service:updated',
  'service:deleted',
  'professional:created',
  'professional:updated',
  'professional:deleted',
  'slot:created',
  'slot:updated',
  'slot:deleted',
  'slots:bulk_created',
]);

export function broadcastEvent(
  event: string,
  payload: Record<string, unknown>,
  scope?: BroadcastScope,
): void {
  const id = ++eventSequence;
  const serialized = `id: ${id}\nevent: ${event}\ndata: ${JSON.stringify({ event, ...payload })}\n\n`;

  const isExplicitPublic = scope?.public === true;
  const isInherentlyPublic = PUBLIC_EVENT_TYPES.has(event);
  const isPublicEvent =
    isExplicitPublic ||
    (!scope?.customerId && (isInherentlyPublic || (!scope?.providerId && !scope?.customerId)));

  for (const [clientId, client] of clients.entries()) {
    const { meta } = client;
    const isMaster = meta.role === 'master';
    const matchesProvider =
      scope?.providerId && meta.providerId && meta.providerId === scope.providerId;
    const matchesCustomer = scope?.customerId && meta.id === scope.customerId;

    if (isMaster || isPublicEvent || matchesProvider || matchesCustomer) {
      try {
        client.res.write(serialized);
      } catch (err) {
        logger.debug({ err }, `[sse] Removing dead client ${clientId}`);
        clients.delete(clientId);
      }
    }
  }
}

export function disconnectTenantClients(providerId: string): void {
  for (const [clientId, client] of clients.entries()) {
    if (client.meta.providerId === providerId) {
      try {
        client.res.write(
          `event: session_revoked\ndata: ${JSON.stringify({ code: 'COMPANY_SUSPENDED' })}\n\n`,
        );
        client.res.end();
      } catch {
        // ignore
      }
      clients.delete(clientId);
    }
  }
}

export function disconnectUserClients(userId: string): void {
  for (const [clientId, client] of clients.entries()) {
    if (client.meta.id === userId) {
      try {
        client.res.end();
      } catch {
        // ignore
      }
      clients.delete(clientId);
    }
  }
}

export function getClientCount(): number {
  return clients.size;
}

export function closeAllClients(): void {
  for (const client of clients.values()) {
    try {
      client.res.end();
    } catch {
      // ignore
    }
  }
  clients.clear();
}
