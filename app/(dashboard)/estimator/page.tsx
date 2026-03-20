'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, EmptyState, ErrorState, SkeletonCard } from '@/components/shared';
import { getPriceSnapshots } from '@/lib/actions/dashboard';
import { formatCurrency } from '@/lib/utils';
import { Calculator, ArrowRight, Sparkles, MessageSquare, Hash, SortAsc, Zap } from 'lucide-react';

type InputMode = 'messages' | 'tokens';
type SortMode = 'cheapest' | 'capable';

const CAPABILITY: Record<string, number> = {
  'o1': 10,
  'gpt-4': 9,
  'claude-3-opus': 9,
  'o1-mini': 8,
  'claude-3-5-sonnet': 8,
  'gpt-4o': 8,
  'gpt-4-turbo': 8,
  'claude-3-sonnet': 7,
  'gemini-1.5-pro': 7,
  'mistral-large': 7,
  'command-r-plus': 7,
  'claude-3-5-haiku': 6,
  'gemini-2.0-flash': 6,
  'gpt-4o-mini': 6,
  'o3-mini': 6,
  'mistral-medium': 6,
  'claude-3-haiku': 5,
  'mistral-small': 5,
  'command-r': 5,
  'gemini-1.5-flash': 5,
  'codestral': 5,
  'gpt-3.5-turbo': 4,
  'mistral-nemo': 4,
  'command-light': 4,
};

const PROVIDER_LABEL: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Gemini',
  mistral: 'Mistral',
  cohere: 'Cohere',
  bedrock: 'Bedrock',
  azure_openai: 'Azure',
};

