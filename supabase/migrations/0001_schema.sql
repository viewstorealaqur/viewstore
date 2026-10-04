-- =============================================================================
-- Migration 0001: Core schema
-- Project: MobiGear WhatsApp Store
-- Stage:   2 — Data Foundation
--
-- Run order: 1 of 3
-- Idempotent: YES — uses IF NOT EXISTS throughout
--
-- Creates:
--   • products            — product catalogue (name, desc, price, category …)
--   • product_images      — up to 8 images per product; image_order=0 is cover
--   • store_settings      — store name + WhatsApp number (singleton row)
--
-- Security is configured in 0002_rls.sql.
-- =============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
-- moddatetime: auto-updates updated_at columns on every UPDATE
CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;

-- ─── Enum: product_category ──────────────────────────────────────────────────
-- Matches the Category type in lib/products.ts (minus "all" which is UI-only)
DO $$ BEGIN
  CREATE TYPE product_category AS ENUM (
    'cases',
    'chargers',
    'audio',
    'cables',
    'accessories'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Table: products ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core display fields
  name          text         NOT NULL CHECK (char_length(name)          BETWEEN 1 AND 120),
  tagline       text         NOT NULL CHECK (char_length(tagline)       BETWEEN 1 AND 200),
  description   text         NOT NULL CHECK (char_length(description)   BETWEEN 1 AND 4000),

  -- Pricing: stored as integer paise/paisa (smallest currency unit) to avoid
  -- floating-point rounding. Divide by 100 when displaying.
  -- Example: 249900 = Rs. 2,499.00
  price_paisa   integer      NOT NULL CHECK (price_paisa > 0),

  -- Category from the controlled enum
  category      product_category NOT NULL,

  -- Comma-separated compatibility notes. Stored as text[] for easy querying.
  compatibility text[]       NOT NULL DEFAULT '{}',

  -- Optional badge shown on the product card ("New", "Best Seller", etc.)
  badge         text         CHECK (badge IS NULL OR char_length(badge) <= 40),

  -- publish/draft status. Public visitors see only published = true rows.
  published     boolean      NOT NULL DEFAULT false,

  -- Audit timestamps
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE TRIGGER products_moddatetime
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- Useful indexes
CREATE INDEX IF NOT EXISTS products_category_idx   ON products (category) WHERE published = true;
CREATE INDEX IF NOT EXISTS products_published_idx  ON products (published);

COMMENT ON TABLE  products               IS 'MobiGear product catalogue.';
COMMENT ON COLUMN products.price_paisa   IS 'Price in smallest currency unit (paisa). Divide by 100 to display Rs.';
COMMENT ON COLUMN products.published     IS 'Only published=true rows are visible to anonymous visitors via RLS.';

-- ─── Table: product_images ───────────────────────────────────────────────────
-- Each product may have up to 8 images. image_order=0 is the cover image.
-- The physical file lives in the "product-images" storage bucket; storage_path
-- stores only the path within that bucket (e.g. "products/<product_id>/cover.webp").
CREATE TABLE IF NOT EXISTS product_images (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid         NOT NULL REFERENCES products (id) ON DELETE CASCADE,

  -- Path within the "product-images" storage bucket — not a full URL.
  -- Build the public URL in application code via supabase.storage.from(...).getPublicUrl(...)
  storage_path  text         NOT NULL CHECK (char_length(storage_path) BETWEEN 1 AND 500),

  -- Descriptive alt text for accessibility and SEO
  alt_text      text         NOT NULL DEFAULT '' CHECK (char_length(alt_text) <= 300),

  -- 0 = cover image shown on product cards. 1–7 = additional gallery images.
  -- Range enforced here; the 8-image total limit is enforced in 0002_rls.sql
  -- via a CHECK constraint function and in application server actions.
  image_order   smallint     NOT NULL DEFAULT 0 CHECK (image_order BETWEEN 0 AND 7),

  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now(),

  -- Each product can have at most one image at each order position
  UNIQUE (product_id, image_order)
);

CREATE OR REPLACE TRIGGER product_images_moddatetime
  BEFORE UPDATE ON product_images
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX IF NOT EXISTS product_images_product_idx ON product_images (product_id, image_order);

COMMENT ON TABLE  product_images               IS 'Up to 8 images per product. image_order=0 is the cover.';
COMMENT ON COLUMN product_images.storage_path  IS 'Path within the product-images storage bucket, not a full URL.';
COMMENT ON COLUMN product_images.image_order   IS '0 = cover; 1–7 = gallery. Max 8 images per product enforced by check_image_count trigger.';

-- ─── Trigger: enforce 8-image-per-product limit ───────────────────────────────
-- This is a second line of defence behind the application-level check.
-- If somehow more than 8 rows are attempted for the same product_id,
-- the database will reject the INSERT with a clear error.
CREATE OR REPLACE FUNCTION check_image_count()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  existing_count integer;
BEGIN
  SELECT count(*) INTO existing_count
  FROM product_images
  WHERE product_id = NEW.product_id
    AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  IF existing_count >= 8 THEN
    RAISE EXCEPTION
      'Product % already has 8 images. Remove one before adding another.',
      NEW.product_id
    USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER enforce_max_images
  BEFORE INSERT OR UPDATE ON product_images
  FOR EACH ROW EXECUTE FUNCTION check_image_count();

-- ─── Table: store_settings ───────────────────────────────────────────────────
-- Singleton table — always exactly one row (id = 'singleton').
-- The unique ID prevents accidental second rows.
-- Public visitors may READ this table. Only the authorized owner may UPDATE.
CREATE TABLE IF NOT EXISTS store_settings (
  -- Fixed primary key ensures only one row can ever exist.
  id              text         PRIMARY KEY DEFAULT 'singleton' CHECK (id = 'singleton'),

  store_name      text         NOT NULL DEFAULT 'MobiGear'
                               CHECK (char_length(store_name) BETWEEN 1 AND 80),

  -- WhatsApp number in full international E.164 format, digits only.
  -- Example: "923001234567" (Pakistan +92, no leading +).
  -- NULL means the WhatsApp order button is disabled on the storefront.
  whatsapp_number text         CHECK (
                                 whatsapp_number IS NULL OR (
                                   whatsapp_number ~ '^[0-9]{7,15}$'
                                 )
                               ),

  updated_at      timestamptz  NOT NULL DEFAULT now()
);

CREATE OR REPLACE TRIGGER store_settings_moddatetime
  BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

COMMENT ON TABLE  store_settings                   IS 'Singleton settings row. Exactly one row (id=singleton) always exists.';
COMMENT ON COLUMN store_settings.whatsapp_number   IS 'E.164 digits-only, no leading +. NULL disables the WhatsApp order button.';

-- Insert the default singleton row if it does not yet exist.
INSERT INTO store_settings (id, store_name, whatsapp_number)
VALUES ('singleton', 'MobiGear', NULL)
ON CONFLICT (id) DO NOTHING;
