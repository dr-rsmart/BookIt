/**
 * Main Application Layout
 * -----------------------
 * Exact like-for-like BookIt! (Base44) top header & footer,
 * fused with TimeTrack's enterprise Master Impersonation / Simulator bar,
 * real-time SSE connection badge, dark/light theme toggle, and governance nav.
 */

import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  CalendarCheck,
  LogOut,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Sparkles,
  ShieldCheck,
  ScrollText,
  User,
  Compass,
  LayoutDashboard,
  Building2,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSSEConnection, useSSEStatus } from '../../hooks/useSSE';
import { masterApi } from '../../services/api';
import { Button, BookItLogo } from '../ui';
import { cn } from '../../lib/utils';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'whitespace-nowrap text-sm transition-colors',
    isActive ? 'font-semibold text-primary' : 'text-muted-foreground hover:text-foreground',
  );

export default function AppLayout() {
  const { user, isAuthenticated, logout, refresh, isMaster, isAdmin } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useSSEConnection();
  const sseStatus = useSSEStatus();

  const isDemoSession = Boolean(user?.demoEmail);

  const handleStopImpersonation = async () => {
    try {
      await masterApi.stopImpersonation();
      toast.success('Restored Master Console session.');
      await refresh();
      navigate('/master');
    } catch (err: any) {
      toast.error(err.message || 'Failed to exit impersonation');
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  const mobileBottomItems = isAuthenticated
    ? [
        { to: '/', label: 'Browse', icon: Compass, end: true },
        { to: '/my-bookings', label: 'Bookings', icon: CalendarCheck },
        {
          to: '/dashboard',
          label: user?.providerId ? 'Dashboard' : 'Business',
          icon: LayoutDashboard,
        },
        ...(isMaster
          ? [{ to: '/master', label: 'Master', icon: ShieldCheck }]
          : isAdmin || user?.role === 'manager'
            ? [{ to: '/audit', label: 'Audit', icon: ScrollText }]
            : []),
        { to: '/profile', label: 'Profile', icon: User },
      ]
    : [
        { to: '/', label: 'Browse', icon: Compass, end: true },
        { to: '/dashboard', label: 'Businesses', icon: Building2 },
        { to: '/login', label: 'Sign in', icon: LogIn },
        { to: '/register', label: 'Register', icon: UserPlus },
      ];

  // Hide bottom nav on /providers/:id/book so step buttons have full space, or keep it everywhere with proper padding
  const isProviderDetail = /^\/providers\/[^/]+$/.test(location.pathname);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      {/* ── TimeTrack Master Impersonation / Demo Banner ── */}
      {user?.originalRole === 'master' && (
        <div className="relative z-50 flex flex-wrap items-center justify-between gap-2 bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-md sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            {isDemoSession ? (
              <span className="truncate">
                Simulator Persona: <span className="font-bold">{user.fullName}</span> ({user.role})
              </span>
            ) : (
              <span className="truncate">
                Impersonating:{' '}
                <span className="font-bold">{user.provider?.name || user.fullName}</span>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleStopImpersonation}
            className="shrink-0 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 font-bold text-primary-foreground transition hover:bg-primary-foreground/20"
          >
            Return to Master Console
          </button>
        </div>
      )}

      {/* ── Sticky Header (like-for-like with Base44 + TimeTrack controls) ── */}
      <header className="safe-top sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:gap-3 sm:px-5">
          <Link to="/" aria-label="BookIt! Home" className="flex shrink-0 items-center transition-opacity hover:opacity-90">
            <BookItLogo size="md" />
          </Link>

          <nav className="hidden items-center gap-6 md:flex lg:gap-7">
            <NavLink to="/" end className={navLinkClass}>
              Browse
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/my-bookings" className={navLinkClass}>
                My bookings
              </NavLink>
            )}
            <NavLink to="/dashboard" className={navLinkClass}>
              {user?.providerId ? 'Dashboard' : 'For businesses'}
            </NavLink>
            {(isAdmin || user?.role === 'manager') && (
              <NavLink to="/audit" className={navLinkClass}>
                <span className="inline-flex items-center gap-1">
                  <ScrollText className="h-3.5 w-3.5" />
                  Audit
                </span>
              </NavLink>
            )}
            {isMaster && (
              <>
                <NavLink to="/master" className={navLinkClass}>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Master Console
                  </span>
                </NavLink>
                <NavLink to="/demo" className={navLinkClass}>
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    Simulator
                  </span>
                </NavLink>
              </>
            )}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Live SSE Status Indicator (when signed in) */}
            {isAuthenticated && (
              <span
                title={`Real-time stream: ${sseStatus}`}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium sm:px-2.5',
                  sseStatus === 'live'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'border-border bg-secondary text-muted-foreground',
                )}
              >
                {sseStatus === 'live' ? (
                  <Wifi className="h-3 w-3 shrink-0" />
                ) : (
                  <WifiOff className="h-3 w-3 shrink-0" />
                )}
                <span className="hidden sm:inline">{sseStatus === 'live' ? 'Live' : 'Sync'}</span>
              </span>
            )}

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={toggleTheme}
              title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="hidden max-w-[160px] items-center gap-1.5 truncate rounded-full px-2.5 py-1 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground sm:inline-flex"
                  title="Account profile & password"
                >
                  <User className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">{user?.fullName || user?.email}</span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Sign out"
                  onClick={handleSignOut}
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Sign in
                </Button>
                <Button
                  size="sm"
                  className="hidden rounded-full sm:inline-flex"
                  onClick={() => navigate('/register')}
                >
                  List your business
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Secondary Scrollable Nav */}
        <nav className="no-scrollbar flex items-center gap-5 overflow-x-auto border-t border-border/60 px-4 py-2 md:hidden">
          <NavLink to="/" end className={navLinkClass}>
            Browse
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/my-bookings" className={navLinkClass}>
              My bookings
            </NavLink>
          )}
          <NavLink to="/dashboard" className={navLinkClass}>
            {user?.providerId ? 'Dashboard' : 'For businesses'}
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/profile" className={navLinkClass}>
              Profile
            </NavLink>
          )}
          {(isAdmin || user?.role === 'manager') && (
            <NavLink to="/audit" className={navLinkClass}>
              Audit
            </NavLink>
          )}
          {isMaster && (
            <>
              <NavLink to="/master" className={navLinkClass}>
                Master
              </NavLink>
              <NavLink to="/demo" className={navLinkClass}>
                Simulator
              </NavLink>
            </>
          )}
          {!isAuthenticated && (
            <NavLink to="/register" className={navLinkClass}>
              List your business
            </NavLink>
          )}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer
        className={cn(
          'border-t border-border/60 bg-secondary/40',
          isProviderDetail ? 'pb-36 md:pb-0' : 'pb-20 md:pb-0',
        )}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-5 sm:py-10">
          <div>
            <Link to="/" aria-label="BookIt!" className="inline-block">
              <BookItLogo size="md" />
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Book doctors, salons, mechanics and more across South Africa.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground">
              Terms & Conditions
            </Link>
            <Link to="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link to="/support" className="hover:text-foreground">
              Support
            </Link>
            <span>© {new Date().getFullYear()} BookIt!</span>
          </div>
        </div>
      </footer>

      {/* ── Fixed Mobile Bottom Navigation Bar (thumb-friendly mobile UX) ── */}
      <nav
        aria-label="Mobile navigation"
        data-testid="mobile-bottom-nav"
        className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
          {mobileBottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex min-w-[56px] flex-col items-center justify-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 font-semibold text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
