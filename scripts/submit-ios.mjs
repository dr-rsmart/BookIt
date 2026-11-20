/**
 * submit-ios.mjs
 * --------------
 * End-to-end non-interactive iOS App Store Connect submission pipeline for BookIt!
 * (`za.co.smartpatel.bookit`) using the App Store Connect API key (`asc-api-key.json`):
 *
 * 1. Resolves the numeric `ascAppId` for bundle identifier `za.co.smartpatel.bookit`
 *    from App Store Connect and writes it into `eas.json`.
 * 2. Submits the latest finished EAS iOS production build (`e8ce71b9-9841-4a7b-8092-5e18d564741b`)
 *    via `eas submit --platform ios --latest --non-interactive`.
 * 3. Uploads all 20 iPhone 6.7" and iPad Pro 12.9" screenshots + description,
 *    keywords, and reviewer demo credentials via `scripts/upload-ios-screenshots.mjs`.
 * 4. Waits for the build to reach `VALID`, attaches it to version 1.0.0, and
 *    submits for Apple Review via `scripts/add-for-review-asc.mjs`.
 *
 * Usage: npm run submit:ios
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUNDLE_ID = 'za.co.smartpatel.bookit';
const KEY_FILE = path.join(ROOT, 'asc-api-key.json');

if (!fs.existsSync(KEY_FILE)) {
  console.error('❌ asc-api-key.json not found at project root.');
  process.exit(1);
}
const key = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));

function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function signJwt() {
  const header = { alg: 'ES256', kid: key.key_id, typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: key.issuer_id, iat: now, exp: now + 600, aud: 'appstoreconnect-v1' };
  const payload = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
  const sig = crypto
    .createSign('SHA256')
    .update(payload)
    .sign({ key: key.key_p8, dsaEncoding: 'ieee-p1363' });
  return `${payload}.${b64url(sig)}`;
}

async function main() {
  console.log('🔍 Checking App Store Connect for bundle ID:', BUNDLE_ID);
  const res = await fetch(
    `https://api.appstoreconnect.apple.com/v1/apps?filter[bundleId]=${encodeURIComponent(BUNDLE_ID)}&limit=10`,
    { headers: { Authorization: `Bearer ${signJwt()}` } },
  );
  const json = await res.json();
  const app = (json.data || []).find((a) => a.attributes?.bundleId === BUNDLE_ID);

  if (!app) {
    console.log('\n⚠️  The App Store Connect app record for "za.co.smartpatel.bookit" has not been created yet.');
    console.log('   (Apple requires creating the initial app shell once in the App Store Connect web UI:)');
    console.log('   1. Open https://appstoreconnect.apple.com/apps and click "+" -> "New App"');
    console.log('   2. Platform: iOS | Name: BookIt: Appointments & Pros (or BookIt! South Africa)');
    console.log('   3. Primary Language: English (U.S.)');
    console.log('   4. Bundle ID: Select "BookIt SA - za.co.smartpatel.bookit" (already registered as 4MX4RCJS9R)');
    console.log('   5. SKU: BOOKIT_SA_01 | User Access: Full Access');
    console.log('   6. Then re-run: npm run submit:ios\n');
    process.exit(1);
  }

  console.log(`✅ Found App Store Connect App: ${app.attributes.name} (ascAppId: ${app.id})`);

  const easPath = path.join(ROOT, 'eas.json');
  const easJson = JSON.parse(fs.readFileSync(easPath, 'utf8'));
  if (easJson.submit?.production?.ios) {
    easJson.submit.production.ios.ascAppId = app.id;
    fs.writeFileSync(easPath, JSON.stringify(easJson, null, 2) + '\n');
    console.log(`✅ Updated eas.json with ascAppId = ${app.id}`);
  }

  console.log('\n🚀 Step 1/3: Submitting latest iOS build from EAS to App Store Connect...');
  execSync('eas submit --platform ios --latest --non-interactive --no-wait', {
    cwd: ROOT,
    stdio: 'inherit',
  });

  console.log('\n🖼️  Step 2/3: Uploading iPhone 6.7" & iPad Pro 12.9" screenshots and App Store metadata...');
  execSync('node scripts/upload-ios-screenshots.mjs', {
    cwd: ROOT,
    stdio: 'inherit',
  });

  console.log('\n📤 Step 3/3: Waiting for build processing, attaching build, and submitting for Apple Review...');
  execSync('node scripts/add-for-review-asc.mjs', {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
