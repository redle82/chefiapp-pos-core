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
