/**
 * Redis Health & Optional Client
 */

export function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL);
}

export async function checkRedisHealth(): Promise<{
  configured: boolean;
  status: 'healthy' | 'degraded' | 'disabled';
  latencyMs: number | null;
  error?: string;
}> {
  if (!isRedisConfigured()) {
    return { configured: false, status: 'disabled', latencyMs: null };
  }
  return { configured: false, status: 'disabled', latencyMs: null };
}
