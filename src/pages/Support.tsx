/**
 * Support Page (`/support`)
 */

import { Link } from 'react-router-dom';
import { ArrowLeft, LifeBuoy, Mail, Phone } from 'lucide-react';

export default function Support() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to BookIt!
      </Link>
      <div className="flex items-center gap-2 text-primary">
        <LifeBuoy className="h-5 w-5" />
        <span className="text-xs font-semibold uppercase tracking-widest">Help & Support</span>
      </div>
      <h1 className="font-display text-3xl text-foreground">BookIt! Support</h1>
      <div className="space-y-4 rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">
        <p>
          Need help with an upcoming appointment, listing your business, or managing your team’s
          availability slots? Reach our South African support team:
        </p>
        <ul className="space-y-2 text-foreground">
          <li className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" /> support@bookit.co.za
          </li>
          <li className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" /> +27 11 555 0100 (Mon–Fri, 08:00–17:00 SAST)
          </li>
        </ul>
      </div>
    </div>
  );
}
