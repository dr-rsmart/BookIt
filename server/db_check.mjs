#!/usr/bin/env node
/**
 * Database Health & Multi-Tenant Integrity Preflight Check
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

const require = createRequire(path.join(__dirname, 'package.json'));
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

try {
  await prisma.$queryRaw`SELECT 1`;
  const [masterCount, providerCount, slotCount] = await Promise.all([
    prisma.user.count({ where: { role: 'master' } }),
    prisma.provider.count(),
    prisma.slot.count(),
  ]);

  if (masterCount < 1) {
    console.error('❌ [db_check] No Platform Master user found in database.');
    process.exit(1);
  }

  console.log(
    `✅ [db_check] Database healthy (${masterCount} master accounts, ${providerCount} providers, ${slotCount} slots).`,
  );
} catch (err) {
  console.error('❌ [db_check] Database integrity check failed:', err.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
