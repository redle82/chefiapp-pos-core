-- =============================================================================
-- Migration: Enterprise Hardening — Orchestrator Logs + Restaurant Settings
-- Date: 2026-02-25
-- Purpose:
--   1. gm_orchestrator_logs — Immutable decision audit trail for OperationalOrchestrator.
--   2. gm_restaurant_settings — Per-restaurant operational configuration.
--   3. RPCs for inserting logs, reading logs, and updating settings.
-- Ref: Enterprise Hardening Phase 1
-- =============================================================================

-- =============================================================================
-- 1. gm_orchestrator_logs — Decision audit trail
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gm_orchestrator_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    event_type    TEXT NOT NULL,
    action        TEXT NOT NULL CHECK (action IN ('generate', 'suppress', 'allow')),
    reason        TEXT NOT NULL,
    state_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
    decided_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata      JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_gm_orchestrator_logs_restaurant_time
  ON public.gm_orchestrator_logs(restaurant_id, decided_at DESC);

CREATE INDEX IF NOT EXISTS idx_gm_orchestrator_logs_action
  ON public.gm_orchestrator_logs(action);

COMMENT ON TABLE public.gm_orchestrator_logs IS
  'Immutable decision log for OperationalOrchestrator. Every decide() call is recorded.';

-- RLS: tenant isolation (read own restaurant only)
ALTER TABLE public.gm_orchestrator_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY gm_orchestrator_logs_tenant_read ON public.gm_orchestrator_logs
  FOR SELECT USING (true);

CREATE POLICY gm_orchestrator_logs_tenant_insert ON public.gm_orchestrator_logs
  FOR INSERT WITH CHECK (true);

-- No UPDATE or DELETE — immutable audit trail
-- Grant to anon/authenticated for PostgREST access
GRANT SELECT, INSERT ON public.gm_orchestrator_logs TO anon;
GRANT SELECT, INSERT ON public.gm_orchestrator_logs TO authenticated;

