-- 005_onboarding_persistence.sql
-- Purpose: Store identity details from the 3-Step Onboarding Flow due to new requirement.
-- Add columns to gm_restaurants (if they don't exist)
ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS type TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
-- Comment for documentation
COMMENT ON COLUMN public.gm_restaurants.type IS 'Operation Type (e.g., Restaurante, Bar, Café)';
COMMENT ON COLUMN public.gm_restaurants.city IS 'City of operation (Onboarding input)';
COMMENT ON COLUMN public.gm_restaurants.onboarding_completed_at IS 'Timestamp when the user finished the 3-step wizard';