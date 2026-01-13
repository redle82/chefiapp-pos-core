-- Migration: Add Stock Tracking Columns
-- Date: 2026-01-23

ALTER TABLE public.gm_products
ADD COLUMN IF NOT EXISTS track_stock BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC DEFAULT 0;

-- Optional: Add index if querying by stock becomes frequent (skipping for now)
