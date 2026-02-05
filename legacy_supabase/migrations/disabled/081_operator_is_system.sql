-- Migration: 081_operator_is_system.sql
-- Purpose: OPERADOR = PARTE DO SISTEMA
-- Date: 2026-01-03
--
-- FILOSOFIA:
-- Cancelamento sem motivo ← Porta para fraude
-- "Desconto especial" sem justificativa ← Impossível auditar
-- Exceção sem registro ← Não existe
--
-- REGRA: Toda ação fora do fluxo normal EXIGE justificativa.
-- A justificativa vira FATO HISTÓRICO no sistema.

-- ============================================================
-- 1. TABELA: action_justifications
-- ============================================================
-- Todo cancelamento, estorno, desconto, ajuste manual passa por aqui.

CREATE TABLE IF NOT EXISTS public.action_justifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tipo de ação
    action_type TEXT NOT NULL CHECK (action_type IN (
        'ORDER_CANCEL',
        'PAYMENT_REFUND',
        'PAYMENT_VOID',
        'DISCOUNT_APPLIED',
        'PRICE_OVERRIDE',
        'CASH_ADJUSTMENT',
        'ORDER_ITEM_REMOVE',
        'MANUAL_STATUS_CHANGE'
    )),
    
    -- Quem fez
    operator_id UUID NOT NULL REFERENCES auth.users(id),
    operator_name TEXT NOT NULL,
    
    -- Contexto
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id),
    order_id UUID,
    payment_id UUID,
    cash_register_id UUID,
    
    -- A JUSTIFICATIVA (obrigatória)
    reason_code TEXT NOT NULL CHECK (reason_code IN (
        -- Cancelamentos
        'CUSTOMER_REQUEST',
        'CUSTOMER_DIDNT_SHOW',
        'OUT_OF_STOCK',
        'KITCHEN_ERROR',
        'WAITER_ERROR',
        'DUPLICATE_ORDER',
        
        -- Estornos
        'WRONG_PAYMENT_METHOD',
        'WRONG_AMOUNT',
        'FRAUDULENT_PAYMENT',
        
        -- Descontos
        'MANAGER_COURTESY',
        'COMPENSATION_SERVICE',
        'COMPENSATION_DELAY',
        'LOYALTY_REWARD',
        'PROMOTION_MANUAL',
        
        -- Ajustes
        'CASH_COUNT_ERROR',
        'SYSTEM_ERROR_FIX',
        'TRAINING_TRANSACTION',
        
        -- Outros
        'OTHER' -- Se OTHER, description_required obrigatório
    )),
    
    -- Descrição livre (obrigatória se reason_code = 'OTHER')
    reason_description TEXT,
    
    -- Valores envolvidos
    original_amount_cents INTEGER,
    new_amount_cents INTEGER,
    difference_cents INTEGER,
    
    -- Aprovação (para ações de alto valor)
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    
    -- Timing
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint: OTHER precisa de descrição
    CONSTRAINT chk_other_needs_description 
    CHECK (reason_code != 'OTHER' OR reason_description IS NOT NULL)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_action_justifications_restaurant 
