/**
 * Namecheap DNS Automated & Guided Configuration Utility for BookIt! (book-it.tech)
 * ---------------------------------------------------------------------------------
 * Automates pointing `book-it.tech` and `www.book-it.tech` to the active
 * production Railway endpoints (port 4005) and configuring the Railway ownership
 * verification TXT records for automatic SSL/TLS certificate provisioning.
 */

import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DOMAIN = 'book-it.tech';
const APEX_TARGET = 'clz3xz4d.up.railway.app';
const WWW_TARGET = 'ockeu973.up.railway.app';
const APEX_VERIFY_TXT =
  'railway-verify=d81488eab1080b597390057d4e73c521fc8bda643f58d22320afdb280a64eafc';
const WWW_VERIFY_TXT =
  'railway-verify=749f73c22e92eb394e06475b410bc91c7fa1e0f16f79c121fbcd2fd9a83ac566';

async function getPublicIp() {
  const ipServices = [
    'https://api.ipify.org?format=json',
    'https://ipinfo.io/json',
    'https://ifconfig.me/all.json',
  ];
  for (const service of ipServices) {
    try {
      const res = await fetch(service, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      const ip = data.ip || data.ip_addr || data.query;
      if (ip) return ip;
    } catch {}
  }
  try {
    const res = await fetch('https://ifconfig.me/ip', { signal: AbortSignal.timeout(5000) });
    const ip = (await res.text()).trim();
    if (ip) return ip;
  } catch {}
  return null;
}

function loadNamecheapCredentials() {
  const envFiles = [
    path.join(ROOT, '.env'),
    'C:/Users/Ricardo Smart/Desktop/Live Projects/TimeTrack/.env',
    'C:/Users/Ricardo Smart/Desktop/Live Projects/RepTrack/.env',
    'C:/Users/Ricardo Smart/Desktop/Live Projects/FleetTrack/.env',
    'C:/Users/Ricardo Smart/Desktop/Live Projects/TruckTrack/.env',
  ];
  let username = 'ricardovsmart';
  let apiKey = '';
  for (const p of envFiles) {
    if (fs.existsSync(p)) {
      const parsed = dotenv.parse(fs.readFileSync(p, 'utf8'));
      if (parsed.NAMECHEAP_USERNAME) username = parsed.NAMECHEAP_USERNAME;
      if (parsed.NAMECHEAP_API_KEY && !parsed.NAMECHEAP_API_KEY.startsWith('http') && !apiKey) {
        apiKey = parsed.NAMECHEAP_API_KEY;
      }
    }
  }
  return { username, apiKey };
}

async function run() {
  console.log('🌐 BookIt! (book-it.tech) DNS Setup & Diagnostics Utility\n');
  const publicIp = await getPublicIp();
  const { username, apiKey } = loadNamecheapCredentials();

  console.log(`📡 Current Public IP Address: ${publicIp || 'Undetected'}`);
  console.log(`📌 Domain to Configure:       ${DOMAIN}`);
  console.log(`🔗 Target Apex ALIAS (@):     ${APEX_TARGET}`);
  console.log(`🔗 Target WWW CNAME (www):    ${WWW_TARGET}`);
  console.log(`🔐 Apex TXT (_railway-verify):     ${APEX_VERIFY_TXT}`);
  console.log(`🔐 WWW TXT  (_railway-verify.www): ${WWW_VERIFY_TXT}\n`);

  if (apiKey && publicIp) {
    console.log('🚀 Attempting automated Namecheap DNS record update via API...');
    const params = new URLSearchParams({
      ApiUser: username,
      ApiKey: apiKey,
      UserName: username,
      Command: 'namecheap.domains.dns.setHosts',
      ClientIP: publicIp,
      SLD: 'book-it',
      TLD: 'tech',
      HostName1: '@',
      RecordType1: 'ALIAS',
      Address1: APEX_TARGET,
      TTL1: '300',
      HostName2: 'www',
      RecordType2: 'CNAME',
      Address2: WWW_TARGET,
      TTL2: '300',
      HostName3: '_railway-verify',
      RecordType3: 'TXT',
      Address3: APEX_VERIFY_TXT,
      TTL3: '300',
      HostName4: '_railway-verify.www',
      RecordType4: 'TXT',
      Address4: WWW_VERIFY_TXT,
      TTL4: '300',
    });

    try {
      const res = await fetch(`https://api.namecheap.com/xml.response?${params.toString()}`);
      const xmlText = await res.text();
      if (xmlText.includes('ErrCount="0"') || xmlText.includes('IsSuccess="true"')) {
        console.log('✅ SUCCESS! All 4 DNS records for book-it.tech updated automatically on Namecheap!');
        return;
      }
      const errors = [...xmlText.matchAll(/<Error[^>]*>([^<]+)<\/Error>/g)].map((m) => m[1]);
      console.warn('⚠️ Namecheap API notice:', errors.join(' | ') || xmlText);
    } catch (err) {
      console.warn('⚠️ Namecheap API call failed:', err.message);
    }
  } else {
    console.log('ℹ️ Namecheap API key not found in local .env — use the 4 records above in Namecheap -> Domain List -> book-it.tech -> Advanced DNS.');
  }
}

run();
