// Vercel serverless function: POST /api/auth/bootstrap
// Validates a short-lived Slugger bootstrap token by calling the Slugger API,
// finds or creates the user in our Supabase DB, signs a Supabase-compatible JWT
// for the client (enabling RLS), and returns our own session data.
// The bootstrap token must NEVER be stored client-side — it is forwarded here
// immediately and consumed once.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const SLUGGER_API_URL = process.env.SLUGGER_API_URL || 'https://alpb-analytics.com';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
// Use service role key server-side — bypasses RLS for admin operations (upsert user)
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
// JWT secret used to sign client-facing Supabase sessions
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || '';

// Rate limiter: 10 requests per IP per 60 seconds
// Requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in env
let ratelimit: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    prefix: 'bootstrap',
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  if (ratelimit) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ?? 'unknown';
    const { success, reset } = await ratelimit.limit(ip);
    if (!success) {
      res.setHeader('Retry-After', String(Math.ceil((reset - Date.now()) / 1000)));
      return res.status(429).json({ error: 'Too many requests' });
    }
  }

  const { token } = req.body ?? {};
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'token is required' });
  }

  // ── Dev bypass (ENABLE_MOCK_AUTH only — never set in production) ────────────
  if (process.env.ENABLE_MOCK_AUTH === 'true' && token.startsWith('mock-')) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: existingUser } = await supabase
      .from('user')
      .select('*')
      .eq('slugger_user_id', 'test-user-123')
      .maybeSingle();

    const dbUser = existingUser ?? {
      id: 0,
      slugger_user_id: 'test-user-123',
      user_name: 'Test User',
      user_role: null,
      user_team: null,
      created_at: new Date().toISOString(),
    };

    const session = await signSupabaseJwt(dbUser.id, dbUser.user_team);
    return res.status(200).json({ sluggerUserId: 'test-user-123', user: dbUser, session });
  }

  // ── Step 1: Validate bootstrap token with Slugger API ──────────────────────
  // Temp debug: decode JWT header to identify token type (header is public, not sensitive)
  try {
    const headerB64 = token.split('.')[0];
    const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());
    console.log('[bootstrap] token header:', JSON.stringify(header), '| url:', `${SLUGGER_API_URL}/api/users/me`);
  } catch {
    console.log('[bootstrap] token does not appear to be a JWT | url:', `${SLUGGER_API_URL}/api/users/me`);
  }

  let sluggerUser: Record<string, any>;
  try {
    const sluggerRes = await fetch(`${SLUGGER_API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!sluggerRes.ok) {
      const errBody = await sluggerRes.text().catch(() => '');
      console.log('[bootstrap] Slugger API rejected token:', sluggerRes.status, '| body:', errBody);
      return res.status(401).json({ error: 'Authentication failed' });
    }
    const json = await sluggerRes.json();
    sluggerUser = json?.data ?? json;
  } catch {
    return res.status(401).json({ error: 'Authentication failed' });
  }

  const sluggerUserId: string = String(sluggerUser.id ?? '');
  if (!sluggerUserId) {
    return res.status(401).json({ error: 'Authentication failed' });
  }

  const userName: string =
    [sluggerUser.firstName, sluggerUser.lastName].filter(Boolean).join(' ') ||
    sluggerUser.email ||
    sluggerUserId;

  // ── Step 2: Find-or-create user in our Supabase DB ─────────────────────────
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let dbUser: Record<string, any> | null = null;

  const { data: existing } = await supabase
    .from('user')
    .select('*')
    .eq('slugger_user_id', sluggerUserId)
    .maybeSingle();

  if (existing) {
    dbUser = existing;
  } else {
    const { data: created, error: insertError } = await supabase
      .from('user')
      .insert({ slugger_user_id: sluggerUserId, user_name: userName })
      .select('*')
      .single();

    if (insertError) {
      return res.status(401).json({ error: 'Authentication failed' });
    }
    dbUser = created;
  }

  // ── Step 3: Resolve team name ───────────────────────────────────────────────
  let teamName: string | null = null;
  if (dbUser?.user_team) {
    const { data: team } = await supabase
      .from('teams')
      .select('team_name')
      .eq('id', dbUser.user_team)
      .single();
    teamName = team?.team_name ?? null;
  }

  // ── Step 4: Sign a Supabase-compatible JWT for the client ───────────────────
  // The client uses this to call supabase.auth.setSession(), which enables RLS.
  const session = await signSupabaseJwt(dbUser!.id, dbUser!.user_team);

  return res.status(200).json({
    sluggerUserId,
    user: { ...dbUser, team_name: teamName },
    session,
  });
}

/**
 * Signs a Supabase-compatible JWT so the client can call
 * supabase.auth.setSession({ access_token }), enabling RLS policies.
 * Claims:
 *   sub      = dbUser.id (internal app user ID, used in RLS policies)
 *   team_id  = dbUser.user_team (used in team-scoped RLS policies)
 *   role     = 'authenticated'
 */
async function signSupabaseJwt(
  userId: number,
  teamId: number | null
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  if (!SUPABASE_JWT_SECRET) {
    // If JWT secret not configured, return empty session (RLS won't be enforced)
    // but app still works in degraded mode
    return { access_token: '', refresh_token: '', expires_in: 0 };
  }

  const secret = new TextEncoder().encode(SUPABASE_JWT_SECRET);
  const expiresIn = 3600; // 1 hour

  const access_token = await new SignJWT({
    sub: String(userId),
    team_id: teamId,
    role: 'authenticated',
    iss: 'supabase',
    aud: 'authenticated',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(secret);

  return { access_token, refresh_token: '', expires_in: expiresIn };
}
