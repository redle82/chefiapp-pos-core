-- Trigger to automatically deduct inventory when an order is paid
-- Depends on: process_inventory_deduction(order_id) RPC

-- 1. Create the Trigger Function
CREATE OR REPLACE FUNCTION trg_inventory_deduction()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when payment_status changes to 'paid' (LOWERCASE)
    -- AND the previous status was NOT 'paid' (to avoid double deduction)
    IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
        -- Call the inventory deduction logic
        PERFORM process_inventory_deduction(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the Trigger
-- Drop if exists to ensure idempotency
DROP TRIGGER IF EXISTS on_order_completion ON gm_orders;

CREATE TRIGGER on_order_completion
AFTER UPDATE ON gm_orders
FOR EACH ROW
EXECUTE FUNCTION trg_inventory_deduction();
