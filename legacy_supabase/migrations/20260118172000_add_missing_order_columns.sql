-- Migration: add_missing_columns_to_gm_orders
-- Description: Adds customer_name, table_number, notes to gm_orders to match application logic.

ALTER TABLE gm_orders 
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS table_number integer,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS origin text;

-- Also unblock RLS for these columns if needed? RLS is row-based.
-- The policy "kds_anon_select_orders" I created covers the whole table.
