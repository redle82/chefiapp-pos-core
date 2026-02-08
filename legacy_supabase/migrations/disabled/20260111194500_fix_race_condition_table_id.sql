-- Fix Race Condition: Add table_id to orders and Unique Index
-- Applied manually during Soft Launch Audit 6 validation
-- 1. Add table_id column (if not exists checks included for safety)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'gm_orders'
        AND column_name = 'table_id'
) THEN
ALTER TABLE gm_orders
ADD COLUMN table_id UUID REFERENCES gm_tables(id);
END IF;
END $$;
-- 2. Create Unique Index for Active Orders per Table
-- Prevents multiple open orders on the same table
CREATE UNIQUE INDEX IF NOT EXISTS idx_gm_orders_active_table ON gm_orders(table_id)
WHERE status NOT IN ('delivered', 'canceled')
    AND table_id IS NOT NULL;