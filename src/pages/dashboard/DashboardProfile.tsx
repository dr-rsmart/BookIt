/**
 * Provider Dashboard Business Profile (`nF` in Base44)
 * ----------------------------------------------------
 * Edit public business profile, working hours, cover photo,
 * and toggle search visibility (`published` vs `draft`).
 */

import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { providersApi } from '../../services/api';
import { useMyProvider } from '../../hooks/useMyProvider';
import DashboardSubNav from '../../components/dashboard/DashboardSubNav';
import BusinessForm from '../../components/dashboard/BusinessForm';
import ManualBookingModal from '../../components/dashboard/ManualBookingModal';
import { Button, Switch, Spinner } from '../../components/ui';

export default function DashboardProfile() {
  const { provider, setProvider, loading } = useMyProvider();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!provider) return <Navigate to="/dashboard" replace />;

  const isPublished = provider.status !== 'draft';

  return (
    <div>
      <DashboardSubNav />
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:space-y-8 sm:px-5 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Business profile</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              This is what customers see — address, contact details and opening hours.
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <ManualBookingModal
              provider={provider}
              onCreated={() => navigate('/dashboard/bookings')}
            />
            <Button
              variant="outline"
              className="flex-1 rounded-full sm:flex-none"
              onClick={() => navigate(`/providers/${provider.id}`)}
            >
              Preview public page
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
          <div>
            <p className="font-medium text-foreground">
              {isPublished ? 'Taking bookings' : 'Hidden from search'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPublished
                ? 'Customers can find and book you.'
                : 'Your page is only visible by direct link.'}
            </p>
          </div>
          <Switch
            checked={isPublished}
            onCheckedChange={async (checked) => {
              const updated = await providersApi.update(provider.id, {
                status: checked ? 'published' : 'draft',
              });
              setProvider({ ...provider, ...updated });
              toast.success(
                checked ? 'Business is now visible in search.' : 'Business hidden from search.',
              );
            }}
          />
        </div>

        <BusinessForm
          initial={provider}
          submitLabel="Save profile"
          onCoverImageChange={async (url) => {
            try {
              const updated = await providersApi.update(provider.id, { cover_image: url });
              setProvider({ ...provider, ...updated });
            } catch (err: any) {
              toast.error(err?.message || 'Could not save cover photo');
            }
          }}
          onSubmit={async (patch) => {
            const updated = await providersApi.update(provider.id, patch);
            setProvider({ ...provider, ...updated });
            toast.success('Business profile saved.');
          }}
        />
      </div>
    </div>
  );
}
