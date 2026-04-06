import { NextRequest, NextResponse } from 'next/server';
import { syncAllKeys, syncManagedKeys, checkBudgets } from '@/lib/platforms/sync-engine';
import { verifyCronAuth } from '@/lib/api/verify-cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'), process.env.CRON_SECRET ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startTime = Date.now();

    // Step 1: Sync all active keys
    const syncStats = await syncAllKeys();

    // Step 2: Sync managed keys inventory (admin keys only)
    const managedKeyStats = await syncManagedKeys();

    // Step 3: Check budgets and create alerts
    const budgetResult = await checkBudgets();

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      sync: syncStats,
      managed_keys: managedKeyStats,
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
