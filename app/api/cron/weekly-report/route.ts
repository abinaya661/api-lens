import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, getWeeklyDigestEmailHtml } from '@/lib/email/resend';

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

    // usage_records has no user_id — get key_ids with usage, then join to api_keys for company_id
    const { data: usageRows } = await supabase
      .from('usage_records')
      .select('key_id, provider, cost_usd')
      .gte('date', sevenDaysAgoStr)
      .lte('date', yesterdayStr);

    const usedKeyIds = [...new Set((usageRows ?? []).map((r: { key_id: string }) => r.key_id))];
    const { data: usedKeys } = usedKeyIds.length > 0
      ? await supabase.from('api_keys').select('id, company_id').in('id', usedKeyIds)
      : { data: [] };

    const companyIds = [...new Set((usedKeys ?? []).map((k: { company_id: string }) => k.company_id))];
    let emailsSent = 0;

    for (const companyId of companyIds) {
      const companyKeyIds = (usedKeys ?? [])
        .filter((k: { company_id: string }) => k.company_id === companyId)
        .map((k: { id: string }) => k.id);

      const thisWeek = (usageRows ?? []).filter(
        (r: { key_id: string }) => companyKeyIds.includes(r.key_id)
      ) as { key_id: string; provider: string; cost_usd: number }[];

      if (thisWeek.length === 0) continue;

      // Fetch previous week's usage for week-over-week comparison
      const { data: lastWeekRows } = await supabase
        .from('usage_records')
        .select('cost_usd')
        .in('key_id', companyKeyIds)
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
        .eq('company_id', companyId)
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

      // Look up owner email via companies table
      const { data: company } = await supabase
        .from('companies')
        .select('owner_id')
        .eq('id', companyId)
        .single();

      if (!company?.owner_id) continue;
      const { data: uData } = await supabase.auth.admin.getUserById(company.owner_id);
      const email = uData.user?.email;
      if (!email) continue;

      const totalRequests = thisWeek.length.toString();
      await sendEmail({
        to: email,
        subject: `Your Weekly API Spending Summary — ${weekLabel}`,
        html: getWeeklyDigestEmailHtml({
          totalRequests,
          costStr: `$${totalSpent.toFixed(2)}`,
        }),
      });
      emailsSent++;
    }

    return NextResponse.json({
      success: true,
      emails_sent: emailsSent,
      users_processed: companyIds.length,
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
