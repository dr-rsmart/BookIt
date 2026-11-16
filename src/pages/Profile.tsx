/**
 * User Profile & Security Page (TimeTrack standard)
 */

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, KeyRound, ShieldCheck, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { authApi, ApiError } from '../services/api';
import { Badge, Button, DialogModal, Input, Label } from '../components/ui';

export default function Profile() {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await authApi.updateProfile({ fullName, phone });
      await refresh();
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:space-y-8 sm:px-5 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Account & security</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Manage your personal details and account password.
          </p>
        </div>
        <Badge variant="outline" className="border-primary/30 bg-primary/5 uppercase text-primary">
          <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
          {user?.role}
        </Badge>
      </div>

      <form
        onSubmit={handleSaveProfile}
        className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-6"
      >
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg text-foreground">Personal details</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="prof-name">Full name</Label>
            <Input
              id="prof-name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="prof-email">Email</Label>
            <Input
              id="prof-email"
              value={user?.email || ''}
              disabled
              className="mt-2 opacity-70"
            />
          </div>
          <div>
            <Label htmlFor="prof-phone">Phone number</Label>
            <Input
              id="prof-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+27 82 555 0100"
              className="mt-2"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="w-full rounded-full sm:w-auto" disabled={savingProfile}>
            {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save details
          </Button>
        </div>
      </form>

      <form
        onSubmit={handleChangePassword}
        className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-6"
      >
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg text-foreground">Change password</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="curr-pwd">Current password</Label>
            <Input
              id="curr-pwd"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="new-pwd">New password</Label>
            <Input
              id="new-pwd"
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="conf-pwd">Confirm new password</Label>
            <Input
              id="conf-pwd"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="outline"
            className="w-full rounded-full sm:w-auto"
            disabled={savingPassword}
          >
            {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </div>
      </form>

      {user?.role !== 'master' && user?.originalRole !== 'master' && (
        <section
          aria-labelledby="delete-account-heading"
          className="space-y-4 rounded-3xl border border-destructive/30 bg-destructive/5 p-5 sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                <h2 id="delete-account-heading" className="font-display text-lg">
                  Delete account & personal data
                </h2>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Permanently delete your BookIt! account and personal details in accordance with
                POPIA, GDPR, Apple App Store, and Google Play policies. Any upcoming appointments
                will be cancelled and their time slots released.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="destructive"
              className="w-full rounded-full sm:w-auto"
              onClick={() => {
                setDeletePassword('');
                setDeleteReason('');
                setDeleteModalOpen(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete my account
            </Button>
          </div>

          <DialogModal
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            title="Permanently delete your account?"
            footer={
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deletingAccount}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deletingAccount || !deletePassword.trim()}
                  onClick={async () => {
                    setDeletingAccount(true);
                    try {
                      const res = await authApi.deleteAccount({
                        password: deletePassword,
                        reason: deleteReason.trim() || undefined,
                      });
                      toast.success(res.message);
                      setDeleteModalOpen(false);
                      await logout();
                      navigate('/');
                    } catch (err) {
                      toast.error(
                        err instanceof ApiError ? err.message : 'Failed to delete account',
                      );
                    } finally {
                      setDeletingAccount(false);
                    }
                  }}
                >
                  {deletingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Permanently delete account
                </Button>
              </>
            }
          >
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-xs leading-relaxed">
                  This action cannot be undone. Your account record, name, email, and phone number
                  will be permanently deleted, and any upcoming appointments will be cancelled.
                </p>
              </div>
              <div>
                <Label htmlFor="delete-pwd">Confirm your current password</Label>
                <Input
                  id="delete-pwd"
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="delete-reason">Reason for leaving (optional)</Label>
                <Input
                  id="delete-reason"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Optional feedback"
                  className="mt-2"
                />
              </div>
            </div>
          </DialogModal>
        </section>
      )}
    </div>
  );
}
