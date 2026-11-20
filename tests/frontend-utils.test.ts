/**
 * Frontend Domain & Formatting Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  CATEGORIES,
  BROWSE_CATEGORIES,
  CATEGORY_TEMPLATES,
  getCategoryMeta,
  resolveCategoryTemplate,
  formatBookingMetadataBadges,
  getBookingOperationalStage,
  defaultWorkingHours,
  timeToMinutes,
  minutesToTime,
  formatTime12,
  formatDateHuman,
  formatDuration,
  formatZAR,
  isSlotExpiredByCutoff,
} from '../src/lib/utils';

describe('BookIt! Frontend Utilities & Formatters', () => {
  it('resolves South African provider categories with fallback to Other', () => {
    expect(CATEGORIES.length).toBe(7);
    expect(getCategoryMeta('Doctor').label).toBe('Doctors');
    expect(getCategoryMeta('Salon').label).toBe('Salons');
    expect(getCategoryMeta('UnknownCategory').value).toBe('Other');
  });

  it('provides all 13 industry category templates and maps legacy categories seamlessly', () => {
    expect(CATEGORY_TEMPLATES).toHaveLength(13);
    expect(BROWSE_CATEGORIES).toHaveLength(13);

    expect(resolveCategoryTemplate('Doctor').id).toBe('Healthcare');
    expect(resolveCategoryTemplate('Dentist').id).toBe('Healthcare');
    expect(resolveCategoryTemplate('Salon').id).toBe('Hair, Beauty & Wellness');
    expect(resolveCategoryTemplate('Spa & Wellness').id).toBe('Hair, Beauty & Wellness');
    expect(resolveCategoryTemplate('Mechanic').id).toBe('Automotive');
    expect(resolveCategoryTemplate('Fitness').id).toBe('Fitness & Classes');
    expect(resolveCategoryTemplate('Sport Facilities').terminology.bookingSingular).toBe('Slot');
    expect(resolveCategoryTemplate('Restaurants & Cafes').terminology.bookingSingular).toBe('Reservation');
    expect(resolveCategoryTemplate('Tuition').terminology.teamPlural).toBe('Tutors');
    expect(resolveCategoryTemplate('Pet Services').terminology.customerSingular).toBe('Pet owner');
  });

  it('formats structured category booking metadata into display badges and resolves operational stage', () => {
    const autoBadges = formatBookingMetadataBadges({
      stage: 'On hoist / In bay',
      resource_label: 'Bay 1 — Service Hoist',
      vehicle_reg: 'CA 482-910',
      vehicle_make_model: 'VW Golf 8 GTI',
      transport_option: 'Drop & collect',
      addons: [{ id: 'wheel_alignment', label: '3D 4-Wheel Laser Alignment check', price: 480 }],
    });
    expect(autoBadges.some((b) => b.label.includes('CA 482-910'))).toBe(true);
    expect(autoBadges.some((b) => b.label.includes('Bay 1'))).toBe(true);
    expect(autoBadges.some((b) => b.label.includes('+1 add-on'))).toBe(true);

    const autoTpl = resolveCategoryTemplate('Automotive');
    const stage = getBookingOperationalStage(
      {
        id: 'b_1',
        provider_id: 'p_1',
        provider_name: 'Cape Auto',
        service_id: 's_1',
        service_name: 'Service',
        professional_id: 'pro_1',
        professional_name: 'Dawid',
        slot_id: null,
        customer_id: 'c_1',
        customer_name: 'Sipho',
        customer_email: 'sipho@bookit.com',
        customer_phone: '',
        date: '2026-11-04',
        start_time: '09:00',
        end_time: '10:00',
        price: 1650,
        notes: '',
        status: 'completed',
        reminder_sent_at: null,
        created_date: '',
        updated_date: '',
      },
      autoTpl,
    );
    expect(stage).toBe('Ready for collection');
  });

  it('generates default 7-day working hours with Sunday closed', () => {
    const hours = defaultWorkingHours();
    expect(hours).toHaveLength(7);
    expect(hours.find((h) => h.day === 'Monday')?.closed).toBe(false);
    expect(hours.find((h) => h.day === 'Sunday')?.closed).toBe(true);
  });

  it('converts between HH:mm strings, minutes, and 12-hour AM/PM labels', () => {
    expect(timeToMinutes('09:30')).toBe(570);
    expect(minutesToTime(570)).toBe('09:30');
    expect(formatTime12('09:05')).toBe('9:05 AM');
    expect(formatTime12('12:00')).toBe('12:00 PM');
    expect(formatTime12('14:30')).toBe('2:30 PM');
  });

  it('formats durations and South African Rand (ZAR) amounts', () => {
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(90)).toBe('1h 30m');

    expect(formatZAR(null)).toBeNull();
    expect(formatZAR(650)).toBe('R650');
    expect(formatZAR(1450)).toBe('R1 450');
    expect(formatZAR(1450.5)).toBe('R1 450.50');
  });

  it('formats YYYY-MM-DD dates into human-readable strings', () => {
    expect(formatDateHuman('2026-11-04')).toBe('Wed, 4 Nov 2026');
  });

  it('expires open availability slots when current time passes the configured cutoff minutes', () => {
    // Example: slot at 09:30 with 15 min cutoff
    // At 09:15 (15 min remaining) -> still available
    expect(
      isSlotExpiredByCutoff('2026-11-20', '09:30', 15, new Date(2026, 10, 20, 9, 15, 0)),
    ).toBe(false);
    // At 09:16 (14 min remaining < 15 min cutoff) -> expired / falls away
    expect(
      isSlotExpiredByCutoff('2026-11-20', '09:30', 15, new Date(2026, 10, 20, 9, 16, 0)),
    ).toBe(true);
    // Future date -> not expired
    expect(
      isSlotExpiredByCutoff('2026-11-21', '09:30', 15, new Date(2026, 10, 20, 18, 0, 0)),
    ).toBe(false);
  });
});
