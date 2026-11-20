# BookIt!

**Multi-tenant appointment booking, professional scheduling, and business management platform across South Africa** — reproducing the `witty-book-flow-now.base44.app` experience like-for-like under the **BookIt!** brand, built on top of **TimeTrack**'s enterprise architecture, RBAC, audit trail, real-time SSE, and security infrastructure.

---

## Architecture & Improvements over Base44

| Area | Base44 Prototype | BookIt! (TimeTrack Architecture) |
| --- | --- | --- |
| **Schema & Typing** | Untyped document collections | Native Prisma PostgreSQL schema (`Role`, `ProviderStatus`, `SlotStatus`, `BookingStatus`) + composite indexes |
| **Slot Reservation** | Separate client-side `Booking.create` + `Slot.update` calls | Atomic Prisma `$transaction` preventing double-booking race conditions and releasing slots automatically on cancellation |
| **Authentication** | Third-party client token | `httpOnly` cookie-first JWT (`bt_token`) + `pwdEpoch` session revocation + forced temporary password rotation |
| **Multi-Tenancy & RBAC** | Flat `owner_email` filter | `master` (cross-tenant platform governance & impersonation), `admin`, `manager`, `employee`, `customer` |
| **Audit Trail** | None | Immutable `AuditLog` with before/after JSON diffs + POPIA IP redaction |
| **Real-Time** | Polling / manual reload | Managed SSE broadcaster (`/api/events`) with heartbeats, per-user connection caps, and live dashboard/booking updates |
| **Observability** | None | Deep health (`/health`), readiness (`/ready`), liveness (`/live`), ping (`/ping`), and Prometheus metrics (`/metrics`) |

---

## Seeded Accounts

All seeded accounts use password: **`Password123`**

| Email | Alias | Role | Password | Business / Persona |
| --- | --- | --- | --- | --- |
| `ricardo@smartpatel.tech` | — | `master` | `ChangeMe123!` | Ricardo Smart — Platform Master (Control Center & Simulator) |
| `raees@smartpatel.tech` | — | `master` | `ChangeMe123!` | Raees Patel — Platform Master (Control Center & Simulator) |
| `master@smartpatel.co.za` | — | `master` | `Password123` | Platform Master (Cross-tenant Control Center & Simulator) |
| `admin@bookit.com` | `admin@timetrack.com` | `admin` | `Password123` | Diana Prince — **Sandton Medical & Family Clinic** (Doctor, Sandton) |
| `thabo@bookit.com` | `thabo@timetrack.com` | `manager` | `Password123` | Thabo Mokoena — **Atelier Hair & Beauty Studio** (Salon, Rosebank) |
| `ayesha@bookit.com` | `ayesha@timetrack.com` | `manager` | `Password123` | Ayesha Pillay — **Cape Auto Precision Mechanics** (Mechanic, Cape Town) |
| `pieter@bookit.com` | `pieter@timetrack.com` | `admin` | `Password123` | Pieter van der Merwe — **Waterfront Dental Studio** (Dentist, Cape Town) |
| `naledi@bookit.com` | `naledi@timetrack.com` | `admin` | `Password123` | Naledi Khumalo — **Fynbos Botanical Spa & Wellness** (Spa & Wellness, Stellenbosch) |
| `riaan@bookit.com` | `riaan@timetrack.com` | `admin` | `Password123` | Riaan Botha — **Highveld Performance Fitness** (Fitness & Classes, Pretoria) |
| `marco@bookit.com` | `marco@timetrack.com` | `admin` | `Password123` | Marco Ferreira — **Southside Padel & Sports Club** (Sport Facilities, Cape Town) |
| `priya@bookit.com` | `priya@timetrack.com` | `admin` | `Password123` | Priya Govender — **Cedar Academic Learning Centre** (Tuition, Umhlanga) |
| `luca@bookit.com` | `luca@timetrack.com` | `admin` | `Password123` | Luca Rossi — **Olive & Ember Courtyard Bistro** (Restaurants & Cafes, Cape Town) |
| `claire@bookit.com` | `claire@timetrack.com` | `admin` | `Password123` | Claire van Zyl — **Poppy & Plate Bespoke Events** (Catering & Events, Parkhurst) |
| `kabelo@bookit.com` | `kabelo@timetrack.com` | `admin` | `Password123` | Kabelo Molefe — **The Courtyard Heritage Venue** (Venues & Spaces, Melrose) |
| `hendrik@bookit.com` | `hendrik@timetrack.com` | `admin` | `Password123` | Hendrik Coetzee — **Oakline Plumbing & Electrical** (Home & Trade Services, Cape Town) |
| `taryn@bookit.com` | `taryn@timetrack.com` | `admin` | `Password123` | Taryn Jenkins — **Paw & Polish Pet Grooming Studio** (Pet Services, Bryanston) |
| `sibusiso@bookit.com` | `sibusiso@timetrack.com` | `admin` | `Password123` | Sibusiso Mabaso — **Frame House Creative Studio** (Photography & Creative Services, Woodstock) |
| `nadia@bookit.com` | `nadia@timetrack.com` | `admin` | `Password123` | Adv. Nadia Abrahams — **Cedar Legal & Financial Advisory** (Professional Consultations, Sandton) |
| `sipho@bookit.com` | `sipho@timetrack.com` | `customer` | `Password123` | Sipho Ndlovu — Customer with upcoming & completed appointments |
| `lerato@bookit.com` | `lerato@timetrack.com` | `customer` | `Password123` | Lerato Dlamini — Customer with pending & completed appointments |

