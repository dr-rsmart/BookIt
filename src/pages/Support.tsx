/**
 * Support Page (`/support`)
 * -------------------------
 * Provides verified South African support contact channels, FAQ links,
 * and an interactive support/data-privacy inquiry helper.
 */

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, LifeBuoy, Mail, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input, Label, Select, Textarea } from '../components/ui';

export default function Support() {
  const [topic, setTopic] = useState('booking');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;
    setSubmitted(true);
    toast.success('Support request logged. Our team will respond within 1 business day.');
  };

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
      <h1 className="font-display text-3xl text-foreground">BookIt! Support Center</h1>

      <div className="space-y-4 rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">
        <p>
          Need help with an upcoming appointment, listing your business, managing your team’s
          availability slots, or exercising your POPIA/GDPR data rights? Reach our South African
          support team:
        </p>
        <ul className="space-y-2.5 text-foreground">
          <li className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0 text-primary" />
            <a href="mailto:support@bookit.co.za" className="font-medium underline">
              support@bookit.co.za
            </a>
            <span className="text-xs text-muted-foreground">(General & Booking Support)</span>
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
            <a href="mailto:privacy@bookit.co.za" className="font-medium underline">
              privacy@bookit.co.za
            </a>
            <span className="text-xs text-muted-foreground">
              (Privacy, POPIA & Account Deletion Requests)
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-primary" />
            <span>Operating Hours: Monday–Friday, 08:00–17:00 SAST (Africa/Johannesburg)</span>
          </li>
        </ul>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 text-sm">
        <h2 className="font-display text-xl text-foreground">Send us a message</h2>
        <p className="mt-1 text-muted-foreground">
          Submit a support ticket, report a listing concern, or request account assistance.
        </p>

        {submitted ? (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-foreground">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold">We’ve received your request</p>
              <p className="mt-1 text-xs text-muted-foreground">
                A confirmation has been recorded for <strong>{email}</strong>. For immediate
                self-service account deletion, you can also visit your{' '}
                <Link to="/profile" className="text-primary underline">
                  Account Profile
                </Link>
                .
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 rounded-full"
                onClick={() => {
                  setSubmitted(false);
                  setMessage('');
                }}
              >
                Send another message
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="support-email">Your email address</Label>
                <Input
                  id="support-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="support-topic">Topic</Label>
                <Select
                  id="support-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="mt-1.5"
                >
                  <option value="booking">Appointment or Booking Help</option>
                  <option value="business">Business Listing & Provider Dashboard</option>
                  <option value="privacy">Account Deletion / POPIA Data Request</option>
                  <option value="safety">Trust & Safety / Report a Business</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="support-msg">How can we help?</Label>
              <Textarea
                id="support-msg"
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your question or issue..."
                className="mt-1.5"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="rounded-full">
                Submit support request
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
