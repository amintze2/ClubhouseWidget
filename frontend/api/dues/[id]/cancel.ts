// Vercel serverless function: POST /api/dues/[id]/cancel
// Cancels a pending dues item. Expires the Stripe Checkout Session if one
// exists. Returns 422 if the dues are already paid.
//
// Required env vars:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET,
//   STRIPE_SECRET_KEY
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';
import Stripe from 'stripe';
import { z } from 'zod';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || '';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

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
    .select('id, cm_user_id, status, stripe_checkout_session_id')
    .eq('id', duesId)
    .single();

  if (fetchError || !due) {
    return res.status(404).json({ error: 'Dues record not found' });
  }

  // Only the CM who created the dues can cancel it
  if (due.cm_user_id !== auth.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (due.status === 'paid') {
    return res.status(422).json({ error: 'Cannot cancel a paid dues record. Issue a refund separately.' });
  }

  if (due.status === 'cancelled') {
    return res.status(422).json({ error: 'Dues record is already cancelled' });
  }

  // Expire the Stripe Checkout Session if one was created
  if (due.stripe_checkout_session_id) {
    try {
      await stripe.checkout.sessions.expire(due.stripe_checkout_session_id);
    } catch {
      // Session may already be expired or paid — continue with DB update
    }
  }

  const { error: updateError } = await supabase
    .from('dues')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', duesId);

  if (updateError) {
    return res.status(500).json({ error: 'Failed to cancel dues record' });
  }

  return res.status(200).json({ cancelled: true });
}
