/**
 * Multi-Tenant Authorization & Ownership Policy
 * ---------------------------------------------
 * Enforces strict tenant isolation across Providers, Services, Professionals,
 * Availability Slots, and Bookings.
 */

import prisma from './prisma.js';
import type { AuthTokenPayload } from './middleware/auth.js';

export function canAccessTenantRow(
  actor: { role: string; providerId?: string | null },
  targetProviderId: string | null | undefined,
): boolean {
  if (actor.role === 'master') return true;
  if (!targetProviderId || !actor.providerId) return false;
  return actor.providerId === targetProviderId;
}

/**
 * Verifies whether the authenticated user is authorized to manage a specific Provider
 * (and its Services, Professionals, Slots, and Bookings).
 */
export async function canManageProvider(
  actor: AuthTokenPayload | undefined | null,
  providerId: string | null | undefined,
): Promise<boolean> {
  if (!actor || !providerId) return false;
  if (actor.role === 'master') return true;
  if (actor.providerId && actor.providerId === providerId) return true;

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { ownerUserId: true, ownerEmail: true },
  });
  if (!provider) return false;

  return (
    provider.ownerUserId === actor.id ||
    provider.ownerEmail.toLowerCase() === actor.email.toLowerCase()
  );
}

/**
 * Verifies whether the authenticated user can mutate a Booking:
 * - Platform Master or the Provider's owner/manager can perform any status transition
 * - A Customer can only cancel their own booking
 */
export async function canMutateBooking(
  actor: AuthTokenPayload | undefined | null,
  booking: {
    providerId: string;
    customerId: string | null;
    customerEmail: string;
  },
  requestedStatus?: string,
): Promise<{ allowed: boolean; reason?: string }> {
  if (!actor) return { allowed: false, reason: 'Authentication required.' };
  if (actor.role === 'master') return { allowed: true };

  const isProviderManager = await canManageProvider(actor, booking.providerId);
  if (isProviderManager) return { allowed: true };

  const isBookingCustomer =
    (booking.customerId && booking.customerId === actor.id) ||
    booking.customerEmail.toLowerCase() === actor.email.toLowerCase();

  if (!isBookingCustomer) {
    return {
      allowed: false,
      reason: 'Access denied: you do not have permission to modify this booking.',
    };
  }

  if (requestedStatus !== 'cancelled') {
    return {
      allowed: false,
      reason: 'Customers may only cancel their own bookings.',
    };
  }

  return { allowed: true };
}
