'use client';

import {
  Area,
  AreaChart,
  ResponsiveContainer,
} from 'recharts';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { ProjectForecast } from '@/types/api';

interface ProjectForecastCardProps {
  project: ProjectForecast;
}

export function ProjectForecastCard({ project }: ProjectForecastCardProps) {
  const TrendIcon =
    project.trend === 'increasing'
      ? TrendingUp
      : project.trend === 'decreasing'
        ? TrendingDown
        : Minus;
  const trendColor =
    project.trend === 'increasing'
      ? 'text-red-400'
      : project.trend === 'decreasing'
        ? 'text-green-400'
        : 'text-zinc-500';

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-100">{project.project_name}</p>
          <p className="text-xs text-zinc-500 mt-1">Current: {formatCurrency(project.current_spend)}</p>
        </div>
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          {project.trend}
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-bold text-white tabular-nums">
          {formatCurrency(project.forecast_month_end)}
        </p>
        <p className="text-xs text-zinc-500">
          Forecast month end
        </p>
      </div>

      <div className="h-14">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={project.daily_data.map((point) => ({
              value: point.actual || point.forecast || 0,
            }))}
          >
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="rgba(59,130,246,0.14)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
