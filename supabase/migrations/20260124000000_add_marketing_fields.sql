-- 20260124000000_add_marketing_fields.sql
-- 📣 MARKETING: Add Pixel support
-- Adds fields to store Facebook Pixel and Google Tag IDs for each restaurant.

ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT,
  ADD COLUMN IF NOT EXISTS google_tag_id TEXT;

COMMENT ON COLUMN public.gm_restaurants.facebook_pixel_id IS 'Meta Pixel ID (e.g., 1234567890).';
COMMENT ON COLUMN public.gm_restaurants.google_tag_id IS 'Google Tag Manager or Analytics ID (e.g., G-XXXXXX).';
