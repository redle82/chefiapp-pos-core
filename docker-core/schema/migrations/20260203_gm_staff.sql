-- =============================================================================
-- gm_staff — Staff operacional (sala, cozinha, gerente)
-- =============================================================================
-- Data: 2026-02-03
-- Objetivo: Tabela mínima v0 para pessoas operacionais. Tarefas e KDS podem
--           referenciar staff. Não substitui gm_restaurant_members (auth/bootstrap).
-- Contrato: CORE_APPSTAFF_IDENTITY_CONTRACT, CORE_SYSTEM_TREE_CONTRACT.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gm_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('waiter', 'kitchen', 'manager')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gm_staff_restaurant ON public.gm_staff(restaurant_id);

COMMENT ON TABLE public.gm_staff IS 'Staff operacional (sala, cozinha, gerente). Tarefas e KDS podem referenciar. Identidade detalhada em CORE_APPSTAFF_IDENTITY_CONTRACT.';
