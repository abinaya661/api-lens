import { NextRequest } from 'next/server';
import { dodo } from '@/lib/dodo/client';
import { createClient } from '@/lib/supabase/server';
import { validateOrigin } from '@/lib/utils/csrf';

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

    // Detect user's region from geo cookie to select correct product + currency
    const geoCountry = req.cookies.get('geo_country')?.value ?? '';
    const euCountries = ['DE','FR','IT','ES','NL','BE','AT','PT','IE','FI','GR','LU','LT','LV','EE','SK','SI','CY','MT'];
    const CURRENCY_MAP: Record<string, string> = {
      IN: 'INR', GB: 'GBP', CA: 'CAD',
    };
    const billingCurrency =
      CURRENCY_MAP[geoCountry] ?? (euCountries.includes(geoCountry) ? 'EUR' : 'USD');

    // Use region-specific product IDs when available, fall back to default.
    // EU countries share one EUR product (DODO_PLAN_MONTHLY_ID_EU) unless a
    // country-specific override exists (e.g. DODO_PLAN_MONTHLY_ID_DE).
    const euCountries = ['DE','FR','IT','ES','NL','BE','AT','PT','IE','FI','GR','LU','LT','LV','EE','SK','SI','CY','MT'];
    const regionKey = euCountries.includes(geoCountry) && !process.env[`DODO_PLAN_MONTHLY_ID_${geoCountry}`]
      ? 'EU'
      : geoCountry;
    const regionalMonthlyId = process.env[`DODO_PLAN_MONTHLY_ID_${regionKey}`];
    const regionalAnnualId = process.env[`DODO_PLAN_ANNUAL_ID_${regionKey}`];

    const productId =
      plan === 'annual'
        ? (regionalAnnualId ?? process.env.DODO_PLAN_ANNUAL_ID)
        : (regionalMonthlyId ?? process.env.DODO_PLAN_MONTHLY_ID);

    if (!productId) {
      console.error('Missing Dodo product ID env var for plan:', plan);
      return Response.json(
        { error: 'Payment configuration error. Please contact support.' },
        { status: 500 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      billing_currency: billingCurrency as Parameters<typeof dodo.checkoutSessions.create>[0]['billing_currency'],
      subscription_data: { trial_period_days: 7 },
      customer: {
        email: user.email!,
        name:
          (user.user_metadata?.full_name as string | undefined) ||
          user.email!.split('@')[0],
      },
      ...(discountCode ? { discount_code: discountCode } : {}),
      feature_flags: { allow_discount_code: true },
      return_url: `${appUrl}/dashboard?subscribed=true`,
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
