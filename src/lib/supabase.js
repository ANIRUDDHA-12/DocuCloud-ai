/**
 * @fileoverview Supabase client singleton for DocuCloud AI.
 *
 * This module initializes and exports a single shared Supabase client.
 * It performs eager environment variable validation at module load time,
 * so missing config will throw immediately — not silently later in a user flow.
 *
 * @module lib/supabase
 */

import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────
// Environment Variable Guard
// Fails fast with a descriptive error if config is missing.
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  throw new Error(
    '[DocuCloud AI] Missing environment variable: VITE_SUPABASE_URL\n' +
    'Please create a .env.local file and add your Supabase project URL.\n' +
    'See .env.example for the required format.'
  );
}

// Guard: URL must look like a real Supabase project URL
if (!SUPABASE_URL.startsWith('https://') || !SUPABASE_URL.includes('.supabase.co')) {
  throw new Error(
    '[DocuCloud AI] Invalid VITE_SUPABASE_URL format.\n' +
    `   Got: "${SUPABASE_URL}"\n` +
    '   Expected format: https://your-project-ref.supabase.co\n' +
    '   Check that you have not accidentally swapped the URL and Anon Key.'
  );
}

if (!SUPABASE_ANON_KEY) {
  throw new Error(
    '[DocuCloud AI] Missing environment variable: VITE_SUPABASE_ANON_KEY\n' +
    'Please create a .env.local file and add your Supabase anon/public key.\n' +
    'See .env.example for the required format.'
  );
}

// Guard: anon key must be a JWT (starts with 'eyJ') or new publishable key (starts with 'sb_publishable_')
const isValidAnonKey =
  SUPABASE_ANON_KEY.startsWith('eyJ') ||
  SUPABASE_ANON_KEY.startsWith('sb_publishable_');

if (!isValidAnonKey) {
  throw new Error(
    '[DocuCloud AI] Invalid VITE_SUPABASE_ANON_KEY format.\n' +
    '   Expected a JWT (starts with "eyJ") or publishable key (starts with "sb_publishable_").\n' +
    '   Check Settings → API → anon public key in your Supabase dashboard.'
  );
}

// ─────────────────────────────────────────────────────────────
// Supabase Client Singleton
// ─────────────────────────────────────────────────────────────

/**
 * The initialized Supabase client instance.
 * Import this wherever you need to interact with the database,
 * storage, or authentication APIs.
 *
 * @type {import('@supabase/supabase-js').SupabaseClient}
 *
 * @example
 * import { supabase } from '../lib/supabase';
 * const { data, error } = await supabase.from('documents').select('*');
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Persist the user's session across page refreshes using localStorage.
    persistSession: true,
    // Automatically refresh the JWT before it expires.
    autoRefreshToken: true,
    // Detect OAuth redirects automatically.
    detectSessionInUrl: true,
  },
});
