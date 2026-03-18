'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, EmptyState, ErrorState, SkeletonTable } from '@/components/shared';
import { getUsageRecords } from '@/lib/actions/dashboard';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Download, FileText } from 'lucide-react';

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getDateFrom(range: string): string {
  const now = new Date();
  switch (range) {
    case '7': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return toDateStr(d);
    }
    case '30': {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return toDateStr(d);
    }
    case 'month':
      return toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
    case 'last_month':
      return toDateStr(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    default:
      return toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
  }
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<'7' | '30' | 'month' | 'last_month'>('30');

  const dateFrom = getDateFrom(dateRange);
  const dateTo = toDateStr(new Date());

  const { data: records, isLoading, error, refetch } = useQuery({
    queryKey: ['usage-records', dateFrom, dateTo],
    queryFn: async () => {
      const result = await getUsageRecords(dateFrom, dateTo);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });

  function handleExport() {
    if (!records || records.length === 0) return;
    const headers = ['Date', 'Provider', 'Model', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Cost (USD)'];
    const csv = [
      headers.join(','),
      ...records.map((r) => [r.date, r.provider, r.model, r.input_tokens, r.output_tokens, r.total_tokens, r.cost_usd].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-lens-report-${dateFrom}-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Reports & Analytics" description="Detailed, granular view of API usage ready for export." />
        <SkeletonTable rows={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Reports & Analytics" description="Detailed, granular view of API usage ready for export." />
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </div>
    );
  }

  const allRecords = records ?? [];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Detailed, granular view of API usage ready for export."
        actions={
          <button onClick={handleExport} disabled={allRecords.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 glass-card">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="w-full sm:w-[200px] px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40">
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="month">This Month</option>
            <option value="last_month">Last Month</option>
          </select>
        </div>
        <div className="text-sm text-zinc-500">
          Showing <span className="text-zinc-300 font-medium">{allRecords.length}</span> records
        </div>
      </div>

      {allRecords.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-10 h-10" />}
          title="No usage records"
          description="Usage data will appear here once your API keys start syncing."
        />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Provider</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Model</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Input Tokens</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Output Tokens</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Tokens</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {allRecords.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">{row.date}</td>
                    <td className="py-3 px-4 text-zinc-400 capitalize">{row.provider}</td>
                    <td className="py-3 px-4 text-zinc-400 font-mono text-xs">{row.model}</td>
                    <td className="py-3 px-4 text-right text-zinc-500 tabular-nums hidden md:table-cell">{formatNumber(row.input_tokens)}</td>
                    <td className="py-3 px-4 text-right text-zinc-500 tabular-nums hidden md:table-cell">{formatNumber(row.output_tokens)}</td>
                    <td className="py-3 px-4 text-right text-zinc-300 tabular-nums">{formatNumber(row.total_tokens)}</td>
                    <td className="py-3 px-4 text-right text-zinc-100 font-medium tabular-nums">{formatCurrency(row.cost_usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
