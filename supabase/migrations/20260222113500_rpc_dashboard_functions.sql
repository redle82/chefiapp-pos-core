-- =============================================================================
-- MIGRATION: 20260222113500_rpc_dashboard_functions.sql
-- OBJETIVO  : Declarar formalmente no repositório Supabase os RPCs de dashboard
--             que existem em produção (via Docker Core / backup 2026-02-13) mas
--             não constavam nas migrations oficiais do Supabase.
--
-- PRINCÍPIO : Idempotente — usa CREATE OR REPLACE. Pode ser re-executado.
-- SEGURANÇA : SECURITY DEFINER + SET search_path para prevenir esquemas maliciosos.
-- ACESSO    : service_role (backend) + authenticated (UI dashboard widgets).
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. get_daily_metrics
--    Metricas diárias: receita, total pedidos, ticket médio, vendas por hora.
--    Utilizada por: useDailyMetrics hook → Manager Dashboard + Reports.
--    Alinhada com status canónico: CLOSED + PAID / PARTIALLY_PAID.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_daily_metrics(
    p_restaurant_id UUID,
    p_timezone      TEXT DEFAULT 'Europe/Lisbon'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_sales_cents BIGINT;
    v_total_orders      INTEGER;
    v_avg_ticket_cents  NUMERIC;
    v_sales_by_hour     JSONB;
    v_start_of_day      TIMESTAMPTZ;
BEGIN
    -- Início do dia no timezone do restaurante (UTC truncado por defeito)
    v_start_of_day := DATE_TRUNC('day', NOW() AT TIME ZONE p_timezone)
                        AT TIME ZONE p_timezone;

    -- 1. Soma de vendas + contagem de pedidos FECHADOS e PAGOS
    SELECT
        COALESCE(SUM(total_cents), 0),
        COUNT(*)
    INTO v_total_sales_cents, v_total_orders
    FROM public.gm_orders
    WHERE restaurant_id    = p_restaurant_id
      AND status           = 'CLOSED'
      AND payment_status  IN ('PAID', 'PARTIALLY_PAID')
      AND created_at      >= v_start_of_day;

    -- 2. Ticket médio
    v_avg_ticket_cents := CASE
        WHEN v_total_orders > 0
        THEN TRUNC(v_total_sales_cents::NUMERIC / v_total_orders)
        ELSE 0
    END;

    -- 3. Vendas por hora (dados de gráfico para o dashboard)
    WITH hourly_data AS (
        SELECT
            EXTRACT(HOUR FROM (created_at AT TIME ZONE p_timezone))::INTEGER AS hour,
            SUM(total_cents) AS total_cents
        FROM public.gm_orders
        WHERE restaurant_id    = p_restaurant_id
          AND status           = 'CLOSED'
          AND payment_status  IN ('PAID', 'PARTIALLY_PAID')
          AND created_at      >= v_start_of_day
        GROUP BY 1
        ORDER BY 1 ASC
    )
    SELECT COALESCE(
        jsonb_agg(jsonb_build_object('hour', hour, 'total_cents', total_cents)),
        '[]'::jsonb
    )
    INTO v_sales_by_hour
    FROM hourly_data;

    RETURN jsonb_build_object(
        'total_sales_cents', v_total_sales_cents,
        'total_orders',      v_total_orders,
        'avg_ticket_cents',  v_avg_ticket_cents,
        'sales_by_hour',     v_sales_by_hour
    );
END;
$$;

COMMENT ON FUNCTION public.get_daily_metrics(UUID, TEXT) IS
    'Dashboard RPC: métricas diárias (receita, pedidos, ticket médio, vendas por hora) '
    'para o restaurante indicado, filtradas pelo início do dia no timezone configurado.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Permissões explícitas de acesso
--    service_role  → backend Docker Core (acesso total)
--    authenticated → UI autenticada pode chamar diretamente via Supabase client
-- ─────────────────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.get_daily_metrics(UUID, TEXT)
    TO service_role, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. refresh_restaurant_stats — actualiza a materialized view mv_restaurant_daily_stats
--    Criada em 20260222113300 (performance_optimizations).
--    Normalizar grant aqui para consistência de auditoria.
-- ─────────────────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.refresh_restaurant_stats()
    TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Acesso à materialized view mv_restaurant_daily_stats
--    Apenas service_role — a view agrega dados de todos os restaurantes.
--    UI nunca lê diretamente: usa get_daily_metrics via backend.
-- ─────────────────────────────────────────────────────────────────────────────
GRANT SELECT ON public.mv_restaurant_daily_stats TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Agendamento da view (comentário de orientação para operações)
--    Para agendar o refresh automático usa pg_cron no Supabase:
--
--    SELECT cron.schedule(
--        'refresh-restaurant-stats',
--        '*/15 * * * *',         -- a cada 15 minutos
--        'SELECT public.refresh_restaurant_stats();'
--    );
--
--    Isto é opcional — a view é refrescada on-demand pelo backend após cada
--    order CLOSED. O cron serve apenas como salvaguarda.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- FIM DA MIGRATION
-- Supabase migration: FULL — aplica alterações de função e permissões.
-- Reversão: DROP FUNCTION public.get_daily_metrics(UUID, TEXT);
-- ─────────────────────────────────────────────────────────────────────────────
