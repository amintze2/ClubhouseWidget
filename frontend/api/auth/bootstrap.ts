// Vercel serverless function: POST /api/auth/bootstrap
// Validates a short-lived Slugger bootstrap token by calling the Slugger API,
// finds or creates the user in our Supabase DB, signs a Supabase-compatible JWT
// for the client (enabling RLS), and returns our own session data.
// The bootstrap token must NEVER be stored client-side — it is forwarded here
// immediately and consumed once.
//
// Auth strategy:
//   1. Try Slugger API (/api/users/me) with the token as Bearer — works when
//      Slugger sends their own HS256 bootstrap token (per WIDGET-AUTH.md spec).
//   2. If Slugger API rejects it, try direct Cognito JWT validation — handles
//      the case where Slugger's [WidgetIframe] sends a Cognito RS256 token
//      instead of a Slugger-issued bootstrap token.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { SignJWT, createRemoteJWKSet, jwtVerify } from 'jose';
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

  const { token, sluggerUser: payloadUser } = req.body ?? {};
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'token is required' });
  }

  // ── Dev bypass (ENABLE_MOCK_AUTH only — never set in production) ────────────
  // Token format: "mock-<slugger_user_id>" — looks up that user in the DB.
  // Usage: visit http://localhost:3000?mockUser=<slugger_user_id>
  if (process.env.ENABLE_MOCK_AUTH === 'true' && token.startsWith('mock-')) {
    const mockSluggerUserId = token.slice('mock-'.length);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: existingUser } = await supabase
      .from('user')
      .select('*')
      .eq('slugger_user_id', mockSluggerUserId)
      .maybeSingle();

    const dbUser = existingUser ?? {
      id: 0,
      slugger_user_id: mockSluggerUserId,
      user_name: 'Test User',
      user_role: null,
      user_team: null,
      created_at: new Date().toISOString(),
    };

    const session = await signSupabaseJwt(dbUser.id, dbUser.user_team);
    return res.status(200).json({ sluggerUserId: mockSluggerUserId, user: dbUser, session });
  }

  // ── Step 1: Validate bootstrap token ───────────────────────────────────────
  // Priority: Slugger API → payload.user forwarded from postMessage → Cognito JWT fallback
  let sluggerUser: Record<string, any> | null = null;

  // 1a. Slugger's /api/users/me — the primary path now that they send HS256 tokens
  try {
    const sluggerRes = await fetch(`${SLUGGER_API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (sluggerRes.ok) {
      const json = await sluggerRes.json();
      sluggerUser = json?.data ?? json;
    }
  } catch {
    // fall through to next option
  }

  // 1b. payload.user forwarded from the SLUGGER_AUTH postMessage
  // Slugger now includes this directly so we can use it when /api/users/me is unavailable
  if (!sluggerUser && payloadUser && typeof payloadUser.id !== 'undefined') {
    sluggerUser = payloadUser;
  }

  // 1c. Last resort: validate as Cognito RS256 JWT directly
  if (!sluggerUser) {
    sluggerUser = await validateCognitoJwt(token);
  }

  if (!sluggerUser) {
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

  // Slugger-supplied team name (comes from payload.user.teamName)
  const sluggerTeamName: string | null = sluggerUser.teamName ?? null;

  if (existing) {
    dbUser = existing;
    // Backfill name if it's still the raw UUID fallback and we now have a real name
    if (existing.user_name === sluggerUserId && userName !== sluggerUserId) {
      await supabase.from('user').update({ user_name: userName }).eq('id', existing.id);
      dbUser = { ...existing, user_name: userName };
    }
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
  // Prefer Slugger-supplied teamName; fall back to our own teams table lookup
  let teamName: string | null = sluggerTeamName;
  if (!teamName && dbUser?.user_team) {
    const { data: team } = await supabase
      .from('teams')
      .select('team_name')
      .eq('id', dbUser.user_team)
      .single();
    teamName = team?.team_name ?? null;
  }

  // ── Step 4: Sign a Supabase-compatible JWT for the client ───────────────────
  const session = await signSupabaseJwt(dbUser!.id, dbUser!.user_team);

  return res.status(200).json({
    sluggerUserId,
    user: { ...dbUser, team_name: teamName },
    session,
  });
}

/**
 * Calls Cognito's GetUser endpoint to retrieve full user profile attributes.
 * Requires only the access token — no AWS credentials needed.
 * Returns a flat attribute map (e.g. { given_name: 'John', email: '...' }) or null on failure.
 */
async function fetchCognitoUserAttributes(
  token: string,
  region: string
): Promise<Record<string, string> | null> {
  try {
    const res = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AmazonCognitoIdentityProviderService.GetUser',
      },
      body: JSON.stringify({ AccessToken: token }),
    });
    if (!res.ok) {
      console.log('[bootstrap] Cognito GetUser failed:', res.status);
      return null;
    }
    const data = await res.json() as { UserAttributes?: Array<{ Name: string; Value: string }> };
    if (!Array.isArray(data.UserAttributes)) return null;
    return Object.fromEntries(data.UserAttributes.map(({ Name, Value }) => [Name, Value]));
  } catch (e) {
    console.log('[bootstrap] Cognito GetUser error:', e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Validates a Cognito RS256 JWT by fetching the user pool's public JWKS and
 * verifying the signature. After successful validation, calls GetUser to fetch
 * the full profile (name, email) since access tokens carry only sub/username.
 * Returns a user-like object if valid, null otherwise.
 */
async function validateCognitoJwt(token: string): Promise<Record<string, any> | null> {
  try {
    // Decode payload without verification to extract issuer
    const [, payloadB64] = token.split('.');
    if (!payloadB64) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString()) as Record<string, any>;
    const iss: string = payload.iss ?? '';

    // Only accept AWS Cognito issuers; capture region for GetUser call
    const issMatch = iss.match(/^https:\/\/cognito-idp\.([a-z0-9-]+)\.amazonaws\.com\/[a-zA-Z0-9_-]+$/);
    if (!issMatch) return null;

    // Verify signature using Cognito's public JWKS
    const JWKS = createRemoteJWKSet(new URL(`${iss}/.well-known/jwks.json`));
    const { payload: verified } = await jwtVerify(token, JWKS, { issuer: iss });

    const sub = String(verified.sub ?? '');
    if (!sub) return null;

    // Fetch full profile — access tokens don't include name/email claims
    const region = issMatch[1];
    const attrs = await fetchCognitoUserAttributes(token, region);

    const username = String(
      verified['cognito:username'] ?? verified['username'] ?? verified['email'] ?? sub
    );

    const firstName = attrs?.['given_name'] ?? (verified['given_name'] as string | undefined) ?? username;
    const lastName = attrs?.['family_name'] ?? (verified['family_name'] as string | undefined);
    const email = attrs?.['email'] ?? (verified['email'] as string | undefined);

    return { id: sub, email, firstName, lastName };
  } catch {
    return null;
  }
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
