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

  const adminSupabase = createAdminClient();

  // Idempotency check: skip if this webhook-id was already processed
  const webhookId = webhookHeaders['webhook-id'];
  if (webhookId) {
    const { data: existing } = await adminSupabase
      .from('webhook_events')
      .select('webhook_id')
      .eq('webhook_id', webhookId)
      .single();
    if (existing) {
      return new Response('Already processed', { status: 200 });
    }
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

  // Record webhook event for idempotency
  if (webhookId) {
    await adminSupabase.from('webhook_events').insert({
      webhook_id: webhookId,
      event_type: event.type,
    });
  }

  switch (event.type) {
    case 'subscription.active': {
      const userId = event.data.metadata?.user_id;
      if (!userId) {
        console.warn('[webhook] subscription.active missing user_id', { webhookId });
        break;
      }
      if (!event.data.subscription_id) {
        console.warn('[webhook] subscription.active missing subscription_id', { webhookId });
        break;
      }

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
      if (!event.data.subscription_id) {
        console.warn('[webhook] subscription.renewed missing subscription_id', { webhookId });
        break;
      }
      await adminSupabase.from('subscriptions').update({
        status: 'active',
        last_payment_at: new Date().toISOString(),
        period_end: event.data.current_period_end,
        updated_at: new Date().toISOString(),
      }).eq('dodo_subscription_id', event.data.subscription_id);
      break;
    }

    case 'payment.failed': {
      if (!event.data.subscription_id) {
        console.warn('[webhook] payment.failed missing subscription_id', { webhookId });
        break;
      }
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
      if (!event.data.subscription_id) {
        console.warn('[webhook] subscription.canceled missing subscription_id', { webhookId });
        break;
      }
      await adminSupabase.from('subscriptions').update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      }).eq('dodo_subscription_id', event.data.subscription_id);
      break;
    }

    case 'payment.completed': {
      if (!event.data.subscription_id) {
        console.warn('[webhook] payment.completed missing subscription_id', { webhookId });
        break;
      }
      await adminSupabase.from('subscriptions').update({
        status: 'active',
        last_payment_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('dodo_subscription_id', event.data.subscription_id);
      break;
    }

    case 'subscription.updated': {
      if (!event.data.subscription_id) {
        console.warn('[webhook] subscription.updated missing subscription_id', { webhookId });
        break;
      }
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
