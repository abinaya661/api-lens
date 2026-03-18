'use client';

import { formatCurrency, formatPercentage } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PlatformSpendItem {
  provider: string;
  amount: number;
  percentage: number;
}

interface ProviderBreakdownProps {
  data: PlatformSpendItem[];
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: 'bg-[#10a37f]',
  anthropic: 'bg-[#d97757]',
  gemini: 'bg-[#1a73e8]',
  mistral: 'bg-[#f54e42]',
  cohere: 'bg-[#39594d]',
  bedrock: 'bg-[#ff9900]',
  azure_openai: 'bg-[#0078d4]',
  elevenlabs: 'bg-[#000000]',
  deepgram: 'bg-[#13EF93]',
  assemblyai: 'bg-[#4A90D9]',
  replicate: 'bg-[#000000]',
  fal: 'bg-[#7C3AED]',
  openrouter: 'bg-[#6366f1]',
  vertex_ai: 'bg-[#4285f4]',
};

const PROVIDER_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
  mistral: 'Mistral AI',
  cohere: 'Cohere',
  bedrock: 'AWS Bedrock',
  azure_openai: 'Azure OpenAI',
  elevenlabs: 'ElevenLabs',
  deepgram: 'Deepgram',
  assemblyai: 'AssemblyAI',
  replicate: 'Replicate',
  fal: 'Fal AI',
  openrouter: 'OpenRouter',
  vertex_ai: 'Vertex AI',
};

export function ProviderBreakdownList({ data }: ProviderBreakdownProps) {
  return (
    <div className="glass-card p-6 h-[400px] flex flex-col animate-fade-in group">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-zinc-100 mb-1">Spend by Platform</h3>
          <p className="text-xs text-zinc-500">Distribution of costs this month</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-5">
        {data.length === 0 && (
          <p className="text-sm text-zinc-500 text-center py-8">No usage data yet</p>
        )}
        {data.map((item) => (
          <div key={item.provider} className="transition-all duration-200 p-2 -m-2 rounded-lg">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-zinc-200">
                {PROVIDER_NAMES[item.provider] || item.provider}
              </span>
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-white tabular-nums">
                  {formatCurrency(item.amount)}
                </span>
                <span className="text-xs text-zinc-500 mt-0.5 tabular-nums">
                  {formatPercentage(item.percentage)}
                </span>
              </div>
            </div>
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
        ))}
      </div>
    </div>
  );
}
