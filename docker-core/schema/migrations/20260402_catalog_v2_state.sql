-- =============================================================================
-- Catalog V2 Persistent Operational State
-- =============================================================================
-- Purpose: Persist publication history, import jobs and override rules per restaurant
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.gm_catalog_v2_state (
  restaurant_id UUID PRIMARY KEY REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  publication_records JSONB NOT NULL DEFAULT '[]'::JSONB,
  import_jobs JSONB NOT NULL DEFAULT '[]'::JSONB,
  price_overrides JSONB NOT NULL DEFAULT '[]'::JSONB,
  availability_rules JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gm_catalog_v2_state_updated_at
  ON public.gm_catalog_v2_state (updated_at DESC);

COMMIT;
