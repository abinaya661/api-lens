'use client';

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ErrorState, SkeletonCard } from '@/components/shared';
import { usePriceSnapshots } from '@/hooks/use-estimator';
import { calculateCost, calculateCostWithBatch, calculateCostWithCache } from '@/lib/pricing';
import { formatCurrency } from '@/lib/utils';
import type { ImagePricingTier, PriceSnapshot } from '@/types/database';
import type { UseCaseCategory } from '@/types/api';
import {
  ComparisonInputPanel,
  defaultComparisonInputState,
  type ComparisonInputState,
} from './comparison-input-panel';
import { ModelComparisonGrid } from './model-comparison-grid';
import { UseCaseSelector } from './use-case-selector';

type SortMode = 'cheapest' | 'capable' | 'value';

const DEFAULT_CATEGORY: UseCaseCategory = 'text';
const DEFAULT_PROVIDER = 'all';
const DEFAULT_SORT_MODE: SortMode = 'cheapest';
const USE_CASE_CATEGORIES: readonly UseCaseCategory[] = [
  'text',
  'reasoning',
  'image',
  'audio',
  'video',
  'code',
  'embedding',
];

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Gemini',
  grok: 'Grok',
  elevenlabs: 'ElevenLabs',
  openrouter: 'OpenRouter',
};

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getSelectedCategory(value: string | null): UseCaseCategory {
  if (value && USE_CASE_CATEGORIES.includes(value as UseCaseCategory)) {
    return value as UseCaseCategory;
  }

  return DEFAULT_CATEGORY;
}

function getSortMode(value: string | null): SortMode {
  if (value === 'capable' || value === 'value') {
    return value;
  }

  return DEFAULT_SORT_MODE;
}

function getTokenVolume(state: ComparisonInputState, category: UseCaseCategory) {
  if (state.inputMode === 'tokens') {
    const inputTokens = parseNumber(state.monthlyInputTokens);
    let outputTokens = parseNumber(state.monthlyOutputTokens);
    if (category === 'reasoning') {
      outputTokens *= parseNumber(state.reasoningOverhead) || 1;
    }
    return { inputTokens, outputTokens };
  }

  const wordsPerMessage = parseNumber(state.wordsPerMessage);
  const messagesPerDay = parseNumber(state.messagesPerDay);
  const outputRatio = parseNumber(state.outputRatio) / 100;
  const inputTokens = wordsPerMessage * 1.3 * messagesPerDay * 30;
  let outputTokens = inputTokens * outputRatio;

  if (category === 'reasoning') {
    outputTokens *= parseNumber(state.reasoningOverhead) || 1;
  }

  return { inputTokens, outputTokens };
}

function getAudioTokenVolume(state: ComparisonInputState) {
  return {
    inputTokens: parseNumber(state.audioTokenInput),
    outputTokens: parseNumber(state.audioTokenOutput),
  };
}

function normalizeImageTiers(snapshot: PriceSnapshot): ImagePricingTier[] {
  if (!Array.isArray(snapshot.image_prices)) return [];
  return snapshot.image_prices.map((tier) => ({
    quality: tier.quality,
    resolution: tier.resolution,
    price: Number(tier.price),
  }));
}

function getPricingSummary(snapshot: PriceSnapshot) {
  if (snapshot.unit_type === 'tokens') {
    return `$${Number(snapshot.input_per_mtok).toFixed(3)}/1M in | $${Number(snapshot.output_per_mtok).toFixed(3)}/1M out`;
  }

  if (snapshot.unit_type === 'characters') {
    return `$${Number(snapshot.input_per_mtok).toFixed(2)}/1M characters`;
  }

  if (snapshot.unit_type === 'minutes') {
    return `$${Number(snapshot.per_unit_price ?? 0).toFixed(4)} / minute`;
  }

  if (snapshot.unit_type === 'seconds') {
    return `$${Number(snapshot.per_unit_price ?? 0).toFixed(3)} / second`;
  }

  if (snapshot.unit_type === 'images') {
    const tierCount = normalizeImageTiers(snapshot).length;
    return tierCount > 0
      ? `${tierCount} image tier${tierCount > 1 ? 's' : ''}`
      : `$${Number(snapshot.per_unit_price ?? 0).toFixed(3)} / image`;
  }

  return snapshot.unit_display;
}

function calculateTokenCost(
  snapshot: PriceSnapshot,
  inputTokens: number,
  outputTokens: number,
  pricingMode: ComparisonInputState['pricingMode'],
) {
  if (pricingMode === 'batch' && snapshot.supports_batch) {
    return calculateCostWithBatch(inputTokens, outputTokens, snapshot);
  }

  if (pricingMode === 'cached' && snapshot.supports_caching) {
    return calculateCostWithCache(inputTokens, outputTokens, snapshot);
  }

  return calculateCost(inputTokens, outputTokens, snapshot);
}

