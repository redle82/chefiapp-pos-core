-- Migration: 069_wizard_completion_gate.sql
-- Purpose: Add wizard completion tracking and setup status to gm_restaurants
-- Date: 2025-01-27
-- Context: Enable "Wizard Completion Gate" to prevent re-entry after onboarding

-- ============================================
-- 1. ADD WIZARD COMPLETION FIELDS
-- ============================================

-- Add wizard_completed_at timestamp
ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS wizard_completed_at TIMESTAMPTZ;

-- Add setup_status enum type (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'setup_status') THEN
    CREATE TYPE setup_status AS ENUM ('not_started', 'in_progress', 'completed');
  END IF;
END $$;

-- Add setup_status column
ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS setup_status setup_status DEFAULT 'not_started';

-- Add wizard_progress JSONB to store step-by-step progress
ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS wizard_progress JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_gm_restaurants_wizard_completed 
ON public.gm_restaurants(wizard_completed_at) 
WHERE wizard_completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gm_restaurants_setup_status 
ON public.gm_restaurants(setup_status);

-- ============================================
-- 3. HELPER FUNCTION: Mark Wizard Complete
-- ============================================

CREATE OR REPLACE FUNCTION public.mark_wizard_complete(p_restaurant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- FONTE ÚNICA DE VERDADE: wizard_completed_at
  -- setup_status é DERIVADO (sempre = 'completed' quando wizard_completed_at != null)
  UPDATE public.gm_restaurants
  SET 
    wizard_completed_at = NOW(),
    setup_status = 'completed', -- Derivado de wizard_completed_at
    updated_at = NOW()
  WHERE id = p_restaurant_id;
END;
$$;

-- ============================================
-- 4. HELPER FUNCTION: Update Wizard Progress
-- ============================================

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
      WHEN p_step = 'publish' THEN 'completed'::setup_status
      ELSE 'in_progress'::setup_status
    END,
    updated_at = NOW()
  WHERE id = p_restaurant_id;
END;
$$;

-- ============================================
-- 5. RLS POLICIES (if needed)
-- ============================================
-- Note: RLS already handled by existing policies on gm_restaurants

-- ============================================
-- VERIFICATION
-- ============================================

-- Check columns exist
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'gm_restaurants'
  AND column_name IN ('wizard_completed_at', 'setup_status', 'wizard_progress')
ORDER BY column_name;

