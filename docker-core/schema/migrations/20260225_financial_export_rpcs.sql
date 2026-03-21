-- =============================================================================
-- Migration: Financial Export RPCs — Enterprise Hardening Phase 2
-- Date: 2026-02-25
-- Purpose:
--   Adds server-side RPCs for exporting Z-reports and sales period data
--   as CSV-ready rows. Keeps all aggregation in Postgres for accuracy.
-- =============================================================================

-- =============================================================================
-- 1. RPC: export_z_report_csv
-- =============================================================================
-- Returns Z-report records as flattened rows for CSV export.
-- Filters by restaurant, date range. Returns one row per Z-report.

CREATE OR REPLACE FUNCTION public.export_z_report_csv(
    p_restaurant_id UUID,
    p_from DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
    p_to DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
    report_id UUID,
    report_date DATE,
    report_type TEXT,
    total_orders INT,
    total_gross_cents BIGINT,
    total_tax_cents BIGINT,
    cash_revenue_cents BIGINT,
    closed_by TEXT,
    closed_at TIMESTAMPTZ,
    notes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        zr.id AS report_id,
        zr.report_date,
        zr.report_type,
        COALESCE((zr.z_report->>'total_orders')::INT, 0) AS total_orders,
        COALESCE((zr.z_report->>'total_gross_cents')::BIGINT, 0) AS total_gross_cents,
        COALESCE((zr.z_report->>'total_tax_cents')::BIGINT, 0) AS total_tax_cents,
        COALESCE((zr.z_report->>'cash_revenue_cents')::BIGINT, 0) AS cash_revenue_cents,
        zr.closed_by,
        zr.closed_at,
        zr.notes
    FROM public.gm_z_reports zr
    WHERE zr.restaurant_id = p_restaurant_id
      AND zr.report_date BETWEEN p_from AND p_to
    ORDER BY zr.report_date DESC, zr.closed_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.export_z_report_csv TO anon, authenticated;
COMMENT ON FUNCTION public.export_z_report_csv IS
'Phase 2: Export Z-report data as flattened rows for CSV download.';

-- =============================================================================
-- 2. RPC: export_sales_period_csv
-- =============================================================================
-- Returns daily sales aggregates for a date range.
-- Groups gm_orders + gm_payments by date, returns one row per day.

CREATE OR REPLACE FUNCTION public.export_sales_period_csv(
    p_restaurant_id UUID,
    p_from DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
    p_to DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
    sale_date DATE,
    total_orders INT,
    total_gross_cents BIGINT,
    total_tax_cents BIGINT,
    cash_cents BIGINT,
    card_cents BIGINT,
    other_cents BIGINT,
    average_ticket_cents BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE(o.created_at) AS sale_date,
        COUNT(DISTINCT o.id)::INT AS total_orders,
        COALESCE(SUM(o.total_cents), 0)::BIGINT AS total_gross_cents,
        COALESCE(SUM(o.tax_cents), 0)::BIGINT AS total_tax_cents,
        COALESCE(SUM(o.total_cents) FILTER (WHERE o.payment_method IN ('cash', 'dinheiro')), 0)::BIGINT AS cash_cents,
        COALESCE(SUM(o.total_cents) FILTER (WHERE o.payment_method IN ('card', 'cartao', 'credit_card', 'debit_card')), 0)::BIGINT AS card_cents,
        COALESCE(SUM(o.total_cents) FILTER (WHERE o.payment_method NOT IN ('cash', 'dinheiro', 'card', 'cartao', 'credit_card', 'debit_card')), 0)::BIGINT AS other_cents,
        CASE
            WHEN COUNT(DISTINCT o.id) > 0
            THEN (COALESCE(SUM(o.total_cents), 0) / COUNT(DISTINCT o.id))::BIGINT
            ELSE 0
        END AS average_ticket_cents
    FROM public.gm_orders o
    WHERE o.restaurant_id = p_restaurant_id
      AND DATE(o.created_at) BETWEEN p_from AND p_to
      AND o.status IN ('completed', 'paid', 'delivered', 'CLOSED')
    GROUP BY DATE(o.created_at)
    ORDER BY DATE(o.created_at) DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.export_sales_period_csv TO anon, authenticated;
COMMENT ON FUNCTION public.export_sales_period_csv IS
'Phase 2: Export daily sales aggregates for CSV download. Groups by date.';
