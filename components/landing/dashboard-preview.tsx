'use client';

import { useEffect, useRef, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AnimatedCounter } from './animated-counter';
import { RevealOnScroll } from './reveal-on-scroll';
import { Activity, KeyRound, Plus } from 'lucide-react';

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
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 shadow-xl transition-all duration-200">
      <p className="text-xs text-zinc-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-white font-mono">${payload[0]?.value.toFixed(2)}</p>
    </div>
  );
}

/* ─── Main Dashboard Preview ─── */
export function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<'overview' | 'budgets' | 'keys'>('overview');

  return (
    <section id="dashboard-preview" className="py-16 md:py-24 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
              A dashboard you'll actually<br />want to use.
            </h2>
            <p className="text-zinc-400 text-lg">
              Interactive, lightning-fast, and deeply integrated with every major provider.
            </p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll>
          {/* Interactive tabs above the browser chrome */}
          <div className="flex items-center justify-center gap-2 md:gap-4 mb-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'overview' ? 'bg-brand-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('budgets')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'budgets' ? 'bg-brand-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              Budgets
            </button>
            <button
              onClick={() => setActiveTab('keys')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'keys' ? 'bg-brand-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              Encrypted Keys
            </button>
          </div>

          <div
            className="dashboard-frame rounded-2xl border border-zinc-800 bg-zinc-900/50 p-1.5 md:p-2 shadow-2xl shadow-brand-500/10 transition-all duration-500 w-full overflow-x-auto"
            aria-label="Interactive dashboard preview showing spend analytics with dummy data"
          >
            <div className="min-w-[700px]">
            {/* Browser chrome */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-black/80 backdrop-blur-md rounded-t-xl">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 flex justify-center px-4">
                <div className="px-5 py-1.5 rounded-md bg-zinc-900/80 border border-zinc-800/80 text-xs text-zinc-500 font-mono w-full max-w-sm text-center flex items-center justify-center gap-2 group cursor-text">
                  <LockIcon className="w-3 h-3" />
                  apilens.dev/dashboard/{activeTab}
                </div>
              </div>
              <div className="w-12" /> {/* spacer for center alignment */}
            </div>

            {/* Dashboard content wrapper with crossfade transition */}
            <div className="bg-[#09090b] rounded-b-xl p-4 md:p-6 min-h-[500px] relative overflow-hidden">
              {/* Background gradient hint */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 blur-[100px] rounded-full pointer-events-none" />

              <div className="relative z-10 transition-opacity duration-300">
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'budgets' && <BudgetsTab />}
                {activeTab === 'keys' && <KeysTab />}
              </div>
            </div>
          </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────
                            TABS
   ──────────────────────────────────────────────────────────── */

function OverviewTab() {
  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <MetricCard label="Spend This Month" prefix="$" value={2847.32} decimals={2} trend="+12.5%" trendUp={true} />
        <MetricCard label="Projected Spend" prefix="$" value={4215} decimals={0} trend="+8.3%" trendUp={true} />
        <MetricCard label="Active API Keys" value={12} trend="+2" trendUp={true} />
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 hover:border-zinc-700 transition-colors group cursor-default">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-zinc-500">Global Budget Used</p>
            <Activity className="w-3.5 h-3.5 text-zinc-600 group-hover:text-brand-400 transition-colors" />
          </div>
          <div className="flex items-center gap-3">
            <ProgressRing percent={67} />
            <div>
              <p className="text-lg font-bold text-white font-mono">67%</p>
              <p className="text-[10px] text-zinc-500">of $4,500 capped</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Chart area */}
        <div className="md:col-span-2 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-medium text-white">Daily Spend (Last 30 Days)</p>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
              <span className="text-xs text-zinc-400">Total Spend</span>
            </div>
          </div>
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
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} interval={6} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} width={40} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} fill="url(#spendGradient)" activeDot={{ r: 4, strokeWidth: 0, fill: '#60a5fa' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Provider breakdown sidebar */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 hover:border-zinc-700 transition-colors">
          <p className="text-sm font-medium text-white mb-6">Provider Breakdown</p>
          <div className="space-y-4">
            {DUMMY_PROVIDERS.map((p) => (
              <ProviderBar key={p.name} {...p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BudgetsTab() {
  const [clickedMock, setClickedMock] = useState(false);

  return (
    <div className="animate-fade-in p-2">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-semibold text-white">Active Budgets</h3>
          <p className="text-sm text-zinc-500">Alerts triggering via Slack & Email</p>
        </div>
        <button 
          onClick={() => setClickedMock(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
            clickedMock ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-brand-600 hover:bg-brand-500 text-white'
          }`}
        >
          {clickedMock ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {clickedMock ? 'Mock Modal Opened' : 'Create Budget'}
        </button>
      </div>

      <div className="space-y-4">
        <BudgetMockRow name="Global Workspace Limit" used={4120} limit={5000} percent={82} status="warning" />
        <BudgetMockRow name="Engineering Team (GPT-4)" used={1200} limit={4000} percent={30} status="healthy" />
        <BudgetMockRow name="Marketing Copy Bot" used={50} limit={50} percent={100} status="danger" />
      </div>
    </div>
  );
}

function KeysTab() {
  return (
    <div className="animate-fade-in p-2">
       <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-semibold text-white">Encrypted Credentials</h3>
          <p className="text-sm text-zinc-500">Stored using AES-256-GCM zero-knowledge architecture.</p>
        </div>
        <button className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-all">
          Connect Provider
        </button>
      </div>

      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-zinc-900/60 border-b border-zinc-800/80 text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Key Hint</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Last Synced</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
            <KeyRow provider="OpenAI" hint="sk-...f8a2" status="Active" time="2 mins ago" />
            <KeyRow provider="Anthropic" hint="sk-ant-...91cc" status="Active" time="5 mins ago" />
            <KeyRow provider="Google Gemini" hint="AIza...h92" status="Active" time="12 mins ago" />
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
                          HELPERS
   ──────────────────────────────────────────────────────────── */

function MetricCard({ label, value, prefix = '', decimals = 0, trend, trendUp }: any) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 hover:border-zinc-700 transition-all hover:shadow-lg cursor-default group">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">{label}</p>
      </div>
      <p className="text-xl md:text-2xl font-bold text-white tracking-tight">
        <AnimatedCounter target={value} prefix={prefix} decimals={decimals} duration={2000} />
      </p>
      <p className={`text-[11px] mt-1.5 font-medium ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
        {trend} <span className="text-zinc-600 font-normal">vs last month</span>
      </p>
    </div>
  );
}

function ProgressRing({ percent, size = 44, stroke = 4 }: any) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circ);
  const ref = useRef<SVGSVGElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) setHasAnimated(true); }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasAnimated) return;
    const timer = setTimeout(() => { setOffset(circ - (percent / 100) * circ); }, 300);
    return () => clearTimeout(timer);
  }, [hasAnimated, percent, circ]);

  return (
    <svg ref={ref} width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#27272a" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#3b82f6" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }} />
    </svg>
  );
}

