-- =============================================================================
-- Migration 0003: Storage bucket configuration
-- Project: MobiGear WhatsApp Store
-- Stage:   2 — Data Foundation
--
-- Run order: 3 of 3 (after 0002_rls.sql)
--
-- Creates:
--   • product-images bucket — public read, owner-only write
--
-- Storage policies in Supabase use the storage.objects table.
-- Policies reference auth.uid() and our is_owner() helper.
--
-- Plain-English access rules:
--   PUBLIC VIEWING:   Anyone (including anonymous users and Google/CDN caches)
--                     may retrieve any file from this bucket by URL.
--   OWNER UPLOAD:     Only the authorized store owner may PUT (upload) files.
--   OWNER DELETE:     Only the authorized store owner may DELETE files.
--   OWNER LIST:       Only the owner may list bucket contents.
--
-- File restrictions (enforced at application layer in server actions;
-- Supabase storage size limits must be set in the Supabase dashboard):
--   • Accepted MIME types: image/jpeg, image/png, image/webp
--   • Maximum file size:   5 MB
--   • Path convention:     products/<product_uuid>/<filename>
--   • Max 8 images per product (enforced by product_images trigger in 0001)
--
-- NOTE: The Supabase dashboard / CLI must also set:
--   file_size_limit  = 5242880  (5 MB in bytes)
--   allowed_mime_types = ['image/jpeg', 'image/png', 'image/webp']
-- Those settings cannot be configured through a plain SQL migration; they
-- require the Supabase management API or dashboard. See README-STAGE2.md.
-- =============================================================================

-- ─── Create the product-images storage bucket ─────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',          -- bucket id (used in all storage API calls)
  'product-images',          -- display name
  true,                      -- public = anyone may GET files by URL
  5242880,                   -- 5 MB in bytes (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── RLS on storage.objects (Supabase Storage) ───────────────────────────────
-- The storage.objects table uses (bucket_id, name) as its composite key.
-- All policies must filter on bucket_id = 'product-images'.

-- PUBLIC READ — anyone (anon + authenticated) may download product images
DROP POLICY IF EXISTS "product_images_public_read"  ON storage.objects;
CREATE POLICY "product_images_public_read"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');

-- OWNER UPLOAD — only authorized owners may upload new images
DROP POLICY IF EXISTS "product_images_owner_insert" ON storage.objects;
CREATE POLICY "product_images_owner_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND private.is_owner()
    -- Enforce path convention: must start with "products/"
    AND (storage.foldername(name))[1] = 'products'
  );

-- OWNER REPLACE — owner may overwrite an existing file (PUT/upsert)
DROP POLICY IF EXISTS "product_images_owner_update" ON storage.objects;
CREATE POLICY "product_images_owner_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND private.is_owner()
    AND (storage.foldername(name))[1] = 'products'
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND private.is_owner()
    AND (storage.foldername(name))[1] = 'products'
  );

-- OWNER DELETE — only the owner may delete images
DROP POLICY IF EXISTS "product_images_owner_delete" ON storage.objects;
CREATE POLICY "product_images_owner_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND private.is_owner()
  );

-- OWNER LIST — only the owner may list bucket contents
DROP POLICY IF EXISTS "product_images_owner_list"   ON storage.objects;
CREATE POLICY "product_images_owner_list"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND private.is_owner()
  );

-- ─── Disable public sign-up ───────────────────────────────────────────────────
-- This cannot be done through SQL alone; it must be configured in the Supabase
-- dashboard under Authentication → Providers → Email → "Enable email sign-ups".
-- Turning that off means only the owner account (created by the admin) can log
-- in; random visitors cannot create accounts at all.
-- See README-STAGE2.md for the manual step required.
