'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AnimatedCounter } from './animated-counter';
import { RevealOnScroll } from './reveal-on-scroll';

/* ─── Dummy data ─── */
const DUMMY_DAILY_SPEND = Array.from({ length: 30 }, (_, i) => ({
  date: `Mar ${i + 1}`,
  amount: Math.round((60 + Math.sin(i * 0.5) * 20 + Math.random() * 30 + i * 1.5) * 100) / 100,
}));

const DUMMY_PROVIDERS = [
  { name: 'OpenAI', amount: 1281, pct: 45, color: '#10a37f' },
  { name: 'Anthropic', amount: 854, pct: 30, color: '#d97757' },
  { name: 'Gemini', amount: 427, pct: 15, color: '#1a73e8' },
  { name: 'Mistral', amount: 285, pct: 10, color: '#f54e42' },
];

/* ─── Custom chart tooltip ─── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 shadow-xl">
      <p className="text-xs text-zinc-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-white font-mono">${payload[0]?.value.toFixed(2)}</p>
    </div>
  );
}

/* ─── Progress Ring ─── */
function ProgressRing({ percent, size = 44, stroke = 4 }: { percent: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circ);

  const ref = useRef<SVGSVGElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) setHasAnimated(true); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasAnimated) return;
    const timer = setTimeout(() => {
      setOffset(circ - (percent / 100) * circ);
    }, 300);
    return () => clearTimeout(timer);
  }, [hasAnimated, percent, circ]);

  return (
    <svg ref={ref} width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#27272a" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="#3b82f6"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
    </svg>
  );
}

/* ─── Provider bar ─── */
function ProviderBar({ name, pct, amount, color }: { name: string; pct: number; amount: number; color: string }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) setWidth(pct); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pct]);

  return (
    <div ref={ref} className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="text-xs text-zinc-300 font-medium">{name}</span>
        </div>
        <span className="text-xs text-zinc-500 font-mono">${amount.toLocaleString()}</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ─── Main Dashboard Preview ─── */
export function DashboardPreview() {
  return (
    <section id="dashboard-preview" className="py-24 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <RevealOnScroll>
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            See It In Action
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-xl mx-auto">
            A live preview of what your dashboard looks like — real interface, dummy data.
          </p>
        </RevealOnScroll>

        <RevealOnScroll>
          <div
            className="dashboard-frame rounded-2xl border border-zinc-800 bg-zinc-900/50 p-1.5 md:p-2 shadow-2xl shadow-brand-500/5"
            aria-label="Interactive dashboard preview showing spend analytics with dummy data"
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/80 bg-black rounded-t-xl">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-500 font-mono">
                  apilens.dev/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="bg-[#09090b] rounded-b-xl p-4 md:p-6">
              {/* Metric cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                <MetricCard
                  label="Spend This Month"
                  prefix="$"
                  value={2847.32}
                  decimals={2}
                  trend="+12.5%"
                  trendUp={true}
                />
                <MetricCard
                  label="Projected Spend"
                  prefix="$"
                  value={4215}
                  decimals={0}
                  trend="+8.3%"
                  trendUp={true}
                />
                <MetricCard
                  label="Active API Keys"
                  value={12}
                  trend="+2"
                  trendUp={true}
                />
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
                  <p className="text-xs text-zinc-500 mb-2">Budget Used</p>
                  <div className="flex items-center gap-3">
                    <ProgressRing percent={67} />
                    <div>
                      <p className="text-lg font-bold text-white font-mono">67%</p>
                      <p className="text-xs text-zinc-500">of $4,500</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart + Provider breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Chart area */}
                <div className="md:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
                  <p className="text-sm font-medium text-white mb-4">Daily Spend (Last 30 Days)</p>
                  <div className="h-48 md:h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={DUMMY_DAILY_SPEND} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#71717a', fontSize: 11 }}
                          interval={6}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#71717a', fontSize: 11 }}
                          tickFormatter={(v: number) => `$${v}`}
                          width={50}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fill="url(#spendGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Provider breakdown sidebar */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
                  <p className="text-sm font-medium text-white mb-4">Provider Breakdown</p>
                  {DUMMY_PROVIDERS.map((p) => (
                    <ProviderBar key={p.name} {...p} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

/* ─── Metric Card helper ─── */
function MetricCard({
  label,
  value,
  prefix = '',
  decimals = 0,
  trend,
  trendUp,
}: {
  label: string;
  value: number;
  prefix?: string;
  decimals?: number;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
      <p className="text-xs text-zinc-500 mb-2">{label}</p>
      <p className="text-lg md:text-xl font-bold text-white">
        <AnimatedCounter target={value} prefix={prefix} decimals={decimals} duration={2000} />
      </p>
      <p className={`text-xs mt-1 ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
        {trend} <span className="text-zinc-600">vs last month</span>
      </p>
    </div>
  );
}
