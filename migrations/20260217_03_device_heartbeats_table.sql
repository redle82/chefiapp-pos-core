-- =============================================================================
-- gm_device_heartbeats — Heartbeat log for terminal liveness tracking
-- =============================================================================
-- Data: 2026-02-17
-- Objetivo: Tabela de log para registar cada heartbeat recebido de um terminal.
--           Referenciada pelo RPC device_heartbeat() que faz INSERT após
--           atualizar last_heartbeat_at em gm_terminals.
-- Contrato: CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gm_device_heartbeats (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    terminal_id   UUID NOT NULL REFERENCES public.gm_terminals(id) ON DELETE CASCADE,
    heartbeat_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata      JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_gm_device_heartbeats_terminal
    ON public.gm_device_heartbeats(terminal_id, heartbeat_at DESC);

COMMENT ON TABLE public.gm_device_heartbeats IS
  'Log de heartbeats recebidos de terminais. Cada chamada a device_heartbeat() '
  'insere um registo aqui para historial de liveness. '
  'CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.';

-- Grants
GRANT SELECT, INSERT ON public.gm_device_heartbeats TO anon;

DO $$ BEGIN
    EXECUTE 'GRANT SELECT, INSERT ON public.gm_device_heartbeats TO authenticated';
EXCEPTION WHEN undefined_object THEN
    NULL;
END $$;
