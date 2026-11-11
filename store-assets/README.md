# BookIt! Mobile App & Store Assets Directory

This directory contains the complete, production-ready screenshot and brand graphics suite for **BookIt!**, organized by operating system (**Android** and **iOS**) and device form factor for distribution, app store submission, and support documentation.

---

## Directory Structure

```text
store-assets/
├── README.md
├── graphics/
│   ├── app-icon-512x512.png                  # Google Play Store high-res icon (512×512 px)
│   ├── app-icon-1024x1024.png                # Apple App Store icon (1024×1024 px)
│   └── feature-graphic-1024x500.png          # Google Play feature banner (1024×500 px)
├── android/
│   ├── phone-1080x2400/                      # Modern Android 20:9 Phone (1080×2400 px @ 3x)
│   │   ├── 01_Browse_Directory.png
│   │   ├── 02_Provider_Profile.png
│   │   ├── 03_Booking_Wizard.png
│   │   ├── 04_Login.png
│   │   ├── 05_Register.png
│   │   ├── 06_Customer_My_Bookings.png
│   │   ├── 07_Dashboard_Overview.png
│   │   ├── 08_Dashboard_Availability.png
│   │   ├── 09_Dashboard_Services.png
│   │   ├── 10_Dashboard_Team.png
│   │   ├── 11_Business_Settings_Profile.png
│   │   ├── 12_Account_Settings_Profile.png
│   │   ├── 13_Master_Console.png
│   │   ├── 14_Immutable_Audit_Trail.png
│   │   └── 15_Platform_Simulator.png
│   ├── tablet-7in/                           # Android 7" Tablet (1200×1920 px @ 2x)
│   │   └── [01..15 screenshots]
│   └── tablet-10in/                          # Android 10" Tablet (1600×2560 px @ 2x)
│       └── [01..15 screenshots]
└── ios/
    ├── iphone-6.7/                           # iPhone 16 Pro Max 6.7" Super Retina XDR (1290×2796 px @ 3x)
    │   ├── 01_Browse_Directory.png
    │   ├── 02_Provider_Profile.png
    │   ├── 03_Booking_Wizard.png
    │   ├── 04_Login.png
    │   ├── 05_Register.png
    │   ├── 06_Customer_My_Bookings.png
    │   ├── 07_Dashboard_Overview.png
    │   ├── 08_Dashboard_Availability.png
    │   ├── 09_Dashboard_Services.png
    │   ├── 10_Dashboard_Team.png
    │   ├── 11_Business_Settings_Profile.png
    │   ├── 12_Account_Settings_Profile.png
    │   ├── 13_Master_Console.png
    │   ├── 14_Immutable_Audit_Trail.png
    │   └── 15_Platform_Simulator.png
    ├── iphone-5.5/                           # iPhone 8 Plus 5.5" Retina (1242×2208 px @ 3x)
    │   └── [01..15 screenshots]
    └── ipad-12.9/                            # iPad Pro 12.9" 6th Gen (2048×2732 px @ 2x)
        └── [01..15 screenshots]
```

---

## Screen Inventory (15 Captures per Device Profile)

| # | Filename | Route | Persona / Role | Key Features Shown |
| --- | --- | --- | --- | --- |
| 01 | `01_Browse_Directory.png` | `/` | Public / Customer | Hero search bar, category filter pills (Doctors, Salons, Mechanics, Dentists, Spas, Fitness), published South African business cards, mobile bottom navigation bar |
| 02 | `02_Provider_Profile.png` | `/providers/:id` | Public / Customer | Cover banner, business contact info, Services & ZAR rates list, Team specialists, 7-day working hours, sticky mobile "Book now" bar |
| 03 | `03_Booking_Wizard.png` | `/providers/:id/book` | Public / Customer | 4-step interactive appointment booking wizard (Service → Professional → Date & Open Slot → Confirmation) |
| 04 | `04_Login.png` | `/login` | Public | BookIt! brand lockup, email & password sign-in, forgot password lookup link, light/dark theme toggle |
| 05 | `05_Register.png` | `/register` | Public | Customer & business owner self-service registration with default `Password123` convenience option |
| 06 | `06_Customer_My_Bookings.png` | `/my-bookings` | Customer (`sipho@bookingtrack.com`) | Upcoming and past appointments, relative time badges, 24h reminder indicators, instant slot-releasing cancellation |
| 07 | `07_Dashboard_Overview.png` | `/dashboard` | Business Admin (`admin@bookingtrack.com`) | Today's appointments count, upcoming bookings, confirmed revenue in ZAR (`R`), Today's Schedule, All Bookings filterable list |
| 08 | `08_Dashboard_Availability.png` | `/dashboard/availability` | Business Admin | Single slot creator, Bulk Slot Generator (date range, days of week, interval, duration), overlap & duplicate protection |
| 09 | `09_Dashboard_Services.png` | `/dashboard/services` | Business Admin | Service catalog management, duration in minutes, ZAR rate & price notes, assigned professionals, active toggle |
| 10 | `10_Dashboard_Team.png` | `/dashboard/team` | Business Admin | Professional/practitioner roster, specialty title, bio, avatar upload, active status toggle |
| 11 | `11_Business_Settings_Profile.png` | `/dashboard/profile` | Business Admin | Business details, category, South African address, cover image upload, 7-day working hours editor |
| 12 | `12_Account_Settings_Profile.png` | `/profile` | Authenticated User | Personal profile details, role & workspace summary, password change form with live session retention |
| 13 | `13_Master_Console.png` | `/master` | Platform Master (`master@smartpatel.co.za`) | BookIt! Control Center, cross-tenant KPIs, business onboarding modal trigger, tenant activation/suspension, 1-click impersonation |
| 14 | `14_Immutable_Audit_Trail.png` | `/audit` | Platform Master / Admin | POPIA-compliant immutable audit log with entity/action filters, before/after JSON diffs, and redacted IP addresses |
| 15 | `15_Platform_Simulator.png` | `/demo` | Platform Master | 1-click multi-tenant persona simulator (Master, Clinic Admin, Salon Manager, Mechanic Manager, Customer) |

---

## Regenerating Assets

With the local server running (`npm run dev`), regenerate all 90 device screenshots and 3 store graphics at any time via:

```bash
npm run screenshots:store
```
