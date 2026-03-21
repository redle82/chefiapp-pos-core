-- =============================================================================
-- Migration: gm_z_reports — Unificação fechamento de caixa
-- Date: 2026-04-05
-- Purpose:
--   Unifica os caminhos de fechamento: close_cash_register_atomic persiste
--   o Z-report em gm_z_reports para auditoria. FinanceEngine e ShiftCloseReport
--   passam a usar a mesma fonte de verdade.
-- Ref: docs/strategy/STRATEGIC_DECISION_FRAMEWORK.md (Próximos passos)
-- =============================================================================

-- =============================================================================
-- 1. Tabela gm_z_reports
-- =============================================================================
-- Audit trail de Z-reports (fechamento de turno ou fechamento diário).
-- Populada por close_cash_register_atomic (register-based) e por
-- create_day_z_report (day-level, sem caixa).

CREATE TABLE IF NOT EXISTS public.gm_z_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    cash_register_id UUID REFERENCES public.gm_cash_registers(id) ON DELETE SET NULL,
    report_date DATE NOT NULL,
    report_type TEXT NOT NULL DEFAULT 'shift' CHECK (report_type IN ('shift', 'day')),
    z_report JSONB NOT NULL,
    closed_by TEXT,
    closed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT gm_z_reports_type_check CHECK (report_type IN ('shift', 'day'))
);

CREATE INDEX IF NOT EXISTS idx_gm_z_reports_restaurant_date
  ON public.gm_z_reports(restaurant_id, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_gm_z_reports_cash_register
  ON public.gm_z_reports(cash_register_id) WHERE cash_register_id IS NOT NULL;
COMMENT ON TABLE public.gm_z_reports IS 'Z-Reports audit trail. Populated by close_cash_register_atomic and create_day_z_report.';

-- =============================================================================
-- 2. Alterar close_cash_register_atomic para persistir em gm_z_reports
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
'Core RPC: Closes cash register atomically. Generates Z-Report, persists to gm_z_reports, returns snapshot.';

-- =============================================================================
-- 3. RPC: create_day_z_report (fechamento diário sem caixa)
-- =============================================================================
-- Para restaurantes que fecham por dia (sem turnos por caixa).
-- Insere em gm_z_reports com report_type='day'.

CREATE OR REPLACE FUNCTION public.create_day_z_report(
    p_restaurant_id UUID,
    p_counted_cash_cents BIGINT DEFAULT NULL,
    p_closed_by TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_snapshot RECORD;
    v_cash_revenue BIGINT;
    v_cash_diff BIGINT;
    v_z_report JSONB;
    v_report_id UUID;
BEGIN
    -- Aggregate today's orders (completed/paid/delivered)
    SELECT
        COUNT(*)::INTEGER AS total_orders,
        COALESCE(SUM(total_cents), 0)::BIGINT AS total_gross_cents,
        COALESCE(SUM(tax_cents), 0)::BIGINT AS total_tax_cents
    INTO v_snapshot
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id
      AND DATE(created_at) = CURRENT_DATE
      AND status = 'CLOSED';

    -- Payment method breakdown from gm_payments
    SELECT COALESCE(SUM(p.amount_cents), 0)::BIGINT INTO v_cash_revenue
    FROM public.gm_payments p
    WHERE p.restaurant_id = p_restaurant_id
      AND p.payment_method IN ('cash', 'dinheiro')
      AND p.status = 'paid'
      AND DATE(p.created_at) = CURRENT_DATE;

    v_cash_diff := CASE
        WHEN p_counted_cash_cents IS NOT NULL THEN p_counted_cash_cents - v_cash_revenue
        ELSE 0
    END;

    v_z_report := jsonb_build_object(
        'restaurant_id', p_restaurant_id,
        'report_date', CURRENT_DATE,
        'report_type', 'day',
        'total_orders', COALESCE(v_snapshot.total_orders, 0),
        'total_gross_cents', COALESCE(v_snapshot.total_gross_cents, 0),
        'total_tax_cents', COALESCE(v_snapshot.total_tax_cents, 0),
        'cash_revenue_cents', v_cash_revenue,
        'counted_cash_cents', p_counted_cash_cents,
        'cash_diff_cents', v_cash_diff,
        'closed_by', p_closed_by,
        'closed_at', NOW()
    );

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
        p_restaurant_id,
        NULL,
        CURRENT_DATE,
        'day',
        v_z_report,
        p_closed_by,
        NOW(),
        p_notes
    )
    RETURNING id INTO v_report_id;

    RETURN v_z_report || jsonb_build_object('id', v_report_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_day_z_report TO postgres;
COMMENT ON FUNCTION public.create_day_z_report IS
'Creates day-level Z-report (no cash register). For restaurants that close by day.';
