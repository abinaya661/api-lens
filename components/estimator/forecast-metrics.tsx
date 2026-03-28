'use client';

import { Gauge, Target, TrendingUp, Wallet } from 'lucide-react';
import { StatCard } from '@/components/shared';
import type { CompanyForecast } from '@/types/api';

interface ForecastMetricsProps {
  data: CompanyForecast;
}

export function ForecastMetrics({ data }: ForecastMetricsProps) {
  const projectedDelta = data.current_spend > 0
    ? Math.round(((data.forecast_month_end - data.current_spend) / data.current_spend) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Current Spend"
        value={data.current_spend}
        format="currency"
        icon={<Wallet className="w-4 h-4" />}
      />
      <StatCard
        title="Forecast Month End"
        value={data.forecast_month_end}
        format="currency"
        trend={{ value: projectedDelta, label: 'vs current spend' }}
        icon={<TrendingUp className="w-4 h-4" />}
      />
      <StatCard
        title="Confidence Range"
        value={`$${data.confidence_low.toFixed(2)}-$${data.confidence_high.toFixed(2)}`}
        subtitle="95% interval"
        icon={<Gauge className="w-4 h-4" />}
      />
      <StatCard
        title="Budget Utilization"
        value={data.budget_utilization_pct ?? 'No budget'}
        format={data.budget_utilization_pct != null ? 'percentage' : 'none'}
        subtitle={data.budget_amount != null ? `of $${data.budget_amount.toFixed(2)}` : 'Set a global budget to track risk'}
        icon={<Target className="w-4 h-4" />}
      />
    </div>
  );
}
