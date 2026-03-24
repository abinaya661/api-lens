'use server';

import { createClient } from '@/lib/supabase/server';
import type { Alert, UsageRecord, PriceSnapshot } from '@/types/database';

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

export async function getDashboardData(): Promise<ActionResult<DashboardData>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const now = new Date();

    // Fetch user timezone for accurate date calculation
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single();
    const tz = profile?.timezone || 'UTC';

    // Calculate "today" and "month start" in the user's timezone
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: tz });
    const today = formatter.format(now);
    const [year, month] = today.split('-');
    const monthStart = `${year}-${month}-01`;

    // Parallel queries
    const [usageRes, keysRes, alertsRes, budgetRes] = await Promise.all([
      supabase
        .from('usage_records')
        .select('date, cost_usd, provider, key_id')
        .eq('user_id', user.id)
        .gte('date', monthStart)
        .lte('date', today),
      supabase
        .from('api_keys')
        .select('id, nickname, provider, key_hint, is_active, last_used')
        .eq('user_id', user.id),
      supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('scope', 'global')
        .limit(1),
    ]);

    const usageRecords = usageRes.data ?? [];
    const keys = keysRes.data ?? [];
    const alerts = (alertsRes.data ?? []) as Alert[];
    const globalBudget = budgetRes.data?.[0] ?? null;

    // Calculate total spend this month
    const totalSpend = usageRecords.reduce((sum, r) => sum + Number(r.cost_usd), 0);

    // Calculate daily spend
    const dailyMap = new Map<string, number>();
    for (const r of usageRecords) {
      dailyMap.set(r.date, (dailyMap.get(r.date) ?? 0) + Number(r.cost_usd));
    }
    const dailySpend: DailySpend[] = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate spend by platform
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

    // Calculate top keys by spend
    const keySpendMap = new Map<string, number>();
    for (const r of usageRecords) {
      keySpendMap.set(r.key_id, (keySpendMap.get(r.key_id) ?? 0) + Number(r.cost_usd));
    }
    const topKeys: TopKey[] = keys
      .map((k) => ({
        id: k.id,
        nickname: k.nickname,
        provider: k.provider,
        key_hint: k.key_hint,
        current_month_spend: Math.round((keySpendMap.get(k.id) ?? 0) * 100) / 100,
      }))
      .sort((a, b) => b.current_month_spend - a.current_month_spend)
      .slice(0, 5);

    // Projected spend
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const projectedSpend = dayOfMonth > 0
      ? Math.round((totalSpend / dayOfMonth) * daysInMonth * 100) / 100
      : 0;

    // Budget calculations
    const budgetAmount = globalBudget ? Number(globalBudget.amount_usd) : null;
    const budgetRemaining = budgetAmount !== null ? Math.round((budgetAmount - totalSpend) * 100) / 100 : null;
    const budgetRemainingPct = budgetAmount !== null && budgetAmount > 0
      ? Math.round(((budgetAmount - totalSpend) / budgetAmount) * 100)
      : null;

    // Active key count
    const activeKeyCount = keys.filter((k) => k.is_active).length;

    // Last synced
    const lastSyncedDates = keys
      .map((k) => k.last_used)
      .filter(Boolean)
      .sort()
      .reverse();
    const lastSyncedAt = lastSyncedDates[0] ?? null;

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const safePageSize = Math.min(Math.max(pageSize, 1), 500);
    const from = (page - 1) * safePageSize;
    const to = from + safePageSize - 1;

    let query = supabase
      .from('usage_records')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
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

export async function getPriceSnapshots(): Promise<ActionResult<PriceSnapshot[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('price_snapshots')
      .select('*')
      .order('provider')
      .order('model');

    if (error) return { data: null, error: error.message };
    return { data: data as PriceSnapshot[], error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
