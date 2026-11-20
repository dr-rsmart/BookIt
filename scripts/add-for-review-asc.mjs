/**
 * add-for-review-asc.mjs
 * ----------------------
 * Resolves the App Store Connect App ID for bundle identifier
 * `za.co.smartpatel.bookit`, waits for the latest uploaded iOS build to
 * become VALID, attaches it to the App Store version, populates localized
 * What's New & review details, and submits to Apple App Review using the
 * App Store Connect API key (`asc-api-key.json`).
 *
 * Usage:  node scripts/add-for-review-asc.mjs
 *         npm run review:ios
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUNDLE_ID = 'za.co.smartpatel.bookit';
const API_BASE = 'https://api.appstoreconnect.apple.com/v1';

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
  const claims = { iss: key.issuer_id, iat: now, exp: now + 10 * 60, aud: 'appstoreconnect-v1' };
  const payload = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
  const sig = crypto
    .createSign('SHA256')
    .update(payload)
    .sign({ key: key.key_p8, dsaEncoding: 'ieee-p1363' });
  return `${payload}.${b64url(sig)}`;
}

let token = signJwt();
let tokenAt = Date.now();

async function api(resourcePath, method = 'GET', body) {
  if (Date.now() - tokenAt > 8 * 60 * 1000) {
    token = signJwt();
    tokenAt = Date.now();
  }
  const res = await fetch(API_BASE + resourcePath, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }
  if (!res.ok) {
    const detail =
      json?.errors?.map((e) => `${e.code}: ${e.detail}`).join(' | ') || JSON.stringify(json);
    throw new Error(`ASC API ${method} ${resourcePath} failed (${res.status}): ${detail}`);
  }
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function resolveAscAppId() {
  const res = await api(`/apps?filter[bundleId]=${encodeURIComponent(BUNDLE_ID)}&limit=10`);
  const app = (res.data || []).find((a) => a.attributes?.bundleId === BUNDLE_ID);
  if (!app) {
    throw new Error(
      `App with bundleId "${BUNDLE_ID}" not yet created in App Store Connect. ` +
        `Create the app record in https://appstoreconnect.apple.com/apps using bundle ID "${BUNDLE_ID}" (already registered as 4MX4RCJS9R), then re-run.`,
    );
  }
  // Persist numeric ascAppId into eas.json if still set to placeholder
  const easPath = path.join(ROOT, 'eas.json');
  if (fs.existsSync(easPath)) {
    const easJson = JSON.parse(fs.readFileSync(easPath, 'utf8'));
    if (easJson?.submit?.production?.ios?.ascAppId !== app.id) {
      easJson.submit.production.ios.ascAppId = app.id;
      fs.writeFileSync(easPath, JSON.stringify(easJson, null, 2) + '\n');
      console.log(`✅ Updated eas.json submit.production.ios.ascAppId = ${app.id}`);
    }
  }
  return app.id;
}

async function waitForValidBuild(appId, timeoutMs = 45 * 60 * 1000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const builds = await api(
      `/builds?filter[app]=${appId}&sort=-uploadedDate&limit=3` +
        `&fields[builds]=version,uploadedDate,processingState,expired`,
    );
    const latest = builds.data?.[0];
    if (!latest) {
      console.log('No builds uploaded yet — retrying in 30s…');
      await sleep(30000);
      continue;
    }
    const a = latest.attributes;
    console.log(
      `Latest build ${a.version} (uploaded ${a.uploadedDate}) — processing state: ${a.processingState}`,
    );
    if (a.processingState === 'VALID') return latest;
    if (a.processingState === 'FAILED' || a.processingState === 'INVALID') {
      throw new Error(`Latest build ${a.version} ended up ${a.processingState}.`);
    }
    await sleep(30000);
  }
  throw new Error('Timed out waiting for App Store Connect to finish processing the build.');
}

async function main() {
  const appId = await resolveAscAppId();
  console.log(`📱 Resolved BookIt! ASC App ID: ${appId}`);

  console.log('⏳ Step 1/3: waiting for the newest build to become VALID…');
  const build = await waitForValidBuild(appId);
  console.log(`✅ Build ${build.attributes.version} is VALID.`);

  const prv = await api(`/builds/${build.id}/preReleaseVersion?fields[preReleaseVersions]=version`);
  const buildVersion = prv.data?.attributes?.version ?? '1.0.0';

  console.log('\n⏳ Step 2/3: locating/creating App Store version…');
  const versions = await api(
    `/apps/${appId}/appStoreVersions?fields[appStoreVersions]=versionString,appStoreState&limit=10`,
  );
  const list = versions.data || [];
  let version = list.find((v) =>
    ['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED'].includes(v.attributes.appStoreState),
  );

  if (!version) {
    const newVersion = await api('/appStoreVersions', 'POST', {
      data: {
        type: 'appStoreVersions',
        attributes: { platform: 'IOS', versionString: buildVersion },
        relationships: { app: { data: { type: 'apps', id: appId } } },
      },
    });
    version = newVersion.data;
  }

  console.log(`🔗 Attaching build ${build.attributes.version} to version ${version.attributes.versionString}…`);
  await api(`/appStoreVersions/${version.id}`, 'PATCH', {
    data: {
      type: 'appStoreVersions',
      id: version.id,
      relationships: { build: { data: { type: 'builds', id: build.id } } },
    },
  });

  console.log('\n📤 Step 3/3: submitting for App Review…');
  const existingSubmissions = await api(
    `/apps/${appId}/reviewSubmissions?filter[platform]=IOS&filter[state]=READY_FOR_REVIEW`,
  );
  let submissionId;
  if (existingSubmissions.data?.length > 0) {
    submissionId = existingSubmissions.data[0].id;
  } else {
    const newSubmission = await api('/reviewSubmissions', 'POST', {
      data: {
        type: 'reviewSubmissions',
        attributes: { platform: 'IOS' },
        relationships: { app: { data: { type: 'apps', id: appId } } },
      },
    });
    submissionId = newSubmission.data.id;
  }

  const submissionWithItems = await api(`/reviewSubmissions/${submissionId}?include=items`);
  const hasItem = submissionWithItems.included?.some(
    (item) =>
      item.type === 'reviewSubmissionItems' &&
      item.relationships?.appStoreVersion?.data?.id === version.id,
  );
  if (!hasItem) {
    await api('/reviewSubmissionItems', 'POST', {
      data: {
        type: 'reviewSubmissionItems',
        relationships: {
          reviewSubmission: { data: { type: 'reviewSubmissions', id: submissionId } },
          appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } },
        },
      },
    });
  }

  await api(`/reviewSubmissions/${submissionId}`, 'PATCH', {
    data: {
      type: 'reviewSubmissions',
      id: submissionId,
      attributes: { submitted: true },
    },
  });

  console.log('\n🎉 SUCCESS: BookIt! is now "Waiting for Review" in App Store Connect.');
  console.log(`Track progress at https://appstoreconnect.apple.com/apps/${appId}`);
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
