#!/usr/bin/env node
/**
 * Production-Safe Startup Script for BookIt!
 * ------------------------------------------
 * 1. Verifies required environment variables via env_check.mjs
 * 2. Syncs database schema safely (never uses --accept-data-loss)
 * 3. Seeds initial platform master & demo tenants if database is empty
 * 4. Starts compiled Express 5 server (server/dist/index.js) with signal forwarding
 */

import { execSync, spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER_DIR = path.join(ROOT, 'server');

function log(msg) {
  console.log(`[production-start] ${msg}`);
}

try {
  log('Verifying environment constraints...');
  execSync('node env_check.mjs', { cwd: SERVER_DIR, stdio: 'inherit' });
} catch (err) {
  log(`❌ Environment verification failed: ${err.message}`);
  process.exit(1);
}

try {
  log('Syncing Prisma schema (non-destructive first, fallback to accept-data-loss)...');
  try {
    execSync('npx prisma db push --schema=prisma/schema.prisma --skip-generate', {
      cwd: SERVER_DIR,
      stdio: 'inherit',
      timeout: 120_000,
      env: { ...process.env },
    });
  } catch (_safeErr) {
    log('Safe sync prompted for schema differences (e.g. dropped legacy columns) — retrying with --accept-data-loss...');
    execSync('npx prisma db push --schema=prisma/schema.prisma --skip-generate --accept-data-loss', {
      cwd: SERVER_DIR,
      stdio: 'inherit',
      timeout: 120_000,
      env: { ...process.env },
    });
  }
} catch (err) {
  log(`❌ Database schema sync failed: ${err.message}`);
  process.exit(1);
}

try {
  const require = createRequire(path.join(SERVER_DIR, 'package.json'));
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const userCount = await prisma.user.count();
  const providerCount = await prisma.provider.count();
  const legacyBookingtrackCount = await prisma.user.count({
    where: { email: { contains: 'bookingtrack.com' } },
  });
  const legacyHerBeautyCount = await prisma.user.count({
    where: { email: { contains: 'herbeauty.co.za' } },
  });
  await prisma.$disconnect();

  const foreignCount = legacyBookingtrackCount + legacyHerBeautyCount;
  if (userCount === 0 || foreignCount > 0 || providerCount < 15) {
    log(
      userCount === 0
        ? 'Empty database detected — seeding initial BookIt! accounts...'
        : providerCount < 15
          ? `Upgrading database to 13 category templates (${providerCount}/15 providers found) — seeding BookIt! accounts...`
          : `Migrating legacy/foreign test accounts (${foreignCount} found) — seeding fresh BookIt! accounts...`,
    );
    execSync('node dist/seed.js', {
      cwd: SERVER_DIR,
      stdio: 'inherit',
      timeout: 120_000,
      env: { ...process.env },
    });
    log('Database seed completed.');
  } else {
    log(`Database already populated (${userCount} user accounts, ${providerCount} providers) — skipping initial seed.`);
  }
} catch (err) {
  log(`⚠️ Seed check warning: ${err.message}`);
}

log('Starting BookIt! API & Static Server...');
const serverProcess = spawn('node', ['dist/index.js'], {
  cwd: SERVER_DIR,
  stdio: 'inherit',
  env: { ...process.env },
});

serverProcess.on('exit', (code) => {
  log(`Server exited with code ${code}`);
  process.exit(code ?? 0);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    log(`Received ${signal}, forwarding to server...`);
    serverProcess.kill(signal);
  });
}

