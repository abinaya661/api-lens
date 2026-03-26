import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, getAlertEmailHtml } from '@/lib/email/resend';

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
    let alertsSent = 0;

    // --- Step 1: Warn about active keys with consecutive failures >= 2 ---
    const { data: strugglingKeys } = await supabase
      .from('api_keys')
      .select('id, nickname, user_id, provider, consecutive_failures, last_failure_reason')
      .eq('is_active', true)
      .gte('consecutive_failures', 2);

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    for (const key of strugglingKeys ?? []) {
      // Skip if we already alerted on this key within the last 24 hours
      const { data: recentAlert } = await supabase
        .from('alerts')
        .select('id')
        .eq('user_id', key.user_id)
        .eq('type', 'key_inactive')
        .eq('scope_id', key.id)
        .gte('created_at', oneDayAgo)
        .maybeSingle();

      if (recentAlert) continue;

      const isCritical = key.consecutive_failures >= 4;
      const severity = isCritical ? 'critical' : 'warning';
      const title = `Key health warning: ${key.nickname}`;
      const message =
        `Your ${key.provider} key "${key.nickname}" has failed to sync ` +
        `${key.consecutive_failures} consecutive time(s).` +
        (key.last_failure_reason ? ` Last error: ${key.last_failure_reason}` : '') +
        ' Please check this key in your dashboard.';

      await supabase.from('alerts').insert({
        user_id: key.user_id,
        type: 'key_inactive',
        severity,
        title,
        message,
        scope: 'key',
        scope_id: key.id,
        scope_name: key.nickname,
      });

      const { data: uData } = await supabase.auth.admin.getUserById(key.user_id);
      if (uData.user?.email) {
        await sendEmail({
          to: uData.user.email,
          subject: `Action Required: API Key Health Warning — ${key.nickname}`,
          html: getAlertEmailHtml({ title, message, severity }),
        });
        alertsSent++;
      }
    }

    // --- Step 2: Notify users about keys that were recently auto-deactivated ---
    // A key auto-deactivates when consecutive_failures reaches 5 (see sync-engine.ts).
    // We notify once per deactivation event by checking for an existing deactivation alert.
    const { data: deactivatedKeys } = await supabase
      .from('api_keys')
      .select('id, nickname, user_id, provider, last_failure_reason, updated_at')
      .eq('is_active', false)
      .eq('is_valid', false)
      .not('last_failure_reason', 'is', null);

    for (const key of deactivatedKeys ?? []) {
      // Only notify for keys deactivated within the past 25 hours (one health-check cycle + buffer)
      const hoursSinceDeactivation =
        (Date.now() - new Date(key.updated_at).getTime()) / (60 * 60 * 1000);
      if (hoursSinceDeactivation > 25) continue;

      const deactivationTitle = `Key deactivated: ${key.nickname}`;

      // Check for an existing deactivation alert (idempotency)
      const { data: existingDeactivationAlert } = await supabase
        .from('alerts')
        .select('id')
        .eq('user_id', key.user_id)
        .eq('type', 'key_inactive')
        .eq('scope_id', key.id)
        .eq('title', deactivationTitle)
        .maybeSingle();

      if (existingDeactivationAlert) continue;

      const deactivationMessage =
        `Your ${key.provider} key "${key.nickname}" was automatically deactivated after ` +
        `5 consecutive sync failures.` +
        (key.last_failure_reason ? ` Last error: ${key.last_failure_reason}` : '') +
        ' Please verify and re-activate it in your dashboard.';

      await supabase.from('alerts').insert({
        user_id: key.user_id,
        type: 'key_inactive',
        severity: 'critical',
        title: deactivationTitle,
        message: deactivationMessage,
        scope: 'key',
        scope_id: key.id,
        scope_name: key.nickname,
      });

      const { data: uData } = await supabase.auth.admin.getUserById(key.user_id);
      if (uData.user?.email) {
        await sendEmail({
          to: uData.user.email,
          subject: `Action Required: API Key Deactivated — ${key.nickname}`,
          html: getAlertEmailHtml({
            title: deactivationTitle,
            message: deactivationMessage,
            severity: 'critical',
          }),
        });
        alertsSent++;
      }
    }

    return NextResponse.json({
      success: true,
      alerts_sent: alertsSent,
      duration_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron key-health-check failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
