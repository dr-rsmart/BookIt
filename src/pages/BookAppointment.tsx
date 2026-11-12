/**
 * 4-Step Appointment Booking Wizard (`nE`, `ZT`, `QT`, `$T` in Base44)
 * --------------------------------------------------------------------
 * Step 1: Service
 * Step 2: Professional ("Any available professional" or specific)
 * Step 3: Time (14-day date strip + open time slots grid)
 * Step 4: Confirm (Customer details + atomic booking creation -> Confirmation screen)
 */

import { useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, LogIn, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  providersApi,
  servicesApi,
  professionalsApi,
  slotsApi,
  bookingsApi,
  type ProviderRecord,
  type ServiceRecord,
  type ProfessionalRecord,
  type SlotRecord,
  type BookingRecord,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Textarea, Label, Skeleton, BookItIcon } from '../components/ui';
import {
  cn,
  todayStr,
  addDaysToDateStr,
  formatDuration,
  formatZAR,
  formatDateHuman,
  formatTime12,
} from '../lib/utils';
import { useSSE } from '../hooks/useSSE';

const STEPS = ['Service', 'Professional', 'Time', 'Confirm'];

function SelectableCard({
  selected,
  onClick,
  title,
  subtitle,
  meta,
  trailing,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
  meta?: string;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition',
        selected
          ? 'border-primary bg-primary/5 shadow-[0_14px_36px_-30px_rgba(225,0,100,0.65)]'
          : 'border-border bg-card hover:border-primary/40',
      )}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">{title}</p>
          {selected && <Check className="h-4 w-4 text-primary" />}
        </div>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        {meta && (
          <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">{meta}</p>
        )}
      </div>
      {trailing}
    </button>
  );
}

