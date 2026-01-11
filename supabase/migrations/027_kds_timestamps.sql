-- 027_kds_timestamps.sql
-- Adds timestamp columns for granular KDS tracking and SLA analysis.
ALTER TABLE public.gm_orders
ADD COLUMN IF NOT EXISTS in_prep_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS served_at TIMESTAMPTZ;
-- Comment on columns for clarity
COMMENT ON COLUMN public.gm_orders.in_prep_at IS 'When the kitchen started working on the order';
COMMENT ON COLUMN public.gm_orders.ready_at IS 'When the order was marked ready at the pass';
COMMENT ON COLUMN public.gm_orders.served_at IS 'When the order was delivered to the customer';
-- Trigger to auto-set these timestamps based on status change? 
-- Let's keep it explicit in the application layer for now to avoid "magic" triggers unless necessary.
-- The OrderEngine or TPV/KDS frontend will update these fields along with status.