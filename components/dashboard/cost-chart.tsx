'use client';

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { type DailySpend } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { useMemo } from 'react';

interface CostChartProps {
  data: DailySpend[];
  provider?: string | null; // null = all providers combined
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10a37f', // green
  anthropic: '#d97757', // orange/coral
  gemini: '#1a73e8', // blue
  mistral: '#f54e42', // red
  cohere: '#39594d', // dark green
  bedrock: '#ff9900', // aws orange
  azure_openai: '#0078d4', // ms blue
};

export function CostChart({ data, provider }: CostChartProps) {
  // If no specific provider is selected, we map the 'total' field and use the brand blue color.
  // Otherwise, we map the specific provider's field and use their brand color.
  const chartData = useMemo(() => {
    return data.map((day) => ({
      date: day.date,
      value: provider ? day[provider as keyof DailySpend] : day.total,
    }));
  }, [data, provider]);

  const color = provider ? PROVIDER_COLORS[provider] || '#3b82f6' : '#3b82f6';

  return (
    <div className="glass-card p-6 h-[400px] flex flex-col group animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-zinc-100 mb-1">Cost over time</h3>
          <p className="text-xs text-zinc-500">Daily API spend aggregated by platform</p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#71717a' }}
              dy={10}
              minTickGap={30}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#71717a' }}
              tickFormatter={(val) => `$${val}`}
              dx={-10}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length > 0 && payload[0]) {
                  return (
                    <div className="glass px-4 py-3 rounded-lg border border-zinc-800 shadow-xl">
                      <p className="text-xs text-zinc-400 mb-1">{label}</p>
                      <p className="text-lg font-bold text-white tabular-nums">
                        {formatCurrency(payload[0].value as number)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorGradient)"
              activeDot={{ r: 4, strokeWidth: 0, fill: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
