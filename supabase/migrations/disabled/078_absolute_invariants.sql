-- Migration: 078_absolute_invariants.sql
-- Purpose: BANCO É LEI SUPREMA - O sistema não pode mentir
-- Date: 2026-01-03
-- 
-- FILOSOFIA:
-- Se o DB aceita, o sistema aceita.
-- Se o DB rejeita, o sistema não mente.
-- Não existe estado inválido "temporário".
-- Não existe "depois eu corrijo".
--
-- ESTE ARQUIVO DEFINE AS LEIS FÍSICAS DO UNIVERSO FINANCEIRO

-- ============================================================
-- 1. FUNÇÃO: Verificar caixa aberto para restaurant
-- ============================================================
-- Necessário para constraints que referenciam outra tabela

CREATE OR REPLACE FUNCTION public.fn_has_open_cash_register(p_restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.cash_registers
        WHERE restaurant_id = p_restaurant_id
        AND status = 'open'
    );
END;
$$;

-- ============================================================
-- 2. TRIGGER: Pagamento REQUER caixa aberto
-- ============================================================
-- Nenhum pagamento pode existir se não há caixa aberto.
-- Isso é lei física, não validação de negócio.

CREATE OR REPLACE FUNCTION public.fn_enforce_payment_requires_open_cash()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_restaurant_id UUID;
BEGIN
    -- Buscar restaurant do order
    SELECT restaurant_id INTO v_restaurant_id
    FROM public.gm_orders
    WHERE id = NEW.order_id;
    
    IF v_restaurant_id IS NULL THEN
        RAISE EXCEPTION 'LEI VIOLADA: Pagamento referencia order inexistente (order_id: %).', NEW.order_id;
    END IF;
    
    -- Verificar caixa aberto
    IF NOT public.fn_has_open_cash_register(v_restaurant_id) THEN
        RAISE EXCEPTION 'LEI VIOLADA: Pagamento requer caixa aberto. Nenhum caixa aberto para restaurant %.', v_restaurant_id;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enforce_payment_requires_open_cash ON public.gm_payments;
CREATE TRIGGER tr_enforce_payment_requires_open_cash
BEFORE INSERT ON public.gm_payments
FOR EACH ROW
EXECUTE FUNCTION public.fn_enforce_payment_requires_open_cash();

COMMENT ON TRIGGER tr_enforce_payment_requires_open_cash ON public.gm_payments IS 
'LEI FÍSICA: Nenhum pagamento pode existir sem caixa aberto.';

-- ============================================================
-- 3. CONSTRAINT: Order não pode ter total negativo
-- ============================================================

ALTER TABLE public.gm_orders
DROP CONSTRAINT IF EXISTS chk_order_total_non_negative;

ALTER TABLE public.gm_orders
ADD CONSTRAINT chk_order_total_non_negative
CHECK (total_cents >= 0);

-- ============================================================
-- 4. CONSTRAINT: Payment deve ter valor positivo
-- ============================================================

ALTER TABLE public.gm_payments
DROP CONSTRAINT IF EXISTS chk_payment_amount_positive;

ALTER TABLE public.gm_payments
ADD CONSTRAINT chk_payment_amount_positive
CHECK (amount_cents > 0);

-- ============================================================
-- 5. CONSTRAINT: Status de pedido é finito e conhecido
-- ============================================================

ALTER TABLE public.gm_orders
DROP CONSTRAINT IF EXISTS chk_order_status_valid;

ALTER TABLE public.gm_orders
ADD CONSTRAINT chk_order_status_valid
CHECK (status IN ('OPEN', 'IN_PREP', 'READY', 'PAID', 'CANCELLED'));

-- ============================================================
-- 6. CONSTRAINT: Payment status é finito
-- ============================================================

ALTER TABLE public.gm_payments
DROP CONSTRAINT IF EXISTS chk_payment_status_valid;

ALTER TABLE public.gm_payments
ADD CONSTRAINT chk_payment_status_valid
CHECK (status IN ('pending', 'paid', 'failed', 'refunded'));

-- ============================================================
-- 7. CONSTRAINT: Método de pagamento é finito
-- ============================================================

