-- KDS Refinement Schema Update
-- 1. Add item-level status tracking to gm_order_items
-- Check if column exists first to avoid errors on re-run, or just use ALTER TABLE IF EXISTS
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'gm_order_items'
        AND column_name = 'status'
) THEN
ALTER TABLE gm_order_items
ADD COLUMN status text DEFAULT 'pending';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'gm_order_items'
        AND column_name = 'started_at'
) THEN
ALTER TABLE gm_order_items
ADD COLUMN started_at timestamptz;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'gm_order_items'
        AND column_name = 'completed_at'
) THEN
ALTER TABLE gm_order_items
ADD COLUMN completed_at timestamptz;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'gm_order_items'
        AND column_name = 'station_id'
) THEN
ALTER TABLE gm_order_items
ADD COLUMN station_id uuid;
END IF;
END $$;
-- 2. Add station routing to gm_menu_categories
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'gm_menu_categories'
        AND column_name = 'station_id'
) THEN
ALTER TABLE gm_menu_categories
ADD COLUMN station_id uuid;
END IF;
END $$;