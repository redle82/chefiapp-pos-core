-- Migration: 20260117000002_prevent_race_conditions.sql
-- CRITICAL: Prevent race conditions in concurrent operations

-- ==============================================================================
-- PART 1: Prevent Multiple Active Orders on Same Table
-- ==============================================================================

-- Drop existing index if it exists (idempotent)
DROP INDEX IF EXISTS idx_gm_orders_active_table;

-- Create partial unique index: Only one active order per table
CREATE UNIQUE INDEX idx_gm_orders_active_table
  ON public.gm_orders(restaurant_id, table_id)
  WHERE status IN ('OPEN', 'IN_PREP', 'READY')
    AND table_id IS NOT NULL;

-- Rationale:
-- - Prevents two waiters from creating separate orders for the same table
-- - Only applies to active orders (not PAID or CANCELLED)
-- - Only applies when table_id is set (counter orders don't have table)

-- ==============================================================================
-- PART 2: Prevent Multiple Open Cash Registers per Restaurant
-- ==============================================================================

-- Drop existing index if it exists (idempotent)
DROP INDEX IF EXISTS idx_gm_cash_registers_one_open;

-- Create partial unique index: Only one open cash register per restaurant
CREATE UNIQUE INDEX idx_gm_cash_registers_one_open
  ON public.gm_cash_registers(restaurant_id)
  WHERE status = 'OPEN';

-- Rationale:
-- - Prevents multiple cash registers from being open simultaneously
-- - Critical for financial accuracy
-- - Only applies to OPEN status (closed registers don't conflict)

-- ==============================================================================
-- PART 3: Prevent Duplicate Payment Processing (Idempotency)
-- ==============================================================================

-- Drop existing index if it exists (idempotent)
DROP INDEX IF EXISTS idx_gm_payments_idempotency;

-- Create unique index on idempotency key (if column exists)
-- Note: This assumes gm_payments has an idempotency_key column
-- If not, this will be a no-op and should be added to the schema first
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'gm_payments'
            AND column_name = 'idempotency_key'
    ) THEN
        CREATE UNIQUE INDEX IF NOT EXISTS idx_gm_payments_idempotency
            ON public.gm_payments(idempotency_key)
            WHERE idempotency_key IS NOT NULL;
    END IF;
END $$;

-- ==============================================================================
-- PART 4: Performance Indexes for Hot Paths
-- ==============================================================================

-- Index for fetching active orders by restaurant (KDS, TPV)
CREATE INDEX IF NOT EXISTS idx_gm_orders_restaurant_active
    ON public.gm_orders(restaurant_id, status, created_at DESC)
    WHERE status IN ('OPEN', 'IN_PREP', 'READY');

-- Index for fetching order items by order (common query)
CREATE INDEX IF NOT EXISTS idx_gm_order_items_order_status
    ON public.gm_order_items(order_id, created_at)
    WHERE deleted_at IS NULL;

-- Index for daily totals calculation (cash register reports)
CREATE INDEX IF NOT EXISTS idx_gm_orders_restaurant_date_status
    ON public.gm_orders(restaurant_id, DATE(created_at), status)
    WHERE status = 'PAID';

-- Index for payment history queries
CREATE INDEX IF NOT EXISTS idx_gm_payments_order_created
    ON public.gm_payments(order_id, created_at DESC);

-- ==============================================================================
-- PART 5: Add Comments for Documentation
-- ==============================================================================

COMMENT ON INDEX idx_gm_orders_active_table IS
    'Prevents race condition: only one active order per table at a time';

COMMENT ON INDEX idx_gm_cash_registers_one_open IS
    'Prevents race condition: only one open cash register per restaurant at a time';

COMMENT ON INDEX idx_gm_orders_restaurant_active IS
    'Hot path: fetching active orders for KDS/TPV display';

COMMENT ON INDEX idx_gm_order_items_order_status IS
    'Hot path: fetching order items for order display';
