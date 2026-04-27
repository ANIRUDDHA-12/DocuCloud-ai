# PROJECT_STATE: DocuCloud AI

## 🛠 The Stack
- **Frontend:** React, Vite, Tailwind CSS (Mobile Responsive).
- **Backend:** Vercel Serverless (Node.js).
- **Database/Auth:** Supabase (PostgreSQL + RLS).
- **AI Core:** Gemini 2.5 Flash (JSON-only extraction).

## 🏗 Current Architecture
- **Serverless Extraction:** `api/extract.js` downloads storage blobs via signed URLs, calls Gemini, and inserts to DB using Service Role.
- **Dual-Auth System:** API supports both Supabase JWT (Browser) and `dc_live_` prefix API Keys (External CLI).
- **Routing:** `/dashboard/overview` (KPI Cards + Uploader) vs `/dashboard/logs` (Full Archive Table).
- **HITL Modal:** `DocumentModal.jsx` provides 50/50 side-by-side OCR review and manual DB override.

## 🗄 Database Schema
### `public.documents`
- `id` (uuid, pk)
- `user_id` (uuid, fk)
- `file_url` (text)
- `vendor` (text)
- `total_amount` (numeric)
- `currency_code` (text) [NEW]
- `base_amount` (numeric) [NEW]
- `tax_amount` (numeric) [NEW]
- `tax_type` (text) [NEW]
- `date` (date)
- `category` (text)
- `confidence_score` (int)
- `raw_json` (jsonb)
- `created_at` (timestamptz)

### `public.api_keys`
- `id` (uuid, pk)
- `user_id` (uuid, fk)
- `api_key` (text, unique)
- `created_at` (timestamptz)

## 🎯 Pending Task: Phase 10
**Goal:** Financial Intelligence Engine (Multi-currency conversion & Tax breakdown).
**Targets:**
- `api/extract.js`: Update system prompt for tax/currency fields and add currency conversion logic.
- `src/components/ExtractionTable.jsx`: Add tax breakdown sub-rows/badges.
- `src/components/DocumentModal.jsx`: Add inputs for currency and tax fields.
