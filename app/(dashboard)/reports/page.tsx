'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared';
import { mockReportData } from '@/lib/mock-data-reports';
import { formatCurrency } from '@/lib/utils';
import { Download, Filter, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const [isExporting, setIsExporting] = useState(false);

  function handleExport() {
    setIsExporting(true);
    // Simulate generation delay
    setTimeout(() => {
      setIsExporting(false);
      // In a real app we'd construct a CSV string and trigger download.
      alert('Mock CSV Export generated successfully.');
    }, 1000);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Detailed, granular view of API usage ready for export."
        actions={
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Generating...' : 'Export CSV'}
          </button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 glass-card">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
              <Calendar className="w-4 h-4" />
            </div>
            <select className="w-full sm:w-[200px] pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Month</option>
              <option>Last Month</option>
              <option>Custom Range...</option>
            </select>
          </div>
          <button className="p-2 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
        <div className="text-sm text-zinc-500">
          Showing <span className="text-zinc-300 font-medium">{mockReportData.length}</span> records
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Project</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Provider</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Model</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Prompt Tokens</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Completion Tokens</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Tokens</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {mockReportData.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">{row.date}</td>
                  <td className="py-3 px-4 text-zinc-300">{row.project_name}</td>
                  <td className="py-3 px-4 text-zinc-400 capitalize">{row.provider.replace('_', ' ')}</td>
                  <td className="py-3 px-4 text-zinc-400 font-mono text-xs">{row.model}</td>
                  <td className="py-3 px-4 text-right text-zinc-500 tabular-nums hidden md:table-cell">
                    {row.tokens_prompt.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-500 tabular-nums hidden md:table-cell">
                    {row.tokens_completion.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-300 tabular-nums">
                    {row.tokens_total.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-100 font-medium tabular-nums">
                    {formatCurrency(row.cost_usd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
