-- Migration 017: Airlock Fields for gm_orders
-- Purpose: Add customer_name and origin to gm_orders to support Web Orders
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'gm_orders'
        AND column_name = 'customer_name'
) THEN
ALTER TABLE public.gm_orders
ADD COLUMN customer_name text;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'gm_orders'
        AND column_name = 'origin'
) THEN
ALTER TABLE public.gm_orders
ADD COLUMN origin text DEFAULT 'POS';
END IF;
END $$;