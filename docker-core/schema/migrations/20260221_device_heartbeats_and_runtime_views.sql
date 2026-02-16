-- 20260221_device_heartbeats_and_runtime_views.sql
-- Heartbeats de TPV/KDS/Staff e view de saúde por restaurante.
-- Ref: docs/strategy/OBSERVABILITY_MINIMA.md, MULTIUNIT_OWNER_DASHBOARD_CONTRACT.md

-- migrate:up

-- =============================================================================
-- 1. gm_device_heartbeats — último contacto por dispositivo
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gm_device_heartbeats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    module_id TEXT NOT NULL CHECK (module_id IN ('TPV', 'KDS', 'STAFF', 'OTHER')),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'unknown')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (restaurant_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_gm_device_heartbeats_restaurant
    ON public.gm_device_heartbeats(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_gm_device_heartbeats_last_seen
    ON public.gm_device_heartbeats(restaurant_id, module_id, last_seen_at DESC);

COMMENT ON TABLE public.gm_device_heartbeats IS 'Último heartbeat por dispositivo (TPV, KDS, Staff). Alimenta HealthDashboard e multi-unidade.';

-- =============================================================================
-- 2. vw_runtime_health_by_restaurant — agregado TPV/KDS online por restaurante
-- =============================================================================

CREATE OR REPLACE VIEW public.vw_runtime_health_by_restaurant
WITH (security_invoker = on) AS
SELECT
    restaurant_id,
    COUNT(*) FILTER (WHERE module_id = 'TPV' AND status = 'online') AS tpv_online_count,
    COUNT(*) FILTER (WHERE module_id = 'TPV') AS tpv_total_count,
    COUNT(*) FILTER (WHERE module_id = 'KDS' AND status = 'online') AS kds_online_count,
    COUNT(*) FILTER (WHERE module_id = 'KDS') AS kds_total_count,
    MAX(last_seen_at) FILTER (WHERE module_id = 'TPV') AS tpv_last_seen_at,
    MAX(last_seen_at) FILTER (WHERE module_id = 'KDS') AS kds_last_seen_at
FROM public.gm_device_heartbeats
GROUP BY restaurant_id;

COMMENT ON VIEW public.vw_runtime_health_by_restaurant IS 'Contagem de TPV/KDS online por restaurante. MULTIUNIT_OWNER_DASHBOARD_CONTRACT.';

GRANT SELECT ON public.vw_runtime_health_by_restaurant TO authenticated;

-- RLS on heartbeats
ALTER TABLE public.gm_device_heartbeats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gm_device_heartbeats_tenant" ON public.gm_device_heartbeats;
CREATE POLICY "gm_device_heartbeats_tenant"
    ON public.gm_device_heartbeats
    FOR ALL
    TO authenticated
    USING (has_restaurant_access(restaurant_id))
    WITH CHECK (has_restaurant_access(restaurant_id));

DROP POLICY IF EXISTS "gm_device_heartbeats_service" ON public.gm_device_heartbeats;
CREATE POLICY "gm_device_heartbeats_service"
    ON public.gm_device_heartbeats
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

REVOKE ALL ON public.gm_device_heartbeats FROM anon;

-- migrate:down

DROP VIEW IF EXISTS public.vw_runtime_health_by_restaurant;
DROP TABLE IF EXISTS public.gm_device_heartbeats CASCADE;
