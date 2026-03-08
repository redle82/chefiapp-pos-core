CREATE TABLE IF NOT EXISTS public.billing_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NULL,
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  expected_currency TEXT NULL,
  event_currency TEXT NULL,
  expected_price_id TEXT NULL,
  event_price_id TEXT NULL,
  payload JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS billing_incidents_restaurant_created_idx
  ON public.billing_incidents (restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS billing_incidents_event_id_idx
  ON public.billing_incidents (event_id);

