import { Webhook } from 'standardwebhooks';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const headersList = await headers();
  const rawBody = await request.text();

  const webhookHeaders = {
    'webhook-id': headersList.get('webhook-id') ?? '',
    'webhook-signature': headersList.get('webhook-signature') ?? '',
    'webhook-timestamp': headersList.get('webhook-timestamp') ?? '',
  };

  try {
    const webhook = new Webhook(process.env.DODO_WEBHOOK_SECRET!);
    webhook.verify(rawBody, webhookHeaders);
  } catch (err) {
    console.error('Dodo webhook verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(rawBody) as {
    type: string;
    data: {
      subscription_id?: string;
      customer?: { customer_id?: string };
      current_period_end?: string;
      metadata?: { user_id?: string; plan?: string };
    };
  };

  const adminSupabase = createAdminClient();

  switch (event.type) {
    case 'subscription.active': {
      const userId = event.data.metadata?.user_id;
      if (!userId) break;

      await adminSupabase.from('subscriptions').update({
        status: 'active',
        dodo_subscription_id: event.data.subscription_id,
        dodo_customer_id: event.data.customer?.customer_id,
        plan: event.data.metadata?.plan ?? 'monthly',
        period_end: event.data.current_period_end,
        last_payment_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId);
      break;
    }

    case 'subscription.renewed': {
      await adminSupabase.from('subscriptions').update({
        status: 'active',
        last_payment_at: new Date().toISOString(),
        period_end: event.data.current_period_end,
        updated_at: new Date().toISOString(),
      }).eq('dodo_subscription_id', event.data.subscription_id);
      break;
    }

    case 'payment.failed': {
      await adminSupabase.from('subscriptions').update({
        status: 'past_due',
        grace_period_ends_at: new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('dodo_subscription_id', event.data.subscription_id);
      break;
    }

    case 'subscription.canceled': {
      await adminSupabase.from('subscriptions').update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      }).eq('dodo_subscription_id', event.data.subscription_id);
      break;
    }

    case 'payment.completed': {
      await adminSupabase.from('subscriptions').update({
        status: 'active',
        last_payment_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('dodo_subscription_id', event.data.subscription_id);
      break;
    }

    case 'subscription.updated': {
      await adminSupabase.from('subscriptions').update({
        plan: event.data.metadata?.plan,
        updated_at: new Date().toISOString(),
      }).eq('dodo_subscription_id', event.data.subscription_id);
      break;
    }

    default:
      break;
  }

  return new Response('OK', { status: 200 });
}
