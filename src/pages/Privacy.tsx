/**
 * Privacy Policy Page (`/privacy`)
 */

import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

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
        <span className="text-xs font-semibold uppercase tracking-widest">POPIA & GDPR</span>
      </div>
      <h1 className="font-display text-3xl text-foreground">Privacy Policy</h1>
      <div className="space-y-4 rounded-3xl border border-border bg-card p-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          BookIt! processes personal information (name, contact email, phone number, and
          appointment history) strictly for scheduling appointments between customers and listed
          service providers across South Africa in accordance with the Protection of Personal
          Information Act (POPIA).
        </p>
        <p>
          Session tokens are stored in httpOnly cookies, passwords are hashed with bcrypt, and
          audit logs redact client IP addresses for non-administrative viewers.
        </p>
      </div>
    </div>
  );
}
