'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared';
import { estimatorModels } from '@/lib/mock-data-estimator';
import { formatCurrency } from '@/lib/utils';
import { Calculator, ArrowRight, Sparkles } from 'lucide-react';

export default function EstimatorPage() {
  const [promptTokens, setPromptTokens] = useState('1000000');
  const [completionTokens, setCompletionTokens] = useState('200000');

  const pTokens = parseFloat(promptTokens) || 0;
  const cTokens = parseFloat(completionTokens) || 0;

  const results = useMemo(() => {
    return estimatorModels.map((model) => {
      const promptCost = (pTokens / 1_000_000) * model.prompt_cost_per_m;
      const compCost = (cTokens / 1_000_000) * model.completion_cost_per_m;
      const total = promptCost + compCost;
      return { ...model, total, promptCost, compCost };
    }).sort((a, b) => a.total - b.total);
  }, [pTokens, cTokens]);

  const bestValue = results[0];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Cost Estimator"
        description="Compare projected costs across different AI models and providers."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Estimated Usage</h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Prompt Tokens (Input)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={promptTokens}
                    onChange={(e) => setPromptTokens(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono focus:ring-2 focus:ring-brand-500/40"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                    {(pTokens / 1_000_000).toFixed(2)}M
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Completion Tokens (Output)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={completionTokens}
                    onChange={(e) => setCompletionTokens(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono focus:ring-2 focus:ring-brand-500/40"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                    {(cTokens / 1_000_000).toFixed(2)}M
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800/50">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Enter the estimated total tokens for your workload. The calculator uses current public API pricing data (Mar 2026).
                </p>
              </div>
            </div>
          </div>

          {bestValue && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-brand-600/20 to-brand-900/20 border border-brand-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <h4 className="text-sm font-medium text-brand-400">Most Cost Effective</h4>
              </div>
              <p className="text-lg font-semibold text-white mb-1">{bestValue.name}</p>
              <p className="text-2xl font-bold text-white tabular-nums tracking-tight">
                {formatCurrency(bestValue.total)}
              </p>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((result, idx) => (
              <div key={result.id} className="glass-card p-5 group flex flex-col items-start relative hover:bg-zinc-800/30 transition-colors">
                {idx === 0 && (
                  <div className="absolute top-0 right-0 p-1.5 px-3 bg-brand-500/20 text-brand-400 rounded-bl-lg rounded-tr-lg text-xs font-medium">
                    Lowest Cost
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3 w-full">
                  <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded font-medium uppercase tracking-wider">
                    {result.provider}
                  </span>
                  <span className="bg-zinc-800/50 text-zinc-500 text-[10px] px-2 py-0.5 rounded font-medium">
                    {result.context_window} ctx
                  </span>
                </div>
                
                <h4 className="text-base font-medium text-zinc-200 mb-4">{result.name}</h4>
                
                <div className="mt-auto w-full pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-3xl tracking-tight font-bold text-white tabular-nums">
                      {formatCurrency(result.total)}
                    </span>
                    <span className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                      {formatCurrency(result.promptCost)} <ArrowRight className="w-3 h-3 mx-0.5" /> {formatCurrency(result.compCost)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
