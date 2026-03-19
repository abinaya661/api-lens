import { NextRequest } from 'next/server';
import { dodo } from '@/lib/dodo/client';

function checkAuth(req: NextRequest): boolean {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req))
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const discounts = await dodo.discounts.list();
  return Response.json({ discounts });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req))
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { code, name, type, amount, max_redemptions } = await req.json() as {
    code: string;
    name: string;
    type: 'percentage' | 'flat';
    amount: number;
    max_redemptions?: number;
  };

  const discount = await dodo.discounts.create({
    name,
    code: code.toUpperCase(),
    type,
    amount,
    ...(max_redemptions != null ? { max_redemptions } : {}),
  } as Parameters<typeof dodo.discounts.create>[0]);

  return Response.json({ discount });
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req))
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { discountId } = await req.json() as { discountId: string };
  await dodo.discounts.delete(discountId);
  return Response.json({ success: true });
}
