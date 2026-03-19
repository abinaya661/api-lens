import { NextRequest } from 'next/server';
import { dodo } from '@/lib/dodo/client';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { plan, discountCode } = await req.json() as {
    plan: 'monthly' | 'annual';
    discountCode?: string;
  };

  const productId =
    plan === 'annual'
      ? process.env.NEXT_PUBLIC_DODO_PRODUCT_ANNUAL!
      : process.env.NEXT_PUBLIC_DODO_PRODUCT_MONTHLY!;

  const session = await dodo.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: {
      email: user.email!,
      name:
        (user.user_metadata?.full_name as string | undefined) ||
        user.email!.split('@')[0],
    },
    ...(discountCode ? { discount_code: discountCode } : {}),
    feature_flags: { allow_discount_code: true },
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=true`,
    metadata: {
      user_id: user.id,
      plan,
    },
  } as Parameters<typeof dodo.checkoutSessions.create>[0]);

  return Response.json({ checkout_url: (session as { checkout_url: string }).checkout_url });
}
