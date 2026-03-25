// Supabase client initialization for the frontend.
// - Reads Supabase URL and anon key from Vite env vars when available.
// - Falls back to a URL constructed from the autop-generated projectId.
// - Exports a singleton client used by services/api.ts.
import { createClient } from '@supabase/supabase-js@2';
import { projectId } from './info';

// Get Supabase URL from environment variable or construct from project ID
const getSupabaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (envUrl) return envUrl;

  if (projectId) return `https://${projectId}.supabase.co`;

  throw new Error(
    'Supabase URL not configured. Set VITE_SUPABASE_URL in your .env file.'
  );
};

const getSupabaseAnonKey = (): string => {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!key) throw new Error('VITE_SUPABASE_ANON_KEY is required. Set it in your .env file.');
  return key;
};

// Create a singleton Supabase client instance
export const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseAnonKey()
);
