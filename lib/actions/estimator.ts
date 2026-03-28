'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedCompany } from '@/lib/actions/_helpers';
import { generateForecastSeries, weightedMovingAverageForecast } from '@/lib/forecasting';
import type { CompanyForecast, ForecastDataPoint, PlatformSpend, ProjectForecast } from '@/types/api';

interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

interface UsageSummaryRow {
  key_id: string;
  provider: string;
  model: string;
  date: string;
  cost_usd: number;
}

interface EstimatorContext {
  monthStart: string;
  today: string;
  year: number;
  monthIndex: number;
  daysInMonth: number;
  projects: Array<{ id: string; name: string }>;
  keys: Array<{ id: string; project_id: string | null; provider: string }>;
  usageRows: UsageSummaryRow[];
  budgetAmount: number | null;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function getMonthContext(timezone: string) {
  const now = new Date();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);
  const [yearPart, monthPart] = today.split('-');
  const year = Number(yearPart ?? now.getUTCFullYear());
  const month = Number(monthPart ?? now.getUTCMonth() + 1);

  return {
    today,
    monthStart: `${year}-${String(month).padStart(2, '0')}-01`,
    year,
    monthIndex: month - 1,
    daysInMonth: new Date(Date.UTC(year, month, 0)).getUTCDate(),
  };
}

