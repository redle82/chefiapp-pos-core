-- 20260203_shift_history_expected_declared.sql
-- FASE 2.3: Estender get_shift_history com opening/closing e vendas por método.
-- Dashboard mostra total esperado vs declarado e discrepância (só leitura).
-- Ref.: docs/plans/FASE_2.3_CAIXA_PAGAMENTOS_FECHO.md, docs/contracts/CASH_REGISTER_AND_PAYMENTS_CONTRACT.md

CREATE OR REPLACE FUNCTION public.get_shift_history(
    p_restaurant_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ
) RETURNS TABLE (
    shift_id UUID,
    opened_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    total_sales_cents BIGINT,
    orders_count BIGINT,
    opening_balance_cents BIGINT,
    closing_balance_cents BIGINT,
    opened_by TEXT,
    closed_by TEXT,
    sales_by_method JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cr.id AS shift_id,
        cr.opened_at AS opened_at,
        cr.closed_at AS closed_at,
        COALESCE(cr.total_sales_cents, 0)::BIGINT AS total_sales_cents,
        (SELECT COUNT(*)::BIGINT
         FROM public.gm_orders o
         WHERE o.cash_register_id = cr.id AND o.status = 'CLOSED') AS orders_count,
        COALESCE(cr.opening_balance_cents, 0)::BIGINT AS opening_balance_cents,
        cr.closing_balance_cents::BIGINT AS closing_balance_cents,
        cr.opened_by AS opened_by,
        cr.closed_by AS closed_by,
        COALESCE(
            (SELECT jsonb_object_agg(sub.payment_method, sub.total_cents)
             FROM (
                 SELECT payment_method, SUM(amount_cents)::BIGINT AS total_cents
                 FROM public.gm_payments
                 WHERE cash_register_id = cr.id AND status = 'paid'
                 GROUP BY payment_method
             ) sub),
            '{}'::jsonb
        ) AS sales_by_method
    FROM public.gm_cash_registers cr
    WHERE cr.restaurant_id = p_restaurant_id
      AND cr.opened_at IS NOT NULL
      AND cr.opened_at <= p_to
      AND (cr.closed_at IS NULL OR cr.closed_at >= p_from)
    ORDER BY cr.opened_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_shift_history IS 'Dashboard RPC: histórico de turnos (gm_cash_registers) com total esperado/declarado e vendas por método (FASE 2.3).';
