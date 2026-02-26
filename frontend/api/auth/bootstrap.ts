// Vercel serverless function: POST /api/auth/bootstrap
// Validates a short-lived Slugger bootstrap token by calling the Slugger API,
// finds or creates the user in our Supabase DB, and returns our own session data.
// The bootstrap token must NEVER be stored client-side — it is forwarded here
// immediately and consumed once.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SLUGGER_API_URL = process.env.SLUGGER_API_URL || 'https://alpb-analytics.com';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// Mock user returned in development when token starts with 'mock-'
const DEV_MOCK_USER = {
  id: 0,
  slugger_user_id: 'test-user-123',
  user_name: 'Test User',
  user_role: null as string | null,
  user_team: null as number | null,
  team_name: null as string | null,
  created_at: new Date().toISOString(),
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body ?? {};
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'token is required' });
  }

  // ── Dev bypass ─────────────────────────────────────────────────────────────
  // When running in development and the token is a mock token, skip the real
  // Slugger API call and return a predictable test user.
  if (process.env.NODE_ENV !== 'production' && token.startsWith('mock-')) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: existingUser } = await supabase
      .from('user')
      .select('*')
      .eq('slugger_user_id', DEV_MOCK_USER.slugger_user_id)
      .maybeSingle();

    const dbUser = existingUser ?? DEV_MOCK_USER;
    return res.status(200).json({ sluggerUserId: DEV_MOCK_USER.slugger_user_id, user: dbUser });
  }

  // ── Step 1: Validate bootstrap token with Slugger API ──────────────────────
  let sluggerUser: Record<string, any>;
  try {
    const sluggerRes = await fetch(`${SLUGGER_API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!sluggerRes.ok) {
      return res.status(401).json({ error: 'Bootstrap token rejected by Slugger' });
    }
    const json = await sluggerRes.json();
    // Slugger wraps user data under a 'data' key: { success: true, data: { id, firstName, ... } }
    sluggerUser = json?.data ?? json;
  } catch {
    return res.status(502).json({ error: 'Failed to reach Slugger API' });
  }

  // Slugger returns numeric 'id' as the user identifier
  const sluggerUserId: string = String(sluggerUser.id ?? '');
  if (!sluggerUserId) {
    return res.status(401).json({ error: 'No user ID in Slugger response' });
  }

  const userName: string =
    [sluggerUser.firstName, sluggerUser.lastName].filter(Boolean).join(' ') ||
    sluggerUser.email ||
    sluggerUserId;

  // ── Step 2: Find-or-create user in our Supabase DB ─────────────────────────
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  let dbUser: Record<string, any> | null = null;

  const { data: existing } = await supabase
    .from('user')
    .select('*')
    .eq('slugger_user_id', sluggerUserId)
    .maybeSingle();

  if (existing) {
    dbUser = existing;
  } else {
    // First-time login: create minimal record; admins assign team/role later
    const { data: created, error: insertError } = await supabase
      .from('user')
      .insert({ slugger_user_id: sluggerUserId, user_name: userName })
      .select('*')
      .single();

    if (insertError) {
      return res.status(500).json({ error: 'Failed to create user', details: insertError.message });
    }
    dbUser = created;
  }

  // ── Step 3: Resolve team name (mirrors backend/src/routes/users.ts:102-113) ─
  let teamName: string | null = null;
  if (dbUser?.user_team) {
    const { data: team } = await supabase
      .from('teams')
      .select('team_name')
      .eq('id', dbUser.user_team)
      .single();
    teamName = team?.team_name ?? null;
  }

  return res.status(200).json({
    sluggerUserId,
    user: { ...dbUser, team_name: teamName },
  });
}
