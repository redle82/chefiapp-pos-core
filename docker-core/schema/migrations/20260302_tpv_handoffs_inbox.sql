-- =============================================================================
-- TPV handoff inbox (mobile waiter -> TPV central)
-- Date: 2026-03-02
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.gm_tpv_handoffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.gm_tables(id) ON DELETE SET NULL,
    table_number INTEGER,
    waiter_id TEXT,
    waiter_name TEXT,
    total_estimated_cents INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consumed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tpv_handoff_status_check CHECK (status IN ('pending', 'awaiting_payment', 'closed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_tpv_handoffs_restaurant_status_requested
ON public.gm_tpv_handoffs (restaurant_id, status, requested_at DESC);

CREATE OR REPLACE FUNCTION public.create_tpv_handoff(
    p_restaurant_id UUID,
    p_table_id UUID DEFAULT NULL,
    p_table_number INTEGER DEFAULT NULL,
    p_waiter_id TEXT DEFAULT NULL,
    p_waiter_name TEXT DEFAULT NULL,
    p_total_estimated_cents INTEGER DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.gm_tpv_handoffs (
        restaurant_id,
        table_id,
        table_number,
        waiter_id,
        waiter_name,
        total_estimated_cents,
        notes,
        status,
        updated_at
    )
    VALUES (
        p_restaurant_id,
        p_table_id,
        p_table_number,
        p_waiter_id,
        p_waiter_name,
        p_total_estimated_cents,
        p_notes,
        'pending',
        NOW()
    )
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('id', v_id, 'status', 'pending');
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_tpv_handoff TO postgres;

CREATE OR REPLACE FUNCTION public.list_tpv_handoffs(
    p_restaurant_id UUID,
    p_status TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', id,
                'restaurant_id', restaurant_id,
                'table_id', table_id,
                'table_number', table_number,
                'waiter_id', waiter_id,
                'waiter_name', waiter_name,
                'total_estimated_cents', total_estimated_cents,
                'status', status,
                'notes', notes,
                'requested_at', requested_at,
                'consumed_at', consumed_at,
                'updated_at', updated_at
            )
            ORDER BY requested_at DESC
        ),
        '[]'::jsonb
    )
    INTO v_result
    FROM public.gm_tpv_handoffs
    WHERE restaurant_id = p_restaurant_id
      AND (
        p_status IS NULL
        OR status = p_status
      );

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_tpv_handoffs TO postgres;

CREATE OR REPLACE FUNCTION public.mark_tpv_handoff_status(
    p_handoff_id UUID,
    p_status TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated INTEGER;
BEGIN
    IF p_status NOT IN ('pending', 'awaiting_payment', 'closed', 'cancelled') THEN
        RAISE EXCEPTION 'INVALID_HANDOFF_STATUS: %', p_status;
    END IF;

    UPDATE public.gm_tpv_handoffs
    SET status = p_status,
        notes = COALESCE(p_notes, notes),
        consumed_at = CASE WHEN p_status IN ('closed', 'cancelled') THEN NOW() ELSE consumed_at END,
        updated_at = NOW()
    WHERE id = p_handoff_id;

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated = 0 THEN
        RAISE EXCEPTION 'HANDOFF_NOT_FOUND: %', p_handoff_id;
    END IF;

    RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_tpv_handoff_status TO postgres;

COMMIT;
