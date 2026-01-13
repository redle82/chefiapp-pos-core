-- 🚀 SCRIPT CONSOLIDADO: APLICAR MIGRATIONS P0
-- ATENÇÃO: COPIE E COLE TUDO NO SUPABASE SQL EDITOR E CLIQUE EM RUN
-- =============================================================================
-- 1. ADD SYNC METADATA
-- =============================================================================
-- Add sync_metadata column (JSONB) to store offline sync information
ALTER TABLE gm_orders
ADD COLUMN IF NOT EXISTS sync_metadata JSONB DEFAULT NULL;
-- Add index for fast lookup by localId
CREATE INDEX IF NOT EXISTS idx_gm_orders_sync_local_id ON gm_orders ((sync_metadata->>'localId'));
-- Add comment
COMMENT ON COLUMN gm_orders.sync_metadata IS 'Metadata for offline sync: {localId, syncAttempts, lastSyncAt}';
-- =============================================================================
-- 2. UPDATE CREATE_ORDER_ATOMIC
-- =============================================================================
-- Drop existing function
DROP FUNCTION IF EXISTS public.create_order_atomic(UUID, JSONB, TEXT);
-- Recreate with sync_metadata parameter
CREATE OR REPLACE FUNCTION public.create_order_atomic(
        p_restaurant_id UUID,
        p_items JSONB,
        p_payment_method TEXT DEFAULT 'cash',
        p_sync_metadata JSONB DEFAULT NULL
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_order_id UUID;
v_total_amount INTEGER := 0;
v_item JSONB;
v_item_total INTEGER;
v_short_id TEXT;
v_count INTEGER;
BEGIN -- 1. Calculate Total Amount & Prepare Items
FOR v_item IN
SELECT *
FROM jsonb_array_elements(p_items) LOOP v_item_total := (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER;
v_total_amount := v_total_amount + v_item_total;
END LOOP;
-- 2. Generate Short ID
SELECT count(*) + 1 INTO v_count
FROM public.gm_orders
WHERE restaurant_id = p_restaurant_id;
v_short_id := '#' || v_count::TEXT;
-- 3. Insert Order (with sync_metadata if provided)
INSERT INTO public.gm_orders (
        restaurant_id,
        short_id,
        status,
        total_amount,
        payment_status,
        payment_method,
        sync_metadata
    )
VALUES (
        p_restaurant_id,
        v_short_id,
        'pending',
        v_total_amount,
        'pending',
        p_payment_method,
        p_sync_metadata
    )
RETURNING id INTO v_order_id;
-- 4. Insert Order Items
FOR v_item IN
SELECT *
FROM jsonb_array_elements(p_items) LOOP
INSERT INTO public.gm_order_items (
        order_id,
        product_id,
        product_name,
        quantity,
        unit_price,
        total_price
    )
VALUES (
        v_order_id,
        (v_item->>'product_id')::UUID,
        v_item->>'name',
        (v_item->>'quantity')::INTEGER,
        (v_item->>'unit_price')::INTEGER,
        (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER
    );
END LOOP;
-- 5. Return the created order
RETURN jsonb_build_object(
    'id',
    v_order_id,
    'short_id',
    v_short_id,
    'total_amount',
    v_total_amount,
    'status',
    'pending'
);
END;
$$;
-- =============================================================================
-- 3. ADD VERSION TO ORDERS
-- =============================================================================
-- Add version column (starts at 1, increments on each update)
ALTER TABLE gm_orders
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;
-- Add index for version lookups (used in WHERE clauses)
CREATE INDEX IF NOT EXISTS idx_gm_orders_version ON gm_orders(id, version);
-- Add comment
COMMENT ON COLUMN gm_orders.version IS 'Optimistic locking version - increments on each update to prevent race conditions';
-- Update trigger to auto-increment version on update
CREATE OR REPLACE FUNCTION increment_order_version() RETURNS TRIGGER AS $$ BEGIN NEW.version := OLD.version + 1;
NEW.updated_at := NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_increment_order_version ON gm_orders;
CREATE TRIGGER trigger_increment_order_version BEFORE
UPDATE ON gm_orders FOR EACH ROW EXECUTE FUNCTION increment_order_version();
-- =============================================================================
-- 4. ADD CHECK OPEN ORDERS RPC
-- =============================================================================
-- Function to check open orders with row-level lock
CREATE OR REPLACE FUNCTION public.check_open_orders_with_lock(p_restaurant_id UUID) RETURNS TABLE (id UUID, table_number INTEGER) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN -- Lock rows to prevent concurrent modifications
    RETURN QUERY
SELECT o.id,
    o.table_number
FROM gm_orders o
WHERE o.restaurant_id = p_restaurant_id
    AND o.status IN ('pending', 'preparing', 'ready')
    AND o.payment_status != 'PAID' FOR
UPDATE OF o;
END;
$$;
-- Add comment
COMMENT ON FUNCTION public.check_open_orders_with_lock IS 'Checks for open orders with row-level lock to prevent race conditions during cash register closure';
-- =============================================================================
-- 5. ADD FISCAL RETRY COUNT
-- =============================================================================
-- Adicionar coluna retry_count se não existir
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'fiscal_event_store'
        AND column_name = 'retry_count'
) THEN
ALTER TABLE public.fiscal_event_store
ADD COLUMN retry_count INTEGER DEFAULT 0;
END IF;
END $$;
-- Index para queries de retry (eficiente para buscar PENDING com retry_count baixo)
CREATE INDEX IF NOT EXISTS idx_fiscal_event_store_pending_retry ON public.fiscal_event_store(fiscal_status, retry_count, created_at)
WHERE fiscal_status = 'PENDING'
    AND retry_count < 10;
COMMENT ON COLUMN public.fiscal_event_store.retry_count IS 'P0-4: Número de tentativas de retry para faturas PENDING. Máximo 10 tentativas.';
-- FIM DO SCRIPT