'use client';

import { StatCard } from '@/components/shared';
import { CreditCard, TrendingUp, Key, Activity } from 'lucide-react';

interface MetricCardsProps {
  totalSpend: number;
  projectedSpend: number;
  activeKeyCount: number;
  budgetRemainingPct: number | null;
}

export function MetricCards({ totalSpend, projectedSpend, activeKeyCount, budgetRemainingPct }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Spend This Month"
        value={totalSpend}
        format="currency"
        icon={<CreditCard className="w-4 h-4" />}
        subtitle="Current month total"
      />
      <StatCard
        title="Projected Spend"
        value={projectedSpend}
        format="currency"
        icon={<TrendingUp className="w-4 h-4" />}
        subtitle="End of month estimate"
      />
      <StatCard
        title="Active API Keys"
        value={activeKeyCount}
        format="number"
        icon={<Key className="w-4 h-4" />}
        subtitle="Currently monitored"
      />
      <StatCard
        title="Budget Used"
        value={budgetRemainingPct !== null ? (100 - budgetRemainingPct) : 0}
        format="percentage"
        icon={<Activity className="w-4 h-4" />}
        subtitle={budgetRemainingPct !== null ? 'Of monthly budget' : 'No budget set'}
      />
    </div>
  );
}
