-- ==============================================================================
-- DEPLOY MIGRATIONS CONSOLIDADO: FASE 1 (CORE/RLS) + FASE 2 (FISCAL)
-- ==============================================================================
-- Data: 2026-01-16
-- Inclui:
-- 1. RLS Tables Setup & Policies (20260111182110 + Corrections)
-- 2. Race Condition Fixes (20260111194500)
-- 3. Fiscal Event Store (20260116000002)
-- ==============================================================================
BEGIN;
-- ==============================================================================
-- FASE 1: RLS & CORE SECURITY
-- ==============================================================================
-- 1. Enable RLS
ALTER TABLE public.gm_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_payments ENABLE ROW LEVEL SECURITY;
-- 2. Helper Function (Public Schema Bypass)
CREATE OR REPLACE FUNCTION public.user_restaurant_ids() RETURNS SETOF UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
SELECT DISTINCT restaurant_id
FROM public.gm_restaurant_members
WHERE user_id = auth.uid();
$$;
-- 3. Policies (Drop & Recreate for Idempotency)
-- Orders
DROP POLICY IF EXISTS "users_select_own_restaurant_orders" ON public.gm_orders;
DROP POLICY IF EXISTS "users_insert_own_restaurant_orders" ON public.gm_orders;
DROP POLICY IF EXISTS "users_update_own_restaurant_orders" ON public.gm_orders;
DROP POLICY IF EXISTS "users_delete_own_restaurant_orders" ON public.gm_orders;
CREATE POLICY "users_select_own_restaurant_orders" ON public.gm_orders FOR
SELECT USING (
        restaurant_id IN (
            SELECT public.user_restaurant_ids()
        )
    );
CREATE POLICY "users_insert_own_restaurant_orders" ON public.gm_orders FOR
INSERT WITH CHECK (
        restaurant_id IN (
            SELECT public.user_restaurant_ids()
        )
    );
CREATE POLICY "users_update_own_restaurant_orders" ON public.gm_orders FOR
UPDATE USING (
        restaurant_id IN (
            SELECT public.user_restaurant_ids()
        )
    ) WITH CHECK (
        restaurant_id IN (
            SELECT public.user_restaurant_ids()
        )
    );
CREATE POLICY "users_delete_own_restaurant_orders" ON public.gm_orders FOR DELETE USING (
    restaurant_id IN (
        SELECT public.user_restaurant_ids()
    )
);
-- Order Items
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
                    SELECT public.user_restaurant_ids()
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
                    SELECT public.user_restaurant_ids()
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
                    SELECT public.user_restaurant_ids()
                )
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.gm_orders o
            WHERE o.id = gm_order_items.order_id
                AND o.restaurant_id IN (
                    SELECT public.user_restaurant_ids()
                )
        )
    );
CREATE POLICY "users_delete_own_restaurant_order_items" ON public.gm_order_items FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.gm_orders o
        WHERE o.id = gm_order_items.order_id
            AND o.restaurant_id IN (
                SELECT public.user_restaurant_ids()
            )
    )
);
-- Tables
DROP POLICY IF EXISTS "users_select_own_restaurant_tables" ON public.gm_tables;
DROP POLICY IF EXISTS "users_insert_own_restaurant_tables" ON public.gm_tables;
DROP POLICY IF EXISTS "users_update_own_restaurant_tables" ON public.gm_tables;
DROP POLICY IF EXISTS "users_delete_own_restaurant_tables" ON public.gm_tables;
CREATE POLICY "users_select_own_restaurant_tables" ON public.gm_tables FOR
SELECT USING (
        restaurant_id IN (
            SELECT public.user_restaurant_ids()
        )
    );
CREATE POLICY "users_insert_own_restaurant_tables" ON public.gm_tables FOR
INSERT WITH CHECK (
        restaurant_id IN (
            SELECT public.user_restaurant_ids()
        )
    );
CREATE POLICY "users_update_own_restaurant_tables" ON public.gm_tables FOR
UPDATE USING (
        restaurant_id IN (
            SELECT public.user_restaurant_ids()
        )
    ) WITH CHECK (
        restaurant_id IN (
            SELECT public.user_restaurant_ids()
        )
    );
CREATE POLICY "users_delete_own_restaurant_tables" ON public.gm_tables FOR DELETE USING (
    restaurant_id IN (
        SELECT public.user_restaurant_ids()
    )
);
-- Cash Registers
DROP POLICY IF EXISTS "users_select_own_restaurant_cash_registers" ON public.gm_cash_registers;
DROP POLICY IF EXISTS "users_insert_own_restaurant_cash_registers" ON public.gm_cash_registers;
DROP POLICY IF EXISTS "users_update_own_restaurant_cash_registers" ON public.gm_cash_registers;
DROP POLICY IF EXISTS "users_delete_own_restaurant_cash_registers" ON public.gm_cash_registers;
CREATE POLICY "users_select_own_restaurant_cash_registers" ON public.gm_cash_registers FOR
SELECT USING (
        restaurant_id IN (
            SELECT public.user_restaurant_ids()
        )
    );
CREATE POLICY "users_insert_own_restaurant_cash_registers" ON public.gm_cash_registers FOR
INSERT WITH CHECK (
        restaurant_id IN (
            SELECT public.user_restaurant_ids()
        )
    );
CREATE POLICY "users_update_own_restaurant_cash_registers" ON public.gm_cash_registers FOR
UPDATE USING (
        restaurant_id IN (
            SELECT public.user_restaurant_ids()
        )
    ) WITH CHECK (
        restaurant_id IN (
            SELECT public.user_restaurant_ids()
        )
    );
