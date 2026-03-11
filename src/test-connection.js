/**
 * @fileoverview Supabase Connection Sanity Check — DocuCloud AI
 *
 * Run this script to verify that your Supabase credentials are valid
 * and the `documents` table is accessible before you start the dev server.
 *
 * Usage:
 *   node --env-file=.env.local src/test-connection.js
 *
 * Expected output on success:
 *   ✅ Supabase connection verified. The `documents` table is accessible.
 *
 * @module test-connection
 */

import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────
// Env Var Guard (Node.js version — process.env, not import.meta)
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  console.error('\n❌ Missing VITE_SUPABASE_URL in .env.local\n');
  process.exit(1);
}
if (!SUPABASE_URL.startsWith('https://') || !SUPABASE_URL.includes('.supabase.co')) {
  console.error(`\n❌ Invalid VITE_SUPABASE_URL: "${SUPABASE_URL}"\n   Expected: https://xxx.supabase.co\n`);
  process.exit(1);
}
if (!SUPABASE_ANON_KEY) {
  console.error('\n❌ Missing VITE_SUPABASE_ANON_KEY in .env.local\n');
  process.exit(1);
}
const isValidAnonKey =
  SUPABASE_ANON_KEY.startsWith('eyJ') ||
  SUPABASE_ANON_KEY.startsWith('sb_publishable_');
if (!isValidAnonKey) {
  console.error('\n❌ Invalid VITE_SUPABASE_ANON_KEY — must start with "eyJ" (JWT) or "sb_publishable_"\n');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// Create a temporary client just for testing
// ─────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Pings the Supabase `documents` table to verify the connection.
 *
 * @async
 * @returns {Promise<void>}
 */
async function testConnection() {
  console.log('\n🔄 Testing Supabase connection...');
  console.log(`   URL: ${SUPABASE_URL}`);

  try {
    const { count, error, status } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    if (error) {
      // RLS will cause a 401 if not authenticated — that is expected behaviour.
      // A 401/403 still proves the table EXISTS and the connection works.
      if (status === 401 || status === 403 || error.code === 'PGRST301') {
        console.log(
          '\n✅ Supabase connection verified.\n' +
          '   The `documents` table exists. (RLS blocked anonymous access — this is correct!)\n'
        );
        process.exit(0);
      }

      // Any other error is a real problem
      throw new Error(`Supabase query error [${status}]: ${error.message}`);
    }

    console.log(
      '\n✅ Supabase connection verified. The `documents` table is accessible.\n' +
      `   Rows visible to this session: ${count ?? 0}\n`
    );
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Connection test FAILED.\n   ', err.message, '\n');
    console.error(
      '   Troubleshooting tips:\n' +
      '   1. Check that VITE_SUPABASE_URL is your correct project URL.\n' +
      '   2. Check that VITE_SUPABASE_ANON_KEY is from Settings → API.\n' +
      '   3. Make sure the `documents` table was created via schema.sql.\n' +
      '   4. Verify your internet connection.\n'
    );
    process.exit(1);
  }
}

testConnection();
