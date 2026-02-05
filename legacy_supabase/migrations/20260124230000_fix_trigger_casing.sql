-- FIX P0 TRIGGER CASING
-- Author: Antigravity
-- Date: 2026-01-14

-- 1. Fix `prevent_terminal_order_mutation_trigger` on `gm_orders`
-- It was checking for 'delivered'/'canceled' (lower), allowing mutations on 'DELIVERED'.

DROP TRIGGER IF EXISTS prevent_terminal_order_mutation_trigger ON public.gm_orders;

CREATE TRIGGER prevent_terminal_order_mutation_trigger
    BEFORE UPDATE ON public.gm_orders
    FOR EACH ROW
    WHEN (OLD.status = ANY (ARRAY['DELIVERED', 'CANCELED', 'CLOSED'])) -- Enforce UPPERCASE
    EXECUTE FUNCTION public.gm_block_terminal_order_mutation();


-- 2. Ensure `gm_block_terminal_order_mutation` function handles casing correctly (if it checks internally)
-- Usually it just raises exception, but let's be sure.

CREATE OR REPLACE FUNCTION public.gm_block_terminal_order_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Allow updates only if strictly necessary (e.g. metadata sync provided explicit override?)
    -- For now, strict block.
    RAISE EXCEPTION 'Order is in terminal state (%) and cannot be modified.', OLD.status;
END;
$$;


-- 3. Fix potential casing issues in `prevent_update_closed_orders_trigger` (Redundant but safe)
-- Previous verify showed it was UPPERCASE ('CLOSED', 'PAID', 'CANCELLED'), but let's standardize 'CANCELED' vs 'CANCELLED' (one L vs two Ls).
-- Standard en_US is 'Canceled' (one L), but let's check what the system uses.
-- `20260112000000_create_orders_schema.sql` uses order_status enum: 'canceled' (one L).
-- So we should stick to ONE L 'CANCELED'.
-- The previous trigger output showed 'CANCELLED' (two Ls) in one of them?
-- "WHEN (old.status = ANY (ARRAY['CLOSED'::text, 'PAID'::text, 'CANCELLED'::text]))" -> Two Ls.
-- If the system uses 'CANCELED' (one L), then 'CANCELLED' (two Ls) check is useless!

-- Let's check `create_orders_schema` again. It defines 'canceled' (one L).
-- So 'CANCELLED' (two Ls) is a BUG.

DROP TRIGGER IF EXISTS prevent_update_closed_orders_trigger ON public.gm_orders;

CREATE TRIGGER prevent_update_closed_orders_trigger
    BEFORE UPDATE ON public.gm_orders
    FOR EACH ROW
    WHEN (OLD.status = ANY (ARRAY['CLOSED', 'PAID', 'CANCELED'])) -- Corrected spelling to CANCELED (one L) and ensured UPPERCASE
    EXECUTE FUNCTION prevent_update_closed_orders();

DROP TRIGGER IF EXISTS prevent_delete_closed_orders_trigger ON public.gm_orders;

CREATE TRIGGER prevent_delete_closed_orders_trigger
    BEFORE DELETE ON public.gm_orders
    FOR EACH ROW
    WHEN (OLD.status = ANY (ARRAY['CLOSED', 'PAID', 'CANCELED'])) -- Corrected spelling to CANCELED (one L)
    EXECUTE FUNCTION prevent_delete_closed_orders();
