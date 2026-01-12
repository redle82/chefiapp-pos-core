-- Migration: Add RPC function to check open orders with FOR UPDATE lock
-- Purpose: Prevent cash register closure during payment processing
-- Date: 2026-01-18

-- Function to check open orders with row-level lock
CREATE OR REPLACE FUNCTION public.check_open_orders_with_lock(
    p_restaurant_id UUID
) RETURNS TABLE (
    id UUID,
    table_number INTEGER
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
    -- Lock rows to prevent concurrent modifications
    RETURN QUERY
    SELECT o.id, o.table_number
    FROM gm_orders o
    WHERE o.restaurant_id = p_restaurant_id
        AND o.status IN ('pending', 'preparing', 'ready')
        AND o.payment_status != 'PAID'
    FOR UPDATE OF o;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.check_open_orders_with_lock IS 'Checks for open orders with row-level lock to prevent race conditions during cash register closure';
