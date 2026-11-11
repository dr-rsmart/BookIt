#!/usr/bin/env node
/**
 * BookIt! Store & Mobile Documentation Screenshot Generator
 * ---------------------------------------------------------
 * Mirrors TimeTrack's capture-store-screenshots.mjs workflow to capture
 * high-resolution screenshots of all key screens across Android and iOS
 * device profiles, plus store graphics assets.
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5175';

const STORE_PROFILES = [
  // ── 1. Android Phone (Modern 20:9 Aspect Ratio — 1080 x 2400 px) ──
  {
    id: 'android-phone-1080x2400',
    os: 'Android',
    label: 'Android Phone 20:9 (1080x2400)',
    folder: 'store-assets/android/phone-1080x2400',
    viewport: { width: 360, height: 800 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  // ── 2. Android 7" Tablet (1200 x 1920 px) ──
  {
    id: 'android-tablet-7in',
    os: 'Android',
    label: 'Android 7" Tablet (1200x1920)',
    folder: 'store-assets/android/tablet-7in',
    viewport: { width: 600, height: 960 },
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: true,
  },
  // ── 3. Android 10" Tablet (1600 x 2560 px) ──
  {
    id: 'android-tablet-10in',
    os: 'Android',
    label: 'Android 10" Tablet (1600x2560)',
    folder: 'store-assets/android/tablet-10in',
    viewport: { width: 800, height: 1280 },
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: true,
  },
  // ── 4. iOS 6.7" Super Retina XDR (iPhone 16 Pro Max — 1290 x 2796 px) ──
  {
    id: 'ios-iphone-6.7',
    os: 'iOS',
    label: 'iOS iPhone 6.7" Super Retina XDR (1290x2796)',
    folder: 'store-assets/ios/iphone-6.7',
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  // ── 5. iOS 5.5" Retina Display (iPhone 8 Plus — 1242 x 2208 px) ──
  {
    id: 'ios-iphone-5.5',
    os: 'iOS',
    label: 'iOS iPhone 5.5" Retina Display (1242x2208)',
    folder: 'store-assets/ios/iphone-5.5',
    viewport: { width: 414, height: 736 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  // ── 6. iOS 12.9" iPad Pro (2048 x 2732 px) ──
  {
    id: 'ios-ipad-12.9',
    os: 'iOS',
    label: 'iOS iPad Pro 12.9" Display (2048x2732)',
    folder: 'store-assets/ios/ipad-12.9',
    viewport: { width: 1024, height: 1366 },
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: true,
  },
];

async function generateGraphicsAssets(browser) {
  console.log('\n🎨 Exporting BookIt! App Icons & Feature Graphics...');
  const graphicsDir = path.resolve(process.cwd(), 'store-assets/graphics');
  fs.mkdirSync(graphicsDir, { recursive: true });

  const iconSvg = fs.readFileSync(path.resolve(process.cwd(), 'public/icon.svg'), 'utf8');
  const logoSvg = fs.readFileSync(path.resolve(process.cwd(), 'public/logo.svg'), 'utf8');
  const iconDataUri = `data:image/svg+xml;base64,${Buffer.from(iconSvg).toString('base64')}`;
  const logoDataUri = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`;

  // 1. Google Play 512x512 App Icon
  const icon512 = await browser.newPage({
    viewport: { width: 512, height: 512 },
    deviceScaleFactor: 1,
  });
  await icon512.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: 512px;
            height: 512px;
            background: #FEECE8;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          img { width: 460px; height: 460px; object-fit: contain; }
        </style>
      </head>
      <body><img src="${iconDataUri}" alt="BookIt! Icon" /></body>
    </html>
  `);
  await icon512.screenshot({ path: path.join(graphicsDir, 'app-icon-512x512.png') });
  await icon512.close();
  console.log('  ✅ Exported store-assets/graphics/app-icon-512x512.png (512x512)');

  // 2. Apple App Store 1024x1024 App Icon
  const icon1024 = await browser.newPage({
    viewport: { width: 1024, height: 1024 },
    deviceScaleFactor: 1,
  });
  await icon1024.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: 1024px;
            height: 1024px;
            background: #FEECE8;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          img { width: 920px; height: 920px; object-fit: contain; }
        </style>
      </head>
      <body><img src="${iconDataUri}" alt="BookIt! Icon 1024" /></body>
    </html>
  `);
  await icon1024.screenshot({ path: path.join(graphicsDir, 'app-icon-1024x1024.png') });
  await icon1024.close();
  console.log('  ✅ Exported store-assets/graphics/app-icon-1024x1024.png (1024x1024)');

  // 3. Google Play Feature Graphic (1024x500)
  const featurePage = await browser.newPage({
    viewport: { width: 1024, height: 500 },
    deviceScaleFactor: 1,
  });
  await featurePage.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
          body {
            width: 1024px;
            height: 500px;
            background: linear-gradient(135deg, #FDEBE7 0%, #FFF7F5 55%, #FFE0D8 100%);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 64px;
            color: #291822;
            overflow: hidden;
          }
          .left { max-width: 540px; }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(238, 54, 28, 0.12);
            border: 1px solid rgba(238, 54, 28, 0.3);
            color: #EE361C;
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 18px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
          }
          h1 {
            font-size: 42px;
            font-weight: 800;
            line-height: 1.12;
            margin-bottom: 14px;
            letter-spacing: -0.02em;
            color: #291822;
          }
          h1 span { color: #EE361C; }
          p {
            font-size: 17px;
            color: #57454F;
            line-height: 1.5;
          }
          .right {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .logo-card {
            width: 320px;
            height: 220px;
            background: #FFFFFF;
            border-radius: 32px;
            padding: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 24px 48px rgba(41, 24, 34, 0.12), 0 0 0 1px rgba(238, 54, 28, 0.14);
          }
          .logo-card img { width: 100%; height: 100%; object-fit: contain; }
        </style>
      </head>
      <body>
        <div class="left">
          <div class="badge">Appointments, Simplified</div>
          <h1>Book Trusted Pros Across <span>South Africa</span></h1>
          <p>Doctors, salons, mechanics, dentists & spas — pick a service, choose your specialist, and reserve an open slot in seconds.</p>
        </div>
        <div class="right">
          <div class="logo-card">
            <img src="${logoDataUri}" alt="BookIt! Logo" />
          </div>
        </div>
      </body>
    </html>
  `);
  await featurePage.screenshot({ path: path.join(graphicsDir, 'feature-graphic-1024x500.png') });
  await featurePage.close();
  console.log('  ✅ Exported store-assets/graphics/feature-graphic-1024x500.png (1024x500)');
}

async function loginAs(page, email, password = 'Password123') {
  await page.goto('/login');
  await page.waitForSelector('#email', { timeout: 10_000 });
  await page.fill('#email', email);
  await page.fill('#password', password);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/auth/login') && r.status() === 200),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(700);
}

async function logoutSession(page) {
  await page.evaluate(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  });
  await page.waitForTimeout(300);
}

async function captureProfile(browser, dev) {
  console.log(`\n======================================================`);
  console.log(`📱 ${dev.label}`);
  console.log(`======================================================`);

  const targetDir = path.resolve(process.cwd(), dev.folder);
  fs.mkdirSync(targetDir, { recursive: true });

  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: dev.viewport,
    deviceScaleFactor: dev.deviceScaleFactor,
    isMobile: dev.isMobile,
    hasTouch: dev.hasTouch,
  });

  const page = await context.newPage();

  try {
    // ── 01. Public Browse Directory ──
    console.log('  [01/15] 01_Browse_Directory.png');
    await page.goto('/');
    await page.waitForSelector('a[href^="/providers/"]', { timeout: 10_000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(targetDir, '01_Browse_Directory.png') });

    // ── 02. Public Provider Profile ──
    console.log('  [02/15] 02_Provider_Profile.png');
    const firstProviderHref = await page
      .locator('a[href^="/providers/"]')
      .first()
      .getAttribute('href');
    await page.goto(firstProviderHref || '/');
    await page.waitForSelector('h1', { timeout: 10_000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(targetDir, '02_Provider_Profile.png') });

    // ── 03. 4-Step Booking Wizard ──
    console.log('  [03/15] 03_Booking_Wizard.png');
    if (firstProviderHref) {
      await page.goto(`${firstProviderHref}/book`);
      await page.waitForSelector('h1', { timeout: 10_000 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(targetDir, '03_Booking_Wizard.png') });
    }

    // ── 04. Login Screen ──
    console.log('  [04/15] 04_Login.png');
    await page.goto('/login');
    await page.waitForSelector('#email', { timeout: 10_000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(targetDir, '04_Login.png') });

    // ── 05. Register Screen ──
    console.log('  [05/15] 05_Register.png');
    await page.goto('/register');
    await page.waitForSelector('#email', { timeout: 10_000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(targetDir, '05_Register.png') });

    // ── 06. Customer My Bookings ──
    console.log('  [06/15] 06_Customer_My_Bookings.png');
    await loginAs(page, 'sipho@bookingtrack.com');
    await page.goto('/my-bookings');
    await page.waitForSelector('h1', { timeout: 10_000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(targetDir, '06_Customer_My_Bookings.png') });
    await logoutSession(page);

    // ── 07. Business Dashboard Overview & KPIs ──
    console.log('  [07/15] 07_Dashboard_Overview.png');
    await loginAs(page, 'admin@bookingtrack.com');
    await page.goto('/dashboard');
    await page.waitForSelector('h1', { timeout: 10_000 });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(targetDir, '07_Dashboard_Overview.png') });

    // ── 08. Availability & Slot Management ──
    console.log('  [08/15] 08_Dashboard_Availability.png');
    await page.goto('/dashboard/availability');
    await page.waitForSelector('h1', { timeout: 10_000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(targetDir, '08_Dashboard_Availability.png') });

    // ── 09. Services & ZAR Rates Management ──
    console.log('  [09/15] 09_Dashboard_Services.png');
    await page.goto('/dashboard/services');
    await page.waitForSelector('h1', { timeout: 10_000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(targetDir, '09_Dashboard_Services.png') });

    // ── 10. Team & Professionals Management ──
    console.log('  [10/15] 10_Dashboard_Team.png');
    await page.goto('/dashboard/team');
    await page.waitForSelector('h1', { timeout: 10_000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(targetDir, '10_Dashboard_Team.png') });

    // ── 11. Business Settings & Working Hours ──
    console.log('  [11/15] 11_Business_Settings_Profile.png');
    await page.goto('/dashboard/profile');
    await page.waitForSelector('h1', { timeout: 10_000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(targetDir, '11_Business_Settings_Profile.png') });

    // ── 12. Personal Account Profile & Security Settings ──
    console.log('  [12/15] 12_Account_Settings_Profile.png');
    await page.goto('/profile');
    await page.waitForSelector('h1', { timeout: 10_000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(targetDir, '12_Account_Settings_Profile.png') });
    await logoutSession(page);

    // ── 13. Platform Master Console ──
    console.log('  [13/15] 13_Master_Console.png');
    await loginAs(page, 'master@smartpatel.co.za');
    await page.goto('/master');
    await page.waitForSelector('h1', { timeout: 10_000 });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(targetDir, '13_Master_Console.png') });

    // ── 14. Immutable Audit Trail ──
    console.log('  [14/15] 14_Immutable_Audit_Trail.png');
    await page.goto('/audit');
    await page.waitForSelector('h1', { timeout: 10_000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(targetDir, '14_Immutable_Audit_Trail.png') });

    // ── 15. Platform Simulator ──
    console.log('  [15/15] 15_Platform_Simulator.png');
    await page.goto('/demo');
    await page.waitForSelector('h1', { timeout: 10_000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(targetDir, '15_Platform_Simulator.png') });

    console.log(`  ✨ Captured all 15 screens for ${dev.label}!`);
  } finally {
    await context.close();
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    await generateGraphicsAssets(browser);
    for (const dev of STORE_PROFILES) {
      await captureProfile(browser, dev);
    }
  } finally {
    await browser.close();
  }
  console.log('\n🎉 All Android & iOS screenshot sets and store graphics generated in store-assets/!');
}

main().catch((err) => {
  console.error('❌ Screenshot capture failed:', err);
  process.exit(1);
});