CREATE POLICY "users_delete_own_restaurant_cash_registers" ON public.gm_cash_registers FOR DELETE USING (
    restaurant_id IN (
        SELECT public.user_restaurant_ids()
    )
);
-- Payments
DROP POLICY IF EXISTS "users_select_own_restaurant_payments" ON public.gm_payments;
DROP POLICY IF EXISTS "users_insert_own_restaurant_payments" ON public.gm_payments;
DROP POLICY IF EXISTS "users_update_own_restaurant_payments" ON public.gm_payments;
DROP POLICY IF EXISTS "users_delete_own_restaurant_payments" ON public.gm_payments;
CREATE POLICY "users_select_own_restaurant_payments" ON public.gm_payments FOR
SELECT USING (
        tenant_id IN (
            SELECT public.user_restaurant_ids()
        )
    );
CREATE POLICY "users_insert_own_restaurant_payments" ON public.gm_payments FOR
INSERT WITH CHECK (
        tenant_id IN (
            SELECT public.user_restaurant_ids()
        )
    );
CREATE POLICY "users_update_own_restaurant_payments" ON public.gm_payments FOR
UPDATE USING (
        tenant_id IN (
            SELECT public.user_restaurant_ids()
        )
    ) WITH CHECK (
        tenant_id IN (
            SELECT public.user_restaurant_ids()
        )
    );
CREATE POLICY "users_delete_own_restaurant_payments" ON public.gm_payments FOR DELETE USING (
    tenant_id IN (
        SELECT public.user_restaurant_ids()
    )
);
-- 4. Race Condition Fixes (Table ID & Unique Indexes)
-- Add table_id if not exists
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'gm_orders'
        AND column_name = 'table_id'
) THEN
ALTER TABLE gm_orders
ADD COLUMN table_id UUID REFERENCES gm_tables(id);
END IF;
END $$;
-- Active Table Unique Index
CREATE UNIQUE INDEX IF NOT EXISTS idx_gm_orders_active_table ON gm_orders(table_id)
WHERE status NOT IN ('delivered', 'canceled')
    AND table_id IS NOT NULL;
-- One Open Cash Register Unique Index
DROP INDEX IF EXISTS idx_gm_cash_registers_one_open;
CREATE UNIQUE INDEX idx_gm_cash_registers_one_open ON public.gm_cash_registers(restaurant_id)
WHERE status = 'open';
-- Idempotency Index
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
-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_gm_orders_restaurant_active ON public.gm_orders(restaurant_id, status, created_at DESC)
WHERE status IN ('pending', 'preparing', 'ready');
CREATE INDEX IF NOT EXISTS idx_gm_order_items_order_status ON public.gm_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_gm_orders_restaurant_date_status ON public.gm_orders(restaurant_id, created_at, status)
WHERE status = 'delivered';
CREATE INDEX IF NOT EXISTS idx_gm_payments_order_created ON public.gm_payments(order_id, created_at DESC);
-- ==============================================================================
-- FASE 2: FISCAL EVENT STORE
-- ==============================================================================
-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.fiscal_event_store (
    fiscal_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fiscal_sequence_id BIGSERIAL NOT NULL,
    ref_seal_id VARCHAR(255),
    ref_event_id UUID,
    order_id UUID REFERENCES public.gm_orders(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL,
    -- Generic reference, avoiding foreign key constraint issues if table structure varies
    doc_type VARCHAR(50) NOT NULL,
    gov_protocol VARCHAR(255),
    payload_sent JSONB NOT NULL DEFAULT '{}'::jsonb,
    response_received JSONB,
    fiscal_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(order_id, doc_type)
);
-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_fiscal_event_store_restaurant ON public.fiscal_event_store(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_event_store_order ON public.fiscal_event_store(order_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_event_store_status ON public.fiscal_event_store(fiscal_status);
CREATE INDEX IF NOT EXISTS idx_fiscal_event_store_created_at ON public.fiscal_event_store(created_at DESC);
-- 3. Trigger
CREATE OR REPLACE FUNCTION update_fiscal_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS update_fiscal_modtime ON public.fiscal_event_store;
CREATE TRIGGER update_fiscal_modtime BEFORE
UPDATE ON public.fiscal_event_store FOR EACH ROW EXECUTE FUNCTION update_fiscal_timestamp();
-- 4. RLS for Fiscal
ALTER TABLE public.fiscal_event_store ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restaurant members can view fiscal events" ON public.fiscal_event_store;
DROP POLICY IF EXISTS "Restaurant members can insert fiscal events" ON public.fiscal_event_store;
DROP POLICY IF EXISTS "Restaurant members can update fiscal events" ON public.fiscal_event_store;
CREATE POLICY "Restaurant members can view fiscal events" ON public.fiscal_event_store FOR
SELECT USING (
        restaurant_id IN (
            SELECT public.user_restaurant_ids()
        )
    );
CREATE POLICY "Restaurant members can insert fiscal events" ON public.fiscal_event_store FOR
INSERT WITH CHECK (
        restaurant_id IN (
            SELECT public.user_restaurant_ids()
        )
    );
CREATE POLICY "Restaurant members can update fiscal events" ON public.fiscal_event_store FOR
UPDATE USING (
        restaurant_id IN (
            SELECT public.user_restaurant_ids()
        )
    );
COMMIT;