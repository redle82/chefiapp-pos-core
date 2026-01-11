-- Migration: 20260105_advanced_onboarding.sql
-- Purpose: Introduce advanced onboarding pipeline, richer provisioning fields and new setup_status states.
-- Date: 2026-01-05
-- Notes:
--   - Replaces legacy setup_status enum with v2: not_started | quick_done | advanced_in_progress | advanced_done
--   - Adds advanced/provisioning columns to gm_restaurants
--   - Refreshes helper RPCs to respect new states

-- ============================================================
-- 0) SAFETY: Drop helper RPCs to avoid type conflicts
-- ============================================================
DROP FUNCTION IF EXISTS public.update_wizard_progress(UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.mark_wizard_complete(UUID);

-- ============================================================
-- 1) ENUMS
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'site_status') THEN
    CREATE TYPE site_status AS ENUM ('off', 'queued', 'provisioning', 'live', 'error');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pos_mode') THEN
    CREATE TYPE pos_mode AS ENUM ('counter', 'tables', 'hybrid');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'setup_status_v2') THEN
    CREATE TYPE setup_status_v2 AS ENUM ('not_started', 'quick_done', 'advanced_in_progress', 'advanced_done');
  END IF;
END $$;

-- ============================================================
-- 2) NEW COLUMNS (Advanced & Provisioning)
-- ============================================================
ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS advanced_progress JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS brand_theme JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS site_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS site_template TEXT,
  ADD COLUMN IF NOT EXISTS site_domain TEXT,
  ADD COLUMN IF NOT EXISTS site_status site_status DEFAULT 'off',
  ADD COLUMN IF NOT EXISTS site_last_error TEXT,
  ADD COLUMN IF NOT EXISTS pos_mode pos_mode DEFAULT 'counter',
  ADD COLUMN IF NOT EXISTS tables_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tables_count INTEGER,
  ADD COLUMN IF NOT EXISTS qr_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS qr_style TEXT,
  ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS delivery_channels JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS hardware_profile JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS provisioning_flags JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS provisioning_updated_at TIMESTAMPTZ;

-- ============================================================
-- 3) MIGRATE setup_status → v2 ENUM
-- ============================================================
-- Preserve previous data using wizard_completed_at as source of truth.

-- Add temporary column with new enum
ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS setup_status_v2 setup_status_v2 DEFAULT 'not_started';

-- Map legacy statuses to the new lifecycle
UPDATE public.gm_restaurants
SET setup_status_v2 = CASE
  WHEN wizard_completed_at IS NOT NULL THEN 'advanced_done'
  WHEN setup_status::TEXT = 'completed' THEN 'quick_done'
  WHEN setup_status::TEXT = 'in_progress' THEN 'advanced_in_progress'
  ELSE 'not_started'
END;

-- Keep a snapshot of the legacy column (optional for forensics)
ALTER TABLE public.gm_restaurants RENAME COLUMN setup_status TO setup_status_legacy;

-- Promote the new column
ALTER TABLE public.gm_restaurants RENAME COLUMN setup_status_v2 TO setup_status;
ALTER TABLE public.gm_restaurants ALTER COLUMN setup_status SET DEFAULT 'not_started';

-- Drop old index if it exists (will be recreated below)
DROP INDEX IF EXISTS idx_gm_restaurants_setup_status;

-- Old enum cleanup
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'setup_status') THEN
    ALTER TYPE setup_status RENAME TO setup_status_old;
  END IF;
END $$;

-- Rename new enum to canonical name
ALTER TYPE setup_status_v2 RENAME TO setup_status;

-- Remove legacy type if no longer used
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'setup_status_old'
             AND NOT EXISTS (
               SELECT 1 FROM pg_attribute a
               JOIN pg_class c ON a.attrelid = c.oid
               JOIN pg_type t ON a.atttypid = t.oid
               WHERE t.typname = 'setup_status_old'
             )) THEN
    DROP TYPE setup_status_old;
  END IF;
END $$;

-- Drop legacy column after migration
ALTER TABLE public.gm_restaurants DROP COLUMN IF EXISTS setup_status_legacy;

-- ============================================================
-- 4) RECREATE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_gm_restaurants_setup_status ON public.gm_restaurants(setup_status);
CREATE INDEX IF NOT EXISTS idx_gm_restaurants_site_status ON public.gm_restaurants(site_status);

