import { z } from 'zod';

export const createBudgetSchema = z.object({
  scope: z.enum(['global', 'platform', 'project', 'key']),
  scope_id: z.string().uuid().optional(),
  platform: z.string().optional(),
  amount_usd: z.number().positive('Amount must be positive'),
  period: z.enum(['monthly', 'weekly']).default('monthly'),
  alert_50: z.boolean().default(true),
  alert_75: z.boolean().default(true),
  alert_90: z.boolean().default(true),
  alert_100: z.boolean().default(true),
});

export const updateBudgetSchema = z.object({
  id: z.string().uuid(),
  amount_usd: z.number().positive().optional(),
  alert_50: z.boolean().optional(),
  alert_75: z.boolean().optional(),
  alert_90: z.boolean().optional(),
  alert_100: z.boolean().optional(),
});

export type CreateBudgetInput = z.input<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
