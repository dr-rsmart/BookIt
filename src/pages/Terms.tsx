/**
 * Terms of Service & End-User License Agreement (`/terms`)
 * --------------------------------------------------------
 * Covers Platform Role, Medical/Healthcare Disclaimers (Apple 1.4.1 / Google Play Health),
 * Real-World In-Person Payment Terms (Apple 3.1.3(e)), Cancellations, and UGC Rules (Apple 1.2).
 */

import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, HeartPulse, Banknote, ShieldAlert } from 'lucide-react';

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to BookIt!
      </Link>

      <div className="flex items-center gap-2 text-primary">
        <FileText className="h-5 w-5" />
        <span className="text-xs font-semibold uppercase tracking-widest">
          Legal & Platform Terms
        </span>
      </div>

      <h1 className="font-display text-3xl text-foreground">
        Terms of Service & End-User Agreement
      </h1>
      <p className="text-xs text-muted-foreground">
        Effective Date: 16 November 2026 · Governed by the laws of the Republic of South Africa
      </p>

      <div className="space-y-6 rounded-3xl border border-border bg-card p-6 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="font-display text-lg text-foreground">
            1. Platform Role & Independent Service Providers
          </h2>
          <p>
            BookIt! provides a multi-tenant appointment scheduling and directory platform connecting
            customers with independent South African businesses and professionals (including doctors,
            dentists, salons, mechanics, spas, and fitness coaches). BookIt! does not itself employ
            listed professionals or perform the underlying services. Each listed business is solely
            responsible for the quality, safety, licensing, and delivery of its services.
          </p>
        </section>

        <section className="space-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <HeartPulse className="h-4 w-4 text-primary" />
            <h2 className="font-display text-base">
              2. Medical & Healthcare Scheduling Disclaimer
            </h2>
          </div>
          <p>
            <strong>No Medical Advice or Emergency Triage:</strong> BookIt! is strictly an
            administrative scheduling tool. Content, service descriptions, and practitioner profiles
            under the <em>Doctors</em>, <em>Dentists</em>, and <em>Spa & Wellness</em> categories are
            provided for scheduling convenience only and do not constitute medical advice, clinical
            diagnosis, or treatment recommendations.
          </p>
          <p>
            <strong>Medical Emergencies:</strong> Do not use BookIt! for urgent or life-threatening
            medical conditions. In a medical emergency in South Africa, call{' '}
            <strong>10177</strong> (National Emergency Medical Services) or <strong>112</strong>{' '}
            from any mobile phone, or proceed immediately to the nearest hospital emergency
            department.
          </p>
          <p>
            <strong>Practitioner Registration:</strong> Healthcare professionals listing medical or
            dental services represent and warrant that they hold active, valid registration with the
            Health Professions Council of South Africa (HPCSA) or relevant statutory council.
          </p>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Banknote className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg">
              3. Pricing & In-Person Payment Terms
            </h2>
          </div>
          <p>
            All service prices displayed on BookIt! are quoted in South African Rand (ZAR /{' '}
            <code>R</code>) by the respective business provider for real-world, in-person physical
            services. <strong>BookIt! does not process in-app payments or charge booking fees</strong>{' '}
            within the mobile or web application. Payment for completed appointments is settled
            directly in person with the service provider at their physical premises (via cash, card,
            EFT, or medical aid, as accepted by that business).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg text-foreground">
            4. Bookings, Cancellations & Slot Release
          </h2>
          <p>
            When you confirm an appointment, the time slot is atomically reserved for you. If you
            can no longer attend, you may cancel your booking at any time via{' '}
            <Link to="/my-bookings" className="text-primary underline">
              My Bookings
            </Link>
            , which immediately releases the slot for other customers. Repeated unannounced
            no-shows may result in booking restrictions by the service provider.
          </p>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldAlert className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg">
              5. User-Generated Business Listings & Acceptable Use
            </h2>
          </div>
          <p>
            Business owners and managers who publish business profiles, service descriptions, cover
            photos, or team member avatars agree not to upload unlawful, fraudulent, defamatory,
            infringing, or sexually explicit content, and not to impersonate any person or licensed
            healthcare facility.
          </p>
          <p>
            Users can flag any suspicious or inappropriate business listing using the{' '}
            <strong>Report listing</strong> button on any provider profile page. Our Trust & Safety
            team reviews all reports within 24 hours and immediately suspends or removes violating
            listings and accounts.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg text-foreground">
            6. Account Deletion & Contact
          </h2>
          <p>
            You may permanently delete your BookIt! account and personal data at any time from your{' '}
            <Link to="/profile" className="text-primary underline">
              Account & Security Profile
            </Link>{' '}
            or review our{' '}
            <Link to="/privacy" className="text-primary underline">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link to="/support" className="text-primary underline">
              Support Center
            </Link>{' '}
            for assistance.
          </p>
        </section>
      </div>
    </div>
  );
}
