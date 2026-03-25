// Vercel serverless function: POST /api/dues/[id]/checkout
// Creates a Stripe Checkout Session for a pending dues item on player request.
// Sessions are created lazily (on click) to avoid expiry issues.
//
// Required env vars:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET,
//   STRIPE_SECRET_KEY, APP_URL (e.g. https://your-vercel-domain.vercel.app)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';
import Stripe from 'stripe';
import { z } from 'zod';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || '';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const APP_URL = process.env.APP_URL || 'https://localhost:3000';

const stripe = new Stripe(STRIPE_SECRET_KEY);

const paramsSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

async function verifyAuth(req: VercelRequest): Promise<{ userId: number } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const secret = new TextEncoder().encode(SUPABASE_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = parseInt(String(payload.sub ?? ''), 10);
    if (isNaN(userId)) return null;
    return { userId };
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const paramsResult = paramsSchema.safeParse(req.query);
  if (!paramsResult.success) {
    return res.status(400).json({ error: 'Invalid dues ID' });
  }
  const duesId = paramsResult.data.id;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Fetch the dues row
  const { data: due, error: fetchError } = await supabase
    .from('dues')
    .select('id, player_user_id, cm_user_id, amount, status, dues_batch(note, teams:visiting_team_id(team_name))')
    .eq('id', duesId)
    .single();

  if (fetchError || !due) {
    return res.status(404).json({ error: 'Dues record not found' });
  }

  // Verify ownership — only the player who owes can create a checkout
  if (due.player_user_id !== auth.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (due.status !== 'pending') {
    return res.status(422).json({ error: `Cannot pay dues with status: ${due.status}` });
  }

  // Derive a description for the Stripe checkout page
  const batch = due.dues_batch as { note?: string; teams?: { team_name?: string } } | null;
  const teamName = batch?.teams?.team_name ?? 'Visiting Team';
  const note = batch?.note ?? '';
  const description = note
    ? `Clubhouse dues — ${teamName} (${note})`
    : `Clubhouse dues — ${teamName}`;

  // Create Stripe Checkout Session (amount in cents)
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(Number(due.amount) * 100),
          product_data: { name: description },
        },
        quantity: 1,
      },
    ],
    metadata: {
      dues_id: String(duesId),
      player_user_id: String(due.player_user_id),
      cm_user_id: String(due.cm_user_id),
    },
    success_url: `${APP_URL}?dues_paid=1`,
    cancel_url: `${APP_URL}?dues_cancelled=1`,
  });

  // Persist session ID so cancel can expire it
  await supabase
    .from('dues')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', duesId);

  return res.status(200).json({ url: session.url });
}
