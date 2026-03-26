import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { getWeeklyReportEmailHtml } from '@/lib/email/templates';

export const runtime = 'nodejs';
export const maxDuration = 300;

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

    const now = new Date();

    // Current week: the 7 days ending yesterday
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

    // Previous week: the 7 days before that
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 14);
    const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().slice(0, 10);

    const weekLabel =
      sevenDaysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) +
      '\u2013' +
      yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

    // Get all distinct user_ids with usage this past week
    const { data: usageRows } = await supabase
      .from('usage_records')
      .select('user_id')
      .gte('date', sevenDaysAgoStr)
      .lte('date', yesterdayStr);

    const userIds = [...new Set((usageRows ?? []).map((r: { user_id: string }) => r.user_id))];
    let emailsSent = 0;

    for (const userId of userIds) {
      // Fetch current week's usage for this user
      const { data: thisWeek } = await supabase
        .from('usage_records')
        .select('provider, cost_usd, key_id')
        .eq('user_id', userId)
        .gte('date', sevenDaysAgoStr)
        .lte('date', yesterdayStr);

      if (!thisWeek || thisWeek.length === 0) continue;

      // Fetch previous week's usage for week-over-week comparison
      const { data: lastWeekRows } = await supabase
        .from('usage_records')
        .select('cost_usd')
        .eq('user_id', userId)
        .gte('date', fourteenDaysAgoStr)
        .lt('date', sevenDaysAgoStr);

      const totalSpent = thisWeek.reduce((sum, r) => sum + Number(r.cost_usd), 0);
      const prevWeekSpent = (lastWeekRows ?? []).reduce((sum, r) => sum + Number(r.cost_usd), 0);

      // Per-provider breakdown (sorted descending by spend)
      const providerTotals: Record<string, number> = {};
      for (const r of thisWeek) {
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

        const projectSpend = thisWeek
          .filter(r => keyIds.includes(r.key_id))
          .reduce((sum, r) => sum + Number(r.cost_usd), 0);

        if (projectSpend > 0) {
          projectBreakdown.push({ name: project.name, spent: `$${projectSpend.toFixed(2)}` });
        }
      }

      // Fetch user email and send
      const { data: uData } = await supabase.auth.admin.getUserById(userId);
      const email = uData.user?.email;
      if (!email) continue;

      await sendEmail({
        to: email,
        subject: `Your Weekly API Spending Summary \u2014 ${weekLabel}`,
        html: getWeeklyReportEmailHtml({
          weekLabel,
          totalSpent: `$${totalSpent.toFixed(2)}`,
          totalSpentPrev: `$${prevWeekSpent.toFixed(2)}`,
          providerBreakdown,
          projectBreakdown,
        }),
      });
      emailsSent++;
    }

    return NextResponse.json({
      success: true,
      emails_sent: emailsSent,
      users_processed: userIds.length,
      duration_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron weekly-report failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
