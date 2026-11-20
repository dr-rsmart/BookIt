/**
 * Provider Dashboard Overview (`LP` and `FP` in Base44)
 * -----------------------------------------------------
 * If the signed-in user does not yet have a business, renders the
 * "For businesses — List your business" onboarding form.
 * Otherwise renders the Provider Dashboard with 4 KPI cards and Today's schedule.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CalendarCheck,
  Banknote,
  Sparkles,
  ArrowRight,
  Plus,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  providersApi,
  bookingsApi,
  masterApi,
  type BookingRecord,
  type ProviderRecord,
} from '../../services/api';
import { useMyProvider } from '../../hooks/useMyProvider';
import { useAuth } from '../../context/AuthContext';
import { useSSE } from '../../hooks/useSSE';
import DashboardSubNav from '../../components/dashboard/DashboardSubNav';
import BusinessForm from '../../components/dashboard/BusinessForm';
import { CategoryTemplatePickerModal } from '../../components/dashboard/CategoryTemplatePicker';
import CategoryWorkspaceBoard from '../../components/dashboard/CategoryWorkspaceBoard';
import { Button, Skeleton, Spinner } from '../../components/ui';
import { getCategoryMeta, resolveCategoryTemplate, formatZAR } from '../../lib/utils';

function StatCard({
  label,
  value,
  hint,
  Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  Icon?: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-primary" />}
      </div>
      <p className="mt-2 font-display text-2xl text-foreground sm:mt-3 sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{hint}</p>}
    </div>
  );
}

export default function DashboardOverview() {
  const { provider, setProvider, loading, reload: reloadMyProvider } = useMyProvider();
  const { user, isMaster, refresh: refreshAuth } = useAuth();
  const navigate = useNavigate();

  const isMasterOperator = isMaster || user?.originalRole === 'master';
  const [browseProviders, setBrowseProviders] = useState<ProviderRecord[]>([]);
  const [loadingBrowse, setLoadingBrowse] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [stats, setStats] = useState<{
    todayCount: number;
    upcomingCount: number;
    pendingCount: number;
    revenue: number;
  } | null>(null);
  const [todayBookings, setTodayBookings] = useState<BookingRecord[]>([]);

  const loadStats = useCallback(async () => {
    if (!provider) return;
    try {
      const res = await bookingsApi.stats(provider.id);
      setStats({
        todayCount: res.todayCount,
        upcomingCount: res.upcomingCount,
        pendingCount: res.pendingCount,
        revenue: res.revenue,
      });
      setTodayBookings(res.todaySchedule);
    } catch {
      // ignore
    }
  }, [provider]);

  useEffect(() => {
    if (provider) {
      void loadStats();
    } else if (isMasterOperator) {
      setLoadingBrowse(true);
      providersApi
        .list({ status: 'published', limit: 60 })
        .then((res) => setBrowseProviders(res.items))
        .catch(() => setBrowseProviders([]))
        .finally(() => setLoadingBrowse(false));
    }
  }, [provider, isMasterOperator, loadStats]);

  useSSE(['booking:created', 'booking:updated', 'booking:reminder'], () => {
    void loadStats();
  });

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!provider) {
    if (isMasterOperator && !showCreateForm) {
      return (
        <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:space-y-8 sm:px-5 sm:py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                For businesses · Operator Workspace Selector
              </div>
              <h1 className="mt-2 font-display text-2xl text-foreground sm:text-4xl">
                Choose a business from Browse to manage
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-base">
                You are signed in as Platform Master ({user?.fullName}). Select any of the actual
                published business profiles below to open and manage its live dashboard, services,
                team, availability slots, and bookings.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" /> List a new business instead
            </Button>
          </div>

          {loadingBrowse ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-52 rounded-3xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {browseProviders.map((p) => {
                const tpl = resolveCategoryTemplate(p.category, p.template_id);
                const TplIcon = tpl.Icon;
                const isBusy = switchingId === p.id;
                return (
                  <div
                    key={p.id}
                    className="flex flex-col justify-between rounded-3xl border border-border bg-card p-5 transition hover:border-primary/40"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary">
                          <TplIcon className="h-3.5 w-3.5" />
                          {tpl.title}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 text-primary/70" />
                          {p.city || 'SA'}
                        </span>
                      </div>
                      <h3 className="mt-3 font-display text-lg text-foreground">{p.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Owner: <span className="text-foreground">{p.primaryContactName || p.owner_email}</span>
                      </p>
                      {p.tagline && (
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                          {p.tagline}
                        </p>
                      )}
                    </div>

                    <Button
                      className="mt-5 h-10 w-full rounded-full text-xs"
                      disabled={switchingId !== null}
                      onClick={async () => {
                        setSwitchingId(p.id);
                        try {
                          const res = await masterApi.demoLogin({
                            email: p.owner_email,
                            providerId: p.id,
                          });
                          toast.success(res.message);
                          await refreshAuth();
                          await reloadMyProvider();
                        } catch (err: any) {
                          toast.error(err.message || 'Could not switch to business profile');
                        } finally {
                          setSwitchingId(null);
                        }
                      }}
                    >
                      {isBusy ? (
                        <>
                          <Spinner className="mr-2 h-3.5 w-3.5 border-primary-foreground" />
                          Opening dashboard…
                        </>
                      ) : (
                        <>
                          Manage {p.name} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-5 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.3em] text-primary/80">For businesses</p>
          {isMasterOperator && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setShowCreateForm(false)}
            >
              Manage an existing Browse business
            </Button>
          )}
        </div>
        <h1 className="mt-3 font-display text-2xl text-foreground sm:text-4xl">
          List your business
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Publish your services, add the professionals customers can choose from, then open time
          slots. Bookings land straight in this dashboard.
        </p>
        <div className="mt-6 sm:mt-8">
          <BusinessForm
            submitLabel="Create my business"
            onSubmit={async (data) => {
              const created = await providersApi.create({
                ...data,
                status: 'published',
              });
              setProvider(created);
              await refreshAuth();
              toast.success(`"${created.name}" is now live on BookIt!`);
            }}
          />
        </div>
      </div>
    );
  }

  const { label: categoryLabel } = getCategoryMeta(provider.category);
  const template = resolveCategoryTemplate(provider.category, provider.template_id);
  const TemplateIcon = template.Icon;

  return (
    <div>
      <DashboardSubNav />
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-5 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs uppercase tracking-[0.3em] text-primary/80">
                Provider dashboard
              </p>
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/5 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                <TemplateIcon className="h-3 w-3" />
                {template.title}
              </span>
            </div>
            <h1 className="mt-2 font-display text-2xl text-foreground sm:mt-3 sm:text-3xl">
              {provider.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {categoryLabel}
              {provider.city ? ` · ${provider.city}` : ''} ·{' '}
              <span className="text-foreground/80">
                {template.terminologyPills.join(' · ')}
              </span>
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            {isMasterOperator && (
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-full gap-1.5 sm:flex-none"
                onClick={() => navigate('/demo')}
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Switch business
              </Button>
            )}
            <CategoryTemplatePickerModal
              currentCategory={provider.category}
              currentTemplateId={provider.template_id}
              onSelectTemplate={async (nextTpl) => {
                try {
                  const nextCat = nextTpl.legacyCategories.includes(provider.category)
                    ? provider.category
                    : nextTpl.id;
                  const updated = await providersApi.update(provider.id, {
                    category: nextCat,
                    template_id: nextTpl.id,
                  });
                  setProvider({ ...provider, ...updated });
                  toast.success(`Switched workspace template to "${nextTpl.title}".`);
                } catch (err: any) {
                  toast.error(err.message || 'Could not update category template');
                }
              }}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-full gap-1.5 sm:flex-none"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Category template
                </Button>
              }
            />
            <Button
              variant="outline"
              className="flex-1 rounded-full sm:flex-none"
              onClick={() => navigate(`/providers/${provider.id}`)}
            >
              View public page
            </Button>
            <Button
              className="flex-1 rounded-full sm:flex-none"
              onClick={() => navigate('/dashboard/availability')}
            >
              Add slots
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label={template.kpiCards[0].label}
            value={stats ? stats.todayCount : '—'}
            hint={template.kpiCards[0].hint}
            Icon={Calendar}
          />
          <StatCard
            label={template.kpiCards[1].label}
            value={stats ? stats.upcomingCount : '—'}
            hint={template.kpiCards[1].hint}
            Icon={Clock}
          />
          <StatCard
            label={template.kpiCards[2].label}
            value={stats ? stats.pendingCount : '—'}
            hint={template.kpiCards[2].hint}
            Icon={CalendarCheck}
          />
          <StatCard
            label={template.kpiCards[3].label}
            value={stats ? formatZAR(stats.revenue) || 'R0' : '—'}
            hint={template.kpiCards[3].hint}
            Icon={Banknote}
          />
        </div>

        {!stats ? (
          <div className="mt-10">
            <Skeleton className="h-40 rounded-3xl" />
          </div>
        ) : (
          <CategoryWorkspaceBoard
            template={template}
            bookings={todayBookings}
            onChange={() => void loadStats()}
          />
        )}
      </div>
    </div>
  );
}
