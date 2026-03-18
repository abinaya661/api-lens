import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

export const runtime = 'nodejs';

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body) as {
      event: string;
      payload: {
        subscription?: { entity: { id: string; status: string; customer_id: string } };
        payment?: { entity: { id: string; status: string } };
      };
    };

    const supabase = createAdminClient();

    switch (event.event) {
      case 'subscription.activated': {
        const sub = event.payload.subscription?.entity;
        if (sub) {
          await supabase
            .from('subscriptions')
            .update({
              razorpay_subscription_id: sub.id,
              plan: 'monthly',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('razorpay_customer_id', sub.customer_id);
        }
        break;
      }

      case 'subscription.charged': {
        const sub = event.payload.subscription?.entity;
        if (sub) {
          await supabase
            .from('subscriptions')
            .update({
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('razorpay_subscription_id', sub.id);
        }
        break;
      }

      case 'subscription.cancelled': {
        const sub = event.payload.subscription?.entity;
        if (sub) {
          await supabase
            .from('subscriptions')
            .update({ cancel_at_period_end: true })
            .eq('razorpay_subscription_id', sub.id);
        }
        break;
      }

      case 'payment.failed': {
        // Log payment failure, could trigger grace period
        console.warn('Payment failed:', event.payload.payment?.entity?.id);
        break;
      }

      default:
        // Acknowledge unknown events without error
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Processing error' }, { status: 500 });
  }
}
