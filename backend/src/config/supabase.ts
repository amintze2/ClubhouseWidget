// Supabase client initialization for the backend (Express server).
// - Reads SUPABASE_URL and SUPABASE_ANON_KEY from backend/.env.
// - Used by route handlers to query and mutate the database.
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file from the backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.\n' +
    'Make sure your .env file is in the backend directory and contains:\n' +
    'SUPABASE_URL=your_url_here\n' +
    'SUPABASE_ANON_KEY=your_key_here'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

