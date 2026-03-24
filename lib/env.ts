import { z } from 'zod';

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Encryption & Cron
  ENCRYPTION_KEY: z.string().min(64),
  CRON_SECRET: z.string().min(32),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Dodo Payments
  DODO_PAYMENTS_API_KEY: z.string().min(1),
  DODO_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_DODO_PRODUCT_MONTHLY: z.string().min(1),
  NEXT_PUBLIC_DODO_PRODUCT_ANNUAL: z.string().min(1),

  // Resend
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),

  // Upstash Redis (optional)
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ');

    // In production, fail hard on missing env vars
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `Missing required environment variables: ${missing}. ` +
        'Application cannot start without these configured.'
      );
    }

    // In development, warn but allow partial env
    console.warn(`⚠️  Missing env vars: ${missing}`);
    return process.env as unknown as Env;
  }
  return parsed.data;
}

export const env = getEnv();
