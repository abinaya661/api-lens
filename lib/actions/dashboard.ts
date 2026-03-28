'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedCompany } from '@/lib/actions/_helpers';
import type { Alert, PriceSnapshot, UsageRecord } from '@/types/database';

interface DailySpend {
  date: string;
  amount: number;
}

interface PlatformSpend {
  provider: string;
  amount: number;
  percentage: number;
}

interface TopKey {
  id: string;
  nickname: string;
  provider: string;
  key_hint: string;
  current_month_spend: number;
}

export interface DashboardData {
  total_spend_this_month: number;
  projected_month_end: number;
  budget_remaining_usd: number | null;
  budget_remaining_pct: number | null;
  active_key_count: number;
  daily_spend: DailySpend[];
  spend_by_platform: PlatformSpend[];
  top_keys: TopKey[];
  recent_alerts: Alert[];
  last_synced_at: string | null;
}

interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

function getMonthWindow(timezone: string) {
  const now = new Date();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);
  const [year, month] = today.split('-');
  return {
    today,
    monthStart: `${year}-${month}-01`,
    now,
  };
}

export async function getDashboardData(): Promise<ActionResult<DashboardData>> {
  try {
    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId) return { data: null, error: auth.error ?? 'Not authenticated' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', auth.userId!)
      .single();
    const tz = profile?.timezone || 'UTC';
    const { today, monthStart, now } = getMonthWindow(tz);

    const [keysRes, alertsRes, budgetRes] = await Promise.all([
      supabase
        .from('api_keys')
        .select('id, nickname, provider, key_hint, is_active, last_synced_at')
        .eq('company_id', auth.companyId),
      supabase
        .from('alerts')
        .select('*')
        .eq('company_id', auth.companyId)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('budgets')
        .select('*')
        .eq('company_id', auth.companyId)
        .eq('scope', 'global')
        .limit(1),
    ]);

    const keys = keysRes.data ?? [];
    const alerts = (alertsRes.data ?? []) as Alert[];
    const globalBudget = budgetRes.data?.[0] ?? null;
    const keyIds = keys.map((key) => key.id);

    const usageRecords = keyIds.length > 0
      ? (((await supabase
          .from('usage_records')
          .select('date, cost_usd, provider, key_id')
          .in('key_id', keyIds)
          .gte('date', monthStart)
          .lte('date', today)).data ?? []) as Array<Pick<UsageRecord, 'date' | 'cost_usd' | 'provider' | 'key_id'>>)
      : [];

    const totalSpend = usageRecords.reduce((sum, r) => sum + Number(r.cost_usd), 0);

    const dailyMap = new Map<string, number>();
    for (const r of usageRecords) {
      dailyMap.set(r.date, (dailyMap.get(r.date) ?? 0) + Number(r.cost_usd));
    }
    const dailySpend: DailySpend[] = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const platformMap = new Map<string, number>();
    for (const r of usageRecords) {
      platformMap.set(r.provider, (platformMap.get(r.provider) ?? 0) + Number(r.cost_usd));
    }
    const spendByPlatform: PlatformSpend[] = Array.from(platformMap.entries())
      .map(([provider, amount]) => ({
        provider,
        amount: Math.round(amount * 100) / 100,
        percentage: totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const keySpendMap = new Map<string, number>();
    for (const r of usageRecords) {
      keySpendMap.set(r.key_id, (keySpendMap.get(r.key_id) ?? 0) + Number(r.cost_usd));
    }
    const topKeys: TopKey[] = keys
      .map((key) => ({
        id: key.id,
        nickname: key.nickname,
        provider: key.provider,
        key_hint: key.key_hint,
        current_month_spend: Math.round((keySpendMap.get(key.id) ?? 0) * 100) / 100,
      }))
      .sort((a, b) => b.current_month_spend - a.current_month_spend)
      .slice(0, 5);

    const dayOfMonth = Number(today.split('-')[2] ?? now.getUTCDate());
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const projectedSpend = dayOfMonth > 0
      ? Math.round((totalSpend / dayOfMonth) * daysInMonth * 100) / 100
      : 0;

    const budgetAmount = globalBudget ? Number(globalBudget.amount_usd) : null;
    const budgetRemaining = budgetAmount !== null ? Math.round((budgetAmount - totalSpend) * 100) / 100 : null;
    const budgetRemainingPct = budgetAmount !== null && budgetAmount > 0
      ? Math.round(((budgetAmount - totalSpend) / budgetAmount) * 100)
      : null;

    const activeKeyCount = keys.filter((key) => key.is_active).length;
    const lastSyncedAt = keys
      .map((key) => key.last_synced_at)
      .filter(Boolean)
      .sort()
      .reverse()[0] ?? null;

    return {
      data: {
        total_spend_this_month: Math.round(totalSpend * 100) / 100,
        projected_month_end: projectedSpend,
        budget_remaining_usd: budgetRemaining,
        budget_remaining_pct: budgetRemainingPct,
        active_key_count: activeKeyCount,
        daily_spend: dailySpend,
        spend_by_platform: spendByPlatform,
        top_keys: topKeys,
        recent_alerts: alerts,
        last_synced_at: lastSyncedAt,
      },
      error: null,
    };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getUsageRecords(
  dateFrom?: string,
  dateTo?: string,
  page: number = 1,
  pageSize: number = 100,
): Promise<ActionResult<{ records: UsageRecord[]; total: number }>> {
  try {
    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId) return { data: null, error: auth.error ?? 'Not authenticated' };

    const { data: keys } = await supabase
      .from('api_keys')
      .select('id')
      .eq('company_id', auth.companyId);
    const keyIds = (keys ?? []).map((key) => key.id);

    if (keyIds.length === 0) {
      return { data: { records: [], total: 0 }, error: null };
    }

    const safePageSize = Math.min(Math.max(pageSize, 1), 500);
    const from = (page - 1) * safePageSize;
    const to = from + safePageSize - 1;

    let query = supabase
      .from('usage_records')
      .select('*', { count: 'exact' })
      .in('key_id', keyIds)
      .order('date', { ascending: false })
      .range(from, to);

    if (dateFrom) query = query.gte('date', dateFrom);
    if (dateTo) query = query.lte('date', dateTo);

    const { data, error, count } = await query;
    if (error) return { data: null, error: error.message };
    return { data: { records: data as UsageRecord[], total: count ?? 0 }, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getPriceSnapshots(
  category?: string,
  includeDeprecated: boolean = false,
): Promise<ActionResult<PriceSnapshot[]>> {
  try {
    const supabase = createAdminClient();
    let query = supabase.from('price_snapshots').select('*');

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (!includeDeprecated) {
      query = query.eq('is_deprecated', false);
    }

    const { data, error } = await query.order('provider').order('model');

    if (error) return { data: null, error: error.message };
    return { data: data as PriceSnapshot[], error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
