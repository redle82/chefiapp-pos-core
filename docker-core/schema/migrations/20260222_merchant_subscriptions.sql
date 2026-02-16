-- =============================================================================
-- MERCHANT SUBSCRIPTIONS + BILLING PLANS — SaaS subscription management
-- =============================================================================
-- Date: 2026-02-22
-- Purpose: Store merchant SaaS subscription data in Core DB (replaces mocks).
--          PostgREST exposes these tables via /rest/v1/ for the Billing Center UI.
-- =============================================================================

-- 1. Billing plans — the plan catalog (starter, pro, enterprise)
CREATE TABLE IF NOT EXISTS public.billing_plans (
    id           TEXT PRIMARY KEY,          -- e.g. 'starter', 'pro', 'enterprise'
    name         TEXT NOT NULL,              -- Display name: "Starter", "Pro", "Enterprise"
    tier         TEXT NOT NULL CHECK (tier IN ('free', 'trial', 'starter', 'pro', 'enterprise')),
    price_cents  INTEGER NOT NULL DEFAULT 0, -- Monthly price in cents (e.g. 4900 = €49.00)
    currency     TEXT NOT NULL DEFAULT 'EUR',
    interval     TEXT NOT NULL DEFAULT 'month' CHECK (interval IN ('month', 'year')),
    features     JSONB NOT NULL DEFAULT '[]', -- Array of feature description strings
    max_devices  INTEGER NOT NULL DEFAULT 1,
    max_integrations INTEGER NOT NULL DEFAULT 0,
    max_delivery_orders INTEGER NOT NULL DEFAULT 0,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    active       BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.billing_plans IS 'SaaS plan catalog. Fonte de verdade para planos disponíveis.';

-- 2. Merchant subscriptions — one per restaurant
CREATE TABLE IF NOT EXISTS public.merchant_subscriptions (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id         UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    plan_id               TEXT NOT NULL DEFAULT 'starter' REFERENCES public.billing_plans(id),
    status                TEXT NOT NULL DEFAULT 'trialing'
      CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'paused')),
    stripe_customer_id    TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    current_period_start  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    trial_end             TIMESTAMPTZ,
    cancel_at             TIMESTAMPTZ,
    canceled_at           TIMESTAMPTZ,
    addons                JSONB NOT NULL DEFAULT '[]',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id)  -- One subscription per restaurant
);

CREATE INDEX IF NOT EXISTS idx_merchant_subs_restaurant ON public.merchant_subscriptions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_subs_status ON public.merchant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_merchant_subs_stripe_cust ON public.merchant_subscriptions(stripe_customer_id);

COMMENT ON TABLE public.merchant_subscriptions IS 'SaaS subscription per restaurant. Syncs with Stripe via webhooks (future).';

-- 3. Billing invoices — invoice history
CREATE TABLE IF NOT EXISTS public.billing_invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.merchant_subscriptions(id) ON DELETE SET NULL,
    stripe_invoice_id TEXT UNIQUE,
    amount_cents    INTEGER NOT NULL DEFAULT 0,
    currency        TEXT NOT NULL DEFAULT 'EUR',
    status          TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('paid', 'pending', 'failed', 'void')),
    invoice_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    pdf_url         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_restaurant ON public.billing_invoices(restaurant_id);

COMMENT ON TABLE public.billing_invoices IS 'Invoice history for billing center UI. Syncs from Stripe (future).';

-- 4. Auto-update timestamps
CREATE OR REPLACE FUNCTION update_billing_plans_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_merchant_subscriptions_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS billing_plans_updated ON public.billing_plans;
CREATE TRIGGER billing_plans_updated
  BEFORE UPDATE ON public.billing_plans
  FOR EACH ROW EXECUTE FUNCTION update_billing_plans_timestamp();

DROP TRIGGER IF EXISTS merchant_subscriptions_updated ON public.merchant_subscriptions;
CREATE TRIGGER merchant_subscriptions_updated
  BEFORE UPDATE ON public.merchant_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_merchant_subscriptions_timestamp();

-- 5. Seed billing plans
INSERT INTO public.billing_plans (id, name, tier, price_cents, currency, interval, features, max_devices, max_integrations, max_delivery_orders, sort_order)
VALUES
  ('starter', 'Starter', 'starter', 4900, 'EUR', 'month',
   '["Software TPV (1 dispositivo)", "E-mail e SMS de confirmação", "Calendário de reservas no TPV", "Notificações de fecho", "Telemetria integrada"]'::jsonb,
   1, 0, 0, 1),
  ('pro', 'Pro', 'pro', 7900, 'EUR', 'month',
   '["Software TPV (2 dispositivos)", "Integrador de delivery (até 200 pedidos)", "Reservas e turnos avançados", "QR Ordering", "KDS (Kitchen Display)"]'::jsonb,
   2, 3, 200, 2),
  ('enterprise', 'Enterprise', 'enterprise', 14900, 'EUR', 'month',
   '["Software TPV (4+ dispositivos)", "Integrador de delivery (até 550 pedidos)", "Marcas Virtuais Ilimitadas", "Integrações ilimitadas", "Pedidos delivery extra (0,04 €/un)", "Suporte prioritário", "Multi-unidade"]'::jsonb,
   4, 6, 550, 3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tier = EXCLUDED.tier,
  price_cents = EXCLUDED.price_cents,
  features = EXCLUDED.features,
  max_devices = EXCLUDED.max_devices,
  max_integrations = EXCLUDED.max_integrations,
  max_delivery_orders = EXCLUDED.max_delivery_orders,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- 6. Seed dev subscription (trial for pilot restaurant)
-- Only inserts if the restaurant exists (from seeds_dev.sql / 02-*)
INSERT INTO public.merchant_subscriptions (
    id, restaurant_id, plan_id, status,
    current_period_start, current_period_end, trial_end
)
SELECT
    '00000000-0000-0000-0000-000000000200',
    '00000000-0000-0000-0000-000000000100',
    'starter',
    'trialing',
    NOW(),
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '14 days'
WHERE EXISTS (
    SELECT 1 FROM public.gm_restaurants WHERE id = '00000000-0000-0000-0000-000000000100'
)
ON CONFLICT (restaurant_id) DO NOTHING;

-- =============================================================================
-- 7. Placeholder Stripe RPCs (return helpful errors until sidecar is built)
-- =============================================================================
-- PostgREST can't call external APIs, so these RPCs return informative errors.
-- When the Stripe billing sidecar is deployed, these functions will be replaced
-- with real Stripe API calls (or proxied via the sidecar).

CREATE OR REPLACE FUNCTION public.create_checkout_session(
    price_id TEXT DEFAULT '',
    success_url TEXT DEFAULT '',
    cancel_url TEXT DEFAULT ''
)
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'url', '',
        'session_id', '',
        'error', 'Stripe checkout not yet configured. Deploy the billing sidecar service to enable subscription checkout. Contact support@chefiapp.com for assistance.'
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.create_checkout_session IS 'Placeholder: returns error until Stripe billing sidecar is deployed.';

CREATE OR REPLACE FUNCTION public.create_saas_portal_session(
    return_url TEXT DEFAULT ''
)
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'url', '',
        'error', 'Stripe Customer Portal not yet configured. Deploy the billing sidecar service to enable self-serve billing management. Contact support@chefiapp.com for assistance.'
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.create_saas_portal_session IS 'Placeholder: returns error until Stripe billing sidecar is deployed.';
