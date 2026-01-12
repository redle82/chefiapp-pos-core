-- Migration: Add version column to gm_orders for optimistic locking
-- Purpose: Prevent race conditions when multiple users modify the same order
-- Date: 2026-01-18

-- Add version column (starts at 1, increments on each update)
ALTER TABLE gm_orders
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

-- Add index for version lookups (used in WHERE clauses)
CREATE INDEX IF NOT EXISTS idx_gm_orders_version 
ON gm_orders(id, version);

-- Add comment
COMMENT ON COLUMN gm_orders.version IS 'Optimistic locking version - increments on each update to prevent race conditions';

-- Update trigger to auto-increment version on update
CREATE OR REPLACE FUNCTION increment_order_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version := OLD.version + 1;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_increment_order_version ON gm_orders;
CREATE TRIGGER trigger_increment_order_version
    BEFORE UPDATE ON gm_orders
    FOR EACH ROW
    EXECUTE FUNCTION increment_order_version();
