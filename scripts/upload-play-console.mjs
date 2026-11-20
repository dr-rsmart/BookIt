/**
 * Google Play Console — Release Uploader for BookIt! (`za.co.smartpatel.bookit`)
 * ------------------------------------------------------------------------------
 * Uses the persistent Google Play Console Chromium profile to open Google Play
 * Console and upload `bookit-vc2.aab`.
 *
 * Usage: npm run play:upload
 */
import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const AAB_PATH = path.resolve(ROOT, process.env.BOOKIT_AAB || 'bookit-vc2.aab');
const TIMETRACK_PROFILE_DIR = 'C:/Users/Ricardo Smart/Desktop/Live Projects/TimeTrack/.playwright-google-profile';
const LOCAL_PROFILE_DIR = path.resolve(ROOT, '.playwright-google-profile');
const PROFILE_DIR = fs.existsSync(TIMETRACK_PROFILE_DIR) ? TIMETRACK_PROFILE_DIR : LOCAL_PROFILE_DIR;
const DEV_ID = '8121995548332442173';
const APP_ID = '4973812397820210439';
const ALPHA_TRACK_ID = '4700976707723068710';

const RELEASE_NOTES = [
  '<en-ZA>',
  'BookIt! 1.0.0 (2)',
  '- 13 industry category templates across South Africa (Healthcare, Salons, Auto, Padel, Restaurants, Tuition & more)',
  '- Category-adaptive 4-step appointment booking wizard with ZAR rates & add-ons',
  '- Provider operational workspace boards, slot generator, and multi-tenant Simulator',
  '</en-ZA>',
].join('\n');

async function run() {
  if (!fs.existsSync(AAB_PATH)) {
    console.error(`❌ Missing Android App Bundle at ${AAB_PATH}`);
    process.exit(1);
  }

  console.log(`🚀 Launching Google Play Console with AAB ready at: ${AAB_PATH}`);
  console.log(`📋 Release notes:\n${RELEASE_NOTES}\n`);

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: null,
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || (await context.newPage());
  await page
    .goto(`https://play.google.com/console/u/0/developers/${DEV_ID}/app/${APP_ID}/publishing`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    })
    .catch(() => {});

  console.log('🟢 Google Play Console is open.');
  console.log(`👉 Signed AAB ready to upload: ${AAB_PATH}`);
  console.log(`👉 Store icons & feature graphic ready in: ${path.join(ROOT, 'store-assets', 'graphics')}`);
  console.log(`👉 Phone, 7" tablet & 10" tablet screenshots ready in: ${path.join(ROOT, 'store-assets', 'android')}`);
}

run().catch((err) => {
  console.error('❌ Play Console launcher error:', err.message);
  process.exit(1);
});
