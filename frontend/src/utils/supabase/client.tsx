// Supabase client initialization for the frontend.
// - Reads Supabase URL and anon key from Vite env vars when available.
// - Falls back to a URL constructed from the autop-generated projectId.
// - Exports a singleton client used by services/api.ts.
import { createClient } from '@supabase/supabase-js@2';
import { projectId, publicAnonKey } from './info';

// Get Supabase URL from environment variable or construct from project ID
const getSupabaseUrl = (): string => {
  // Check if full URL is provided in environment (preferred)
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (envUrl) {
    console.log('🔗 Using Supabase URL from environment:', envUrl);
    return envUrl;
  }
  
  // Otherwise construct from project ID
  if (projectId) {
    const constructedUrl = `https://${projectId}.supabase.co`;
    console.log('🔗 Constructed Supabase URL from project ID:', constructedUrl);
    return constructedUrl;
  }
  
  throw new Error(
    'Supabase URL not configured.\n' +
    'Option 1: Set VITE_SUPABASE_URL in your .env file (e.g., VITE_SUPABASE_URL=https://your-project.supabase.co)\n' +
    'Option 2: Update projectId in frontend/src/utils/supabase/info.tsx'
  );
};

// Get Supabase anon key from environment variable or use from info.tsx
const getSupabaseAnonKey = (): string => {
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envKey) {
    console.log('🔑 Using Supabase anon key from environment');
    return envKey;
  }
  return publicAnonKey;
};

// Create a singleton Supabase client instance
export const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseAnonKey()
);
