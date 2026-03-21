-- =============================================================================
-- Migration: Multi-Location Financial Consolidation Engine
-- Date: 2026-04-13
-- Purpose:
--   1. Ensure organization data model required by consolidation
--   2. Link organizations to restaurants
--   3. Persist org-level daily consolidated reconciliation
-- =============================================================================

-- 1) Organizations (already exists in most environments; keep idempotent)
CREATE TABLE IF NOT EXISTS public.gm_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Organization ↔ Restaurant map
CREATE TABLE IF NOT EXISTS public.gm_organization_restaurants (
    organization_id UUID NOT NULL REFERENCES public.gm_organizations(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_gm_org_restaurants_restaurant
  ON public.gm_organization_restaurants(restaurant_id);

COMMENT ON TABLE public.gm_organization_restaurants IS
'Explicit organization-to-restaurant mapping used by enterprise consolidation.';

-- 3) Organization daily consolidation snapshot
CREATE TABLE IF NOT EXISTS public.gm_org_daily_consolidation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.gm_organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_orders BIGINT NOT NULL DEFAULT 0,
    total_receipts BIGINT NOT NULL DEFAULT 0,
    total_revenue_cents BIGINT NOT NULL DEFAULT 0,
    total_discrepancy_cents BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('green', 'yellow', 'red')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_gm_org_daily_consolidation_org_date UNIQUE (organization_id, date)
);

CREATE INDEX IF NOT EXISTS idx_gm_org_daily_consolidation_org_date
  ON public.gm_org_daily_consolidation(organization_id, date DESC);

COMMENT ON TABLE public.gm_org_daily_consolidation IS
'Daily consolidated financial reconciliation snapshot at organization level.';
