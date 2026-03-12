/**
 * @fileoverview Serverless AI Extraction Function — DocuCloud AI
 *
 * POST /api/extract
 *
 * Security contract:
 *   - Frontend must send: Authorization: Bearer <supabase_access_token>
 *   - Frontend must send body: { "file_url": "https://..." }
 *   - user_id is NEVER trusted from the client. It is derived server-side
 *     by verifying the JWT with the service_role key.
 *
 * Flow:
 *   1. Validate method (POST only)
 *   2. Extract + verify JWT → get real user_id
 *   3. Validate file_url from body
 *   4. Download image + convert to base64
 *   5. Call Gemini 1.5 Flash for structured extraction
 *   6. Strip markdown fences + parse JSON
 *   7. Validate extracted fields
 *   8. Insert row into Supabase documents table
 *   9. Return extracted data to client
 *
 * @module api/extract
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { stripMarkdownJson } from './_utils/strip-json.js';

// ─────────────────────────────────────────────────────────────
// Environment Validation — fail at cold-start, not mid-request
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
  throw new Error(
    '[DocuCloud AI] api/extract.js: Missing one or more required env vars.\n' +
    '  Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY'
  );
}

// ─────────────────────────────────────────────────────────────
// Supabase admin client (service role — used only for auth verify + insert)
// ─────────────────────────────────────────────────────────────

/** @type {import('@supabase/supabase-js').SupabaseClient} */
const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ─────────────────────────────────────────────────────────────
// Gemini client
// ─────────────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ─────────────────────────────────────────────────────────────
// Gemini system prompt — strict JSON enforcement
// ─────────────────────────────────────────────────────────────

const EXTRACTION_PROMPT = `You are a document data extraction engine.
Analyze the provided receipt or invoice image and extract the following fields.
Return ONLY a single, raw, valid JSON object with NO markdown, NO explanation, NO surrounding text.

Required JSON shape:
{
  "vendor": "<string: business name, or null if not found>",
  "total_amount": <number: final total as a float, or null if not found>,
  "date": "<string: date in YYYY-MM-DD format, or null if not found>",
  "category": "<string: one of Food, Transport, Utilities, Shopping, Healthcare, Entertainment, Other>",
  "confidence_score": <integer: 0 to 100>
}

Assess your own certainty for this extraction. If the text is perfectly clear and all fields are confident, 90-100. If blurry, handwritten, or missing fields, lower the score proportionally.`;

// ─────────────────────────────────────────────────────────────
// CORS headers — required for browser → API communication
// ─────────────────────────────────────────────────────────────

/** @param {import('http').ServerResponse} res */
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ─────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────

/**
 * Downloads an image from a URL and converts it to base64.
 * Uses Node 18+ native fetch — no node-fetch required.
 *
 * @param {string} url - Public URL of the image to download.
 * @returns {Promise<{ base64: string, mimeType: string }>}
 * @throws {Error} If the fetch fails or content-type is not an image.
 */
async function imageUrlToBase64(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const mimeType = contentType.split(';')[0].trim();
  const allowedTypes = [
    'image/jpeg', 
    'image/png', 
    'image/webp', 
    'image/gif', 
    'application/pdf'
  ];

  if (!allowedTypes.includes(mimeType)) {
    throw new Error(
      `Unsupported file type: "${mimeType}". Please upload an image (JPEG, PNG, WebP) or a PDF.`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  return { base64, mimeType };
}

/**
 * Validates that the Gemini-extracted JSON has all required fields.
 *
 * @param {object} data - Parsed JSON from Gemini.
 * @returns {{ valid: boolean, missing: string[] }}
 */
function validateExtractedFields(data) {
  const required = ['vendor', 'total_amount', 'date', 'category', 'confidence_score'];
  const missing = required.filter((key) => !(key in data));
  return { valid: missing.length === 0, missing };
}

// ─────────────────────────────────────────────────────────────
// Main Handler
// ─────────────────────────────────────────────────────────────

/**
 * Vercel Serverless Function handler for POST /api/extract
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export default async function handler(req, res) {
  setCORSHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Step 1: Method guard
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Step 2: Extract + verify JWT → get real user_id
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        error: 'Missing Authorization header. Expected: Bearer <supabase_access_token>',
      });
    }

    let user_id;

    if (token.startsWith('dc_')) {
      // API Key Logic
      const { data: keyData, error: keyError } = await adminSupabase
        .from('api_keys')
        .select('user_id')
        .eq('api_key', token)
        .single();

      if (keyError || !keyData) {
        return res.status(401).json({ error: 'Invalid or revoked API Key.' });
      }
      user_id = keyData.user_id;

    } else {
      // JWT Session Logic
      const { data: { user }, error: authError } = await adminSupabase.auth.getUser(token);

      if (authError || !user) {
        return res.status(401).json({
          error: 'Invalid or expired session token. Please log in again.',
        });
      }
      user_id = user.id; // Authoritative. Never use client-provided user_id.
    }

    // Step 3: Validate file_url from body
    const { file_url } = req.body || {};

    if (!file_url || typeof file_url !== 'string') {
      return res.status(400).json({ error: 'Missing required field: file_url (string).' });
    }

    if (!file_url.startsWith('https://')) {
      return res.status(400).json({ error: 'file_url must be an https:// URL.' });
    }

    // Step 4: Download image + convert to base64
    let imageData;
    try {
      imageData = await imageUrlToBase64(file_url);
    } catch (err) {
      return res.status(400).json({ error: `Image download failed: ${err.message}` });
    }

    // Step 5: Call Gemini 2.5 Flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      EXTRACTION_PROMPT,
      {
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.base64,
        },
      },
    ]);

    const rawText = result.response.text();

    // Step 6: Strip markdown fences + parse JSON
    let extracted;
    try {
      const cleanJson = stripMarkdownJson(rawText);
      extracted = JSON.parse(cleanJson);
    } catch {
      return res.status(422).json({
        error: 'Gemini returned a response that could not be parsed as JSON.',
        raw_response: rawText,
      });
    }

    // Step 7: Validate extracted fields
    const { valid, missing } = validateExtractedFields(extracted);
    if (!valid) {
      return res.status(422).json({
        error: `Gemini response is missing required fields: ${missing.join(', ')}`,
        raw_response: rawText,
      });
    }

    // Step 8: Insert row into Supabase documents table
    const { data: inserted, error: dbError } = await adminSupabase
      .from('documents')
      .insert({
        user_id,
        file_url,
        vendor:           extracted.vendor           ?? null,
        total_amount:     extracted.total_amount      ?? null,
        date:             extracted.date              ?? null,
        category:         extracted.category          ?? null,
        confidence_score: extracted.confidence_score  ?? null,
        raw_json:         extracted,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[extract] Supabase insert error:', dbError);
      return res.status(500).json({
        error: 'Database insert failed.',
        detail: dbError.message,
      });
    }

    // Step 9: Return structured data to client
    return res.status(200).json({
      success: true,
      data: inserted,
    });

  } catch (err) {
    // Catch-all for unexpected errors (network timeouts, Gemini API errors, etc.)
    console.error('[extract] Unhandled error:', err);
    return res.status(500).json({
      error: 'Internal server error.',
      detail: err.message,
    });
  }
}
