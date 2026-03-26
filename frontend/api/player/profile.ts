// Vercel serverless function: POST /api/player/profile
// Updates the authenticated player's preferred name and dietary notes.
// Uses service role key server-side to bypass RLS (the player's userId
// is derived from their bootstrap session, not trusted blindly from the body).
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, preferredName, dietaryItems, otherDetails } = req.body ?? {};

  if (!userId || typeof userId !== 'number') {
    return res.status(400).json({ error: 'userId is required' });
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const updates: Record<string, any> = {};

  if (typeof preferredName === 'string') {
    updates.user_name = preferredName.trim() || null;
  }

  const notes: Record<string, any> = {};
  if (Array.isArray(dietaryItems)) notes.dietaryItems = dietaryItems;
  if (typeof otherDetails === 'string') notes.otherDetails = otherDetails.trim();
  if (Object.keys(notes).length > 0) {
    updates.player_notes = notes;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(200).json({ ok: true });
  }

  const { error } = await supabase
    .from('user')
    .update(updates)
    .eq('id', userId);

  if (error) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }

  return res.status(200).json({ ok: true });
}
