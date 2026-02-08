-- 20260205000000_inventory_recipes.sql
-- 📦 INVENTORY: Recipe System
-- Adds tables for raw materials and product recipes.

-- 1. Inventory Items (Raw Materials)
CREATE TABLE IF NOT EXISTS public.gm_inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.gm_restaurants(id),
    name TEXT NOT NULL,
    stock_quantity NUMERIC DEFAULT 0,
    unit TEXT DEFAULT 'unit', -- 'kg', 'g', 'l', 'ml', 'unit'
    min_stock_alert NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Product Recipes (The Link)
CREATE TABLE IF NOT EXISTS public.gm_product_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.gm_products(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES public.gm_inventory_items(id) ON DELETE CASCADE,
    quantity_required NUMERIC NOT NULL, -- How much to deduct per 1 product unit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, inventory_item_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_restaurant ON public.gm_inventory_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_recipes_product ON public.gm_product_recipes(product_id);
