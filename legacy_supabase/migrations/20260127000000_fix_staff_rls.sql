-- Fix RLS: Allow Staff to Manage Orders
-- Current policies locked out anyone who wasn't the owner.
-- 1. gm_orders
DROP POLICY IF EXISTS "Owners can manage orders" ON public.gm_orders;
DROP POLICY IF EXISTS "Staff can manage orders" ON public.gm_orders;
CREATE POLICY "Staff can manage orders" ON public.gm_orders FOR ALL USING (
    -- Owner
    auth.uid() IN (
        SELECT r.owner_id
        FROM public.gm_restaurants r
        WHERE r.id = gm_orders.restaurant_id
    )
    OR -- Member
    EXISTS (
        SELECT 1
        FROM public.gm_restaurant_members rm
        WHERE rm.restaurant_id = gm_orders.restaurant_id
            AND rm.user_id = auth.uid()
    )
);
-- 2. gm_order_items (Inherits access via order_id, but safer to check member)
DROP POLICY IF EXISTS "Owners can manage order items" ON public.gm_order_items;
DROP POLICY IF EXISTS "Staff can manage order items" ON public.gm_order_items;
CREATE POLICY "Staff can manage order items" ON public.gm_order_items FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.gm_orders o
            JOIN public.gm_restaurants r ON r.id = o.restaurant_id
            LEFT JOIN public.gm_restaurant_members rm ON rm.restaurant_id = r.id
        WHERE o.id = gm_order_items.order_id
            AND (
                r.owner_id = auth.uid()
                OR rm.user_id = auth.uid()
            )
    )
);
-- 3. integration_orders
DROP POLICY IF EXISTS "Restaurant owners can view their integration orders" ON public.integration_orders;
DROP POLICY IF EXISTS "Staff can view integration orders" ON public.integration_orders;
CREATE POLICY "Staff can view integration orders" ON public.integration_orders FOR
SELECT USING (
        -- Owner check (restaurant_id linkage)
        restaurant_id IN (
            SELECT id
            FROM public.gm_restaurants
            WHERE owner_id = auth.uid()
        )
        OR -- Member check
        EXISTS (
            SELECT 1
            FROM public.gm_restaurant_members rm
            WHERE rm.restaurant_id = integration_orders.restaurant_id
                AND rm.user_id = auth.uid()
        )
    );