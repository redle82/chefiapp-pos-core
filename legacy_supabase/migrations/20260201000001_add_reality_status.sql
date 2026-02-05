
-- Add Reality Status to gm_restaurants
-- This tracks the Life Cycle Phase of the organism (Draft -> Ready -> Live)

ALTER TABLE gm_restaurants 
ADD COLUMN IF NOT EXISTS reality_status TEXT DEFAULT 'DRAFT' CHECK (reality_status IN ('DRAFT', 'READY_FOR_REALITY', 'LIVE_REALITY')),
ADD COLUMN IF NOT EXISTS reality_verdict JSONB; -- Stores the last verdict details (score, failures)

-- Add index for quick lookup
CREATE INDEX IF NOT EXISTS idx_restaurants_reality_status ON gm_restaurants(reality_status);

-- Comments
COMMENT ON COLUMN gm_restaurants.reality_status IS 'Lifecycle phase: DRAFT (Setting up), READY_FOR_REALITY (Passed Audit), LIVE_REALITY (Operational)';
