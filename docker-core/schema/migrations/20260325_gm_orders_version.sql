-- =============================================================================
-- PHASE 10.1: Optimistic Concurrency — version column on gm_orders
-- =============================================================================
-- Date: 2026-03-25
-- Priority: HIGH (offline/sync conflict resolution)
--
-- Purpose:
--   Adds a monotonic `version` column to gm_orders.
--   Every UPDATE auto-increments version via BEFORE UPDATE trigger.
--   SyncEngine uses this for optimistic locking:
--     UPDATE gm_orders SET ... WHERE id = $1 AND version = $2
--   If version mismatch → 0 rows updated → conflict detected → retry/merge.
--
-- Pattern: Same approach used by event_store (stream_version) and billing
--          (last_billing_event_at monotonic guard).
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Add version column (nullable initially, then backfill + default)
-- ---------------------------------------------------------------------------
ALTER TABLE public.gm_orders
    ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.gm_orders.version IS
'Optimistic concurrency control. Auto-incremented on every UPDATE. '
'SyncEngine checks version match before applying offline changes.';

-- ---------------------------------------------------------------------------
-- 2. Auto-increment trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.gm_orders_bump_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version := OLD.version + 1;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gm_orders_bump_version ON public.gm_orders;
CREATE TRIGGER trg_gm_orders_bump_version
    BEFORE UPDATE ON public.gm_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.gm_orders_bump_version();

COMMENT ON TRIGGER trg_gm_orders_bump_version ON public.gm_orders IS
'Auto-increments version on every UPDATE for optimistic concurrency control.';

-- ---------------------------------------------------------------------------
-- 3. Index for efficient version-check queries
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_gm_orders_version
    ON public.gm_orders (id, version);

GRANT EXECUTE ON FUNCTION public.gm_orders_bump_version() TO postgres;

COMMIT;
