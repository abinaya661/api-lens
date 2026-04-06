import type { PlatformAdapter } from './types';
import { OpenAIAdapter } from './adapters/openai';
import { AnthropicAdapter } from './adapters/anthropic';
import { GeminiAdapter } from './adapters/gemini';
import { GrokAdapter } from './adapters/grok';
import { ElevenLabsAdapter } from './adapters/elevenlabs';
import { OpenRouterAdapter } from './adapters/openrouter';

const adapters: Record<string, PlatformAdapter> = {
  openai: new OpenAIAdapter(),
  anthropic: new AnthropicAdapter(),
  gemini: new GeminiAdapter(),
  grok: new GrokAdapter(),
  elevenlabs: new ElevenLabsAdapter(),
  openrouter: new OpenRouterAdapter(),
};

export function getAdapter(provider: string): PlatformAdapter | null {
  return adapters[provider] ?? null;
}

export function getSupportedProviders(): string[] {
  return Object.keys(adapters);
}
