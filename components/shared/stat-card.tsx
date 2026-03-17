'use client';

import { cn, formatCurrency, formatPercentage } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  icon?: React.ReactNode;
  format?: 'currency' | 'number' | 'percentage' | 'none';
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  format = 'none',
  className,
}: StatCardProps) {
  const formattedValue =
    format === 'currency' && typeof value === 'number'
      ? formatCurrency(value)
      : format === 'percentage' && typeof value === 'number'
        ? formatPercentage(value)
        : String(value);

  const TrendIcon =
    trend && trend.value > 0
      ? TrendingUp
      : trend && trend.value < 0
        ? TrendingDown
        : Minus;

  const trendColor =
    trend && trend.value > 0
      ? 'text-red-400'
      : trend && trend.value < 0
        ? 'text-green-400'
        : 'text-zinc-500';

  return (
    <div
      className={cn(
        'glass-card p-6 group animate-fade-in',
        className,
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className="text-zinc-600 group-hover:text-brand-400 transition-colors">
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-zinc-100 mb-1 tabular-nums">
        {formattedValue}
      </div>
      <div className="flex items-center gap-2">
        {trend && (
          <span className={cn('inline-flex items-center gap-1 text-xs font-medium', trendColor)}>
            <TrendIcon className="w-3 h-3" />
            {Math.abs(trend.value)}%
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-zinc-600">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
