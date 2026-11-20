/**
 * Platform Simulator Page (`/demo`)
 * ---------------------------------
 * Dynamically connects to all actual published business profiles under Browse
 * (across all 13 Category Templates) plus Customer and Platform Master personas,
 * allowing 1-click simulation to manage, edit, add services/team/slots/bookings,
 * or test the public booking experience.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  User,
  ArrowRight,
  HelpCircle,
  MapPin,
  ExternalLink,
  Search,
  LayoutDashboard,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { masterApi, providersApi, type ProviderRecord } from '../services/api';
import { Button, Input, Skeleton, Spinner } from '../components/ui';
import {
  BROWSE_CATEGORIES,
  getCategoryMeta,
  resolveCategoryTemplate,
  cn,
} from '../lib/utils';

const SYSTEM_PERSONAS = [
  {
    email: 'sipho@bookit.com',
    label: 'Sipho Ndlovu — Customer Account',
    roleBadge: 'customer',
    targetPath: '/my-bookings',
    description:
      'Active South African customer with upcoming & completed appointments across healthcare, salon, auto, and padel.',
    icon: User,
  },
  {
    email: 'lerato@bookit.com',
    label: 'Lerato Dlamini — Customer Account',
    roleBadge: 'customer',
    targetPath: '/my-bookings',
    description:
      'Customer account with pending clinic & bistro reservations to test reminders, rescheduling & cancellations.',
    icon: User,
  },
  {
    email: 'master@smartpatel.co.za',
    label: 'Platform Master — Control Center',
    roleBadge: 'master',
    targetPath: '/master',
    description:
      'Root governance over all South African business tenants, onboarding, suspension & POPIA audit trail.',
    icon: ShieldCheck,
  },
];

export default function Demo() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const loadBrowseProviders = useCallback(async () => {
    setLoadingProviders(true);
    try {
      const res = await providersApi.list({ status: 'published', limit: 60 });
      setProviders(res.items);
    } catch {
      setProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  }, []);

  useEffect(() => {
    void loadBrowseProviders();
  }, [loadBrowseProviders]);

  const handleLaunchPersona = async (
    payload: { email?: string; providerId?: string },
    targetPath: string,
    key: string,
  ) => {
    setLoadingKey(key);
    try {
      const res = await masterApi.demoLogin(payload);
      toast.success(res.message);
      await refresh();
      navigate(targetPath);
    } catch (err: any) {
      toast.error(err.message || 'Simulator launch failed');
    } finally {
      setLoadingKey(null);
    }
  };

  const filteredProviders = providers.filter((p) => {
    const tpl = resolveCategoryTemplate(p.category, p.template_id);
    if (categoryFilter && tpl.id !== categoryFilter && p.category !== categoryFilter) {
      return false;
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      tpl.title.toLowerCase().includes(q) ||
      (p.owner_email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:space-y-10 sm:px-5 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-widest">
              Operator Sandbox · Live Browse Profiles
            </span>
          </div>
          <h1 className="mt-2 font-display text-2xl text-foreground sm:text-4xl">
            Platform Simulator
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Launch into any of the actual published business profiles from Browse to manage their
            dashboard, services, team, slots, and bookings — or switch to a customer account.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3.5 rounded-3xl border border-primary/25 bg-primary/5 p-5 sm:gap-4 sm:p-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <HelpCircle className="h-5 w-5" />
        </div>
        <div className="min-w-0 text-sm">
          <h4 className="font-display text-base text-foreground">
            Connected Directly to Live Browse Profiles
          </h4>
          <p className="mt-1 text-muted-foreground">
            Every business card below is a real published profile visible under{' '}
            <strong className="text-foreground">Browse</strong>. Launching a business persona signs
            you in as that profile’s actual owner so you can edit their profile, add services &
            team members, generate time slots, and manage bookings on their category workspace board.
          </p>
        </div>
      </div>

      {/* Section 1: Actual Published Business Profiles under Browse */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-foreground sm:text-2xl">
              Actual Business Profiles under Browse ({filteredProviders.length})
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Click “Manage in Dashboard” to open that business’s live workspace as its owner.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search business, template or city…"
              className="h-10 rounded-full bg-card pl-10 text-sm"
            />
          </div>
        </div>

        {/* Category Template Filter Pills */}
        <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategoryFilter('')}
            className={cn(
              'shrink-0 snap-start rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
              categoryFilter === ''
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            All 13 templates ({providers.length})
          </button>
          {BROWSE_CATEGORIES.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategoryFilter(value === categoryFilter ? '' : value)}
              className={cn(
                'inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
                categoryFilter === value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {loadingProviders ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-72 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProviders.map((provider) => {
              const { Icon } = getCategoryMeta(provider.category);
              const template = resolveCategoryTemplate(provider.category, provider.template_id);
              const isCurrentActive = user?.providerId === provider.id;
              const isBusy = loadingKey === provider.id;

              return (
                <div
                  key={provider.id}
                  className={cn(
                    'flex flex-col justify-between overflow-hidden rounded-3xl border bg-card transition',
                    isCurrentActive
                      ? 'border-primary ring-1 ring-primary/40 shadow-[0_18px_48px_-32px_rgba(225,0,100,0.55)]'
                      : 'border-border hover:border-primary/40',
                  )}
                >
                  <div>
                    <div className="relative h-36 w-full overflow-hidden bg-muted">
                      {provider.cover_image ? (
                        <img
                          src={provider.cover_image}
                          alt={provider.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/12 via-background to-accent">
                          <Icon className="h-8 w-8 text-primary/50" />
                        </div>
                      )}
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                        {template.title}
                      </span>
                      {isCurrentActive && (
                        <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground shadow">
                          Active Persona
                        </span>
                      )}
                    </div>

                    <div className="p-5">
                      <h3 className="font-display text-lg leading-snug text-foreground">
                        {provider.name}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Owner:{' '}
                        <span className="font-medium text-foreground">
                          {provider.primaryContactName || provider.owner_email}
                        </span>{' '}
                        ({provider.owner_email})
                      </p>
                      {provider.tagline && (
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                          {provider.tagline}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {template.featureChips.map((chip) => (
                          <span
                            key={chip}
                            className="rounded-full border border-border/80 bg-secondary/40 px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                      <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary/70" />
                        {provider.city || 'South Africa'} · {template.terminology.scheduleTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-border/60 bg-secondary/20 p-4">
                    <Button
                      onClick={() =>
                        handleLaunchPersona(
                          { email: provider.owner_email, providerId: provider.id },
                          '/dashboard',
                          provider.id,
                        )
                      }
                      disabled={loadingKey !== null}
                      className="h-10 w-full rounded-full text-xs"
                    >
                      {isBusy ? (
                        <>
                          <Spinner className="mr-2 h-3.5 w-3.5 border-primary-foreground" />
                          Launching Dashboard…
                        </>
                      ) : (
                        <>
                          <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                          Manage in Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/providers/${provider.id}`)}
                      className="h-9 w-full rounded-full text-xs"
                    >
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      View Public Booking Page
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 2: Customer & Platform Master Personas */}
      <section className="space-y-4 border-t border-border/60 pt-8">
        <div>
          <h2 className="font-display text-xl text-foreground sm:text-2xl">
            Customer & Governance Personas
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Switch to a customer account to test booking appointments and managing upcoming visits.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
          {SYSTEM_PERSONAS.map((persona) => {
            const Icon = persona.icon;
            const isBusy = loadingKey === persona.email;

            return (
              <div
                key={persona.email}
                className="flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-sm"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-base text-foreground">{persona.label}</h3>
                      <p className="break-all text-xs text-muted-foreground">
                        {persona.email} · <span className="text-primary">{persona.roleBadge}</span>
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {persona.description}
                  </p>
                </div>

                <Button
                  onClick={() =>
                    handleLaunchPersona({ email: persona.email }, persona.targetPath, persona.email)
                  }
                  disabled={loadingKey !== null}
                  variant="outline"
                  className="mt-5 h-10 w-full rounded-full text-xs"
                >
                  {isBusy ? (
                    <>
                      <Spinner className="mr-2 h-3.5 w-3.5" />
                      Launching…
                    </>
                  ) : (
                    <>
                      Launch Persona <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
