'use client';

import type { ImagePricingTier } from '@/types/database';
import type { UseCaseCategory } from '@/types/api';

export type ComparisonInputMode = 'messages' | 'tokens';
export type AudioMode = 'tts' | 'stt' | 'token';
export type AudioTtsUnit = 'words' | 'characters';
export type AudioSttUnit = 'minutes' | 'hours';
export type PricingMode = 'standard' | 'batch' | 'cached';

export interface ComparisonInputState {
  inputMode: ComparisonInputMode;
  wordsPerMessage: string;
  messagesPerDay: string;
  outputRatio: string;
  monthlyInputTokens: string;
  monthlyOutputTokens: string;
  reasoningOverhead: string;
  imagesPerDay: string;
  imageQuality: string;
  imageResolution: string;
  audioMode: AudioMode;
  audioTtsUnit: AudioTtsUnit;
  audioTtsValue: string;
  audioSttUnit: AudioSttUnit;
  audioSttValue: string;
  audioTokenInput: string;
  audioTokenOutput: string;
  videoSecondsPerDay: string;
  pricingMode: PricingMode;
  includeDeprecated: boolean;
}

export const defaultComparisonInputState: ComparisonInputState = {
  inputMode: 'messages',
  wordsPerMessage: '150',
  messagesPerDay: '1000',
  outputRatio: '30',
  monthlyInputTokens: '1000000',
  monthlyOutputTokens: '200000',
  reasoningOverhead: '3',
  imagesPerDay: '20',
  imageQuality: 'standard',
  imageResolution: '1024x1024',
  audioMode: 'tts',
  audioTtsUnit: 'words',
  audioTtsValue: '5000',
  audioSttUnit: 'minutes',
  audioSttValue: '60',
  audioTokenInput: '500000',
  audioTokenOutput: '200000',
  videoSecondsPerDay: '30',
  pricingMode: 'standard',
  includeDeprecated: false,
};

interface ComparisonInputPanelProps {
  selected: UseCaseCategory;
  state: ComparisonInputState;
  onChange: (patch: Partial<ComparisonInputState>) => void;
  availableImageTiers: ImagePricingTier[];
}

function pillClass(active: boolean) {
  return [
    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
    active
      ? 'bg-zinc-800 text-white'
      : 'text-zinc-500 hover:text-zinc-200',
  ].join(' ');
}

