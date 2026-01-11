-- Migration: 040_menu_connectivity_layer.sql
-- Purpose: Establish the "Connectivity Layer" allowing Menu to consume resources and reach external networks.
-- Architecture: Menu (Core) <-> Recipe (Link) <-> Inventory (Resource)
--               Menu (Core) <-> ChannelMap (Link) <-> ExternalPlatform (Distribution)
-- 1. Inventory Items (The Core Resource)
-- Only physically tangible inputs. NOT products.
CREATE TABLE IF NOT EXISTS public.gm_inventory_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    -- e.g. "Burger Bun", "Ground Beef", "Heineken 33cl"
    unit TEXT NOT NULL DEFAULT 'un',
    -- un, kg, lt, gr
    -- Stock Management (Simple V1)
    is_active BOOLEAN DEFAULT true,
    current_stock NUMERIC(10, 3) DEFAULT 0.000,
    -- e.g. 10.500 kg
    min_stock NUMERIC(10, 3) DEFAULT 0.000,
    -- Trigger for low stock alert
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- 2. Menu Recipes (The Consumption Logic)
-- Defines "What does it cost to sell this?"
CREATE TABLE IF NOT EXISTS public.gm_menu_recipes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.gm_inventory_items(id) ON DELETE CASCADE,
    quantity NUMERIC(10, 3) NOT NULL,
    -- How much is consumed per sale?
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Constraint: A menu item can't consume the same inventory item twice in the same version
    CONSTRAINT uq_menu_recipe_item UNIQUE (menu_item_id, inventory_item_id)
);
-- 3. External Channel Maps (The Distribution Layer)
-- Defines "How does this look on Uber/Glovo?"
CREATE TABLE IF NOT EXISTS public.gm_external_channel_maps (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    channel_type TEXT NOT NULL,
    -- 'UBEREATS', 'GLOVO', 'BOLT', 'DELIVEROO'
    external_id TEXT NOT NULL,
    -- The ID on their platform (if mapped)
    -- Overrides (The Kernel decides if these apply)
    price_override NUMERIC(10, 2),
    -- If null, use base_price
    is_available_override BOOLEAN,
    -- If null, use is_active
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    -- Constraint: One map per channel per item
    CONSTRAINT uq_channel_map_item UNIQUE (menu_item_id, channel_type)
);
-- 4. Audit & Trigger Hooks (Placeholder)
-- In V2, these tables will feed the 'Cognitive Engine'.
-- For now, they are passive infrastructure.