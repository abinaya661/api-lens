import { z } from 'zod';

export const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  company_name: z.string().max(100).nullable().optional(),
  timezone: z.string().optional(),
  currency: z.enum(['USD', 'EUR', 'GBP']).optional(),
  onboarded: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