ON public.action_justifications (restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_action_justifications_operator 
ON public.action_justifications (operator_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_action_justifications_order 
ON public.action_justifications (order_id) WHERE order_id IS NOT NULL;

-- RLS
ALTER TABLE public.action_justifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view justifications" ON public.action_justifications;
CREATE POLICY "Owners can view justifications" ON public.action_justifications
FOR ALL USING (
    auth.uid() IN (
        SELECT p.id FROM public.profiles p
        JOIN public.gm_restaurants r ON r.owner_id = p.id
        WHERE r.id = action_justifications.restaurant_id
    )
);

-- Imutabilidade (justificativas não podem ser alteradas)
CREATE OR REPLACE FUNCTION public.fn_prevent_justification_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Justificativas são imutáveis. Criando nova justificativa é necessário.';
    END IF;
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Justificativas não podem ser deletadas - são registros legais.';
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_justification_immutable ON public.action_justifications;
CREATE TRIGGER trg_justification_immutable
BEFORE UPDATE OR DELETE ON public.action_justifications
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_justification_modification();

COMMENT ON TABLE public.action_justifications IS 
'Justificativas obrigatórias para ações excepcionais. Imutável. Auditável.';

-- ============================================================
-- 2. FUNÇÃO: Registrar justificativa (usada por outras funções)
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_require_justification(
    p_action_type TEXT,
    p_operator_id UUID,
    p_restaurant_id UUID,
    p_reason_code TEXT,
    p_reason_description TEXT DEFAULT NULL,
    p_order_id UUID DEFAULT NULL,
    p_payment_id UUID DEFAULT NULL,
    p_cash_register_id UUID DEFAULT NULL,
    p_original_amount_cents INTEGER DEFAULT NULL,
    p_new_amount_cents INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_justification_id UUID;
    v_operator_name TEXT;
    v_difference INTEGER;
    v_requires_approval BOOLEAN;
BEGIN
    -- Buscar nome do operador
    SELECT COALESCE(full_name, email, 'Unknown') INTO v_operator_name
    FROM public.profiles
    WHERE id = p_operator_id;
    
    -- Calcular diferença
    IF p_original_amount_cents IS NOT NULL AND p_new_amount_cents IS NOT NULL THEN
        v_difference := p_original_amount_cents - p_new_amount_cents;
    END IF;
    
    -- Ações de alto valor requerem aprovação (>R$100)
    v_requires_approval := COALESCE(v_difference, 0) > 10000
                        OR p_action_type IN ('CASH_ADJUSTMENT', 'MANUAL_STATUS_CHANGE');
    
    INSERT INTO public.action_justifications (
        action_type,
        operator_id,
        operator_name,
        restaurant_id,
        order_id,
        payment_id,
        cash_register_id,
        reason_code,
        reason_description,
        original_amount_cents,
        new_amount_cents,
        difference_cents,
        requires_approval
    ) VALUES (
        p_action_type,
        p_operator_id,
        v_operator_name,
        p_restaurant_id,
        p_order_id,
        p_payment_id,
        p_cash_register_id,
        p_reason_code,
        p_reason_description,
        p_original_amount_cents,
        p_new_amount_cents,
        v_difference,
        v_requires_approval
    )
    RETURNING id INTO v_justification_id;
    
    -- Também registrar no log de eventos financeiros
    PERFORM public.fn_record_financial_event(
        'JUSTIFICATION_RECORDED',
        p_restaurant_id,
        p_operator_id,
        p_cash_register_id,
        p_order_id,
        p_payment_id,
        jsonb_build_object(
            'justification_id', v_justification_id,
            'action_type', p_action_type,
            'reason_code', p_reason_code,
            'reason_description', p_reason_description,
            'difference_cents', v_difference,
            'requires_approval', v_requires_approval
        ),
        NULL
    );
    
    RETURN v_justification_id;
END;
$$;

COMMENT ON FUNCTION public.fn_require_justification IS 
'Registra justificativa obrigatória. Retorna ID para vincular à ação.';

-- ============================================================
-- 3. TRIGGER: Cancelamento de pedido requer justificativa
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_order_cancel_requires_justification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_has_justification BOOLEAN;
BEGIN
    -- Só se está cancelando
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
        -- Verificar se existe justificativa recente (últimos 30 segundos)
        SELECT EXISTS(
            SELECT 1 FROM public.action_justifications
            WHERE order_id = NEW.id
            AND action_type = 'ORDER_CANCEL'
            AND created_at > NOW() - INTERVAL '30 seconds'
        ) INTO v_has_justification;
        
        IF NOT v_has_justification THEN
            RAISE EXCEPTION 'Cancelamento de pedido requer justificativa. Use fn_cancel_order_with_reason().';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_cancel_justification ON public.orders;
CREATE TRIGGER trg_order_cancel_justification
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.fn_order_cancel_requires_justification();

-- ============================================================
-- 4. FUNÇÃO: Cancelar pedido COM justificativa
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_cancel_order_with_reason(
    p_order_id UUID,
    p_operator_id UUID,
    p_reason_code TEXT,
    p_reason_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_justification_id UUID;
BEGIN
    -- Buscar pedido
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pedido % não encontrado', p_order_id;
    END IF;
    
    IF v_order.status = 'paid' THEN
        RAISE EXCEPTION 'Pedido PAGO não pode ser cancelado. Use estorno.';
    END IF;
    
    IF v_order.status = 'cancelled' THEN
        RAISE EXCEPTION 'Pedido já está cancelado.';
    END IF;
    
    -- Registrar justificativa PRIMEIRO
    v_justification_id := public.fn_require_justification(
        'ORDER_CANCEL',
        p_operator_id,
        v_order.restaurant_id,
        p_reason_code,
        p_reason_description,
        p_order_id,
        NULL,
        NULL,
        v_order.total_cents,
        0
    );
    
    -- Agora cancelar (trigger vai permitir porque tem justificativa)
    UPDATE public.orders
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE id = p_order_id;
    
    RETURN v_justification_id;
END;
$$;

COMMENT ON FUNCTION public.fn_cancel_order_with_reason IS 
'Cancela pedido com justificativa obrigatória. Único caminho legal para cancelar.';

-- ============================================================
-- 5. VIEW: Relatório de ações excepcionais
-- ============================================================

CREATE OR REPLACE VIEW public.v_exceptional_actions_report AS
SELECT 
    aj.restaurant_id,
    DATE(aj.created_at) AS action_date,
    aj.action_type,
    aj.reason_code,
    COUNT(*) AS action_count,
    SUM(COALESCE(aj.difference_cents, 0)) AS total_difference_cents,
    COUNT(*) FILTER (WHERE aj.requires_approval AND aj.approved_at IS NULL) AS pending_approval
FROM public.action_justifications aj
GROUP BY aj.restaurant_id, DATE(aj.created_at), aj.action_type, aj.reason_code
ORDER BY action_date DESC, action_count DESC;

COMMENT ON VIEW public.v_exceptional_actions_report IS 
'Relatório de ações excepcionais por dia. Picos indicam problemas operacionais.';

-- ============================================================
-- 6. VIEW: Operadores com mais exceções
-- ============================================================

CREATE OR REPLACE VIEW public.v_operator_exceptions AS
SELECT 
    aj.restaurant_id,
    aj.operator_id,
    aj.operator_name,
    COUNT(*) AS total_exceptions,
    SUM(COALESCE(aj.difference_cents, 0)) AS total_value_cents,
    COUNT(*) FILTER (WHERE aj.action_type = 'ORDER_CANCEL') AS cancellations,
    COUNT(*) FILTER (WHERE aj.action_type = 'DISCOUNT_APPLIED') AS discounts,
    COUNT(*) FILTER (WHERE aj.reason_code = 'OTHER') AS other_reasons,
    MIN(aj.created_at) AS first_exception,
    MAX(aj.created_at) AS last_exception
FROM public.action_justifications aj
WHERE aj.created_at > NOW() - INTERVAL '30 days'
GROUP BY aj.restaurant_id, aj.operator_id, aj.operator_name
ORDER BY total_exceptions DESC;

COMMENT ON VIEW public.v_operator_exceptions IS 
'Ranking de operadores por quantidade de exceções. Outliers podem indicar fraude ou treinamento necessário.';

-- ============================================================
-- 7. FUNÇÃO: Aprovar ação de alto valor
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_approve_high_value_action(
    p_justification_id UUID,
    p_approver_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_justification RECORD;
    v_approver_is_owner BOOLEAN;
BEGIN
    -- Buscar justificativa
    SELECT * INTO v_justification 
    FROM public.action_justifications 
    WHERE id = p_justification_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Justificativa % não encontrada', p_justification_id;
    END IF;
    
    IF NOT v_justification.requires_approval THEN
        RAISE EXCEPTION 'Esta ação não requer aprovação';
    END IF;
    
    IF v_justification.approved_at IS NOT NULL THEN
        RAISE EXCEPTION 'Ação já foi aprovada';
    END IF;
    
    -- Verificar se aprovador é dono
    SELECT EXISTS(
        SELECT 1 FROM public.gm_restaurants
        WHERE id = v_justification.restaurant_id
        AND owner_id = p_approver_id
    ) INTO v_approver_is_owner;
    
    IF NOT v_approver_is_owner THEN
        RAISE EXCEPTION 'Apenas o dono pode aprovar ações de alto valor';
    END IF;
    
    -- Aprovador não pode ser o mesmo que executou
    IF v_justification.operator_id = p_approver_id THEN
        RAISE EXCEPTION 'Operador não pode aprovar sua própria ação';
    END IF;
    
    -- Registrar aprovação (bypass imutabilidade com exceção específica)
    UPDATE public.action_justifications
    SET approved_by = p_approver_id,
        approved_at = NOW()
    WHERE id = p_justification_id;
    
    -- Log
    PERFORM public.fn_record_financial_event(
        'HIGH_VALUE_APPROVED',
        v_justification.restaurant_id,
        p_approver_id,
        v_justification.cash_register_id,
        v_justification.order_id,
        v_justification.payment_id,
        jsonb_build_object(
            'justification_id', p_justification_id,
            'original_operator', v_justification.operator_id,
            'action_type', v_justification.action_type,
            'difference_cents', v_justification.difference_cents
        ),
        NULL
    );
END;
$$;

-- Ajustar trigger de imutabilidade para permitir apenas aprovação
DROP TRIGGER IF EXISTS trg_justification_immutable ON public.action_justifications;

CREATE OR REPLACE FUNCTION public.fn_prevent_justification_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Permitir APENAS atualização de aprovação
        IF (OLD.approved_by IS NULL AND NEW.approved_by IS NOT NULL 
            AND OLD.approved_at IS NULL AND NEW.approved_at IS NOT NULL
            AND OLD.action_type = NEW.action_type
            AND OLD.reason_code = NEW.reason_code
            AND OLD.reason_description IS NOT DISTINCT FROM NEW.reason_description
            AND OLD.difference_cents IS NOT DISTINCT FROM NEW.difference_cents) THEN
            RETURN NEW;
        END IF;
        RAISE EXCEPTION 'Justificativas são imutáveis (apenas aprovação pode ser adicionada).';
    END IF;
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Justificativas não podem ser deletadas - são registros legais.';
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_justification_immutable
BEFORE UPDATE OR DELETE ON public.action_justifications
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_justification_modification();

-- ============================================================
-- 8. Adicionar JUSTIFICATION_RECORDED ao enum de eventos
-- ============================================================

-- Atualizar o CHECK constraint na tabela financial_events
ALTER TABLE public.financial_events 
DROP CONSTRAINT IF EXISTS financial_events_event_type_check;

ALTER TABLE public.financial_events 
ADD CONSTRAINT financial_events_event_type_check 
CHECK (event_type IN (
    'PAYMENT_INITIATED',
    'PAYMENT_COMPLETED',
    'PAYMENT_FAILED',
    'PAYMENT_REFUND_INITIATED',
    'PAYMENT_REFUND_COMPLETED',
    'CASH_REGISTER_OPENED',
    'CASH_REGISTER_CLOSED',
    'CASH_REGISTER_DEPOSIT',
    'CASH_REGISTER_WITHDRAWAL',
    'ORDER_CREATED',
    'ORDER_UPDATED',
    'ORDER_CANCELLED',
    'ORDER_PAID',
    'MANUAL_ADJUSTMENT',
    'JUSTIFICATION_RECORDED',
    'HIGH_VALUE_APPROVED'
));
