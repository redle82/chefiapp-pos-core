-- Create ENUM for operation status if it doesn't exist
DO $$ BEGIN CREATE TYPE operation_status AS ENUM ('active', 'paused', 'suspended');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
-- Add operation_status and operation_metadata to gm_restaurants
ALTER TABLE gm_restaurants
ADD COLUMN IF NOT EXISTS operation_status operation_status DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS operation_metadata JSONB DEFAULT '{}'::jsonb;
-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_operation_status ON gm_restaurants(operation_status);
-- Create function to safe update operation status
CREATE OR REPLACE FUNCTION update_operation_status(
        p_restaurant_id UUID,
        p_status operation_status,
        p_reason TEXT DEFAULT NULL,
        p_actor_id UUID DEFAULT NULL
    ) RETURNS VOID AS $$
DECLARE v_metadata JSONB;
BEGIN -- Get current metadata
SELECT operation_metadata INTO v_metadata
FROM gm_restaurants
WHERE id = p_restaurant_id;
-- Update metadata with audit trail (simple version)
v_metadata := v_metadata || jsonb_build_object(
    'last_update',
    now(),
    'reason',
    p_reason,
    'updated_by',
    p_actor_id,
    'previous_status',
    (
        SELECT operation_status
        FROM gm_restaurants
        WHERE id = p_restaurant_id
    )
);
-- Perform update
UPDATE gm_restaurants
SET operation_status = p_status,
    operation_metadata = v_metadata,
    updated_at = now()
WHERE id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql;