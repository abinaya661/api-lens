export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { validateOrigin } from '@/lib/utils/csrf';

interface DetectionResult {
  provider: string;
  confidence: 'high' | 'medium' | 'low';
  pattern: string;
}

const KEY_PATTERNS: { provider: string; regex: RegExp; confidence: 'high' | 'medium' }[] = [
  { provider: 'openai', regex: /^sk-[a-zA-Z0-9]{20,}$/, confidence: 'high' },
  { provider: 'openai', regex: /^sk-proj-[a-zA-Z0-9_-]+$/, confidence: 'high' },
  { provider: 'anthropic', regex: /^sk-ant-[a-zA-Z0-9_-]+$/, confidence: 'high' },
  { provider: 'openrouter', regex: /^sk-or-[a-zA-Z0-9_-]+$/, confidence: 'high' },
  { provider: 'grok', regex: /^xai-[a-zA-Z0-9_-]+$/, confidence: 'high' },
  { provider: 'gemini', regex: /^AIza[a-zA-Z0-9_-]{20,}$/, confidence: 'high' },
  { provider: 'elevenlabs', regex: /^[a-f0-9]{32}$/, confidence: 'medium' },
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
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  try {
    const body = await request.json() as { apiKey?: string };

    if (!body.apiKey || typeof body.apiKey !== 'string') {
      return NextResponse.json({ error: 'apiKey is required' }, { status: 400 });
    }

    if (body.apiKey.length > 1000) {
      return NextResponse.json({ error: 'API key too long' }, { status: 400 });
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
