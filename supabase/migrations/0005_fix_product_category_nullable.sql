-- =============================================================================
-- Migration 0005: Make legacy products.category column nullable
-- Project: VIEW STORE
--
-- Run order: 5 (after 0004_categories.sql)
-- Idempotent: YES — ALTER COLUMN ... DROP NOT NULL is safe to re-run
--
-- Context:
--   Migration 0001 created products.category (enum) as NOT NULL.
--   Migration 0004 introduced public.categories and products.category_id (FK),
--   backfilling category_id from category. However, if 0004 was already applied
--   without making the legacy category column nullable, attempting to create new
--   products (which specify category_id but not category) will fail with a
--   null value NOT NULL constraint error.
--
-- This migration drops the NOT NULL constraint on products.category while
-- preserving the column and all existing category enum values for historical data.
-- =============================================================================

ALTER TABLE public.products ALTER COLUMN category DROP NOT NULL;

COMMENT ON COLUMN public.products.category IS
  'Legacy category enum. Retained for historical data preservation; category_id foreign key is now used.';
