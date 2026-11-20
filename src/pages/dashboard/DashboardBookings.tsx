/**
 * Provider Dashboard Bookings Manager (`zP` in Base44)
 * ----------------------------------------------------
 * Filter bookings by Upcoming, Pending, Completed, Cancelled, All.
 */

import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { bookingsApi, type BookingRecord } from '../../services/api';
import { useMyProvider } from '../../hooks/useMyProvider';
import { useSSE } from '../../hooks/useSSE';
import DashboardSubNav from '../../components/dashboard/DashboardSubNav';
import BookingRow from '../../components/dashboard/BookingRow';
import ManualBookingModal from '../../components/dashboard/ManualBookingModal';
import { Spinner } from '../../components/ui';
import { cn, resolveCategoryTemplate } from '../../lib/utils';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'all', label: 'All' },
];

export default function DashboardBookings() {
  const { provider, loading } = useMyProvider();
  const [tab, setTab] = useState('upcoming');
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [fetched, setFetched] = useState(false);

  const loadBookings = useCallback(async (providerId: string, activeTab: string) => {
    const res = await bookingsApi.list({
      provider_id: providerId,
      tab: activeTab,
      limit: 100,
    });
    setBookings(res.items);
    setFetched(true);
  }, []);

  useEffect(() => {
    if (provider) {
      setFetched(false);
      void loadBookings(provider.id, tab);
    }
  }, [provider, tab, loadBookings]);

  useSSE(['booking:created', 'booking:updated', 'booking:reminder'], () => {
    if (provider) void loadBookings(provider.id, tab);
  });

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!provider) return <Navigate to="/dashboard" replace />;

  const template = resolveCategoryTemplate(provider.category, provider.template_id);

  return (
    <div>
      <DashboardSubNav />
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-5 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">
              {template.terminology.bookingsNavLabel}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Confirm, update stage, complete, remind or cancel — all from here.
            </p>
          </div>
          <ManualBookingModal
            provider={provider}
            onCreated={() => void loadBookings(provider.id, tab)}
          />
        </div>

        <div className="no-scrollbar mt-5 flex snap-x gap-2 overflow-x-auto pb-1 sm:mt-6 sm:flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'shrink-0 snap-start whitespace-nowrap rounded-full border px-4 py-2 text-sm transition',
                tab === t.key
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          {!fetched && <Spinner className="h-5 w-5" />}
          {fetched && bookings.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
              Nothing in this list yet.
            </p>
          )}
          {bookings.map((b) => (
            <BookingRow
              key={b.id}
              booking={b}
              template={template}
              onChange={() => void loadBookings(provider.id, tab)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
