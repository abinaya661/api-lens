import { z } from 'zod';
import { PROVIDERS } from '@/types/providers';

export const addKeySchema = z.object({
  provider: z.enum(PROVIDERS, {
    required_error: 'Provider is required',
    invalid_type_error: 'Unsupported provider selected',
  }),
  nickname: z.string().min(1, 'Label is required').max(100),
  api_key: z.string().min(1, 'API key is required'),
  project_id: z.string().uuid().optional(),
  endpoint_url: z.string().optional().or(z.literal('')).refine((val) => {
    if (!val) return true;
    try {
      const url = new URL(val);
      if (url.protocol !== 'https:') return false;
      const hostname = url.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return false;
      if (hostname.startsWith('10.') || hostname.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return false;
      if (hostname.endsWith('.internal') || hostname.endsWith('.local')) return false;
      return true;
    } catch { return false; }
  }, 'Must be a valid HTTPS URL (no internal/private addresses)'),
  notes: z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  if (data.provider === 'openai' && !data.api_key.startsWith('sk-admin-')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'OpenAI requires an Admin API key (starts with sk-admin-...). Create one at platform.openai.com → Settings → API Keys.',
      path: ['api_key'],
    });
  }
  if (data.provider === 'anthropic' && !data.api_key.startsWith('sk-ant-admin')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Anthropic requires an Admin API key (starts with sk-ant-admin...). Create one at console.anthropic.com → Settings → Admin API Keys.',
      path: ['api_key'],
    });
  }
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
