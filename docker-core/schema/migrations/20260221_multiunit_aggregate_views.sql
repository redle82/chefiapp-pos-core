-- 20260221_multiunit_aggregate_views.sql
-- Views agregadas para dashboard multi-unidade (olhar de dono).
-- Ref: docs/architecture/MULTIUNIT_OWNER_DASHBOARD_CONTRACT.md, QUERY_DISCIPLINE.

-- migrate:up

-- =============================================================================
-- 1. vw_revenue_by_restaurant_and_period
-- Faturação por restaurante e período (hoje/semana/mês). Base: gm_orders pagos.
-- =============================================================================

CREATE OR REPLACE VIEW public.vw_revenue_by_restaurant_and_period
WITH (security_invoker = on) AS
SELECT
    restaurant_id,
    date_trunc('day', updated_at)::date AS period_date,
    COUNT(*) AS orders_count,
    COALESCE(SUM(total_cents), 0)::BIGINT AS total_revenue_cents
FROM public.gm_orders
WHERE status IN ('CLOSED', 'READY')
  AND payment_status IN ('PAID', 'PARTIALLY_PAID')
GROUP BY restaurant_id, date_trunc('day', updated_at)::date;

COMMENT ON VIEW public.vw_revenue_by_restaurant_and_period IS 'Faturação por restaurante e dia. Filtrar period_date para período desejado. MULTIUNIT_OWNER_DASHBOARD_CONTRACT.';

GRANT SELECT ON public.vw_revenue_by_restaurant_and_period TO authenticated;

-- =============================================================================
-- 2. vw_tasks_by_restaurant_and_severity
-- Contagem de tasks abertas por restaurante e prioridade.
-- =============================================================================

CREATE OR REPLACE VIEW public.vw_tasks_by_restaurant_and_severity
WITH (security_invoker = on) AS
SELECT
    restaurant_id,
    priority,
    COUNT(*) AS open_count
FROM public.gm_tasks
WHERE status IN ('OPEN', 'ACKNOWLEDGED')
GROUP BY restaurant_id, priority;

COMMENT ON VIEW public.vw_tasks_by_restaurant_and_severity IS 'Tasks abertas por restaurante e prioridade (CRITICA, ALTA, etc). MULTIUNIT_OWNER_DASHBOARD_CONTRACT.';

GRANT SELECT ON public.vw_tasks_by_restaurant_and_severity TO authenticated;

-- =============================================================================
-- 3. vw_stock_risk_by_restaurant
-- Itens de stock em risco (qty <= min_qty) por restaurante.
-- =============================================================================

CREATE OR REPLACE VIEW public.vw_stock_risk_by_restaurant
WITH (security_invoker = on) AS
SELECT
    restaurant_id,
    COUNT(*) AS critical_stock_items_count
FROM public.gm_stock_levels
WHERE min_qty > 0 AND qty <= min_qty
GROUP BY restaurant_id;

COMMENT ON VIEW public.vw_stock_risk_by_restaurant IS 'Contagem de itens com stock <= mínimo por restaurante. MULTIUNIT_OWNER_DASHBOARD_CONTRACT.';

GRANT SELECT ON public.vw_stock_risk_by_restaurant TO authenticated;

-- =============================================================================
-- 4. vw_reconciliation_by_day_and_restaurant (fiscal)
-- Ref: FISCAL_RECONCILIATION_CONTRACT — views auxiliares
-- =============================================================================

CREATE OR REPLACE VIEW public.vw_reconciliation_by_day_and_restaurant
WITH (security_invoker = on) AS
SELECT
    restaurant_id,
    date_trunc('day', created_at)::date AS reconciliation_date,
    COUNT(*) AS reconciliation_count,
    COUNT(*) FILTER (WHERE status = 'OK') AS ok_count,
    COUNT(*) FILTER (WHERE status = 'DIVERGENT') AS divergent_count,
    COUNT(*) FILTER (WHERE status = 'PENDING_DATA') AS pending_count
FROM public.gm_reconciliations
GROUP BY restaurant_id, date_trunc('day', created_at)::date;

COMMENT ON VIEW public.vw_reconciliation_by_day_and_restaurant IS 'Reconciliações fiscais por restaurante e dia. FISCAL_RECONCILIATION_CONTRACT.';

GRANT SELECT ON public.vw_reconciliation_by_day_and_restaurant TO authenticated;

-- =============================================================================
-- 5. RPC get_multiunit_overview — uma chamada para o dashboard multi-unidade
-- Retorna uma linha por restaurante acessível ao utilizador (current_user_restaurants).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_multiunit_overview(
    p_period_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
    restaurant_id UUID,
    restaurant_name TEXT,
    revenue_cents BIGINT,
    open_orders_count BIGINT,
    critical_tasks_count BIGINT,
    critical_stock_count BIGINT,
    shift_status TEXT,
    tpv_online BOOLEAN,
    kds_online BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id AS restaurant_id,
        r.name AS restaurant_name,
        COALESCE(rev.total_revenue_cents, 0)::BIGINT AS revenue_cents,
        COALESCE(ord.open_orders_count, 0)::BIGINT AS open_orders_count,
        COALESCE(tsk.critical_tasks_count, 0)::BIGINT AS critical_tasks_count,
        COALESCE(stk.critical_stock_count, 0)::BIGINT AS critical_stock_count,
        COALESCE(sh.status, 'UNKNOWN')::TEXT AS shift_status,
        (COALESCE(rh.tpv_online_count, 0) > 0) AS tpv_online,
        (COALESCE(rh.kds_online_count, 0) > 0) AS kds_online
    FROM public.current_user_restaurants() cur
    JOIN public.gm_restaurants r ON r.id = cur.restaurant_id
    LEFT JOIN (
        SELECT restaurant_id, SUM(total_revenue_cents) AS total_revenue_cents
        FROM public.vw_revenue_by_restaurant_and_period
        WHERE period_date = p_period_date
        GROUP BY restaurant_id
    ) rev ON rev.restaurant_id = r.id
    LEFT JOIN (
        SELECT o.restaurant_id, COUNT(*)::BIGINT AS open_orders_count
        FROM public.gm_orders o
        WHERE o.status IN ('OPEN', 'PREPARING', 'IN_PREP', 'READY')
          AND o.payment_status = 'PENDING'
        GROUP BY o.restaurant_id
    ) ord ON ord.restaurant_id = r.id
    LEFT JOIN (
        SELECT restaurant_id, SUM(open_count)::BIGINT AS critical_tasks_count
        FROM public.vw_tasks_by_restaurant_and_severity
        WHERE priority = 'CRITICA'
        GROUP BY restaurant_id
    ) tsk ON tsk.restaurant_id = r.id
    LEFT JOIN (
        SELECT restaurant_id, critical_stock_items_count::BIGINT AS critical_stock_count
        FROM public.vw_stock_risk_by_restaurant
    ) stk ON stk.restaurant_id = r.id
    LEFT JOIN LATERAL (
        SELECT CASE WHEN EXISTS (SELECT 1 FROM public.gm_cash_registers x WHERE x.restaurant_id = r.id AND x.status = 'open') THEN 'OPEN' ELSE 'CLOSED' END AS status
    ) sh ON true
    LEFT JOIN public.vw_runtime_health_by_restaurant rh ON rh.restaurant_id = r.id;
END;
$$;

COMMENT ON FUNCTION public.get_multiunit_overview IS 'Dashboard multi-unidade: uma linha por restaurante acessível, com faturação, pedidos abertos, tasks críticas, stock, turno e TPV/KDS online. MULTIUNIT_OWNER_DASHBOARD_CONTRACT.';

GRANT EXECUTE ON FUNCTION public.get_multiunit_overview(DATE) TO authenticated;

-- migrate:down

DROP FUNCTION IF EXISTS public.get_multiunit_overview(DATE);
DROP VIEW IF EXISTS public.vw_reconciliation_by_day_and_restaurant;
DROP VIEW IF EXISTS public.vw_stock_risk_by_restaurant;
DROP VIEW IF EXISTS public.vw_tasks_by_restaurant_and_severity;
DROP VIEW IF EXISTS public.vw_revenue_by_restaurant_and_period;
