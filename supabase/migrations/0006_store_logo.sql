-- =============================================================================
-- Migration 0006: Add logo_url column to store_settings
-- Project: VIEW STORE
-- =============================================================================

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS logo_url text DEFAULT NULL;

COMMENT ON COLUMN public.store_settings.logo_url IS
  'Public URL of custom uploaded store logo. NULL defaults to public/logo.png';
