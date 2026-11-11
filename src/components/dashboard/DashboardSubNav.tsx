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
import { cn } from '../../lib/utils';

const DASHBOARD_TABS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/dashboard/availability', label: 'Availability', icon: Clock },
  { to: '/dashboard/services', label: 'Services', icon: Briefcase },
  { to: '/dashboard/team', label: 'Team', icon: Users },
  { to: '/dashboard/profile', label: 'Business profile', icon: Building2 },
];

export default function DashboardSubNav() {
  const navRef = useRef<HTMLElement | null>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const activeEl = navRef.current?.querySelector('[aria-current="page"]') as HTMLElement | null;
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [pathname]);

  return (
    <div className="border-b border-border/60 bg-background/80 backdrop-blur">
      <nav
        ref={navRef}
        aria-label="Dashboard sections"
        className="no-scrollbar mx-auto flex w-full max-w-6xl gap-1.5 overflow-x-auto px-4 py-2.5 sm:px-5 sm:py-3"
      >
        {DASHBOARD_TABS.map((tab) => {
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
      </nav>
    </div>
  );
}
