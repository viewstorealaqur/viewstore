-- =============================================================================
-- Migration 0002: Row Level Security + grants
-- Project: MobiGear WhatsApp Store
-- Stage:   2 — Data Foundation
--
-- Run order: 2 of 3 (after 0001_schema.sql)
--
-- Plain-English summary of access rules
-- ────────────────────────────────────────────────────────────────────────────
-- ANONYMOUS VISITORS (anon role / public internet):
--   • May SELECT rows from `products`      only when published = true
--   • May SELECT rows from `store_settings` (the singleton row is public)
--   • May NOT INSERT, UPDATE, or DELETE anything in any table
--   • May SELECT product_images metadata only for published products
--   • May NOT read draft/unpublished products
--
-- OWNER (authenticated, uid matches the owner_id in the owners table):
--   • May SELECT, INSERT, UPDATE, DELETE on products (all rows, incl. drafts)
--   • May SELECT, INSERT, UPDATE, DELETE on product_images
--   • May SELECT and UPDATE store_settings
--   • May NOT INSERT or DELETE store_settings (singleton must always exist)
--
-- HOW OWNER IDENTITY IS PROVEN (security note):
--   We use a separate `owners` table whose rows are inserted only by a
--   privileged database administrator, never by the user themselves. The authenticated
--   user's auth.uid() is checked against owners.user_id.
--   This is intentionally NOT done via user_metadata or app_metadata —
--   those fields are writable by the user and must not be used for
--   authorization decisions.
--
-- =============================================================================

-- ─── Owner identity table ────────────────────────────────────────────────────
-- Only rows inserted by a privileged database administrator count as
-- authorized owners. Users cannot INSERT into this table themselves.
CREATE TABLE IF NOT EXISTS owners (
  -- The Supabase Auth user UUID of the store owner
  user_id     uuid         PRIMARY KEY,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

COMMENT ON TABLE owners IS
  'Authorized store owners. Rows are inserted only by a database administrator, '
  'never by the end-user. DO NOT expose an insert endpoint for this table.';

-- ─── Helper function: is_owner() ──────────────────────────────────────────────
-- Returns true when the calling session's JWT uid is in the owners table.
-- SECURITY DEFINER runs with the table owner's privileges so it can always
-- check the owners table, even if anon cannot SELECT it.
-- search_path is fixed to prevent function-injection attacks.
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.owners WHERE user_id = (SELECT auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION private.is_owner() FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_owner() TO authenticated;

COMMENT ON FUNCTION private.is_owner() IS
  'Returns true if the current auth.uid() is a registered store owner. '
  'Used as the owner predicate in all RLS policies. '
  'SECURITY DEFINER — never expose this function via PostgREST.';

-- ─── Revoke default public grants ────────────────────────────────────────────
-- Supabase grants SELECT on public tables to anon/authenticated by default via
-- the public schema. We reset and grant explicitly so the grants are explicit
-- and documented alongside the policies.

-- products
REVOKE ALL ON TABLE public.products       FROM anon, authenticated;
REVOKE ALL ON TABLE public.product_images FROM anon, authenticated;
REVOKE ALL ON TABLE public.store_settings FROM anon, authenticated;
REVOKE ALL ON TABLE public.owners         FROM anon, authenticated;

-- ─── Explicit grants ─────────────────────────────────────────────────────────
-- anon: read-only, policies below narrow what they can actually see
GRANT SELECT ON TABLE public.products       TO anon;
GRANT SELECT ON TABLE public.store_settings TO anon;
-- anon gets NO access to product_images or owners tables directly.

-- authenticated: same base grants as anon; policies determine the rest
GRANT SELECT ON TABLE public.products       TO authenticated;
GRANT SELECT ON TABLE public.store_settings TO authenticated;

-- Owner DML is granted through the same authenticated role;
-- the is_owner() check in policies does the actual gatekeeping.
GRANT INSERT, UPDATE, DELETE ON TABLE public.products       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_images TO authenticated;
GRANT UPDATE ON TABLE public.store_settings TO authenticated;
-- No insert/delete on store_settings — singleton always exists, never removed.

-- owners table: no grants to anyone; only service role can read/write it.
-- is_owner() uses SECURITY DEFINER so it can check owners without granting SELECT.

-- ─── Enable RLS on all exposed tables ────────────────────────────────────────
ALTER TABLE public.products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners         ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners (postgres superuser) too, so policies apply
-- even when connecting as the table owner role during local dev.
ALTER TABLE public.products       FORCE ROW LEVEL SECURITY;
ALTER TABLE public.product_images FORCE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.owners         FORCE ROW LEVEL SECURITY;

-- ─── RLS policies: products ───────────────────────────────────────────────────

-- Anonymous visitors: read published products only
DROP POLICY IF EXISTS "anon_read_published_products" ON public.products;
CREATE POLICY "anon_read_published_products"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (published = true);

-- Owner: read all products (including drafts)
DROP POLICY IF EXISTS "owner_read_all_products" ON public.products;
CREATE POLICY "owner_read_all_products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (private.is_owner());

-- Owner: insert new products
DROP POLICY IF EXISTS "owner_insert_products" ON public.products;
CREATE POLICY "owner_insert_products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (private.is_owner());

-- Owner: update any product (publish, edit, unpublish)
DROP POLICY IF EXISTS "owner_update_products" ON public.products;
CREATE POLICY "owner_update_products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING   (private.is_owner())
  WITH CHECK (private.is_owner());

-- Owner: delete any product
DROP POLICY IF EXISTS "owner_delete_products" ON public.products;
CREATE POLICY "owner_delete_products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (private.is_owner());

-- ─── RLS policies: product_images ────────────────────────────────────────────
-- Visitors can read image metadata only when its parent product is published.
-- The public storage bucket separately allows fetching the image files.
GRANT SELECT ON TABLE public.product_images TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_published_product_images" ON public.product_images;
CREATE POLICY "public_read_published_product_images"
  ON public.product_images
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE public.products.id = product_images.product_id
        AND public.products.published = true
    )
  );

