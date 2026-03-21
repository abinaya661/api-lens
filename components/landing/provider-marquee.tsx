'use client';

import { RevealOnScroll } from './reveal-on-scroll';

const PROVIDERS = [
  { name: 'OpenAI', color: '#10a37f' },
  { name: 'Anthropic', color: '#d97757' },
  { name: 'Google Gemini', color: '#1a73e8' },
  { name: 'AWS Bedrock', color: '#ff9900' },
  { name: 'Mistral AI', color: '#f54e42' },
  { name: 'Cohere', color: '#39594d' },
  { name: 'Azure OpenAI', color: '#0078d4' },
  { name: 'ElevenLabs', color: '#ffffff' },
  { name: 'Deepgram', color: '#13ef93' },
  { name: 'AssemblyAI', color: '#ff6b6b' },
  { name: 'Replicate', color: '#bc5090' },
  { name: 'Fal.ai', color: '#8b5cf6' },
  { name: 'OpenRouter', color: '#6366f1' },
  { name: 'Vertex AI', color: '#4285f4' },
];

function ProviderBadge({ name, color }: { name: string; color: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 rounded-full border border-zinc-800 bg-zinc-900/50 whitespace-nowrap flex-shrink-0">
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm font-medium text-zinc-300">{name}</span>
    </div>
  );
}

export function ProviderMarquee() {
  return (
    <section className="py-20 px-6 border-t border-zinc-800 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <RevealOnScroll>
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            14 Providers. One Dashboard.
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-xl mx-auto">
            Connect every major AI provider and see all your spend in a single view.
          </p>
        </RevealOnScroll>
      </div>

      {/* Marquee container */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#09090b] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#09090b] to-transparent z-10 pointer-events-none" />

        <div className="flex gap-4 marquee-track" style={{ width: 'max-content' }}>
          {/* First set */}
          {PROVIDERS.map((p) => (
            <ProviderBadge key={`a-${p.name}`} name={p.name} color={p.color} />
          ))}
          {/* Duplicate for seamless loop */}
          {PROVIDERS.map((p) => (
            <ProviderBadge key={`b-${p.name}`} name={p.name} color={p.color} />
          ))}
        </div>
      </div>
    </section>
  );
}
