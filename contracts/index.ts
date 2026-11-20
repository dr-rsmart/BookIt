/**
 * Shared API Contracts for BookIt!
 * --------------------------------
 * Type definitions shared between the React frontend and Express 5 backend.
 */

export type Role = 'master' | 'admin' | 'manager' | 'employee' | 'customer';

export type CategoryTemplateId =
  | 'Hair, Beauty & Wellness'
  | 'Healthcare'
  | 'Fitness & Classes'
  | 'Sport Facilities'
  | 'Tuition'
  | 'Restaurants & Cafes'
  | 'Catering & Events'
  | 'Venues & Spaces'
  | 'Home & Trade Services'
  | 'Automotive'
  | 'Pet Services'
  | 'Photography & Creative Services'
  | 'Professional Consultations';

export type ProviderCategory =
  | 'Doctor'
  | 'Salon'
  | 'Mechanic'
  | 'Dentist'
  | 'Spa & Wellness'
  | 'Fitness'
  | 'Other'
  | CategoryTemplateId;

export interface BookingAddonSelection {
  id: string;
  label: string;
  price: number;
}

export interface BookingMetadata {
  template_id?: CategoryTemplateId | string;
  stage?: string;
  resource_label?: string;
  addons?: BookingAddonSelection[];
  addons_total?: number;
  // Healthcare
  patient_type?: 'New patient' | 'Returning patient' | string;
  payment_method?: 'Medical aid claim' | 'Private / card' | string;
  medical_aid_scheme?: string;
  medical_aid_number?: string;
  dependant_code?: string;
  // Automotive
  vehicle_reg?: string;
  vehicle_make_model?: string;
  vehicle_year?: string;
  odometer_km?: string;
  transport_option?: 'Drop & collect' | 'Wait at workshop' | string;
  // Fitness & Classes
  spot_number?: number | string;
  pass_type?: 'Single drop-in' | 'Use class pack' | 'Intro offer' | string;
  // Sport Facilities
  sport_type?: string;
  match_type?: 'Casual booking' | 'Open match — find players' | 'Coaching session' | string;
  court_label?: string;
  // Tuition
  subject?: string;
  academic_level?: string;
  delivery_mode?: 'In-person at centre' | 'Online video classroom' | string;
  lesson_pack?: string;
  // Restaurants & Cafes
  party_size?: number;
  sitting?: 'Lunch' | 'Dinner' | 'Breakfast / Brunch' | string;
  seating_area?: string;
  occasion_tags?: string[];
  // Catering & Events
  event_type?: string;
  guest_count?: number;
  service_style?: string;
  dietary_counts?: Record<string, number>;
  venue_address?: string;
  setup_time?: string;
  // Venues & Spaces
  hire_duration?: string;
  room_layout?: string;
  // Home & Trade Services
  trade_category?: string;
  urgency_tier?: string;
  service_address?: string;
  suburb?: string;
  property_type?: string;
  arrival_window?: string;
  // Pet Services
  pet_name?: string;
  pet_species?: 'Dog' | 'Cat' | string;
  pet_size?: string;
  pet_breed?: string;
  coat_condition?: string;
  temperament_tags?: string[];
  // Photography & Creative Services
  location_mode?: 'In-studio' | 'On-location' | string;
  shoot_location_address?: string;
  golden_hour?: boolean;
  // Professional Consultations
  practice_area?: string;
  meeting_format?: 'Video call (Teams / Zoom)' | 'In-person boardroom' | 'Phone consultation' | string;
  entity_name?: string;
  counterparty_name?: string;
  matter_reference?: string;
  [key: string]: unknown;
}

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
  template_id?: CategoryTemplateId | string;
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
  metadata?: BookingMetadata;
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
