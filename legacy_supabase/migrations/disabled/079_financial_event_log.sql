-- Migration: 079_financial_event_log.sql
-- Purpose: TODO EVENTO FINANCEIRO É FATO HISTÓRICO
-- Date: 2026-01-03
-- 
-- FILOSOFIA:
-- Não confiamos em estado. Confiamos em eventos.
-- Nada se apaga. Nada se sobrescreve. Tudo reconstrói.
-- O estado atual é derivado dos eventos, não o contrário.
--
-- EVENT SOURCING PARA FINANÇAS:
-- - payment_attempted
-- - payment_succeeded
-- - payment_failed
-- - cash_opened
-- - cash_closed
-- - order_created
-- - order_status_changed
-- - order_cancelled
-- - refund_requested
-- - refund_completed

-- ============================================================
-- 1. TABELA: financial_events (append-only, imutável)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.financial_events (
    -- Identificação única
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_number BIGSERIAL NOT NULL, -- Ordem global garantida
    
    -- Tipo de evento (enum estrito)
    event_type TEXT NOT NULL CHECK (event_type IN (
        'PAYMENT_ATTEMPTED',
        'PAYMENT_SUCCEEDED',
        'PAYMENT_FAILED',
        'PAYMENT_TIMEOUT',
        'CASH_REGISTER_OPENED',
        'CASH_REGISTER_CLOSED',
        'ORDER_CREATED',
        'ORDER_ITEM_ADDED',
        'ORDER_ITEM_REMOVED',
        'ORDER_STATUS_CHANGED',
        'ORDER_CANCELLED',
        'ORDER_PAID',
        'REFUND_REQUESTED',
        'REFUND_COMPLETED',
        'REFUND_REJECTED',
        'SYSTEM_ERROR',
        'MANUAL_ADJUSTMENT'
    )),
    
    -- Contexto
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id),
    operator_id UUID REFERENCES auth.users(id),
    cash_register_id UUID REFERENCES public.cash_registers(id),
    
    -- Entidades afetadas (pode ser múltiplas)
    order_id UUID,
    payment_id UUID,
    
    -- Dados do evento (JSONB para flexibilidade)
    event_data JSONB NOT NULL DEFAULT '{}'::JSONB,
    
    -- Valores financeiros (para queries rápidas)
    amount_cents INTEGER, -- Positivo = entrada, Negativo = saída
    currency TEXT DEFAULT 'EUR',
    
    -- Causalidade
    caused_by_event_id UUID REFERENCES public.financial_events(id),
    idempotency_key TEXT, -- Para deduplicação
    
    -- Timestamp imutável
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Hash para integridade (opcional mas recomendado)
    event_hash TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_financial_events_restaurant 
