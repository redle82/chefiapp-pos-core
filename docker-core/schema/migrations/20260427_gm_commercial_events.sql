-- =============================================================================
-- Migration: gm_commercial_events — Growth Data Layer
-- Date: 2026-04-27
-- Purpose:
--   Persist growth-critical events for activation batch, cohorts, MoM.
--   Only activation/onboarding/billing events — NOT page_view, scroll, etc.
--   Frontend POSTs via /internal/commercial/event (best-effort, non-blocking).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gm_commercial_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  country TEXT,
  segment TEXT,
  device TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  payload_json JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_date DATE GENERATED ALWAYS AS (date_trunc('day', occurred_at)::DATE) STORED
);

COMMENT ON TABLE public.gm_commercial_events IS
'Growth Data Layer: activation/onboarding/billing events only. Source for gm_activation_snapshots batch, cohorts, MoM. Do NOT store page_view, scroll, pricing_hover.';

COMMENT ON COLUMN public.gm_commercial_events.event_type IS
'Enum: trial_start, trial_started, first_login, first_menu_created, first_shift_opened, first_order_created, first_payment_received, onboarding_completed, billing_started, billing_converted';

COMMENT ON COLUMN public.gm_commercial_events.payload_json IS
'Optional event-specific payload (order_id, amount_cents, etc.). Max ~10kb.';

CREATE INDEX IF NOT EXISTS idx_gm_commercial_events_restaurant
  ON public.gm_commercial_events(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_gm_commercial_events_event_type
  ON public.gm_commercial_events(event_type);

CREATE INDEX IF NOT EXISTS idx_gm_commercial_events_period
  ON public.gm_commercial_events(period_date);

CREATE INDEX IF NOT EXISTS idx_gm_commercial_events_restaurant_period
  ON public.gm_commercial_events(restaurant_id, period_date);
