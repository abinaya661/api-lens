'use client';

import { Pin, Sparkles, TriangleAlert } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface ModelComparisonResult {
  id: string;
  provider: string;
  model: string;
  name: string;
  capability: number;
  estimatedMonthlyCost: number | null;
  pricingSummary: string;
  compatibilityNote: string | null;
  isPinned: boolean;
  isDeprecated: boolean;
  supportsBatch: boolean;
  supportsCaching: boolean;
}

interface ModelCardProps {
  model: ModelComparisonResult;
  onTogglePin: (modelId: string) => void;
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Gemini',
  grok: 'Grok',
  deepseek: 'DeepSeek',
  moonshot: 'Moonshot',
  elevenlabs: 'ElevenLabs',
};

export function ModelCard({ model, onTogglePin }: ModelCardProps) {
  return (
    <div
      className={[
        'glass-card p-5 flex flex-col gap-4 transition-colors hover:bg-zinc-800/30',
        model.isPinned ? 'ring-1 ring-amber-500/30' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              {PROVIDER_LABELS[model.provider] ?? model.provider}
            </span>
            <span className="rounded-full bg-brand-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-brand-300">
              Capability {model.capability}/10
            </span>
            {model.isDeprecated && (
              <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-amber-300">
                Deprecated
              </span>
            )}
          </div>
          <div>
            <h4 className="text-base font-semibold text-zinc-100">{model.name}</h4>
            <p className="text-xs text-zinc-500 mt-1">{model.pricingSummary}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onTogglePin(model.id)}
          className={[
            'inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
            model.isPinned
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
              : 'border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:text-zinc-200',
          ].join(' ')}
          aria-label={model.isPinned ? 'Unpin model' : 'Pin model'}
        >
          <Pin className="w-4 h-4" />
        </button>
      </div>

      <div className="border-t border-zinc-800/60 pt-4">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1">
          Estimated Monthly Cost
        </p>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-bold tracking-tight text-white tabular-nums">
              {model.estimatedMonthlyCost != null ? formatCurrency(model.estimatedMonthlyCost) : 'N/A'}
            </p>
            {model.compatibilityNote ? (
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-500">
                <TriangleAlert className="w-3 h-3" />
                {model.compatibilityNote}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-1 text-[11px] text-zinc-500">
            {model.supportsBatch && (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2 py-1">
                <Sparkles className="w-3 h-3" />
                Batch
              </span>
            )}
            {model.supportsCaching && (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2 py-1">
                <Sparkles className="w-3 h-3" />
                Cached
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