function StepPills({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
      {steps.map((step, idx) => (
        <li
          key={step}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-[11px] transition-colors sm:justify-start sm:gap-2 sm:px-3.5 sm:text-xs',
            idx === current && 'bg-primary font-medium text-primary-foreground',
            idx < current && 'bg-secondary text-secondary-foreground',
            idx > current && 'bg-secondary/40 text-muted-foreground sm:bg-transparent',
          )}
        >
          <span className="font-semibold">{idx + 1}</span>
          <span className="truncate">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function DateAndSlotPicker({
  selectedDate,
  onSelectDate,
  slots,
  selectedSlot,
  onSelectSlot,
  loading,
  professionalNameFor,
}: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  slots: SlotRecord[];
  selectedSlot: SlotRecord | null;
  onSelectSlot: (slot: SlotRecord) => void;
  loading: boolean;
  professionalNameFor: ((proId: string) => string) | null;
}) {
  const baseDate = useMemo(() => todayStr(), []);
  const days = useMemo(
    () => Array.from({ length: 14 }, (_, idx) => addDaysToDateStr(baseDate, idx)),
    [baseDate],
  );

  return (
    <div className="space-y-5">
      <div className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
        {days.map((d) => (
          <button
            key={d.dateStr}
            type="button"
            onClick={() => onSelectDate(d.dateStr)}
            className={cn(
              'flex min-w-[70px] shrink-0 snap-start flex-col items-center rounded-2xl border px-3 py-2.5 transition active:scale-[0.97]',
              d.dateStr === selectedDate
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-card hover:border-primary/40',
            )}
          >
            <span className="text-xs uppercase tracking-wide opacity-70">{d.dayShort}</span>
            <span className="font-display text-lg leading-tight">{d.dayNum}</span>
            <span className="text-[11px] opacity-70">{d.monthShort}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking open slots…
        </div>
      ) : slots.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          No open slots on this day. Try another date.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
          {slots.map((slot) => (
            <button
              key={slot.id}
              type="button"
              onClick={() => onSelectSlot(slot)}
              className={cn(
                'rounded-xl border px-3 py-3 text-sm transition active:scale-[0.98] sm:py-2.5',
                selectedSlot?.id === slot.id
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-card hover:border-primary/40',
              )}
            >
              {formatTime12(slot.start_time)}
              {professionalNameFor && (
                <span className="mt-0.5 block truncate text-[11px] opacity-70">
                  {professionalNameFor(slot.professional_id)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BookAppointment() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, navigateToLogin } = useAuth();

  const [provider, setProvider] = useState<ProviderRecord | null>(null);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState(0);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => todayStr());
  const [slots, setSlots] = useState<SlotRecord[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotRecord | null>(null);

  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
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
    })();
  }, [id]);

  // Preselect service from ?service= query param
  useEffect(() => {
    const svcParam = searchParams.get('service');
    if (svcParam && services.some((s) => s.id === svcParam)) {
      setSelectedServiceId(svcParam);
      setStep((prev) => (prev === 0 ? 1 : prev));
    }
  }, [services, searchParams]);

  // Populate customer name/phone from signed-in user
  useEffect(() => {
    if (user) {
      setCustomerDetails((prev) => ({
        ...prev,
        name: prev.name || user.fullName || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  // Fetch open slots for selected date
  const loadSlots = useCallback(async () => {
    if (!provider || !selectedDate) return;
    setLoadingSlots(true);
    try {
      const res = await slotsApi.list({
        provider_id: provider.id,
        date: selectedDate,
        status: 'open',
        limit: 200,
      });
      setSlots(res.items);
      // If currently selected slot is no longer open, reset and inform user
      setSelectedSlot((prev) => {
        if (!prev) return null;
        const stillOpen = res.items.some((item) => item.id === prev.id);
        if (!stillOpen) {
          toast.info('The time slot you had selected was just booked. Please pick another slot.');
          return null;
        }
        return prev;
      });
    } finally {
      setLoadingSlots(false);
    }
  }, [provider, selectedDate]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  useSSE(
    [
      'slot:created',
      'slot:updated',
      'slot:deleted',
      'slots:bulk_created',
      'booking:created',
      'booking:updated',
    ],
    () => {
      void loadSlots();
    },
  );

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) || null,
    [services, selectedServiceId],
  );

  const eligibleProfessionals = useMemo(() => {
    if (!selectedService) return professionals.filter((p) => p.active !== false);
    return professionals.filter((p) => {
      if (p.active === false) return false;
      const proOffersService =
        Array.isArray(p.service_ids) && p.service_ids.includes(selectedService.id);
      const serviceListsPro =
        Array.isArray(selectedService.professional_ids) &&
        selectedService.professional_ids.includes(p.id);
      const proHasNoRestrictions = !p.service_ids || p.service_ids.length === 0;
      const serviceHasNoRestrictions =
        !selectedService.professional_ids || selectedService.professional_ids.length === 0;

      return proOffersService || serviceListsPro || proHasNoRestrictions || serviceHasNoRestrictions;
    });
  }, [professionals, selectedService]);

  const filteredSlots = useMemo(
    () =>
      slots.filter(
        (s) =>
          !(
            (selectedProfessionalId && s.professional_id !== selectedProfessionalId) ||
            (selectedServiceId && s.service_id && s.service_id !== selectedServiceId)
          ),
      ),
    [slots, selectedProfessionalId, selectedServiceId],
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-5 px-5 py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-24 text-center">
        <h1 className="font-display text-3xl text-foreground">This business isn’t available</h1>
        <Button className="mt-6 rounded-full" onClick={() => navigate('/')}>
          Back to browsing
        </Button>
      </div>
    );
  }

  if (confirmedBooking) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-5 sm:py-16">
        <div className="rounded-3xl border border-primary/25 bg-card p-6 text-center sm:p-8">
          <BookItIcon className="mx-auto h-16 w-16" />
          <h1 className="mt-5 font-display text-2xl text-foreground sm:text-3xl">
            You’re booked in
          </h1>
          <p className="mt-2 text-muted-foreground">
            {confirmedBooking.service_name} at {confirmedBooking.provider_name}
          </p>

          <dl className="mt-6 space-y-3 rounded-2xl bg-secondary/60 p-4 text-left text-sm sm:mt-8 sm:p-5">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
              <dt className="text-muted-foreground">When</dt>
              <dd className="font-medium text-foreground sm:font-normal">
                {formatDateHuman(confirmedBooking.date)} ·{' '}
                {formatTime12(confirmedBooking.start_time)}–
                {formatTime12(confirmedBooking.end_time)}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
              <dt className="text-muted-foreground">Professional</dt>
              <dd className="font-medium text-foreground sm:font-normal">
                {confirmedBooking.professional_name || 'To be assigned'}
              </dd>
            </div>
            {formatZAR(confirmedBooking.price) && (
              <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-muted-foreground">Rate</dt>
                <dd className="font-medium text-foreground sm:font-normal">
                  {formatZAR(confirmedBooking.price)}
                </dd>
              </div>
            )}
          </dl>

          <p className="mt-5 text-sm text-muted-foreground">
            A reminder will appear here in your bookings 24 hours before your appointment.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
            <Button className="w-full rounded-full sm:w-auto" onClick={() => navigate('/my-bookings')}>
              View my bookings
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-full sm:w-auto"
              onClick={() => navigate(`/providers/${provider.id}`)}
            >
              Back to {provider.name}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-5 sm:py-10">
      <Link
        to={`/providers/${provider.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {provider.name}
      </Link>

      <h1 className="mt-3 font-display text-2xl text-foreground sm:mt-4 sm:text-3xl">
        Book an appointment
      </h1>

      <div className="mt-5 sm:mt-6">
        <StepPills steps={STEPS} current={step} />
      </div>

      <div className="mt-8 space-y-6">
        {/* Step 0: Select Service */}
        {step === 0 && (
          <section className="space-y-3">
            {services.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                This business hasn’t published services yet.
              </p>
            )}
            {services.map((svc) => (
              <SelectableCard
                key={svc.id}
                selected={selectedServiceId === svc.id}
                onClick={() => {
                  setSelectedServiceId(svc.id);
                  setSelectedProfessionalId('');
                  setSelectedSlot(null);
                }}
                title={svc.name}
                subtitle={svc.description}
                meta={`${formatDuration(svc.duration_minutes)}${formatZAR(svc.price) ? ` · ${formatZAR(svc.price)}` : ''}`}
              />
            ))}
            <div className="flex justify-end pt-2">
              <Button
                className="rounded-full"
                disabled={!selectedServiceId}
                onClick={() => setStep(1)}
              >
                Continue
              </Button>
            </div>
          </section>
        )}

        {/* Step 1: Select Professional */}
        {step === 1 && (
          <section className="space-y-3">
            <SelectableCard
              selected={selectedProfessionalId === ''}
              onClick={() => setSelectedProfessionalId('')}
              title="Any available professional"
              subtitle="We’ll assign the first professional free at your chosen time."
            />
            {eligibleProfessionals.map((pro) => (
              <SelectableCard
                key={pro.id}
                selected={selectedProfessionalId === pro.id}
                onClick={() => {
                  setSelectedProfessionalId(pro.id);
                  setSelectedSlot(null);
                }}
                title={pro.name}
                subtitle={pro.bio}
                meta={pro.title}
              />
            ))}
            <div className="flex justify-between pt-2">
              <Button variant="ghost" className="rounded-full" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button className="rounded-full" onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          </section>
        )}

        {/* Step 2: Select Date & Time Slot */}
        {step === 2 && (
          <section className="space-y-6">
            <DateAndSlotPicker
              selectedDate={selectedDate}
              onSelectDate={(d) => {
                setSelectedDate(d);
                setSelectedSlot(null);
              }}
              slots={filteredSlots}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              loading={loadingSlots}
              professionalNameFor={
                selectedProfessionalId
                  ? null
                  : (proId) =>
                      (professionals.find((p) => p.id === proId)?.name || '').split(' ')[0]
              }
            />
            <div className="flex justify-between pt-2">
              <Button variant="ghost" className="rounded-full" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                className="rounded-full"
                disabled={!selectedSlot}
                onClick={() => setStep(3)}
              >
                Continue
              </Button>
            </div>
          </section>
        )}

        {/* Step 3: Confirm Booking */}
        {step === 3 && selectedSlot && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-border bg-secondary/50 p-5 text-sm">
              <p className="font-medium text-foreground">{selectedService?.name}</p>
              <p className="mt-1 text-muted-foreground">
                {formatDateHuman(selectedSlot.date)} · {formatTime12(selectedSlot.start_time)}–
                {formatTime12(selectedSlot.end_time)}
              </p>
              <p className="mt-1 text-muted-foreground">
                {professionals.find((p) => p.id === selectedSlot.professional_id)?.name ||
                  'Any professional'}
                {formatZAR(selectedService?.price) ? ` · ${formatZAR(selectedService?.price)}` : ''}
              </p>
            </div>

            {isAuthenticated ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Your name</Label>
                  <Input
                    id="name"
                    value={customerDetails.name}
                    onChange={(e) =>
                      setCustomerDetails({ ...customerDetails, name: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    value={customerDetails.phone}
                    onChange={(e) =>
                      setCustomerDetails({ ...customerDetails, phone: e.target.value })
                    }
                    placeholder="So the business can reach you"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Anything to add?</Label>
                  <Textarea
                    id="notes"
                    value={customerDetails.notes}
                    onChange={(e) =>
                      setCustomerDetails({ ...customerDetails, notes: e.target.value })
                    }
                    placeholder="Optional details for the professional"
                    className="mt-2"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-primary/25 bg-primary/5 p-6 text-center">
                <p className="text-foreground">Sign in to confirm and get your reminder.</p>
                <Button
                  className="mt-4 rounded-full"
                  onClick={() => navigateToLogin()}
                >
                  <LogIn className="mr-2 h-4 w-4" /> Sign in to continue
                </Button>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="ghost" className="rounded-full" onClick={() => setStep(2)}>
                Back
              </Button>
              {isAuthenticated && user && (
                <Button
                  className="rounded-full"
                  disabled={submitting}
                  onClick={async () => {
                    setSubmitting(true);
                    try {
                      const assignedPro =
                        professionals.find((p) => p.id === selectedSlot.professional_id) || null;
                      const created = await bookingsApi.create({
                        provider_id: provider.id,
                        provider_name: provider.name,
                        service_id: selectedService?.id ?? null,
                        service_name: selectedService?.name || 'Appointment',
                        professional_id: assignedPro?.id ?? null,
                        professional_name: assignedPro?.name ?? null,
                        slot_id: selectedSlot.id,
                        customer_id: user.id,
                        customer_name: customerDetails.name || user.fullName || user.email,
                        customer_email: user.email,
                        customer_phone: customerDetails.phone,
                        date: selectedSlot.date,
                        start_time: selectedSlot.start_time,
                        end_time: selectedSlot.end_time,
                        price: selectedService?.price ?? null,
                        notes: customerDetails.notes,
                        status: 'confirmed',
                      });
                      setConfirmedBooking(created);
                    } catch (err: any) {
                      toast.error(err.message || 'Could not complete booking');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {submitting ? 'Confirming…' : 'Confirm booking'}
                </Button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
