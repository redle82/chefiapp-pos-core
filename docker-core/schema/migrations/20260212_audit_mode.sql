-- =============================================================================
-- PHASE 5A: Audit Mode Registry
-- =============================================================================
-- Tracks when a restaurant is under audit mode (read-only, export-heavy).
-- This does not enforce read-only by itself; enforcement lives in services.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Audit mode registry
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gm_audit_mode (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE RESTRICT,

    status          TEXT NOT NULL DEFAULT 'ENABLED'
                    CHECK (status IN ('ENABLED', 'DISABLED')),

    reason          TEXT NOT NULL DEFAULT 'audit_requested',
    reason_detail   TEXT,

    enabled_by      UUID,
    disabled_by     UUID,

    enabled_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    disabled_at     TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,

    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.gm_audit_mode IS
'Audit mode registry per restaurant. Used by ops + export tooling for audit readiness.';

-- Only one active audit mode per restaurant
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_mode_active
    ON public.gm_audit_mode(restaurant_id)
    WHERE status = 'ENABLED';

CREATE INDEX IF NOT EXISTS idx_audit_mode_restaurant
    ON public.gm_audit_mode(restaurant_id, enabled_at DESC);

-- ---------------------------------------------------------------------------
-- 2. Mutation guard
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_audit_mode_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'IMMUTABLE_AUDIT_MODE: DELETE not allowed'
            USING ERRCODE = '23514';
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF OLD.restaurant_id != NEW.restaurant_id
           OR OLD.enabled_at != NEW.enabled_at
           OR OLD.created_at != NEW.created_at THEN
            RAISE EXCEPTION 'IMMUTABLE_AUDIT_MODE: Immutable fields cannot be changed'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_audit_mode_mutation ON public.gm_audit_mode;
CREATE TRIGGER trg_guard_audit_mode_mutation
    BEFORE UPDATE OR DELETE ON public.gm_audit_mode
    FOR EACH ROW
    EXECUTE FUNCTION public.guard_audit_mode_mutation();

-- ---------------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.gm_audit_mode ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_mode_select"
    ON public.gm_audit_mode
    FOR SELECT TO authenticated
    USING (has_restaurant_access(restaurant_id));

CREATE POLICY "audit_mode_service"
    ON public.gm_audit_mode
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

REVOKE ALL ON public.gm_audit_mode FROM anon;

-- ---------------------------------------------------------------------------
-- 4. RPCs: enable/disable audit mode
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enable_audit_mode(
    p_restaurant_id UUID,
    p_reason TEXT DEFAULT 'audit_requested',
    p_reason_detail TEXT DEFAULT NULL,
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Only manager/owner can enable audit mode
    PERFORM public.require_restaurant_role(
        p_restaurant_id,
        ARRAY['owner', 'manager']
    );

    INSERT INTO public.gm_audit_mode (
        restaurant_id, status, reason, reason_detail,
        enabled_by, enabled_at, expires_at, metadata
    ) VALUES (
        p_restaurant_id, 'ENABLED', p_reason, p_reason_detail,
        auth.uid(), NOW(), p_expires_at, COALESCE(p_metadata, '{}'::jsonb)
    )
    RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'id', v_id,
        'status', 'ENABLED'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.disable_audit_mode(
    p_restaurant_id UUID,
    p_reason TEXT DEFAULT 'audit_closed',
    p_reason_detail TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Only manager/owner can disable audit mode
    PERFORM public.require_restaurant_role(
        p_restaurant_id,
        ARRAY['owner', 'manager']
    );

    UPDATE public.gm_audit_mode
    SET
        status = 'DISABLED',
        disabled_by = auth.uid(),
        disabled_at = NOW(),
        reason = p_reason,
        reason_detail = p_reason_detail,
        metadata = COALESCE(p_metadata, '{}'::jsonb)
    WHERE restaurant_id = p_restaurant_id
      AND status = 'ENABLED'
    RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'id', v_id,
        'status', 'DISABLED'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.enable_audit_mode(UUID, TEXT, TEXT, TIMESTAMPTZ, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disable_audit_mode(UUID, TEXT, TEXT, JSONB) TO authenticated;

COMMIT;
