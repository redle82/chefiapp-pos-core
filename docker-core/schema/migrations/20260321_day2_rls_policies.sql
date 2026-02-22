-- =============================================================================
-- Day 2: RLS Policies for Multi-Tenancy Isolation
-- =============================================================================
-- Purpose: Enable Row-Level Security on all core tables
-- This ensures different organizations/restaurants cannot see each other's data
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. ENABLE RLS on Core Tables
-- =============================================================================

ALTER TABLE public.gm_restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_restaurant_members ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 2. RLS Policies for gm_restaurants (tenant isolation)
-- =============================================================================

-- SELECT: User can see restaurants they have access to
DROP POLICY IF EXISTS "restaurants_select" ON public.gm_restaurants;
CREATE POLICY "restaurants_select"
  ON public.gm_restaurants
  FOR SELECT
  TO authenticated
  USING (has_restaurant_access(id));

-- INSERT: Only authenticated users can create restaurants (within their org)
DROP POLICY IF EXISTS "restaurants_insert" ON public.gm_restaurants;
CREATE POLICY "restaurants_insert"
  ON public.gm_restaurants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Only users with restaurant access can update
DROP POLICY IF EXISTS "restaurants_update" ON public.gm_restaurants;
CREATE POLICY "restaurants_update"
  ON public.gm_restaurants
  FOR UPDATE
  TO authenticated
  USING (has_restaurant_access(id))
  WITH CHECK (has_restaurant_access(id));

-- DELETE: Only users with restaurant access can delete
DROP POLICY IF EXISTS "restaurants_delete" ON public.gm_restaurants;
CREATE POLICY "restaurants_delete"
  ON public.gm_restaurants
  FOR DELETE
  TO authenticated
  USING (has_restaurant_access(id));

-- Service role gets full access
DROP POLICY IF EXISTS "restaurants_service_all" ON public.gm_restaurants;
CREATE POLICY "restaurants_service_all"
  ON public.gm_restaurants
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 3. RLS Policies for gm_orders (via restaurant isolation)
-- =============================================================================

-- SELECT: User can see orders from restaurants they have access to
DROP POLICY IF EXISTS "orders_select" ON public.gm_orders;
CREATE POLICY "orders_select"
  ON public.gm_orders
  FOR SELECT
  TO authenticated
  USING (has_restaurant_access(restaurant_id));

-- INSERT: User can create orders in restaurants they have access to
DROP POLICY IF EXISTS "orders_insert" ON public.gm_orders;
CREATE POLICY "orders_insert"
  ON public.gm_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (has_restaurant_access(restaurant_id));

-- UPDATE: User can update orders in restaurants they have access to
DROP POLICY IF EXISTS "orders_update" ON public.gm_orders;
CREATE POLICY "orders_update"
  ON public.gm_orders
  FOR UPDATE
  TO authenticated
  USING (has_restaurant_access(restaurant_id))
  WITH CHECK (has_restaurant_access(restaurant_id));

-- DELETE: User can delete orders in restaurants they have access to
DROP POLICY IF EXISTS "orders_delete" ON public.gm_orders;
CREATE POLICY "orders_delete"
  ON public.gm_orders
  FOR DELETE
  TO authenticated
  USING (has_restaurant_access(restaurant_id));

-- Service role gets full access
DROP POLICY IF EXISTS "orders_service_all" ON public.gm_orders;
CREATE POLICY "orders_service_all"
  ON public.gm_orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 4. RLS Policies for gm_order_items (cascade from orders)
-- =============================================================================

-- SELECT: User can see order items from orders they have access to
DROP POLICY IF EXISTS "order_items_select" ON public.gm_order_items;
CREATE POLICY "order_items_select"
  ON public.gm_order_items
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.gm_orders
      WHERE has_restaurant_access(restaurant_id)
    )
  );

-- INSERT: User can add items to orders in their restaurants
DROP POLICY IF EXISTS "order_items_insert" ON public.gm_order_items;
CREATE POLICY "order_items_insert"
  ON public.gm_order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.gm_orders
      WHERE has_restaurant_access(restaurant_id)
    )
  );

-- UPDATE: User can update items in their orders
DROP POLICY IF EXISTS "order_items_update" ON public.gm_order_items;
CREATE POLICY "order_items_update"
  ON public.gm_order_items
  FOR UPDATE
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.gm_orders
      WHERE has_restaurant_access(restaurant_id)
    )
  )
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.gm_orders
      WHERE has_restaurant_access(restaurant_id)
    )
  );

-- DELETE: User can delete items from their orders
DROP POLICY IF EXISTS "order_items_delete" ON public.gm_order_items;
CREATE POLICY "order_items_delete"
  ON public.gm_order_items
  FOR DELETE
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.gm_orders
      WHERE has_restaurant_access(restaurant_id)
    )
  );

-- Service role gets full access
DROP POLICY IF EXISTS "order_items_service_all" ON public.gm_order_items;
CREATE POLICY "order_items_service_all"
  ON public.gm_order_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 5. RLS Policies for gm_payments (cascade from orders)
-- =============================================================================

