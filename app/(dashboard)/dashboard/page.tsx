'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared';
import {
  MetricCards,
  CostChart,
  ProviderBreakdownList,
  DashboardDatePicker,
} from '@/components/dashboard';
import { mockDailyData, mockBreakdown, mockStats } from '@/lib/mock-data';

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<'7D' | '30D' | '90D' | 'YTD'>('30D');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your AI API costs across all providers."
        actions={
          <DashboardDatePicker
            selectedRange={dateRange}
            onChange={setDateRange}
          />
        }
      />

      {/* Top line metrics */}
      <MetricCards stats={mockStats} />

      {/* Main charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {/* Main cost over time chart. If a provider is selected, it filters to that provider. */}
          <CostChart data={mockDailyData} provider={selectedProvider} />
        </div>
        <div>
          {/* Provider breakdown list. Clicking a provider filters the main chart. */}
          <ProviderBreakdownList
            data={mockBreakdown}
            selectedProvider={selectedProvider}
            onSelect={setSelectedProvider}
          />
        </div>
      </div>
    </div>
  );
}