-- Owner: read all image records
DROP POLICY IF EXISTS "owner_read_product_images" ON public.product_images;
CREATE POLICY "owner_read_product_images"
  ON public.product_images
  FOR SELECT
  TO authenticated
  USING (private.is_owner());

-- Owner: insert image records (database row, not the file itself)
DROP POLICY IF EXISTS "owner_insert_product_images" ON public.product_images;
CREATE POLICY "owner_insert_product_images"
  ON public.product_images
  FOR INSERT
  TO authenticated
  WITH CHECK (private.is_owner());

-- Owner: update image records (e.g. reorder, change alt text)
DROP POLICY IF EXISTS "owner_update_product_images" ON public.product_images;
CREATE POLICY "owner_update_product_images"
  ON public.product_images
  FOR UPDATE
  TO authenticated
  USING   (private.is_owner())
  WITH CHECK (private.is_owner());

-- Owner: delete image records
DROP POLICY IF EXISTS "owner_delete_product_images" ON public.product_images;
CREATE POLICY "owner_delete_product_images"
  ON public.product_images
  FOR DELETE
  TO authenticated
  USING (private.is_owner());

-- ─── RLS policies: store_settings ─────────────────────────────────────────────

-- Anonymous visitors: read the singleton settings row (store name, WA number)
DROP POLICY IF EXISTS "anon_read_store_settings" ON public.store_settings;
CREATE POLICY "anon_read_store_settings"
  ON public.store_settings
  FOR SELECT
  TO anon
  USING (true);

-- Authenticated (non-owner): also read settings
DROP POLICY IF EXISTS "auth_read_store_settings" ON public.store_settings;
CREATE POLICY "auth_read_store_settings"
  ON public.store_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Owner: update the singleton row
DROP POLICY IF EXISTS "owner_update_store_settings" ON public.store_settings;
CREATE POLICY "owner_update_store_settings"
  ON public.store_settings
  FOR UPDATE
  TO authenticated
  USING   (private.is_owner())
  WITH CHECK (private.is_owner());

-- ─── RLS policies: owners ─────────────────────────────────────────────────────
-- No policies = no access for any role. Only the service role bypasses RLS.
-- This means is_owner() (SECURITY DEFINER) is the only way to read the table.

-- ─── Sequence grants (needed for INSERT to work correctly) ───────────────────
-- No sequences are used (all PKs are uuid/text) so nothing to grant here.
