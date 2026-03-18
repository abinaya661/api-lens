'use client';

import { PageHeader } from '@/components/shared';
import { DashboardSkeleton, EmptyState, ErrorState } from '@/components/shared';
import {
  MetricCards,
  CostChart,
  ProviderBreakdownList,
} from '@/components/dashboard';
import { useDashboard } from '@/hooks/use-dashboard';
import { BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Dashboard" description="Overview of your AI API costs across all providers." />
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!data || data.active_key_count === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Dashboard" description="Overview of your AI API costs across all providers." />
        <EmptyState
          icon={<BarChart3 className="w-10 h-10" />}
          title="No API keys yet"
          description="Add your first API key to start tracking costs across all your AI providers."
          action={
            <a
              href="/keys"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
            >
              Add API Key
            </a>
          }
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your AI API costs across all providers."
      />

      <MetricCards
        totalSpend={data.total_spend_this_month}
        projectedSpend={data.projected_month_end}
        activeKeyCount={data.active_key_count}
        budgetRemainingPct={data.budget_remaining_pct}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CostChart data={data.daily_spend} />
        </div>
        <div>
          <ProviderBreakdownList data={data.spend_by_platform} />
        </div>
      </div>
    </div>
  );
}