---

## 13 Industry Category Templates

Every business in BookIt! maps to one of **13 industry category templates** (`src/lib/categoryTemplates.ts`), adapting domain terminology (`Team · Offering · Resource · Customer · Booking`), 4-step customer booking intake & ZAR add-ons (`src/components/booking/CategoryBookingIntake.tsx`), and the provider operational workspace board (`src/components/dashboard/CategoryWorkspaceBoard.tsx`):

1. **Hair, Beauty & Wellness** (`Salon`, `Spa & Wellness`) — *Stylists · Treatment · Salon chair · Client · Appointment*
2. **Healthcare** (`Doctor`, `Dentist`) — *Practitioners · Consultation · Consulting room · Patient · Appointment*
3. **Fitness & Classes** (`Fitness`) — *Instructors · Class / session · Studio · Member · Spot*
4. **Sport Facilities** — *Coaches / staff · Court / lane · Court · Player · Slot*
5. **Tuition** — *Tutors · Lesson · Room / online · Student · Lesson*
6. **Restaurants & Cafes** — *Hosts / sections · Sitting · Table · Guest · Reservation*
7. **Catering & Events** — *Coordinators · Package · Event date · Client · Event booking*
8. **Venues & Spaces** — *Coordinators · Space / package · Hall / room · Hirer · Hire booking*
9. **Home & Trade Services** — *Technicians · Call-out / job · Service area · Customer · Call-out*
10. **Automotive** (`Mechanic`) — *Technicians · Service / repair · Workshop bay · Vehicle owner · Workshop booking*
11. **Pet Services** — *Groomers / carers · Groom / stay · Kennel / table · Pet owner · Booking*
12. **Photography & Creative Services** — *Photographers · Shoot package · Studio / location · Client · Shoot*
13. **Professional Consultations** (`Other`) — *Advisors · Consultation · Meeting room / call · Client · Consultation*

---

## Quick Start

```bash
# 1. Install dependencies, push Prisma schema, and seed demo data
npm run setup

# 2. Run API (:4000) and Web (:5173) concurrently
npm run dev
```

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run Express 5 API + Vite web concurrently |
| `npm run setup` | Install root & server deps, push Prisma schema, seed database |
| `npm run seed` | Re-seed South African businesses, slots, bookings & users |
| `npm run build` | Build frontend (`dist/`) and backend (`server/dist/`) |
| `npm run typecheck` | Typecheck frontend and backend |
| `npm test` | Run Vitest unit & API integration suite |
