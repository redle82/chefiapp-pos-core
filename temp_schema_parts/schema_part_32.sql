-- ============================================================================
-- MIGRATION: Enforce Core Rules (Parte 3) - CANONICAL Implementation
-- ============================================================================
-- Data: 2026-01-24
-- Status: CANONICAL
-- 
-- IMPORTANTE: Usa TRIGGERS ao invés de CHECK constraints para regras
-- inter-tabelas, conforme recomendação canônica do PostgreSQL.
-- 
-- Esta migration implementa as 6 regras obrigatórias do Core:
-- 1. Estados financeiros irreversíveis
-- 2. Sem pagamento sem pedido finalizado
-- 3. Sem pedido sem sessão ativa
-- 4. Total imutável após LOCKED
-- 5. Item imutável após LOCKED
-- 6. Transições de estado validadas (via código, não banco)
-- ============================================================================

-- ============================================================================
-- REGRA 1: Estados Financeiros Irreversíveis
-- ============================================================================

-- Prevenir UPDATE de pedidos fechados
CREATE OR REPLACE FUNCTION prevent_update_closed_orders()
RETURNS trigger AS $$
BEGIN
  IF OLD.status IN ('CLOSED', 'PAID', 'CANCELLED') THEN
    RAISE EXCEPTION 'Cannot update order in terminal state: % (order_id: %)', 
      OLD.status, 
      OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_update_closed_orders_trigger
BEFORE UPDATE ON gm_orders
FOR EACH ROW
WHEN (OLD.status IN ('CLOSED', 'PAID', 'CANCELLED'))
EXECUTE FUNCTION prevent_update_closed_orders();

-- Prevenir DELETE de pedidos fechados
CREATE OR REPLACE FUNCTION prevent_delete_closed_orders()
RETURNS trigger AS $$
BEGIN
  IF OLD.status IN ('CLOSED', 'PAID', 'CANCELLED') THEN
    RAISE EXCEPTION 'Cannot delete order in terminal state: % (order_id: %)', 
      OLD.status, 
      OLD.id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_delete_closed_orders_trigger
BEFORE DELETE ON gm_orders
FOR EACH ROW
WHEN (OLD.status IN ('CLOSED', 'PAID', 'CANCELLED'))
EXECUTE FUNCTION prevent_delete_closed_orders();

-- ============================================================================
-- REGRA 2: Sem Pagamento Sem Pedido Finalizado
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_payment_requires_finalized_order()
RETURNS trigger AS $$
DECLARE
  order_status TEXT;
BEGIN
  SELECT status INTO order_status
  FROM gm_orders
  WHERE id = NEW.order_id;
  
  IF order_status IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', NEW.order_id;
  END IF;
  
  IF order_status NOT IN ('FINALIZED', 'CLOSED', 'PAID') THEN
    RAISE EXCEPTION 'Payment requires finalized order (order_id: %, current_status: %)', 
      NEW.order_id, 
      order_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_requires_finalized_order_trigger
BEFORE INSERT OR UPDATE ON gm_payments
FOR EACH ROW
EXECUTE FUNCTION enforce_payment_requires_finalized_order();

-- ============================================================================
-- REGRA 3: Sem Pedido Sem Sessão Ativa
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_order_requires_active_session()
RETURNS trigger AS $$
DECLARE
  session_status TEXT;
BEGIN
  SELECT status INTO session_status
  FROM gm_sessions
  WHERE id = NEW.session_id;
  
  IF session_status IS NULL THEN
    RAISE EXCEPTION 'Session not found: %', NEW.session_id;
  END IF;
  
  IF session_status != 'ACTIVE' THEN
    RAISE EXCEPTION 'Order requires active session (session_id: %, current_status: %)', 
      NEW.session_id,
      session_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_requires_active_session_trigger
BEFORE INSERT OR UPDATE ON gm_orders
FOR EACH ROW
EXECUTE FUNCTION enforce_order_requires_active_session();

-- ============================================================================
-- REGRA 4: Total Imutável Após LOCKED
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_total_change_when_locked()
RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'LOCKED' AND NEW.total != OLD.total THEN
    RAISE EXCEPTION 'Cannot change total when order is LOCKED (order_id: %, old_total: %, new_total: %)', 
      OLD.id,
      OLD.total,
      NEW.total;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_total_change_when_locked_trigger
BEFORE UPDATE ON gm_orders
FOR EACH ROW
WHEN (OLD.status = 'LOCKED')
EXECUTE FUNCTION prevent_total_change_when_locked();

-- ============================================================================
-- REGRA 5: Item Imutável Após LOCKED
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_item_change_when_order_locked()
RETURNS trigger AS $$
DECLARE
  order_status TEXT;
