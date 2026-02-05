-- FIX SCHEMA FOR DOCKER ENV (72h Correction Plan)
-- Adds missing columns to gm_restaurants and gm_products to support onboarding flow.

-- 1. GM_RESTAURANTS
ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS setup_status TEXT DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS wizard_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'PT',
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Restaurante',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Lisbon',
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'pt-PT',
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'trial';

-- 2. GM_PRODUCTS
ALTER TABLE public.gm_products
ADD COLUMN IF NOT EXISTS prep_time_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS station TEXT DEFAULT 'KITCHEN',
ADD COLUMN IF NOT EXISTS prep_category TEXT;

-- 3. GM_MENU_CATEGORIES (Ensure correct structure if not exists)
CREATE TABLE IF NOT EXISTS public.gm_menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.gm_restaurants(id),
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. GM_MENU_ITEMS (If used by legacy code, though gm_products is the target)
-- (No specific changes needed if gm_products is the primary table as per MenuWriter)
