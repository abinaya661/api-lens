import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRazorpayClient } from '@/lib/razorpay/client';
import { getMonthlyPlanId, getAnnualPlanId } from '@/lib/razorpay/plans';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { plan } = await request.json() as { plan: 'monthly' | 'annual' };
  const planId = plan === 'annual' ? getAnnualPlanId() : getMonthlyPlanId();

  const razorpay = getRazorpayClient();
  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: plan === 'annual' ? 1 : 12,
    quantity: 1,
    notes: { user_id: user.id, user_email: user.email ?? '' },
  });

  return NextResponse.json({ subscription_id: subscription.id });
}
