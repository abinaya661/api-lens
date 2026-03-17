'use client';

import { StatCard } from '@/components/shared';
import { type DashboardStats } from '@/lib/mock-data';
import { CreditCard, TrendingUp, Key, Coins } from 'lucide-react';

interface MetricCardsProps {
  stats: DashboardStats;
}

export function MetricCards({ stats }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Spend (30d)"
        value={stats.totalSpend}
        format="currency"
        icon={<CreditCard className="w-4 h-4" />}
        trend={{ value: stats.spendTrend, label: 'vs previous 30d' }}
        subtitle="vs previous 30d"
      />
      <StatCard
        title="Projected Spend"
        value={stats.projectedSpend}
        format="currency"
        icon={<TrendingUp className="w-4 h-4" />}
        trend={{ value: stats.projectedTrend, label: 'vs last month' }}
        subtitle="End of month"
      />
      <StatCard
        title="Active API Keys"
        value={stats.activeKeys}
        format="number"
        icon={<Key className="w-4 h-4" />}
        subtitle="Across 4 providers"
      />
      <StatCard
        title="Blended Token Rate"
        value={stats.blendedRate}
        format="currency"
        icon={<Coins className="w-4 h-4" />}
        trend={{ value: stats.rateTrend, label: 'efficiency' }}
        subtitle="Avg per 1k tokens"
      />
    </div>
  );
}
