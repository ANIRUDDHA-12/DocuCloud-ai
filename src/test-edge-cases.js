/**
 * @fileoverview Phase 2 Edge Case Test Suite — DocuCloud AI
 *
 * Automatically tests the error handling and security boundaries of the
 * /api/extract Serverless Function.
 *
 * Prerequisites:
 *   1. `npx vercel dev` running at http://localhost:3000
 *   2. Valid TEST_EMAIL and TEST_PASSWORD in .env.local
 *
 * Usage:
 *   node --env-file=.env.local src/test-edge-cases.js
 *
 * @module test-edge-cases
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const TEST_EMAIL        = process.env.TEST_EMAIL;
const TEST_PASSWORD     = process.env.TEST_PASSWORD;
const API_URL           = 'http://localhost:3000/api/extract';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !TEST_EMAIL || !TEST_PASSWORD) {
  console.error('❌ Missing env vars (Need Supabase config + TEST_EMAIL/TEST_PASSWORD).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Dummy valid image for tests that need it
const VALID_IMAGE = 'https://ocr.space/Content/Images/receipt-ocr-original.jpg';

/** Helper to call the API and return the status + JSON */
async function callApi(body, token = null, method = 'POST') {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_URL, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try { json = await res.json(); } catch (e) {}

  return { status: res.status, json };
}

async function runTests() {
  console.log('\n🧪 DocuCloud AI — Edge Case Security Suite\n');

  // Step 1: Get real token for tests that need auth
  console.log('🔐 Authenticating test user...');
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (signInError || !authData.session) {
    console.error(`❌ Setup failed: ${signInError?.message}`);
    process.exit(1);
  }
  const token = authData.session.access_token;
  let passedCount = 0;
  let totalCount = 0;

  const runTest = async (name, expectedStatus, apiCall) => {
    totalCount++;
    process.stdout.write(`⏳ Test ${totalCount}: ${name}... `);
    try {
      const { status, json } = await apiCall();
      if (status === expectedStatus) {
        console.log(`✅ Passed (${status})`);
        passedCount++;
      } else {
        console.log(`❌ Failed`);
        console.log(`   Expected ${expectedStatus}, got ${status}`);
        console.log(`   Response: ${JSON.stringify(json)}`);
      }
    } catch (e) {
      console.log(`❌ Crashed: ${e.message}`);
    }
  };

  console.log('--------------------------------------------------');

  // Test 1: Wrong Method
  await runTest('Should reject GET requests', 405, () =>
    callApi(null, token, 'GET')
  );

  // Test 2: Missing Auth
  await runTest('Should reject missing Authorization header', 401, () =>
    callApi({ file_url: VALID_IMAGE }, null)
  );

  // Test 3: Invalid Token
  await runTest('Should reject invalid JWT token', 401, () =>
    callApi({ file_url: VALID_IMAGE }, 'Bearer eyJinvalid123')
  );

  // Test 4: Missing body.file_url
  await runTest('Should reject missing file_url in body', 400, () =>
    callApi({ wrong_key: VALID_IMAGE }, token)
  );

  // Test 5: Non-HTTPS URL
  await runTest('Should reject non-HTTPS file_url', 400, () =>
    callApi({ file_url: 'http://insecure.com/image.jpg' }, token)
  );

  // Test 6: Non-image file (PDF)
  await runTest('Should reject non-image files (PDF)', 400, () =>
    callApi({ file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }, token)
  );

  // Test 7: IDOR / Privilege Escalation Attempt
  // This verifies that passing a forged user_id in the body does absolutely nothing.
  // We expect a 200, but the row should be inserted under the TRUE user ID from the token,
  // NOT the forged one. (To fully automate the check we'd verify the DB, but a 200 without error is a good start)
  totalCount++;
  process.stdout.write(`⏳ Test ${totalCount}: Should ignore forged user_id in body (IDOR protection)... `);
  const forgeRes = await callApi({ file_url: VALID_IMAGE, user_id: '12345-forged-uuid' }, token);
  if (forgeRes.status === 200 && forgeRes.json.data.user_id !== '12345-forged-uuid') {
    console.log(`✅ Passed (Row saved under true JWT user_id: ${forgeRes.json.data.user_id})`);
    passedCount++;
  } else {
    console.log(`❌ Failed`);
    console.log(`   Row was either Rejected or saved under the Wrong ID!`, forgeRes.json);
  }

  console.log('--------------------------------------------------');
  console.log(`🏁 Results: ${passedCount}/${totalCount} Edge Case Tests Passed.\n`);
  
  if (passedCount !== totalCount) process.exit(1);
}

runTests();
