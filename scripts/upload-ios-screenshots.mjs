/**
 * upload-ios-screenshots.mjs
 * --------------------------
 * Uploads the regenerated iPhone 6.7" and iPad Pro 12.9" screenshots from
 * `store-assets/ios/` and updates App Store Connect metadata & reviewer notes
 * for BookIt! (`za.co.smartpatel.bookit`).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
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

async function api(resourcePath, method = 'GET', body = null) {
  const res = await fetch(`https://api.appstoreconnect.apple.com/v1${resourcePath}`, {
    method,
    headers: {
      Authorization: `Bearer ${signJwt()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (method === 'DELETE' && res.status === 204) return null;
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`API ${method} ${resourcePath} failed (${res.status}): ${JSON.stringify(json)}`);
  }
  return json;
}

const BOOKIT_DESCRIPTION = `BookIt! is a multi-tenant appointment booking, professional scheduling, and business workspace platform built for South African service businesses and their customers.

Customers can discover verified businesses across 13 specialized industry category templates, compare transparent South African Rand (ZAR) rates, select their preferred practitioner, stylist, tutor, technician, court, or table, and reserve an open time slot in seconds — with all payments settled directly in person at the business venue.

13 ADAPTIVE INDUSTRY CATEGORY TEMPLATES:
• Hair, Beauty & Wellness — Stylist chairs, treatment menus & botanical add-ons
• Healthcare — GP & dental consulting rooms, medical aid vs. private intake & HPCSA scheduling disclaimers
• Fitness & Classes — Group class timetables, studio spot selection & class passes
• Sport Facilities — Padel, tennis & turf courts, floodlight tokens & equipment hire
• Tuition — 1-on-1 & small-group IEB/CAPS lessons, in-person or online video classroom
• Restaurants & Cafes — Lunch & dinner sittings, courtyard/hearth seating & dietary tags
• Catering & Events — Guest headcount packages, service styles & dietary breakdowns
• Venues & Spaces — Half-day & full-day room hire, seating layouts & AV/catering add-ons
• Home & Trade Services — Plumbing & electrical call-outs, suburb zones & arrival windows
• Automotive — RMI workshop bay bookings, vehicle registration intake & job stages
• Pet Services — Breed size brackets, coat condition, temperament badges & grooming tables
• Photography & Creative Services — Studio & golden-hour location shoots with retouching add-ons
• Professional Consultations — Legal, tax & financial advisory with conflict-check intake

KEY FEATURES FOR BUSINESS OWNERS & TEAMS:
• Category-Adaptive Workspace Board: Move today's bookings through 4 live operational stages and assign rooms, bays, chairs, courts, or tables in one tap.
• Bulk Availability Slot Generator: Open 15 to 120-minute time slots with weekly repeat and automatic overlap protection.
• Atomic Double-Booking Prevention: Concurrent reservation transactions ensure a slot can never be double-booked.
• POPIA & Trust Compliance: Built-in UGC listing moderation reporting, POPIA IP redaction, and self-service account deletion.`;

const BOOKIT_PROMOTIONAL_TEXT =
  'Book appointments across 13 South African service industries or manage your business schedule, team, availability slots, and operational workspace board.';

const BOOKIT_KEYWORDS =
  'appointments,booking,south africa,salon,doctor,padel,mechanic,restaurant,tuition,schedule,calendar';

const BOOKIT_REVIEW_NOTES = `DEMO ACCOUNTS FOR APP REVIEW (All use password: Password123):
1. Customer Account (Browse 15 businesses, book appointments, view My Bookings): sipho@bookit.com / Password123
2. Business Owner — Healthcare (Sandton Medical & Family Clinic): admin@bookit.com / Password123
3. Business Owner — Hair, Beauty & Wellness (Atelier Hair & Beauty Studio): thabo@bookit.com / Password123
4. Business Owner — Automotive (Cape Auto Precision Mechanics): ayesha@bookit.com / Password123
5. Platform Master (Cross-tenant Control Center & 15-Profile Simulator): master@smartpatel.co.za / Password123

NOTES:
- No online payments or in-app purchases are processed; all displayed ZAR service rates are paid in person at the physical business venue.
- Self-service account deletion is available directly in the app under Profile -> Delete My Account.`;

const SCREENSHOT_FILES = [
  '01_Browse_Directory.png',
  '02_Provider_Profile.png',
  '03_Booking_Wizard.png',
  '06_Customer_My_Bookings.png',
  '07_Dashboard_Overview.png',
  '08_Dashboard_Availability.png',
  '09_Dashboard_Services.png',
  '10_Dashboard_Team.png',
  '13_Master_Console.png',
  '15_Platform_Simulator.png',
];

async function ensureScreenshotSet(localizationId, displayType) {
  const existing = await api(`/appStoreVersionLocalizations/${localizationId}/appScreenshotSets`);
  const found = (existing.data || []).find(
    (s) => s.attributes?.screenshotDisplayType === displayType,
  );
  if (found) return found.id;

  const created = await api('/appScreenshotSets', 'POST', {
    data: {
      type: 'appScreenshotSets',
      attributes: { screenshotDisplayType: displayType },
      relationships: {
        appStoreVersionLocalization: {
          data: { type: 'appStoreVersionLocalizations', id: localizationId },
        },
      },
    },
  });
  return created.data.id;
}

async function clearScreenshotSet(setId, label) {
  const existing = await api(`/appScreenshotSets/${setId}/appScreenshots`);
  for (const sh of existing.data || []) {
    await api(`/appScreenshots/${sh.id}`, 'DELETE');
    console.log(`  🗑️ Deleted old ${label} screenshot ${sh.attributes.fileName}`);
  }
}

async function uploadScreenshot(setId, filePath) {
  const fileName = path.basename(filePath);
  const buffer = fs.readFileSync(filePath);
  const fileSize = buffer.length;

  const reservation = await api('/appScreenshots', 'POST', {
    data: {
      type: 'appScreenshots',
      attributes: { fileName, fileSize },
      relationships: {
        appScreenshotSet: { data: { type: 'appScreenshotSets', id: setId } },
      },
    },
  });

  const screenshotId = reservation.data.id;
  for (const op of reservation.data.attributes.uploadOperations || []) {
    const chunk = buffer.subarray(op.offset, op.offset + op.length);
    const headers = {};
    for (const h of op.requestHeaders || []) headers[h.name] = h.value;
    const upRes = await fetch(op.url, { method: op.method, headers, body: chunk });
    if (!upRes.ok) throw new Error(`Chunk upload failed: ${await upRes.text()}`);
  }

  const md5 = crypto.createHash('md5').update(buffer).digest('hex');
  await api(`/appScreenshots/${screenshotId}`, 'PATCH', {
    data: {
      type: 'appScreenshots',
      id: screenshotId,
      attributes: { uploaded: true, sourceFileChecksum: md5 },
    },
  });
  console.log(`  ✅ Uploaded ${fileName}`);
}

async function main() {
  const appsRes = await api(`/apps?filter[bundleId]=${encodeURIComponent(BUNDLE_ID)}&limit=10`);
  const app = (appsRes.data || []).find((a) => a.attributes?.bundleId === BUNDLE_ID);
  if (!app) {
    throw new Error(
      `App with bundleId "${BUNDLE_ID}" not found in App Store Connect yet. Create it in App Store Connect first, then re-run.`,
    );
  }

  const versionsRes = await api(`/apps/${app.id}/appStoreVersions?filter[platform]=IOS&limit=5`);
  const version = versionsRes.data?.[0];
  if (!version) throw new Error('No iOS App Store version found.');

  const locsRes = await api(`/appStoreVersions/${version.id}/appStoreVersionLocalizations`);
  const loc = locsRes.data?.[0];
  if (!loc) throw new Error('No AppStoreVersionLocalization found.');

  await api(`/appStoreVersionLocalizations/${loc.id}`, 'PATCH', {
    data: {
      type: 'appStoreVersionLocalizations',
      id: loc.id,
      attributes: {
        description: BOOKIT_DESCRIPTION,
        promotionalText: BOOKIT_PROMOTIONAL_TEXT,
        keywords: BOOKIT_KEYWORDS,
        supportUrl: 'https://bookit-production-236d981c.up.railway.app/support',
        marketingUrl: 'https://bookit-production-236d981c.up.railway.app',
      },
    },
  });
  console.log('✅ Updated AppStoreVersionLocalization description, keywords & URLs.');

  try {
    const reviewDetail = await api(`/appStoreVersions/${version.id}/appStoreReviewDetail`);
    if (reviewDetail?.data?.id) {
      await api(`/appStoreReviewDetails/${reviewDetail.data.id}`, 'PATCH', {
        data: {
          type: 'appStoreReviewDetails',
          id: reviewDetail.data.id,
          attributes: {
            demoAccountName: 'admin@bookit.com',
            demoAccountPassword: 'Password123',
            demoAccountRequired: true,
            notes: BOOKIT_REVIEW_NOTES,
          },
        },
      });
    }
  } catch {
    // create if not existing
  }

  const iphoneSetId = await ensureScreenshotSet(loc.id, 'APP_IPHONE_67');
  await clearScreenshotSet(iphoneSetId, 'iPhone 6.7"');
  for (const f of SCREENSHOT_FILES) {
    const full = path.join(ROOT, 'store-assets', 'ios', 'iphone-6.7', f);
    if (fs.existsSync(full)) await uploadScreenshot(iphoneSetId, full);
  }

  const ipadSetId = await ensureScreenshotSet(loc.id, 'APP_IPAD_PRO_3GEN_129');
  await clearScreenshotSet(ipadSetId, 'iPad Pro 12.9"');
  for (const f of SCREENSHOT_FILES) {
    const full = path.join(ROOT, 'store-assets', 'ios', 'ipad-12.9', f);
    if (fs.existsSync(full)) await uploadScreenshot(ipadSetId, full);
  }

  console.log('\n🎉 All BookIt! iPhone 6.7" and iPad Pro 12.9" screenshots uploaded to App Store Connect!');
}

main().catch((err) => {
  console.error('❌ Upload error:', err.message);
  process.exit(1);
});
