// Vercel serverless function: POST /api/dues/send
// Creates a dues_batch and individual dues rows for selected players.
// Only callable by clubhouse managers.
//
// Required env vars:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';
import { z } from 'zod';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || '';

const playerEntrySchema = z.object({
  userId: z.number().int().positive(),
  amount: z.number().positive().max(10000),
});

const sendDuesSchema = z.object({
  visitingTeamId: z.number().int().positive(),
  players: z.array(playerEntrySchema).min(1).max(100),
  note: z.string().max(500).optional(),
});

async function verifyAuth(req: VercelRequest): Promise<{ userId: number; teamId: number | null } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const secret = new TextEncoder().encode(SUPABASE_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = parseInt(String(payload.sub ?? ''), 10);
    if (isNaN(userId)) return null;
    const teamId = payload.team_id != null ? Number(payload.team_id) : null;
    return { userId, teamId };
  } catch {
    return null;
  }
}

function isClubhouseManagerRole(userRole: string | null | undefined): boolean {
  const normalized = userRole?.toLowerCase().trim() ?? '';
  if (normalized.includes('general') && normalized.includes('manager')) return false;
  return (
    normalized === 'clubhouse_manager' ||
    (normalized.includes('clubhouse') && normalized.includes('manager')) ||
    (normalized.includes('manager') && !normalized.includes('general'))
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Verify caller is a clubhouse manager
  const { data: callerUser } = await supabase
    .from('user')
    .select('user_role')
    .eq('id', auth.userId)
    .single();

  if (!isClubhouseManagerRole(callerUser?.user_role)) {
    return res.status(403).json({ error: 'Only clubhouse managers can send dues' });
  }

  // Validate request body
  const parseResult = sendDuesSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid request', details: parseResult.error.flatten() });
  }

  const { visitingTeamId, players, note } = parseResult.data;

  // Create the dues_batch row
  const { data: batch, error: batchError } = await supabase
    .from('dues_batch')
    .insert({
      cm_user_id: auth.userId,
      visiting_team_id: visitingTeamId,
      amount_per_player: players[0]?.amount ?? 8.00,
      note: note ?? null,
    })
    .select('id')
    .single();

  if (batchError || !batch) {
    return res.status(500).json({ error: 'Failed to create dues batch' });
  }

  // Create individual dues rows
  const duesRows = players.map(p => ({
    batch_id: batch.id,
    cm_user_id: auth.userId,
    player_user_id: p.userId,
    amount: p.amount,
    status: 'pending',
  }));

  const { error: duesError } = await supabase.from('dues').insert(duesRows);

  if (duesError) {
    // Best-effort cleanup of orphaned batch
    await supabase.from('dues_batch').delete().eq('id', batch.id);
    return res.status(500).json({ error: 'Failed to create dues records' });
  }

  return res.status(201).json({ batchId: batch.id, count: players.length });
}
