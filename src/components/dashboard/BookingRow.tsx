/**
 * Provider Dashboard Booking Card (`IP` in Base44)
 * ------------------------------------------------
 * Renders a booking in Today's schedule or the Bookings manager
 * with Confirm, Mark completed, Send reminder, and Cancel actions.
 */

import { useState } from 'react';
import { Check, CheckCircle2, Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { bookingsApi, type BookingRecord } from '../../services/api';
import { Badge, Button, ConfirmDialog } from '../ui';
import {
  cn,
  formatDateHuman,
  formatTime12,
  formatZAR,
  STATUS_BADGE_CLASSES,
  formatBookingMetadataBadges,
  resolveCategoryTemplate,
  getBookingOperationalStage,
  type CategoryTemplateSpec,
} from '../../lib/utils';

export default function BookingRow({
  booking,
  template,
  onChange,
}: {
  booking: BookingRecord;
  template?: CategoryTemplateSpec;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const resolvedTemplate =
    template || resolveCategoryTemplate(String(booking.metadata?.template_id || ''), null);
  const metadataBadges = formatBookingMetadataBadges(booking.metadata);
  const currentStage = getBookingOperationalStage(booking, resolvedTemplate);

  const updateStage = async (stage: string) => {
    setBusy(true);
    try {
      const isFinal = stage === resolvedTemplate.operationalStages[3];
      await bookingsApi.update(booking.id, {
        ...(isFinal ? { status: 'completed' } : {}),
        metadata: {
          ...(booking.metadata || {}),
          template_id: resolvedTemplate.id,
          stage,
        },
      });
      toast.success(`Stage updated to "${stage}".`);
      onChange();
    } catch (err: any) {
      toast.error(err.message || 'Could not update stage');
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (status: BookingRecord['status']) => {
    setBusy(true);
    try {
      await bookingsApi.update(booking.id, { status });
      toast.success(`Appointment marked as ${status}.`);
      onChange();
    } catch (err: any) {
      toast.error(err.message || 'Could not update booking');
    } finally {
      setBusy(false);
    }
  };

  const sendReminder = async () => {
    setBusy(true);
    try {
      await bookingsApi.sendReminder(booking.id);
      toast.success(`Reminder sent to ${booking.customer_name || booking.customer_email}.`);
      onChange();
    } catch {
      toast.error('Could not send the reminder');
    } finally {
      setBusy(false);
    }
  };

  const isActive = booking.status === 'pending' || booking.status === 'confirmed';

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">
            {booking.customer_name || booking.customer_email}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {booking.service_name}
            {booking.professional_name ? ` · ${booking.professional_name}` : ''}
          </p>
        </div>
        <Badge variant="outline" className={STATUS_BADGE_CLASSES[booking.status]}>
          {booking.status}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
        <span>
          {formatDateHuman(booking.date)} · {formatTime12(booking.start_time)}–
          {formatTime12(booking.end_time)}
        </span>
        {booking.customer_phone && <span>{booking.customer_phone}</span>}
        {formatZAR(booking.price) && (
          <span className="font-medium text-foreground">{formatZAR(booking.price)}</span>
        )}
        {booking.reminder_sent_at && <span className="text-primary/80">Reminder sent</span>}
      </div>

      {metadataBadges.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {metadataBadges.map((b, idx) => (
            <span
              key={`${b.label}-${idx}`}
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                b.highlight
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border bg-secondary/50 text-muted-foreground',
              )}
            >
              {b.label}
            </span>
          ))}
        </div>
      )}

      {isActive && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Stage:</span>
          {resolvedTemplate.operationalStages.map((stage) => (
            <button
              key={stage}
              type="button"
              disabled={busy}
              onClick={() => void updateStage(stage)}
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-[11px] transition',
                currentStage === stage
                  ? 'border-primary bg-primary text-primary-foreground font-medium'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {stage}
            </button>
          ))}
        </div>
      )}

      {booking.notes && (
        <p className="mt-3 rounded-xl bg-secondary/60 p-3 text-sm text-muted-foreground">
          {booking.notes}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {booking.status === 'pending' && (
          <Button
            size="sm"
            className="rounded-full"
            disabled={busy}
            onClick={() => updateStatus('confirmed')}
          >
            <Check className="mr-1.5 h-3.5 w-3.5" /> Confirm
          </Button>
        )}
        {isActive && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={busy}
            onClick={() => updateStatus('completed')}
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Mark completed
          </Button>
        )}
        {isActive && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={busy}
            onClick={sendReminder}
          >
            {busy ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Bell className="mr-1.5 h-3.5 w-3.5" />
            )}
            Send reminder
          </Button>
        )}
        {isActive && (
          <ConfirmDialog
            title="Cancel this appointment?"
            description={`${booking.customer_name || 'The customer'} will lose the slot and it opens up again.`}
            confirmLabel="Cancel appointment"
            onConfirm={() => updateStatus('cancelled')}
            trigger={
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full text-muted-foreground hover:text-destructive"
              >
                Cancel
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
