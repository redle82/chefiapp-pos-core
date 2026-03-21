-- =============================================================================
-- Migration: Enterprise Payment Enforcement
-- Date: 2026-04-17
-- Purpose:
--   1) Add organization-level enterprise enforcement status
--   2) Track suspension/grace windows for unpaid invoices
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'gm_organizations'
      AND column_name = 'enterprise_status'
  ) THEN
    ALTER TABLE public.gm_organizations
      ADD COLUMN enterprise_status TEXT NOT NULL DEFAULT 'active'
      CHECK (enterprise_status IN ('active', 'suspended', 'grace'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'gm_organizations'
      AND column_name = 'suspended_at'
  ) THEN
    ALTER TABLE public.gm_organizations
      ADD COLUMN suspended_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'gm_organizations'
      AND column_name = 'grace_until'
  ) THEN
    ALTER TABLE public.gm_organizations
      ADD COLUMN grace_until TIMESTAMPTZ;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_gm_organizations_enterprise_status
  ON public.gm_organizations(enterprise_status);
