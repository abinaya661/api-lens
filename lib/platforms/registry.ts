import type { PlatformAdapter } from './types';
import { OpenAIAdapter } from './adapters/openai';
import { AnthropicAdapter } from './adapters/anthropic';
import { GeminiAdapter } from './adapters/gemini';
import { GrokAdapter } from './adapters/grok';
import { AzureOpenAIAdapter } from './adapters/azure-openai';
import { MoonshotAdapter } from './adapters/moonshot';
import { DeepSeekAdapter } from './adapters/deepseek';
import { ElevenLabsAdapter } from './adapters/elevenlabs';
import { OpenRouterAdapter } from './adapters/openrouter';

const adapters: Record<string, PlatformAdapter> = {
  openai: new OpenAIAdapter(),
  anthropic: new AnthropicAdapter(),
  gemini: new GeminiAdapter(),
  grok: new GrokAdapter(),
  azure_openai: new AzureOpenAIAdapter(),
  moonshot: new MoonshotAdapter(),
  deepseek: new DeepSeekAdapter(),
  elevenlabs: new ElevenLabsAdapter(),
  openrouter: new OpenRouterAdapter(),
};

export function getAdapter(provider: string): PlatformAdapter | null {
  return adapters[provider] ?? null;
}

export function getSupportedProviders(): string[] {
  return Object.keys(adapters);
}
