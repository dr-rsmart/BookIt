/**
 * Provider Dashboard Sub-Navigation (`PP` in Base44)
 */

import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  Clock,
  Briefcase,
  Users,
  Building2,
} from 'lucide-react';
import { useMyProvider } from '../../hooks/useMyProvider';
import { cn, resolveCategoryTemplate } from '../../lib/utils';

export default function DashboardSubNav() {
  const navRef = useRef<HTMLElement | null>(null);
  const { pathname } = useLocation();
  const { provider } = useMyProvider();
  const template = provider
    ? resolveCategoryTemplate(provider.category, provider.template_id)
    : null;

  const tabs = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    {
      to: '/dashboard/bookings',
      label: template ? template.terminology.bookingsNavLabel : 'Bookings',
      icon: CalendarCheck,
    },
    { to: '/dashboard/availability', label: 'Availability', icon: Clock },
    {
      to: '/dashboard/services',
      label: template ? template.terminology.servicesNavLabel : 'Services',
      icon: Briefcase,
    },
    {
      to: '/dashboard/team',
      label: template ? template.terminology.teamNavLabel : 'Team',
      icon: Users,
    },
    { to: '/dashboard/profile', label: 'Business profile', icon: Building2 },
  ];

  useEffect(() => {
    const activeEl = navRef.current?.querySelector('[aria-current="page"]') as HTMLElement | null;
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [pathname]);

  const TemplateIcon = template?.Icon;

  return (
    <div className="border-b border-border/60 bg-background/80 backdrop-blur">
      <nav
        ref={navRef}
        aria-label="Dashboard sections"
        className="no-scrollbar mx-auto flex w-full max-w-6xl items-center justify-between gap-2 overflow-x-auto px-4 py-2.5 sm:px-5 sm:py-3"
      >
        <div className="flex items-center gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm transition-colors sm:px-4',
                    isActive
                      ? 'bg-primary font-medium text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )
                }
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {tab.label}
              </NavLink>
            );
          })}
        </div>

        {template && TemplateIcon && (
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-medium text-primary lg:inline-flex">
            <TemplateIcon className="h-3.5 w-3.5" />
            {template.title}
          </span>
        )}
      </nav>
    </div>
  );
}
