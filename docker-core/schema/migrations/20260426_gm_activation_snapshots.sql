-- =============================================================================
-- Migration: gm_activation_snapshots — Activation Intelligence v3
-- Date: 2026-04-26
-- Purpose:
--   Persist activation metrics for time series, cohorts, MoM, early warning.
--   Idempotent by (restaurant_id, period_date). Batch job upserts 1x/day.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gm_activation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  score_raw INTEGER NOT NULL CHECK (score_raw >= 0 AND score_raw <= 15),
  score_normalized NUMERIC(4,2) NOT NULL CHECK (score_normalized >= 0 AND score_normalized <= 5),
  activation_velocity INTEGER NOT NULL DEFAULT 0 CHECK (activation_velocity >= 0 AND activation_velocity <= 100),
  dropoff_step TEXT,
  org_classification TEXT CHECK (org_classification IN ('fast', 'slow', 'stalled')),
  trial_starts INTEGER NOT NULL DEFAULT 0,
  first_orders INTEGER NOT NULL DEFAULT 0,
  first_payments INTEGER NOT NULL DEFAULT 0,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_date DATE NOT NULL,
  UNIQUE(restaurant_id, period_date)
);

COMMENT ON TABLE public.gm_activation_snapshots IS
'Activation Intelligence v3: daily snapshots per restaurant. Source for MoM, cohorts, early warning. Batch job upserts by (restaurant_id, period_date).';

COMMENT ON COLUMN public.gm_activation_snapshots.score_raw IS 'Activation score 0–15 (first_login=1, first_menu=2, first_shift=3, first_payment=4, first_order=5)';
COMMENT ON COLUMN public.gm_activation_snapshots.score_normalized IS 'Score 0–5 for display';
COMMENT ON COLUMN public.gm_activation_snapshots.activation_velocity IS '0–100: inverse of time-to-first-order (faster = higher)';
COMMENT ON COLUMN public.gm_activation_snapshots.dropoff_step IS 'Last milestone before dropoff: no_menu, no_shift, no_order, no_payment';
COMMENT ON COLUMN public.gm_activation_snapshots.org_classification IS 'fast: <24h to first order; slow: 24–72h; stalled: >72h or dropoff';
COMMENT ON COLUMN public.gm_activation_snapshots.period_date IS 'Reference date for the snapshot (batch may run late)';

CREATE INDEX IF NOT EXISTS idx_activation_snapshots_restaurant_period
  ON public.gm_activation_snapshots(restaurant_id, period_date);

CREATE INDEX IF NOT EXISTS idx_activation_snapshots_period_date
  ON public.gm_activation_snapshots(period_date);

CREATE INDEX IF NOT EXISTS idx_activation_snapshots_score_normalized
  ON public.gm_activation_snapshots(score_normalized);

CREATE INDEX IF NOT EXISTS idx_activation_snapshots_captured_at
  ON public.gm_activation_snapshots(captured_at);

-- RPC: Upsert snapshot (batch job calls per restaurant)
CREATE OR REPLACE FUNCTION public.activation_upsert_snapshot(
  p_restaurant_id UUID,
  p_period_date DATE,
  p_score_raw INTEGER,
  p_score_normalized NUMERIC,
  p_activation_velocity INTEGER DEFAULT 0,
  p_dropoff_step TEXT DEFAULT NULL,
  p_org_classification TEXT DEFAULT NULL,
  p_trial_starts INTEGER DEFAULT 0,
  p_first_orders INTEGER DEFAULT 0,
  p_first_payments INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.gm_activation_snapshots (
    restaurant_id,
    period_date,
    score_raw,
    score_normalized,
    activation_velocity,
    dropoff_step,
    org_classification,
    trial_starts,
    first_orders,
    first_payments,
    captured_at
  )
  VALUES (
    p_restaurant_id,
    p_period_date,
    GREATEST(0, LEAST(15, p_score_raw)),
    GREATEST(0, LEAST(5, p_score_normalized)),
    GREATEST(0, LEAST(100, p_activation_velocity)),
    p_dropoff_step,
    p_org_classification,
    GREATEST(0, p_trial_starts),
    GREATEST(0, p_first_orders),
    GREATEST(0, p_first_payments),
    NOW()
  )
  ON CONFLICT (restaurant_id, period_date) DO UPDATE SET
    score_raw = EXCLUDED.score_raw,
    score_normalized = EXCLUDED.score_normalized,
    activation_velocity = EXCLUDED.activation_velocity,
    dropoff_step = EXCLUDED.dropoff_step,
    org_classification = EXCLUDED.org_classification,
    trial_starts = EXCLUDED.trial_starts,
    first_orders = EXCLUDED.first_orders,
    first_payments = EXCLUDED.first_payments,
    captured_at = NOW()
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.activation_upsert_snapshot(UUID, DATE, INTEGER, NUMERIC, INTEGER, TEXT, TEXT, INTEGER, INTEGER, INTEGER) IS
'Idempotent upsert of activation snapshot. Batch job calls once per restaurant per period_date.';

GRANT EXECUTE ON FUNCTION public.activation_upsert_snapshot(UUID, DATE, INTEGER, NUMERIC, INTEGER, TEXT, TEXT, INTEGER, INTEGER, INTEGER) TO service_role;
