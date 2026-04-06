'use client';

import { RevealOnScroll } from './reveal-on-scroll';

const PROVIDERS = [
  { name: 'OpenAI', type: 'clean', color: 'text-white' },
  { name: 'Anthropic', type: 'serif', color: 'text-[#d97757]' },
  { name: 'Google Gemini', type: 'gradient', from: 'from-blue-400', to: 'to-indigo-400' },
  { name: 'Grok', type: 'heavy', color: 'text-zinc-100' },
  { name: 'ElevenLabs', type: 'clean', color: 'text-zinc-300' },
  { name: 'OpenRouter', type: 'gradient', from: 'from-[#6366f1]', to: 'to-[#a855f7]' },
];

function ProviderBadge({ provider }: { provider: { name: string; type: string; color?: string; from?: string; to?: string } }) {
  const getLogoStyle = () => {
    if (provider.type === 'gradient') return `font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${provider.from} ${provider.to}`;
    if (provider.type === 'serif') return `font-serif font-semibold tracking-wide ${provider.color}`;
    if (provider.type === 'mono') return `font-mono font-bold tracking-tighter uppercase ${provider.color}`;
    if (provider.type === 'heavy') return `font-black tracking-tighter ${provider.color}`;
    if (provider.type === 'bold') return `font-extrabold tracking-tight ${provider.color}`;
    return `font-bold tracking-tight ${provider.color}`;
  };

  return (
    <div className="flex items-center justify-center px-10 py-6 mx-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-sm whitespace-nowrap overflow-hidden group hover:border-zinc-700 transition-colors">
      <span className={`text-2xl md:text-3xl ${getLogoStyle()} opacity-60 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0`}>
        {provider.name}
      </span>
    </div>
  );
}

export function ProviderMarquee() {
  return (
    <section className="py-16 px-6 border-t border-zinc-800 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <RevealOnScroll>
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            All your providers. One Dashboard.
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-xl mx-auto">
            Connect every major AI provider and see all your spend in a single view.
          </p>
        </RevealOnScroll>
      </div>

      {/* Marquee container */}
      <div className="relative w-full">
        {/* Fade edges completely removed per user request for clear scrolling boundaries */}
        <div className="flex marquee-track" style={{ width: 'max-content' }}>
          {/* First set */}
          {PROVIDERS.map((p) => (
            <ProviderBadge key={`a-${p.name}`} provider={p} />
          ))}
          {/* Duplicate for seamless loop */}
          {PROVIDERS.map((p) => (
            <ProviderBadge key={`b-${p.name}`} provider={p} />
          ))}
          {/* Triplicate for ultra-wide monitors */}
          {PROVIDERS.map((p) => (
            <ProviderBadge key={`c-${p.name}`} provider={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
