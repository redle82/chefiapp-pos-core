-- Migration: Criar tabelas do billing-core (FASE 1)
-- Data: 2026-01-30
-- Objetivo: Criar estrutura de dados do billing-core (subscriptions, billing_events, billing_payments)

-- ============================================================================
-- BILLING CORE SCHEMA
-- Separado do Core de pedidos/pagamentos
-- ============================================================================

-- Billing Events (Event-Sourced)
CREATE TABLE IF NOT EXISTS public.billing_events (
    event_id UUID PRIMARY KEY,
    type VARCHAR(64) NOT NULL,
    subscription_id UUID NOT NULL,
    restaurant_id UUID NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payload JSONB NOT NULL DEFAULT '{}',
    metadata JSONB,
    
    -- Indexes
    CONSTRAINT billing_events_type_check CHECK (type IN (
        'SUBSCRIPTION_CREATED',
        'SUBSCRIPTION_ACTIVATED',
        'SUBSCRIPTION_TRIAL_STARTED',
        'SUBSCRIPTION_TRIAL_ENDED',
        'SUBSCRIPTION_RENEWED',
        'SUBSCRIPTION_PAST_DUE',
        'SUBSCRIPTION_SUSPENDED',
        'SUBSCRIPTION_REACTIVATED',
        'SUBSCRIPTION_CANCELLED',
        'SUBSCRIPTION_EXPIRED',
        'PLAN_UPGRADED',
        'PLAN_DOWNGRADED',
        'ADDON_ACTIVATED',
        'ADDON_DEACTIVATED',
        'ADDON_RENEWED',
        'PAYMENT_ATTEMPTED',
        'PAYMENT_SUCCEEDED',
        'PAYMENT_FAILED',
        'PAYMENT_REFUNDED',
        'GATEWAY_CONFIGURED',
        'GATEWAY_VERIFIED',
        'GATEWAY_VERIFICATION_FAILED',
        'GATEWAY_REMOVED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_billing_events_subscription 
    ON public.billing_events(subscription_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_billing_events_restaurant 
    ON public.billing_events(restaurant_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_billing_events_type 
    ON public.billing_events(type, occurred_at);

-- Subscriptions (Current State)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    subscription_id UUID PRIMARY KEY,
    restaurant_id UUID UNIQUE NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    
    -- Plan
    plan_id VARCHAR(64) NOT NULL,
    plan_tier VARCHAR(32) NOT NULL,
    
    -- Status
    status VARCHAR(32) NOT NULL DEFAULT 'TRIAL',
    status_reason TEXT,
    
    -- Dates
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    trial_ends_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancelled_at TIMESTAMPTZ,
    
    -- Payment
    payment_method_id VARCHAR(255),
    last_payment_at TIMESTAMPTZ,
    next_payment_at TIMESTAMPTZ NOT NULL,
    
    -- Limits
    max_terminals INTEGER NOT NULL DEFAULT 1,
    max_tables INTEGER NOT NULL DEFAULT 20,
    
    -- JSON fields
    active_addons JSONB NOT NULL DEFAULT '[]',
    configured_gateways JSONB NOT NULL DEFAULT '[]',
    enabled_features JSONB NOT NULL DEFAULT '[]',
    
    -- Constraints
    CONSTRAINT subscriptions_status_check CHECK (status IN (
        'TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED'
    )),
    CONSTRAINT subscriptions_tier_check CHECK (plan_tier IN (
        'STARTER', 'PROFESSIONAL', 'ENTERPRISE'
    ))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
    ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_payment 
    ON public.subscriptions(next_payment_at) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_ends 
    ON public.subscriptions(trial_ends_at) WHERE status = 'TRIAL';
CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant 
    ON public.subscriptions(restaurant_id);

-- Billing Payments (SEU Stripe)
CREATE TABLE IF NOT EXISTS public.billing_payments (
    payment_id UUID PRIMARY KEY,
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(subscription_id) ON DELETE CASCADE,
    
    -- Amount
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    
    -- Status
    status VARCHAR(32) NOT NULL,
    failure_code VARCHAR(64),
    failure_message TEXT,
    
    -- Stripe
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    
    -- Dates
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    CONSTRAINT billing_payments_status_check CHECK (status IN (
        'PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_billing_payments_subscription 
    ON public.billing_payments(subscription_id, created_at);
CREATE INDEX IF NOT EXISTS idx_billing_payments_stripe 
    ON public.billing_payments(stripe_payment_intent_id);

-- ============================================================================
-- IMMUTABILITY TRIGGERS
-- ============================================================================

-- Billing events are immutable
CREATE OR REPLACE FUNCTION prevent_billing_event_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'billing_events table is immutable. UPDATE and DELETE are forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS billing_events_immutable ON public.billing_events;
CREATE TRIGGER billing_events_immutable
    BEFORE UPDATE OR DELETE ON public.billing_events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_billing_event_mutation();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_payments ENABLE ROW LEVEL SECURITY;

-- Policies para subscriptions
CREATE POLICY "Users can view their restaurant's subscriptions"
ON public.subscriptions
FOR SELECT
USING (
  restaurant_id IN (SELECT public.get_user_restaurants())
);

CREATE POLICY "Users can insert subscriptions for their restaurants"
ON public.subscriptions
FOR INSERT
WITH CHECK (
  restaurant_id IN (SELECT public.get_user_restaurants())
);

CREATE POLICY "Users can update subscriptions for their restaurants"
ON public.subscriptions
FOR UPDATE
USING (
  restaurant_id IN (SELECT public.get_user_restaurants())
)
WITH CHECK (
  restaurant_id IN (SELECT public.get_user_restaurants())
);

-- Policies para billing_events
CREATE POLICY "Users can view their restaurant's billing events"
ON public.billing_events
FOR SELECT
USING (
  restaurant_id IN (SELECT public.get_user_restaurants())
);

-- Policies para billing_payments
CREATE POLICY "Users can view their restaurant's billing payments"
ON public.billing_payments
FOR SELECT
USING (
  subscription_id IN (
    SELECT subscription_id FROM public.subscriptions 
    WHERE restaurant_id IN (SELECT public.get_user_restaurants())
  )
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.billing_events IS 'Event-sourced billing history - IMMUTABLE';
COMMENT ON TABLE public.subscriptions IS 'Current subscription state - derived from events';
COMMENT ON TABLE public.billing_payments IS 'Payment records for ChefI billing (not restaurant payments)';
