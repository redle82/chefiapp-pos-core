-- Migration: Sprint 7 Inventory System
-- Date: 2026-02-02
-- Description: Creates dedicated tables for Ingredients, Recipes, and Stock Movements.

-- 1. Inventory Items (Ingredients/Raw Materials)
CREATE TABLE IF NOT EXISTS public.gm_inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'unit', -- kg, lt, unit, g, ml
    stock_quantity NUMERIC DEFAULT 0,
    cost_per_unit INTEGER DEFAULT 0, -- In Cents
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Recipes (Linking Menu Items to Ingredients)
CREATE TABLE IF NOT EXISTS public.gm_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID REFERENCES public.gm_menu_items(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES public.gm_inventory_items(id) ON DELETE CASCADE,
    quantity_required NUMERIC NOT NULL, -- How much of the inventory item is used
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Stock Movements (Audit Trail)
CREATE TABLE IF NOT EXISTS public.gm_stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID REFERENCES public.gm_inventory_items(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'IN', 'OUT', 'WASTE', 'SALE'
    quantity NUMERIC NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 4. Enable RLS
ALTER TABLE public.gm_inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_stock_movements ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Simple Restaurant Scope)
CREATE POLICY "Inventory access for restaurant members" ON public.gm_inventory_items
FOR ALL USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.gm_restaurant_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Recipes access for restaurant members" ON public.gm_recipes
FOR ALL USING (
    menu_item_id IN (
        SELECT id FROM public.gm_menu_items 
        WHERE restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_members 
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Movements access for restaurant members" ON public.gm_stock_movements
FOR ALL USING (
    inventory_item_id IN (
        SELECT id FROM public.gm_inventory_items 
        WHERE restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_members 
            WHERE user_id = auth.uid()
        )
    )
);

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_inventory_restaurant ON public.gm_inventory_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_recipes_menu_item ON public.gm_recipes(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_movements_item ON public.gm_stock_movements(inventory_item_id);
;
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
;
-- Migration: Sprint 8 Financial Intelligence
-- Date: 2026-02-05
-- Description: Adds cost tracking columns to orders for COGS analysis.

-- 1. Add Cost Columns to Orders
ALTER TABLE public.gm_orders 
ADD COLUMN IF NOT EXISTS total_cost_cents INTEGER DEFAULT 0;

ALTER TABLE public.gm_orders 
ADD COLUMN IF NOT EXISTS gross_margin_cents INTEGER DEFAULT 0;

-- 2. Index for Reporting
CREATE INDEX IF NOT EXISTS idx_orders_created_at_cost ON public.gm_orders(created_at, total_cost_cents);
;