-- SELECT: User can see payments from orders in their restaurants
DROP POLICY IF EXISTS "payments_select" ON public.gm_payments;
CREATE POLICY "payments_select"
  ON public.gm_payments
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.gm_orders
      WHERE has_restaurant_access(restaurant_id)
    )
  );

-- INSERT: User can add payments to orders in their restaurants
DROP POLICY IF EXISTS "payments_insert" ON public.gm_payments;
CREATE POLICY "payments_insert"
  ON public.gm_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.gm_orders
      WHERE has_restaurant_access(restaurant_id)
    )
  );

-- UPDATE: User can update payments in their orders
DROP POLICY IF EXISTS "payments_update" ON public.gm_payments;
CREATE POLICY "payments_update"
  ON public.gm_payments
  FOR UPDATE
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.gm_orders
      WHERE has_restaurant_access(restaurant_id)
    )
  )
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.gm_orders
      WHERE has_restaurant_access(restaurant_id)
    )
  );

-- DELETE: User can delete payments from their orders
DROP POLICY IF EXISTS "payments_delete" ON public.gm_payments;
CREATE POLICY "payments_delete"
  ON public.gm_payments
  FOR DELETE
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.gm_orders
      WHERE has_restaurant_access(restaurant_id)
    )
  );

-- Service role gets full access
DROP POLICY IF EXISTS "payments_service_all" ON public.gm_payments;
CREATE POLICY "payments_service_all"
  ON public.gm_payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 6. RLS Policies for gm_restaurant_members (who works at this restaurant)
-- =============================================================================

-- SELECT: Users can see members of restaurants they have access to
DROP POLICY IF EXISTS "restaurant_members_select" ON public.gm_restaurant_members;
CREATE POLICY "restaurant_members_select"
  ON public.gm_restaurant_members
  FOR SELECT
  TO authenticated
  USING (has_restaurant_access(restaurant_id));

-- INSERT: Users can add members to restaurants they have access to
DROP POLICY IF EXISTS "restaurant_members_insert" ON public.gm_restaurant_members;
CREATE POLICY "restaurant_members_insert"
  ON public.gm_restaurant_members
  FOR INSERT
  TO authenticated
  WITH CHECK (has_restaurant_access(restaurant_id));

-- UPDATE: Users can update members in restaurants they have access to
DROP POLICY IF EXISTS "restaurant_members_update" ON public.gm_restaurant_members;
CREATE POLICY "restaurant_members_update"
  ON public.gm_restaurant_members
  FOR UPDATE
  TO authenticated
  USING (has_restaurant_access(restaurant_id))
  WITH CHECK (has_restaurant_access(restaurant_id));

-- DELETE: Users can remove members from restaurants they have access to
DROP POLICY IF EXISTS "restaurant_members_delete" ON public.gm_restaurant_members;
CREATE POLICY "restaurant_members_delete"
  ON public.gm_restaurant_members
  FOR DELETE
  TO authenticated
  USING (has_restaurant_access(restaurant_id));

-- Service role gets full access
DROP POLICY IF EXISTS "restaurant_members_service_all" ON public.gm_restaurant_members;
CREATE POLICY "restaurant_members_service_all"
  ON public.gm_restaurant_members
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 7. RLS-Aware Indexes for Performance
-- =============================================================================

-- Fast lookup: restaurant_users (used in has_restaurant_access)
CREATE INDEX IF NOT EXISTS idx_restaurant_users_user_id
  ON public.restaurant_users(user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_restaurant_users_restaurant_id
  ON public.restaurant_users(restaurant_id)
  WHERE deleted_at IS NULL;

-- Fast lookup: orders by restaurant (used in order item/payment policies)
CREATE INDEX IF NOT EXISTS idx_gm_orders_restaurant_id_created
  ON public.gm_orders(restaurant_id, created_at DESC);

-- Fast lookup: order items by order (used in aggregations)
CREATE INDEX IF NOT EXISTS idx_gm_order_items_order_id
  ON public.gm_order_items(order_id);

-- Fast lookup: payments by order (used in aggregations)
CREATE INDEX IF NOT EXISTS idx_gm_payments_order_id
  ON public.gm_payments(order_id);

-- Fast lookup: restaurant members
CREATE INDEX IF NOT EXISTS idx_gm_restaurant_members_restaurant_id
  ON public.gm_restaurant_members(restaurant_id);

-- Analyze indexes to ensure query planner knows about them
ANALYZE;

-- =============================================================================
-- 8. Grant Permissions
-- =============================================================================

-- Allow authenticated users to access the tables (RLS will filter rows)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gm_restaurants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gm_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gm_order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gm_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gm_restaurant_members TO authenticated;

-- Allow service_role to bypass RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gm_restaurants TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gm_orders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gm_order_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gm_payments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gm_restaurant_members TO service_role;

-- No access for anon role (only authenticated and service_role)
REVOKE ALL ON public.gm_restaurants FROM anon;
REVOKE ALL ON public.gm_orders FROM anon;
REVOKE ALL ON public.gm_order_items FROM anon;
REVOKE ALL ON public.gm_payments FROM anon;
REVOKE ALL ON public.gm_restaurant_members FROM anon;

COMMIT;
