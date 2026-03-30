import { z } from 'zod';

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP'] as const;

export const SUPPORTED_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Kolkata',
] as const;

export const notificationPrefsSchema = z.object({
  budget_alerts_email: z.boolean().default(true),
  key_validation_failure_email: z.boolean().default(true),
  trial_ending_reminder_email: z.boolean().default(true),
  weekly_spending_report_email: z.boolean().default(false),
  key_rotation_reminder_email: z.boolean().default(false),
});

export const DEFAULT_NOTIFICATION_PREFS = notificationPrefsSchema.parse({});

export const updateProfileSchema = z.object({
  full_name: z.string().trim().min(1).max(100).optional(),
  company_name: z.string().trim().max(100).nullable().optional(),
  timezone: z.string().optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).optional(),
  onboarded: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
