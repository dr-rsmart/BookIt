/**
 * Entity Serializers
 * ------------------
 * Maps Prisma models (`Provider`, `Service`, `Professional`, `Slot`, `Booking`)
 * to clean JSON payloads supporting both snake_case (Base44 like-for-like UI)
 * and camelCase (TimeTrack enterprise conventions).
 */

import type {
  Provider,
  Service,
  Professional,
  Slot,
  Booking,
} from '@prisma/client';

export interface WorkingHoursDay {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface ProviderRecord {
  id: string;
  name: string;
  category: string;
  template_id: string;
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
  status: 'published' | 'draft';
  isActive: boolean;
  billingTier?: string;
  vatNumber?: string;
  registrationNumber?: string;
  primaryContactName?: string;
  slot_cutoff_minutes: number;
  created_date: string;
  updated_date: string;
}

const LEGACY_TO_TEMPLATE_MAP: Record<string, string> = {
  Doctor: 'Healthcare',
  Dentist: 'Healthcare',
  Salon: 'Hair, Beauty & Wellness',
  'Spa & Wellness': 'Hair, Beauty & Wellness',
  Mechanic: 'Automotive',
  Fitness: 'Fitness & Classes',
  Other: 'Professional Consultations',
};

export const ALL_CATEGORY_TEMPLATES = [
  'Hair, Beauty & Wellness',
  'Healthcare',
  'Fitness & Classes',
  'Sport Facilities',
  'Tuition',
  'Restaurants & Cafes',
  'Catering & Events',
  'Venues & Spaces',
  'Home & Trade Services',
  'Automotive',
  'Pet Services',
  'Photography & Creative Services',
  'Professional Consultations',
] as const;

export function inferTemplateId(category?: string | null, explicitTemplateId?: string | null): string {
  if (explicitTemplateId && explicitTemplateId.trim()) {
    const match = ALL_CATEGORY_TEMPLATES.find(
      (t) => t.toLowerCase() === explicitTemplateId.trim().toLowerCase(),
    );
    if (match) return match;
  }
  if (category && category.trim()) {
    const direct = ALL_CATEGORY_TEMPLATES.find(
      (t) => t.toLowerCase() === category.trim().toLowerCase(),
    );
    if (direct) return direct;
    if (LEGACY_TO_TEMPLATE_MAP[category.trim()]) {
      return LEGACY_TO_TEMPLATE_MAP[category.trim()];
    }
  }
  return 'Professional Consultations';
}

export function expandCategoryFilterValues(categoryFilter: string): string[] {
  const trimmed = categoryFilter.trim();
  const values = new Set<string>([trimmed]);
  const templateMatch = ALL_CATEGORY_TEMPLATES.find(
    (t) => t.toLowerCase() === trimmed.toLowerCase(),
  );
  if (templateMatch) {
    values.add(templateMatch);
    for (const [legacy, tpl] of Object.entries(LEGACY_TO_TEMPLATE_MAP)) {
      if (tpl === templateMatch && legacy !== 'Other') {
        values.add(legacy);
      }
    }
  } else if (LEGACY_TO_TEMPLATE_MAP[trimmed] && trimmed !== 'Other') {
    values.add(LEGACY_TO_TEMPLATE_MAP[trimmed]);
  }
  return Array.from(values);
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
  cutoff_minutes: number;
  status: 'open' | 'booked' | 'blocked';
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
  metadata: Record<string, unknown>;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  reminder_sent_at: string | null;
  created_date: string;
  updated_date: string;
}

export const DEFAULT_WORKING_HOURS: WorkingHoursDay[] = [
  { day: 'Monday', open: '09:00', close: '17:00', closed: false },
  { day: 'Tuesday', open: '09:00', close: '17:00', closed: false },
  { day: 'Wednesday', open: '09:00', close: '17:00', closed: false },
  { day: 'Thursday', open: '09:00', close: '17:00', closed: false },
  { day: 'Friday', open: '09:00', close: '17:00', closed: false },
  { day: 'Saturday', open: '09:00', close: '17:00', closed: false },
  { day: 'Sunday', open: '09:00', close: '17:00', closed: true },
];

export function serializeProvider(
  p: Omit<Provider, 'templateId' | 'slotCutoffMinutes'> & {
    templateId?: string | null;
    slotCutoffMinutes?: number | null;
  },
): ProviderRecord {
  const rawHours = Array.isArray(p.workingHours)
    ? (p.workingHours as unknown as WorkingHoursDay[])
    : DEFAULT_WORKING_HOURS;
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    template_id: inferTemplateId(p.category, p.templateId),
    tagline: p.tagline || '',
    about: p.about || '',
    phone: p.phone || '',
    email: p.email || '',
    website: p.website || '',
    street: p.street || '',
    city: p.city || '',
    postcode: p.postcode || '',
    country: p.country || 'South Africa',
    cover_image: p.coverImage || '',
    working_hours: rawHours.length > 0 ? rawHours : DEFAULT_WORKING_HOURS,
    owner_email: p.ownerEmail,
    ownerUserId: p.ownerUserId,
    status: p.status,
    isActive: p.isActive,
    billingTier: p.billingTier,
    vatNumber: p.vatNumber || '',
    registrationNumber: p.registrationNumber || '',
    primaryContactName: p.primaryContactName || '',
    slot_cutoff_minutes:
      typeof p.slotCutoffMinutes === 'number' && !Number.isNaN(p.slotCutoffMinutes)
        ? Math.max(0, p.slotCutoffMinutes)
        : 15,
    created_date: p.createdAt.toISOString(),
    updated_date: p.updatedAt.toISOString(),
  };
}

