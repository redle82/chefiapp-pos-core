-- 20260218_fiscal_reconciliation.sql
-- Tabelas de reconciliação ChefIApp OS vs POS fiscal.
-- Ref: docs/architecture/FISCAL_RECONCILIATION_CONTRACT.md

-- =============================================================================
-- 1. gm_fiscal_snapshots — capturas de totais do POS fiscal
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gm_fiscal_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    shift_id UUID, -- opcional: quando o POS suporta id de turno

    pos_system TEXT NOT NULL,  -- identificador curto do POS fiscal
    source TEXT NOT NULL CHECK (source IN ('API','UPLOAD','MANUAL')),

    payload JSONB DEFAULT '{}'::jsonb,

    total_fiscal_cents BIGINT NOT NULL DEFAULT 0,
    total_orders_fiscal INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gm_fiscal_snapshots_restaurant_created_at
    ON public.gm_fiscal_snapshots (restaurant_id, created_at DESC);

COMMENT ON TABLE public.gm_fiscal_snapshots IS 'Snapshots de totais do POS fiscal por restaurante/turno/intervalo.';
COMMENT ON COLUMN public.gm_fiscal_snapshots.pos_system IS 'Identificador do POS fiscal (ex.: foo_pos, bar_pos).';
COMMENT ON COLUMN public.gm_fiscal_snapshots.source IS 'Origem dos dados: API, UPLOAD ou MANUAL.';

-- =============================================================================
-- 2. gm_reconciliations — resultado ChefIApp vs POS fiscal
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gm_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    shift_id UUID,

    fiscal_snapshot_id UUID REFERENCES public.gm_fiscal_snapshots(id) ON DELETE SET NULL,

    total_operational_cents BIGINT NOT NULL DEFAULT 0,
    total_fiscal_cents BIGINT NOT NULL DEFAULT 0,
    difference_cents BIGINT NOT NULL DEFAULT 0,

    status TEXT NOT NULL CHECK (status IN ('OK','DIVERGENT','PENDING_DATA')),
    reason_code TEXT,
    notes TEXT,

    reconciled_by UUID, -- user_id do responsável

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gm_reconciliations_restaurant_created_at
    ON public.gm_reconciliations (restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gm_reconciliations_shift
    ON public.gm_reconciliations (restaurant_id, shift_id)
    WHERE shift_id IS NOT NULL;

COMMENT ON TABLE public.gm_reconciliations IS 'Reconciliação de turno ChefIApp (operacional) vs POS fiscal.';
COMMENT ON COLUMN public.gm_reconciliations.status IS 'OK, DIVERGENT ou PENDING_DATA.';

