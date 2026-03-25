// Vercel serverless function: POST /api/stripe/webhook
// Receives Stripe webhook events, verifies the signature, and updates
// the database accordingly using the service role key (bypasses RLS).
//
// IMPORTANT: This function uses the raw request body for signature verification.
// Stripe requires the body to be unmodified — do not use body parsers upstream.
//
// Required env vars (Vercel project settings):
//   STRIPE_SECRET_KEY        — Stripe secret key (sk_live_... or sk_test_...)
//   STRIPE_WEBHOOK_SECRET    — Webhook signing secret from Stripe dashboard (whsec_...)
//   SUPABASE_URL             — Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY — Service role key (bypasses RLS)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const stripe = new Stripe(STRIPE_SECRET_KEY);

export const config = {
  api: {
    // Required: Stripe signature verification needs the raw body
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).json({ error: 'Missing Stripe-Signature header' });
  }

  // Read raw body for signature verification
  const rawBody = await getRawBody(req);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    await handleStripeEvent(event, supabase);
  } catch {
    return res.status(500).json({ error: 'Failed to process webhook event' });
  }

  return res.status(200).json({ received: true });
}

async function handleStripeEvent(
  event: Stripe.Event,
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const teamId = sub.metadata?.team_id ? Number(sub.metadata.team_id) : null;
      if (!teamId) break;

      await supabase.from('subscriptions').upsert(
        {
          team_id: teamId,
          stripe_subscription_id: sub.id,
          stripe_customer_id: String(sub.customer),
          status: sub.status,
          plan: sub.items.data[0]?.price?.nickname ?? null,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'stripe_subscription_id' }
      );

      await writeAuditLog(supabase, event.type, teamId, null, {
        stripe_subscription_id: sub.id,
        status: sub.status,
      });
      break;
    }

    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      const teamId = pi.metadata?.team_id ? Number(pi.metadata.team_id) : null;
      if (!teamId) break;

      await supabase.from('payments').insert({
        team_id: teamId,
        stripe_payment_intent_id: pi.id,
        amount: (pi.amount / 100).toFixed(2),
        currency: pi.currency,
        status: 'succeeded',
      });

      await writeAuditLog(supabase, event.type, teamId, null, {
        stripe_payment_intent_id: pi.id,
        amount: pi.amount,
        currency: pi.currency,
      });
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      const teamId = pi.metadata?.team_id ? Number(pi.metadata.team_id) : null;
      if (!teamId) break;

      await supabase.from('payments').insert({
        team_id: teamId,
        stripe_payment_intent_id: pi.id,
        amount: (pi.amount / 100).toFixed(2),
        currency: pi.currency,
        status: 'failed',
      });

      await writeAuditLog(supabase, event.type, teamId, null, {
        stripe_payment_intent_id: pi.id,
        failure_message: pi.last_payment_error?.message ?? null,
      });
      break;
    }

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const duesId = session.metadata?.dues_id ? Number(session.metadata.dues_id) : null;
      const playerUserId = session.metadata?.player_user_id ? Number(session.metadata.player_user_id) : null;
      const cmUserId = session.metadata?.cm_user_id ? Number(session.metadata.cm_user_id) : null;

      // Only process sessions that originated from the dues flow
      if (!duesId) break;

      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

      const amountTotal = session.amount_total ?? 0;

      // Mark dues as paid — only update if still pending (idempotent)
      await supabase
        .from('dues')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: paymentIntentId,
        })
        .eq('id', duesId)
        .eq('status', 'pending');

      // Record in payments table (upsert on payment_intent_id for idempotency)
      if (paymentIntentId) {
        await supabase.from('payments').upsert(
          {
            team_id: null,
            stripe_payment_intent_id: paymentIntentId,
            amount: (amountTotal / 100).toFixed(2),
            currency: session.currency ?? 'usd',
            status: 'succeeded',
          },
          { onConflict: 'stripe_payment_intent_id' }
        );
      }

      await writeAuditLog(supabase, 'dues.paid', null, playerUserId, {
        dues_id: duesId,
        cm_user_id: cmUserId,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
        amount: amountTotal,
      });
      break;
    }

    default:
      // Unhandled event types are silently ignored
      break;
  }
}

async function writeAuditLog(
  supabase: ReturnType<typeof createClient>,
  eventType: string,
  teamId: number | null,
  userId: number | null,
  payload: Record<string, unknown>
): Promise<void> {
  await supabase.from('audit_log').insert({
    event_type: eventType,
    team_id: teamId,
    user_id: userId,
    payload,
  });
}

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
