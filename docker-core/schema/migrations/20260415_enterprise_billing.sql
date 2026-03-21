-- =============================================================================
-- Migration: Enterprise Billing Invoice Engine
-- Date: 2026-04-15
-- Purpose:
--   1) Persist org-level invoices
--   2) Generate org invoice via RPC with integrity guard
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gm_org_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.gm_organizations(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_revenue_cents BIGINT NOT NULL DEFAULT 0,
    discrepancy_cents BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('draft', 'blocked', 'issued')),
    integrity_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_gm_org_invoices_period UNIQUE (organization_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_gm_org_invoices_org_period
  ON public.gm_org_invoices(organization_id, period_start DESC, period_end DESC);

COMMENT ON TABLE public.gm_org_invoices IS
'Enterprise organization invoices generated from consolidated daily reconciliation.';

CREATE OR REPLACE FUNCTION public.generate_org_invoice(
    p_org_id TEXT,
    p_period_start DATE,
    p_period_end DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_org_id UUID;
    v_integrity_ok BOOLEAN := TRUE;
    v_integrity_code TEXT := NULL;
    v_integrity_detail TEXT := NULL;
    v_total_revenue BIGINT := 0;
    v_discrepancy BIGINT := 0;
    v_status TEXT := 'issued';
    v_snapshot JSONB;
    v_invoice_id UUID;
BEGIN
    BEGIN
        v_org_id := p_org_id::UUID;
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'invoice_id', NULL,
            'status', 'blocked',
            'total_revenue_cents', 0,
            'integrity_ok', FALSE
        );
    END;

    IF p_period_start IS NULL OR p_period_end IS NULL OR p_period_end < p_period_start THEN
        RETURN jsonb_build_object(
            'invoice_id', NULL,
            'status', 'blocked',
            'total_revenue_cents', 0,
            'integrity_ok', FALSE
        );
    END IF;

    BEGIN
        PERFORM public.assert_org_financial_integrity(v_org_id, p_period_end);
        v_integrity_ok := TRUE;
    EXCEPTION WHEN OTHERS THEN
        v_integrity_ok := FALSE;
        v_integrity_code := 'ORG_RECONCILIATION_REQUIRED';
        v_integrity_detail := SQLERRM;
    END;

    SELECT COALESCE(SUM(c.total_revenue_cents), 0)::BIGINT,
           COALESCE(SUM(c.total_discrepancy_cents), 0)::BIGINT
      INTO v_total_revenue, v_discrepancy
      FROM public.gm_org_daily_consolidation c
     WHERE c.organization_id = v_org_id
       AND c.date >= p_period_start
       AND c.date <= p_period_end;

    IF v_integrity_ok THEN
        v_status := 'issued';
    ELSE
        v_status := 'blocked';
    END IF;

    v_snapshot := jsonb_build_object(
        'integrity_ok', v_integrity_ok,
        'integrity_code', v_integrity_code,
        'integrity_detail', v_integrity_detail,
        'checked_date', p_period_end,
        'generated_at', NOW()
    );

    INSERT INTO public.gm_org_invoices (
        organization_id,
        period_start,
        period_end,
        total_revenue_cents,
        discrepancy_cents,
        status,
        integrity_snapshot,
        created_at
    ) VALUES (
        v_org_id,
        p_period_start,
        p_period_end,
        v_total_revenue,
        v_discrepancy,
        v_status,
        v_snapshot,
        NOW()
    )
    ON CONFLICT (organization_id, period_start, period_end)
    DO UPDATE SET
        total_revenue_cents = EXCLUDED.total_revenue_cents,
        discrepancy_cents = EXCLUDED.discrepancy_cents,
        status = EXCLUDED.status,
        integrity_snapshot = EXCLUDED.integrity_snapshot
    RETURNING id INTO v_invoice_id;

    RETURN jsonb_build_object(
        'invoice_id', v_invoice_id,
        'status', v_status,
        'total_revenue_cents', v_total_revenue,
        'integrity_ok', v_integrity_ok
    );
END;
$$;

COMMENT ON FUNCTION public.generate_org_invoice IS
'Generates org invoice for period. Uses assert_org_financial_integrity before issuing; blocked invoices are returned without throwing.';

GRANT EXECUTE ON FUNCTION public.generate_org_invoice(TEXT, DATE, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_org_invoice(TEXT, DATE, DATE) TO authenticated;
