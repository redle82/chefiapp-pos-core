-- Migration: 080_failure_is_first_class.sql
-- Purpose: FALHA ≠ ERRO - Falha é primeira classe no sistema
-- Date: 2026-01-03
-- 
-- FILOSOFIA:
-- "Se deu erro, aborta e segue" ← ERRADO
-- "Se deu erro, registra, trava e pede decisão" ← CORRETO
--
-- O sistema deve ser capaz de responder:
-- "Este pagamento tentou acontecer, falhou por X, não gerou dinheiro, e o estado é este."
--
-- Sem achismo. Sem inferência. Só fatos.

-- ============================================================
-- 1. TABELA: pending_transactions
-- ============================================================
-- Toda operação financeira crítica passa por "pending" primeiro.
-- Se algo der errado, sabemos exatamente onde parou.

CREATE TABLE IF NOT EXISTS public.pending_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tipo de transação
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'PAYMENT',
        'REFUND',
        'CASH_OPEN',
        'CASH_CLOSE',
        'ORDER_CANCEL'
    )),
    
    -- Estado explícito
    status TEXT NOT NULL DEFAULT 'INITIATED' CHECK (status IN (
        'INITIATED',     -- Transação começou
        'PROCESSING',    -- Em processamento (lock obtido)
        'COMPLETED',     -- Sucesso
        'FAILED',        -- Falhou com erro conhecido
        'TIMEOUT',       -- Timeout (estado desconhecido)
        'ROLLBACK',      -- Revertido
        'ORPHANED'       -- Abandonado (precisa investigação)
    )),
    
    -- Contexto
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id),
    operator_id UUID REFERENCES auth.users(id),
    cash_register_id UUID REFERENCES public.cash_registers(id),
    order_id UUID,
    
    -- Dados da transação
    amount_cents INTEGER,
    method TEXT,
    request_data JSONB NOT NULL DEFAULT '{}'::JSONB,
    
    -- Resultado
    result_data JSONB, -- Preenchido quando termina
    error_code TEXT,
    error_message TEXT,
    
    -- Idempotência
    idempotency_key TEXT UNIQUE,
    
    -- IDs de entidades criadas (para rollback se necessário)
    created_payment_id UUID,
    created_event_ids UUID[] DEFAULT '{}',
    
    -- Timing
    initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processing_started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Timeout (para detectar transações abandonadas)
    timeout_at TIMESTAMPTZ, -- Se passou disso e ainda está PROCESSING, virou ORPHANED
    
    -- Investigação
    investigated_at TIMESTAMPTZ,
    investigated_by UUID REFERENCES auth.users(id),
    investigation_notes TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pending_transactions_status 
ON public.pending_transactions (status, initiated_at DESC);

CREATE INDEX IF NOT EXISTS idx_pending_transactions_restaurant 
ON public.pending_transactions (restaurant_id, initiated_at DESC);

CREATE INDEX IF NOT EXISTS idx_pending_transactions_orphaned 
ON public.pending_transactions (status, timeout_at)
WHERE status IN ('INITIATED', 'PROCESSING');

-- RLS
ALTER TABLE public.pending_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view pending transactions" ON public.pending_transactions;
CREATE POLICY "Owners can view pending transactions" ON public.pending_transactions
FOR ALL USING (
    auth.uid() IN (
        SELECT p.id FROM public.profiles p
        JOIN public.gm_restaurants r ON r.owner_id = p.id
        WHERE r.id = pending_transactions.restaurant_id
    )
);

COMMENT ON TABLE public.pending_transactions IS 
'Registro de transações em andamento. Permite saber exatamente onde cada operação parou em caso de falha.';

-- ============================================================
-- 2. FUNÇÕES: Ciclo de vida de transação
-- ============================================================

