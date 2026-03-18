import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 120;

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 32) {
    console.error('CRON_SECRET not configured or too short');
    return false;
  }
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const startTime = Date.now();
    const results: Record<string, string> = {};

    // Step 1: OpenRouter credit diff (Pattern 1) — stub
    results.openrouter_sync = 'skipped (Phase 3)';

    // Step 2: Price change detection — stub
    results.price_check = 'skipped (Phase 3)';

    // Step 3: Waste detection (keys unused 30+ days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: wasteKeys } = await supabase
      .from('api_keys')
      .select('id, nickname, user_id, provider')
      .eq('is_active', true)
      .or(`last_used.is.null,last_used.lt.${thirtyDaysAgo.toISOString()}`);

    if (wasteKeys && wasteKeys.length > 0) {
      const alertInserts = wasteKeys.map((key) => ({
        user_id: key.user_id,
        type: 'key_inactive' as const,
        severity: 'info' as const,
        title: `Unused key: ${key.nickname}`,
        message: `Your ${key.provider} key "${key.nickname}" hasn't been used in 30+ days. Consider revoking it to reduce security exposure.`,
        scope: 'key',
        scope_id: key.id,
        scope_name: key.nickname,
      }));
      await supabase.from('alerts').insert(alertInserts);
      results.waste_detection = `${wasteKeys.length} inactive keys flagged`;
    } else {
      results.waste_detection = 'no inactive keys';
    }

    // Step 4: Rotation reminders (keys 80+ days old)
    const eightyDaysAgo = new Date();
    eightyDaysAgo.setDate(eightyDaysAgo.getDate() - 80);

    const { data: oldKeys } = await supabase
      .from('api_keys')
      .select('id, nickname, user_id, provider, created_at')
      .eq('is_active', true)
      .lt('created_at', eightyDaysAgo.toISOString());

    if (oldKeys && oldKeys.length > 0) {
      const rotationAlerts = oldKeys.map((key) => ({
        user_id: key.user_id,
        type: 'key_rotation_due' as const,
        severity: 'warning' as const,
        title: `Key rotation due: ${key.nickname}`,
        message: `Your ${key.provider} key "${key.nickname}" is over 80 days old. Rotate it for better security.`,
        scope: 'key',
        scope_id: key.id,
        scope_name: key.nickname,
      }));
      await supabase.from('alerts').insert(rotationAlerts);
      results.rotation_reminders = `${oldKeys.length} keys need rotation`;
    } else {
      results.rotation_reminders = 'no keys need rotation';
    }

    // Step 5: Monthly report (only on 1st of month)
    const today = new Date();
    if (today.getUTCDate() === 1) {
      results.monthly_report = 'skipped (Phase 3)';
    } else {
      results.monthly_report = 'not 1st of month';
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      results,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron daily-tasks failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
