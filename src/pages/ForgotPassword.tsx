/**
 * Forgot Password & Token Reset Page
 * ----------------------------------
 * Supports both token-based self-service password resets (`/reset-password?token=...`)
 * and business administrator recovery lookup (`/forgot-password`).
 */

import { useState, type FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Loader2, KeyRound, Building2, User } from 'lucide-react';
import { toast } from 'sonner';
import { authApi, ApiError } from '../services/api';
import { Button, Input, Label, BookItLogo } from '../components/ui';

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resetToken = searchParams.get('token')?.trim() || '';

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    adminEmail: string | null;
    adminName: string | null;
    providerName?: string | null;
  } | null>(null);

  const handleResetWithToken = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await authApi.resetPassword({ token: resetToken, newPassword });
      toast.success(res.message);
      navigate('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword(email);
      setResult({
        message: res.message,
        adminEmail: res.adminEmail,
        adminName: res.adminName,
        providerName: res.providerName,
      });
    } catch {
      setResult({
        message: 'Please reach out to BookIt! Support or your business administrator to reset your password.',
        adminEmail: 'support@bookit.co.za',
        adminName: 'BookIt! Support & Admin',
        providerName: 'BookIt!',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="safe-top safe-bottom flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8 sm:py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center sm:mb-10">
          <Link
            to="/"
            aria-label="BookIt! Home"
            className="mb-5 inline-flex items-center justify-center transition-opacity hover:opacity-90"
          >
            <BookItLogo size="lg" />
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            {resetToken ? 'Set a New Password' : 'Forgot Password'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {resetToken
              ? 'Choose a new password for your BookIt! account'
              : 'Request password recovery or look up your workspace administrator'}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          {resetToken ? (
            <form onSubmit={handleResetWithToken} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="new-password"
                    type="password"
                    minLength={6}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="h-12 pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="confirm-password"
                    type="password"
                    minLength={6}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="h-12 pl-10"
                  />
                </div>
              </div>
              <Button type="submit" className="h-12 w-full font-medium" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating password...
                  </>
                ) : (
                  'Save new password'
                )}
              </Button>
            </form>
          ) : result ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-foreground">
                  Password Recovery Instructions
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {result.providerName ? `Workspace: ${result.providerName}` : 'BookIt! Workspace'}
                </p>

                {result.adminEmail && (
                  <div className="mt-4 rounded-xl border border-border bg-background p-3 text-sm">
                    {result.adminName && (
                      <p className="flex items-center justify-center gap-1.5 font-medium text-foreground">
                        <User className="h-4 w-4 text-primary" /> {result.adminName}
                      </p>
                    )}
                    <a
                      href={`mailto:${result.adminEmail}?subject=BookIt!%20Password%20Reset%20Request%20(${encodeURIComponent(email)})`}
                      className="mt-1 block font-semibold text-primary underline hover:text-primary/80 break-all"
                    >
                      {result.adminEmail}
                    </a>
                  </div>
                )}

                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  {result.message}
                </p>
              </div>

              <Button
                type="button"
                className="h-11 w-full rounded-full"
                onClick={() => {
                  setResult(null);
                  setEmail('');
                }}
              >
                Look up another email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Your Account Email</Label>
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
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the email address associated with your practitioner or customer account.
                </p>
              </div>

              <Button type="submit" className="h-12 w-full font-medium" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Requesting recovery...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" /> Request Password Reset
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
