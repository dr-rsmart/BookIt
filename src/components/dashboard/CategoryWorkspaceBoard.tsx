/**
 * Category-Adaptive Operational Workspace Board (`<Category> 1.jpeg` & Dashboard PDF)
 * -----------------------------------------------------------------------------------
 * Enhances BookIt's Provider Dashboard Overview with:
 * 1. View toggle between the 4-stage Operational Board (e.g. Workshop Bay Board,
 *    Clinical Waiting Room & Rooms, Salon Chairs, Floor & Sittings, Class Roster,
 *    Dispatch Board, Grooming Board, Shoot Pipeline, Practice Diary) and Classic List.
 * 2. One-click stage progression & resource/room/bay assignment saved to `booking.metadata`.
 * 3. Right-hand operational context panel showing resource utilisation & intake summary.
 */

import { useState } from 'react';
import {
  LayoutGrid,
  List,
  Clock,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { bookingsApi, type BookingRecord } from '../../services/api';
import BookingRow from './BookingRow';
import { Badge, Button, Select } from '../ui';
import {
  cn,
  formatTime12,
  formatZAR,
  STATUS_BADGE_CLASSES,
  formatBookingMetadataBadges,
  getBookingOperationalStage,
  type CategoryTemplateSpec,
} from '../../lib/utils';

export default function CategoryWorkspaceBoard({
  template,
  bookings,
  onChange,
}: {
  template: CategoryTemplateSpec;
  bookings: BookingRecord[];
  onChange: () => void;
}) {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStageChange = async (booking: BookingRecord, nextStage: string) => {
    setUpdatingId(booking.id);
    try {
      const isFinalStage = nextStage === template.operationalStages[3];
      const nextStatus = isFinalStage
        ? 'completed'
        : booking.status === 'pending'
          ? 'confirmed'
          : booking.status;

      await bookingsApi.update(booking.id, {
        status: nextStatus,
        metadata: {
          ...(booking.metadata || {}),
          template_id: template.id,
          stage: nextStage,
        },
      });
      toast.success(`${booking.customer_name} moved to "${nextStage}".`);
      onChange();
    } catch (err: any) {
      toast.error(err.message || 'Could not update operational stage');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResourceAssign = async (booking: BookingRecord, resourceLabel: string) => {
    setUpdatingId(booking.id);
    try {
      await bookingsApi.update(booking.id, {
        metadata: {
          ...(booking.metadata || {}),
          template_id: template.id,
          resource_label: resourceLabel,
        },
      });
      toast.success(
        resourceLabel
          ? `Assigned to ${resourceLabel}.`
          : `${template.terminology.resourceSingular} unassigned.`,
      );
      onChange();
    } catch (err: any) {
      toast.error(err.message || 'Could not assign resource');
    } finally {
      setUpdatingId(null);
    }
  };

  // Compute resource utilisation across `template.defaultResources`
  const resourceUsage = template.defaultResources.map((resName, idx) => {
    const assigned = bookings.filter((b) => {
      if (b.metadata?.resource_label) {
        return String(b.metadata.resource_label) === resName;
      }
      // Deterministically distribute unassigned active bookings for visual board balance
      return idx === 0 && bookings.length > 0 && !b.metadata?.resource_label;
    });
    return {
      name: resName,
      count: assigned.length,
      activeCustomer: assigned[0]?.customer_name || null,
      activeService: assigned[0]?.service_name || null,
    };
  });

  const TemplateIcon = template.Icon;

  return (
    <div className="mt-10 space-y-5">
      {/* Section Header + Board/List Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <TemplateIcon className="h-3.5 w-3.5" />
            {template.title} Workspace
          </div>
          <h2 className="mt-1 font-display text-xl text-foreground sm:text-2xl">
            {template.terminology.scheduleTitle}
          </h2>
        </div>

        <div className="inline-flex items-center rounded-full border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setViewMode('board')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition',
              viewMode === 'board'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Workspace board
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition',
              viewMode === 'list'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <List className="h-3.5 w-3.5" />
            Schedule list
          </button>
        </div>
      </div>

      {/* Main Grid: Operational Board / List (left) + Context Sidebar (right) */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)]">
        <div>
          {bookings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
              <p className="font-display text-lg text-foreground">
                No {template.terminology.bookingPlural.toLowerCase()} scheduled for today
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Open more slots in Availability, or share your public booking page with{' '}
                {template.terminology.customerPlural.toLowerCase()}.
              </p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-4">
              {bookings.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  template={template}
                  onChange={onChange}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {template.operationalStages.map((stage, stageIdx) => {
                const stageBookings = bookings.filter(
                  (b) => getBookingOperationalStage(b, template) === stage,
                );
                const nextStage = template.operationalStages[stageIdx + 1] || null;

                return (
                  <div
                    key={stage}
                    className="flex flex-col rounded-3xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'h-2.5 w-2.5 rounded-full',
                            stageIdx === 0 && 'bg-amber-500',
                            stageIdx === 1 && 'bg-primary',
                            stageIdx === 2 && 'bg-sky-500',
                            stageIdx === 3 && 'bg-emerald-500',
                          )}
                        />
                        <h3 className="font-display text-sm font-semibold text-foreground">
                          {stage}
                        </h3>
                      </div>
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {stageBookings.length}
                      </span>
                    </div>

                    <div className="mt-3 flex-1 space-y-3">
                      {stageBookings.length === 0 && (
                        <p className="rounded-2xl border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-foreground">
                          No {template.terminology.bookingPlural.toLowerCase()} in this stage
                        </p>
                      )}

                      {stageBookings.map((b) => {
                        const badges = formatBookingMetadataBadges(b.metadata).filter(
                          (badge) => badge.label !== stage,
                        );
                        const busy = updatingId === b.id;

                        return (
                          <div
                            key={b.id}
                            className="rounded-2xl border border-border/80 bg-background p-3.5 shadow-sm transition hover:border-primary/35"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {b.customer_name || b.customer_email}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {b.service_name}
                                  {b.professional_name ? ` · ${b.professional_name}` : ''}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn('text-[10px]', STATUS_BADGE_CLASSES[b.status])}
                              >
                                {b.status}
                              </Badge>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                <Clock className="h-3 w-3 text-primary" />
                                {formatTime12(b.start_time)}–{formatTime12(b.end_time)}
                              </span>
                              {formatZAR(b.price) && (
                                <span className="font-medium text-foreground">
                                  {formatZAR(b.price)}
                                </span>
                              )}
                            </div>

                            {badges.length > 0 && (
                              <div className="mt-2.5 flex flex-wrap gap-1">
                                {badges.map((badge, idx) => (
                                  <span
                                    key={`${badge.label}-${idx}`}
                                    className={cn(
                                      'rounded-full border px-2 py-0.5 text-[10px] font-medium',
                                      badge.highlight
                                        ? 'border-primary/30 bg-primary/10 text-primary'
                                        : 'border-border bg-secondary/50 text-muted-foreground',
                                    )}
                                  >
                                    {badge.label}
                                  </span>
                                ))}
                              </div>
                            )}

                            {b.notes && (
                              <p className="mt-2 line-clamp-2 rounded-xl bg-secondary/50 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                                {b.notes}
                              </p>
                            )}

                            {/* Resource / Bay / Room assignment + Next stage action */}
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2.5">
                              <Select
                                aria-label={`Assign ${template.terminology.resourceSingular}`}
                                value={String(b.metadata?.resource_label || '')}
                                disabled={busy}
                                onChange={(e) => void handleResourceAssign(b, e.target.value)}
                                className="h-7 w-auto max-w-[165px] rounded-full px-2.5 py-0 text-[11px]"
                              >
                                <option value="">
                                  Assign {template.terminology.resourceSingular.toLowerCase()}…
                                </option>
                                {template.defaultResources.map((res) => (
                                  <option key={res} value={res}>
                                    {res}
                                  </option>
                                ))}
                              </Select>

                              {nextStage ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={busy}
                                  onClick={() => void handleStageChange(b, nextStage)}
                                  className="h-7 rounded-full px-2.5 text-[11px]"
                                >
                                  {nextStage} <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Done
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right-Hand Operational Context Panel (`<Category> 1.jpeg`) */}
        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-base text-foreground">
                {template.sidePanelTitle}
              </h3>
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {template.sidePanelSubtitle}
            </p>

            <div className="mt-4 space-y-2.5">
              {resourceUsage.map((res) => (
                <div
                  key={res.name}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background px-3.5 py-2.5 text-xs"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{res.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {res.activeCustomer
                        ? `${res.activeCustomer} · ${res.activeService}`
                        : `Open ${template.terminology.resourceSingular.toLowerCase()}`}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
                      res.count > 0
                        ? 'bg-primary/10 text-primary'
                        : 'bg-secondary text-muted-foreground',
                    )}
                  >
                    {res.count > 0 ? `${res.count} active` : 'Ready'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-primary/20 bg-primary/[0.03] p-5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Template terminology
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Your public booking page and workspace use{' '}
              <strong className="text-foreground">{template.title}</strong> labels:
            </p>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                <dt className="text-[10px] uppercase text-muted-foreground">Team</dt>
                <dd className="font-medium text-foreground">{template.terminology.teamPlural}</dd>
              </div>
              <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                <dt className="text-[10px] uppercase text-muted-foreground">Offering</dt>
                <dd className="font-medium text-foreground">
                  {template.terminology.serviceSingular}
                </dd>
              </div>
              <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                <dt className="text-[10px] uppercase text-muted-foreground">Resource</dt>
                <dd className="font-medium text-foreground">
                  {template.terminology.resourceSingular}
                </dd>
              </div>
              <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                <dt className="text-[10px] uppercase text-muted-foreground">Customer</dt>
                <dd className="font-medium text-foreground">
                  {template.terminology.customerSingular}
                </dd>
              </div>
            </dl>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {template.featureChips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
