// Frontend service for the dues API.
// All calls pass the Supabase session access_token as a Bearer token
// so the serverless functions can verify the caller's identity.
import { supabase } from '../../utils/supabase/client';

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${session.access_token}` };
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeader = await getAuthHeader();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface PlayerEntry {
  userId: number;
  amount: number;
}

export interface SendDuesInput {
  visitingTeamId: number;
  players: PlayerEntry[];
  note?: string;
}

export interface DuesRow {
  id: number;
  batch_id: number;
  player_user_id: number;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paid_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  user?: { user_name: string | null };
}

export interface DuesBatch {
  id: number;
  visiting_team_id: number;
  amount_per_player: number;
  note: string | null;
  created_at: string;
  teams?: { team_name: string };
  dues: DuesRow[];
}

export interface MyDuesRow {
  id: number;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paid_at: string | null;
  created_at: string;
  dues_batch: {
    note: string | null;
    created_at: string;
    user: { user_name: string | null } | null;
    teams: { team_name: string } | null;
  } | null;
}

// ── API calls ──────────────────────────────────────────────────────────────

export const duesApi = {
  /** CM: create a dues batch for a visiting team's players */
  sendDues: (input: SendDuesInput): Promise<{ batchId: number; count: number }> =>
    apiFetch('/api/dues/send', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  /** CM: fetch all sent batches with per-player status */
  getBatches: (): Promise<DuesBatch[]> =>
    apiFetch('/api/dues/batch'),

  /** Player: fetch all dues owed to them */
  getMyDues: (): Promise<MyDuesRow[]> =>
    apiFetch('/api/dues/my'),

  /** Player: get the Stripe Checkout URL for a pending dues item */
  getCheckoutUrl: (duesId: number): Promise<{ url: string }> =>
    apiFetch(`/api/dues/${duesId}/checkout`, { method: 'POST' }),

  /** CM: cancel a pending dues item */
  cancelDue: (duesId: number): Promise<{ cancelled: boolean }> =>
    apiFetch(`/api/dues/${duesId}/cancel`, { method: 'POST' }),
};
