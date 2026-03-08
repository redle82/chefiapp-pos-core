-- =============================================================================
-- BILLING PLAN PRICES — Multi-currency Stripe price mapping
-- =============================================================================
-- Purpose: One row per (plan_id, currency). Enables checkout by tenant currency
--          without runtime conversion. Currency comes from restaurant.country
--          or tenant billing_country, never from locale.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.billing_plan_prices (
    plan_id         TEXT NOT NULL REFERENCES public.billing_plans(id) ON DELETE CASCADE,
    currency        TEXT NOT NULL CHECK (currency IN ('EUR', 'USD', 'GBP', 'BRL', 'MXN')),
    stripe_price_id TEXT NOT NULL,
    price_cents     INTEGER NOT NULL DEFAULT 0,
    interval        TEXT NOT NULL DEFAULT 'month' CHECK (interval IN ('month', 'year')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (plan_id, currency)
);

COMMENT ON TABLE public.billing_plan_prices IS 'Stripe Price ID per plan and currency. Used for multi-currency checkout; currency from tenant/restaurant, never from locale.';

CREATE INDEX IF NOT EXISTS idx_billing_plan_prices_plan_currency
  ON public.billing_plan_prices(plan_id, currency);

CREATE OR REPLACE FUNCTION update_billing_plan_prices_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS billing_plan_prices_updated ON public.billing_plan_prices;
CREATE TRIGGER billing_plan_prices_updated
  BEFORE UPDATE ON public.billing_plan_prices
  FOR EACH ROW EXECUTE FUNCTION update_billing_plan_prices_timestamp();

-- Migrate existing billing_plans: one row per plan with current currency and stripe_price_id.
-- Plans with null stripe_price_id are skipped; frontend falls back to billing_plans.stripe_price_id or plan slug.
INSERT INTO public.billing_plan_prices (plan_id, currency, stripe_price_id, price_cents, interval)
SELECT id, currency, stripe_price_id, price_cents, interval
  FROM public.billing_plans
  WHERE active = true AND stripe_price_id IS NOT NULL AND stripe_price_id <> ''
ON CONFLICT (plan_id, currency) DO UPDATE SET
  stripe_price_id = EXCLUDED.stripe_price_id,
  price_cents = EXCLUDED.price_cents,
  interval = EXCLUDED.interval,
  updated_at = NOW();
