'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import type { ForecastDataPoint } from '@/types/api';

interface ForecastChartProps {
  data: ForecastDataPoint[];
  title?: string;
  description?: string;
}

export function ForecastChart({
  data,
  title = 'Spend Forecast',
  description = 'Actual spend through today, projected spend for the rest of the month.',
}: ForecastChartProps) {
  const chartData = data.map((point) => ({
    ...point,
    label: point.date.slice(5),
  }));
  const forecastStart = chartData.find((point) => point.forecast != null)?.date;

  return (
    <div className="glass-card p-6 h-[420px] flex flex-col">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-zinc-100 mb-1">{title}</h3>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="forecastActualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#71717a' }}
              dy={10}
              minTickGap={24}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#71717a' }}
              tickFormatter={(value) => `$${value}`}
              dx={-8}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const actual = payload.find((entry) => entry.dataKey === 'actual')?.value as number | undefined;
                const forecast = payload.find((entry) => entry.dataKey === 'forecast')?.value as number | undefined;

                return (
                  <div className="glass rounded-lg border border-zinc-800 px-4 py-3 shadow-xl">
                    <p className="text-xs text-zinc-400 mb-2">{label}</p>
                    <div className="space-y-1">
                      <p className="text-sm text-zinc-200">
                        Actual: <span className="font-semibold text-white">{formatCurrency(actual ?? 0)}</span>
                      </p>
                      {forecast != null && (
                        <p className="text-sm text-zinc-200">
                          Forecast: <span className="font-semibold text-white">{formatCurrency(forecast)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            {forecastStart && (
              <ReferenceLine
                x={forecastStart}
                stroke="rgba(244,244,245,0.35)"
                strokeDasharray="4 4"
                label={{ value: 'Today', position: 'top', fill: '#a1a1aa', fontSize: 12 }}
              />
            )}
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#forecastActualGradient)"
              activeDot={{ r: 4, strokeWidth: 0, fill: '#fff' }}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="6 6"
              dot={false}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