function calculateModelCost(
  snapshot: PriceSnapshot,
  state: ComparisonInputState,
  category: UseCaseCategory,
) {
  if (snapshot.unit_type === 'tokens') {
    const tokenVolume = category === 'audio'
      ? getAudioTokenVolume(state)
      : getTokenVolume(state, category);

    return {
      cost: calculateTokenCost(snapshot, tokenVolume.inputTokens, tokenVolume.outputTokens, state.pricingMode),
      note: null,
    };
  }

  if (category === 'image') {
    const monthlyImages = parseNumber(state.imagesPerDay) * 30;
    const tiers = normalizeImageTiers(snapshot);
    const exactTier = tiers.find(
      (tier) => tier.quality === state.imageQuality && tier.resolution === state.imageResolution,
    );
    const fallbackTier = exactTier ?? tiers[0];
    const pricePerImage = Number(fallbackTier?.price ?? snapshot.per_unit_price ?? 0);

    return {
      cost: monthlyImages * pricePerImage,
      note: null,
    };
  }

  if (category === 'audio') {
    if (snapshot.unit_type === 'characters') {
      if (state.audioMode !== 'tts') {
        return { cost: null, note: 'Switch to TTS mode to compare this model.' };
      }

      const rawValue = parseNumber(state.audioTtsValue);
      const monthlyCharacters = state.audioTtsUnit === 'words'
        ? rawValue * 5 * 30
        : rawValue * 30;

      return {
        cost: (monthlyCharacters / 1_000_000) * Number(snapshot.input_per_mtok),
        note: null,
      };
    }

    if (snapshot.unit_type === 'minutes') {
      if (state.audioMode !== 'stt') {
        return { cost: null, note: 'Switch to STT mode to compare this model.' };
      }

      const rawValue = parseNumber(state.audioSttValue);
      const minutesPerDay = state.audioSttUnit === 'hours' ? rawValue * 60 : rawValue;

      return {
        cost: minutesPerDay * 30 * Number(snapshot.per_unit_price ?? 0),
        note: null,
      };
    }

    return { cost: null, note: 'Switch to token audio mode to compare this model.' };
  }

  if (category === 'video') {
    const monthlySeconds = parseNumber(state.videoSecondsPerDay) * 30;
    return {
      cost: monthlySeconds * Number(snapshot.per_unit_price ?? 0),
      note: null,
    };
  }

  return { cost: null, note: 'Unsupported pricing format for this mode.' };
}

