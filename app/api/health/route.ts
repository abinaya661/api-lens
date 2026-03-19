import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error'; message?: string }> = {};

  // Check Supabase connection
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('platforms').select('id', { count: 'exact', head: true });
    checks.supabase = error ? { status: 'error', message: error.message } : { status: 'ok' };
  } catch (e) {
    checks.supabase = { status: 'error', message: e instanceof Error ? e.message : 'Connection failed' };
  }

  // Check required env vars
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ENCRYPTION_KEY',
    'CRON_SECRET',
  ];

  const optionalEnvVars = [
    'DODO_PAYMENTS_API_KEY',
    'DODO_WEBHOOK_SECRET',
    'RESEND_API_KEY',
  ];

  const missingRequired = requiredEnvVars.filter((v) => !process.env[v]);
  const missingOptional = optionalEnvVars.filter((v) => !process.env[v]);

  checks.env_required = missingRequired.length === 0
    ? { status: 'ok' }
    : { status: 'error', message: `Missing: ${missingRequired.join(', ')}` };

  checks.env_optional = missingOptional.length === 0
    ? { status: 'ok' }
    : { status: 'ok', message: `Not configured: ${missingOptional.join(', ')}` };

  // Check encryption key format
  const encKey = process.env.ENCRYPTION_KEY;
  checks.encryption = encKey && encKey.length === 64
    ? { status: 'ok' }
    : { status: 'error', message: 'ENCRYPTION_KEY must be 64 hex characters' };

  // Check cron secret
  const cronSecret = process.env.CRON_SECRET;
  checks.cron_secret = cronSecret && cronSecret.length >= 32
    ? { status: 'ok' }
    : { status: 'error', message: 'CRON_SECRET must be at least 32 characters' };

  const allOk = Object.values(checks).every((c) => c.status === 'ok');

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      checks,
      version: process.env.npm_package_version ?? '1.0.0',
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 },
  );
}
