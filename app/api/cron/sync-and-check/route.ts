import { NextRequest, NextResponse } from 'next/server';
import { syncAllKeys, checkBudgets } from '@/lib/platforms/sync-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

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
    const startTime = Date.now();

    // Step 1: Sync all active keys
    const syncStats = await syncAllKeys();

    // Step 2: Check budgets and create alerts
    const budgetResult = await checkBudgets();

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      sync: syncStats,
      budgets: budgetResult,
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
