import { Provider } from '@/types/providers';

export const PROVIDER_NAMES: Record<Provider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Gemini',
  grok: 'Grok',
  azure_openai: 'Microsoft Azure',
  moonshot: 'Moonshot',
  deepseek: 'DeepSeek',
  elevenlabs: 'ElevenLabs',
  openrouter: 'OpenRouter',
};

/**
 * Providers available for new key creation.
 * Ordered as displayed in the Add Key dropdown.
 */
export const ADD_KEY_PROVIDERS: { id: Provider; name: string }[] = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'gemini', name: 'Gemini' },
  { id: 'grok', name: 'Grok' },
  { id: 'azure_openai', name: 'Microsoft Azure' },
  { id: 'moonshot', name: 'Moonshot' },
  { id: 'deepseek', name: 'DeepSeek' },
  { id: 'elevenlabs', name: 'ElevenLabs' },
  { id: 'openrouter', name: 'OpenRouter' },
];

export const PROVIDER_COLORS: Record<Provider, string> = {
  openai: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  anthropic: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  gemini: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  grok: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  azure_openai: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  moonshot: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  deepseek: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  elevenlabs: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  openrouter: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};
