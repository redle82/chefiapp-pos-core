-- Migration: 076_paid_order_immutability.sql
-- Purpose: Pedido PAID é IMUTÁVEL (lei física do sistema)
-- Date: 2026-01-03
-- 
-- REGRA DE OURO:
-- Um pedido pago NUNCA pode voltar a estado anterior.
-- Isso elimina toda uma classe de bugs e fraudes.
--
-- PILLAR 2: Estados impossíveis devem ser ilegais no DB

-- ============================================================
-- 1. TRIGGER: Prevenir alteração de status em pedido PAID
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_prevent_paid_order_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Se o pedido estava PAID e tentam mudar o status
    IF OLD.status = 'PAID' AND NEW.status != 'PAID' THEN
        RAISE EXCEPTION 'INVARIANTE VIOLADA: Pedido pago (ID: %) é imutável. Status não pode ser alterado de PAID para %.', 
            OLD.id, NEW.status;
    END IF;
    
    -- Se o pedido estava com payment_status PAID e tentam mudar
    IF OLD.payment_status = 'PAID' AND NEW.payment_status != 'PAID' THEN
        RAISE EXCEPTION 'INVARIANTE VIOLADA: Pedido pago (ID: %) é imutável. Payment status não pode ser alterado de PAID para %.', 
            OLD.id, NEW.payment_status;
    END IF;
    
    -- Prevenir redução de total em pedido pago (anti-fraude)
    IF OLD.status = 'PAID' AND NEW.total_cents < OLD.total_cents THEN
        RAISE EXCEPTION 'INVARIANTE VIOLADA: Total de pedido pago (ID: %) não pode ser reduzido. Atual: %, Tentativa: %.', 
            OLD.id, OLD.total_cents, NEW.total_cents;
    END IF;
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_prevent_paid_order_mutation IS 
'LEI FÍSICA: Pedido pago é imutável. Previne regressão de status e redução de total.';

-- Aplicar trigger
DROP TRIGGER IF EXISTS tr_prevent_paid_order_mutation ON public.gm_orders;
CREATE TRIGGER tr_prevent_paid_order_mutation
BEFORE UPDATE ON public.gm_orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_prevent_paid_order_mutation();

-- ============================================================
-- 2. TRIGGER: Prevenir DELETE de pedido PAID
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_prevent_paid_order_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF OLD.status = 'PAID' OR OLD.payment_status = 'PAID' THEN
        RAISE EXCEPTION 'INVARIANTE VIOLADA: Pedido pago (ID: %) não pode ser deletado. Dados fiscais são permanentes.', 
            OLD.id;
    END IF;
    
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS tr_prevent_paid_order_delete ON public.gm_orders;
CREATE TRIGGER tr_prevent_paid_order_delete
BEFORE DELETE ON public.gm_orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_prevent_paid_order_delete();

COMMENT ON TRIGGER tr_prevent_paid_order_delete ON public.gm_orders IS 
'LEI FÍSICA: Pedido pago não pode ser deletado. Preserva evidência fiscal.';

-- ============================================================
-- 3. TRIGGER: Prevenir DELETE de Payment
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_prevent_payment_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF OLD.status = 'paid' THEN
        RAISE EXCEPTION 'INVARIANTE VIOLADA: Pagamento concluído (ID: %) não pode ser deletado. Dados fiscais são permanentes.', 
            OLD.id;
    END IF;
    
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS tr_prevent_payment_delete ON public.gm_payments;
CREATE TRIGGER tr_prevent_payment_delete
BEFORE DELETE ON public.gm_payments
FOR EACH ROW
EXECUTE FUNCTION public.fn_prevent_payment_delete();

COMMENT ON TRIGGER tr_prevent_payment_delete ON public.gm_payments IS 
'LEI FÍSICA: Pagamento concluído não pode ser deletado. Preserva evidência fiscal.';

-- ============================================================
-- 4. TRIGGER: Prevenir UPDATE de Payment (append-only)
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_prevent_payment_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Payments são append-only, não podem ser modificados
    IF OLD.status = 'paid' THEN
        RAISE EXCEPTION 'INVARIANTE VIOLADA: Pagamento concluído (ID: %) é imutável. Use estorno para correções.', 
            OLD.id;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_prevent_payment_update ON public.gm_payments;
CREATE TRIGGER tr_prevent_payment_update
BEFORE UPDATE ON public.gm_payments
FOR EACH ROW
EXECUTE FUNCTION public.fn_prevent_payment_update();

COMMENT ON TRIGGER tr_prevent_payment_update ON public.gm_payments IS 
'LEI FÍSICA: Pagamento é append-only. Uma vez criado com status paid, não pode ser alterado.';
