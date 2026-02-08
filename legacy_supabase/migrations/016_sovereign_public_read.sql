-- 016_sovereign_public_read.sql
-- PURPOSE: Allow the Public Void to see the menu (Read-Only).
-- 1. Restaurants (Profile)
ALTER TABLE public.gm_restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view restaurants" ON public.gm_restaurants FOR
SELECT TO anon,
    authenticated USING (true);
-- Public profiles are visible to all.
-- 2. Menu Categories
ALTER TABLE public.gm_menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view menu categories" ON public.gm_menu_categories FOR
SELECT TO anon,
    authenticated USING (true);
-- 3. Products
ALTER TABLE public.gm_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view products" ON public.gm_products FOR
SELECT TO anon,
    authenticated USING (true);
-- Note: We rely on the Frontend to filter by 'available' if needed, or we could enforce it here.
-- For Sovereign/Void integrity, truth is truth. If it exists, it can be read. Availability is a state, not a permission.