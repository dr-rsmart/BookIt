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
| `admin@bookingtrack.com` | `admin@timetrack.com` | `admin` | `Password123` | Diana Prince — **Sandton Medical & Family Clinic** (Doctor, Sandton) |
| `thabo@bookingtrack.com` | `thabo@timetrack.com` | `manager` | `Password123` | Thabo Mokoena — **Atelier Hair & Beauty Studio** (Salon, Rosebank) |
| `ayesha@bookingtrack.com` | `ayesha@timetrack.com` | `manager` | `Password123` | Ayesha Pillay — **Cape Auto Precision Mechanics** (Mechanic, Cape Town) |
| `pieter@bookingtrack.com` | `pieter@timetrack.com` | `admin` | `Password123` | Pieter van der Merwe — **Waterfront Dental Studio** (Dentist, Cape Town) |
| `naledi@bookingtrack.com` | `naledi@timetrack.com` | `admin` | `Password123` | Naledi Khumalo — **Fynbos Botanical Spa & Wellness** (Spa & Wellness, Stellenbosch) |
| `riaan@bookingtrack.com` | `riaan@timetrack.com` | `admin` | `Password123` | Riaan Botha — **Highveld Performance Fitness** (Fitness, Pretoria) |
| `sipho@bookingtrack.com` | `sipho@timetrack.com` | `customer` | `Password123` | Sipho Ndlovu — Customer with upcoming & completed appointments |
| `lerato@bookingtrack.com` | `lerato@timetrack.com` | `customer` | `Password123` | Lerato Dlamini — Customer with pending & completed appointments |

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
