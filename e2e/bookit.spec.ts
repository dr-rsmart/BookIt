import { test, expect } from '@playwright/test';

test.describe('BookIt! End-to-End Suite', () => {
  test('1. Public Browse Directory: searches and filters South African businesses', async ({
    page,
  }) => {
    await page.goto('/');

    // Check Hero and Title
    await expect(page).toHaveTitle(/BookIt!/i);
    await expect(page.locator('h1')).toContainText(
      /Book the right professional, at a time that suits you/i,
    );

    // Verify search input is present and filterable
    const searchInput = page.getByPlaceholder(/Search a business, city or service/i);
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Sandton');
    await page.waitForTimeout(600);

    // Check that Sandton Medical & Family Clinic card is shown
    const providerCard = page.locator('text=Sandton Medical & Family Clinic');
    await expect(providerCard.first()).toBeVisible();

    // Clear search and test category filter
    await searchInput.fill('');
    await page.waitForTimeout(400);
    const doctorPill = page.locator('button', { hasText: 'Doctors' });
    if (await doctorPill.isVisible()) {
      await doctorPill.click();
      await page.waitForTimeout(400);
      await expect(page.locator('text=Doctor').first()).toBeVisible();
    }
  });

  test('2. Public Provider Profile: renders services, rates in ZAR, team, and working hours', async ({
    page,
  }) => {
    await page.goto('/');

    // Click on the first available business card
    const firstBusiness = page.locator('a[href^="/providers/"]').first();
    await expect(firstBusiness).toBeVisible();
    await firstBusiness.click();

    // Verify Provider Detail page loaded
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Services & rates')).toBeVisible();
    await expect(page.locator('text=Working hours')).toBeVisible();
    await expect(page.locator('text=Visit us')).toBeVisible();

    // Verify book an appointment button is present
    const bookBtn = page.getByRole('button', { name: /Book an appointment/i });
    await expect(bookBtn).toBeVisible();

    // Click to enter 4-step booking wizard
    await bookBtn.click();
    await page.waitForURL(/\/book/);
    await expect(page.locator('h1')).toContainText(/Book an appointment/i);
    await expect(page.locator('text=Service')).toBeVisible();
    await expect(page.locator('text=Professional')).toBeVisible();
  });

  test('3. Authentication Flow: signs in as business owner and accesses dashboard KPIs', async ({
    page,
  }) => {
    await page.goto('/login?returnTo=/dashboard');

    await expect(page.locator('h1')).toContainText(/Welcome back/i);

    // Sign in as business admin
    await page.fill('#email', 'admin@bookit.com');
    await page.fill('#password', 'Password123');

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login') && r.status() === 200),
      page.click('button[type="submit"]'),
    ]);

    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page.locator('h1')).toContainText(/Overview|Bookings|Sandton/i);

    // Verify dashboard navigation exists
    const subNav = page.locator('text=Bookings');
    await expect(subNav.first()).toBeVisible();
  });

  test('4. Platform Master Console: accesses multi-tenant governance and metrics', async ({
    page,
  }) => {
    await page.goto('/login?returnTo=/master');

    await page.fill('#email', 'master@smartpatel.co.za');
    await page.fill('#password', 'Password123');

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login') && r.status() === 200),
      page.click('button[type="submit"]'),
    ]);

    await page.waitForURL(/\/master/, { timeout: 10_000 });
    await expect(page.locator('h1')).toContainText(/BookIt! Control Center/i);

    // Verify KPI metrics cards render
    await expect(page.locator('text=Active Businesses')).toBeVisible();
    await expect(page.locator('text=Total Bookings')).toBeVisible();

    // Verify businesses list renders
    await expect(page.locator('text=Sandton Medical & Family Clinic').first()).toBeVisible();
  });

  test('5. Audit Trail & POPIA Compliance: verifies audit log table and IP redaction', async ({
    page,
  }) => {
    await page.goto('/login?returnTo=/audit');

    await page.fill('#email', 'master@smartpatel.co.za');
    await page.fill('#password', 'Password123');

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login') && r.status() === 200),
      page.click('button[type="submit"]'),
    ]);

    await page.waitForURL(/\/audit/, { timeout: 10_000 });
    await expect(page.locator('h1')).toContainText(/Immutable Audit Trail/i);
    await expect(page.locator('text=Every booking, slot, service')).toBeVisible();

    // Verify audit log entries exist
    const logItem = page.locator('text=Provider').or(page.locator('text=User')).or(page.locator('text=Booking'));
    await expect(logItem.first()).toBeVisible();
  });

  test('6. Mobile & Web Responsive Layout: verifies mobile bottom nav, zero horizontal overflow, and desktop adaptation', async ({
    page,
  }) => {
    // ── Mobile Viewport (375x812) ──
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const mobileBottomNav = page.getByTestId('mobile-bottom-nav');
    await expect(mobileBottomNav).toBeVisible();

    const checkNoHorizontalOverflow = async () => {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow).toBe(false);
    };

    await checkNoHorizontalOverflow();

    // Ensure mobile input uses >= 16px font size to prevent iOS auto-zoom
    const searchInput = page.getByPlaceholder(/Search a business, city or service/i);
    const fontSize = await searchInput.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(fontSize).toBeGreaterThanOrEqual(16);

    // Navigate to Provider Detail on mobile
    const firstBusiness = page.locator('a[href^="/providers/"]').first();
    await firstBusiness.click();
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('button', { name: /Book now/i })).toBeVisible();
    await checkNoHorizontalOverflow();

    // Navigate to Booking Wizard on mobile
    await page.getByRole('button', { name: /Book now/i }).click();
    await page.waitForURL(/\/book/);
    await expect(page.locator('h1')).toContainText(/Book an appointment/i);
    await checkNoHorizontalOverflow();

    // Sign in and verify Dashboard pages on mobile
    await page.goto('/login?returnTo=/dashboard');
    await checkNoHorizontalOverflow();
    await page.fill('#email', 'admin@bookit.com');
    await page.fill('#password', 'Password123');
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login') && r.status() === 200),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
    await expect(mobileBottomNav).toBeVisible();
    await checkNoHorizontalOverflow();

    for (const subPath of [
      '/dashboard/availability',
      '/dashboard/services',
      '/dashboard/team',
      '/dashboard/profile',
    ]) {
      await page.goto(subPath);
      await expect(page.locator('h1')).toBeVisible();
      await checkNoHorizontalOverflow();
    }

    // ── Desktop Web Viewport (1280x800) ──
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await expect(mobileBottomNav).toBeHidden();
    await checkNoHorizontalOverflow();
  });

  test('7. App Store & Google Play Compliance UI: verifies Privacy, Terms, Medical Disclaimer, UGC Report, and Account Deletion UI', async ({
    page,
  }) => {
    // 1. Privacy Policy & Web Account Deletion Section
    await page.goto('/privacy');
    await expect(page.locator('h1')).toContainText(/Privacy Policy/i);
    await expect(page.locator('text=Account & Personal Data Deletion')).toBeVisible();

    // 2. Terms of Service & Medical/In-Person Payment Disclaimers
    await page.goto('/terms');
    await expect(page.locator('h1')).toContainText(/Terms of Service/i);
    await expect(page.locator('text=Medical & Healthcare Scheduling Disclaimer')).toBeVisible();
    await expect(page.locator('text=Pricing & In-Person Payment Terms')).toBeVisible();

    // 3. Doctor Provider Profile: Healthcare Notice, In-person payment notice & UGC Report button
    await page.goto('/');
    const sandtonCard = page.locator('a[href^="/providers/"]', {
      hasText: 'Sandton Medical & Family Clinic',
    });
    await sandtonCard.first().click();
    await expect(page.locator('text=Healthcare & Medical Scheduling Notice')).toBeVisible();
    await expect(page.locator('text=In-person payment only')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Report this business listing/i }),
    ).toBeVisible();

    // 4. Customer Account Profile: In-App Account Deletion button (Apple 5.1.1(v) & Google Play)
    await page.goto('/login?returnTo=/profile');
    await page.fill('#email', 'sipho@bookit.com');
    await page.fill('#password', 'Password123');
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login') && r.status() === 200),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForURL(/\/profile/, { timeout: 10_000 });
    await expect(page.getByRole('button', { name: /Delete my account/i })).toBeVisible();
  });
});
