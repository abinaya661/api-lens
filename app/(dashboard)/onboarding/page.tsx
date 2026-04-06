'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import { useAddKey } from '@/hooks/use-keys';
import { useCreateBudget } from '@/hooks/use-budgets';
import type { Provider } from '@/types/providers';
import {
  Sparkles,
  Key,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Check,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'grok', label: 'Grok' },
  { value: 'azure_openai', label: 'Microsoft Azure' },
  { value: 'moonshot', label: 'Moonshot' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'elevenlabs', label: 'ElevenLabs' },
  { value: 'openrouter', label: 'OpenRouter' },
];

const STEPS = [
  { label: 'Welcome', icon: Sparkles },
  { label: 'Add Key', icon: Key },
  { label: 'Budget', icon: DollarSign },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const addKey = useAddKey();
  const createBudget = useCreateBudget();

  const [step, setStep] = useState(0);

  // Key form
  const [provider, setProvider] = useState<Provider>('openai');
  const [nickname, setNickname] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Budget form
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState<'monthly' | 'weekly'>('monthly');

  // Track what was completed
  const [keyAdded, setKeyAdded] = useState(false);
  const [budgetCreated, setBudgetCreated] = useState(false);

  const keyPrefixError = useMemo(() => {
    if (!apiKey) return null;
    if (provider === 'openai' && apiKey.length > 5 && !apiKey.startsWith('sk-admin-'))
      return 'OpenAI keys must start with sk-admin-...';
    if (provider === 'anthropic' && apiKey.length > 10 && !apiKey.startsWith('sk-ant-admin'))
      return 'Anthropic keys must start with sk-ant-admin...';
    if (provider === 'gemini' && apiKey.length > 4 && !apiKey.startsWith('AIza'))
      return 'Gemini keys typically start with AIza...';
    if (provider === 'grok' && apiKey.length > 4 && !apiKey.startsWith('xai-'))
      return 'Grok keys typically start with xai-...';
    if (provider === 'openrouter' && apiKey.length > 5 && !apiKey.startsWith('sk-or-'))
      return 'OpenRouter keys typically start with sk-or-...';
    return null;
  }, [provider, apiKey]);

  // Redirect if already onboarded
  useEffect(() => {
    if (profile?.onboarded) {
      router.replace('/dashboard');
    }
  }, [profile, router]);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (profile?.onboarded) return null;

  const userName = profile?.full_name || 'there';

  function handleAddKey() {
    if (!nickname.trim() || !apiKey.trim()) return;
    addKey.mutate(
      { provider, nickname, api_key: apiKey },
      {
        onSuccess: () => {
          setKeyAdded(true);
          setStep(2);
        },
      },
    );
  }

  function handleCreateBudget() {
    const amount = parseFloat(budgetAmount);
    if (!amount || amount <= 0) return;
    createBudget.mutate(
      {
        scope: 'global' as const,
        amount_usd: amount,
        period: budgetPeriod,
        alert_50: true,
        alert_75: true,
        alert_90: true,
        alert_100: true,
      },
      {
        onSuccess: () => {
          setBudgetCreated(true);
          handleFinish();
        },
      },
    );
  }

  function handleFinish() {
    updateProfile.mutate(
      { onboarded: true },
      { onSuccess: () => router.push('/dashboard') },
    );
  }

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center min-h-[70vh] px-4">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={s.label} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`w-10 h-px ${
                    isDone ? 'bg-brand-500' : 'bg-zinc-800'
                  }`}
                />
              )}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600/15 text-brand-400 border border-brand-600/30'
                    : isDone
                      ? 'bg-brand-600/10 text-brand-500 border border-brand-600/20'
                      : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                }`}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="glass-card w-full max-w-lg p-8">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center space-y-5">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600/15 border border-brand-600/25 mx-auto">
              <Sparkles className="w-7 h-7 text-brand-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome to API Lens, {userName}!
              </h1>
              <p className="text-zinc-400 mt-2 text-sm leading-relaxed max-w-sm mx-auto">
                Track, analyze, and optimize your AI API costs across every provider
                — all from one dashboard. Let&apos;s get you set up in under a minute.
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
            >
              Get Started
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 1: Add Key */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Add Your First API Key
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                Connect a provider so we can start tracking your usage. Keys are
                encrypted with AES-256-GCM.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as Provider)}
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Nickname
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. GPT-4o Production"
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-2.5 pr-10 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                  >
                    {showKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {keyPrefixError && (
                  <p className="text-xs text-yellow-400 mt-1.5">{keyPrefixError}</p>
                )}
              </div>

              {provider === 'openai' && (
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-xs text-emerald-400 font-medium mb-1">Admin API Key Required</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    API Lens needs an <strong>Admin API Key</strong> (starts with <code className="text-zinc-300">sk-admin-...</code>).
                    Only organization owners can create these.
                  </p>
                  <a href="https://platform.openai.com/settings/organization/api-keys"
                     target="_blank" rel="noopener noreferrer"
                     className="text-[11px] text-emerald-400 hover:underline mt-1 inline-block">
                    Create admin key on OpenAI &rarr;
                  </a>
                </div>
              )}
              {provider === 'anthropic' && (
                <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                  <p className="text-xs text-orange-400 font-medium mb-1">Admin API Key Required</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    API Lens needs an <strong>Admin API Key</strong> (starts with <code className="text-zinc-300">sk-ant-admin...</code>).
                    Only organization admins can create these.
                  </p>
                  <a href="https://console.anthropic.com/settings/api-keys"
                     target="_blank" rel="noopener noreferrer"
                     className="text-[11px] text-orange-400 hover:underline mt-1 inline-block">
                    Create admin key on Anthropic &rarr;
                  </a>
                </div>
              )}
              {provider === 'gemini' && (
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <p className="text-xs text-blue-400 font-medium mb-1">Validation Only</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Google AI Studio does not expose a usage or billing API.
                    This key will be validated and stored, but automated usage tracking is not available.
                  </p>
                </div>
              )}
              {provider === 'grok' && (
                <div className="p-3 rounded-lg bg-slate-500/5 border border-slate-500/20">
                  <p className="text-xs text-slate-400 font-medium mb-1">Validation Only</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    xAI does not yet offer a public usage or billing API.
                    This key will be validated and stored, but automated usage tracking is not available.
                  </p>
                </div>
              )}
              {provider === 'openrouter' && (
                <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
                  <p className="text-xs text-indigo-400 font-medium mb-1">Usage Tracking Available</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    OpenRouter provides per-model cost and token breakdown via generation history.
                    Your standard API key is all that&apos;s needed.
                  </p>
                </div>
              )}
              {provider === 'deepseek' && (
                <div className="p-3 rounded-lg bg-teal-500/5 border border-teal-500/20">
                  <p className="text-xs text-teal-400 font-medium mb-1">Balance Tracking</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    DeepSeek provides aggregate balance data. Per-model breakdown is not available.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(0)}
                className="flex items-center gap-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleAddKey}
                disabled={
                  !nickname.trim() || !apiKey.trim() || addKey.isPending || !!keyPrefixError
                }
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {addKey.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    Add Key & Continue
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Step 2: Budget */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Set a Monthly Budget
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                Optional — set a spending limit and we&apos;ll alert you at 50%, 75%,
                90%, and 100% thresholds.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Budget Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder="100"
                    className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Period
                </label>
                <div className="flex gap-2">
                  {(['monthly', 'weekly'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setBudgetPeriod(p)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all border ${
                        budgetPeriod === p
                          ? 'bg-brand-600/10 text-brand-400 border-brand-600/30'
                          : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              {budgetAmount && parseFloat(budgetAmount) > 0 ? (
                <button
                  onClick={handleCreateBudget}
                  disabled={createBudget.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createBudget.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Set Budget & Finish
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={updateProfile.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateProfile.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Finishing...
                    </>
                  ) : (
                    <>
                      Go to Dashboard
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>

            {budgetAmount && parseFloat(budgetAmount) > 0 && (
              <button
                onClick={handleFinish}
                disabled={updateProfile.isPending}
                className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Skip budget & go to dashboard
              </button>
            )}
          </div>
        )}
      </div>

      {/* Completion badges */}
      {(keyAdded || budgetCreated) && (
        <div className="flex items-center gap-3 mt-6">
          {keyAdded && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
              <Check className="w-3 h-3" />
              Key added
            </span>
          )}
          {budgetCreated && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
              <Check className="w-3 h-3" />
              Budget set
            </span>
          )}
        </div>
      )}
    </div>
  );
}
