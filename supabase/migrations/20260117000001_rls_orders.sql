-- Migration: 20260117000001_rls_orders.sql
-- CRITICAL: Row Level Security for Orders & Related Tables
-- Without this, restaurants can see each other's data

-- ==============================================================================
-- PART 1: Enable RLS on Critical Tables
-- ==============================================================================

ALTER TABLE public.gm_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_payments ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- PART 2: Helper Function - Get User's Restaurant IDs
-- ==============================================================================

CREATE OR REPLACE FUNCTION auth.user_restaurant_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    -- Support both table names for compatibility
    SELECT DISTINCT restaurant_id
    FROM (
        SELECT restaurant_id FROM public.gm_restaurant_memberships WHERE user_id = auth.uid() AND status = 'active'
        UNION
        SELECT restaurant_id FROM public.restaurant_members WHERE user_id = auth.uid()
    ) AS memberships;
$$;

-- ==============================================================================
-- PART 3: RLS Policies for gm_orders
-- ==============================================================================

-- Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Only restaurant members can access their orders" ON public.gm_orders;
DROP POLICY IF EXISTS "Enable read access for internal users" ON public.gm_orders;
DROP POLICY IF EXISTS "Enable insert access for internal users" ON public.gm_orders;
DROP POLICY IF EXISTS "Enable update access for internal users" ON public.gm_orders;
DROP POLICY IF EXISTS "users_select_own_restaurant_orders" ON public.gm_orders;
DROP POLICY IF EXISTS "users_insert_own_restaurant_orders" ON public.gm_orders;
DROP POLICY IF EXISTS "users_update_own_restaurant_orders" ON public.gm_orders;
DROP POLICY IF EXISTS "users_delete_own_restaurant_orders" ON public.gm_orders;

-- Policy: Users can SELECT orders from their restaurants
CREATE POLICY "users_select_own_restaurant_orders"
    ON public.gm_orders
    FOR SELECT
    USING (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );

-- Policy: Users can INSERT orders for their restaurants
CREATE POLICY "users_insert_own_restaurant_orders"
    ON public.gm_orders
    FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );

-- Policy: Users can UPDATE orders from their restaurants
CREATE POLICY "users_update_own_restaurant_orders"
    ON public.gm_orders
    FOR UPDATE
    USING (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    )
    WITH CHECK (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );

-- Policy: Users can DELETE orders from their restaurants (soft delete via status)
-- Note: Hard delete not recommended, but policy exists for completeness
CREATE POLICY "users_delete_own_restaurant_orders"
    ON public.gm_orders
    FOR DELETE
    USING (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );

-- ==============================================================================
-- PART 4: RLS Policies for gm_order_items
-- ==============================================================================

-- Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Only restaurant members can access their order items" ON public.gm_order_items;
DROP POLICY IF EXISTS "Enable read access for internal users" ON public.gm_order_items;
DROP POLICY IF EXISTS "users_select_own_restaurant_order_items" ON public.gm_order_items;
DROP POLICY IF EXISTS "users_insert_own_restaurant_order_items" ON public.gm_order_items;
DROP POLICY IF EXISTS "users_update_own_restaurant_order_items" ON public.gm_order_items;
DROP POLICY IF EXISTS "users_delete_own_restaurant_order_items" ON public.gm_order_items;

-- Policy: Users can SELECT items from orders in their restaurants
CREATE POLICY "users_select_own_restaurant_order_items"
    ON public.gm_order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.gm_orders o
            WHERE o.id = gm_order_items.order_id
                AND o.restaurant_id IN (
                    SELECT auth.user_restaurant_ids()
                )
        )
    );

-- Policy: Users can INSERT items into orders from their restaurants
CREATE POLICY "users_insert_own_restaurant_order_items"
    ON public.gm_order_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.gm_orders o
            WHERE o.id = gm_order_items.order_id
                AND o.restaurant_id IN (
                    SELECT auth.user_restaurant_ids()
                )
        )
    );

-- Policy: Users can UPDATE items from orders in their restaurants
CREATE POLICY "users_update_own_restaurant_order_items"
    ON public.gm_order_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.gm_orders o
            WHERE o.id = gm_order_items.order_id
                AND o.restaurant_id IN (
                    SELECT auth.user_restaurant_ids()
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.gm_orders o
            WHERE o.id = gm_order_items.order_id
                AND o.restaurant_id IN (
                    SELECT auth.user_restaurant_ids()
                )
        )
    );

-- Policy: Users can DELETE items from orders in their restaurants
CREATE POLICY "users_delete_own_restaurant_order_items"
    ON public.gm_order_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.gm_orders o
            WHERE o.id = gm_order_items.order_id
                AND o.restaurant_id IN (
                    SELECT auth.user_restaurant_ids()
                )
        )
    );

-- ==============================================================================
-- PART 5: RLS Policies for gm_tables
-- ==============================================================================

-- Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Only restaurant members can access their tables" ON public.gm_tables;
DROP POLICY IF EXISTS "users_select_own_restaurant_tables" ON public.gm_tables;
DROP POLICY IF EXISTS "users_insert_own_restaurant_tables" ON public.gm_tables;
DROP POLICY IF EXISTS "users_update_own_restaurant_tables" ON public.gm_tables;
DROP POLICY IF EXISTS "users_delete_own_restaurant_tables" ON public.gm_tables;

