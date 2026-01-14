-- Fix Status Casing Inconsistency
-- P1 Priority Patch

-- Normalizing to UPPERCASE as per Index definitions
UPDATE public.gm_orders SET status = UPPER(status) WHERE status != UPPER(status);
UPDATE public.gm_orders SET payment_status = UPPER(payment_status) WHERE payment_status != UPPER(payment_status);

UPDATE public.gm_cash_registers SET status = UPPER(status) WHERE status != UPPER(status);

-- Verify Indexes are active now
ANALYZE public.gm_orders;
ANALYZE public.gm_cash_registers;
