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

    // Map user's country to a regional collection.
    // Each collection contains both monthly + annual products for that region,
    // so the customer picks their plan on the Dodo checkout page.
    // Discount codes entered on the Dodo checkout page still work (allow_discount_code: true).
    const geoCountry = req.cookies.get('geo_country')?.value ?? '';
    const euCountries = ['DE','FR','IT','ES','NL','BE','AT','PT','IE','FI','GR','LU','LT','LV','EE','SK','SI','CY','MT','GB'];

<<<<<<< Updated upstream
    let collectionId: string | undefined;
    if (geoCountry === 'IN') {
      collectionId = process.env.DODO_COLLECTION_INDIA_ID;
    } else if (geoCountry === 'US' || geoCountry === 'CA') {
      collectionId = process.env.DODO_COLLECTION_NA_ID;
    } else if (euCountries.includes(geoCountry)) {
      collectionId = process.env.DODO_COLLECTION_EU_ID;
    } else {
      collectionId = process.env.DODO_COLLECTION_ROW_ID;
    }
=======
    // Use region-specific product IDs when available, fall back to default.
    // EU countries share one EUR product (DODO_PLAN_MONTHLY_ID_EU) unless a
    // country-specific override exists (e.g. DODO_PLAN_MONTHLY_ID_DE).
    const regionKey = euCountries.includes(geoCountry) && !process.env[`DODO_PLAN_MONTHLY_ID_${geoCountry}`]
      ? 'EU'
      : geoCountry;
    const regionalMonthlyId = process.env[`DODO_PLAN_MONTHLY_ID_${regionKey}`];
    const regionalAnnualId = process.env[`DODO_PLAN_ANNUAL_ID_${regionKey}`];
>>>>>>> Stashed changes

    const fallbackProductId = plan === 'annual'
      ? process.env.DODO_PLAN_ANNUAL_ID
      : process.env.DODO_PLAN_MONTHLY_ID;

    if (!collectionId && !fallbackProductId) {
      console.error('Missing Dodo collection and product ID env vars for plan:', plan);
      return Response.json(
        { error: 'Payment configuration error. Please contact support.' },
        { status: 500 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

    // Collection checkout: product_cart must be empty, discount_code not pre-applied
    // (customer enters discount code on Dodo's checkout page via allow_discount_code: true).
    // Fallback checkout: single product + pre-applied discount code.
    const session = await dodo.checkoutSessions.create({
      ...(collectionId
        ? { product_collection_id: collectionId, product_cart: [] }
        : {
            product_cart: [{ product_id: fallbackProductId!, quantity: 1 }],
            ...(discountCode ? { discount_code: discountCode } : {}),
          }
      ),
      subscription_data: { trial_period_days: 7 },
      customer: {
        email: user.email!,
        name:
          (user.user_metadata?.full_name as string | undefined) ||
          user.email!.split('@')[0],
      },
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
