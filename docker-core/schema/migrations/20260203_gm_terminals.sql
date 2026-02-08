-- =============================================================================
-- gm_terminals — Registro de terminais instalados/online
-- =============================================================================
-- Data: 2026-02-03
-- Objetivo: Tabela usada pelo merchant-portal (TerminalEngine, SystemTreeContext)
--           para registrar e listar terminais (TPV, KDS, AppStaff). Fluxo:
--           terminal abre → regista/atualiza heartbeat → owner vê na árvore.
-- Contrato: CORE_INSTALLATION_AND_PROVISIONING_CONTRACT, CORE_SYSTEM_TREE_CONTRACT.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gm_terminals (
    id UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('TPV', 'KDS', 'APPSTAFF', 'WEB', 'WAITER', 'BACKOFFICE', 'ADMIN')),
    name TEXT NOT NULL,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    last_heartbeat_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_gm_terminals_restaurant ON public.gm_terminals(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_gm_terminals_restaurant_type ON public.gm_terminals(restaurant_id, type);

COMMENT ON TABLE public.gm_terminals IS 'Terminais instalados/online por restaurante. Fluxo: terminal abre → regista/atualiza → owner vê na árvore. CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.';
