-- =============================================================================
-- Migration: get_org_daily_consolidation RPC + org integrity SQL guard
-- Date: 2026-04-14
-- Purpose:
--   1) Ensure required multi-location tables exist (idempotent)
--   2) Add SQL-level org integrity assertion for hard-lock flows
--   3) Add dashboard-safe enterprise RPC get_org_daily_consolidation
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Phase 1: Ensure schema objects exist (safe / idempotent)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gm_organization_restaurants (
    organization_id UUID NOT NULL REFERENCES public.gm_organizations(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, restaurant_id)
);

CREATE TABLE IF NOT EXISTS public.gm_org_daily_consolidation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.gm_organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_orders BIGINT NOT NULL DEFAULT 0,
    total_receipts BIGINT NOT NULL DEFAULT 0,
    total_revenue_cents BIGINT NOT NULL DEFAULT 0,
    total_discrepancy_cents BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('green', 'yellow', 'red')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_gm_org_daily_consolidation_org_date UNIQUE (organization_id, date)
);

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

-- -----------------------------------------------------------------------------
-- Phase 3: SQL-level hard lock for billing/invoice generation paths
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assert_org_financial_integrity(
    p_org_id UUID,
    p_date DATE
)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT c.status
      INTO v_status
      FROM public.gm_org_daily_consolidation c
     WHERE c.organization_id = p_org_id
       AND c.date = p_date
     LIMIT 1;

    IF v_status IS DISTINCT FROM 'green' THEN
        RAISE EXCEPTION 'ORG_RECONCILIATION_REQUIRED'
            USING DETAIL = json_build_object(
                'code', 'ORG_RECONCILIATION_REQUIRED',
                'organization_id', p_org_id,
                'date', p_date,
                'status', COALESCE(v_status, 'missing')
            )::TEXT;
    END IF;
END;
$$;

COMMENT ON FUNCTION public.assert_org_financial_integrity IS
'Hard lock for enterprise financial operations (billing/invoice/export). Throws ORG_RECONCILIATION_REQUIRED when org-day status is not green.';

-- -----------------------------------------------------------------------------
-- Phase 2 + 3: Dashboard-safe RPC (never throws for missing/non-green org-day)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_org_daily_consolidation(
    p_org_id TEXT,
    p_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_org_id UUID;
    v_org_record RECORD;
    v_org_payload JSONB;
    v_restaurants JSONB := '[]'::JSONB;
    v_heatmap JSONB := '[]'::JSONB;
    v_integrity_ok BOOLEAN := NULL;
    v_integrity_code TEXT := NULL;
BEGIN
    BEGIN
        v_org_id := p_org_id::UUID;
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'org', NULL,
            'restaurants', '[]'::JSONB,
            'heatmap', '[]'::JSONB,
            'integrity_ok', NULL,
            'integrity_code', NULL
        );
    END;

    SELECT c.organization_id,
           c.date,
           c.status,
           c.total_orders,
           c.total_receipts,
           c.total_revenue_cents,
           c.total_discrepancy_cents
      INTO v_org_record
      FROM public.gm_org_daily_consolidation c
     WHERE c.organization_id = v_org_id
       AND c.date = p_date
     LIMIT 1;

    IF v_org_record IS NULL THEN
        RETURN jsonb_build_object(
            'org', NULL,
            'restaurants', '[]'::JSONB,
            'heatmap', '[]'::JSONB,
            'integrity_ok', NULL,
            'integrity_code', NULL
        );
    END IF;

    v_org_payload := jsonb_build_object(
        'organization_id', v_org_record.organization_id,
        'date', v_org_record.date,
        'status', v_org_record.status,
        'total_orders', v_org_record.total_orders,
        'total_receipts', v_org_record.total_receipts,
        'total_revenue_cents', v_org_record.total_revenue_cents,
        'total_discrepancy_cents', v_org_record.total_discrepancy_cents
    );

    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'restaurant_id', r.id,
                'restaurant_name', r.name,
                'status', fr.status,
                'orders_total_cents', COALESCE(fr.orders_total_cents, 0),
                'receipts_total_cents', COALESCE(fr.receipts_total_cents, 0),
                'z_report_total_cents', COALESCE(fr.z_report_total_cents, 0),
                'discrepancy_amount_cents', COALESCE(fr.discrepancy_amount_cents, 0),
                'discrepancy_ratio', COALESCE(fr.discrepancy_ratio, 0)
            )
            ORDER BY r.id
        ),
        '[]'::JSONB
    )
    INTO v_restaurants
    FROM public.gm_organization_restaurants orr
    JOIN public.gm_restaurants r ON r.id = orr.restaurant_id
    LEFT JOIN public.gm_financial_reconciliation fr
           ON fr.restaurant_id = r.id
          AND fr.date = p_date
   WHERE orr.organization_id = v_org_id;

    WITH mapped_restaurants AS (
        SELECT r.id AS restaurant_id
          FROM public.gm_organization_restaurants orr
          JOIN public.gm_restaurants r ON r.id = orr.restaurant_id
         WHERE orr.organization_id = v_org_id
    ),
    day_grid AS (
        SELECT mr.restaurant_id,
               gs::DATE AS grid_date
          FROM mapped_restaurants mr
         CROSS JOIN generate_series(
                (p_date - INTERVAL '6 days')::DATE,
                p_date,
                INTERVAL '1 day'
         ) gs
    ),
    with_fr AS (
        SELECT dg.restaurant_id,
               dg.grid_date,
               fr.status,
               COALESCE(fr.discrepancy_amount_cents, 0) AS discrepancy_amount_cents
          FROM day_grid dg
          LEFT JOIN public.gm_financial_reconciliation fr
                 ON fr.restaurant_id = dg.restaurant_id
                AND fr.date = dg.grid_date
    ),
    days_grouped AS (
        SELECT restaurant_id,
               jsonb_agg(
                   jsonb_build_object(
                       'date', grid_date,
                       'status', status,
                       'discrepancy_amount_cents', discrepancy_amount_cents
                   )
                   ORDER BY grid_date
               ) AS days
          FROM with_fr
         GROUP BY restaurant_id
    )
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'restaurant_id', restaurant_id,
                'days', days
            )
            ORDER BY restaurant_id
        ),
        '[]'::JSONB
    )
    INTO v_heatmap
    FROM days_grouped;

    IF v_org_record.status = 'green' THEN
        v_integrity_ok := TRUE;
        v_integrity_code := NULL;
    ELSE
        v_integrity_ok := FALSE;
        v_integrity_code := 'ORG_RECONCILIATION_REQUIRED';
    END IF;

    RETURN jsonb_build_object(
        'org', v_org_payload,
        'restaurants', v_restaurants,
        'heatmap', v_heatmap,
        'integrity_ok', v_integrity_ok,
        'integrity_code', v_integrity_code
    );
END;
$$;

COMMENT ON FUNCTION public.get_org_daily_consolidation IS
'Dashboard-safe enterprise consolidation RPC. Returns org summary + restaurant breakdown + 7-day heatmap and integrity flags. Never throws for missing org/day.';

GRANT EXECUTE ON FUNCTION public.assert_org_financial_integrity(UUID, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.assert_org_financial_integrity(UUID, DATE) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_org_daily_consolidation(TEXT, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_org_daily_consolidation(TEXT, DATE) TO authenticated;
