import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, getAlertEmailHtml, getTrialWarningEmailHtml, getWeeklyDigestEmailHtml } from '@/lib/email/resend';

export const dynamic = 'force-dynamic';
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
      .select('id, nickname, company_id, provider')
      .eq('is_active', true)
      .or(`last_synced_at.is.null,last_synced_at.lt.${thirtyDaysAgo.toISOString()}`);

    if (wasteKeys && wasteKeys.length > 0) {
      const alertInserts = wasteKeys.map((key: { id: string; nickname: string; company_id: string; provider: string }) => ({
        company_id: key.company_id,
        type: 'key_inactive' as const,
        severity: 'info' as const,
        title: `Unused key: ${key.nickname}`,
        message: `Your ${key.provider} key "${key.nickname}" hasn't been used in 30+ days. Consider revoking it to reduce security exposure.`,
        related_key_id: key.id,
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
      .select('id, nickname, company_id, provider, created_at')
      .eq('is_active', true)
      .lt('created_at', ninetyDaysAgo.toISOString());

    if (oldKeys && oldKeys.length > 0) {
      const rotationAlerts = oldKeys.map((key: { id: string; nickname: string; company_id: string; provider: string; created_at: string }) => ({
        company_id: key.company_id,
        type: 'key_rotation_due' as const,
        severity: 'warning' as const,
        title: `Key rotation due: ${key.nickname}`,
        message: `Your ${key.provider} key "${key.nickname}" is over 90 days old. Rotate it for better security.`,
        related_key_id: key.id,
      }));
      await supabase.from('alerts').insert(rotationAlerts);

      // Dispatch Warning Emails — look up owner via companies table
      const uniqueCompanyIds = Array.from(new Set(oldKeys.map((k: { company_id: string }) => k.company_id)));
      for (const companyId of uniqueCompanyIds) {
        const { data: company } = await supabase
          .from('companies')
          .select('owner_id')
          .eq('id', companyId)
          .single();
        const ownerId = company?.owner_id;
        if (ownerId) {
          const { data: uData } = await supabase.auth.admin.getUserById(ownerId as string);
          const email = uData.user?.email;
          if (email) {
            const companyKey = oldKeys.find((k: { company_id: string; nickname: string; provider: string }) => k.company_id === companyId);
            await sendEmail({
              to: email,
              subject: `Action Required: Key Rotation Due for ${companyKey?.nickname}`,
              html: getAlertEmailHtml({
                title: 'API Key Rotation Required',
                message: `Your ${companyKey?.provider} API key "${companyKey?.nickname}" is over 90 days old. For security reasons, please log into API Lens and rotate it immediately.`,
                severity: 'warning',
              })
            });
          }
        }
      }

      results.rotation_reminders = `${oldKeys.length} keys need rotation`;
    } else {
      results.rotation_reminders = 'no keys need rotation';
    }

    // Step 4.5: Trial Expiration Warnings — send at 48h AND 24h remaining
    const now = new Date();

    // Window for 48h warning: trial ends between 48h and 72h from now
    const in48hStart = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const in48hEnd   = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    // Window for 24h warning: trial ends between 24h and 48h from now
    const in24hStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in24hEnd   = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const trialWarningWindows = [
      { start: in48hStart, end: in48hEnd, daysLeft: 2, subject: 'Your API Lens free trial ends in 48 hours ⏱️' },
      { start: in24hStart, end: in24hEnd, daysLeft: 1, subject: 'Action Required: Trial ends in 24 hours' },
    ];

    let trialWarningSentCount = 0;

    for (const window of trialWarningWindows) {
      const { data: expiringTrials } = await supabase
        .from('subscriptions')
        .select('company_id, trial_ends_at, companies ( owner_id )')
        .eq('status', 'trialing')
        .gte('trial_ends_at', window.start.toISOString())
        .lt('trial_ends_at', window.end.toISOString());

      if (!expiringTrials || expiringTrials.length === 0) continue;

      for (const sub of expiringTrials) {
        const ownerId = Array.isArray(sub.companies)
          ? (sub.companies as unknown as { owner_id: string }[])[0]?.owner_id
          : (sub.companies as unknown as { owner_id: string })?.owner_id;

        if (!ownerId) continue;
        const { data: uData } = await supabase.auth.admin.getUserById(ownerId);
        if (!uData.user?.email) continue;

        await sendEmail({
          to: uData.user.email,
          subject: window.subject,
          html: getTrialWarningEmailHtml({ daysLeft: window.daysLeft }),
        });
        trialWarningSentCount++;
      }
    }

    results.trial_warnings = trialWarningSentCount > 0
      ? `${trialWarningSentCount} trial warning emails sent`
      : 'no expiring trials';

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

      // Get all key_ids with usage last month, then group by company
      const { data: monthUsageRows } = await supabase
        .from('usage_records')
        .select('key_id, provider, cost_usd')
        .gte('date', prevMonthStartStr)
        .lte('date', prevMonthEndStr);

      // Look up company_id for each key that had usage
      const usedKeyIds = [...new Set((monthUsageRows ?? []).map((r: { key_id: string }) => r.key_id))];
      const { data: usedKeys } = usedKeyIds.length > 0
        ? await supabase.from('api_keys').select('id, company_id').in('id', usedKeyIds)
        : { data: [] };

      const companyIds = [...new Set((usedKeys ?? []).map((k: { company_id: string }) => k.company_id))];
      let reportsSent = 0;

      for (const companyId of companyIds) {
        const companyKeyIds = (usedKeys ?? [])
          .filter((k: { company_id: string }) => k.company_id === companyId)
          .map((k: { id: string }) => k.id);

        const monthRecords = (monthUsageRows ?? []).filter(
          (r: { key_id: string }) => companyKeyIds.includes(r.key_id)
        ) as { key_id: string; provider: string; cost_usd: number }[];

        if (monthRecords.length === 0) continue;

        const monthTotal = monthRecords.reduce((sum, r) => sum + Number(r.cost_usd), 0);

        // Per-provider breakdown
        const providerTotals: Record<string, number> = {};
        for (const r of monthRecords) {
          providerTotals[r.provider] = (providerTotals[r.provider] ?? 0) + Number(r.cost_usd);
        }
        // Per-project breakdown
        const { data: projects } = await supabase
          .from('projects')
          .select('id, name')
          .eq('company_id', companyId)
          .eq('is_active', true);

        const projectBreakdown: { name: string; spent: string }[] = [];
        for (const project of projects ?? []) {
          const { data: projectKeys } = await supabase
            .from('api_keys')
            .select('id')
            .eq('company_id', companyId)
            .eq('project_id', project.id);

          const keyIds = (projectKeys ?? []).map((pk: { id: string }) => pk.id);
          if (keyIds.length === 0) continue;

          const projectSpend = monthRecords
            .filter(r => keyIds.includes(r.key_id))
            .reduce((sum, r) => sum + Number(r.cost_usd), 0);

          if (projectSpend > 0) {
            projectBreakdown.push({ name: project.name, spent: `$${projectSpend.toFixed(2)}` });
          }
        }

        // Get owner email via companies table
        const { data: company } = await supabase
          .from('companies')
          .select('owner_id')
          .eq('id', companyId)
          .single();

        if (!company?.owner_id) continue;
        const { data: uData } = await supabase.auth.admin.getUserById(company.owner_id);
        const email = uData.user?.email;
        if (!email) continue;

        await sendEmail({
          to: email,
          subject: `Your ${monthLabel} API Spending Report`,
          html: getWeeklyDigestEmailHtml({
            totalRequests: monthRecords.length.toString(),
            costStr: `$${monthTotal.toFixed(2)}`,
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
