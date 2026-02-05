-- Migration: 072_payment_security.sql
-- Purpose: Proteção crítica contra double payment e replay attacks
-- Date: 2025-01-27
-- 
-- BLOQUEADORES CRÍTICOS:
-- 1. Unique constraint para prevenir double payment
-- 2. Idempotency key para prevenir replay attacks
-- 3. Atualizar função SQL para verificar idempotency
-- 1. UNIQUE CONSTRAINT: Apenas 1 payment 'paid' por order
-- Changed to Unique Index to support WHERE clause (Partial Index) safely
CREATE UNIQUE INDEX IF NOT EXISTS uq_one_paid_payment_per_order ON public.gm_payments (order_id)
WHERE status = 'paid';
-- 2. IDEMPOTENCY KEY: Prevenir replay attacks
ALTER TABLE public.gm_payments
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
-- Index para performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency_key ON public.gm_payments(idempotency_key)
WHERE idempotency_key IS NOT NULL;
-- 3. ATUALIZAR FUNÇÃO: process_order_payment com idempotency
-- Drop old signature (from 071) to handle signature change cleanly
DROP FUNCTION IF EXISTS public.process_order_payment(UUID, UUID, TEXT, INTEGER, UUID);
CREATE OR REPLACE FUNCTION public.process_order_payment(
        p_order_id UUID,
        p_restaurant_id UUID,
        p_method TEXT,
        p_amount_cents INTEGER,
        p_operator_id UUID DEFAULT NULL,
        p_idempotency_key TEXT DEFAULT NULL
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_order_status TEXT;
v_order_payment_status TEXT;
v_order_total_cents INTEGER;
v_cash_register_id UUID;
v_payment_id UUID;
v_result JSONB;
v_existing_payment_id UUID;
BEGIN -- IDEMPOTENCY CHECK: Verificar se já foi processado com mesma key
IF p_idempotency_key IS NOT NULL THEN
SELECT id INTO v_existing_payment_id
FROM public.gm_payments
WHERE idempotency_key = p_idempotency_key;
IF v_existing_payment_id IS NOT NULL THEN -- Já foi processado, retornar sucesso idempotente
RETURN jsonb_build_object(
    'success',
    true,
    'already_processed',
    true,
    'payment_id',
    v_existing_payment_id,
    'order_id',
    p_order_id
);
END IF;
END IF;
-- VALIDAÇÃO 1: Verificar se pedido existe e pertence ao restaurante
-- SELECT FOR UPDATE: Lock pessimista para prevenir pagamento duplo por double-click
SELECT status,
    payment_status,
    total_cents,
    cash_register_id INTO v_order_status,
    v_order_payment_status,
    v_order_total_cents,
    v_cash_register_id
FROM public.gm_orders
WHERE id = p_order_id
    AND restaurant_id = p_restaurant_id FOR
UPDATE;
-- Lock pessimista: previne pagamento duplo simultâneo
IF NOT FOUND THEN RAISE EXCEPTION 'Order not found or does not belong to restaurant';
END IF;
-- VALIDAÇÃO 2: Verificar se pedido não está cancelado
IF v_order_status = 'CANCELLED' THEN RAISE EXCEPTION 'Cannot pay a cancelled order';
END IF;
-- VALIDAÇÃO 3: Verificar se pedido não está já pago
-- DOUBLE-CHECK: Verificar se já existe payment (proteção extra)
SELECT id INTO v_existing_payment_id
FROM public.gm_payments
WHERE order_id = p_order_id
    AND status = 'paid'
LIMIT 1;
IF v_existing_payment_id IS NOT NULL THEN -- Payment já existe (unique constraint também protege, mas retornar info)
RETURN jsonb_build_object(
    'success',
    true,
    'already_processed',
    true,
    'payment_id',
    v_existing_payment_id,
    'order_id',
    p_order_id
);
END IF;
IF v_order_payment_status = 'PAID' THEN RAISE EXCEPTION 'Order is already paid';
END IF;
-- VALIDAÇÃO 4: Verificar se pedido está em estado válido para pagamento
IF v_order_status NOT IN ('OPEN', 'IN_PREP', 'READY') THEN RAISE EXCEPTION 'Order status (%) is not valid for payment',
v_order_status;
END IF;
-- VALIDAÇÃO 5: Verificar se valor do pagamento corresponde ao total
-- DECISÃO DE PRODUTO: Pagamentos parciais ainda não suportados
-- Se quiser permitir split payment no futuro, remover esta validação
IF p_amount_cents != v_order_total_cents THEN RAISE EXCEPTION 'Payment amount (%) must equal order total (%). Partial payments not supported yet.',
p_amount_cents,
v_order_total_cents;
END IF;
-- VALIDAÇÃO 6: Verificar se método de pagamento é válido
IF p_method NOT IN ('cash', 'card', 'pix') THEN RAISE EXCEPTION 'Invalid payment method: %',
p_method;
END IF;
-- VALIDAÇÃO 7: Verificar se pedido tem itens (não pode ser vazio)
IF NOT EXISTS (
    SELECT 1
    FROM public.gm_order_items
    WHERE order_id = p_order_id
) THEN RAISE EXCEPTION 'Cannot pay an empty order';
END IF;
-- TRANSAÇÃO ATÔMICA: Tudo acontece aqui
-- PostgreSQL executa funções em transação implícita
-- Qualquer erro = ROLLBACK automático
-- 1. Criar pagamento
v_payment_id := gen_random_uuid();
INSERT INTO public.gm_payments (
        id,
        tenant_id,
        order_id,
        amount_cents,
        currency,
        method,
        status,
        idempotency_key,
        metadata
    )
VALUES (
        v_payment_id,
        p_restaurant_id,
        p_order_id,
        p_amount_cents,
        'EUR',
        p_method,
        'paid',
        p_idempotency_key,
        jsonb_build_object(
            'operator_id',
            p_operator_id,
            'processed_at',
            NOW()
        )
    );
-- 2. Atualizar status do pedido (PAID + fechar)
-- IMPORTANTE: O trigger tr_process_payment (032_sovereign_tpv.sql) também atualiza,
-- mas garantimos aqui na mesma transação para atomicidade completa
UPDATE public.gm_orders
SET payment_status = 'PAID',
    status = 'PAID',
    -- Fechar pedido (HARD RULE: pagar = fechar)
    updated_at = NOW()
WHERE id = p_order_id
    AND restaurant_id = p_restaurant_id;
-- 3. Verificar se atualização foi bem-sucedida
IF NOT FOUND THEN RAISE EXCEPTION 'Failed to update order status';
END IF;
-- 4. Verificar se pedido realmente foi atualizado (double-check)
SELECT status,
    payment_status INTO v_order_status,
    v_order_payment_status
FROM public.gm_orders
WHERE id = p_order_id;
IF v_order_status != 'PAID'
OR v_order_payment_status != 'PAID' THEN RAISE EXCEPTION 'Order status update verification failed';
END IF;
-- 5. Retornar resultado
v_result := jsonb_build_object(
    'success',
    true,
    'payment_id',
    v_payment_id,
    'order_id',
    p_order_id,
    'amount_cents',
    p_amount_cents,
    'method',
    p_method,
    'status',
    'paid'
);
RETURN v_result;
END;
$$;
-- Comentário
COMMENT ON FUNCTION public.process_order_payment IS 'Transação atômica de pagamento com proteção contra double payment e replay attacks. REGRA DE OURO: Nenhum pagamento sem pedido fechado, nenhum pedido fechado sem pagamento.';