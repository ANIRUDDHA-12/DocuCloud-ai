/**
 * @fileoverview Phase 2 Integration Test — DocuCloud AI
 *
 * Tests the full AI pipeline: auth → upload → /api/extract → DB insert.
 *
 * Prerequisites:
 *   1. Run `npx vercel dev` in a separate terminal (starts both Vite + API)
 *   2. Ensure .env.local has all required keys
 *   3. Ensure a real user account exists in your Supabase project
 *
 * Usage:
 *   node --env-file=.env.local src/test-ai.js
 *
 * @module test-ai
 */

import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────
// Config — reads from .env.local via --env-file flag
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL      = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const API_URL           = 'http://localhost:3000/api/extract';

// A real receipt image (publicly accessible) for Gemini to analyze
// Source: a sample Walmart receipt image from a public test dataset
const TEST_IMAGE_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/ReceiptSwiss.jpg/220px-ReceiptSwiss.jpg';

// ─────────────────────────────────────────────────────────────
// Env guard
// ─────────────────────────────────────────────────────────────

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('\n❌ Missing env vars. Run with: node --env-file=.env.local src/test-ai.js\n');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// Prompt user for test credentials
// (Uses env vars TEST_EMAIL and TEST_PASSWORD if set, otherwise exits cleanly)
// ─────────────────────────────────────────────────────────────

const TEST_EMAIL    = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

if (!TEST_EMAIL || !TEST_PASSWORD) {
  console.error(
    '\n❌ Test credentials not set.\n' +
    '   Add to .env.local:\n' +
    '     TEST_EMAIL=your-test-user@example.com\n' +
    '     TEST_PASSWORD=your-test-password\n'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─────────────────────────────────────────────────────────────
// Main test runner
// ─────────────────────────────────────────────────────────────

/**
 * Runs the full Phase 2 integration test.
 * @async
 * @returns {Promise<void>}
 */
async function runTest() {
  console.log('\n══════════════════════════════════════════');
  console.log('  DocuCloud AI — Phase 2 Integration Test');
  console.log('══════════════════════════════════════════\n');

  // Step 1: Authenticate
  console.log('🔐 Step 1: Signing in to Supabase...');
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (signInError || !authData.session) {
    console.error(`❌ Sign-in failed: ${signInError?.message}`);
    process.exit(1);
  }

  const { access_token, user } = authData.session;
  console.log(`✅ Authenticated as: ${user.email} (id: ${user.id})\n`);

  // Step 2: Call /api/extract
  console.log('🤖 Step 2: Calling POST /api/extract ...');
  console.log(`   Image URL: ${TEST_IMAGE_URL}`);
  console.log(`   API endpoint: ${API_URL}\n`);

  let response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify({ file_url: TEST_IMAGE_URL }),
    });
  } catch (err) {
    console.error(
      '\n❌ Could not reach the API endpoint.\n' +
      '   Is `npx vercel dev` running in a separate terminal?\n' +
      `   Error: ${err.message}\n`
    );
    process.exit(1);
  }

  // Step 3: Parse + display response
  const json = await response.json();

  if (!response.ok) {
    console.error(`❌ API returned ${response.status}:`);
    console.error(JSON.stringify(json, null, 2));
    process.exit(1);
  }

  console.log('✅ Gemini extraction complete!\n');
  console.log('📋 Extracted Data:');
  console.log('   Vendor       :', json.data.vendor);
  console.log('   Total Amount :', json.data.total_amount);
  console.log('   Date         :', json.data.date);
  console.log('   Category     :', json.data.category);
  console.log('\n📄 Full Supabase row inserted:');
  console.log(JSON.stringify(json.data, null, 2));
  console.log('\n✅ Phase 2 integration test PASSED.\n');
}

runTest().catch((err) => {
  console.error('❌ Unexpected test error:', err.message);
  process.exit(1);
});
