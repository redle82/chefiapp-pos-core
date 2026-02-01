-- ============================================================================
-- SOVEREIGN ISOLATION BLUEPRINT (RLS POLICIES)
-- ============================================================================
-- Este script demonstra a implementação técnica das Regras de Ouro 5, 6 e 7.

-- 1. Enable RLS on core tables
ALTER TABLE gm_restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE gm_restaurant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gm_orders ENABLE ROW LEVEL SECURITY;

-- 2. Helper function to get current user's membership for a restaurant
CREATE OR REPLACE FUNCTION get_user_role(target_restaurant_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM gm_restaurant_members
  WHERE user_id = auth.uid() AND restaurant_id = target_restaurant_id AND status = 'active';
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. POLICIES FOR: gm_orders
-- Rule: Owner/Admin sees all. Waiter sees all but can only create.

-- Policy: Select (Read)
CREATE POLICY "Users can view orders in their own restaurant"
ON gm_orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM gm_restaurant_members
    WHERE user_id = auth.uid()
    AND restaurant_id = gm_orders.restaurant_id
    AND status = 'active'
  )
);

-- Policy: Insert (Create)
CREATE POLICY "Users can create orders in their own restaurant"
ON gm_orders FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM gm_restaurant_members
    WHERE user_id = auth.uid()
    AND restaurant_id = gm_orders.restaurant_id
    AND status = 'active'
    AND role IN ('owner', 'admin', 'manager', 'waiter')
  )
);

-- Policy: Update (Modify)
CREATE POLICY "Only authorized roles can modify orders"
ON gm_orders FOR UPDATE
USING (
  get_user_role(restaurant_id) IN ('owner', 'admin', 'manager')
);

-- 4. POLICIES FOR: gm_restaurant_members
-- Rule: Users can only see their own memberships, Owners see all in their tenant.

CREATE POLICY "Users can view their own memberships"
ON gm_restaurant_members FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Owners can manage memberships in their tenant"
ON gm_restaurant_members FOR ALL
USING (get_user_role(restaurant_id) = 'owner');

-- ============================================================================
-- SUMMARY
-- This blueprint guarantees that even if a frontend client is compromised,
-- the Database (Nivel 0) will refuse to serve data from another tenant.
-- ============================================================================
