# ☁️ DocuCloud AI

A full-stack, AI-powered Smart Document Automation platform. **DocuCloud AI** securely ingests receipts, invoices, and utility bills (images and PDFs), automatically extracts key metadata using Google's Gemini 2.5 Flash, and presents the pipeline via a reactive, Tailwind-styled Dashboard.

## 🌟 Key Features

### 1. 🧠 Serverless AI Extraction Pipeline
- **Smart Parsing:** Upload images (`.jpeg`, `.png`, `.webp`) or documents (`.pdf`) and watch Google Gemini 2.5 Flash instantly parse unstructured text into highly accurate JSON.
- **Vercel Serverless Function:** Built on `api/extract.js`. It securely streams files via 60-second perishable Signed URLs directly to the LLM, entirely bypassing the client.
- **Data Extracted:** Automatically captures `vendor`, `total_amount`, `date`, and assigns one of 8 strict `categories`.

### 2. 🛡️ Enterprise-Grade Security
- **Supabase JWT Auth:** Hardened `ProtectedRoute.jsx` UI routing tied natively to Supabase User Sessions.
- **Row Level Security (RLS):** Every database row and storage bucket blob is cryptographically isolated. Users mathematically cannot view, edit, or delete documents they do not own.
- **Role-based Service Keys:** The frontend never handles Gemini keys. The Vercel `/api` route handles Server-to-Server Supabase Admin logic for trusted database writes.

### 3. 🔑 Developer API Keys
- Want to automate uploads via cURL or a Python script? Generate secure `dc_live_***` cryptographic API keys tied to your account from the dashboard.
- The same `/api/extract` serverless function features "Dual Auth" routing. It seamlessly accepts either browser JWTs or developer API Keys in the Authorization header.

### 4. 👨‍💻 Human-In-The-Loop (HITL) Viewer
- **Confidence Scoring:** The AI dynamically grades its own extraction certainty (0-100%). Anything below 85% scores a `Needs Review` badge.
- **Side-by-Side Verification:** Click "Review" on any document to open the HITL modal. View the original receipt side-by-side with an editable data form to manually override any AI mistakes.

### 5. 📊 Real-Time Analytics & UX Polish
- **Action Overview:** A dedicated landing page featuring 3 auto-calculating metric cards (Total Volume, Processed Count, System Accuracy) and the master drag-and-drop uploader.
- **Historical Data Logs:** A blazing-fast, searchable data table.
- **Bulk CSV Export:** Download your filtered pipeline data instantly to Excel via native Blob URLs. 
- **Mobile First:** Carefully crafted Tailwind classes ensure the UI flows flawlessly onto iPhones via sliding sidebar drawers and horizontally scrollable tables.

---

## 🚀 Quick Setup Guide

### Prerequisites
1. Node.js 18+
2. A free [Supabase](https://supabase.com) Project
3. A free [Google Gemini API](https://aistudio.google.com/) Key

### 1. Database Setup
Execute the following SQL commands in your Supabase SQL Editor:

```sql
-- 1. Create the Core Documents Table
CREATE TABLE public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  vendor TEXT,
  total_amount NUMERIC(10, 2),
  date DATE,
  category TEXT,
  raw_json JSONB,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_own_documents ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_documents ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_documents ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY delete_own_documents ON public.documents FOR DELETE USING (auth.uid() = user_id);

-- 2. Create the API Keys Table
CREATE TABLE public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_own_apikeys ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_apikeys ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY delete_own_apikeys ON public.api_keys FOR DELETE USING (auth.uid() = user_id);
```

### 2. Storage Setup
1. Create a **Private** Storage Bucket named exactly `user-documents`.
2. Apply the following Storage RLS Policies:
   - **Uploads:** `bucket_id = 'user-documents' AND (uid() = owner)`
   - **Reads:** `bucket_id = 'user-documents' AND (uid() = owner)`

### 3. Environment Variables
Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-public-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-secret-service-role-key"
GEMINI_API_KEY="your-gemini-api-key"
```

### 4. Start the Application
Because we use Vercel Serverless Functions (`api/extract.js`), you MUST start the app using the Vercel CLI, not Vite directly:

```bash
npm install
npm install -g vercel

# Starts BOTH the React Frontend (5173) and the Node.js API Backend
vercel dev
```

---

## 📂 Architecture Mapping

- `src/App.jsx` — React Router map enforcing strict `/` and `*` redirect paths.
- `src/components/ProtectedRoute.jsx` — Supabase UI guard rails preventing unauthenticated access.
- `api/extract.js` — The trusted Node.js server. Validates auth, downloads files securely, queries Google Gemini, strips markdown, verifies JSON shapes, and inserts data into Supabase `user-documents` using Service Role override magic.
- `src/components/Uploader.jsx` — Generates exact 60-second signed URLs so the API backend can seamlessly read files without exposing long-term permissions to the web.
- `src/pages/Dashboard.jsx` — Central command for reviewing document table data. Responsive overflow states applied for mobile native flows.
- `src/pages/Overview.jsx` — Central command orchestrator hosting the drag-and-drop Uploader + Dynamic KPI Cards summing Total Currency Amounts via map reducing techniques. 
- `src/components/ExtractionTable.jsx` — Employs custom array mapping and string normalization to power the front-end "CSV Export" without heavy API reliance.
- `src/components/DocumentModal.jsx` — Human-In-The-Loop system side-by-side editing tool supporting dynamic database row updates on-the-fly.
