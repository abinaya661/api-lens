import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, getAlertEmailHtml, getTrialWarningEmailHtml } from '@/lib/email/resend';
import { getMonthlyReportEmailHtml } from '@/lib/email/templates';

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

    // Step 2: Budget alerts
    // Logic goes here to join `budgets` table and check if tracked costs exceed 50%, 90%, 100%.
    // and email users when crossed using: getAlertEmailHtml({ ... })
    results.price_check = 'skipped (budget integration pending cost tracking Phase 3)';

    // Step 3: Waste detection (keys unused 30+ days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: wasteKeys } = await supabase
      .from('api_keys')
      .select('id, nickname, user_id, provider')
      .eq('is_active', true)
      .or(`last_used.is.null,last_used.lt.${thirtyDaysAgo.toISOString()}`);

    if (wasteKeys && wasteKeys.length > 0) {
      const alertInserts = wasteKeys.map((key: { id: string; nickname: string; user_id: string; provider: string }) => ({
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

    // Step 4: Rotation reminders (keys 90+ days old)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: oldKeys } = await supabase
      .from('api_keys')
      .select('id, nickname, user_id, provider, created_at')
      .eq('is_active', true)
      .lt('created_at', ninetyDaysAgo.toISOString());

    if (oldKeys && oldKeys.length > 0) {
      const rotationAlerts = oldKeys.map((key: { id: string; nickname: string; user_id: string; provider: string; created_at: string }) => ({
        user_id: key.user_id,
        type: 'key_rotation_due' as const,
        severity: 'warning' as const,
        title: `Key rotation due: ${key.nickname}`,
        message: `Your ${key.provider} key "${key.nickname}" is over 90 days old. Rotate it for better security.`,
        scope: 'key',
        scope_id: key.id,
        scope_name: key.nickname,
      }));
      await supabase.from('alerts').insert(rotationAlerts);

      // Dispatch Warning Emails
      const uniqueUsers = Array.from(new Set(oldKeys.map((k: { user_id: string }) => k.user_id)));
      for (const uid of uniqueUsers) {
        const { data: uData } = await supabase.auth.admin.getUserById(uid as string);
        const email = uData.user?.email;
        if (email) {
          const userKey = oldKeys.find((k: { user_id: string; nickname: string; provider: string }) => k.user_id === uid);
          await sendEmail({
            to: email,
            subject: `Action Required: Key Rotation Due for ${userKey?.nickname}`,
            html: getAlertEmailHtml({
              title: 'API Key Rotation Required',
              message: `Your ${userKey?.provider} API key "${userKey?.nickname}" is over 90 days old. For security reasons, please log into API Lens and rotate it immediately.`,
              severity: 'warning',
            })
          });
        }
      }

      results.rotation_reminders = `${oldKeys.length} keys need rotation`;
    } else {
      results.rotation_reminders = 'no keys need rotation';
    }

    // Step 4.5: Trial Expiration Warnings
    const now = new Date();
    // 24-48 hours from now
    const inOneDayStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    // 48-72 hours from now
    const inTwoDaysEnd = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    const { data: expiringTrials } = await supabase
      .from('subscriptions')
      .select('company_id, trial_ends_at, companies ( owner_id )')
      .eq('status', 'trial')
      .gte('trial_ends_at', inOneDayStart.toISOString())
      .lt('trial_ends_at', inTwoDaysEnd.toISOString());

    if (expiringTrials && expiringTrials.length > 0) {
      let sentCount = 0;
      for (const sub of expiringTrials) {
        const is24Hours = new Date(sub.trial_ends_at!).getTime() < new Date(now.getTime() + 48 * 60 * 60 * 1000).getTime();
        const daysLeft = is24Hours ? 1 : 2;
        const ownerId = Array.isArray(sub.companies)
          ? (sub.companies as unknown as { owner_id: string }[])[0]?.owner_id
          : (sub.companies as unknown as { owner_id: string })?.owner_id;
        
        if (ownerId) {
          const { data: uData } = await supabase.auth.admin.getUserById(ownerId);
          if (uData.user?.email) {
            await sendEmail({
              to: uData.user.email,
              subject: daysLeft === 1 ? 'Action Required: Trial ends in 24 hours' : 'Your Free Trial Ends Soon ⏱️',
              html: getTrialWarningEmailHtml({ daysLeft }),
            });
            sentCount++;
          }
        }
      }
      results.trial_warnings = `${sentCount} trial warnings sent`;
    } else {
      results.trial_warnings = 'no expiring trials';
    }

    // Step 5: Monthly report (only on 1st of month)
    const today = new Date();
    if (today.getUTCDate() === 1) {
      // Previous month's date range
      const prevMonthEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0));
      const prevMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
      const prevMonthStartStr = prevMonthStart.toISOString().slice(0, 10);
      const prevMonthEndStr = prevMonthEnd.toISOString().slice(0, 10);
      const monthLabel = prevMonthStart.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      });

      // Get all distinct user_ids with usage last month
      const { data: monthUsageRows } = await supabase
        .from('usage_records')
        .select('user_id')
        .gte('date', prevMonthStartStr)
        .lte('date', prevMonthEndStr);

      const monthUserIds = [
        ...new Set((monthUsageRows ?? []).map((r: { user_id: string }) => r.user_id)),
      ];
      let reportsSent = 0;

      for (const userId of monthUserIds) {
        const { data: monthRecords } = await supabase
          .from('usage_records')
          .select('provider, cost_usd, key_id')
          .eq('user_id', userId)
          .gte('date', prevMonthStartStr)
          .lte('date', prevMonthEndStr);

        if (!monthRecords || monthRecords.length === 0) continue;

        const monthTotal = monthRecords.reduce((sum, r) => sum + Number(r.cost_usd), 0);

        // Per-provider breakdown
        const providerTotals: Record<string, number> = {};
        for (const r of monthRecords) {
          providerTotals[r.provider] = (providerTotals[r.provider] ?? 0) + Number(r.cost_usd);
        }
        const providerBreakdown = Object.entries(providerTotals)
          .sort((a, b) => b[1] - a[1])
          .map(([provider, spent]) => ({ provider, spent: `$${spent.toFixed(2)}` }));

        // Per-project breakdown
        const { data: projects } = await supabase
          .from('projects')
          .select('id, name')
          .eq('user_id', userId)
          .eq('is_active', true);

        const projectBreakdown: { name: string; spent: string }[] = [];
        for (const project of projects ?? []) {
          const { data: pks } = await supabase
            .from('project_keys')
            .select('key_id')
            .eq('project_id', project.id);

          const keyIds = (pks ?? []).map((pk: { key_id: string }) => pk.key_id);
          if (keyIds.length === 0) continue;

          const projectSpend = monthRecords
            .filter(r => keyIds.includes(r.key_id))
            .reduce((sum, r) => sum + Number(r.cost_usd), 0);

          if (projectSpend > 0) {
            projectBreakdown.push({ name: project.name, spent: `$${projectSpend.toFixed(2)}` });
          }
        }

        const { data: uData } = await supabase.auth.admin.getUserById(userId);
        const email = uData.user?.email;
        if (!email) continue;

        await sendEmail({
          to: email,
          subject: `Your ${monthLabel} API Spending Report`,
          html: getMonthlyReportEmailHtml({
            monthLabel,
            totalSpent: `$${monthTotal.toFixed(2)}`,
            providerBreakdown,
            projectBreakdown,
          }),
        });
        reportsSent++;
      }

      results.monthly_report = `${reportsSent} monthly reports sent`;
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
