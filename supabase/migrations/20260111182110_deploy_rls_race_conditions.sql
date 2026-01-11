-- ==============================================================================
-- DEPLOY CRÍTICO: RLS + RACE CONDITIONS - MIGRATION CONSOLIDADA
-- ==============================================================================
-- Data: 2026-01-16
-- Aplicar este arquivo completo no Supabase Dashboard SQL Editor
-- ==============================================================================
-- ==============================================================================
-- PART 1: ENABLE RLS ON CRITICAL TABLES
-- ==============================================================================
ALTER TABLE public.gm_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_payments ENABLE ROW LEVEL SECURITY;
-- ==============================================================================
-- PART 2: HELPER FUNCTION - GET USER'S RESTAURANT IDs
-- ==============================================================================
CREATE OR REPLACE FUNCTION auth.user_restaurant_ids() RETURNS SETOF UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$ -- Support both table names for compatibility
SELECT DISTINCT restaurant_id
FROM (
        SELECT restaurant_id
        FROM public.gm_restaurant_memberships
        WHERE user_id = auth.uid()
            AND status = 'active'
        UNION
        SELECT restaurant_id
        FROM public.restaurant_members
        WHERE user_id = auth.uid()
    ) AS memberships;
$$;
-- ==============================================================================
-- PART 3: RLS POLICIES FOR gm_orders
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
CREATE POLICY "users_select_own_restaurant_orders" ON public.gm_orders FOR
SELECT USING (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );
-- Policy: Users can INSERT orders for their restaurants
CREATE POLICY "users_insert_own_restaurant_orders" ON public.gm_orders FOR
INSERT WITH CHECK (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );
-- Policy: Users can UPDATE orders from their restaurants
CREATE POLICY "users_update_own_restaurant_orders" ON public.gm_orders FOR
UPDATE USING (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    ) WITH CHECK (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );
-- Policy: Users can DELETE orders from their restaurants
CREATE POLICY "users_delete_own_restaurant_orders" ON public.gm_orders FOR DELETE USING (
    restaurant_id IN (
        SELECT auth.user_restaurant_ids()
    )
);
-- ==============================================================================
-- PART 4: RLS POLICIES FOR gm_order_items
-- ==============================================================================
DROP POLICY IF EXISTS "Only restaurant members can access their order items" ON public.gm_order_items;
DROP POLICY IF EXISTS "Enable read access for internal users" ON public.gm_order_items;
DROP POLICY IF EXISTS "users_select_own_restaurant_order_items" ON public.gm_order_items;
DROP POLICY IF EXISTS "users_insert_own_restaurant_order_items" ON public.gm_order_items;
DROP POLICY IF EXISTS "users_update_own_restaurant_order_items" ON public.gm_order_items;
DROP POLICY IF EXISTS "users_delete_own_restaurant_order_items" ON public.gm_order_items;
CREATE POLICY "users_select_own_restaurant_order_items" ON public.gm_order_items FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.gm_orders o
            WHERE o.id = gm_order_items.order_id
                AND o.restaurant_id IN (
                    SELECT auth.user_restaurant_ids()
                )
        )
    );
CREATE POLICY "users_insert_own_restaurant_order_items" ON public.gm_order_items FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.gm_orders o
            WHERE o.id = gm_order_items.order_id
                AND o.restaurant_id IN (
                    SELECT auth.user_restaurant_ids()
                )
        )
    );
CREATE POLICY "users_update_own_restaurant_order_items" ON public.gm_order_items FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.gm_orders o
            WHERE o.id = gm_order_items.order_id
                AND o.restaurant_id IN (
                    SELECT auth.user_restaurant_ids()
                )
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.gm_orders o
            WHERE o.id = gm_order_items.order_id
                AND o.restaurant_id IN (
                    SELECT auth.user_restaurant_ids()
                )
        )
    );
