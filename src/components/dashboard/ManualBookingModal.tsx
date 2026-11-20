/**
 * Business Manual Booking Modal
 * -----------------------------
 * Allows business owners, managers, and staff to create manual bookings
 * (walk-ins, phone reservations, repeat clients) from their profile & dashboard.
 * Supports both picking an existing open availability slot and entering a custom date/time.
 */

import { useState, useEffect, useMemo, useCallback, type ReactNode, type FormEvent } from 'react';
import { CalendarPlus, Clock, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  servicesApi,
  professionalsApi,
  slotsApi,
  bookingsApi,
  type ProviderRecord,
  type ServiceRecord,
  type ProfessionalRecord,
  type SlotRecord,
  type BookingRecord,
} from '../../services/api';
import {
  Button,
  DialogModal,
  Input,
  Label,
  Select,
  Textarea,
} from '../ui';
import {
  cn,
  todayStr,
  timeToMinutes,
  minutesToTime,
  formatTime12,
  formatZAR,
  resolveCategoryTemplate,
  isSlotExpiredByCutoff,
} from '../../lib/utils';

export default function ManualBookingModal({
  provider,
  onCreated,
  trigger,
}: {
  provider: ProviderRecord;
  onCreated?: (booking: BookingRecord) => void;
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalRecord[]>([]);
  const [slots, setSlots] = useState<SlotRecord[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [timeMode, setTimeMode] = useState<'slot' | 'custom'>('custom');
  const [serviceId, setServiceId] = useState('');
  const [customServiceName, setCustomServiceName] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [date, setDate] = useState(() => todayStr());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<'confirmed' | 'pending'>('confirmed');
  const [notes, setNotes] = useState('');

  const template = useMemo(
    () => resolveCategoryTemplate(provider.category, provider.template_id),
    [provider.category, provider.template_id],
  );

  // Load services and professionals when modal opens
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoadingMeta(true);
    Promise.all([
      servicesApi.list({ provider_id: provider.id, active: true, limit: 100 }),
      professionalsApi.list({ provider_id: provider.id, active: true, limit: 100 }),
    ])
      .then(([svcRes, proRes]) => {
        if (!active) return;
        setServices(svcRes.items);
        setProfessionals(proRes.items);
        if (svcRes.items.length > 0 && !serviceId) {
          const firstSvc = svcRes.items[0];
          setServiceId(firstSvc.id);
          setPrice(firstSvc.price != null ? String(firstSvc.price) : '');
          const dur = Number(firstSvc.duration_minutes) || 30;
          setEndTime(minutesToTime(timeToMinutes('09:00') + dur));
        }
        if (proRes.items.length > 0 && !professionalId) {
          setProfessionalId(proRes.items[0].id);
        }
      })
      .catch(() => {
        // ignore
      })
      .finally(() => {
        if (active) setLoadingMeta(false);
      });
    return () => {
      active = false;
    };
  }, [open, provider.id]);

  const loadSlotsForDate = useCallback(async () => {
    if (!open || !date) return;
    setLoadingSlots(true);
    try {
      const res = await slotsApi.list({
        provider_id: provider.id,
        date,
        status: 'open',
        limit: 200,
      });
      setSlots(res.items);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [open, provider.id, date]);

  useEffect(() => {
    if (open) {
      void loadSlotsForDate();
    }
  }, [open, loadSlotsForDate]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) || null,
    [services, serviceId],
  );

  const selectedProfessional = useMemo(
    () => professionals.find((p) => p.id === professionalId) || null,
    [professionals, professionalId],
  );

  const availableSlots = useMemo(() => {
    const now = new Date();
    return slots.filter((s) => {
      if (s.status !== 'open') return false;
      if (professionalId && s.professional_id !== professionalId) return false;
      if (serviceId && s.service_id && s.service_id !== serviceId) return false;
      if (isSlotExpiredByCutoff(s.date, s.start_time, s.cutoff_minutes ?? provider.slot_cutoff_minutes, now)) {
        return false;
      }
      return true;
    });
  }, [slots, professionalId, serviceId, provider.slot_cutoff_minutes]);

  const handleServiceChange = (nextServiceId: string) => {
    setServiceId(nextServiceId);
    const svc = services.find((s) => s.id === nextServiceId);
    if (svc) {
      setPrice(svc.price != null ? String(svc.price) : '');
      const dur = Number(svc.duration_minutes) || 30;
      setEndTime(minutesToTime(timeToMinutes(startTime) + dur));
    }
  };

  const handleStartTimeChange = (nextStart: string) => {
    setStartTime(nextStart);
    const dur = Number(selectedService?.duration_minutes) || 30;
    setEndTime(minutesToTime(timeToMinutes(nextStart) + dur));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error('Please enter the customer name.');
      return;
    }

    const chosenSlot =
      timeMode === 'slot' ? availableSlots.find((s) => s.id === selectedSlotId) || null : null;

    if (timeMode === 'slot' && !chosenSlot) {
      toast.error('Please pick an open slot or switch to Custom date & time.');
      return;
    }

    const effectiveDate = chosenSlot ? chosenSlot.date : date;
    const effectiveStart = chosenSlot ? chosenSlot.start_time : startTime;
    const effectiveEnd = chosenSlot ? chosenSlot.end_time : endTime;

    if (timeMode === 'custom' && timeToMinutes(effectiveStart) >= timeToMinutes(effectiveEnd)) {
      toast.error('End time must be after start time.');
      return;
    }

    const effectiveProId = chosenSlot
      ? chosenSlot.professional_id
      : professionalId || null;
    const effectiveProName = effectiveProId
      ? professionals.find((p) => p.id === effectiveProId)?.name || selectedProfessional?.name || null
      : null;

    const effectiveServiceName =
      selectedService?.name || customServiceName.trim() || template.terminology.bookingSingular;

    setSubmitting(true);
    try {
      const created = await bookingsApi.create({
        provider_id: provider.id,
        provider_name: provider.name,
        service_id: selectedService?.id || null,
        service_name: effectiveServiceName,
        professional_id: effectiveProId,
        professional_name: effectiveProName,
        slot_id: chosenSlot ? chosenSlot.id : null,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        date: effectiveDate,
        start_time: effectiveStart,
        end_time: effectiveEnd,
        price: price !== '' && !Number.isNaN(Number(price)) ? Number(price) : null,
        notes: notes.trim(),
        status,
        metadata: {
          template_id: template.id,
          manual_booking: true,
        },
      });

      toast.success(`Manual booking created for ${created.customer_name}.`);
      setOpen(false);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setNotes('');
      setSelectedSlotId('');
      onCreated?.(created);
    } catch (err: any) {
      toast.error(err?.message || 'Could not create manual booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <span onClick={() => setOpen(true)} className="inline-flex">
        {trigger || (
          <Button type="button" variant="outline" className="rounded-full gap-1.5">
            <CalendarPlus className="h-4 w-4 text-primary" />
            Manual booking
          </Button>
        )}
      </span>

      <DialogModal
        open={open}
        onOpenChange={setOpen}
        title={`New Manual ${template.terminology.bookingSingular}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Walk-in & phone booking
            </span>{' '}
            — Record a {template.terminology.bookingSingular.toLowerCase()} directly on behalf of a{' '}
            {template.terminology.customerSingular.toLowerCase()}.
          </div>

          {loadingMeta ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading services & team…
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="mb-service">{template.terminology.serviceSingular}</Label>
                  {services.length > 0 ? (
                    <Select
                      id="mb-service"
                      value={serviceId}
                      onChange={(e) => handleServiceChange(e.target.value)}
                      className="mt-1.5"
                    >
                      {services.map((svc) => (
                        <option key={svc.id} value={svc.id}>
                          {svc.name}
                          {formatZAR(svc.price) ? ` (${formatZAR(svc.price)})` : ''}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      id="mb-service"
                      placeholder={`e.g. ${template.terminology.serviceSingular}`}
                      value={customServiceName}
                      onChange={(e) => setCustomServiceName(e.target.value)}
                      className="mt-1.5"
                    />
                  )}
                </div>

                <div>
                  <Label htmlFor="mb-pro">{template.terminology.teamSingular}</Label>
                  <Select
                    id="mb-pro"
                    value={professionalId}
                    onChange={(e) => {
                      setProfessionalId(e.target.value);
                      setSelectedSlotId('');
                    }}
                    className="mt-1.5"
                  >
                    <option value="">Unassigned / Any</option>
                    {professionals.map((pro) => (
                      <option key={pro.id} value={pro.id}>
                        {pro.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <Label>Time selection mode</Label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTimeMode('custom')}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-xs font-medium transition',
                      timeMode === 'custom'
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Custom date & time
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeMode('slot')}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-xs font-medium transition',
                      timeMode === 'slot'
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Pick open slot ({availableSlots.length})
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor="mb-date">Date</Label>
                  <Input
                    id="mb-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setSelectedSlotId('');
                    }}
                    className="mt-1.5"
                  />
                </div>

                {timeMode === 'custom' && (
                  <>
                    <div>
                      <Label htmlFor="mb-start">Start time</Label>
                      <Input
                        id="mb-start"
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="mb-end">End time</Label>
                      <Input
                        id="mb-end"
                        type="time"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </>
                )}
              </div>

              {timeMode === 'slot' && (
                <div>
                  <Label>Available open slots on selected date</Label>
                  {loadingSlots ? (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading open slots…
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <p className="mt-2 rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                      No open slots available for this date/selection. Switch to{' '}
                      <button
                        type="button"
                        onClick={() => setTimeMode('custom')}
                        className="font-medium text-primary underline"
                      >
                        Custom date & time
                      </button>{' '}
                      to book any time.
                    </p>
                  ) : (
                    <div className="mt-2 grid max-h-40 grid-cols-3 gap-2 overflow-y-auto p-0.5">
                      {availableSlots.map((slot) => {
                        const proName =
                          professionals.find((p) => p.id === slot.professional_id)?.name || '';
                        const isSelected = selectedSlotId === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={cn(
                              'flex flex-col items-center rounded-xl border px-2.5 py-2 text-xs transition',
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-card hover:border-primary/40',
                            )}
                          >
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="h-3 w-3" />
                              {formatTime12(slot.start_time)}
                            </span>
                            {proName && (
                              <span className="mt-0.5 max-w-full truncate text-[10px] opacity-75">
                                {proName}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="mb-cname">
                    {template.terminology.customerSingular} name *
                  </Label>
                  <Input
                    id="mb-cname"
                    required
                    placeholder="Full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="mb-cphone">Phone number</Label>
                  <Input
                    id="mb-cphone"
                    placeholder="+27 82 000 0000"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <Label htmlFor="mb-cemail">Email (optional)</Label>
                  <Input
                    id="mb-cemail"
                    type="email"
                    placeholder="client@email.co.za"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="mb-price">Price (ZAR)</Label>
                  <Input
                    id="mb-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="mb-status">Status</Label>
                  <Select
                    id="mb-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'confirmed' | 'pending')}
                    className="mt-1.5"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="mb-notes">Notes (optional)</Label>
                <Textarea
                  id="mb-notes"
                  rows={2}
                  placeholder="Walk-in, special requests, or reference notes…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create manual booking
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogModal>
    </>
  );
}
