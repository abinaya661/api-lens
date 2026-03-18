import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes max

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 32) {
    console.error('CRON_SECRET not configured or too short');
    return false;
  }
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const startTime = Date.now();

    // Phase 3 will implement:
    // Batch 1: Pattern 2 keys (OpenAI, Anthropic, Mistral, Cohere)
    // Batch 2: Pattern 3 keys (ElevenLabs, Deepgram, AssemblyAI, Replicate, Fal)
    // Batch 3: Pattern 4 keys (Gemini, Vertex AI, Azure, Bedrock)
    // After all batches: run checkBudget() for all users

    // For now, just log that cron ran successfully
    const { count } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Sync-and-check cron executed (stub)',
      active_keys: count ?? 0,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron sync-and-check failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