CREATE POLICY "users_delete_own_restaurant_order_items" ON public.gm_order_items FOR DELETE USING (
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
-- PART 5: RLS POLICIES FOR gm_tables
-- ==============================================================================
DROP POLICY IF EXISTS "Only restaurant members can access their tables" ON public.gm_tables;
DROP POLICY IF EXISTS "users_select_own_restaurant_tables" ON public.gm_tables;
DROP POLICY IF EXISTS "users_insert_own_restaurant_tables" ON public.gm_tables;
DROP POLICY IF EXISTS "users_update_own_restaurant_tables" ON public.gm_tables;
DROP POLICY IF EXISTS "users_delete_own_restaurant_tables" ON public.gm_tables;
CREATE POLICY "users_select_own_restaurant_tables" ON public.gm_tables FOR
SELECT USING (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );
CREATE POLICY "users_insert_own_restaurant_tables" ON public.gm_tables FOR
INSERT WITH CHECK (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );
CREATE POLICY "users_update_own_restaurant_tables" ON public.gm_tables FOR
UPDATE USING (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    ) WITH CHECK (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );
CREATE POLICY "users_delete_own_restaurant_tables" ON public.gm_tables FOR DELETE USING (
    restaurant_id IN (
        SELECT auth.user_restaurant_ids()
    )
);
-- ==============================================================================
-- PART 6: RLS POLICIES FOR gm_cash_registers
-- ==============================================================================
DROP POLICY IF EXISTS "Only restaurant members can access their cash registers" ON public.gm_cash_registers;
DROP POLICY IF EXISTS "users_select_own_restaurant_cash_registers" ON public.gm_cash_registers;
DROP POLICY IF EXISTS "users_insert_own_restaurant_cash_registers" ON public.gm_cash_registers;
DROP POLICY IF EXISTS "users_update_own_restaurant_cash_registers" ON public.gm_cash_registers;
DROP POLICY IF EXISTS "users_delete_own_restaurant_cash_registers" ON public.gm_cash_registers;
CREATE POLICY "users_select_own_restaurant_cash_registers" ON public.gm_cash_registers FOR
SELECT USING (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );
CREATE POLICY "users_insert_own_restaurant_cash_registers" ON public.gm_cash_registers FOR
INSERT WITH CHECK (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );
CREATE POLICY "users_update_own_restaurant_cash_registers" ON public.gm_cash_registers FOR
UPDATE USING (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    ) WITH CHECK (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );
CREATE POLICY "users_delete_own_restaurant_cash_registers" ON public.gm_cash_registers FOR DELETE USING (
    restaurant_id IN (
        SELECT auth.user_restaurant_ids()
    )
);
-- ==============================================================================
-- PART 7: RLS POLICIES FOR gm_payments
-- ==============================================================================
DROP POLICY IF EXISTS "Only restaurant members can access their payments" ON public.gm_payments;
DROP POLICY IF EXISTS "users_select_own_restaurant_payments" ON public.gm_payments;
DROP POLICY IF EXISTS "users_insert_own_restaurant_payments" ON public.gm_payments;
DROP POLICY IF EXISTS "users_update_own_restaurant_payments" ON public.gm_payments;
DROP POLICY IF EXISTS "users_delete_own_restaurant_payments" ON public.gm_payments;
CREATE POLICY "users_select_own_restaurant_payments" ON public.gm_payments FOR
SELECT USING (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );
CREATE POLICY "users_insert_own_restaurant_payments" ON public.gm_payments FOR
INSERT WITH CHECK (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );
CREATE POLICY "users_update_own_restaurant_payments" ON public.gm_payments FOR
UPDATE USING (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    ) WITH CHECK (
        restaurant_id IN (
            SELECT auth.user_restaurant_ids()
        )
    );
CREATE POLICY "users_delete_own_restaurant_payments" ON public.gm_payments FOR DELETE USING (
    restaurant_id IN (
        SELECT auth.user_restaurant_ids()
    )
);
-- ==============================================================================
-- PART 8: PREVENT RACE CONDITIONS - UNIQUE INDEXES
-- ==============================================================================
-- Prevent Multiple Active Orders on Same Table
-- MOVED TO MIGRATION 20260111194500 (Requires table_id column)
-- DROP INDEX IF EXISTS idx_gm_orders_active_table;
-- CREATE UNIQUE INDEX idx_gm_orders_active_table
--   ON public.gm_orders(restaurant_id, table_id)
--   WHERE status IN ('pending', 'preparing', 'ready')
--     AND table_id IS NOT NULL;
-- Prevent Multiple Open Cash Registers per Restaurant
DROP INDEX IF EXISTS idx_gm_cash_registers_one_open;
CREATE UNIQUE INDEX idx_gm_cash_registers_one_open ON public.gm_cash_registers(restaurant_id)
WHERE status = 'open';
-- Check valid status for cash registers (assuming 'open')
-- Prevent Duplicate Payment Processing (Idempotency)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'gm_payments'
        AND column_name = 'idempotency_key'
) THEN CREATE UNIQUE INDEX IF NOT EXISTS idx_gm_payments_idempotency ON public.gm_payments(idempotency_key)
WHERE idempotency_key IS NOT NULL;
END IF;
END $$;
-- ==============================================================================
-- PART 9: PERFORMANCE INDEXES FOR HOT PATHS
-- ==============================================================================
-- Index for fetching active orders by restaurant (KDS, TPV)
CREATE INDEX IF NOT EXISTS idx_gm_orders_restaurant_active ON public.gm_orders(restaurant_id, status, created_at DESC)
WHERE status IN ('pending', 'preparing', 'ready');
-- Index for fetching order items by order (common query)
CREATE INDEX IF NOT EXISTS idx_gm_order_items_order_status ON public.gm_order_items(order_id, created_at)
WHERE deleted_at IS NULL;
-- Index for daily totals calculation (cash register reports)
CREATE INDEX IF NOT EXISTS idx_gm_orders_restaurant_date_status ON public.gm_orders(restaurant_id, DATE(created_at), status)
WHERE status = 'delivered';
-- Index for payment history queries
CREATE INDEX IF NOT EXISTS idx_gm_payments_order_created ON public.gm_payments(order_id, created_at DESC);
-- ==============================================================================
-- PART 10: COMMENTS FOR DOCUMENTATION
-- ==============================================================================
COMMENT ON INDEX idx_gm_orders_active_table IS 'Prevents race condition: only one active order per table at a time';
COMMENT ON INDEX idx_gm_cash_registers_one_open IS 'Prevents race condition: only one open cash register per restaurant at a time';
COMMENT ON INDEX idx_gm_orders_restaurant_active IS 'Hot path: fetching active orders for KDS/TPV display';
COMMENT ON INDEX idx_gm_order_items_order_status IS 'Hot path: fetching order items for order display';
-- ==============================================================================
-- DEPLOY COMPLETE
-- ==============================================================================
-- Next: Run validation queries from VALIDAR_DEPLOY.sql
-- ==============================================================================