export function ComparisonInputPanel({
  selected,
  state,
  onChange,
  availableImageTiers,
}: ComparisonInputPanelProps) {
  const inputClass = 'w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30';
  const uniqueQualities = Array.from(new Set(availableImageTiers.map((tier) => tier.quality)));
  const filteredResolutions = availableImageTiers
    .filter((tier) => tier.quality === state.imageQuality)
    .map((tier) => tier.resolution);
  const resolutions = Array.from(new Set(filteredResolutions.length > 0 ? filteredResolutions : availableImageTiers.map((tier) => tier.resolution)));

  return (
    <div className="glass-card p-6 space-y-5">
      {(selected === 'text' || selected === 'reasoning' || selected === 'code' || selected === 'embedding') && (
        <>
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Input Mode
            </label>
            <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1 w-fit">
              <button type="button" className={pillClass(state.inputMode === 'messages')} onClick={() => onChange({ inputMode: 'messages' })}>
                By Messages
              </button>
              <button type="button" className={pillClass(state.inputMode === 'tokens')} onClick={() => onChange({ inputMode: 'tokens' })}>
                By Tokens
              </button>
            </div>
          </div>

          {state.inputMode === 'messages' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Words per Message</label>
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={state.wordsPerMessage}
                  onChange={(event) => onChange({ wordsPerMessage: event.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Messages per Day</label>
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={state.messagesPerDay}
                  onChange={(event) => onChange({ messagesPerDay: event.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Output Ratio (%)</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  className={inputClass}
                  value={state.outputRatio}
                  onChange={(event) => onChange({ outputRatio: event.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Monthly Input Tokens</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={state.monthlyInputTokens}
                  onChange={(event) => onChange({ monthlyInputTokens: event.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Monthly Output Tokens</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={state.monthlyOutputTokens}
                  onChange={(event) => onChange({ monthlyOutputTokens: event.target.value })}
                />
              </div>
            </div>
          )}

          {selected === 'reasoning' && (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Reasoning Overhead ({state.reasoningOverhead}x)
              </label>
              <input
                type="range"
                min="2"
                max="10"
                step="1"
                className="w-full accent-brand-500"
                value={state.reasoningOverhead}
                onChange={(event) => onChange({ reasoningOverhead: event.target.value })}
              />
              <p className="text-xs text-zinc-600 mt-1">
                Reasoning models use hidden thinking tokens that multiply output cost.
              </p>
            </div>
          )}
        </>
      )}

      {selected === 'image' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Images per Day</label>
            <input
              type="number"
              min="0"
              className={inputClass}
              value={state.imagesPerDay}
              onChange={(event) => onChange({ imagesPerDay: event.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Quality</label>
            <select
              className={inputClass}
              value={state.imageQuality}
              onChange={(event) => onChange({ imageQuality: event.target.value })}
            >
              {(uniqueQualities.length > 0 ? uniqueQualities : ['standard']).map((quality) => (
                <option key={quality} value={quality}>{quality}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Resolution</label>
            <select
              className={inputClass}
              value={state.imageResolution}
              onChange={(event) => onChange({ imageResolution: event.target.value })}
            >
              {(resolutions.length > 0 ? resolutions : ['1024x1024']).map((resolution) => (
                <option key={resolution} value={resolution}>{resolution}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {selected === 'audio' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Audio Mode
            </label>
            <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1 w-fit">
              <button type="button" className={pillClass(state.audioMode === 'tts')} onClick={() => onChange({ audioMode: 'tts' })}>
                TTS
              </button>
              <button type="button" className={pillClass(state.audioMode === 'stt')} onClick={() => onChange({ audioMode: 'stt' })}>
                STT
              </button>
              <button type="button" className={pillClass(state.audioMode === 'token')} onClick={() => onChange({ audioMode: 'token' })}>
                Token Audio
              </button>
            </div>
          </div>

          {state.audioMode === 'tts' && (
            <>
              <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1 w-fit">
                <button type="button" className={pillClass(state.audioTtsUnit === 'words')} onClick={() => onChange({ audioTtsUnit: 'words' })}>
                  Words / day
                </button>
                <button type="button" className={pillClass(state.audioTtsUnit === 'characters')} onClick={() => onChange({ audioTtsUnit: 'characters' })}>
                  Characters / day
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  {state.audioTtsUnit === 'words' ? 'Words per Day' : 'Characters per Day'}
                </label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={state.audioTtsValue}
                  onChange={(event) => onChange({ audioTtsValue: event.target.value })}
                />
              </div>
            </>
          )}

          {state.audioMode === 'stt' && (
            <>
              <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1 w-fit">
                <button type="button" className={pillClass(state.audioSttUnit === 'minutes')} onClick={() => onChange({ audioSttUnit: 'minutes' })}>
                  Minutes / day
                </button>
                <button type="button" className={pillClass(state.audioSttUnit === 'hours')} onClick={() => onChange({ audioSttUnit: 'hours' })}>
                  Hours / day
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  {state.audioSttUnit === 'minutes' ? 'Minutes per Day' : 'Hours per Day'}
                </label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={state.audioSttValue}
                  onChange={(event) => onChange({ audioSttValue: event.target.value })}
                />
              </div>
            </>
          )}

          {state.audioMode === 'token' && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Monthly Audio Input Tokens</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={state.audioTokenInput}
                  onChange={(event) => onChange({ audioTokenInput: event.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Monthly Audio Output Tokens</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={state.audioTokenOutput}
                  onChange={(event) => onChange({ audioTokenOutput: event.target.value })}
                />
              </div>
            </>
          )}
        </div>
      )}

      {selected === 'video' && (
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">Seconds per Day</label>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={state.videoSecondsPerDay}
            onChange={(event) => onChange({ videoSecondsPerDay: event.target.value })}
          />
        </div>
      )}

      <div className="space-y-3 border-t border-zinc-800/60 pt-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Pricing Mode
          </label>
          <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1 w-fit">
            <button type="button" className={pillClass(state.pricingMode === 'standard')} onClick={() => onChange({ pricingMode: 'standard' })}>
              Standard
            </button>
            <button type="button" className={pillClass(state.pricingMode === 'batch')} onClick={() => onChange({ pricingMode: 'batch' })}>
              Batch
            </button>
            <button type="button" className={pillClass(state.pricingMode === 'cached')} onClick={() => onChange({ pricingMode: 'cached' })}>
              Cached
            </button>
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm text-zinc-300">
          <input
            type="checkbox"
            className="rounded border-zinc-700 bg-zinc-900"
            checked={state.includeDeprecated}
            onChange={(event) => onChange({ includeDeprecated: event.target.checked })}
          />
          Show deprecated models
        </label>
      </div>
    </div>
  );
}
