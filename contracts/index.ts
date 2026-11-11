/**
 * Shared API Contracts for BookIt!
 * --------------------------------
 * Type definitions shared between the React frontend and Express 5 backend.
 */

export type Role = 'master' | 'admin' | 'manager' | 'employee' | 'customer';

export type ProviderCategory =
  | 'Doctor'
  | 'Salon'
  | 'Mechanic'
  | 'Dentist'
  | 'Spa & Wellness'
  | 'Fitness'
  | 'Other';

export type ProviderStatus = 'published' | 'draft';

export type SlotStatus = 'open' | 'booked' | 'blocked';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type SessionErrorCode =
  | 'UNAUTHENTICATED'
  | 'COMPANY_SUSPENDED'
  | 'EMPLOYEE_TERMINATED'
  | 'ROLE_REVOKED';

export type ApiErrorCode =
  | SessionErrorCode
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'ACCESS_DENIED'
  | 'DUPLICATE_RECORD'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

export interface WorkingHoursDay {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  full_name?: string;
  phone?: string | null;
  role: Role;
  providerId: string | null;
  provider?: {
    id: string;
    name: string;
    category: string;
    status: string;
    isActive: boolean;
  } | null;
  mustChangePassword?: boolean;
  usingDefaultPassword?: boolean;
  originalRole?: Role;
  demoEmail?: string;
}

export interface ProviderRecord {
  id: string;
  name: string;
  category: ProviderCategory | string;
  tagline: string;
  about: string;
  phone: string;
  email: string;
  website: string;
  street: string;
  city: string;
  postcode: string;
  country: string;
  cover_image: string;
  working_hours: WorkingHoursDay[];
  owner_email: string;
  ownerUserId?: string | null;
  status: ProviderStatus;
  isActive: boolean;
  billingTier?: string;
  vatNumber?: string;
  registrationNumber?: string;
  primaryContactName?: string;
  created_date: string;
  updated_date: string;
}

export interface ServiceRecord {
  id: string;
  provider_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number | null;
  price_note: string;
  professional_ids: string[];
  active: boolean;
  created_date: string;
  updated_date: string;
}

export interface ProfessionalRecord {
  id: string;
  provider_id: string;
  name: string;
  email?: string | null;
  title: string;
  bio: string;
  photo_url: string;
  service_ids: string[];
  active: boolean;
  has_login?: boolean;
  login_role?: string | null;
  created_date: string;
  updated_date: string;
}

export interface SlotRecord {
  id: string;
  provider_id: string;
  professional_id: string;
  service_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  status: SlotStatus;
  booking_id: string | null;
  created_date: string;
  updated_date: string;
}

export interface BookingRecord {
  id: string;
  provider_id: string;
  provider_name: string;
  service_id: string | null;
  service_name: string;
  professional_id: string | null;
  professional_name: string | null;
  slot_id: string | null;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  date: string;
  start_time: string;
  end_time: string;
  price: number | null;
  notes: string;
  status: BookingStatus;
  reminder_sent_at: string | null;
  created_date: string;
  updated_date: string;
}

export interface AuditLogRecord {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  changes: Record<string, { before: unknown; after: unknown }> | null;
  justification: string | null;
  ipAddress: string | null;
  providerId: string | null;
  timestamp: string;
}
