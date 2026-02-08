-- Migration: 039_menu_kernel_hardening.sql
-- Purpose: Harden the Menu Infrastructure to support Kernel Logic (Tax, Cost Centers, Versioning)
-- Strategy: Add columns as nullable/defaults to preserve existing PROD data (if any).
-- 1. Create Tax Profiles (Fiscal Personality)
CREATE TABLE IF NOT EXISTS public.gm_tax_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    -- e.g. "IVA Normal 23%"
    code TEXT NOT NULL,
    -- e.g. "NOR", "INT" (SAFT codes)
    rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    -- e.g. 23.00
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- 2. Create Cost Centers (Production Destination)
CREATE TABLE IF NOT EXISTS public.gm_cost_centers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    -- e.g. "Bar da Esplanada", "Cozinha Quente"
    type TEXT NOT NULL CHECK (type IN ('KITCHEN', 'BAR', 'COUNTER', 'OTHER')),
    created_at TIMESTAMPTZ DEFAULT now()
);
-- 3. Harden Menu Items (The Core Identity)
-- We use DO blocks to safely add columns if they don't exist
DO $$ BEGIN -- 3.1. Tax Profile Link
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'menu_items'
        AND column_name = 'tax_profile_id'
) THEN
ALTER TABLE public.menu_items
ADD COLUMN tax_profile_id UUID REFERENCES public.gm_tax_profiles(id) ON DELETE
SET NULL;
END IF;
-- 3.2. Cost Center Link
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'menu_items'
        AND column_name = 'cost_center_id'
) THEN
ALTER TABLE public.menu_items
ADD COLUMN cost_center_id UUID REFERENCES public.gm_cost_centers(id) ON DELETE
SET NULL;
END IF;
-- 3.3. Base Price (The immutable kernel price, distinct from display price)
-- For now, default base_price to current price to init.
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'menu_items'
        AND column_name = 'base_price'
) THEN
ALTER TABLE public.menu_items
ADD COLUMN base_price NUMERIC(10, 2);
END IF;
-- 3.4. Is Active (Explicit availability switch)
-- Note: 'available' column might exist from older schemas, we standardize on 'is_active' for kernel consistency
-- If 'available' exists, we can map logic in code, but let's ensure 'is_active' exists.
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'menu_items'
        AND column_name = 'is_active'
) THEN
ALTER TABLE public.menu_items
ADD COLUMN is_active BOOLEAN DEFAULT true;
END IF;
END $$;
-- 4. Harden Restaurant (Menu Metadata)
DO $$ BEGIN -- 4.1. Menu Status
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'gm_restaurants'
        AND column_name = 'menu_status'
) THEN
ALTER TABLE public.gm_restaurants
ADD COLUMN menu_status TEXT DEFAULT 'draft' CHECK (menu_status IN ('draft', 'verified', 'active'));
END IF;
-- 4.2. Menu Version
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'gm_restaurants'
        AND column_name = 'menu_version'
) THEN
ALTER TABLE public.gm_restaurants
ADD COLUMN menu_version INTEGER DEFAULT 1;
END IF;
END $$;