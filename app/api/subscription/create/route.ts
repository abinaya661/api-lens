export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { dodo } from '@/lib/dodo/client';
import { createClient } from '@/lib/supabase/server';
import { validateOrigin } from '@/lib/utils/csrf';

const EU_COUNTRIES = ['DE','FR','IT','ES','NL','BE','AT','PT','IE','FI','GR','LU','LT','LV','EE','SK','SI','CY','MT','GB'];

/**
 * Resolve the correct Dodo product ID based on user's region and chosen plan.
 * Each region has its own monthly + annual product with local-currency pricing.
 */
function getProductId(geoCountry: string, plan: 'monthly' | 'annual'): string | undefined {
  if (geoCountry === 'IN') {
    return plan === 'annual'
      ? process.env.DODO_PRODUCT_ANNUAL_IN
      : process.env.DODO_PRODUCT_MONTHLY_IN;
  }
  if (geoCountry === 'US') {
    return plan === 'annual'
      ? process.env.DODO_PRODUCT_ANNUAL_US
      : process.env.DODO_PRODUCT_MONTHLY_US;
  }
  if (geoCountry === 'CA') {
    return plan === 'annual'
      ? process.env.DODO_PRODUCT_ANNUAL_CA
      : process.env.DODO_PRODUCT_MONTHLY_CA;
  }
  if (EU_COUNTRIES.includes(geoCountry)) {
    return plan === 'annual'
      ? process.env.DODO_PRODUCT_ANNUAL_EU
      : process.env.DODO_PRODUCT_MONTHLY_EU;
  }
  // Rest of World (default)
  return plan === 'annual'
    ? process.env.DODO_PRODUCT_ANNUAL_ROW
    : process.env.DODO_PRODUCT_MONTHLY_ROW;
}

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return Response.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { plan, discountCode } = await req.json() as {
      plan: 'monthly' | 'annual';
      discountCode?: string;
    };

    if (plan !== 'monthly' && plan !== 'annual') {
      return Response.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const geoCountry = req.cookies.get('geo_country')?.value ?? '';
    const productId = getProductId(geoCountry, plan);

    if (!productId) {
      console.error('Missing Dodo product ID for region:', geoCountry, 'plan:', plan);
      return Response.json(
        { error: 'Payment configuration error. Please contact support.' },
        { status: 500 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      ...(discountCode ? { discount_code: discountCode } : {}),
      customer: {
        email: user.email!,
        name:
          (user.user_metadata?.full_name as string | undefined) ||
          user.email!.split('@')[0],
      },
      feature_flags: { allow_discount_code: true },
      return_url: `${appUrl}/subscription?payment=success`,
      metadata: {
        user_id: user.id,
        plan,
      },
    });

    const checkoutUrl = (session as { checkout_url?: string | null }).checkout_url;

    if (!checkoutUrl) {
      console.error('Dodo returned no checkout_url:', session);
      return Response.json(
        { error: 'Failed to generate checkout URL. Please try again.' },
        { status: 502 },
      );
    }

    return Response.json({ checkout_url: checkoutUrl });
  } catch (err) {
    console.error('Dodo checkout session creation failed:', err);
    const message =
      err instanceof Error ? err.message : 'Unknown payment error';
    return Response.json(
      { error: `Checkout failed: ${message}` },
      { status: 500 },
    );
  }
}