-- 2.1 Iniciar transação
CREATE OR REPLACE FUNCTION public.fn_begin_transaction(
    p_type TEXT,
    p_restaurant_id UUID,
    p_operator_id UUID,
    p_order_id UUID DEFAULT NULL,
    p_amount_cents INTEGER DEFAULT NULL,
    p_method TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL,
    p_request_data JSONB DEFAULT '{}'::JSONB,
    p_timeout_seconds INTEGER DEFAULT 30
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tx_id UUID;
    v_cash_register_id UUID;
BEGIN
    -- Buscar caixa aberto
    SELECT id INTO v_cash_register_id
    FROM public.cash_registers
    WHERE restaurant_id = p_restaurant_id AND status = 'open'
    LIMIT 1;
    
    INSERT INTO public.pending_transactions (
        transaction_type,
        restaurant_id,
        operator_id,
        cash_register_id,
        order_id,
        amount_cents,
        method,
        request_data,
        idempotency_key,
        timeout_at,
        status
    ) VALUES (
        p_type,
        p_restaurant_id,
        p_operator_id,
        v_cash_register_id,
        p_order_id,
        p_amount_cents,
        p_method,
        p_request_data,
        p_idempotency_key,
        NOW() + (p_timeout_seconds || ' seconds')::INTERVAL,
        'INITIATED'
    )
    RETURNING id INTO v_tx_id;
    
    RETURN v_tx_id;
END;
$$;

-- 2.2 Marcar como processando
CREATE OR REPLACE FUNCTION public.fn_mark_transaction_processing(p_tx_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.pending_transactions
    SET status = 'PROCESSING',
        processing_started_at = NOW()
    WHERE id = p_tx_id
    AND status = 'INITIATED';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction % not found or not in INITIATED state', p_tx_id;
    END IF;
END;
$$;

-- 2.3 Completar transação com sucesso
CREATE OR REPLACE FUNCTION public.fn_complete_transaction(
    p_tx_id UUID,
    p_result_data JSONB DEFAULT '{}'::JSONB,
    p_payment_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.pending_transactions
    SET status = 'COMPLETED',
        completed_at = NOW(),
        result_data = p_result_data,
        created_payment_id = p_payment_id
    WHERE id = p_tx_id
    AND status = 'PROCESSING';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction % not found or not in PROCESSING state', p_tx_id;
    END IF;
END;
$$;

-- 2.4 Falhar transação
CREATE OR REPLACE FUNCTION public.fn_fail_transaction(
    p_tx_id UUID,
    p_error_code TEXT,
    p_error_message TEXT,
    p_result_data JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.pending_transactions
    SET status = 'FAILED',
        completed_at = NOW(),
        error_code = p_error_code,
        error_message = p_error_message,
        result_data = p_result_data
    WHERE id = p_tx_id
    AND status IN ('INITIATED', 'PROCESSING');
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction % not found or in terminal state', p_tx_id;
    END IF;
END;
$$;

-- 2.5 Timeout transação
CREATE OR REPLACE FUNCTION public.fn_timeout_transaction(p_tx_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.pending_transactions
    SET status = 'TIMEOUT',
        completed_at = NOW(),
        error_code = 'TIMEOUT',
        error_message = 'Transaction exceeded timeout without completion'
    WHERE id = p_tx_id
    AND status IN ('INITIATED', 'PROCESSING');
END;
$$;

-- ============================================================
-- 3. JOB: Detectar transações órfãs (executar periodicamente)
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_detect_orphaned_transactions()
RETURNS TABLE(
    tx_id UUID,
    transaction_type TEXT,
    restaurant_id UUID,
    order_id UUID,
    amount_cents INTEGER,
    initiated_at TIMESTAMPTZ,
    timeout_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Marcar como ORPHANED transações que passaram do timeout
    UPDATE public.pending_transactions
    SET status = 'ORPHANED'
    WHERE status IN ('INITIATED', 'PROCESSING')
    AND timeout_at < NOW();
    
    -- Retornar transações órfãs para investigação
    RETURN QUERY
    SELECT 
        pt.id AS tx_id,
        pt.transaction_type,
        pt.restaurant_id,
        pt.order_id,
        pt.amount_cents,
        pt.initiated_at,
        pt.timeout_at
    FROM public.pending_transactions pt
    WHERE pt.status = 'ORPHANED'
    AND pt.investigated_at IS NULL
    ORDER BY pt.initiated_at DESC;
END;
$$;

COMMENT ON FUNCTION public.fn_detect_orphaned_transactions IS 
'Detecta transações que foram abandonadas. CRÍTICO: Estas precisam de investigação manual.';

-- ============================================================
-- 4. VIEW: Dashboard de saúde transacional
-- ============================================================

CREATE OR REPLACE VIEW public.v_transaction_health AS
SELECT 
    restaurant_id,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_24h,
    COUNT(*) FILTER (WHERE status = 'FAILED') AS failed_24h,
    COUNT(*) FILTER (WHERE status = 'TIMEOUT') AS timeout_24h,
    COUNT(*) FILTER (WHERE status = 'ORPHANED') AS orphaned_total,
    COUNT(*) FILTER (WHERE status IN ('INITIATED', 'PROCESSING')) AS in_progress,
    ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - initiated_at)) * 1000) 
          FILTER (WHERE status = 'COMPLETED'), 0) AS avg_duration_ms,
    MAX(initiated_at) FILTER (WHERE status = 'ORPHANED' AND investigated_at IS NULL) AS oldest_uninvestigated_orphan
FROM public.pending_transactions
WHERE initiated_at > NOW() - INTERVAL '24 hours'
   OR status IN ('ORPHANED', 'INITIATED', 'PROCESSING')
GROUP BY restaurant_id;

COMMENT ON VIEW public.v_transaction_health IS 
'Saúde transacional. orphaned_total > 0 requer atenção imediata.';

-- ============================================================
-- 5. FUNÇÃO: Investigar transação órfã
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_investigate_orphaned_transaction(
    p_tx_id UUID,
    p_investigator_id UUID,
    p_notes TEXT,
    p_resolution TEXT -- 'CONFIRMED_FAILED', 'CONFIRMED_SUCCESS', 'NEEDS_REFUND', 'MANUAL_FIX'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.pending_transactions
    SET investigated_at = NOW(),
        investigated_by = p_investigator_id,
        investigation_notes = p_notes,
        result_data = COALESCE(result_data, '{}'::JSONB) || jsonb_build_object(
            'resolution', p_resolution,
            'investigated_at', NOW(),
            'investigated_by', p_investigator_id
        )
    WHERE id = p_tx_id
    AND status = 'ORPHANED';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction % not found or not orphaned', p_tx_id;
    END IF;
    
    -- Registrar evento de investigação
    PERFORM public.fn_record_financial_event(
        'MANUAL_ADJUSTMENT',
        (SELECT restaurant_id FROM public.pending_transactions WHERE id = p_tx_id),
        p_investigator_id,
        NULL,
        (SELECT order_id FROM public.pending_transactions WHERE id = p_tx_id),
        NULL,
        jsonb_build_object(
            'transaction_id', p_tx_id,
            'resolution', p_resolution,
            'notes', p_notes
        ),
        NULL
    );
END;
$$;

COMMENT ON FUNCTION public.fn_investigate_orphaned_transaction IS 
'Registra investigação de transação órfã. Toda resolução fica no log.';
