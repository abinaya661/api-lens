import type { PlatformAdapter } from './types';
import { OpenAIAdapter } from './adapters/openai';
import { AnthropicAdapter } from './adapters/anthropic';
import { GeminiAdapter } from './adapters/gemini';
import { MistralAdapter } from './adapters/mistral';
import { CohereAdapter } from './adapters/cohere';
import { OpenRouterAdapter } from './adapters/openrouter';
import { ElevenLabsAdapter } from './adapters/elevenlabs';
import { DeepgramAdapter } from './adapters/deepgram';
import { AssemblyAIAdapter } from './adapters/assemblyai';
import { ReplicateAdapter } from './adapters/replicate';
import { FalAdapter } from './adapters/fal';
import { AzureOpenAIAdapter } from './adapters/azure-openai';
import { BedrockAdapter } from './adapters/bedrock';
import { VertexAIAdapter } from './adapters/vertex-ai';

const adapters: Record<string, PlatformAdapter> = {
  openai: new OpenAIAdapter(),
  anthropic: new AnthropicAdapter(),
  gemini: new GeminiAdapter(),
  mistral: new MistralAdapter(),
  cohere: new CohereAdapter(),
  openrouter: new OpenRouterAdapter(),
  elevenlabs: new ElevenLabsAdapter(),
  deepgram: new DeepgramAdapter(),
  assemblyai: new AssemblyAIAdapter(),
  replicate: new ReplicateAdapter(),
  fal: new FalAdapter(),
  azure_openai: new AzureOpenAIAdapter(),
  bedrock: new BedrockAdapter(),
  vertex_ai: new VertexAIAdapter(),
};

export function getAdapter(provider: string): PlatformAdapter | null {
  return adapters[provider] ?? null;
}

export function getSupportedProviders(): string[] {
  return Object.keys(adapters);
}
