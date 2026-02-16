-- 20260221_core_event_log.sql
-- Tabela core_event_log e views de leitura por domínio (CORE_EVENTS_CONTRACT).
-- Append-only audit log para reconciliação, dashboards e debug.
-- Ref: docs/architecture/CORE_EVENTS_CONTRACT.md

-- migrate:up

-- =============================================================================
-- 1. core_event_log — log imutável de eventos canónicos
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.core_event_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    source TEXT NOT NULL,
    correlation_id TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_core_event_log_restaurant_created
    ON public.core_event_log(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_core_event_log_event_type_created
    ON public.core_event_log(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_core_event_log_correlation
    ON public.core_event_log(correlation_id)
    WHERE correlation_id IS NOT NULL;

COMMENT ON TABLE public.core_event_log IS 'Log imutável de eventos canónicos (pedidos, tasks, stock, fiscal, runtime). Append-only. CORE_EVENTS_CONTRACT.';
COMMENT ON COLUMN public.core_event_log.source IS 'Origem: TPV, KDS, WEB_PUBLIC, TASK_ENGINE, STOCK_ENGINE, FISCAL_BRIDGE, etc.';
COMMENT ON COLUMN public.core_event_log.correlation_id IS 'Liga eventos do mesmo fluxo (ex.: pedido + fiscal).';

-- =============================================================================
-- 2. RLS — leitura por tenant
-- =============================================================================

ALTER TABLE public.core_event_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "core_event_log_tenant_select" ON public.core_event_log;
CREATE POLICY "core_event_log_tenant_select"
    ON public.core_event_log
    FOR SELECT
    TO authenticated
    USING (
        has_restaurant_access(restaurant_id)
    );

DROP POLICY IF EXISTS "core_event_log_service_all" ON public.core_event_log;
CREATE POLICY "core_event_log_service_all"
    ON public.core_event_log
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

REVOKE ALL ON public.core_event_log FROM anon;

-- =============================================================================
-- 3. Views de leitura por domínio (QUERY_DISCIPLINE: não SELECT * na tabela bruta)
-- =============================================================================

CREATE OR REPLACE VIEW public.vw_order_events_by_restaurant_and_period
WITH (security_invoker = on) AS
SELECT
    id,
    created_at,
    restaurant_id,
    event_type,
    source,
    correlation_id,
    payload
FROM public.core_event_log
WHERE event_type IN (
    'ORDER_CREATED', 'ORDER_UPDATED', 'ORDER_PAID', 'ORDER_CANCELLED',
    'ORDER_ITEM_ADDED', 'ORDER_ITEM_READY', 'ORDER_ITEM_CANCELLED'
);

COMMENT ON VIEW public.vw_order_events_by_restaurant_and_period IS 'Eventos de pedidos para dashboards e reconciliação. Filtrar por restaurant_id e created_at.';

CREATE OR REPLACE VIEW public.vw_task_events_by_restaurant_and_period
WITH (security_invoker = on) AS
SELECT
    id,
    created_at,
    restaurant_id,
    event_type,
    source,
    correlation_id,
    payload
FROM public.core_event_log
WHERE event_type IN (
    'TASK_CREATED', 'TASK_ACKNOWLEDGED', 'TASK_RESOLVED', 'TASK_DISMISSED'
);

COMMENT ON VIEW public.vw_task_events_by_restaurant_and_period IS 'Eventos de tasks para monitor de risco. Filtrar por restaurant_id e created_at.';

CREATE OR REPLACE VIEW public.vw_fiscal_events_by_restaurant_and_period
WITH (security_invoker = on) AS
SELECT
    id,
    created_at,
    restaurant_id,
    event_type,
    source,
    correlation_id,
    payload
FROM public.core_event_log
WHERE event_type IN (
    'FISCAL_SYNC_REQUESTED', 'FISCAL_SYNC_CONFIRMED', 'FISCAL_SYNC_FAILED'
);

COMMENT ON VIEW public.vw_fiscal_events_by_restaurant_and_period IS 'Eventos fiscais para reconciliação de turno. Filtrar por restaurant_id e created_at.';

-- Grants para views (herdam RLS da tabela base quando leem core_event_log)
GRANT SELECT ON public.vw_order_events_by_restaurant_and_period TO authenticated;
GRANT SELECT ON public.vw_task_events_by_restaurant_and_period TO authenticated;
GRANT SELECT ON public.vw_fiscal_events_by_restaurant_and_period TO authenticated;

-- migrate:down

DROP VIEW IF EXISTS public.vw_fiscal_events_by_restaurant_and_period;
DROP VIEW IF EXISTS public.vw_task_events_by_restaurant_and_period;
DROP VIEW IF EXISTS public.vw_order_events_by_restaurant_and_period;
DROP TABLE IF EXISTS public.core_event_log CASCADE;