export function CompareTab() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pinnedModels, setPinnedModels] = useState<string[]>([]);
  const [inputState, setInputState] = useState<ComparisonInputState>(defaultComparisonInputState);

  const selectedCategory = getSelectedCategory(searchParams.get('category'));
  const sortMode = getSortMode(searchParams.get('sort'));
  const rawProvider = searchParams.get('provider') ?? DEFAULT_PROVIDER;

  const { data: snapshots, isLoading, error, refetch } = usePriceSnapshots(
    selectedCategory,
    inputState.includeDeprecated,
  );

  const deferredSnapshots = useDeferredValue(snapshots ?? []);

  function updateSearchState(updates: Record<string, string | null>) {
    const nextParams = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (!value) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    }

    const nextQuery = nextParams.toString();

    startTransition(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    });
  }

  const availableImageTiers = useMemo(() => {
    const tiers = deferredSnapshots.flatMap((snapshot) => normalizeImageTiers(snapshot));
    const unique = new Map<string, ImagePricingTier>();

    for (const tier of tiers) {
      unique.set(`${tier.quality}::${tier.resolution}`, tier);
    }

    return Array.from(unique.values());
  }, [deferredSnapshots]);

  useEffect(() => {
    if (selectedCategory !== 'image' || availableImageTiers.length === 0) return;

    const hasCurrentTier = availableImageTiers.some(
      (tier) => tier.quality === inputState.imageQuality && tier.resolution === inputState.imageResolution,
    );

    if (!hasCurrentTier) {
      const firstTier = availableImageTiers[0];
      if (!firstTier) return;

      setInputState((current) => ({
        ...current,
        imageQuality: firstTier.quality,
        imageResolution: firstTier.resolution,
      }));
    }
  }, [availableImageTiers, inputState.imageQuality, inputState.imageResolution, selectedCategory]);

  const providers = useMemo(() => {
    const uniqueProviders = Array.from(new Set(deferredSnapshots.map((snapshot) => snapshot.provider)));
    return [DEFAULT_PROVIDER, ...uniqueProviders];
  }, [deferredSnapshots]);

  const activeProvider = providers.includes(rawProvider) ? rawProvider : DEFAULT_PROVIDER;

  const results = useMemo(() => {
    const filtered = deferredSnapshots.filter(
      (snapshot) => activeProvider === DEFAULT_PROVIDER || snapshot.provider === activeProvider,
    );

    const mapped = filtered.map((snapshot) => {
      const pricing = calculateModelCost(snapshot, inputState, selectedCategory);
      const cost = pricing.cost != null ? Math.round(pricing.cost * 100) / 100 : null;
      const valueScore = cost && cost > 0 ? snapshot.capability_score / cost : -1;

      return {
        id: snapshot.id,
        provider: snapshot.provider,
        model: snapshot.model,
        name: snapshot.model_display || snapshot.model,
        capability: snapshot.capability_score,
        estimatedMonthlyCost: cost,
        pricingSummary: getPricingSummary(snapshot),
        compatibilityNote: pricing.note,
        isPinned: pinnedModels.includes(snapshot.id),
        isDeprecated: snapshot.is_deprecated,
        supportsBatch: snapshot.supports_batch,
        supportsCaching: Boolean(snapshot.supports_caching),
        sortValue: valueScore,
      };
    });

    const withPinned = [...mapped].sort((left, right) => {
      if (left.isPinned !== right.isPinned) return left.isPinned ? -1 : 1;

      if (sortMode === 'capable') {
        if (right.capability !== left.capability) return right.capability - left.capability;
        if (left.estimatedMonthlyCost == null) return 1;
        if (right.estimatedMonthlyCost == null) return -1;
        return left.estimatedMonthlyCost - right.estimatedMonthlyCost;
      }

      if (sortMode === 'value' && right.sortValue !== left.sortValue) {
        return right.sortValue - left.sortValue;
      }

      if (left.estimatedMonthlyCost == null) return 1;
      if (right.estimatedMonthlyCost == null) return -1;
      return left.estimatedMonthlyCost - right.estimatedMonthlyCost;
    });

    return withPinned.map(({ sortValue: _sortValue, ...model }) => model);
  }, [activeProvider, deferredSnapshots, inputState, pinnedModels, selectedCategory, sortMode]);

  const bestRecommendation = results.find((result) => result.estimatedMonthlyCost != null) ?? null;

  function updateInputState(patch: Partial<ComparisonInputState>) {
    setInputState((current) => ({ ...current, ...patch }));
  }

  function togglePin(modelId: string) {
    setPinnedModels((current) => (
      current.includes(modelId)
        ? current.filter((id) => id !== modelId)
        : [...current, modelId]
    ));
  }

  function handleCategoryChange(nextCategory: UseCaseCategory) {
    updateSearchState({
      category: nextCategory === DEFAULT_CATEGORY ? null : nextCategory,
      provider: null,
    });
  }

  function handleProviderChange(nextProvider: string) {
    updateSearchState({
      provider: nextProvider === DEFAULT_PROVIDER ? null : nextProvider,
    });
  }

  function handleSortChange(nextSort: SortMode) {
    updateSearchState({
      sort: nextSort === DEFAULT_SORT_MODE ? null : nextSort,
    });
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:col-span-2">
          {Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4">
        <div className="glass-card space-y-5 p-6">
          <UseCaseSelector selected={selectedCategory} onSelect={handleCategoryChange} />
          <ComparisonInputPanel
            selected={selectedCategory}
            state={inputState}
            onChange={updateInputState}
            availableImageTiers={availableImageTiers}
          />
        </div>

        <div className="glass-card space-y-3 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Sort By</p>
          <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
            {(['cheapest', 'capable', 'value'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={sortMode === mode}
                onClick={() => handleSortChange(mode)}
                className={[
                  'flex-1 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                  sortMode === mode ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-200',
                ].join(' ')}
              >
                {mode === 'value' ? 'Best Value' : mode}
              </button>
            ))}
          </div>
        </div>

        {bestRecommendation && (
          <div className="rounded-xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 to-zinc-950 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-brand-300">
              Best Match
            </p>
            <h4 className="mt-2 text-lg font-semibold text-white">{bestRecommendation.name}</h4>
            <p className="mt-1 text-sm text-zinc-500">
              {PROVIDER_LABELS[bestRecommendation.provider] ?? bestRecommendation.provider}
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-white">
              {bestRecommendation.estimatedMonthlyCost != null
                ? formatCurrency(bestRecommendation.estimatedMonthlyCost)
                : 'N/A'}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4 lg:col-span-2">
        <div className="overflow-x-auto">
          <div className="flex w-fit gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
            {providers.map((provider) => (
              <button
                key={provider}
                type="button"
                aria-pressed={activeProvider === provider}
                onClick={() => handleProviderChange(provider)}
                className={[
                  'whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  activeProvider === provider
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-500 hover:text-zinc-200',
                ].join(' ')}
              >
                {provider === DEFAULT_PROVIDER ? 'All Providers' : (PROVIDER_LABELS[provider] ?? provider)}
              </button>
            ))}
          </div>
        </div>

        <ModelComparisonGrid models={results} onTogglePin={togglePin} />
      </div>
    </div>
  );
}
