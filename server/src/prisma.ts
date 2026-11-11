/**
 * Prisma Client Singleton with Connection Pool Sizing
 * ---------------------------------------------------
 * Explicitly configures PostgreSQL connection pooling for high concurrency:
 *   connection_limit=50, pool_timeout=30, connection_timeout=10
 */

import { PrismaClient } from '@prisma/client';

export function withPoolConfig(url: string): string {
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has('connection_limit')) {
      parsed.searchParams.set('connection_limit', process.env.DB_POOL_SIZE || '50');
    }
    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', '30');
    }
    if (!parsed.searchParams.has('connection_timeout')) {
      parsed.searchParams.set('connection_timeout', '10');
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

const databaseUrl = withPoolConfig(process.env.DATABASE_URL || '');

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasources: {
    db: { url: databaseUrl },
  },
});

export default prisma;
