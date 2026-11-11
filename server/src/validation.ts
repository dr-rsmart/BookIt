/**
 * Request Validation Schemas (Zod v4)
 */

import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  fullName: z.string().optional(),
  phone: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const workingHourItemSchema = z.object({
  day: z.string(),
  open: z.string(),
  close: z.string(),
  closed: z.boolean(),
});

export const providerSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  category: z.string().optional().default('Salon'),
  tagline: z.string().optional().default(''),
  about: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  email: z.string().optional().default(''),
  website: z.string().optional().default(''),
  street: z.string().optional().default(''),
  city: z.string().optional().default(''),
  postcode: z.string().optional().default(''),
  country: z.string().optional().default('South Africa'),
  cover_image: z.string().optional().default(''),
  working_hours: z.array(workingHourItemSchema).optional(),
  status: z.enum(['published', 'draft']).optional(),
});

export const serviceSchema = z.object({
  provider_id: z.string().min(1),
  name: z.string().min(1, 'Service name is required'),
  description: z.string().optional().default(''),
  duration_minutes: z.coerce.number().int().min(5).max(720).default(30),
  price: z.union([z.number(), z.string(), z.null()]).optional(),
  price_note: z.string().optional().default(''),
  professional_ids: z.array(z.string()).optional().default([]),
  active: z.boolean().optional().default(true),
});

export const professionalSchema = z.object({
  provider_id: z.string().min(1),
  name: z.string().min(1, 'Professional name is required'),
  email: z.string().optional(),
  title: z.string().optional().default(''),
  bio: z.string().optional().default(''),
  photo_url: z.string().optional().default(''),
  service_ids: z.array(z.string()).optional().default([]),
  active: z.boolean().optional().default(true),
});

export const slotCreateSchema = z.object({
  provider_id: z.string().min(1),
  professional_id: z.string().min(1),
  service_id: z.string().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:mm'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be HH:mm'),
  status: z.enum(['open', 'booked', 'blocked']).optional().default('open'),
});

export const bookingCreateSchema = z.object({
  provider_id: z.string().min(1),
  provider_name: z.string().optional(),
  service_id: z.string().nullable().optional(),
  service_name: z.string().min(1),
  professional_id: z.string().nullable().optional(),
  professional_name: z.string().nullable().optional(),
  slot_id: z.string().nullable().optional(),
  customer_id: z.string().nullable().optional(),
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z.string().email('Customer email is required'),
  customer_phone: z.string().optional().default(''),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  price: z.union([z.number(), z.string(), z.null()]).optional(),
  notes: z.string().optional().default(''),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional().default('confirmed'),
});

export function validate<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      res.status(400).json({
        error: details[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        details,
      });
      return;
    }
    req.body = parsed.data;
    next();
  };
}
