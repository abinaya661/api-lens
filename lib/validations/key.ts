import { z } from 'zod';

export const addKeySchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  nickname: z.string().min(1, 'Label is required').max(100),
  api_key: z.string().min(1, 'API key is required'),
  project_id: z.string().uuid().optional(),
  endpoint_url: z.string().url().optional().or(z.literal('')),
  notes: z.string().max(500).optional(),
});

export const updateKeySchema = z.object({
  id: z.string().uuid(),
  nickname: z.string().min(1).max(100).optional(),
  project_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

export type AddKeyInput = z.infer<typeof addKeySchema>;
export type UpdateKeyInput = z.infer<typeof updateKeySchema>;