export default function EstimatorPage() {
  const [inputMode, setInputMode] = useState<InputMode>('messages');
  const [wordsPerMessage, setWordsPerMessage] = useState('150');
  const [messagesPerDay, setMessagesPerDay] = useState('1000');
  const [outputRatio, setOutputRatio] = useState('30');
  const [promptTokens, setPromptTokens] = useState('1000000');
  const [completionTokens, setCompletionTokens] = useState('200000');
  const [activeProvider, setActiveProvider] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('cheapest');

  const { data: snapshots, isLoading, error, refetch } = useQuery({
    queryKey: ['price-snapshots'],
    queryFn: async () => {
      const result = await getPriceSnapshots();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });

  const { pTokens, cTokens } = useMemo(() => {
    if (inputMode === 'messages') {
      const words = parseFloat(wordsPerMessage) || 0;
      const msgs = parseFloat(messagesPerDay) || 0;
      const ratio = (parseFloat(outputRatio) || 0) / 100;
      const input = words * 1.3 * msgs * 30;
      return { pTokens: input, cTokens: input * ratio };
    }
    return { pTokens: parseFloat(promptTokens) || 0, cTokens: parseFloat(completionTokens) || 0 };
  }, [inputMode, wordsPerMessage, messagesPerDay, outputRatio, promptTokens, completionTokens]);

  const providers = useMemo(() => {
    if (!snapshots) return ['all'];
    const unique = Array.from(new Set(snapshots.map((s) => s.provider))).sort();
    return ['all', ...unique];
  }, [snapshots]);

  const results = useMemo(() => {
    if (!snapshots) return [];
    return snapshots
      .filter((s) => activeProvider === 'all' || s.provider === activeProvider)
      .map((s) => {
        const inputCost = (pTokens / 1_000_000) * Number(s.input_per_mtok);
        const outputCost = (cTokens / 1_000_000) * Number(s.output_per_mtok);
        const total = inputCost + outputCost;
        const capability = CAPABILITY[s.model] ?? 5;
        return {
          id: s.id,
          provider: s.provider,
          model: s.model,
          name: s.model_display || s.model,
          input_per_mtok: Number(s.input_per_mtok),
          output_per_mtok: Number(s.output_per_mtok),
          total,
          inputCost,
          outputCost,
          capability,
        };
      })
      .sort((a, b) =>
        sortMode === 'cheapest'
          ? a.total - b.total
          : b.capability - a.capability || a.total - b.total,
      );
  }, [snapshots, pTokens, cTokens, activeProvider, sortMode]);

  const bestValue = results[0] ?? null;

  const inputClass = 'w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all';
  const tabBase = 'px-4 py-1.5 text-xs font-medium rounded-md capitalize transition-all';
  const tabActive = 'bg-zinc-800 text-white shadow-sm';
  const tabInactive = 'text-zinc-500 hover:text-zinc-300';

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Cost Estimator" description="Compare projected costs across AI models and providers." />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Cost Estimator" description="Compare projected costs across AI models and providers." />
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Cost Estimator" description="Compare projected costs across AI models and providers." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Usage Input</h3>
            </div>

            {/* Mode toggle */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Input Mode</label>
              <div className="flex gap-1 p-1 bg-zinc-900/50 border border-zinc-800 rounded-lg w-fit">
                <button
                  onClick={() => setInputMode('messages')}
                  className={`${tabBase} flex items-center gap-1.5 ${inputMode === 'messages' ? tabActive : tabInactive}`}
                >
                  <MessageSquare className="w-3 h-3" /> By Messages
                </button>
                <button
                  onClick={() => setInputMode('tokens')}
                  className={`${tabBase} flex items-center gap-1.5 ${inputMode === 'tokens' ? tabActive : tabInactive}`}
                >
                  <Hash className="w-3 h-3" /> By Tokens
                </button>
              </div>
            </div>

            {/* Messages mode inputs */}
            {inputMode === 'messages' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Words per Message</label>
                  <input
                    type="number"
                    value={wordsPerMessage}
                    onChange={(e) => setWordsPerMessage(e.target.value)}
                    min="1"
                    className={inputClass}
                    placeholder="150"
                  />
                  <p className="text-xs text-zinc-600 mt-1">≈ {Math.round((parseFloat(wordsPerMessage) || 0) * 1.3)} tokens/message</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Messages per Day</label>
                  <input
                    type="number"
                    value={messagesPerDay}
                    onChange={(e) => setMessagesPerDay(e.target.value)}
                    min="1"
                    className={inputClass}
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Output / Input Ratio (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={outputRatio}
                      onChange={(e) => setOutputRatio(e.target.value)}
                      min="1"
                      max="500"
                      className={inputClass}
                      placeholder="30"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">%</span>
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">Output tokens as % of input (typical: 30–100%)</p>
                </div>
              </div>
            )}

            {/* Tokens mode inputs */}
            {inputMode === 'tokens' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Monthly Input Tokens</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={promptTokens}
                      onChange={(e) => setPromptTokens(e.target.value)}
                      className={inputClass}
                      placeholder="1000000"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                      {((parseFloat(promptTokens) || 0) / 1_000_000).toFixed(2)}M
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Monthly Output Tokens</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={completionTokens}
                      onChange={(e) => setCompletionTokens(e.target.value)}
                      className={inputClass}
                      placeholder="200000"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                      {((parseFloat(completionTokens) || 0) / 1_000_000).toFixed(2)}M
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Token summary */}
            <div className="pt-4 border-t border-zinc-800/50">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Monthly Estimate</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-zinc-300 tabular-nums font-mono">{(pTokens / 1_000_000).toFixed(2)}M</span>
                <span className="text-zinc-600">in</span>
                <ArrowRight className="w-3 h-3 text-zinc-700" />
                <span className="text-zinc-300 tabular-nums font-mono">{(cTokens / 1_000_000).toFixed(2)}M</span>
                <span className="text-zinc-600">out</span>
              </div>
              <p className="text-xs text-zinc-600 mt-1">tokens per month</p>
            </div>
          </div>

          {/* Sort control */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <SortAsc className="w-4 h-4 text-zinc-500" />
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Sort By</span>
            </div>
            <div className="flex gap-1 p-1 bg-zinc-900/50 border border-zinc-800 rounded-lg">
              <button
                onClick={() => setSortMode('cheapest')}
                className={`flex-1 ${tabBase} ${sortMode === 'cheapest' ? tabActive : tabInactive}`}
              >
                Cheapest
              </button>
              <button
                onClick={() => setSortMode('capable')}
                className={`flex-1 ${tabBase} flex items-center justify-center gap-1.5 ${sortMode === 'capable' ? tabActive : tabInactive}`}
              >
                <Zap className="w-3 h-3" /> Most Capable
              </button>
            </div>
          </div>

          {/* Best value card */}
          {bestValue && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-brand-600/20 to-brand-900/20 border border-brand-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <h4 className="text-sm font-medium text-brand-400">
                  {sortMode === 'cheapest' ? 'Most Cost Effective' : 'Most Capable'}
                </h4>
              </div>
              <p className="text-xs text-zinc-500 capitalize mb-1">{PROVIDER_LABEL[bestValue.provider] ?? bestValue.provider}</p>
              <p className="text-base font-semibold text-white mb-1">{bestValue.name}</p>
              <p className="text-2xl font-bold text-white tabular-nums tracking-tight">{formatCurrency(bestValue.total)}</p>
              <p className="text-xs text-zinc-500 mt-1">estimated monthly cost</p>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Provider filter tabs */}
          <div className="overflow-x-auto">
            <div className="flex gap-1 p-1 bg-zinc-900/50 border border-zinc-800 rounded-lg w-fit">
              {providers.map((p) => (
                <button
                  key={p}
                  onClick={() => setActiveProvider(p)}
                  className={`${tabBase} whitespace-nowrap ${activeProvider === p ? tabActive : tabInactive}`}
                >
                  {p === 'all' ? 'All' : (PROVIDER_LABEL[p] ?? p)}
                </button>
              ))}
            </div>
          </div>

          {/* Model cards grid */}
          {results.length === 0 ? (
            <EmptyState
              icon={<Calculator className="w-10 h-10" />}
              title="No pricing data"
              description="Run supabase db push to apply migration 006 and load model pricing."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((result, idx) => {
                const isTop = idx === 0;
                const badgeLabel = isTop
                  ? sortMode === 'cheapest' ? 'Lowest Cost' : 'Most Capable'
                  : null;

                return (
                  <div
                    key={result.id}
                    className={`glass-card p-5 flex flex-col relative hover:bg-zinc-800/30 transition-colors ${isTop ? 'ring-1 ring-brand-500/30' : ''}`}
                  >
                    {badgeLabel && (
                      <div className="absolute top-0 right-0 px-3 py-1 bg-brand-500/20 text-brand-400 rounded-bl-lg rounded-tr-lg text-xs font-medium flex items-center gap-1">
                        {sortMode === 'capable' ? <Zap className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                        {badgeLabel}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded font-medium uppercase tracking-wider">
                        {PROVIDER_LABEL[result.provider] ?? result.provider}
                      </span>
                    </div>
                    <h4 className="text-base font-medium text-zinc-200 mb-1">{result.name}</h4>
                    <p className="text-xs text-zinc-500 mb-4">
                      ${result.input_per_mtok.toFixed(3)}/1M in · ${result.output_per_mtok.toFixed(3)}/1M out
                    </p>
                    <div className="mt-auto pt-4 border-t border-zinc-800/50">
                      <span className="text-3xl tracking-tight font-bold text-white tabular-nums">
                        {formatCurrency(result.total)}
                      </span>
                      <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                        {formatCurrency(result.inputCost)}
                        <ArrowRight className="w-3 h-3 mx-0.5" />
                        {formatCurrency(result.outputCost)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
