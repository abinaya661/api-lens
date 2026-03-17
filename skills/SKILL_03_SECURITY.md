# Skill 03 — Security Engineering
# Expert: SEC — Security Engineer
# Read this for: AES-256-GCM implementation, security rules, env validation

I have conducted security audits for fintech and healthcare companies.
If API Lens stores third-party API keys and has a breach, the blast radius
is enormous — users' OpenAI, AWS, and Anthropic accounts are exposed.
Security is a foundation, not a feature. It is designed in from day one.

---

## AES-256-GCM Encryption — complete implementation

```typescript
// /lib/encryption/index.ts
import crypto from 'node:crypto'

// AES-256: 256-bit key — unbreakable by brute force today.
// GCM mode: provides confidentiality AND authenticity.
// The auth tag detects tampering — if someone modifies the stored
// ciphertext, decryption throws an error instead of returning garbage.
// This is called authenticated encryption. AES-CBC does NOT provide this.
const ALGORITHM = 'aes-256-gcm' as const
const IV_BYTES   = 12  // 96-bit IV — GCM standard recommends exactly 12 bytes.
const TAG_BYTES  = 16  // 128-bit auth tag — the maximum. Never use less.
const VERSION    = 'v1' as const  // Enables future algorithm migrations.

function getMasterKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be exactly 64 hex chars. ' +
      'Generate: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )
  }
  return Buffer.from(hex, 'hex')
}

export function encrypt(plaintext: string): string {
  const key = getMasterKey()
  // New random IV for EVERY encryption — non-negotiable.
  // Reusing an IV with the same key in GCM is catastrophic —
  // allows an attacker to recover both key and plaintexts.
  const iv = crypto.randomBytes(IV_BYTES)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES })
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()  // Retrieved AFTER cipher.final()
  // Format: v1:ivHex:tagHex:ciphertextHex
  return `${VERSION}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(stored: string): string {
  const parts = stored.split(':')
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error(`Invalid encryption format. Expected "${VERSION}:iv:tag:ciphertext"`)
  }
  const [, ivHex, tagHex, ctHex] = parts
  const key = getMasterKey()
  const decipher = crypto.createDecipheriv(
    ALGORITHM, key, Buffer.from(ivHex, 'hex'), { authTagLength: TAG_BYTES }
  )
  // setAuthTag MUST be called before update/final.
  // If ciphertext was modified, final() throws. This is correct behaviour.
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  return Buffer.concat([
    decipher.update(Buffer.from(ctHex, 'hex')),
    decipher.final(),
  ]).toString('utf8')
}

export function getKeyHint(plaintext: string): string {
  // Returns last 4 characters of the key.
  // Stored as plain text separately.
  // Last 4 chars alone cannot reconstruct or guess the key.
  // Avoids a full decrypt operation on every list query.
  return plaintext.slice(-4)
}

export function maskForDisplay(provider: string, hint: string): string {
  const prefixes: Record<string, string> = {
    openai:      'sk-admin-...',
    anthropic:   'sk-ant-...',
    gemini:      'AIza...',
    bedrock:     'AKIA...',
    azure_openai:'az-...',
    mistral:     'ms-...',
    cohere:      'co-...',
    openrouter:  'sk-or-...',
    replicate:   'r8_...',
    fal:         'fal-...',
    elevenlabs:  '...',
    deepgram:    '...',
    assemblyai:  '...',
    vertex_ai:   '(service account)',
  }
  return `${prefixes[provider] ?? '...'}${hint}`
}
```

---

## 12 Security Rules — with reasoning

**Rule 1: NEVER select encrypted_key in list queries.**
The key only needs to exist in memory for one purpose: immediately before
a platform API call. List queries, dashboard queries, table renders — none
need the encrypted value. If it never appears unnecessarily in JavaScript
memory, it cannot accidentally leak into a log or response.

```typescript
// WRONG:
const { data } = await supabase.from('api_keys').select('*')

// CORRECT:
const { data } = await supabase
  .from('api_keys')
  .select('id, provider, nickname, key_hint, is_active, last_used, rotation_due, created_at')
```

**Rule 2: Decrypt in the tightest possible scope.**
```typescript
async function syncKey(keyId: string): Promise<void> {
  const { data } = await adminClient
    .from('api_keys')
    .select('encrypted_key, provider')
    .eq('id', keyId)
    .single()

  const plainKey = decrypt(data!.encrypted_key)
  const records  = await fetchUsage(data!.provider, plainKey, start, end)
  // plainKey goes out of scope here — garbage collected.
  // We do NOT store it. We do NOT pass it further. We do NOT log it.
  await upsertUsageRecords(keyId, records)
}
```

**Rule 3: Rate limiting**
- Login: 5 attempts per 15 minutes per IP — prevents brute force
- Key creation: 20 per hour per user — prevents abuse

**Rule 4: Security headers (in next.config.ts)**
```typescript
{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
// Forces HTTPS for 1 year — cannot be bypassed by downgrade attacks
{ key: 'X-Content-Type-Options',    value: 'nosniff' },
// Prevents MIME-type sniffing — text file cannot be executed as JavaScript
{ key: 'X-Frame-Options',           value: 'DENY' },
// Prevents clickjacking — app cannot be embedded in iframes
{ key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
// Controls what is sent in the Referer header
{ key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" },
```

**Rule 5:** RLS on every table — no exceptions. See SKILL_02.

**Rule 6:** Webhook signature verified with `timingSafeEqual` — see SKILL_05.

**Rule 7:** Env vars validated with Zod at startup — see below.

**Rule 8:** Never log plaintext keys in any context — server logs, Sentry events, error messages.

**Rule 9:** Stripe/Razorpay card data never touches our servers — hosted checkout only.

**Rule 10:** Error messages to users are clean English. Never expose stack traces or internal details.

**Rule 11:** Email verification enabled in Supabase Auth settings (toggle in dashboard).

**Rule 12:** Sentry configured to scrub API key patterns from error events.

---

## Environment Variable Validation

```typescript
// /lib/env.ts — imported in instrumentation.ts (runs before first request)
import { z } from 'zod'

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL:      z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(100),
  SUPABASE_SERVICE_ROLE_KEY:     z.string().min(100),
  // Length check is the most important: 64 hex = 32 bytes = AES-256 key size.
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
  SENTRY_DSN:                    z.string().url(),
  NEXT_PUBLIC_SENTRY_DSN:        z.string().url(),
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
```

---

## Sentry Configuration

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'
import { env } from '@/lib/env'

Sentry.init({
  dsn: env.SENTRY_DSN,
  tracesSampleRate: 0.1,   // 10% of traces in production
  beforeSend(event) {
    // Scrub any string that looks like an API key
    const scrub = (s: string) =>
      s.replace(/sk-[a-zA-Z0-9\-]{20,}/g, '[SCRUBBED_KEY]')
       .replace(/AIza[a-zA-Z0-9\-_]{35}/g, '[SCRUBBED_KEY]')
       .replace(/AKIA[A-Z0-9]{16}/g, '[SCRUBBED_KEY]')

    if (event.message)  event.message  = scrub(event.message)
    if (event.exception?.values) {
      event.exception.values.forEach(v => {
        if (v.value) v.value = scrub(v.value)
      })
    }
    return event
  },
})
```
