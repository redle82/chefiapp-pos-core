-- =============================================================================
-- ADD stripe_price_id TO billing_plans
-- =============================================================================
-- Date: 2026-02-21
-- Purpose: Store Stripe Price IDs alongside plan slugs. Required for Stripe
--          Checkout to work — Stripe expects price_xxx IDs, not plan slugs.
-- =============================================================================

ALTER TABLE public.billing_plans
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

COMMENT ON COLUMN public.billing_plans.stripe_price_id
  IS 'Stripe Price ID (price_xxx). Required for Stripe Checkout. Set via Stripe Dashboard.';

-- Grant PostgREST read access (already via RLS or public schema)
-- No seed data — Stripe price IDs must be obtained from the Stripe dashboard.
-- Example: UPDATE billing_plans SET stripe_price_id = 'price_1Abc...' WHERE id = 'starter';