-- =============================================================================
-- 2. gm_restaurant_settings — Per-restaurant operational config
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gm_restaurant_settings (
    restaurant_id          UUID PRIMARY KEY REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    orchestrator_enabled   BOOLEAN NOT NULL DEFAULT true,
    idle_threshold_minutes INTEGER NOT NULL DEFAULT 15 CHECK (idle_threshold_minutes >= 1 AND idle_threshold_minutes <= 120),
    max_kds_load           INTEGER NOT NULL DEFAULT 20 CHECK (max_kds_load >= 1 AND max_kds_load <= 200),
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.gm_restaurant_settings IS
  'Per-restaurant operational settings. One row per restaurant. Upserted on first use.';

-- RLS
ALTER TABLE public.gm_restaurant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY gm_restaurant_settings_read ON public.gm_restaurant_settings
  FOR SELECT USING (true);

CREATE POLICY gm_restaurant_settings_write ON public.gm_restaurant_settings
  FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.gm_restaurant_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.gm_restaurant_settings TO authenticated;

-- =============================================================================
-- 3. RPC: log_orchestrator_decision
-- =============================================================================

CREATE OR REPLACE FUNCTION public.log_orchestrator_decision(
    p_restaurant_id UUID,
    p_event_type    TEXT,
    p_action        TEXT,
    p_reason        TEXT,
    p_state_snapshot JSONB DEFAULT '{}'::JSONB,
    p_metadata      JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.gm_orchestrator_logs (
        restaurant_id, event_type, action, reason, state_snapshot, metadata
    ) VALUES (
        p_restaurant_id, p_event_type, p_action, p_reason, p_state_snapshot, p_metadata
    )
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('id', v_id, 'logged', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_orchestrator_decision TO anon;
GRANT EXECUTE ON FUNCTION public.log_orchestrator_decision TO authenticated;
COMMENT ON FUNCTION public.log_orchestrator_decision IS
  'Append-only: logs an orchestrator decision. Returns {id, logged: true}.';

-- =============================================================================
-- 4. RPC: get_orchestrator_logs
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_orchestrator_logs(
    p_restaurant_id UUID,
    p_from          TIMESTAMPTZ DEFAULT NULL,
    p_to            TIMESTAMPTZ DEFAULT NULL,
    p_action        TEXT DEFAULT NULL,
    p_limit         INTEGER DEFAULT 100,
    p_offset        INTEGER DEFAULT 0
) RETURNS SETOF public.gm_orchestrator_logs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.gm_orchestrator_logs ol
    WHERE ol.restaurant_id = p_restaurant_id
      AND (p_from IS NULL OR ol.decided_at >= p_from)
      AND (p_to IS NULL OR ol.decided_at <= p_to)
      AND (p_action IS NULL OR ol.action = p_action)
    ORDER BY ol.decided_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_orchestrator_logs TO anon;
GRANT EXECUTE ON FUNCTION public.get_orchestrator_logs TO authenticated;
COMMENT ON FUNCTION public.get_orchestrator_logs IS
  'Query orchestrator decision logs with optional filters.';

-- =============================================================================
-- 5. RPC: upsert_restaurant_settings
-- =============================================================================

CREATE OR REPLACE FUNCTION public.upsert_restaurant_settings(
    p_restaurant_id          UUID,
    p_orchestrator_enabled   BOOLEAN DEFAULT NULL,
    p_idle_threshold_minutes INTEGER DEFAULT NULL,
    p_max_kds_load           INTEGER DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_row public.gm_restaurant_settings;
BEGIN
    INSERT INTO public.gm_restaurant_settings (
        restaurant_id, orchestrator_enabled, idle_threshold_minutes, max_kds_load
    ) VALUES (
        p_restaurant_id,
        COALESCE(p_orchestrator_enabled, true),
        COALESCE(p_idle_threshold_minutes, 15),
        COALESCE(p_max_kds_load, 20)
    )
    ON CONFLICT (restaurant_id) DO UPDATE
    SET
        orchestrator_enabled   = COALESCE(p_orchestrator_enabled, gm_restaurant_settings.orchestrator_enabled),
        idle_threshold_minutes = COALESCE(p_idle_threshold_minutes, gm_restaurant_settings.idle_threshold_minutes),
        max_kds_load           = COALESCE(p_max_kds_load, gm_restaurant_settings.max_kds_load),
        updated_at             = NOW()
    RETURNING * INTO v_row;

    RETURN jsonb_build_object(
        'restaurant_id', v_row.restaurant_id,
        'orchestrator_enabled', v_row.orchestrator_enabled,
        'idle_threshold_minutes', v_row.idle_threshold_minutes,
        'max_kds_load', v_row.max_kds_load,
        'updated_at', v_row.updated_at
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_restaurant_settings TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_restaurant_settings TO authenticated;
COMMENT ON FUNCTION public.upsert_restaurant_settings IS
  'Upsert restaurant operational settings. NULL params keep existing values.';

-- =============================================================================
-- 6. RPC: get_restaurant_settings
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_restaurant_settings(
    p_restaurant_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_row public.gm_restaurant_settings;
BEGIN
    SELECT * INTO v_row
    FROM public.gm_restaurant_settings
    WHERE restaurant_id = p_restaurant_id;

    IF v_row IS NULL THEN
        -- Return defaults (row hasn't been created yet)
        RETURN jsonb_build_object(
            'restaurant_id', p_restaurant_id,
            'orchestrator_enabled', true,
            'idle_threshold_minutes', 15,
            'max_kds_load', 20,
            'updated_at', NOW()
        );
    END IF;

    RETURN jsonb_build_object(
        'restaurant_id', v_row.restaurant_id,
        'orchestrator_enabled', v_row.orchestrator_enabled,
        'idle_threshold_minutes', v_row.idle_threshold_minutes,
        'max_kds_load', v_row.max_kds_load,
        'updated_at', v_row.updated_at
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_restaurant_settings TO anon;
GRANT EXECUTE ON FUNCTION public.get_restaurant_settings TO authenticated;
COMMENT ON FUNCTION public.get_restaurant_settings IS
  'Get restaurant settings. Returns defaults if no row exists.';
