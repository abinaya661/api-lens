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
  DODO_API_KEY: z.string().min(1),
  DODO_WEBHOOK_SECRET: z.string().min(1),
  // Per-region product IDs (monthly + annual for each region)
  DODO_PRODUCT_MONTHLY_IN: z.string().min(1),
  DODO_PRODUCT_ANNUAL_IN: z.string().min(1),
  DODO_PRODUCT_MONTHLY_US: z.string().min(1),
  DODO_PRODUCT_ANNUAL_US: z.string().min(1),
  DODO_PRODUCT_MONTHLY_CA: z.string().min(1),
  DODO_PRODUCT_ANNUAL_CA: z.string().min(1),
  DODO_PRODUCT_MONTHLY_EU: z.string().min(1),
  DODO_PRODUCT_ANNUAL_EU: z.string().min(1),
  DODO_PRODUCT_MONTHLY_ROW: z.string().min(1),
  DODO_PRODUCT_ANNUAL_ROW: z.string().min(1),

  // Resend (optional — email features disabled if not set)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),

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
