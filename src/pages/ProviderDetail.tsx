/**
 * Public Business Profile Page (`XT` in Base44)
 * ---------------------------------------------
 * Displays business cover image, category badge, tagline, About,
 * Services & rates, Our professionals, Visit us, and Working hours.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarPlus,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  HeartPulse,
  Banknote,
  Flag,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  providersApi,
  servicesApi,
  professionalsApi,
  type ProviderRecord,
  type ServiceRecord,
  type ProfessionalRecord,
} from '../services/api';
import { Badge, Button, DialogModal, Input, Label, Select, Textarea, Skeleton } from '../components/ui';
import {
  getCategoryMeta,
  formatDuration,
  formatZAR,
  formatTime12,
} from '../lib/utils';
import { useSSE } from '../hooks/useSSE';

export default function ProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<ProviderRecord | null>(null);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState<
    'inappropriate' | 'fraudulent' | 'impersonation' | 'medical_safety' | 'other'
  >('inappropriate');
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [p, s, pro] = await Promise.all([
        providersApi.get(id),
        servicesApi.list({ provider_id: id, active: true, limit: 50 }),
        professionalsApi.list({ provider_id: id, active: true, limit: 50 }),
      ]);
      setProvider(p);
      setServices(s.items);
      setProfessionals(pro.items);
    } catch {
      setProvider(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useSSE(
    [
      'provider:updated',
      'service:created',
      'service:updated',
      'service:deleted',
      'professional:created',
      'professional:updated',
      'professional:deleted',
    ],
    () => {
      void loadData();
    },
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-5 py-10">
        <Skeleton className="h-56 rounded-3xl" />
        <Skeleton className="h-40 rounded-3xl" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-24 text-center">
        <h1 className="font-display text-3xl text-foreground">This business isn’t available</h1>
        <p className="mt-3 text-muted-foreground">
          It may have been removed, or the link is out of date.
        </p>
        <Button className="mt-6 rounded-full" onClick={() => navigate('/')}>
          Back to browsing
        </Button>
      </div>
    );
  }

  const { Icon, label } = getCategoryMeta(provider.category);
  const isHealthcareProvider =
    provider.category === 'Doctor' || provider.category === 'Dentist';
  const fullAddress = [provider.street, provider.city, provider.postcode, provider.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-5 sm:py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All businesses
      </Link>

      <div className="relative mt-4 h-48 w-full overflow-hidden rounded-3xl bg-muted sm:h-64 lg:h-72">
        {provider.cover_image ? (
          <img
            src={provider.cover_image}
            alt={provider.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/12 via-background to-accent">
            <Icon className="h-12 w-12 text-primary/40" />
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4 sm:mt-6 sm:gap-5">
        <div>
          <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary">
            <Icon className="mr-1.5 h-3.5 w-3.5" />
            {label}
          </Badge>
          <h1 className="mt-2.5 font-display text-2xl text-foreground sm:mt-3 sm:text-4xl">
            {provider.name}
          </h1>
          {provider.tagline && (
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:mt-2 sm:text-base">
              {provider.tagline}
            </p>
          )}
        </div>
        <Button
          size="lg"
          className="w-full rounded-full sm:w-auto"
          onClick={() => navigate(`/providers/${provider.id}/book`)}
        >
          <CalendarPlus className="mr-2 h-4 w-4" /> Book an appointment
        </Button>
      </div>

      {isHealthcareProvider && (
        <div
          role="note"
          className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs leading-relaxed text-muted-foreground sm:text-sm"
        >
          <HeartPulse className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-semibold text-foreground">
              Healthcare & Medical Scheduling Notice
            </p>
            <p className="mt-0.5">
              BookIt! facilitates appointment scheduling only and does not provide medical advice,
              diagnosis, or emergency triage. Independent practitioners are responsible for their
              own clinical services and HPCSA registration.{' '}
              <strong>In a medical emergency, call 10177 or 112 immediately.</strong>
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-8 sm:mt-10 sm:gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-8 sm:space-y-10">
          {provider.about && (
            <section>
              <h2 className="font-display text-xl text-foreground">About</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
                {provider.about}
              </p>
            </section>
          )}

          <section>
            <h2 className="font-display text-xl text-foreground">Services & rates</h2>
            <div className="mt-4 space-y-3">
              {services.length === 0 && (
                <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                  Services are being updated — check back shortly.
                </p>
              )}
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{svc.name}</p>
                    {svc.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{svc.description}</p>
                    )}
                    <p className="mt-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {formatDuration(svc.duration_minutes)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-3 sm:border-0 sm:pt-0">
                    <span className="font-display text-lg text-foreground">
                      {formatZAR(svc.price) || 'Rate on request'}
                      {svc.price_note && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          {svc.price_note}
                        </span>
                      )}
                    </span>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() =>
                        navigate(`/providers/${provider.id}/book?service=${svc.id}`)
                      }
                    >
                      Book
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {professionals.length > 0 && (
            <section>
              <h2 className="font-display text-xl text-foreground">Our professionals</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {professionals.map((pro) => (
                  <div
                    key={pro.id}
                    className="flex gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-secondary sm:h-16 sm:w-16">
                      {pro.photo_url ? (
                        <img
                          src={pro.photo_url}
                          alt={pro.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-display text-lg text-primary">
                          {pro.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{pro.name}</p>
                      {pro.title && <p className="text-sm text-primary/80">{pro.title}</p>}
                      {pro.bio && (
                        <p className="mt-1.5 text-sm text-muted-foreground">{pro.bio}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <h2 className="font-display text-lg text-foreground">Visit us</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {fullAddress && (
                <li className="flex gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-foreground hover:underline"
                  >
                    {fullAddress}
                  </a>
                </li>
              )}
              {provider.phone && (
                <li className="flex gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                  <a
                    href={`tel:${provider.phone.replace(/\s+/g, '')}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {provider.phone}
                  </a>
                </li>
              )}
              {provider.email && (
                <li className="flex gap-2.5">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                  <a
                    href={`mailto:${provider.email}`}
                    className="break-all hover:text-foreground hover:underline"
                  >
                    {provider.email}
                  </a>
                </li>
              )}
              {provider.website && (
                <li className="flex gap-2.5">
                  <Globe className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                  <a
                    href={
                      provider.website.startsWith('http')
                        ? provider.website
                        : `https://${provider.website}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="break-all hover:text-foreground hover:underline"
                  >
                    {provider.website}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <h2 className="font-display text-lg text-foreground">Working hours</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {(provider.working_hours || []).map((wh) => (
                <li key={wh.day} className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">{wh.day}</span>
                  <span
                    className={
                      wh.closed ? 'text-muted-foreground/70' : 'text-foreground'
                    }
                  >
                    {wh.closed ? 'Closed' : `${formatTime12(wh.open)} – ${formatTime12(wh.close)}`}
                  </span>
                </li>
              ))}
              {!provider.working_hours?.length && (
                <li className="text-muted-foreground">Hours not published yet.</li>
              )}
            </ul>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 text-xs text-muted-foreground sm:p-6">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Banknote className="h-4 w-4 text-primary" />
              <span>In-person payment only</span>
            </div>
            <p className="mt-1.5 leading-relaxed">
              Displayed ZAR rates are paid directly at the business venue after your appointment. No
              online payment or booking fee is charged in BookIt!.
            </p>
            <div className="mt-4 border-t border-border/60 pt-3">
              <button
                type="button"
                onClick={() => {
                  setReportReason('');
                  setReportOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              >
                <Flag className="h-3.5 w-3.5" /> Report this business listing
              </button>
            </div>
          </div>
        </aside>
      </div>

      <DialogModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        title={`Report ${provider.name}`}
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setReportOpen(false)}
              disabled={reporting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={reporting || reportReason.trim().length < 3}
              onClick={async () => {
                setReporting(true);
                try {
                  const res = await providersApi.report(provider.id, {
                    category: reportCategory,
                    reason: reportReason.trim(),
                  });
                  toast.success(res.message);
                  setReportOpen(false);
                } catch (err: any) {
                  toast.error(err.message || 'Could not submit report');
                } finally {
                  setReporting(false);
                }
              }}
            >
              {reporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit report
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-sm">
          <p className="text-xs text-muted-foreground">
            Help keep BookIt! safe and accurate. Our Trust & Safety team reviews reported listings
            within 24 hours.
          </p>
          <div>
            <Label htmlFor="report-category">Issue category</Label>
            <Select
              id="report-category"
              value={reportCategory}
              onChange={(e) => setReportCategory(e.target.value as any)}
              className="mt-1.5"
            >
              <option value="inappropriate">Inappropriate or offensive content</option>
              <option value="fraudulent">Fraudulent or misleading business</option>
              <option value="impersonation">Impersonation of a business or practitioner</option>
              <option value="medical_safety">Unlicensed healthcare / medical safety concern</option>
              <option value="other">Other policy violation</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="report-reason">Details</Label>
            <Textarea
              id="report-reason"
              rows={3}
              required
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe why you are reporting this listing..."
              className="mt-1.5"
            />
          </div>
        </div>
      </DialogModal>

      {/* Mobile Floating Quick-Book Bar (sits above mobile bottom nav) */}
      <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-border/80 bg-background/95 px-4 py-2.5 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-foreground">{provider.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {services.length} {services.length === 1 ? 'service' : 'services'} available
            </p>
          </div>
          <Button
            size="sm"
            className="shrink-0 rounded-full px-4"
            onClick={() => navigate(`/providers/${provider.id}/book`)}
          >
            <CalendarPlus className="mr-1.5 h-3.5 w-3.5" /> Book now
          </Button>
        </div>
      </div>
    </div>
  );
}