ALTER TABLE public.gm_payments
DROP CONSTRAINT IF EXISTS chk_payment_method_valid;

ALTER TABLE public.gm_payments
ADD CONSTRAINT chk_payment_method_valid
CHECK (method IN ('cash', 'card', 'pix'));

-- ============================================================
-- 8. TRIGGER: Order PAID não pode voltar a estados anteriores
-- ============================================================
-- Estado PAID é terminal e irreversível.
-- Qualquer tentativa de reverter é uma violação de lei física.

CREATE OR REPLACE FUNCTION public.fn_enforce_paid_is_terminal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Se era PAID e tentam mudar para qualquer outra coisa
    IF OLD.status = 'PAID' AND NEW.status != 'PAID' THEN
        RAISE EXCEPTION 'LEI VIOLADA: Status PAID é terminal e irreversível. Order % não pode voltar de PAID para %.', 
            OLD.id, NEW.status;
    END IF;
    
    -- Se payment_status era PAID e tentam mudar
    IF OLD.payment_status = 'PAID' AND NEW.payment_status != 'PAID' THEN
        RAISE EXCEPTION 'LEI VIOLADA: Payment status PAID é terminal. Order % não pode ter payment_status alterado de PAID.', 
            OLD.id;
    END IF;
    
    -- Não pode reduzir total de pedido pago
    IF OLD.status = 'PAID' AND NEW.total_cents < OLD.total_cents THEN
        RAISE EXCEPTION 'LEI VIOLADA: Total de pedido pago é imutável. Order % não pode ter total reduzido de % para %.', 
            OLD.id, OLD.total_cents, NEW.total_cents;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enforce_paid_is_terminal ON public.gm_orders;
CREATE TRIGGER tr_enforce_paid_is_terminal
BEFORE UPDATE ON public.gm_orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_enforce_paid_is_terminal();

-- ============================================================
-- 9. TRIGGER: Order CANCELLED também é terminal
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_enforce_cancelled_is_terminal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF OLD.status = 'CANCELLED' AND NEW.status != 'CANCELLED' THEN
        RAISE EXCEPTION 'LEI VIOLADA: Status CANCELLED é terminal. Order % não pode ser reativado.', OLD.id;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enforce_cancelled_is_terminal ON public.gm_orders;
CREATE TRIGGER tr_enforce_cancelled_is_terminal
BEFORE UPDATE ON public.gm_orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_enforce_cancelled_is_terminal();

-- ============================================================
-- 10. TRIGGER: Cash register fechado é final
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_enforce_closed_cash_is_final()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF OLD.status = 'closed' AND NEW.status = 'open' THEN
        RAISE EXCEPTION 'LEI VIOLADA: Caixa fechado não pode ser reaberto. Use "Abrir novo caixa". Cash register %.', OLD.id;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enforce_closed_cash_is_final ON public.cash_registers;
CREATE TRIGGER tr_enforce_closed_cash_is_final
BEFORE UPDATE ON public.cash_registers
FOR EACH ROW
EXECUTE FUNCTION public.fn_enforce_closed_cash_is_final();

-- ============================================================
-- 11. Verificação de integridade: Nenhum order pode ter
--     status=PAID sem payment correspondente
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_verify_paid_order_has_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Se acabou de virar PAID, deve existir payment
    IF NEW.status = 'PAID' AND (OLD.status IS NULL OR OLD.status != 'PAID') THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.gm_payments
            WHERE order_id = NEW.id
            AND status = 'paid'
        ) THEN
            RAISE EXCEPTION 'LEI VIOLADA: Order % não pode ter status PAID sem payment correspondente.', NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_verify_paid_order_has_payment ON public.gm_orders;
CREATE TRIGGER tr_verify_paid_order_has_payment
AFTER UPDATE ON public.gm_orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_verify_paid_order_has_payment();

COMMENT ON FUNCTION public.fn_verify_paid_order_has_payment IS 
'LEI FÍSICA: Nenhum order pode ter status PAID sem payment correspondente. Esta é a REGRA DE OURO.';
