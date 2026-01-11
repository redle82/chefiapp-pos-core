-- 082: Constitutional Law - One Open Order Per Table
-- Date: 2025-01-08
-- Purpose: Prevent race condition when TPV and Web create orders simultaneously
-- Risk Mitigated: T3 (Garçom + Web mesmo instante)

-- This is a PARTIAL UNIQUE INDEX - only enforces uniqueness for OPEN orders
-- Multiple CLOSED/PAID orders for same table are allowed (historical data)

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_order_per_table
ON public.gm_orders (table_id)
WHERE status = 'OPEN' AND table_id IS NOT NULL;

-- Expected error when violated:
-- ERROR: duplicate key value violates unique constraint "idx_one_open_order_per_table"
-- 
-- Client/Backend should catch this and show:
-- "Já existe um pedido ativo para esta mesa"

COMMENT ON INDEX idx_one_open_order_per_table IS 
'Constitutional constraint: One OPEN order per table. Prevents T3 race condition (TPV + Web simultaneous order creation).';
