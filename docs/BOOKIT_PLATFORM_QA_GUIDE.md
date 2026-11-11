# BookIt! — Comprehensive Mobile & Web Platform Q&A, Feature Reference & Troubleshooting Guide (Android & iOS)

**Product:** BookIt! — Multi-Tenant Appointment Booking, Professional Scheduling & Business Management Platform  
**Platforms Covered:** Android (Phones & Tablets), iOS / iPadOS (iPhone & iPad), and Responsive Web  
**Compliance Standard:** South African POPIA & GDPR Aligned  
**Version:** 1.0.0 (2026-11-11)

---

## Table of Contents

1. [Executive Summary & Platform Overview](#1-executive-summary--platform-overview)
2. [Mobile Platform Architecture: Android vs. iOS](#2-mobile-platform-architecture-android-vs-ios)
3. [Screen-by-Screen Feature Walkthrough](#3-screen-by-screen-feature-walkthrough)
4. [Frequently Asked Questions (Q&A) — General & Customers](#4-frequently-asked-questions-qa--general--customers)
5. [Frequently Asked Questions (Q&A) — Business Owners, Managers & Staff](#5-frequently-asked-questions-qa--business-owners-managers--staff)
6. [Platform-Specific Q&A — Android Edition](#6-platform-specific-qa--android-edition)
7. [Platform-Specific Q&A — iOS & iPadOS Edition](#7-platform-specific-qa--ios--ipados-edition)
8. [Troubleshooting Guide (Android, iOS & Web)](#8-troubleshooting-guide-android-ios--web)
9. [Demo Personas & Reference Credentials](#9-demo-personas--reference-credentials)
10. [Visual Screenshot Asset Catalogue](#10-visual-screenshot-asset-catalogue)

---

## 1. Executive Summary & Platform Overview

**BookIt!** is an enterprise-grade, multi-tenant appointment booking and business scheduling platform purpose-built for South African service providers — including **Doctors, Salons, Mechanics, Dentists, Spas & Wellness Centers, and Fitness Studios**.

Built on the **TimeTrack** enterprise architecture, BookIt! combines a consumer-friendly 4-step booking experience with rigorous backend guarantees:
- **Atomic Double-Booking Prevention:** Every booking reservation and cancellation executes inside a PostgreSQL ACID transaction (`prisma.$transaction`), guaranteeing two customers can never claim the same slot simultaneously.
- **Real-Time Server-Sent Events (SSE):** Live updates (`booking:created`, `booking:updated`, `slot:created`, `slot:updated`, `provider:updated`) stream instantaneously to connected Android, iOS, and desktop clients without manual page refreshes.
- **Enterprise RBAC & Governance:** Five distinct roles (`master`, `admin`, `manager`, `employee`, `customer`) with cross-tenant isolation, 1-click Master Impersonation, Platform Simulator, and an immutable POPIA-compliant Audit Trail.
- **South African Localization:** Native `R` (ZAR) currency formatting, `Africa/Johannesburg` (SAST, UTC+2) timezone normalization, and POPIA IP redaction.

---

## 2. Mobile Platform Architecture: Android vs. iOS

BookIt! is engineered mobile-first with platform-specific optimizations for both **Android** and **iOS / iPadOS**:

| Capability / Design Aspect | Android Implementation | iOS & iPadOS Implementation |
| --- | --- | --- |
| **Navigation Pattern** | Fixed thumb-zone bottom navigation bar (`Browse`, `Bookings`, `Dashboard`, `Audit`/`Master`, `Profile`) + horizontal pill sub-navigation on phones (`360×800` @ 3x); adaptive top navigation on 7" & 10" tablets. | Fixed bottom navigation bar with `env(safe-area-inset-bottom)` home-indicator clearance on iPhone (`430×932` & `414×736` @ 3x); full desktop-class top navigation bar on iPad Pro 12.9" (`1024×1366` @ 2x). |
| **Installable App / PWA Support** | Web App Manifest (`manifest.json`) with maskable SVG/PNG icons, `#EE361C` status bar theme color, and home-screen shortcut actions (`Browse Businesses`, `My Bookings`, `Provider Dashboard`). | Apple Touch Icon (`/icon.svg`), `apple-mobile-web-app-capable="yes"`, `apple-mobile-web-app-status-bar-style="black-translucent"`, and `apple-mobile-web-app-title="BookIt!"`. |
| **Input & Keyboard UX** | `touch-action: manipulation` across all interactive controls to eliminate 300ms tap delay; contextual numeric/email/tel virtual keyboards. | All form inputs enforce `>= 16px` (`text-base`) base font size on mobile viewports to prevent iOS Safari automatic viewport zoom on focus. |
| **Safe-Area & Notch Handling** | `viewport-fit=cover` with `.safe-top` and `.safe-bottom` utility classes for punch-hole and gesture-bar Android displays. | Full Dynamic Island and Face ID notch clearance via `env(safe-area-inset-top)` and home-bar padding via `env(safe-area-inset-bottom)`. |
| **Real-Time Stream Resilience** | Automatic SSE reconnection when switching back from background or recovering from mobile data handoffs (`Live` / `Sync` pill in top bar). | Automatic SSE re-handshake on iOS Safari foreground resume (`visibilitychange` / stream recovery) with zero lost state. |

---

## 3. Screen-by-Screen Feature Walkthrough

### 3.1 Public Browse Directory (`/`)
- **Screenshot Reference:** `01_Browse_Directory.png`
- **Features:**
  - Instant search across business name, South African city (e.g., Sandton, Rosebank, Cape Town, Stellenbosch, Pretoria), or service keywords (debounced at 200ms).
  - One-tap category filter pills: **All**, **Doctors**, **Salons**, **Mechanics**, **Dentists**, **Spa & Wellness**, **Fitness**, and **Other**.
  - Business cards displaying cover imagery, category badge, city, and tagline.

### 3.2 Provider Detail Page (`/providers/:id`)
- **Screenshot Reference:** `02_Provider_Profile.png`
- **Features:**
  - Full service catalog with duration (`30 min`, `1h`, `1h 30m`) and South African Rand (`R650`, `R1 450`) pricing.
  - Specialist team cards showing each professional's role, bio, and avatar.
  - 7-day working hours table highlighting closed days.
  - Direct contact links (click-to-call phone number, email, website, street address) and sticky mobile **Book now** bar on phones.

### 3.3 4-Step Appointment Booking Wizard (`/providers/:id/book`)
- **Screenshot Reference:** `03_Booking_Wizard.png`
- **Features:**
  - **Step 1 — Service:** Select the desired treatment, consultation, or workshop service.
  - **Step 2 — Professional:** Choose a specific practitioner assigned to that service, or pick **"Any available"** to view all open slots across the team.
  - **Step 3 — Date & Time:** Browse dates with open slots and tap an available time window.
  - **Step 4 — Your Details:** Auto-populated for signed-in users (or enter Name, Email, Phone, and optional Notes). Submitting atomically books the slot and displays the confirmation summary.

### 3.4 Authentication & Account Recovery (`/login`, `/register`, `/forgot-password`)
- **Screenshot References:** `04_Login.png`, `05_Register.png`
- **Features:**
  - `httpOnly` cookie-based JWT session authentication (`bt_token`).
  - Self-service customer and business owner registration (defaults to `Password123` if left blank for quick onboarding, changeable anytime in Profile).
  - Self-service **Forgot Password** lookup that identifies the user's Business Administrator contact and flags the account for temporary password reset.
  - Prominent banners if a business account is suspended (`COMPANY_SUSPENDED`) or if a session was revoked (`SESSION_REVOKED`).

### 3.5 Customer Portal — My Bookings (`/my-bookings`)
- **Screenshot Reference:** `06_Customer_My_Bookings.png`
- **Features:**
  - Divided into **Upcoming** and **Past & Cancelled** appointments.
  - Relative timing badges (`Today`, `Tomorrow`, `In 3 days`) and automated 24-hour reminder indicators (`Reminder sent`).
  - One-tap **Cancel booking** action that immediately releases the reserved time slot back to the public calendar.

### 3.6 Business Owner & Manager Dashboard (`/dashboard/*`)
- **Screenshot References:** `07_Dashboard_Overview.png`, `08_Dashboard_Availability.png`, `09_Dashboard_Services.png`, `10_Dashboard_Team.png`, `11_Business_Settings_Profile.png`
- **Features:**
  - **Overview (`/dashboard`):** Real-time KPI cards (Today's Appointments, Upcoming Bookings, Confirmed Revenue in ZAR, Open Slots), Today's Schedule feed, and filterable All Bookings management (Confirm, Complete, Cancel).
  - **Availability (`/dashboard/availability`):** Single slot creation plus a **Bulk Slot Generator** (select date range, active weekdays, daily start/end window, slot duration, and professional) with automatic overlap and duplicate filtering.
  - **Services (`/dashboard/services`):** Create, edit, activate/deactivate, or delete services; assign specific professionals who perform each service.
  - **Team (`/dashboard/team`):** Manage doctors, stylists, mechanics, dentists, therapists, and trainers with custom avatars and specialties.
  - **Business Profile (`/dashboard/profile`):** Update business name, category, tagline, description, cover image, South African address, and 7-day working hours, or publish/unpublish (`Published` vs. `Draft`).

### 3.7 Personal Account Profile (`/profile`)
- **Screenshot Reference:** `12_Account_Settings_Profile.png`
- **Features:**
  - View signed-in identity, role badge, and linked business workspace.
  - Change account password with `pwdEpoch` increment — invalidating stale sessions on other devices while keeping the active device signed in via a freshly issued cookie.

### 3.8 Platform Master Governance (`/master`, `/audit`, `/demo`)
- **Screenshot References:** `13_Master_Console.png`, `14_Immutable_Audit_Trail.png`, `15_Platform_Simulator.png`
- **Features:**
  - **BookIt! Control Center (`/master`):** Cross-tenant KPIs, new business onboarding modal (provisions both the Provider and its Admin user), tenant suspension/reactivation toggle, and 1-click **Impersonate** to troubleshoot any business owner's live dashboard.
  - **Immutable Audit Trail (`/audit`):** Searchable, filterable log of every create/update/delete/status change across the platform with before/after JSON diffs and POPIA-redacted IP addresses.
  - **Platform Simulator (`/demo`):** Operator sandbox allowing Master users to switch between 5 pre-configured personas (Master, Clinic Admin, Salon Manager, Mechanic Manager, Customer) with one tap and return to the Master Console via the top banner.

---

## 4. Frequently Asked Questions (Q&A) — General & Customers

### Q1: Do I need an account to browse businesses or book an appointment?
**A:** You can browse all published South African businesses, view their services and ZAR rates, inspect team members, and start the booking wizard without signing in. To finalize a booking or manage your appointments in **My Bookings**, BookIt! prompts you to sign in or create a free account, preserving your exact place in the booking flow via the `returnTo` parameter.

### Q2: How does BookIt! prevent two people from booking the same time slot?
**A:** When you tap **Confirm booking**, the server locks and verifies the slot inside an atomic PostgreSQL transaction. If another customer booked that slot a millisecond earlier, the transaction safely rejects the duplicate request with a `409 Conflict` message and refreshes the available time slots so you can pick another time.

### Q3: What happens when I cancel an appointment?
**A:** Cancelling an appointment in **My Bookings** (or by the business in their Dashboard) atomically updates the booking status to `cancelled` and resets the associated time slot back to `open` so other customers can reserve it.

### Q4: How do appointment reminders work?
**A:** BookIt! runs an automated background maintenance job every 60 seconds (`server/src/cron.ts`) synchronized to South African Standard Time (`Africa/Johannesburg`). Confirmed bookings scheduled within the next 24 hours automatically receive a reminder timestamp (`reminder_sent_at`), displayed as a **Reminder sent** badge on your booking card.

### Q5: How do I switch between Light Mode and Dark Mode?
**A:** Tap the **Sun / Moon** icon in the top header bar on any page (including Login and Register). Your preference is saved locally on your device (`bookingtrack_theme`) and respects your operating system's default appearance until overridden.

---

## 5. Frequently Asked Questions (Q&A) — Business Owners, Managers & Staff

### Q6: How do I list a new business on BookIt!?
**A:** Sign in (or register a new account), tap **For businesses** (or the **Business** icon on the mobile bottom bar), and complete the **List your business** form. Once submitted, your business is immediately published and linked to your account as its Owner/Admin.

### Q7: What is the fastest way to open availability slots for an entire week or month?
**A:** Go to **Dashboard → Availability** and use the **Bulk Slot Generator**:
1. Choose a **Start date** and **End date** (up to 60 days per batch).
2. Select which days of the week to include (e.g., Mon–Fri).
3. Set your daily **Window start** (e.g., `09:00`), **Window end** (e.g., `17:00`), and **Slot length** (e.g., `30 min` or `60 min`).
4. Optionally assign a specific professional.
5. Tap **Generate slots**. BookIt! automatically skips any time windows that overlap existing slots for that professional, generating up to 500 non-overlapping slots in a single batch.

### Q8: Can I temporarily hide my business from the public directory while setting up services?
**A:** Yes. Go to **Dashboard → Business Profile**, change the **Listing status** from `Published` to `Draft`, and save. While in `Draft` mode, only you (and Platform Masters) can view the business; customers browsing the public directory will not see it until you switch it back to `Published`.

### Q9: How do I assign specific services to specific professionals?
**A:** In **Dashboard → Services**, create or edit a service and check the boxes next to the team members who perform that service. If no specific professionals are checked, any active professional on your team can be selected for that service during booking.

### Q10: What happens when a Platform Master suspends a business?
**A:** If a business is suspended in the Master Console (`isActive: false`), all active sessions belonging to users of that business are immediately blocked by the authentication middleware with a `403 COMPANY_SUSPENDED` code, redirecting them to the login screen with a clear "Business Account Suspended" banner.

---

## 6. Platform-Specific Q&A — Android Edition

### Q11: How do I install BookIt! on my Android phone or tablet?
**A:**
1. Open BookIt! in **Google Chrome** (or Microsoft Edge / Samsung Internet) on your Android device.
2. Tap the browser menu (**⋮**) in the top-right corner and select **Add to Home screen** or **Install app**.
3. BookIt! installs as a standalone app (`display: standalone`) with the red-orange **BookIt!** ticket icon and supports long-press **App Shortcuts** (`Browse Businesses`, `My Bookings`, `Provider Dashboard`).

### Q12: How does the navigation adapt between Android phones and Android 7" / 10" tablets?
**A:**
- **Android Phones (`360×800` viewport / `1080×2400` px):** Displays a fixed 5-item bottom navigation bar for effortless one-handed thumb navigation, plus a horizontally scrollable secondary pill bar. On Provider Detail pages, a sticky bottom bar shows the starting ZAR price and a prominent **Book now** button.
- **Android 7" & 10" Tablets (`600×960` and `800×1280` viewports):** Automatically transitions to the full top header navigation bar and multi-column KPI/provider grids while hiding the phone-only bottom bar.

### Q13: Why does the real-time badge briefly change from `Live` to `Sync` on Android?
**A:** Android's Doze Mode or aggressive OEM battery savers (Samsung One UI, Xiaomi MIUI) pause background network sockets when your screen is off. As soon as you bring BookIt! back to the foreground, the SSE hook (`useSSEConnection`) automatically reconnects within 3 seconds and switches the indicator back to emerald **Live**.

---

## 7. Platform-Specific Q&A — iOS & iPadOS Edition

### Q14: How do I install BookIt! to my iPhone or iPad Home Screen?
**A:**
1. Open BookIt! in **Safari** on iOS or iPadOS.
2. Tap the **Share** button (square with an upward arrow) at the bottom of Safari.
3. Scroll down and tap **Add to Home Screen**, then tap **Add**.
4. BookIt! launches full-screen without Safari's address bar, respecting iPhone Dynamic Island/notch safe areas (`safe-top`) and the bottom Home Indicator (`safe-bottom`).

### Q15: Why doesn't the screen zoom in awkwardly when I tap text inputs on iPhone?
**A:** iOS Safari automatically zooms the page if an `<input>`, `<select>`, or `<textarea>` uses a font size smaller than `16px`. All BookIt! mobile inputs are explicitly styled at `16px` (`text-base` on mobile, `md:text-sm` on desktop) and verified by automated Playwright E2E assertions (`fontSize >= 16`).

### Q16: How does BookIt! handle iOS Safari's Intelligent Tracking Prevention (ITP) and cookies?
**A:** BookIt! serves both the React SPA and the `/api` endpoints from the same origin in production and uses first-party `httpOnly`, `SameSite=Lax`, `Secure` cookies (`bt_token`). Because authentication is strictly first-party and same-origin, iOS Safari ITP never blocks or purges your active login session.

---

## 8. Troubleshooting Guide (Android, iOS & Web)

| Symptom / Error Message | Platform | Root Cause | Resolution Steps |
| --- | --- | --- | --- |
| **"Session Ended — Your password was recently changed or your session was revoked"** | All | Your password was changed on another device (incrementing `pwdEpoch`) or an admin reset your password. | Sign in again with your updated password (or `Password123` if reset by an administrator). |
| **"Business Account Suspended"** banner on Login | All | A Platform Master suspended the business workspace (`isActive: false`). | Contact Platform Support (`support@bookit.co.za` or `+27 11 555 0100`) to restore tenant billing/compliance status. |
| **"This time slot has just been booked by someone else"** (`409 SLOT_UNAVAILABLE`) | All | Another customer completed their booking for that exact slot moments before you submitted. | Pick another open time slot from Step 3 of the Booking Wizard; the slot list refreshes automatically. |
| **Top-right badge stays on `Sync` instead of `Live`** | Android / iOS | Device is offline, on a restricted corporate firewall blocking `text/event-stream`, or in Low Data / Battery Saver mode. | Verify internet connectivity and disable Battery Saver for the browser/app. Standard API actions still work normally while in `Sync` mode. |
| **Image upload fails with "Image exceeds 2MB limit"** | Android / iOS | High-resolution camera photo exceeds the 2MB inline payload cap. | Choose a compressed/cropped image (JPEG, PNG, WebP, or GIF under 2MB) or paste a hosted HTTPS image URL. |
| **"Cross-origin request blocked by CSRF protection"** (`403 ACCESS_DENIED`) | Web / API | Request `Origin` header does not match configured `CORS_ORIGIN`. | Access the app via the official domain configured in `CORS_ORIGIN` rather than an unapproved proxy or IP address. |
| **Bulk slot generation reports skipped slots** | All | Requested time windows overlap existing open/booked slots for that professional on the same date. | This is expected safety behavior (`filterNonOverlappingSlots`). Only non-overlapping slots are created. |

---

## 9. Demo Personas & Reference Credentials

All standard demo accounts use password **`Password123`** (Platform Master operator accounts `ricardo@smartpatel.tech` and `raees@smartpatel.tech` use `ChangeMe123!`):

| Persona / Business | Email | Alias Email | Role | Default Password |
| --- | --- | --- | --- | --- |
| **Platform Master** (Control Center & Simulator) | `master@smartpatel.co.za` | — | `master` | `Password123` |
| **Ricardo Smart** (Platform Master Operator) | `ricardo@smartpatel.tech` | — | `master` | `ChangeMe123!` |
| **Raees Patel** (Platform Master Operator) | `raees@smartpatel.tech` | — | `master` | `ChangeMe123!` |
| **Sandton Medical & Family Clinic** (Doctor, Sandton) | `admin@bookingtrack.com` | `admin@timetrack.com` | `admin` | `Password123` |
| **Atelier Hair & Beauty Studio** (Salon, Rosebank) | `thabo@bookingtrack.com` | `thabo@timetrack.com` | `manager` | `Password123` |
| **Cape Auto Precision Mechanics** (Mechanic, Cape Town) | `ayesha@bookingtrack.com` | `ayesha@timetrack.com` | `manager` | `Password123` |
| **Waterfront Dental Studio** (Dentist, Cape Town) | `pieter@bookingtrack.com` | `pieter@timetrack.com` | `admin` | `Password123` |
| **Fynbos Botanical Spa & Wellness** (Spa, Stellenbosch) | `naledi@bookingtrack.com` | `naledi@timetrack.com` | `admin` | `Password123` |
| **Highveld Performance Fitness** (Fitness, Pretoria) | `riaan@bookingtrack.com` | `riaan@timetrack.com` | `admin` | `Password123` |
| **Sipho Ndlovu** (Customer Account) | `sipho@bookingtrack.com` | `sipho@timetrack.com` | `customer` | `Password123` |
| **Lerato Dlamini** (Customer Account) | `lerato@bookingtrack.com` | `lerato@timetrack.com` | `customer` | `Password123` |

---

## 10. Visual Screenshot Asset Catalogue

All screenshots are stored in `store-assets/` organized by OS and form factor:

### Android Screenshot Sets
- **Android Phone 20:9 (`1080×2400` px):** [`store-assets/android/phone-1080x2400/`](../store-assets/android/phone-1080x2400/)
- **Android 7" Tablet (`1200×1920` px):** [`store-assets/android/tablet-7in/`](../store-assets/android/tablet-7in/)
- **Android 10" Tablet (`1600×2560` px):** [`store-assets/android/tablet-10in/`](../store-assets/android/tablet-10in/)

### iOS & iPadOS Screenshot Sets
- **iPhone 6.7" Super Retina XDR (`1290×2796` px):** [`store-assets/ios/iphone-6.7/`](../store-assets/ios/iphone-6.7/)
- **iPhone 5.5" Retina Display (`1242×2208` px):** [`store-assets/ios/iphone-5.5/`](../store-assets/ios/iphone-5.5/)
- **iPad Pro 12.9" Display (`2048×2732` px):** [`store-assets/ios/ipad-12.9/`](../store-assets/ios/ipad-12.9/)

### Store Brand Graphics
- **512×512 Google Play App Icon:** [`store-assets/graphics/app-icon-512x512.png`](../store-assets/graphics/app-icon-512x512.png)
- **1024×1024 Apple App Store Icon:** [`store-assets/graphics/app-icon-1024x1024.png`](../store-assets/graphics/app-icon-1024x1024.png)
- **1024×500 Feature Banner:** [`store-assets/graphics/feature-graphic-1024x500.png`](../store-assets/graphics/feature-graphic-1024x500.png)
