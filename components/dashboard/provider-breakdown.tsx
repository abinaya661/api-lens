'use client';

import { type ProviderBreakdown } from '@/lib/mock-data';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ProviderBreakdownProps {
  data: ProviderBreakdown[];
  onSelect?: (provider: string | null) => void;
  selectedProvider?: string | null;
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: 'bg-[#10a37f]', // green
  anthropic: 'bg-[#d97757]', // orange/coral
  gemini: 'bg-[#1a73e8]', // blue
  mistral: 'bg-[#f54e42]', // red
  cohere: 'bg-[#39594d]', // dark green
  bedrock: 'bg-[#ff9900]', // aws orange
  azure_openai: 'bg-[#0078d4]', // ms blue
};

const PROVIDER_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
  mistral: 'Mistral AI',
  cohere: 'Cohere',
  bedrock: 'AWS Bedrock',
  azure_openai: 'Azure OpenAI',
};

export function ProviderBreakdownList({
  data,
  onSelect,
  selectedProvider,
}: ProviderBreakdownProps) {
  return (
    <div className="glass-card p-6 h-[400px] flex flex-col animate-fade-in group">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-zinc-100 mb-1">Spend by Platform</h3>
          <p className="text-xs text-zinc-500">Distribution of costs across models</p>
        </div>
        {selectedProvider && (
          <button
            onClick={() => onSelect?.(null)}
            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-5">
        {data.map((item) => {
          const isSelected = selectedProvider === item.provider;
          const isFaded = selectedProvider && !isSelected;

          return (
            <div
              key={item.provider}
              className={cn(
                'transition-all duration-200 cursor-pointer p-2 -m-2 rounded-lg hover:bg-zinc-800/50',
                isFaded && 'opacity-40 hover:opacity-100'
              )}
              onClick={() => onSelect?.(isSelected ? null : item.provider)}
            >
              <div className="flex justify-between items-end mb-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-200">
                    {PROVIDER_NAMES[item.provider] || item.provider}
                  </span>
                  <span className="text-xs text-zinc-500 mt-0.5">
                    {item.activeKeys} active {item.activeKeys === 1 ? 'key' : 'keys'} · {item.tokens.toLocaleString()}k tokens
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-white tabular-nums">
                    {formatCurrency(item.cost)}
                  </span>
                  <span className="text-xs text-zinc-500 mt-0.5 tabular-nums">
                    {formatPercentage(item.percentage)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-800/50 rounded-full h-2 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-1000 ease-out',
                    PROVIDER_COLORS[item.provider] || 'bg-zinc-600'
                  )}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
