export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function checkAuth(req: NextRequest): boolean {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

function normalizePayload(body: unknown) {
  if (Array.isArray(body)) return body;
  return [body];
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('price_snapshots')
    .select('*')
    .order('provider')
    .order('model');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ models: data });
}

export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = normalizePayload(await req.json());
  const now = new Date().toISOString();
  const records = body.map((item) => ({
    ...item,
    captured_at: now,
    is_deprecated: false,
  }));

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('price_snapshots')
    .upsert(records, { onConflict: 'provider,model' })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ updated: data?.length ?? 0, models: data });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = normalizePayload(await req.json());
  const now = new Date().toISOString();
  const records = body.map((item) => ({
    ...item,
    captured_at: now,
    is_deprecated: false,
  }));

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('price_snapshots')
    .upsert(records, { onConflict: 'provider,model' })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ created: data?.length ?? 0, models: data }, { status: 201 });
}
