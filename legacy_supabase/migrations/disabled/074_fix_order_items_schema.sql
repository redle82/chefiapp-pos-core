-- Migration: 074_fix_order_items_schema.sql
-- Purpose: Fix schema mismatch (qty vs quantity)
-- Date: 2025-01-27
DO $$ BEGIN -- Rename qty to quantity if it exists and quantity does not
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'gm_order_items'
        AND column_name = 'qty'
)
AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'gm_order_items'
        AND column_name = 'quantity'
) THEN
ALTER TABLE public.gm_order_items
    RENAME COLUMN qty TO quantity;
END IF;
END $$;