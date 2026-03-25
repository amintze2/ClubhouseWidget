// Vercel serverless function: GET /api/dues/batch
// Returns all dues_batch rows for the authenticated CM,
// with each batch including dues rows and player names.
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

  // Fetch batches for this CM with visiting team name
  const { data: batches, error: batchError } = await supabase
    .from('dues_batch')
    .select('id, visiting_team_id, amount_per_player, note, created_at, teams(team_name)')
    .eq('cm_user_id', auth.userId)
    .order('created_at', { ascending: false });

  if (batchError) {
    return res.status(500).json({ error: 'Failed to fetch batches' });
  }

  if (!batches || batches.length === 0) {
    return res.status(200).json([]);
  }

  const batchIds = batches.map(b => b.id);

  // Fetch all dues rows for these batches with player names
  const { data: dues, error: duesError } = await supabase
    .from('dues')
    .select('id, batch_id, player_user_id, amount, status, paid_at, cancelled_at, created_at, user:player_user_id(user_name)')
    .in('batch_id', batchIds)
    .order('created_at', { ascending: true });

  if (duesError) {
    return res.status(500).json({ error: 'Failed to fetch dues' });
  }

  // Group dues by batch_id
  const duesByBatch: Record<number, typeof dues> = {};
  for (const due of dues ?? []) {
    if (!duesByBatch[due.batch_id]) duesByBatch[due.batch_id] = [];
    duesByBatch[due.batch_id]!.push(due);
  }

  const result = batches.map(batch => ({
    ...batch,
    dues: duesByBatch[batch.id] ?? [],
  }));

  return res.status(200).json(result);
}