function ProviderBar({ name, pct, amount, color }: any) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) setWidth(pct); }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [pct]);

  return (
    <div ref={ref} className="group cursor-default">
      <div className="flex items-center justify-between mb-1.5 transition-colors group-hover:text-white">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-110" style={{ backgroundColor: color }} />
          <span className="text-xs text-zinc-400 font-medium group-hover:text-zinc-200 transition-colors">{name}</span>
        </div>
        <span className="text-xs text-zinc-500 font-mono group-hover:text-zinc-300 transition-colors">${amount.toLocaleString()}</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden relative">
         <div className="h-full rounded-full transition-all duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)] opacity-80 group-hover:opacity-100" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function BudgetMockRow({ name, used, limit, percent, status }: any) {
  return (
    <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-white">{name}</p>
          {status === 'warning' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-500 uppercase">Warning Sent</span>}
          {status === 'danger' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 uppercase">Hard Cap Blocked</span>}
        </div>
        <p className="text-xs text-zinc-500 font-mono">${used.toLocaleString()} / ${limit.toLocaleString()}</p>
      </div>
      
      <div className="flex items-center gap-4 w-full md:w-64">
        <div className="h-2 flex-1 rounded-full bg-zinc-800 overflow-hidden">
          <div className={`h-full rounded-full ${status === 'danger' ? 'bg-red-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${percent}%` }} />
        </div>
        <span className="text-sm font-mono text-zinc-400 min-w-[3ch] text-right group-hover:text-white transition-colors">{percent}%</span>
      </div>
    </div>
  );
}

function KeyRow({ provider, hint, status, time }: any) {
  return (
    <tr className="hover:bg-zinc-800/30 transition-colors cursor-pointer group">
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-zinc-500 group-hover:text-brand-400 transition-colors" />
          <span className="font-medium text-white">{provider}</span>
        </div>
      </td>
      <td className="px-4 py-4 font-mono text-xs text-zinc-500">{hint}</td>
      <td className="px-4 py-4">
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          {status}
        </span>
      </td>
      <td className="px-4 py-4 text-right text-xs text-zinc-500">{time}</td>
    </tr>
  );
}

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
function Check(props: React.SVGProps<SVGSVGElement>) { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 6 9 17l-5-5"/></svg>; }
