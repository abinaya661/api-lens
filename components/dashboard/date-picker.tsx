'use client';

import { Calendar } from 'lucide-react';

interface DatePickerProps {
  selectedRange: '7D' | '30D' | '90D' | 'YTD';
  onChange: (range: '7D' | '30D' | '90D' | 'YTD') => void;
}

const ranges = ['7D', '30D', '90D', 'YTD'] as const;

export function DashboardDatePicker({ selectedRange, onChange }: DatePickerProps) {
  return (
    <div className="flex items-center p-1 bg-zinc-900/50 border border-zinc-800 rounded-lg backdrop-blur-md">
      <div className="pl-3 pr-2 border-r border-zinc-800 text-zinc-500">
        <Calendar className="w-4 h-4" />
      </div>
      <div className="flex px-1 gap-1">
        {ranges.map((range) => (
          <button
            key={range}
            onClick={() => onChange(range)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              selectedRange === range
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  );
}
