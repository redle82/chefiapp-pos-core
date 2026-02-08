-- Migration: 20260123_02_shared_catalog.sql
-- Purpose: Enable "Master Catalog" via Linked Clones
-- Logic: Products in HQ can be read by all restaurants in Org. Child products reference HQ products via template_id.

-- 1. Add Lineage Tracking
ALTER TABLE public.gm_products
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.gm_products(id);

CREATE INDEX IF NOT EXISTS idx_gm_products_template_id ON public.gm_products(template_id);

-- 2. Update RLS to allow reading HQ products
-- Current policy "users_select_own_restaurant_products" limits to user's direct restaurants.
-- We need to expand this to include "Products from the HQ of my Organization".

DROP POLICY IF EXISTS "users_select_own_restaurant_products" ON public.gm_products;

CREATE POLICY "users_select_own_restaurant_products"
    ON public.gm_products
    FOR SELECT
    USING (
        -- 1. My direct restaurants (standard)
        restaurant_id IN (SELECT public.user_restaurant_ids())
        OR
        -- 2. My Organization's HQ (Master Catalog)
        restaurant_id IN (
            SELECT r.id
            FROM public.gm_restaurants r
            JOIN public.gm_organizations o ON o.id = r.organization_id
            WHERE r.is_headquarters = true
            AND o.id IN (SELECT public.get_user_organization_ids())
        )
    );

-- Note: WRITE access remains strict (only members of that specific restaurant/HQ can edit).
