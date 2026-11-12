/**
 * Browse / Home Page (`qT` and `GT` in Base44)
 * --------------------------------------------
 * Hero section, live debounced search ("Search a business, city or service"),
 * category filter pills, and published Provider cards grid.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, ArrowRight, X } from 'lucide-react';
import { providersApi, type ProviderRecord } from '../services/api';
import { Input, Skeleton, BookItIcon } from '../components/ui';
import { CATEGORIES, getCategoryMeta, cn } from '../lib/utils';
import { useSSE } from '../hooks/useSSE';

function ProviderCard({ provider }: { provider: ProviderRecord }) {
  const { Icon, label } = getCategoryMeta(provider.category);
  const locationText = [provider.city, provider.country].filter(Boolean).join(', ');

  return (
    <Link
      to={`/providers/${provider.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition duration-300 active:scale-[0.99] hover:-translate-y-1 hover:shadow-[0_24px_60px_-40px_rgba(225,0,100,0.45)]"
    >
      <div className="relative h-44 w-full overflow-hidden bg-muted">
        {provider.cover_image ? (
          <img
            src={provider.cover_image}
            alt={provider.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/12 via-background to-accent">
            <Icon className="h-9 w-9 text-primary/50" />
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
          <Icon className="h-3.5 w-3.5 text-primary" />
          {label}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-xl leading-tight text-foreground">{provider.name}</h3>
        {provider.tagline && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{provider.tagline}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <p className="flex min-w-0 items-center gap-1.5 truncate text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            <span className="truncate">{locationText || 'South Africa'}</span>
          </p>
          <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
            Book <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Browse() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await providersApi.list({
        status: 'published',
        category: category || undefined,
        search: query.trim() || undefined,
        limit: 60,
      });
      setProviders(res.items);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, [query, category]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchProviders();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchProviders]);

  useSSE(['provider:created', 'provider:updated'], () => {
    void fetchProviders();
  });

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/70" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-5 sm:py-16 lg:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5">
            <BookItIcon className="h-5 w-5" withShadow={false} />
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary sm:tracking-[0.28em]">
              Appointments, simplified
            </p>
          </div>
          <h1 className="mt-3 max-w-2xl font-display text-3xl leading-[1.08] text-foreground sm:mt-4 sm:text-5xl lg:text-6xl">
            Book the right professional, at a time that suits you.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:mt-5 sm:text-lg">
            Doctors, salons, mechanics and more across South Africa — pick a service, choose your
            professional, take an open slot.
          </p>

          <div className="relative mt-6 max-w-xl sm:mt-9">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a business, city or service"
              className="h-12 rounded-full border-border bg-card pl-11 pr-10 text-base shadow-sm sm:h-14"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="no-scrollbar mt-5 flex snap-x gap-2 overflow-x-auto pb-1 sm:mt-6 sm:flex-wrap">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={cn(
                'shrink-0 snap-start whitespace-nowrap rounded-full border px-4 py-2 text-sm transition',
                category === ''
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              Everything
            </button>
            {CATEGORIES.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value === category ? '' : value)}
                className={cn(
                  'flex shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm transition',
                  category === value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-5 sm:py-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-xl text-foreground sm:text-2xl">
            {category
              ? CATEGORIES.find((c) => c.value === category)?.label
              : 'Businesses taking bookings'}
          </h2>
          {!loading && (
            <p className="shrink-0 text-sm text-muted-foreground">{providers.length} available</p>
          )}
        </div>

        {loading ? (
          <div className="mt-6 grid gap-5 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-72 rounded-3xl" />
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-border px-6 py-14 text-center sm:mt-10 sm:py-16">
            <p className="font-display text-xl text-foreground">Nothing here yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try another category, or run a business? List it from the For businesses page.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {providers.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
