/**
 * Register Page (`$_` in Base44)
 * ------------------------------
 * Public account registration for customers or business owners.
 */

import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Loader2, ArrowLeft, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button, Input, Label, BookingTrackLogo } from '../components/ui';
import { ApiError } from '../services/api';

export default function Register() {
  const { register } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123');
  const [confirm, setConfirm] = useState('Password123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const rawReturnTo = searchParams.get('returnTo') || '/';
  const returnTo =
    rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//') ? rawReturnTo : '/';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const effectivePassword = password.trim() || 'Password123';
    if (password && password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await register({ email, password: effectivePassword, fullName: fullName.trim() || undefined });
      toast.success('Welcome to BookIt!');
      navigate(returnTo);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
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
            <BookingTrackLogo size="lg" />
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="mt-2 text-muted-foreground">Sign up to get started</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 pl-10"
                />
              </div>
            </div>

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
                <span className="text-[11px] text-muted-foreground">Default: Password123</span>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Password123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="h-12 pl-10"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Default password is <strong>Password123</strong>. You can change it anytime in your Profile.
              </p>
            </div>

            <Button type="submit" className="h-12 w-full font-medium" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            to={`/login${returnTo === '/' ? '' : `?returnTo=${encodeURIComponent(returnTo)}`}`}
            className="font-medium text-primary hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
