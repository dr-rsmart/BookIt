/**
 * Privacy Policy Page (`/privacy`)
 * --------------------------------
 * Compliant with South African POPIA, EU/UK GDPR, Apple App Store Guideline 5.1.1,
 * and Google Play Store User Data & Data Safety requirements (including Web Account Deletion).
 */

import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Trash2, Lock, Share2, HeartPulse } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to BookIt!
      </Link>
      <div className="flex items-center gap-2 text-primary">
        <Shield className="h-5 w-5" />
        <span className="text-xs font-semibold uppercase tracking-widest">
          POPIA, GDPR & App Store Data Safety
        </span>
      </div>
      <h1 className="font-display text-3xl text-foreground">Privacy Policy</h1>
      <p className="text-xs text-muted-foreground">
        Last Updated: 16 November 2026 · Applies to BookIt! Web, iOS, and Android Applications
      </p>

      <div className="space-y-6 rounded-3xl border border-border bg-card p-6 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="font-display text-lg text-foreground">
            1. Overview & Responsible Party
          </h2>
          <p>
            BookIt! processes personal information strictly for scheduling appointments between
            customers and listed service providers across South Africa in accordance with the
            Protection of Personal Information Act, 2013 (POPIA), the General Data Protection
            Regulation (GDPR), Apple App Store Review Guideline 5.1, and Google Play User Data
            Policies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg text-foreground">
            2. Personal Data We Collect
          </h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Account & Contact Information:</strong> Full name, email address,optional
              phone number, and bcrypt-hashed password when you register or update your profile.
            </li>
            <li>
              <strong>Appointment & Booking Records:</strong> Selected business provider, service,
              practitioner, appointment date and time slot, and optional scheduling notes you enter.
            </li>
            <li>
              <strong>Business & Team Profile Media:</strong> Cover images and practitioner profile
              photos voluntarily uploaded by business administrators using the system photo picker.
            </li>
            <li>
              <strong>Security & Audit Metadata:</strong> Authentication timestamps, role changes,
              and client IP addresses (automatically redacted to network prefixes for
              non-administrative viewers in accordance with POPIA data minimization).
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Share2 className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg">
              3. How We Use & Share Your Information
            </h2>
          </div>
          <p>
            When you reserve an appointment slot, your name, contact email, phone number, chosen
            service, and booking notes are shared solely with the specific{' '}
            <strong>Service Provider (Business)</strong> and assigned{' '}
            <strong>Professional</strong> you selected so they can fulfill your appointment and send
            reminders.
          </p>
          <p>
            <strong>No Third-Party Tracking or Data Sales:</strong> BookIt! does not sell, rent, or
            share your personal data with third-party data brokers or advertising networks, and
            does not track you across third-party apps or websites (`NSPrivacyTracking: false`).
          </p>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <HeartPulse className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg">
              4. Healthcare & Medical Appointments
            </h2>
          </div>
          <p>
            For appointments booked with providers in the <em>Doctor</em> or <em>Dentist</em>{' '}
            categories, BookIt! processes only administrative scheduling metadata (chosen service
            type, practitioner, and date/time). Please do not enter sensitive clinical histories or
            emergency symptoms in the optional booking notes field.
          </p>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Lock className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg">
              5. Data Security, Permissions & Retention
            </h2>
          </div>
          <p>
            All network traffic is encrypted in transit via TLS/HTTPS. Session tokens are stored in
            <code>httpOnly</code> cookies on web and hardware-backed encrypted storage on mobile,
            passwords are hashed with bcrypt, and audit logs redact client IP addresses for
            non-administrative viewers.
          </p>
          <p>
            On Android and iOS, photo uploads for business cover photos and practitioner avatars use
            the operating system’s one-time Photo Picker without requesting broad background access
            to your photo library.
          </p>
        </section>

        <section
          id="delete-account"
          className="space-y-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4"
        >
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Trash2 className="h-4 w-4 text-destructive" />
            <h2 className="font-display text-base">
              6. Account & Personal Data Deletion (In-App & Web)
            </h2>
          </div>
          <p>
            You have the right to permanently delete your BookIt! account and erase your personal
            data at any time:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Instant In-App / Web Self-Service Deletion:</strong> Sign in and go to{' '}
              <Link to="/profile" className="font-semibold text-primary underline">
                Account & Security Profile (/profile)
              </Link>{' '}
              → <strong>Delete Account</strong>. Confirming deletion immediately cancels any
              upcoming appointments (releasing the time slots), anonymizes historical booking and
              audit records, and permanently deletes your user account.
            </li>
            <li>
              <strong>Web Deletion Request Without Reinstalling the App:</strong> You can sign in
              directly on the web at{' '}
              <Link to="/login?returnTo=/profile" className="font-semibold text-primary underline">
                /login?returnTo=/profile
              </Link>{' '}
              to delete your account immediately, or submit a deletion request via our{' '}
              <Link to="/support" className="font-semibold text-primary underline">
                Support Page
              </Link>{' '}
              or by emailing <strong>privacy@bookit.co.za</strong> from your registered email
              address.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg text-foreground">
            7. Information Officer & Contact Details
          </h2>
          <p>
            To exercise your POPIA or GDPR rights of access, correction, objection, or erasure,
            contact our Information Officer at <strong>privacy@bookit.co.za</strong> or visit our{' '}
            <Link to="/support" className="text-primary underline">
              Support Center
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