-- ============================================================
-- 5) UPDATED RPCs FOR WIZARD/ADVANCED PROGRESS
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_wizard_complete(p_restaurant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.gm_restaurants
  SET 
    wizard_completed_at = NOW(),
    setup_status = 'advanced_done',
    updated_at = NOW()
  WHERE id = p_restaurant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_wizard_progress(
  p_restaurant_id UUID,
  p_step TEXT,
  p_data JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.gm_restaurants
  SET 
    wizard_progress = COALESCE(wizard_progress, '{}'::jsonb) || jsonb_build_object(
      p_step, jsonb_build_object(
        'completed', true,
        'completed_at', NOW(),
        'data', COALESCE(p_data, '{}'::jsonb)
      )
    ),
    setup_status = CASE 
      WHEN p_step = 'publish' THEN 'advanced_done'::setup_status
      ELSE 'advanced_in_progress'::setup_status
    END,
    updated_at = NOW()
  WHERE id = p_restaurant_id;
END;
$$;

-- Advanced setup patcher: merges JSON payload and tracks progress + provisioning timestamp
CREATE OR REPLACE FUNCTION public.update_advanced_setup(
  p_restaurant_id UUID,
  p_payload JSONB,
  p_step TEXT DEFAULT NULL,
  p_mark_done BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_status setup_status := CASE WHEN p_mark_done THEN 'advanced_done' ELSE 'advanced_in_progress' END;
  provisioning_touch BOOLEAN := FALSE;
  merged_progress JSONB;
BEGIN
  -- Merge progress (preserve arrays if provided)
  merged_progress := COALESCE(p_payload->'advanced_progress', '{}'::jsonb);
  IF p_step IS NOT NULL THEN
    merged_progress := jsonb_set(merged_progress, '{current_step}', to_jsonb(p_step::text), TRUE);
    merged_progress := jsonb_set(
      merged_progress,
      '{completed}',
      to_jsonb(
        ARRAY(
          SELECT DISTINCT unnest(
            COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(merged_progress->'completed', '[]'::jsonb))), ARRAY[]::text[]) 
            || ARRAY[p_step]
          )
        )
      ),
      TRUE
    );
  END IF;

  -- Detect provisioning-affecting changes
  provisioning_touch :=
    p_payload ? 'site_enabled' OR p_payload ? 'site_template' OR p_payload ? 'site_domain' OR p_payload ? 'site_status' OR
    p_payload ? 'tables_enabled' OR p_payload ? 'tables_count' OR p_payload ? 'qr_enabled' OR p_payload ? 'qr_style' OR
    p_payload ? 'delivery_enabled' OR p_payload ? 'delivery_channels' OR p_payload ? 'hardware_profile' OR p_payload ? 'provisioning_flags';

  UPDATE public.gm_restaurants
  SET
    brand_theme = COALESCE(p_payload->'brand_theme', brand_theme),
    site_enabled = COALESCE((p_payload->>'site_enabled')::BOOLEAN, site_enabled),
    site_template = COALESCE(p_payload->>'site_template', site_template),
    site_domain = COALESCE(p_payload->>'site_domain', site_domain),
    site_status = COALESCE((p_payload->>'site_status')::site_status, site_status),
    site_last_error = COALESCE(p_payload->>'site_last_error', site_last_error),
    pos_mode = COALESCE((p_payload->>'pos_mode')::pos_mode, pos_mode),
    tables_enabled = COALESCE((p_payload->>'tables_enabled')::BOOLEAN, tables_enabled),
    tables_count = COALESCE(NULLIF(p_payload->>'tables_count', '')::INT, tables_count),
    qr_enabled = COALESCE((p_payload->>'qr_enabled')::BOOLEAN, qr_enabled),
    qr_style = COALESCE(p_payload->>'qr_style', qr_style),
    delivery_enabled = COALESCE((p_payload->>'delivery_enabled')::BOOLEAN, delivery_enabled),
    delivery_channels = COALESCE(p_payload->'delivery_channels', delivery_channels),
    hardware_profile = COALESCE(p_payload->'hardware_profile', hardware_profile),
    provisioning_flags = COALESCE(p_payload->'provisioning_flags', provisioning_flags),
    provisioning_updated_at = CASE WHEN provisioning_touch THEN NOW() ELSE provisioning_updated_at END,
    advanced_progress = CASE 
      WHEN jsonb_typeof(merged_progress) = 'object' THEN COALESCE(advanced_progress, '{}'::jsonb) || merged_progress
      ELSE advanced_progress
    END,
    setup_status = CASE 
      WHEN p_mark_done THEN 'advanced_done'::setup_status
      ELSE new_status
    END,
    updated_at = NOW()
  WHERE id = p_restaurant_id
  RETURNING advanced_progress;

  RETURN merged_progress;
END;
$$;

-- ============================================================
-- 6) HOUSEKEEPING
-- ============================================================
COMMENT ON COLUMN public.gm_restaurants.advanced_progress IS 'JSON progress tracker for advanced onboarding (current_step, completed[])';
COMMENT ON COLUMN public.gm_restaurants.brand_theme IS 'Theme configuration (colors, typography, assets)';
COMMENT ON COLUMN public.gm_restaurants.site_enabled IS 'If true, provision restaurant site';
COMMENT ON COLUMN public.gm_restaurants.site_status IS 'Site provisioning lifecycle';
COMMENT ON COLUMN public.gm_restaurants.pos_mode IS 'POS operating mode';
COMMENT ON COLUMN public.gm_restaurants.tables_enabled IS 'Enable tables management';
COMMENT ON COLUMN public.gm_restaurants.qr_enabled IS 'Enable QR codes for menus/tables';
COMMENT ON COLUMN public.gm_restaurants.delivery_enabled IS 'Enable delivery channels (aggregators/first-party)';
COMMENT ON COLUMN public.gm_restaurants.provisioning_flags IS 'Idempotency flags for provisioning side-effects';
COMMENT ON COLUMN public.gm_restaurants.provisioning_updated_at IS 'Last time provisioning-related fields changed';

-- Default provisioning_flags seed for new rows (non-destructive for existing rows)
UPDATE public.gm_restaurants
SET provisioning_flags = COALESCE(provisioning_flags, '{}'::jsonb) || jsonb_build_object(
  'site_provisioned', FALSE,
  'tables_seeded', FALSE,
  'qr_generated', FALSE,
  'delivery_configured', FALSE,
  'hardware_registered', FALSE
);
