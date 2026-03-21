-- =============================================================================
-- Migration: get_reconciliation_report RPC
-- Date: 2026-04-12
-- Purpose: Financial reconciliation report per day
-- Compares orders (gm_orders) vs receipts (gm_payment_receipts via gm_payment_intents)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_reconciliation_report(
    p_restaurant_id UUID,
    p_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_total_orders INT := 0;
    v_total_order_amount BIGINT := 0;
    v_total_receipts INT := 0;
    v_total_receipt_amount BIGINT := 0;
    v_missing_receipts INT := 0;
    v_orphan_receipts INT := 0;
    v_mismatched_orders INT := 0;
    v_discrepancies JSONB := '[]'::JSONB;
    v_row RECORD;
    v_expected BIGINT;
    v_received BIGINT;
    v_diff BIGINT;
BEGIN
    -- Orders closed on p_date (updated_at when status=CLOSED, fallback created_at)
    SELECT
        COUNT(*)::INT,
        COALESCE(SUM(total_cents), 0)::BIGINT
    INTO v_total_orders, v_total_order_amount
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id
      AND status = 'CLOSED'
      AND (updated_at::DATE = p_date OR created_at::DATE = p_date);

    -- Receipts for intents with orders on p_date
    SELECT
        COUNT(DISTINCT pr.id)::INT,
        COALESCE(SUM(pr.amount), 0)::BIGINT
    INTO v_total_receipts, v_total_receipt_amount
    FROM public.gm_payment_receipts pr
    JOIN public.gm_payment_intents pi ON pi.id = pr.intent_id
    WHERE pi.restaurant_id = p_restaurant_id
      AND pi.order_id IS NOT NULL
      AND (pr.captured_at::DATE = p_date OR pi.created_at::DATE = p_date);

    -- Discrepancies: orders with expected != received
    FOR v_row IN
        SELECT
            o.id AS order_id,
            o.total_cents AS expected,
            COALESCE(rec.received, 0) AS received
        FROM public.gm_orders o
        LEFT JOIN (
            SELECT pi.order_id, SUM(pr.amount)::BIGINT AS received
            FROM public.gm_payment_receipts pr
            JOIN public.gm_payment_intents pi ON pi.id = pr.intent_id
            WHERE pi.restaurant_id = p_restaurant_id
              AND pi.order_id IS NOT NULL
            GROUP BY pi.order_id
        ) rec ON rec.order_id = o.id
        WHERE o.restaurant_id = p_restaurant_id
          AND o.status = 'CLOSED'
          AND (o.updated_at::DATE = p_date OR o.created_at::DATE = p_date)
    LOOP
        v_expected := v_row.expected;
        v_received := v_row.received;
        v_diff := v_expected - v_received;

        IF v_diff != 0 THEN
            v_mismatched_orders := v_mismatched_orders + 1;
            v_discrepancies := v_discrepancies || jsonb_build_object(
                'order_id', v_row.order_id,
                'expected', v_expected,
                'received', v_received,
                'difference', v_diff,
                'provider', (
                    SELECT pi.provider
                    FROM public.gm_payment_intents pi
                    WHERE pi.order_id = v_row.order_id
                    LIMIT 1
                )
            );
        END IF;
    END LOOP;

    -- Missing receipts: orders with no receipts
    SELECT COUNT(*)::INT INTO v_missing_receipts
    FROM public.gm_orders o
    WHERE o.restaurant_id = p_restaurant_id
      AND o.status = 'CLOSED'
      AND (o.updated_at::DATE = p_date OR o.created_at::DATE = p_date)
      AND NOT EXISTS (
          SELECT 1 FROM public.gm_payment_receipts pr
          JOIN public.gm_payment_intents pi ON pi.id = pr.intent_id
          WHERE pi.order_id = o.id
      );

    -- Orphan receipts: receipts for intents without order_id on this date
    SELECT COUNT(*)::INT INTO v_orphan_receipts
    FROM public.gm_payment_receipts pr
    JOIN public.gm_payment_intents pi ON pi.id = pr.intent_id
    WHERE pi.restaurant_id = p_restaurant_id
      AND pi.order_id IS NULL
      AND pr.captured_at::DATE = p_date;

    RETURN jsonb_build_object(
        'total_orders', v_total_orders,
        'total_order_amount', v_total_order_amount,
        'total_receipts', v_total_receipts,
        'total_receipt_amount', v_total_receipt_amount,
        'missing_receipts', v_missing_receipts,
        'orphan_receipts', v_orphan_receipts,
        'mismatched_orders', v_mismatched_orders,
        'discrepancies', v_discrepancies
    );
END;
$$;

COMMENT ON FUNCTION public.get_reconciliation_report IS
'Financial reconciliation: orders vs receipts for a given date. Returns totals, missing/orphan counts, and discrepancies.';

GRANT EXECUTE ON FUNCTION public.get_reconciliation_report TO service_role;
GRANT EXECUTE ON FUNCTION public.get_reconciliation_report TO authenticated;
