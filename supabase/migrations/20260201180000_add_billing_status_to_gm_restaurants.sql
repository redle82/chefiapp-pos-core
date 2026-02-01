-- Migration: Add billing_status to gm_restaurants (Onda 4.5)
-- Purpose: Portal and Core use gm_restaurants.billing_status for trial | active | past_due | canceled.
-- Refs: merchant-portal GlobalUIStateContext, RuntimeReader, coreBillingApi.

ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS billing_status text DEFAULT 'trial';

COMMENT ON COLUMN public.gm_restaurants.billing_status IS 'SaaS billing state: trial | active | past_due | canceled';

-- Optional: constraint for valid values (uncomment if desired)
-- ALTER TABLE public.gm_restaurants
-- ADD CONSTRAINT gm_restaurants_billing_status_check
-- CHECK (billing_status IS NULL OR billing_status IN ('trial', 'active', 'past_due', 'canceled'));
