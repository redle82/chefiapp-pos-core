-- =============================================================================
-- Migration: Financial Reconciliation Engine
-- Date: 2026-04-12
-- Purpose:
--   1. Add gm_financial_reconciliation daily snapshots
--   2. Enforce reconciliation lock before close_cash_register_atomic
-- =============================================================================

-- =============================================================================
-- 1. gm_financial_reconciliation
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_financial_reconciliation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    orders_total_cents BIGINT NOT NULL DEFAULT 0,
    receipts_total_cents BIGINT NOT NULL DEFAULT 0,
    z_report_total_cents BIGINT NOT NULL DEFAULT 0,
    discrepancy_amount_cents BIGINT NOT NULL DEFAULT 0,
    discrepancy_ratio NUMERIC(12,6) NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('green', 'yellow', 'red')),
    details JSONB NOT NULL DEFAULT '{}'::JSONB,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_gm_financial_reconciliation_restaurant_date UNIQUE (restaurant_id, date)
);

CREATE INDEX IF NOT EXISTS idx_gm_financial_reconciliation_restaurant_date
  ON public.gm_financial_reconciliation(restaurant_id, date DESC);

COMMENT ON TABLE public.gm_financial_reconciliation IS
'Daily financial reconciliation snapshots: orders vs receipts vs z-reports.';

-- =============================================================================
-- 2. close_cash_register_atomic lock (green reconciliation required)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.close_cash_register_atomic(
    p_cash_register_id UUID,
    p_closed_by TEXT DEFAULT NULL,
    p_declared_closing_cents BIGINT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_register RECORD;
    v_z_report JSONB;
    v_expected_cash_cents BIGINT;
    v_cash_payments_cents BIGINT;
    v_difference_cents BIGINT;
    v_reconciliation_status TEXT;
BEGIN
    -- Get register and validate
    SELECT * INTO v_register
    FROM public.gm_cash_registers
    WHERE id = p_cash_register_id;

    IF v_register IS NULL THEN
        RAISE EXCEPTION 'CASH_REGISTER_NOT_FOUND: Cash register % not found', p_cash_register_id;
    END IF;

    IF v_register.status = 'closed' THEN
        RAISE EXCEPTION 'CASH_REGISTER_ALREADY_CLOSED: Cash register % is already closed', p_cash_register_id;
    END IF;

    -- ** BILLING GUARD: block writes if subscription not active **
    PERFORM public.require_active_subscription(v_register.restaurant_id);

    -- Integrity lock: requires green reconciliation for current date
    SELECT fr.status INTO v_reconciliation_status
    FROM public.gm_financial_reconciliation fr
    WHERE fr.restaurant_id = v_register.restaurant_id
      AND fr.date = CURRENT_DATE
    LIMIT 1;

    IF v_reconciliation_status IS DISTINCT FROM 'green' THEN
        RAISE EXCEPTION 'RECONCILIATION_REQUIRED'
            USING DETAIL = json_build_object(
                'code', 'RECONCILIATION_REQUIRED',
                'restaurant_id', v_register.restaurant_id,
                'date', CURRENT_DATE,
                'status', COALESCE(v_reconciliation_status, 'missing')
            )::TEXT;
    END IF;

    -- Generate Z-Report
    v_z_report := public.generate_shift_close_report(p_cash_register_id);

    -- Calculate expected cash in drawer
    SELECT COALESCE(SUM(p.amount_cents), 0)::BIGINT INTO v_cash_payments_cents
    FROM public.gm_payments p
    WHERE p.cash_register_id = p_cash_register_id
      AND p.payment_method = 'cash'
      AND p.status = 'paid';

    v_expected_cash_cents := v_register.opening_balance_cents + v_cash_payments_cents;

    IF p_declared_closing_cents IS NOT NULL THEN
        v_difference_cents := p_declared_closing_cents - v_expected_cash_cents;
    ELSE
        v_difference_cents := 0;
    END IF;

    -- Close the register
    UPDATE public.gm_cash_registers
    SET
        status = 'closed',
        closed_at = NOW(),
        closed_by = p_closed_by,
        closing_balance_cents = COALESCE(p_declared_closing_cents, v_expected_cash_cents),
        total_sales_cents = (v_z_report->>'total_gross_cents')::BIGINT,
        updated_at = NOW()
    WHERE id = p_cash_register_id;

    -- Persist Z-report to gm_z_reports (audit trail)
    INSERT INTO public.gm_z_reports (
        restaurant_id,
        cash_register_id,
        report_date,
        report_type,
        z_report,
        closed_by,
        closed_at,
        notes
    ) VALUES (
        v_register.restaurant_id,
        p_cash_register_id,
        CURRENT_DATE,
        'shift',
        v_z_report || jsonb_build_object(
            'closing_balance_cents', COALESCE(p_declared_closing_cents, v_expected_cash_cents),
            'expected_cash_cents', v_expected_cash_cents,
            'declared_cash_cents', p_declared_closing_cents,
            'difference_cents', v_difference_cents,
            'closed_by', p_closed_by,
            'closed_at', NOW()
        ),
        p_closed_by,
        NOW(),
        NULL
    );

    -- Return full Z-Report + reconciliation info
    RETURN v_z_report || jsonb_build_object(
        'closing_balance_cents', COALESCE(p_declared_closing_cents, v_expected_cash_cents),
        'expected_cash_cents', v_expected_cash_cents,
        'declared_cash_cents', p_declared_closing_cents,
        'difference_cents', v_difference_cents,
        'closed_by', p_closed_by,
        'closed_at', NOW()
    );
END;
$$;

COMMENT ON FUNCTION public.close_cash_register_atomic IS
'Core RPC: Closes cash register atomically. BILLING_GUARD and RECONCILIATION_REQUIRED lock enforced.';
