-- =============================================================================
-- Migration 0004: Owner-managed Product Categories
-- Project: MobiGear WhatsApp Store
--
-- Run order: 4 (after 0001_schema.sql, 0002_rls.sql, 0003_storage.sql)
-- Idempotent: YES — uses IF NOT EXISTS, ON CONFLICT, and conditional updates
--
-- Creates:
--   • public.categories   — owner-managed product categories with display order & active status
--   • Migration of products.category column to category_id foreign key
--   • Grants and Row Level Security policies for categories table
-- =============================================================================

-- ─── Table: categories ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text         NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  slug          text         NOT NULL UNIQUE CHECK (char_length(slug) BETWEEN 1 AND 80),
  display_order integer      NOT NULL DEFAULT 0,
  is_active     boolean      NOT NULL DEFAULT true,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);

-- Trigger to update updated_at timestamp automatically
CREATE OR REPLACE TRIGGER categories_moddatetime
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX IF NOT EXISTS categories_active_order_idx ON public.categories (is_active, display_order);

COMMENT ON TABLE  public.categories               IS 'Owner-managed product categories.';
COMMENT ON COLUMN public.categories.slug          IS 'URL-safe unique category identifier.';
COMMENT ON COLUMN public.categories.display_order IS 'Sort order for display in storefront and admin navigation.';
COMMENT ON COLUMN public.categories.is_active     IS 'Inactive categories are hidden from anonymous storefront visitors.';

-- ─── Seed Categories ─────────────────────────────────────────────────────────
-- Seeds requested categories + preserves legacy sample categories
INSERT INTO public.categories (name, slug, display_order, is_active) VALUES
  ('Hot offers',          'hot-offers',          0,  true),
  ('Camping',             'camping',             1,  true),
  ('Electronics',         'electronics',         2,  true),
  ('Mobiles accessories', 'mobiles-accessories', 3,  true),
  ('Car accessories',     'car-accessories',     4,  true),
  ('Cables',              'cables',              5,  true),
  ('Earpods',             'earpods',             6,  true),
  ('Camera''s',           'cameras',             7,  true),
  ('Cases',               'cases',               8,  true),
  ('Chargers',            'chargers',            9,  true),
  ('Audio',               'audio',               10, true),
  ('Accessories',         'accessories',         11, true)
ON CONFLICT (slug) DO NOTHING;

-- ─── Migrate products table to link category_id ──────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE RESTRICT;

-- Populate category_id for existing products based on legacy product_category enum text
UPDATE public.products p
SET category_id = c.id
FROM public.categories c
WHERE p.category_id IS NULL
  AND c.slug = p.category::text;

-- Fallback for any unassigned products
UPDATE public.products p
SET category_id = (SELECT id FROM public.categories WHERE slug = 'accessories' LIMIT 1)
WHERE p.category_id IS NULL;

-- Enforce NOT NULL after populating existing rows
ALTER TABLE public.products ALTER COLUMN category_id SET NOT NULL;

-- Create index on products.category_id
CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products (category_id) WHERE published = true;

COMMENT ON COLUMN public.products.category_id IS 'Foreign key referencing public.categories(id). Restricted from deletion while products exist.';

-- ─── Grants ───────────────────────────────────────────────────────────────────
REVOKE ALL ON TABLE public.categories FROM anon, authenticated;

-- Public visitors (anon & authenticated) can read categories
GRANT SELECT ON TABLE public.categories TO anon;
GRANT SELECT ON TABLE public.categories TO authenticated;

-- Only authenticated users (checked by RLS) can manage categories
GRANT INSERT, UPDATE, DELETE ON TABLE public.categories TO authenticated;

-- ─── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories FORCE ROW LEVEL SECURITY;

-- Anonymous & authenticated users: read ACTIVE categories only
DROP POLICY IF EXISTS "public_read_active_categories" ON public.categories;
CREATE POLICY "public_read_active_categories"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Owner: read ALL categories (including inactive)
DROP POLICY IF EXISTS "owner_read_all_categories" ON public.categories;
CREATE POLICY "owner_read_all_categories"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (private.is_owner());

-- Owner: insert categories
DROP POLICY IF EXISTS "owner_insert_categories" ON public.categories;
CREATE POLICY "owner_insert_categories"
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (private.is_owner());

-- Owner: update categories (rename, slug, reorder, toggle active)
DROP POLICY IF EXISTS "owner_update_categories" ON public.categories;
CREATE POLICY "owner_update_categories"
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING   (private.is_owner())
  WITH CHECK (private.is_owner());

-- Owner: delete categories
DROP POLICY IF EXISTS "owner_delete_categories" ON public.categories;
CREATE POLICY "owner_delete_categories"
  ON public.categories
  FOR DELETE
  TO authenticated
  USING (private.is_owner());