export function serializeService(s: Service): ServiceRecord {
  return {
    id: s.id,
    provider_id: s.providerId,
    name: s.name,
    description: s.description || '',
    duration_minutes: s.durationMinutes,
    price: s.price != null ? Number(s.price) : null,
    price_note: s.priceNote || '',
    professional_ids: s.professionalIds || [],
    active: s.active,
    created_date: s.createdAt.toISOString(),
    updated_date: s.updatedAt.toISOString(),
  };
}

export function serializeProfessional(
  p: Professional,
  loginMeta?: { has_login?: boolean; login_role?: string | null },
): ProfessionalRecord {
  return {
    id: p.id,
    provider_id: p.providerId,
    name: p.name,
    email: p.email ?? null,
    title: p.title || '',
    bio: p.bio || '',
    photo_url: p.photoUrl || '',
    service_ids: p.serviceIds || [],
    active: p.active,
    ...(loginMeta?.has_login !== undefined ? { has_login: loginMeta.has_login } : {}),
    ...(loginMeta?.login_role !== undefined ? { login_role: loginMeta.login_role } : {}),
    created_date: p.createdAt.toISOString(),
    updated_date: p.updatedAt.toISOString(),
  };
}

export function serializeSlot(
  s: Omit<Slot, 'cutoffMinutes'> & { cutoffMinutes?: number | null },
): SlotRecord {
  return {
    id: s.id,
    provider_id: s.providerId,
    professional_id: s.professionalId,
    service_id: s.serviceId ?? null,
    date: s.date,
    start_time: s.startTime,
    end_time: s.endTime,
    cutoff_minutes:
      typeof s.cutoffMinutes === 'number' && !Number.isNaN(s.cutoffMinutes)
        ? Math.max(0, s.cutoffMinutes)
        : 15,
    status: s.status,
    booking_id: s.bookingId ?? null,
    created_date: s.createdAt.toISOString(),
    updated_date: s.updatedAt.toISOString(),
  };
}

export function serializeBooking(
  b: Omit<Booking, 'metadata'> & { metadata?: unknown },
): BookingRecord {
  const rawMeta =
    b.metadata && typeof b.metadata === 'object' && !Array.isArray(b.metadata)
      ? (b.metadata as Record<string, unknown>)
      : {};
  return {
    id: b.id,
    provider_id: b.providerId,
    provider_name: b.providerName,
    service_id: b.serviceId ?? null,
    service_name: b.serviceName,
    professional_id: b.professionalId ?? null,
    professional_name: b.professionalName ?? null,
    slot_id: b.slotId ?? null,
    customer_id: b.customerId ?? null,
    customer_name: b.customerName,
    customer_email: b.customerEmail,
    customer_phone: b.customerPhone || '',
    date: b.date,
    start_time: b.startTime,
    end_time: b.endTime,
    price: b.price != null ? Number(b.price) : null,
    notes: b.notes || '',
    metadata: rawMeta,
    status: b.status,
    reminder_sent_at: b.reminderSentAt ? b.reminderSentAt.toISOString() : null,
    created_date: b.createdAt.toISOString(),
    updated_date: b.updatedAt.toISOString(),
  };
}
