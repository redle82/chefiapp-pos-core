-- Migration: 073_cash_register_validation.sql
-- Purpose: Validações críticas de caixa no backend
-- Date: 2025-01-27
-- 
-- BLOQUEADORES CRÍTICOS:
-- 1. Constraint: Orders só podem ser criados se caixa aberto
-- 2. Função: Validar orders abertos antes de fechar caixa
-- 3. Trigger: Prevenir criação de order sem caixa aberto
-- 1. FUNÇÃO: Verificar se caixa está aberto
CREATE OR REPLACE FUNCTION public.fn_check_cash_register_open(p_restaurant_id UUID) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_register_id UUID;
BEGIN -- Buscar caixa aberto
SELECT id INTO v_register_id
FROM public.cash_registers
WHERE restaurant_id = p_restaurant_id
    AND status = 'open'
LIMIT 1;
RETURN v_register_id;
END;
$$;
COMMENT ON FUNCTION public.fn_check_cash_register_open IS 'Verifica se existe caixa aberto para o restaurante. Retorna UUID do caixa ou NULL.';
-- 2. FUNÇÃO: Validar orders abertos antes de fechar caixa
CREATE OR REPLACE FUNCTION public.fn_validate_orders_before_close(p_restaurant_id UUID) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_open_orders_count INTEGER;
BEGIN -- Contar orders abertos (não pagos, não cancelados)
SELECT COUNT(*) INTO v_open_orders_count
FROM public.gm_orders
WHERE restaurant_id = p_restaurant_id
    AND status IN ('OPEN', 'IN_PREP', 'READY')
    AND payment_status != 'PAID';
RETURN v_open_orders_count;
END;
$$;
COMMENT ON FUNCTION public.fn_validate_orders_before_close IS 'Conta quantos orders abertos existem. Retorna 0 se pode fechar caixa, >0 se não pode.';
-- 3. TRIGGER: Validar caixa aberto antes de criar order
-- NOTA: Não podemos usar constraint CHECK porque precisa consultar outra tabela
-- Usamos trigger BEFORE INSERT para validar
CREATE OR REPLACE FUNCTION public.fn_validate_cash_register_before_order() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_cash_register_id UUID;
BEGIN -- Se order já tem cash_register_id, verificar se está aberto
IF NEW.cash_register_id IS NOT NULL THEN
SELECT id INTO v_cash_register_id
FROM public.cash_registers
WHERE id = NEW.cash_register_id
    AND status = 'open';
IF v_cash_register_id IS NULL THEN RAISE EXCEPTION 'Cash register is not open. Cannot create order without open cash register.';
END IF;
ELSE -- Se não tem cash_register_id, buscar caixa aberto automaticamente
v_cash_register_id := public.fn_check_cash_register_open(NEW.restaurant_id);
IF v_cash_register_id IS NULL THEN RAISE EXCEPTION 'No open cash register found. Open cash register before creating orders.';
END IF;
-- Atribuir caixa aberto ao order
NEW.cash_register_id := v_cash_register_id;
END IF;
RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tr_validate_cash_register_before_order ON public.gm_orders;
CREATE TRIGGER tr_validate_cash_register_before_order BEFORE
INSERT ON public.gm_orders FOR EACH ROW EXECUTE FUNCTION public.fn_validate_cash_register_before_order();
COMMENT ON TRIGGER tr_validate_cash_register_before_order ON public.gm_orders IS 'Valida que caixa está aberto antes de criar order. Bloqueador absoluto.';
-- 4. TRIGGER: Prevenir fechamento de caixa com orders abertos
CREATE OR REPLACE FUNCTION public.fn_validate_orders_before_close_register() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_open_orders_count INTEGER;
BEGIN -- Só validar quando status muda de 'open' para 'closed'
IF OLD.status = 'open'
AND NEW.status = 'closed' THEN v_open_orders_count := public.fn_validate_orders_before_close(NEW.restaurant_id);
IF v_open_orders_count > 0 THEN RAISE EXCEPTION 'Cannot close cash register with % open order(s). Close or cancel orders first.',
v_open_orders_count;
END IF;
END IF;
RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tr_validate_orders_before_close_register ON public.cash_registers;
CREATE TRIGGER tr_validate_orders_before_close_register BEFORE
UPDATE ON public.cash_registers FOR EACH ROW EXECUTE FUNCTION public.fn_validate_orders_before_close_register();
COMMENT ON TRIGGER tr_validate_orders_before_close_register ON public.cash_registers IS 'Valida que não há orders abertos antes de fechar caixa. Bloqueador absoluto.';
-- 5. INDEX para performance na validação
CREATE INDEX IF NOT EXISTS idx_cash_registers_restaurant_status ON public.cash_registers(restaurant_id, status)
WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status_payment ON public.gm_orders(restaurant_id, status, payment_status)
WHERE status IN ('OPEN', 'IN_PREP', 'READY')
    AND payment_status != 'PAID';