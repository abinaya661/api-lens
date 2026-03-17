import { z } from 'zod'

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL:      z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(100),
  SUPABASE_SERVICE_ROLE_KEY:     z.string().min(100),
  // Length check is critical: 64 hex = 32 bytes = AES-256 key size.
  // A 63-char key silently creates a weaker cipher without this check.
  ENCRYPTION_KEY:                z.string().length(64, 'Must be exactly 64 hex chars'),
  RAZORPAY_KEY_ID:               z.string().min(1),
  RAZORPAY_KEY_SECRET:           z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET:       z.string().min(16),
  RAZORPAY_PLAN_MONTHLY:         z.string().startsWith('plan_'),
  RAZORPAY_PLAN_ANNUAL:          z.string().startsWith('plan_'),
  RESEND_API_KEY:                z.string().startsWith('re_'),
  RESEND_FROM_EMAIL:             z.string().email(),
  NEXT_PUBLIC_APP_URL:           z.string().url(),
  CRON_SECRET:                   z.string().min(32),
})

function validateEnv() {
  const result = EnvSchema.safeParse(process.env)
  if (!result.success) {
    const issues = result.error.issues
      .map(i => `  ${String(i.path[0])}: ${i.message}`)
      .join('\n')
    throw new Error(
      `\n\n❌ Environment variable errors:\n${issues}\n\n` +
      `Copy .env.example to .env.local and fill every value.\n`
    )
  }
  return result.data
}

export const env = validateEnv()
export type Env  = z.infer<typeof EnvSchema>
