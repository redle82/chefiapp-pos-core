-- Migration: Add Cost Price to Products and Items
-- Date: 2026-02-05

-- 1. Add Cost Price to Products (The Source)
ALTER TABLE public.gm_products
ADD COLUMN IF NOT EXISTS cost_price_cents INTEGER DEFAULT 0;

-- 2. Add Cost Snapshot to Order Items (The History)
ALTER TABLE public.gm_order_items
ADD COLUMN IF NOT EXISTS cost_snapshot_cents INTEGER DEFAULT 0;

-- 3. Index for performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.gm_order_items(order_id);
