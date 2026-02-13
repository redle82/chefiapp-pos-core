-- =============================================================================
-- PHASE 4C: Shift Reconciliation v2
-- =============================================================================
-- Adds an RPC to reconcile operational shift totals with fiscal snapshots.
-- Uses existing tables: gm_fiscal_snapshots, gm_reconciliations, gm_orders.
-- Depends on: 20260219_z_report_shift_close.sql (generate_shift_close_report)
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- RPC: reconcile_shift_v2
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reconcile_shift_v2(
    p_cash_register_id UUID,
    p_fiscal_snapshot_id UUID DEFAULT NULL,
    p_reconciled_by UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_register RECORD;
    v_shift_report JSONB;
    v_fiscal_snapshot RECORD;
    v_total_operational BIGINT;
    v_total_fiscal BIGINT;
    v_difference BIGINT;
    v_status TEXT;
    v_recon_id UUID;
BEGIN
    SELECT * INTO v_register
    FROM public.gm_cash_registers
    WHERE id = p_cash_register_id;

    IF v_register IS NULL THEN
        RAISE EXCEPTION 'CASH_REGISTER_NOT_FOUND: %', p_cash_register_id;
    END IF;

    -- Build operational totals from shift report
    v_shift_report := public.generate_shift_close_report(p_cash_register_id);
    v_total_operational := (v_shift_report->>'total_gross_cents')::BIGINT;

    -- Fiscal snapshot (optional)
    IF p_fiscal_snapshot_id IS NOT NULL THEN
        SELECT * INTO v_fiscal_snapshot
        FROM public.gm_fiscal_snapshots
        WHERE id = p_fiscal_snapshot_id;

        IF v_fiscal_snapshot IS NULL THEN
            RAISE EXCEPTION 'FISCAL_SNAPSHOT_NOT_FOUND: %', p_fiscal_snapshot_id;
        END IF;

        v_total_fiscal := v_fiscal_snapshot.total_fiscal_cents;
    ELSE
        v_total_fiscal := 0;
    END IF;

    v_difference := v_total_operational - v_total_fiscal;

    IF p_fiscal_snapshot_id IS NULL THEN
        v_status := 'PENDING_DATA';
    ELSIF v_difference = 0 THEN
        v_status := 'OK';
    ELSE
        v_status := 'DIVERGENT';
    END IF;

    -- Insert reconciliation record
    INSERT INTO public.gm_reconciliations (
        restaurant_id,
        shift_id,
        fiscal_snapshot_id,
        total_operational_cents,
        total_fiscal_cents,
        difference_cents,
        status,
        reason_code,
        notes,
        reconciled_by,
        created_at
    ) VALUES (
        v_register.restaurant_id,
        v_register.id,
        p_fiscal_snapshot_id,
        v_total_operational,
        v_total_fiscal,
        v_difference,
        v_status,
        CASE
            WHEN v_status = 'DIVERGENT' THEN 'SHIFT_TOTAL_MISMATCH'
            WHEN v_status = 'PENDING_DATA' THEN 'FISCAL_SNAPSHOT_MISSING'
            ELSE NULL
        END,
        p_notes,
        p_reconciled_by,
        NOW()
    ) RETURNING id INTO v_recon_id;

    RETURN jsonb_build_object(
        'reconciliation_id', v_recon_id,
        'status', v_status,
        'total_operational_cents', v_total_operational,
        'total_fiscal_cents', v_total_fiscal,
        'difference_cents', v_difference,
        'cash_register_id', p_cash_register_id,
        'fiscal_snapshot_id', p_fiscal_snapshot_id
    );
END;
$$;

COMMENT ON FUNCTION public.reconcile_shift_v2 IS
'Reconciles shift close totals against fiscal snapshots. Inserts gm_reconciliations row.';

GRANT EXECUTE ON FUNCTION public.reconcile_shift_v2(UUID, UUID, UUID, TEXT) TO authenticated, service_role;

COMMIT;
