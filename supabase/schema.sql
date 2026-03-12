-- =============================================================================
-- DocuCloud AI — Master SQL Schema & RLS Script
-- Run this ONCE in your Supabase SQL Editor.
-- Safe to re-run: all statements use IF NOT EXISTS / DO blocks.
-- =============================================================================


-- ============================================================
-- SECTION 1: documents TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.documents (
  id            UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url      TEXT          NOT NULL CHECK (char_length(file_url) <= 2048),
  vendor        TEXT,
  total_amount  NUMERIC(10, 2) CHECK (total_amount >= 0),
  date          DATE,
  category      TEXT          CHECK (char_length(category) <= 100),
  confidence_score INTEGER      CHECK (confidence_score >= 0 AND confidence_score <= 100),
  raw_json      JSONB,
  created_at    TIMESTAMPTZ   DEFAULT now() NOT NULL
);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);


-- ============================================================
-- SECTION 2: ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- SELECT: users can only read their own documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'documents' AND policyname = 'select_own_documents'
  ) THEN
    CREATE POLICY select_own_documents ON public.documents
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- INSERT: users can only insert rows for themselves
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'documents' AND policyname = 'insert_own_documents'
  ) THEN
    CREATE POLICY insert_own_documents ON public.documents
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- UPDATE: users can only update their own rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'documents' AND policyname = 'update_own_documents'
  ) THEN
    CREATE POLICY update_own_documents ON public.documents
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- DELETE: users can only delete their own rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'documents' AND policyname = 'delete_own_documents'
  ) THEN
    CREATE POLICY delete_own_documents ON public.documents
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;


-- ============================================================
-- SECTION 3: STORAGE BUCKET — user-documents
-- ============================================================

-- Create the bucket (private — requires signed URLs or RLS to access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- SECTION 4: STORAGE RLS POLICIES
-- ============================================================

-- UPLOAD: authenticated users can upload to their own folder only
--   Folder structure enforced: user-documents/{user_id}/filename
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_insert_own_files'
  ) THEN
    CREATE POLICY storage_insert_own_files ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'user-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END
$$;

-- SELECT: authenticated users can only view their own uploaded files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_select_own_files'
  ) THEN
    CREATE POLICY storage_select_own_files ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'user-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END
$$;

-- DELETE: authenticated users can delete their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_delete_own_files'
  ) THEN
    CREATE POLICY storage_delete_own_files ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'user-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END
$$;


-- ============================================================
-- VERIFICATION QUERIES (run after the above to confirm)
-- ============================================================
-- SELECT * FROM pg_tables WHERE tablename = 'documents';
-- SELECT * FROM pg_policies WHERE tablename = 'documents';
-- SELECT * FROM storage.buckets WHERE id = 'user-documents';
-- SELECT * FROM pg_policies WHERE tablename = 'objects';
