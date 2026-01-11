-- Migration: 20260110000001_operation_status_audit.sql
-- Purpose: Create audit table for operation status changes (Opus 6.0)
-- Date: 2026-01-10
-- Create ENUM for operation status if it doesn't exist
DO $$ BEGIN CREATE TYPE operation_status AS ENUM ('active', 'paused', 'suspended');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
-- ============================================================
-- 1) CREATE AUDIT TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.operation_status_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    previous_status operation_status,
    new_status operation_status NOT NULL,
    reason TEXT,
    actor_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT (now() at time zone 'utc')
);
-- ============================================================
-- 2) CREATE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_operation_status_audit_restaurant ON public.operation_status_audit(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_operation_status_audit_created_at ON public.operation_status_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operation_status_audit_status ON public.operation_status_audit(new_status);
-- ============================================================
-- 3) UPDATE FUNCTION TO LOG AUDIT
-- ============================================================
CREATE OR REPLACE FUNCTION update_operation_status(
        p_restaurant_id UUID,
        p_status operation_status,
        p_reason TEXT DEFAULT NULL,
        p_actor_id UUID DEFAULT NULL
    ) RETURNS VOID AS $$
DECLARE v_previous_status operation_status;
v_metadata JSONB;
BEGIN -- Get current status and metadata
SELECT operation_status,
    operation_metadata INTO v_previous_status,
    v_metadata
FROM gm_restaurants
WHERE id = p_restaurant_id;
-- If status hasn't changed, do nothing
IF v_previous_status = p_status THEN RETURN;
END IF;
-- Log to audit table
INSERT INTO public.operation_status_audit (
        restaurant_id,
        previous_status,
        new_status,
        reason,
        actor_id
    )
VALUES (
        p_restaurant_id,
        v_previous_status,
        p_status,
        p_reason,
        p_actor_id
    );
-- Update metadata with audit trail
v_metadata := COALESCE(v_metadata, '{}'::jsonb) || jsonb_build_object(
    'last_update',
    (now() at time zone 'utc'),
    'reason',
    p_reason,
    'updated_by',
    p_actor_id,
    'previous_status',
    v_previous_status
);
-- Perform update
UPDATE gm_restaurants
SET operation_status = p_status,
    operation_metadata = v_metadata,
    updated_at = (now() at time zone 'utc')
WHERE id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================================
-- 4) RLS POLICIES
-- ============================================================
ALTER TABLE public.operation_status_audit ENABLE ROW LEVEL SECURITY;
-- Users can only see audit logs for restaurants they have access to
CREATE POLICY "Users can view operation status audit for their restaurants" ON public.operation_status_audit FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_members
            WHERE restaurant_id = operation_status_audit.restaurant_id
                AND user_id = auth.uid()
        )
    );
-- Only system can insert (via function)
CREATE POLICY "Only system can insert operation status audit" ON public.operation_status_audit FOR
INSERT WITH CHECK (false);
-- Function uses SECURITY DEFINER
-- ============================================================
-- 5) HELPER FUNCTION: Get Operation History
-- ============================================================
CREATE OR REPLACE FUNCTION get_operation_status_history(
        p_restaurant_id UUID,
        p_limit INTEGER DEFAULT 50
    ) RETURNS TABLE (
        id UUID,
        previous_status operation_status,
        new_status operation_status,
        reason TEXT,
        actor_id UUID,
        created_at TIMESTAMPTZ
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY
SELECT osa.id,
    osa.previous_status,
    osa.new_status,
    osa.reason,
    osa.actor_id,
    osa.created_at
FROM public.operation_status_audit osa
WHERE osa.restaurant_id = p_restaurant_id
ORDER BY osa.created_at DESC
LIMIT p_limit;
END;
$$;
-- ============================================================
-- 6) COMMENTS
-- ============================================================
COMMENT ON TABLE public.operation_status_audit IS 'Audit log for operation status changes (Opus 6.0)';
COMMENT ON FUNCTION update_operation_status IS 'Updates operation status and logs to audit table';
COMMENT ON FUNCTION get_operation_status_history IS 'Returns operation status change history for a restaurant';