-- Policy: Users can SELECT tables from their restaurants
CREATE POLICY "users_select_own_restaurant_tables"
    ON public.gm_tables
    FOR SELECT
    USING (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );

-- Policy: Users can INSERT tables for their restaurants
CREATE POLICY "users_insert_own_restaurant_tables"
    ON public.gm_tables
    FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );

-- Policy: Users can UPDATE tables from their restaurants
CREATE POLICY "users_update_own_restaurant_tables"
    ON public.gm_tables
    FOR UPDATE
    USING (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    )
    WITH CHECK (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );

-- Policy: Users can DELETE tables from their restaurants
CREATE POLICY "users_delete_own_restaurant_tables"
    ON public.gm_tables
    FOR DELETE
    USING (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );

-- ==============================================================================
-- PART 6: RLS Policies for gm_cash_registers
-- ==============================================================================

-- Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Only restaurant members can access their cash registers" ON public.gm_cash_registers;
DROP POLICY IF EXISTS "users_select_own_restaurant_cash_registers" ON public.gm_cash_registers;
DROP POLICY IF EXISTS "users_insert_own_restaurant_cash_registers" ON public.gm_cash_registers;
DROP POLICY IF EXISTS "users_update_own_restaurant_cash_registers" ON public.gm_cash_registers;

-- Policy: Users can SELECT cash registers from their restaurants
CREATE POLICY "users_select_own_restaurant_cash_registers"
    ON public.gm_cash_registers
    FOR SELECT
    USING (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );

-- Policy: Users can INSERT cash registers for their restaurants
CREATE POLICY "users_insert_own_restaurant_cash_registers"
    ON public.gm_cash_registers
    FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );

-- Policy: Users can UPDATE cash registers from their restaurants
CREATE POLICY "users_update_own_restaurant_cash_registers"
    ON public.gm_cash_registers
    FOR UPDATE
    USING (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    )
    WITH CHECK (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );

-- ==============================================================================
-- PART 7: RLS Policies for gm_payments
-- ==============================================================================

-- Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Only restaurant members can access their payments" ON public.gm_payments;
DROP POLICY IF EXISTS "users_select_own_restaurant_payments" ON public.gm_payments;
DROP POLICY IF EXISTS "users_insert_own_restaurant_payments" ON public.gm_payments;
DROP POLICY IF EXISTS "users_update_own_restaurant_payments" ON public.gm_payments;

-- Policy: Users can SELECT payments from orders in their restaurants
CREATE POLICY "users_select_own_restaurant_payments"
    ON public.gm_payments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.gm_orders o
            WHERE o.id = gm_payments.order_id
                AND o.restaurant_id IN (
                    SELECT auth.user_restaurant_ids()
                )
        )
    );

-- Policy: Users can INSERT payments for orders in their restaurants
CREATE POLICY "users_insert_own_restaurant_payments"
    ON public.gm_payments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.gm_orders o
            WHERE o.id = gm_payments.order_id
                AND o.restaurant_id IN (
                    SELECT auth.user_restaurant_ids()
                )
        )
    );

-- Policy: Users can UPDATE payments from orders in their restaurants
CREATE POLICY "users_update_own_restaurant_payments"
    ON public.gm_payments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.gm_orders o
            WHERE o.id = gm_payments.order_id
                AND o.restaurant_id IN (
                    SELECT auth.user_restaurant_ids()
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.gm_orders o
            WHERE o.id = gm_payments.order_id
                AND o.restaurant_id IN (
                    SELECT auth.user_restaurant_ids()
                )
        )
    );

-- ==============================================================================
-- PART 8: Performance Indexes for RLS Queries
-- ==============================================================================

-- Index to speed up RLS policy checks on gm_orders
CREATE INDEX IF NOT EXISTS idx_gm_orders_restaurant_id_status
    ON public.gm_orders(restaurant_id, status)
    WHERE status IN ('OPEN', 'IN_PREP', 'READY');

-- Index to speed up RLS policy checks on gm_order_items
CREATE INDEX IF NOT EXISTS idx_gm_order_items_order_id
    ON public.gm_order_items(order_id);

-- Index to speed up RLS policy checks on gm_tables
CREATE INDEX IF NOT EXISTS idx_gm_tables_restaurant_id
    ON public.gm_tables(restaurant_id);

-- Index to speed up RLS policy checks on gm_cash_registers
CREATE INDEX IF NOT EXISTS idx_gm_cash_registers_restaurant_id
    ON public.gm_cash_registers(restaurant_id);

-- Index to speed up RLS policy checks on gm_payments
CREATE INDEX IF NOT EXISTS idx_gm_payments_order_id
    ON public.gm_payments(order_id);

-- Index to speed up user_restaurant_ids() function
CREATE INDEX IF NOT EXISTS idx_gm_restaurant_memberships_user_status
    ON public.gm_restaurant_memberships(user_id, status)
    WHERE status = 'active';
