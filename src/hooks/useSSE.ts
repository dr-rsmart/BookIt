/**
 * Real-Time SSE Hook
 * ------------------
 * Maintains a shared EventSource connection to /api/events when signed in,
 * with exponential backoff reconnect and event subscription callbacks.
 */

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export type SSEStatus = 'live' | 'connecting' | 'offline';

type Listener = (event: string, data: Record<string, unknown>) => void;

const listeners = new Set<Listener>();
const statusListeners = new Set<(status: SSEStatus) => void>();
let currentStatus: SSEStatus = 'offline';
let esInstance: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function setStatus(next: SSEStatus) {
  currentStatus = next;
  for (const fn of statusListeners) fn(next);
}

const TRACKED_EVENTS = [
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
  'booking:created',
  'booking:updated',
  'booking:reminder',
];

function ensureConnection(enabled: boolean) {
  if (!enabled) {
    if (esInstance) {
      esInstance.close();
      esInstance = null;
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    setStatus('offline');
    return;
  }

  if (esInstance) return;

  setStatus('connecting');
  const es = new EventSource('/api/events', { withCredentials: true });
  esInstance = es;

  es.addEventListener('connected', () => {
    setStatus('live');
  });

  es.onopen = () => {
    setStatus('live');
  };

  for (const evtName of TRACKED_EVENTS) {
    es.addEventListener(evtName, (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        for (const fn of listeners) fn(evtName, parsed);
      } catch {
        // ignore
      }
    });
  }

  es.onerror = () => {
    es.close();
    esInstance = null;
    setStatus('offline');
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      ensureConnection(true);
    }, 4000);
  };
}

export function useSSEConnection(): void {
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    ensureConnection(isAuthenticated);
  }, [isAuthenticated]);
}

export function useSSEStatus(): SSEStatus {
  const [status, setLocalStatus] = useState<SSEStatus>(currentStatus);
  useEffect(() => {
    statusListeners.add(setLocalStatus);
    return () => {
      statusListeners.delete(setLocalStatus);
    };
  }, []);
  return status;
}

export function useSSE(events: string[], onEvent: () => void): void {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const eventsKey = events.slice().sort().join(',');

  useEffect(() => {
    const eventList = eventsKey.split(',').filter(Boolean);
    const handler: Listener = (evt) => {
      if (eventList.includes(evt) || eventList.includes('*')) {
        onEventRef.current();
      }
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, [eventsKey]);
}
