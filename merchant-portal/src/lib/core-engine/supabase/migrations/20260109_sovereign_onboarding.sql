-- Migration: Add Sovereign Onboarding columns to gm_restaurants
ALTER TABLE gm_restaurants
ADD COLUMN IF NOT EXISTS onboarding_level text DEFAULT 'founder',
    ADD COLUMN IF NOT EXISTS modules_unlocked jsonb DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS evidence jsonb DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS topology jsonb DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS flow_type text DEFAULT 'a_la_carte',
    ADD COLUMN IF NOT EXISTS finance jsonb DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
-- Create index for analytics/queries
CREATE INDEX IF NOT EXISTS idx_gm_restaurants_onboarding_level ON gm_restaurants(onboarding_level);
-- Comment on columns for clarity
COMMENT ON COLUMN gm_restaurants.onboarding_level IS 'verified_gold, verified_silver, verified_bronze, or founder';
COMMENT ON COLUMN gm_restaurants.evidence IS 'Structured proof of existence data';
COMMENT ON COLUMN gm_restaurants.topology IS 'Physical layout configuration (dine_in, delivery, etc)';