import { NextRequest, NextResponse } from 'next/server';

interface DetectionResult {
  provider: string;
  confidence: 'high' | 'medium' | 'low';
  pattern: string;
}

const KEY_PATTERNS: { provider: string; regex: RegExp; confidence: 'high' | 'medium' }[] = [
  { provider: 'openai', regex: /^sk-[a-zA-Z0-9]{20,}$/, confidence: 'high' },
  { provider: 'openai', regex: /^sk-proj-[a-zA-Z0-9_-]+$/, confidence: 'high' },
  { provider: 'anthropic', regex: /^sk-ant-[a-zA-Z0-9_-]+$/, confidence: 'high' },
  { provider: 'mistral', regex: /^[a-zA-Z0-9]{32}$/, confidence: 'medium' },
  { provider: 'cohere', regex: /^[a-zA-Z0-9]{40}$/, confidence: 'medium' },
  { provider: 'openrouter', regex: /^sk-or-[a-zA-Z0-9_-]+$/, confidence: 'high' },
  { provider: 'replicate', regex: /^r8_[a-zA-Z0-9]{37}$/, confidence: 'high' },
  { provider: 'deepgram', regex: /^[a-f0-9]{40}$/, confidence: 'medium' },
  { provider: 'elevenlabs', regex: /^[a-f0-9]{32}$/, confidence: 'medium' },
  { provider: 'fal', regex: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}:[a-f0-9]+$/, confidence: 'high' },
];

function detectProvider(keyPrefix: string): DetectionResult | null {
  for (const pattern of KEY_PATTERNS) {
    if (pattern.regex.test(keyPrefix)) {
      return {
        provider: pattern.provider,
        confidence: pattern.confidence,
        pattern: pattern.regex.source,
      };
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { apiKey?: string };

    if (!body.apiKey || typeof body.apiKey !== 'string') {
      return NextResponse.json({ error: 'apiKey is required' }, { status: 400 });
    }

    // Only use the key for pattern matching — never log or store
    const result = detectProvider(body.apiKey);

    if (result) {
      return NextResponse.json({
        detected: true,
        provider: result.provider,
        confidence: result.confidence,
      });
    }

    return NextResponse.json({
      detected: false,
      provider: null,
      confidence: null,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
