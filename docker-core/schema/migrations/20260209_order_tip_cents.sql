-- Migration: Add tip_cents column to gm_orders
-- Purpose: Track gratuity/tip amount on each order
-- Gap #3: Tip/gorjeta support

ALTER TABLE public.gm_orders
    ADD COLUMN IF NOT EXISTS tip_cents INTEGER DEFAULT 0;

COMMENT ON COLUMN public.gm_orders.tip_cents IS 'Tip/gratuity amount in cents. Set during payment flow.';
