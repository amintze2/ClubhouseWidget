// Vercel serverless function: GET /api/dues/my
// Returns all dues rows for the authenticated player,
// including CM name and batch note for display context.
//
// Required env vars:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || '';

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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: dues, error } = await supabase
    .from('dues')
    .select(`
      id,
      amount,
      status,
      paid_at,
      cancelled_at,
      created_at,
      dues_batch (
        note,
        created_at,
        user:cm_user_id ( user_name ),
        teams:visiting_team_id ( team_name )
      )
    `)
    .eq('player_user_id', auth.userId)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch dues' });
  }

  return res.status(200).json(dues ?? []);
}