BEGIN
  SELECT status INTO order_status
  FROM gm_orders
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  IF order_status = 'LOCKED' THEN
    RAISE EXCEPTION 'Cannot modify items when order is LOCKED (order_id: %, item_id: %)', 
      COALESCE(NEW.order_id, OLD.order_id),
      COALESCE(NEW.id, OLD.id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_item_update_when_order_locked_trigger
BEFORE UPDATE ON gm_order_items
FOR EACH ROW
EXECUTE FUNCTION prevent_item_change_when_order_locked();

CREATE TRIGGER prevent_item_delete_when_order_locked_trigger
BEFORE DELETE ON gm_order_items
FOR EACH ROW
EXECUTE FUNCTION prevent_item_change_when_order_locked();

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON FUNCTION prevent_update_closed_orders() IS 
'Prevents UPDATE of orders in terminal states (CLOSED, PAID, CANCELLED). Part of Core Rule 1: Irreversible Financial States.';

COMMENT ON FUNCTION prevent_delete_closed_orders() IS 
'Prevents DELETE of orders in terminal states (CLOSED, PAID, CANCELLED). Part of Core Rule 1: Irreversible Financial States.';

COMMENT ON FUNCTION enforce_payment_requires_finalized_order() IS 
'Enforces that payments can only be created for finalized orders. Part of Core Rule 2: No Payment Without Finalized Order.';

COMMENT ON FUNCTION enforce_order_requires_active_session() IS 
'Enforces that orders can only be created for active sessions. Part of Core Rule 3: No Order Without Active Session.';

COMMENT ON FUNCTION prevent_total_change_when_locked() IS 
'Prevents total changes when order is LOCKED. Part of Core Rule 4: Total Immutable After LOCKED.';

COMMENT ON FUNCTION prevent_item_change_when_order_locked() IS 
'Prevents item changes when order is LOCKED. Part of Core Rule 5: Item Immutable After LOCKED.';

-- ============================================================================
-- VERIFICAÇÃO (Para validar que tudo foi criado)
-- ============================================================================

-- Listar todos os triggers criados
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgname IN (
    'prevent_update_closed_orders_trigger',
    'prevent_delete_closed_orders_trigger',
    'payment_requires_finalized_order_trigger',
    'order_requires_active_session_trigger',
    'prevent_total_change_when_locked_trigger',
    'prevent_item_update_when_order_locked_trigger',
    'prevent_item_delete_when_order_locked_trigger'
  );
  
  IF trigger_count = 7 THEN
    RAISE NOTICE '✅ All 7 triggers created successfully';
  ELSE
    RAISE WARNING '⚠️  Expected 7 triggers, found %', trigger_count;
  END IF;
END;
$$;
;
-- FIX P0 TRIGGER CASING
-- Author: Antigravity
-- Date: 2026-01-14

-- 1. Fix `prevent_terminal_order_mutation_trigger` on `gm_orders`
-- It was checking for 'delivered'/'canceled' (lower), allowing mutations on 'DELIVERED'.

DROP TRIGGER IF EXISTS prevent_terminal_order_mutation_trigger ON public.gm_orders;

CREATE TRIGGER prevent_terminal_order_mutation_trigger
    BEFORE UPDATE ON public.gm_orders
    FOR EACH ROW
    WHEN (OLD.status = ANY (ARRAY['DELIVERED', 'CANCELED', 'CLOSED'])) -- Enforce UPPERCASE
    EXECUTE FUNCTION public.gm_block_terminal_order_mutation();


-- 2. Ensure `gm_block_terminal_order_mutation` function handles casing correctly (if it checks internally)
-- Usually it just raises exception, but let's be sure.

CREATE OR REPLACE FUNCTION public.gm_block_terminal_order_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Allow updates only if strictly necessary (e.g. metadata sync provided explicit override?)
    -- For now, strict block.
    RAISE EXCEPTION 'Order is in terminal state (%) and cannot be modified.', OLD.status;
END;
$$;


-- 3. Fix potential casing issues in `prevent_update_closed_orders_trigger` (Redundant but safe)
-- Previous verify showed it was UPPERCASE ('CLOSED', 'PAID', 'CANCELLED'), but let's standardize 'CANCELED' vs 'CANCELLED' (one L vs two Ls).
-- Standard en_US is 'Canceled' (one L), but let's check what the system uses.
-- `20260112000000_create_orders_schema.sql` uses order_status enum: 'canceled' (one L).
-- So we should stick to ONE L 'CANCELED'.
-- The previous trigger output showed 'CANCELLED' (two Ls) in one of them?
-- "WHEN (old.status = ANY (ARRAY['CLOSED'::text, 'PAID'::text, 'CANCELLED'::text]))" -> Two Ls.
-- If the system uses 'CANCELED' (one L), then 'CANCELLED' (two Ls) check is useless!

-- Let's check `create_orders_schema` again. It defines 'canceled' (one L).
-- So 'CANCELLED' (two Ls) is a BUG.

DROP TRIGGER IF EXISTS prevent_update_closed_orders_trigger ON public.gm_orders;

CREATE TRIGGER prevent_update_closed_orders_trigger
    BEFORE UPDATE ON public.gm_orders
    FOR EACH ROW
    WHEN (OLD.status = ANY (ARRAY['CLOSED', 'PAID', 'CANCELED'])) -- Corrected spelling to CANCELED (one L) and ensured UPPERCASE
    EXECUTE FUNCTION prevent_update_closed_orders();

DROP TRIGGER IF EXISTS prevent_delete_closed_orders_trigger ON public.gm_orders;

CREATE TRIGGER prevent_delete_closed_orders_trigger
    BEFORE DELETE ON public.gm_orders
    FOR EACH ROW
    WHEN (OLD.status = ANY (ARRAY['CLOSED', 'PAID', 'CANCELED'])) -- Corrected spelling to CANCELED (one L)
    EXECUTE FUNCTION prevent_delete_closed_orders();
;
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
    );;