function buildDailySpend(rows: UsageSummaryRow[]) {
  const dailyMap = new Map<string, number>();
  for (const row of rows) {
    dailyMap.set(row.date, (dailyMap.get(row.date) ?? 0) + Number(row.cost_usd));
  }

  return Array.from(dailyMap.entries())
    .map(([date, amount]) => ({ date, amount: roundCurrency(amount) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function buildProviderBreakdown(rows: UsageSummaryRow[]): PlatformSpend[] {
  const total = rows.reduce((sum, row) => sum + Number(row.cost_usd), 0);
  const providerMap = new Map<string, number>();

  for (const row of rows) {
    providerMap.set(row.provider, (providerMap.get(row.provider) ?? 0) + Number(row.cost_usd));
  }

  return Array.from(providerMap.entries())
    .map(([provider, amount]) => ({
      provider,
      amount: roundCurrency(amount),
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function buildModelBreakdown(rows: UsageSummaryRow[]) {
  const modelMap = new Map<string, number>();

  for (const row of rows) {
    const key = `${row.provider}::${row.model}`;
    modelMap.set(key, (modelMap.get(key) ?? 0) + Number(row.cost_usd));
  }

  return Array.from(modelMap.entries())
    .map(([key, spend]) => {
      const [provider, model] = key.split('::');
      return {
        provider: provider ?? '',
        model: model ?? '',
        spend: roundCurrency(spend),
      };
    })
    .sort((a, b) => b.spend - a.spend);
}

function buildProjectForecast(
  projectId: string,
  projectName: string,
  rows: UsageSummaryRow[],
  monthContext: Pick<EstimatorContext, 'daysInMonth' | 'year' | 'monthIndex'>,
): ProjectForecast {
  const dailySpend = buildDailySpend(rows);
  const summary = weightedMovingAverageForecast(dailySpend, monthContext.daysInMonth);
  const currentSpend = rows.reduce((sum, row) => sum + Number(row.cost_usd), 0);
  const dailyData: ForecastDataPoint[] = rows.length > 0
    ? generateForecastSeries(
        dailySpend,
        monthContext.daysInMonth,
        monthContext.year,
        monthContext.monthIndex,
      )
    : [];

  return {
    project_id: projectId,
    project_name: projectName,
    current_spend: roundCurrency(currentSpend),
    forecast_month_end: summary.forecast,
    confidence_low: summary.confidenceLow,
    confidence_high: summary.confidenceHigh,
    daily_data: dailyData,
    by_provider: buildProviderBreakdown(rows),
    by_model: buildModelBreakdown(rows),
    trend: summary.trend,
  };
}

async function getEstimatorContext(): Promise<ActionResult<EstimatorContext>> {
  try {
    const supabase = await createClient();
    const auth = await getAuthenticatedCompany(supabase);
    if (auth.error || !auth.companyId) {
      return { data: null, error: auth.error ?? 'Not authenticated' };
    }

    const [{ data: profile }, { data: projects }, { data: keys }, { data: budget }] = await Promise.all([
      supabase
        .from('profiles')
        .select('timezone')
        .eq('id', auth.userId!)
        .single(),
      supabase
        .from('projects')
        .select('id, name')
        .eq('company_id', auth.companyId)
        .order('name'),
      supabase
        .from('api_keys')
        .select('id, project_id, provider')
        .eq('company_id', auth.companyId),
      supabase
        .from('budgets')
        .select('amount_usd')
        .eq('company_id', auth.companyId)
        .eq('scope', 'global')
        .maybeSingle(),
    ]);

    const monthContext = getMonthContext(profile?.timezone || 'UTC');
    const keyIds = (keys ?? []).map((key) => key.id);

    const usageRows = keyIds.length > 0
      ? (((await supabase
          .from('usage_records')
          .select('key_id, provider, model, date, cost_usd')
          .in('key_id', keyIds)
          .gte('date', monthContext.monthStart)
          .lte('date', monthContext.today)).data ?? []) as UsageSummaryRow[])
      : [];

    return {
      data: {
        ...monthContext,
        projects: (projects ?? []) as Array<{ id: string; name: string }>,
        keys: (keys ?? []) as Array<{ id: string; project_id: string | null; provider: string }>,
        usageRows,
        budgetAmount: budget?.amount_usd != null ? Number(budget.amount_usd) : null,
      },
      error: null,
    };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getCompanyForecast(): Promise<ActionResult<CompanyForecast>> {
  const contextResult = await getEstimatorContext();
  if (contextResult.error || !contextResult.data) {
    return { data: null, error: contextResult.error ?? 'Failed to load estimator context' };
  }

  const context = contextResult.data;
  const companyDailySpend = buildDailySpend(context.usageRows);

  if (context.usageRows.length === 0) {
    return {
      data: {
        current_spend: 0,
        forecast_month_end: 0,
        confidence_low: 0,
        confidence_high: 0,
        daily_data: [],
        by_project: [],
        unassigned_spend: 0,
        by_provider: [],
        budget_amount: context.budgetAmount,
        budget_utilization_pct: null,
      },
      error: null,
    };
  }

  const companySummary = weightedMovingAverageForecast(companyDailySpend, context.daysInMonth);
  const companyCurrentSpend = context.usageRows.reduce((sum, row) => sum + Number(row.cost_usd), 0);
  const keysByProject = new Map<string, string | null>(
    context.keys.map((key) => [key.id, key.project_id ?? null]),
  );

  const byProject = context.projects.map((project) => {
    const projectRows = context.usageRows.filter(
      (row) => keysByProject.get(row.key_id) === project.id,
    );
    return buildProjectForecast(project.id, project.name, projectRows, context);
  });

  const unassignedRows = context.usageRows.filter(
    (row) => !keysByProject.get(row.key_id),
  );
  const budgetUtilizationPct = context.budgetAmount && context.budgetAmount > 0
    ? Math.round((companySummary.forecast / context.budgetAmount) * 100)
    : null;

  return {
    data: {
      current_spend: roundCurrency(companyCurrentSpend),
      forecast_month_end: companySummary.forecast,
      confidence_low: companySummary.confidenceLow,
      confidence_high: companySummary.confidenceHigh,
      daily_data: generateForecastSeries(
        companyDailySpend,
        context.daysInMonth,
        context.year,
        context.monthIndex,
      ),
      by_project: byProject,
      unassigned_spend: roundCurrency(unassignedRows.reduce((sum, row) => sum + Number(row.cost_usd), 0)),
      by_provider: buildProviderBreakdown(context.usageRows),
      budget_amount: context.budgetAmount,
      budget_utilization_pct: budgetUtilizationPct,
    },
    error: null,
  };
}

export async function getProjectForecast(projectId: string): Promise<ActionResult<ProjectForecast>> {
  const contextResult = await getEstimatorContext();
  if (contextResult.error || !contextResult.data) {
    return { data: null, error: contextResult.error ?? 'Failed to load estimator context' };
  }

  const context = contextResult.data;
  const project = context.projects.find((entry) => entry.id === projectId);
  if (!project) {
    return { data: null, error: 'Project not found' };
  }

  const projectKeyIds = new Set(
    context.keys
      .filter((key) => key.project_id === project.id)
      .map((key) => key.id),
  );
  const projectRows = context.usageRows.filter((row) => projectKeyIds.has(row.key_id));

  return {
    data: buildProjectForecast(project.id, project.name, projectRows, context),
    error: null,
  };
}
