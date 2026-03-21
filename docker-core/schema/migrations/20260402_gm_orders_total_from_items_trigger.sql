-- =============================================================================
-- Migration: Trigger to recalculate gm_orders.total_cents from gm_order_items
-- Date: 2026-04-02
-- Purpose: Ensures total_cents and subtotal_cents always match SUM(subtotal_cents)
--   of order items. Fires on INSERT, UPDATE, DELETE of gm_order_items.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.recalc_order_total_from_items()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id UUID;
    v_total_cents INTEGER;
BEGIN
    v_order_id := COALESCE(NEW.order_id, OLD.order_id);
    IF v_order_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    SELECT COALESCE(SUM(subtotal_cents), 0)::INTEGER
    INTO v_total_cents
    FROM public.gm_order_items
    WHERE order_id = v_order_id;

    UPDATE public.gm_orders
    SET total_cents = v_total_cents,
        subtotal_cents = v_total_cents,
        updated_at = NOW()
    WHERE id = v_order_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_order_total_on_items ON public.gm_order_items;
CREATE TRIGGER trg_recalc_order_total_on_items
    AFTER INSERT OR UPDATE OF quantity, subtotal_cents OR DELETE
    ON public.gm_order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.recalc_order_total_from_items();

COMMENT ON FUNCTION public.recalc_order_total_from_items IS
    'Recalculates gm_orders.total_cents from SUM(gm_order_items.subtotal_cents). Ensures financial invariant.';
