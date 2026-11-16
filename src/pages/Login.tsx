/**
 * Login Page (`D_` and `w_` in Base44 + TimeTrack session banners)
 * ---------------------------------------------------------------
 * Reproduces the Base44 first-party email/password auth shell (icon badge,
 * Welcome back, Email & Password inputs, Forgot password link) with
 * TimeTrack's session revocation & suspension banners.
 */

import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Loader2, Ban, AlertTriangle, ArrowLeft, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button, Input, Label, BookItLogo } from '../components/ui';
import { ApiError } from '../services/api';

export default function Login() {
  const { login, sessionError, clearSessionError } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const rawReturnTo = searchParams.get('returnTo') || '/';
  const returnTo =
    rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//') ? rawReturnTo : '/';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(returnTo);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="safe-top safe-bottom flex min-h-[100dvh] flex-col bg-background px-4 py-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-md items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Browse businesses
        </Link>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={toggleTheme}
          title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      <div className="m-auto w-full max-w-md py-6">
        <div className="mb-8 text-center sm:mb-10">
          <Link
            to="/"
            aria-label="BookIt! Home"
            className="mb-5 inline-flex items-center justify-center transition-opacity hover:opacity-90"
          >
            <BookItLogo size="lg" />
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-muted-foreground">Log in to your account</p>
        </div>

        {sessionError && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {sessionError.code === 'COMPANY_SUSPENDED' ? (
              <Ban className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-semibold">
                {sessionError.code === 'COMPANY_SUSPENDED'
                  ? 'Business Account Suspended'
                  : 'Session Ended'}
              </p>
              <p className="mt-0.5 text-xs opacity-90">{sessionError.message}</p>
            </div>
            <button
              type="button"
              onClick={clearSessionError}
              className="text-xs underline opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="h-12 w-full font-medium" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Log in'
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link
            to={`/register${returnTo === '/' ? '' : `?returnTo=${encodeURIComponent(returnTo)}`}`}
            className="font-medium text-primary hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
