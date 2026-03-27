export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

function verifyAdminSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 32) {
    console.error('CRON_SECRET not configured or too short');
    return false;
  }
  return authHeader === `Bearer ${cronSecret}`;
}

// GET /api/admin/passes — list all passes with redemption counts
export async function GET(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const adminSupabase = createAdminClient();

    const { data: passes, error } = await adminSupabase
      .from('access_passes')
      .select(`
        id,
        code,
        description,
        pass_type,
        max_uses,
        current_uses,
        is_active,
        expires_at,
        created_at,
        updated_at,
        access_pass_redemptions(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ passes });
  } catch (e) {
    console.error('Admin passes GET failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/passes — toggle is_active for a pass by code
export async function PATCH(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code, is_active } = body as { code?: string; is_active?: boolean };

    if (!code || typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'Request body must include "code" (string) and "is_active" (boolean)' },
        { status: 400 },
      );
    }

    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
      .from('access_passes')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('code', code.toUpperCase().trim())
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Pass not found' }, { status: 404 });
    }

    return NextResponse.json({ pass: data });
  } catch (e) {
    console.error('Admin passes PATCH failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
