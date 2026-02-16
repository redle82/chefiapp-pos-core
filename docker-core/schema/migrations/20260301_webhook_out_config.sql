-- =============================================================================
-- Webhooks OUT: config e logs de entrega
-- =============================================================================
-- Ref: CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md §5 (config), §7 (logs).
-- Tabelas: webhook_out_config (url, secret, events[], enabled), webhook_out_delivery_log.
-- RLS por restaurant_id.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. webhook_out_config
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_out_config (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    secret          TEXT NOT NULL,
    events          JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [] = todos
    enabled         BOOLEAN NOT NULL DEFAULT true,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_out_config_restaurant_enabled
    ON public.webhook_out_config(restaurant_id) WHERE enabled = true;

COMMENT ON TABLE public.webhook_out_config IS 'Configuração de webhooks OUT por restaurante (URL, secret HMAC, eventos).';

-- ---------------------------------------------------------------------------
-- 2. webhook_out_delivery_log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_out_delivery_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id         TEXT NOT NULL,   -- id do payload (wh_evt_...)
    webhook_config_id   UUID NOT NULL REFERENCES public.webhook_out_config(id) ON DELETE CASCADE,
    restaurant_id       UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    event               TEXT NOT NULL,
    url                 TEXT NOT NULL,
    status_code         INT,
    attempt             INT NOT NULL DEFAULT 1,
    attempted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_retry_at       TIMESTAMPTZ,
    error_message       TEXT
);

CREATE INDEX IF NOT EXISTS idx_webhook_out_delivery_log_config
    ON public.webhook_out_delivery_log(webhook_config_id);
CREATE INDEX IF NOT EXISTS idx_webhook_out_delivery_log_restaurant_attempted
    ON public.webhook_out_delivery_log(restaurant_id, attempted_at DESC);

COMMENT ON TABLE public.webhook_out_delivery_log IS 'Log de cada tentativa de entrega de webhook OUT (sem corpo do payload).';

-- ---------------------------------------------------------------------------
-- 3. RLS (assumindo has_restaurant_access já existe)
-- ---------------------------------------------------------------------------
ALTER TABLE public.webhook_out_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_out_delivery_log ENABLE ROW LEVEL SECURITY;

-- webhook_out_config: authenticated by restaurant; service_role full
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_out_config' AND policyname = 'webhook_out_config_select') THEN
        CREATE POLICY "webhook_out_config_select" ON public.webhook_out_config
            FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_out_config' AND policyname = 'webhook_out_config_insert') THEN
        CREATE POLICY "webhook_out_config_insert" ON public.webhook_out_config
            FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_out_config' AND policyname = 'webhook_out_config_update') THEN
        CREATE POLICY "webhook_out_config_update" ON public.webhook_out_config
            FOR UPDATE TO authenticated
            USING (has_restaurant_access(restaurant_id))
            WITH CHECK (has_restaurant_access(restaurant_id));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_out_config' AND policyname = 'webhook_out_config_delete') THEN
        CREATE POLICY "webhook_out_config_delete" ON public.webhook_out_config
            FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_out_config' AND policyname = 'webhook_out_config_service') THEN
        CREATE POLICY "webhook_out_config_service" ON public.webhook_out_config
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- webhook_out_delivery_log: select by restaurant; insert only by service (backend)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_out_delivery_log' AND policyname = 'webhook_out_delivery_log_select') THEN
        CREATE POLICY "webhook_out_delivery_log_select" ON public.webhook_out_delivery_log
            FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_out_delivery_log' AND policyname = 'webhook_out_delivery_log_insert_service') THEN
        CREATE POLICY "webhook_out_delivery_log_insert_service" ON public.webhook_out_delivery_log
            FOR INSERT TO service_role WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_out_delivery_log' AND policyname = 'webhook_out_delivery_log_service') THEN
        CREATE POLICY "webhook_out_delivery_log_service" ON public.webhook_out_delivery_log
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Grant
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_out_config TO authenticated;
GRANT ALL ON public.webhook_out_config TO service_role;
GRANT SELECT ON public.webhook_out_delivery_log TO authenticated;
GRANT INSERT, SELECT ON public.webhook_out_delivery_log TO service_role;

COMMIT;
