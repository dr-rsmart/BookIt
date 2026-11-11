/**
 * User Profile & Security Page (TimeTrack standard)
 */

import { useState, type FormEvent } from 'react';
import { User, KeyRound, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { authApi, ApiError } from '../services/api';
import { Badge, Button, Input, Label } from '../components/ui';

export default function Profile() {
  const { user, refresh } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

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
    </div>
  );
}
