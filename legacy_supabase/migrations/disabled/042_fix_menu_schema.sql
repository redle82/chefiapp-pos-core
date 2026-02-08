-- Migration: 042_fix_menu_schema.sql
-- Purpose: Add missing columns to menu_categories to support ordering
-- Strategy: Check existence first to be safe
DO $$ BEGIN -- 1. Ensure sort_order exists
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'menu_categories'
        AND column_name = 'sort_order'
) THEN
ALTER TABLE public.menu_categories
ADD COLUMN sort_order INTEGER DEFAULT 0;
END IF;
-- 2. Ensure relationship to restaurant exists (just in case)
-- This is critical for data separation logic
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'menu_categories'
        AND column_name = 'restaurant_id'
) THEN
ALTER TABLE public.menu_categories
ADD COLUMN restaurant_id UUID REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;
END IF;
END $$;