ON public.financial_events (restaurant_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_financial_events_order 
ON public.financial_events (order_id) WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_financial_events_type 
ON public.financial_events (event_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_financial_events_sequence 
ON public.financial_events (sequence_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_events_idempotency 
ON public.financial_events (idempotency_key) WHERE idempotency_key IS NOT NULL;

-- RLS
ALTER TABLE public.financial_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can read financial events" ON public.financial_events;
CREATE POLICY "Owners can read financial events" ON public.financial_events
FOR SELECT USING (
    auth.uid() IN (
        SELECT p.id FROM public.profiles p
        JOIN public.gm_restaurants r ON r.owner_id = p.id
        WHERE r.id = financial_events.restaurant_id
    )
);

DROP POLICY IF EXISTS "System can insert financial events" ON public.financial_events;
CREATE POLICY "System can insert financial events" ON public.financial_events
FOR INSERT WITH CHECK (true);

-- ============================================================
-- 2. IMUTABILIDADE ABSOLUTA: Nenhum UPDATE, nenhum DELETE
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_financial_events_are_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RAISE EXCEPTION 'LEI VIOLADA: financial_events é append-only. Eventos históricos são imutáveis. Operação % bloqueada.', TG_OP;
END;
$$;

DROP TRIGGER IF EXISTS tr_financial_events_no_update ON public.financial_events;
CREATE TRIGGER tr_financial_events_no_update
BEFORE UPDATE ON public.financial_events
FOR EACH ROW
EXECUTE FUNCTION public.fn_financial_events_are_immutable();

DROP TRIGGER IF EXISTS tr_financial_events_no_delete ON public.financial_events;
CREATE TRIGGER tr_financial_events_no_delete
BEFORE DELETE ON public.financial_events
FOR EACH ROW
EXECUTE FUNCTION public.fn_financial_events_are_immutable();

COMMENT ON TABLE public.financial_events IS 
'Event log financeiro append-only. IMUTÁVEL. Todo evento financeiro é registrado aqui. Estado é derivado, não fonte.';

-- ============================================================
-- 3. FUNÇÃO: Registrar evento financeiro
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_record_financial_event(
    p_event_type TEXT,
    p_restaurant_id UUID,
    p_operator_id UUID DEFAULT NULL,
    p_cash_register_id UUID DEFAULT NULL,
    p_order_id UUID DEFAULT NULL,
    p_payment_id UUID DEFAULT NULL,
    p_event_data JSONB DEFAULT '{}'::JSONB,
    p_amount_cents INTEGER DEFAULT NULL,
    p_caused_by_event_id UUID DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO public.financial_events (
        event_type,
        restaurant_id,
        operator_id,
        cash_register_id,
        order_id,
        payment_id,
        event_data,
        amount_cents,
        caused_by_event_id,
        idempotency_key
    ) VALUES (
        p_event_type,
        p_restaurant_id,
        p_operator_id,
        p_cash_register_id,
        p_order_id,
        p_payment_id,
        p_event_data,
        p_amount_cents,
        p_caused_by_event_id,
        p_idempotency_key
    )
    ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL
    DO NOTHING -- Idempotência: se já existe, ignora
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$;

COMMENT ON FUNCTION public.fn_record_financial_event IS 
'Registra evento financeiro no log imutável. Suporta idempotência.';

-- ============================================================
-- 4. TRIGGERS AUTOMÁTICOS: Capturar eventos de outras tabelas
-- ============================================================

-- 4.1 Capturar criação de Order
CREATE OR REPLACE FUNCTION public.fn_capture_order_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM public.fn_record_financial_event(
        'ORDER_CREATED',
        NEW.restaurant_id,
        NEW.operator_id,
        NEW.cash_register_id,
        NEW.id,
        NULL,
        jsonb_build_object(
            'table_number', NEW.table_number,
            'total_cents', NEW.total_cents,
            'source', NEW.source
        ),
        NEW.total_cents
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_capture_order_created ON public.gm_orders;
CREATE TRIGGER tr_capture_order_created
AFTER INSERT ON public.gm_orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_capture_order_created();

-- 4.2 Capturar mudança de status de Order
CREATE OR REPLACE FUNCTION public.fn_capture_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF OLD.status != NEW.status THEN
        PERFORM public.fn_record_financial_event(
            CASE 
                WHEN NEW.status = 'PAID' THEN 'ORDER_PAID'
                WHEN NEW.status = 'CANCELLED' THEN 'ORDER_CANCELLED'
                ELSE 'ORDER_STATUS_CHANGED'
            END,
            NEW.restaurant_id,
            NEW.operator_id,
            NEW.cash_register_id,
            NEW.id,
            NULL,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'total_cents', NEW.total_cents
            ),
            CASE WHEN NEW.status = 'PAID' THEN NEW.total_cents ELSE NULL END
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_capture_order_status_change ON public.gm_orders;
CREATE TRIGGER tr_capture_order_status_change
AFTER UPDATE ON public.gm_orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_capture_order_status_change();

-- 4.3 Capturar criação de Payment
CREATE OR REPLACE FUNCTION public.fn_capture_payment_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_restaurant_id UUID;
    v_cash_register_id UUID;
BEGIN
    -- Buscar contexto do order
    SELECT restaurant_id, cash_register_id 
    INTO v_restaurant_id, v_cash_register_id
    FROM public.gm_orders WHERE id = NEW.order_id;
    
    PERFORM public.fn_record_financial_event(
        CASE 
            WHEN NEW.status = 'paid' THEN 'PAYMENT_SUCCEEDED'
            WHEN NEW.status = 'failed' THEN 'PAYMENT_FAILED'
            ELSE 'PAYMENT_ATTEMPTED'
        END,
        v_restaurant_id,
        (NEW.metadata->>'operator_id')::UUID,
        v_cash_register_id,
        NEW.order_id,
        NEW.id,
        jsonb_build_object(
            'method', NEW.method,
            'amount_cents', NEW.amount_cents,
            'currency', NEW.currency,
            'idempotency_key', NEW.idempotency_key
        ),
        NEW.amount_cents
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_capture_payment_created ON public.gm_payments;
CREATE TRIGGER tr_capture_payment_created
AFTER INSERT ON public.gm_payments
FOR EACH ROW
EXECUTE FUNCTION public.fn_capture_payment_created();

-- 4.4 Capturar abertura de caixa
CREATE OR REPLACE FUNCTION public.fn_capture_cash_register_opened()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.status = 'open' AND (OLD IS NULL OR OLD.status != 'open') THEN
        PERFORM public.fn_record_financial_event(
            'CASH_REGISTER_OPENED',
            NEW.restaurant_id,
            NEW.opened_by,
            NEW.id,
            NULL,
            NULL,
            jsonb_build_object(
                'opening_balance_cents', NEW.opening_balance_cents,
                'name', NEW.name
            ),
            NEW.opening_balance_cents
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_capture_cash_register_opened_insert ON public.cash_registers;
CREATE TRIGGER tr_capture_cash_register_opened_insert
AFTER INSERT ON public.cash_registers
FOR EACH ROW
EXECUTE FUNCTION public.fn_capture_cash_register_opened();

DROP TRIGGER IF EXISTS tr_capture_cash_register_opened_update ON public.cash_registers;
CREATE TRIGGER tr_capture_cash_register_opened_update
AFTER UPDATE ON public.cash_registers
FOR EACH ROW
EXECUTE FUNCTION public.fn_capture_cash_register_opened();

-- 4.5 Capturar fechamento de caixa
CREATE OR REPLACE FUNCTION public.fn_capture_cash_register_closed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.status = 'closed' AND OLD.status = 'open' THEN
        PERFORM public.fn_record_financial_event(
            'CASH_REGISTER_CLOSED',
            NEW.restaurant_id,
            NEW.closed_by,
            NEW.id,
            NULL,
            NULL,
            jsonb_build_object(
                'opening_balance_cents', NEW.opening_balance_cents,
                'closing_balance_cents', NEW.closing_balance_cents,
                'total_sales_cents', NEW.total_sales_cents,
                'difference_cents', COALESCE(NEW.closing_balance_cents, 0) - (COALESCE(NEW.opening_balance_cents, 0) + COALESCE(NEW.total_sales_cents, 0))
            ),
            NEW.closing_balance_cents
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_capture_cash_register_closed ON public.cash_registers;
CREATE TRIGGER tr_capture_cash_register_closed
AFTER UPDATE ON public.cash_registers
FOR EACH ROW
EXECUTE FUNCTION public.fn_capture_cash_register_closed();

-- ============================================================
-- 5. VIEW: Reconstruir estado a partir de eventos
-- ============================================================

CREATE OR REPLACE VIEW public.v_reconstructed_daily_totals AS
SELECT 
    restaurant_id,
    DATE(occurred_at) AS business_date,
    COUNT(*) FILTER (WHERE event_type = 'ORDER_CREATED') AS orders_created,
    COUNT(*) FILTER (WHERE event_type = 'ORDER_PAID') AS orders_paid,
    COUNT(*) FILTER (WHERE event_type = 'ORDER_CANCELLED') AS orders_cancelled,
    COUNT(*) FILTER (WHERE event_type = 'PAYMENT_SUCCEEDED') AS payments_succeeded,
    COUNT(*) FILTER (WHERE event_type = 'PAYMENT_FAILED') AS payments_failed,
    COALESCE(SUM(amount_cents) FILTER (WHERE event_type = 'PAYMENT_SUCCEEDED'), 0) AS total_revenue_cents,
    COUNT(*) FILTER (WHERE event_type = 'CASH_REGISTER_OPENED') AS cash_opens,
    COUNT(*) FILTER (WHERE event_type = 'CASH_REGISTER_CLOSED') AS cash_closes
FROM public.financial_events
GROUP BY restaurant_id, DATE(occurred_at);

COMMENT ON VIEW public.v_reconstructed_daily_totals IS 
'Estado reconstruído a partir de eventos. Esta é a fonte de verdade derivada.';

-- ============================================================
-- 6. FUNÇÃO: Reconstruir estado de um order a partir de eventos
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_reconstruct_order_state(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'order_id', p_order_id,
        'events', jsonb_agg(
            jsonb_build_object(
                'sequence', sequence_number,
                'type', event_type,
                'occurred_at', occurred_at,
                'data', event_data,
                'amount_cents', amount_cents
            ) ORDER BY sequence_number
        ),
        'total_events', COUNT(*),
        'first_event', MIN(occurred_at),
        'last_event', MAX(occurred_at),
        'final_amount_cents', SUM(CASE WHEN event_type = 'PAYMENT_SUCCEEDED' THEN amount_cents ELSE 0 END),
        'is_paid', EXISTS(SELECT 1 FROM public.financial_events WHERE order_id = p_order_id AND event_type = 'ORDER_PAID'),
        'is_cancelled', EXISTS(SELECT 1 FROM public.financial_events WHERE order_id = p_order_id AND event_type = 'ORDER_CANCELLED')
    ) INTO v_result
    FROM public.financial_events
    WHERE order_id = p_order_id;
    
    RETURN COALESCE(v_result, jsonb_build_object('order_id', p_order_id, 'events', '[]'::JSONB, 'total_events', 0));
END;
$$;

COMMENT ON FUNCTION public.fn_reconstruct_order_state IS 
'Reconstruir estado completo de um order a partir de seus eventos. Responde: "O que aconteceu com este pedido?"';
