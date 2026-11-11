#!/usr/bin/env node
/**
 * Environment & Cryptographic Security Preflight Check
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

const jwtSecret = process.env.JWT_SECRET || '';
const dbUrl = process.env.DATABASE_URL || '';

if (!jwtSecret || jwtSecret.length < 32) {
  console.error('❌ [env_check] JWT_SECRET is missing or shorter than 32 characters.');
  process.exit(1);
}

if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
  console.error('❌ [env_check] DATABASE_URL must start with postgresql:// or postgres://');
  process.exit(1);
}

console.log('✅ [env_check] Environment and cryptographic constraints verified.');
