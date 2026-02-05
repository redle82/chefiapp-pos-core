-- Migration: Add sync_metadata to gm_orders for offline idempotency
-- Purpose: Store localId and sync information to prevent duplicate orders
-- Date: 2026-01-18
-- Add sync_metadata column (JSONB) to store offline sync information
ALTER TABLE gm_orders
ADD COLUMN IF NOT EXISTS sync_metadata JSONB DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_gm_orders_sync_local_id ON gm_orders ((sync_metadata->>'localId'));
-- Add comment
COMMENT ON COLUMN gm_orders.sync_metadata IS 'Metadata for offline sync: {localId, syncAttempts, lastSyncAt}';