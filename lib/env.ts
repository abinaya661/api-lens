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

    // Never throw during Next.js build phase or CI — env vars are only
    // available at runtime on the deployed server, not during `next build`.
    const isBuild =
      process.env.NEXT_PHASE === 'phase-production-build' ||
      process.env.CI === 'true' ||
      process.env.CI === '1' ||
      !!process.env.VERCEL ||
      process.env.npm_lifecycle_event === 'build' ||
      process.env.NODE_ENV !== 'production';

    if (isBuild) {
      console.warn(`[BUILD] Missing non-public env vars (expected during build): ${missing}`);
      // Build-time stub — real validation runs in production.
      // All required string fields get an empty-string fallback so that
      // downstream code that destructures `env` never sees `undefined`.
      return {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ?? '',
        CRON_SECRET: process.env.CRON_SECRET ?? '',
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        DODO_API_KEY: process.env.DODO_API_KEY ?? '',
        DODO_WEBHOOK_SECRET: process.env.DODO_WEBHOOK_SECRET ?? '',
        DODO_PRODUCT_MONTHLY_IN: process.env.DODO_PRODUCT_MONTHLY_IN ?? '',
        DODO_PRODUCT_ANNUAL_IN: process.env.DODO_PRODUCT_ANNUAL_IN ?? '',
        DODO_PRODUCT_MONTHLY_US: process.env.DODO_PRODUCT_MONTHLY_US ?? '',
        DODO_PRODUCT_ANNUAL_US: process.env.DODO_PRODUCT_ANNUAL_US ?? '',
        DODO_PRODUCT_MONTHLY_CA: process.env.DODO_PRODUCT_MONTHLY_CA ?? '',
        DODO_PRODUCT_ANNUAL_CA: process.env.DODO_PRODUCT_ANNUAL_CA ?? '',
        DODO_PRODUCT_MONTHLY_EU: process.env.DODO_PRODUCT_MONTHLY_EU ?? '',
        DODO_PRODUCT_ANNUAL_EU: process.env.DODO_PRODUCT_ANNUAL_EU ?? '',
        DODO_PRODUCT_MONTHLY_ROW: process.env.DODO_PRODUCT_MONTHLY_ROW ?? '',
        DODO_PRODUCT_ANNUAL_ROW: process.env.DODO_PRODUCT_ANNUAL_ROW ?? '',
        RESEND_API_KEY: process.env.RESEND_API_KEY,
        RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
        UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
      } as Env;
    }

    throw new Error(
      `Missing required environment variables: ${missing}. ` +
      'Application cannot start without these configured.'
    );
  }
  // Paired-key validation: both must be set together or both absent.
  const data = parsed.data;

  const hasResendKey = !!data.RESEND_API_KEY;
  const hasResendEmail = !!data.RESEND_FROM_EMAIL;
  if (hasResendKey !== hasResendEmail) {
    throw new Error(
      'RESEND_API_KEY and RESEND_FROM_EMAIL must both be set or both be absent. ' +
      `Currently: RESEND_API_KEY=${hasResendKey ? 'set' : 'missing'}, ` +
      `RESEND_FROM_EMAIL=${hasResendEmail ? 'set' : 'missing'}.`
    );
  }

  const hasRedisUrl = !!data.UPSTASH_REDIS_REST_URL;
  const hasRedisToken = !!data.UPSTASH_REDIS_REST_TOKEN;
  if (hasRedisUrl !== hasRedisToken) {
    throw new Error(
      'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must both be set or both be absent. ' +
      `Currently: UPSTASH_REDIS_REST_URL=${hasRedisUrl ? 'set' : 'missing'}, ` +
      `UPSTASH_REDIS_REST_TOKEN=${hasRedisToken ? 'set' : 'missing'}.`
    );
  }

  return data;
}

export const env = getEnv();
