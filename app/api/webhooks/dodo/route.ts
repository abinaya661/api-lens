import { Webhook } from 'standardwebhooks';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, getTransactionEmailHtml } from '@/lib/email/resend';

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

  // Parse and validate JSON body
  let event: {
    type: string;
    data: {
      subscription_id?: string;
      customer?: { customer_id?: string };
      current_period_end?: string;
      metadata?: { user_id?: string; plan?: string };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    console.error('[webhook] Invalid JSON body');
    return new Response('Invalid JSON body', { status: 400 });
  }

  if (!event?.type || !event?.data) {
    console.error('[webhook] Missing type or data in webhook payload');
    return new Response('Invalid webhook payload', { status: 400 });
  }

  const adminSupabase = createAdminClient();

  // Race-safe idempotency: try to INSERT first — if webhook_id already exists
  // the PRIMARY KEY constraint rejects it, meaning it was already processed.
  const webhookId = webhookHeaders['webhook-id'];
  if (webhookId) {
    const { error: insertError } = await adminSupabase
      .from('webhook_events')
      .insert({ webhook_id: webhookId, event_type: event.type });

    if (insertError) {
      // Duplicate key = already processed; any other error = log and continue
      if (insertError.code === '23505') {
        return new Response('Already processed', { status: 200 });
      }
      console.error('[webhook] Failed to record webhook event:', insertError);
    }
  }

  const now = new Date().toISOString();

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

      const { error } = await adminSupabase.from('subscriptions').update({
        status: 'active',
        dodo_subscription_id: event.data.subscription_id,
        dodo_customer_id: event.data.customer?.customer_id,
        plan: event.data.metadata?.plan ?? 'monthly',
        period_end: event.data.current_period_end,
        last_payment_at: now,
        updated_at: now,
      }).eq('user_id', userId);

      if (error) {
        console.error('[webhook] subscription.active DB update failed:', error);
        return new Response('Database error', { status: 500 });
      }

      const { data: userResponse } = await adminSupabase.auth.admin.getUserById(userId);
      const email = userResponse.user?.email;
      if (email) {
        await sendEmail({
          to: email,
          subject: 'Welcome to API Lens! Your Subscription is Active',
          html: getTransactionEmailHtml({
            title: 'Your Subscription is Active! 🎉',
            message: 'You have successfully subscribed. Your payment was processed and your account is now fully active.',
            plan: event.data.metadata?.plan ?? 'monthly',
          }),
        }).catch((err: any) => console.error('[Webhook Email]', err));
      }
      break;
    }

    case 'subscription.renewed': {
      if (!event.data.subscription_id) {
        console.warn('[webhook] subscription.renewed missing subscription_id', { webhookId });
        break;
      }
      const { error } = await adminSupabase.from('subscriptions').update({
        status: 'active',
        last_payment_at: now,
        period_end: event.data.current_period_end,
        updated_at: now,
      }).eq('dodo_subscription_id', event.data.subscription_id);

      if (error) {
        console.error('[webhook] subscription.renewed DB update failed:', error);
        return new Response('Database error', { status: 500 });
      }
      break;
    }

    case 'payment.failed': {
      if (!event.data.subscription_id) {
        console.warn('[webhook] payment.failed missing subscription_id', { webhookId });
        break;
      }
      const { error } = await adminSupabase.from('subscriptions').update({
        status: 'past_due',
        grace_period_ends_at: new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        updated_at: now,
      }).eq('dodo_subscription_id', event.data.subscription_id);

      if (error) {
        console.error('[webhook] payment.failed DB update failed:', error);
        return new Response('Database error', { status: 500 });
      }

      const { data: sub } = await adminSupabase.from('subscriptions').select('user_id').eq('dodo_subscription_id', event.data.subscription_id).single();
      if (sub?.user_id) {
        const { data: userResponse } = await adminSupabase.auth.admin.getUserById(sub.user_id);
        const email = userResponse.user?.email;
        if (email) {
          await sendEmail({
            to: email,
            subject: 'API Lens Payment Failed',
            html: getTransactionEmailHtml({
              title: 'Your payment was unsuccessful',
              message: 'Your recent payment did not go through. Your access will continue for a 3-day grace period. Please update your payment method to avoid interruption.',
            }),
          }).catch((err: unknown) => console.error('[Webhook Email]', err));
        }
      }
      break;
    }

    case 'subscription.canceled': {
      if (!event.data.subscription_id) {
        console.warn('[webhook] subscription.canceled missing subscription_id', { webhookId });
        break;
      }
      const { error } = await adminSupabase.from('subscriptions').update({
        status: 'cancelled',
        updated_at: now,
      }).eq('dodo_subscription_id', event.data.subscription_id);

      if (error) {
        console.error('[webhook] subscription.canceled DB update failed:', error);
        return new Response('Database error', { status: 500 });
      }
      break;
    }

    case 'payment.completed': {
      if (!event.data.subscription_id) {
        console.warn('[webhook] payment.completed missing subscription_id', { webhookId });
        break;
      }
      const { error } = await adminSupabase.from('subscriptions').update({
        status: 'active',
        last_payment_at: now,
        updated_at: now,
      }).eq('dodo_subscription_id', event.data.subscription_id);

      if (error) {
        console.error('[webhook] payment.completed DB update failed:', error);
        return new Response('Database error', { status: 500 });
      }

      const { data: subComp } = await adminSupabase.from('subscriptions').select('user_id').eq('dodo_subscription_id', event.data.subscription_id).single();
      if (subComp?.user_id) {
        const { data: userResponse } = await adminSupabase.auth.admin.getUserById(subComp.user_id);
        const email = userResponse.user?.email;
        if (email) {
          await sendEmail({
            to: email,
            subject: 'API Lens Payment Successful',
            html: getTransactionEmailHtml({
              title: 'Payment Successful',
              message: 'Your subscription renewal payment was successfully processed. Thank you for using API Lens!',
            }),
          }).catch((err: unknown) => console.error('[Webhook Email]', err));
        }
      }
      break;
    }

    case 'subscription.updated': {
      if (!event.data.subscription_id) {
        console.warn('[webhook] subscription.updated missing subscription_id', { webhookId });
        break;
      }
      const { error } = await adminSupabase.from('subscriptions').update({
        plan: event.data.metadata?.plan,
        updated_at: now,
      }).eq('dodo_subscription_id', event.data.subscription_id);

      if (error) {
        console.error('[webhook] subscription.updated DB update failed:', error);
        return new Response('Database error', { status: 500 });
      }
      break;
    }

    case 'subscription.trialing': {
      // Card collected, trial started — mark payment method as collected
      const userId = event.data.metadata?.user_id;
      if (!userId) {
        console.warn('[webhook] subscription.trialing missing user_id', { webhookId });
        break;
      }
      const { error } = await adminSupabase.from('subscriptions').update({
        payment_method_collected: true,
        updated_at: now,
      }).eq('user_id', userId);

      if (error) {
        console.error('[webhook] subscription.trialing DB update failed:', error);
        return new Response('Database error', { status: 500 });
      }
      break;
    }

    default:
      break;
  }

  return new Response('OK', { status: 200 });
}
