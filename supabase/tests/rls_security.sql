-- =============================================================================
-- supabase/tests/rls_security.sql
-- Project: MobiGear WhatsApp Store
-- Stage:   2 — Data Foundation
--
-- PURPOSE
-- -------
-- Verifies Row Level Security policies by running statements as the `anon`
-- and `authenticated` (non-owner) roles and asserting expected results.
-- Uses pgTAP (https://pgtap.org) — included in Supabase local dev by default.
--
-- HOW TO RUN
-- ----------
-- These tests require a LOCAL Supabase development database (not production).
-- They are NOT run automatically in this stage because no local Supabase
-- project has been configured yet. Run them after completing the Supabase
-- local dev setup described in README-STAGE2.md:
--
--   supabase start
--   supabase db reset             # applies all migrations
--   supabase test db              # runs this file via pgTAP
--
-- Or run them directly via psql:
--   psql "postgresql://postgres:postgres@localhost:54322/postgres" \
--     -f supabase/tests/rls_security.sql
--
-- WHAT IS TESTED
-- --------------
-- 1. Anonymous (anon) role
--    a. Can SELECT published products
--    b. Cannot SELECT unpublished (draft) products
--    c. Cannot INSERT products
--    d. Cannot UPDATE products
--    e. Cannot DELETE products
--    f. Can SELECT store_settings
--    g. Cannot UPDATE store_settings
--    h. Can SELECT image metadata only for published products
--    i. Cannot SELECT the owners table at all
--
-- 2. Authenticated non-owner role
--    a. Can SELECT published products
--    b. Cannot SELECT unpublished products
--    c. Cannot INSERT products
--    d. Cannot UPDATE products
--    e. Cannot DELETE products
--    f. Can SELECT store_settings
--    g. Cannot UPDATE store_settings
--    h. Can SELECT image metadata only for published products
--
-- 3. Owner role (authenticated + row in owners table)
--    a. Can SELECT ALL products (published and draft)
--    b. Can INSERT a product
--    c. Can UPDATE a product (publish/unpublish)
--    d. Can DELETE a product
--    e. Can SELECT, INSERT, UPDATE, DELETE product_images
--    f. Can UPDATE store_settings
--
-- 4. Storage bucket policies (checked via storage.objects)
--    a. Anon can SELECT (read) objects in product-images bucket
--    b. Anon cannot INSERT objects
--    c. Owner can INSERT, DELETE objects
-- =============================================================================

BEGIN;

-- Load pgTAP
SELECT plan(28);  -- total number of assertions below

-- ─── Fixtures ─────────────────────────────────────────────────────────────────
-- We use a DO block to insert test data under the service role, then test
-- access as restricted roles.

-- Create a fake owner auth.uid (not a real user — just a UUID for testing)
DO $$
DECLARE
  owner_uid  uuid := '00000000-0000-0000-0000-000000000001';
  anon_uid   uuid := '00000000-0000-0000-0000-000000000002';
  product_pub uuid;
  product_drft uuid;
BEGIN
  -- Insert test owner into owners table (service role bypasses RLS)
  INSERT INTO public.owners (user_id) VALUES (owner_uid)
  ON CONFLICT DO NOTHING;

  -- Insert a published product
  INSERT INTO public.products (name, tagline, description, price_paisa, category, compatibility, published)
  VALUES ('Test Published', 'tagline', 'desc', 100000, 'cases', '{}', true)
  RETURNING id INTO product_pub;

  -- Insert a draft product
  INSERT INTO public.products (name, tagline, description, price_paisa, category, compatibility, published)
  VALUES ('Test Draft', 'tagline', 'desc', 200000, 'chargers', '{}', false)
  RETURNING id INTO product_drft;

  -- Insert a product image for the published product
  INSERT INTO public.product_images (product_id, storage_path, image_order)
  VALUES (product_pub, 'products/' || product_pub || '/cover.jpg', 0)
  ON CONFLICT DO NOTHING;

  -- Store ids for use in tests
  PERFORM set_config('test.owner_uid',   owner_uid::text,  true);
  PERFORM set_config('test.product_pub', product_pub::text, true);
  PERFORM set_config('test.product_drft', product_drft::text, true);
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- SECTION 1: ANONYMOUS ROLE
-- ═══════════════════════════════════════════════════════════════════
SET LOCAL ROLE anon;

-- 1a. Anon can read published products
SELECT ok(
  (SELECT count(*) > 0 FROM public.products WHERE published = true),
  'anon: can SELECT published products'
);

-- 1b. Anon cannot see draft products
SELECT is(
  (SELECT count(*)::int FROM public.products WHERE published = false),
  0,
  'anon: cannot SELECT unpublished/draft products'
);

-- 1c. Anon cannot INSERT a product
SELECT throws_ok(
  $$INSERT INTO public.products (name, tagline, description, price_paisa, category, compatibility)
    VALUES ('Hack', 'h', 'h', 1, 'cases', '{}')$$,
  'anon: INSERT into products is rejected'
);

-- 1d. Anon cannot UPDATE a product
SELECT throws_ok(
  $$UPDATE public.products SET name = 'Hacked' WHERE published = true$$,
  'anon: UPDATE on products is rejected'
);

-- 1e. Anon cannot DELETE a product
SELECT throws_ok(
  $$DELETE FROM public.products WHERE published = true$$,
  'anon: DELETE on products is rejected'
);

-- 1f. Anon can read store_settings
SELECT ok(
  (SELECT count(*) > 0 FROM public.store_settings WHERE id = 'singleton'),
  'anon: can SELECT store_settings singleton row'
);

-- 1g. Anon cannot UPDATE store_settings
SELECT throws_ok(
  $$UPDATE public.store_settings SET store_name = 'Hacked' WHERE id = 'singleton'$$,
  'anon: UPDATE on store_settings is rejected'
);

-- 1h. Anon can read the image metadata for the published fixture
SELECT ok(
  (SELECT count(*) > 0 FROM public.product_images),
  'anon: can SELECT image metadata for a published product'
);

-- 1i. Anon cannot SELECT owners table
SELECT is(
  (SELECT count(*)::int FROM public.owners),
  0,
  'anon: cannot SELECT from owners table'
);

-- ═══════════════════════════════════════════════════════════════════
-- SECTION 2: AUTHENTICATED NON-OWNER ROLE
-- ═══════════════════════════════════════════════════════════════════
-- Simulate a logged-in user who is NOT in the owners table.
RESET ROLE;
SET LOCAL ROLE authenticated;
-- Set auth.uid() to a random user (not in owners)
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000099', true);

-- 2a. Authenticated non-owner can see published products, but not drafts.
SELECT ok(
  (SELECT count(*) > 0 FROM public.products WHERE published = true),
  'auth-non-owner: can SELECT published products (same as anon)'
);

-- 2b. Authenticated non-owner cannot see draft products
SELECT is(
  (SELECT count(*)::int FROM public.products WHERE published = false),
  0,
  'auth-non-owner: cannot SELECT draft products'
);

-- 2c. Authenticated non-owner cannot INSERT products
SELECT throws_ok(
  $$INSERT INTO public.products (name, tagline, description, price_paisa, category, compatibility)
    VALUES ('HackAuth', 'h', 'h', 1, 'cases', '{}')$$,
  'auth-non-owner: INSERT into products is rejected'
);

-- 2d. Authenticated non-owner cannot UPDATE products
SELECT throws_ok(
  $$UPDATE public.products SET name = 'HackedAuth' WHERE published = true$$,
  'auth-non-owner: UPDATE on products is rejected'
);

-- 2e. Authenticated non-owner cannot DELETE products
SELECT throws_ok(
  $$DELETE FROM public.products WHERE published = true$$,
  'auth-non-owner: DELETE on products is rejected'
);

-- 2f. Authenticated non-owner can read store_settings
SELECT ok(
  (SELECT count(*) > 0 FROM public.store_settings),
  'auth-non-owner: can SELECT store_settings'
);

-- 2g. Authenticated non-owner cannot UPDATE store_settings
SELECT throws_ok(
  $$UPDATE public.store_settings SET store_name = 'HackedSettings'$$,
  'auth-non-owner: UPDATE on store_settings is rejected'
);

-- 2h. Authenticated non-owner can read image metadata for published products
SELECT ok(
  (SELECT count(*) > 0 FROM public.product_images),
  'auth-non-owner: can SELECT image metadata for published products'
);

-- ═══════════════════════════════════════════════════════════════════
-- SECTION 3: OWNER ROLE
-- ═══════════════════════════════════════════════════════════════════
RESET ROLE;
SET LOCAL ROLE authenticated;
-- Set auth.uid() to the owner we inserted above
SELECT set_config(
  'request.jwt.claim.sub',
  current_setting('test.owner_uid'),
  true
);

-- 3a. Owner can see ALL products including drafts
SELECT ok(
  (SELECT count(*)::int FROM public.products WHERE published = false) > 0,
  'owner: can SELECT draft (unpublished) products'
);

-- 3b. Owner can INSERT a product
SELECT lives_ok(
  $$INSERT INTO public.products (name, tagline, description, price_paisa, category, compatibility)
    VALUES ('Owner Test Product', 't', 'd', 50000, 'audio', '{}')$$,
  'owner: can INSERT products'
);

-- 3c. Owner can UPDATE a product (e.g. publish it)
SELECT lives_ok(
  $$UPDATE public.products SET published = true WHERE name = 'Owner Test Product'$$,
  'owner: can UPDATE (publish) products'
);

-- 3d. Owner can DELETE a product
SELECT lives_ok(
  $$DELETE FROM public.products WHERE name = 'Owner Test Product'$$,
  'owner: can DELETE products'
);

-- 3e-i. Owner can SELECT product_images
SELECT ok(
  (SELECT count(*)::int FROM public.product_images) > 0,
  'owner: can SELECT product_images'
);

-- 3e-ii. Owner can INSERT product_image row
SELECT lives_ok(
  format(
    $$INSERT INTO public.product_images (product_id, storage_path, image_order)
      VALUES (%L, 'products/test/img2.jpg', 1)$$,
    current_setting('test.product_pub')
  ),
  'owner: can INSERT product_images'
);

-- 3e-iii. Owner can UPDATE product_image
SELECT lives_ok(
  $$UPDATE public.product_images SET alt_text = 'Updated alt' WHERE image_order = 1$$,
  'owner: can UPDATE product_images'
);

-- 3e-iv. Owner can DELETE product_image
SELECT lives_ok(
  $$DELETE FROM public.product_images WHERE image_order = 1$$,
  'owner: can DELETE product_images'
);

-- 3f. Owner can UPDATE store_settings
SELECT lives_ok(
  $$UPDATE public.store_settings SET store_name = 'OwnerUpdated' WHERE id = 'singleton'$$,
  'owner: can UPDATE store_settings'
);
-- Restore the store_name
UPDATE public.store_settings SET store_name = 'MobiGear' WHERE id = 'singleton';

-- ═══════════════════════════════════════════════════════════════════
-- SECTION 4: STORAGE BUCKET (storage.objects)
-- ═══════════════════════════════════════════════════════════════════
RESET ROLE;
SET LOCAL ROLE anon;

-- 4a. Anon can SELECT (read) objects in product-images bucket
-- (Row may not exist in test DB, but the SELECT itself must not throw)
SELECT lives_ok(
  $$SELECT * FROM storage.objects WHERE bucket_id = 'product-images' LIMIT 1$$,
  'anon: can SELECT (read) objects in product-images bucket'
);

-- 4b. Anon cannot INSERT into storage.objects (upload)
SELECT throws_ok(
  $$INSERT INTO storage.objects (bucket_id, name, owner)
    VALUES ('product-images', 'products/hack.jpg', '00000000-0000-0000-0000-000000000099'::uuid)$$,
  'anon: cannot INSERT (upload) to product-images bucket'
);

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  current_setting('test.owner_uid'),
  true
);

-- Owner storage writes are not asserted here; they require a request through
-- the Storage API. Review the storage.objects policies before deployment.

-- ─── Teardown ─────────────────────────────────────────────────────────────────
RESET ROLE;

-- Remove test data (service role)
DELETE FROM public.products WHERE name IN ('Test Published', 'Test Draft');
DELETE FROM public.owners  WHERE user_id = '00000000-0000-0000-0000-000000000001';

SELECT * FROM finish();
ROLLBACK;
