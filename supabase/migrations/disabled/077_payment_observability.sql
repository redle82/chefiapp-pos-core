-- Migration: 077_payment_observability.sql
-- Purpose: Observabilidade financeira (PILAR 3 do 99,99%)
-- Date: 2026-01-03
-- 
-- O QUE ISSO RESOLVE:
-- 1. Ver padrões de falha ANTES do desastre
-- 2. Auditoria completa de tentativas de pagamento
-- 3. Métricas de saúde financeira em tempo real
--
-- REGRA: "O sistema pode falhar, mas nunca mentir sobre dinheiro"

-- ============================================================
-- 1. TABELA: payment_attempts (append-only log)
-- ============================================================
-- Toda tentativa de pagamento é registrada, sucesso ou falha.
-- Esta tabela é SOMENTE ESCRITA - nunca atualizada ou deletada.

CREATE TABLE IF NOT EXISTS public.payment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Contexto da tentativa
    order_id UUID NOT NULL,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id),
    operator_id UUID REFERENCES auth.users(id),
    cash_register_id UUID REFERENCES public.cash_registers(id),
    
    -- Dados da tentativa
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    method TEXT NOT NULL CHECK (method IN ('cash', 'card', 'pix')),
    
    -- Resultado
    result TEXT NOT NULL CHECK (result IN ('success', 'fail', 'timeout', 'cancelled')),
    error_code TEXT, -- NULL se sucesso
    error_message TEXT, -- Detalhes do erro
    
    -- Idempotência (para correlacionar com payment final)
    idempotency_key TEXT,
    payment_id UUID, -- Preenchido apenas se result='success'
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER, -- Tempo de processamento
    
    -- Metadados
    client_info JSONB DEFAULT '{}'::JSONB, -- User agent, IP, etc.
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index para queries de métricas
CREATE INDEX IF NOT EXISTS idx_payment_attempts_restaurant_date 
ON public.payment_attempts (restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_result 
ON public.payment_attempts (result, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_order 
ON public.payment_attempts (order_id);

-- RLS
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view payment attempts" ON public.payment_attempts;
CREATE POLICY "Owners can view payment attempts" ON public.payment_attempts
FOR SELECT USING (
    auth.uid() IN (
        SELECT p.id FROM public.profiles p
        JOIN public.gm_restaurants r ON r.owner_id = p.id
        WHERE r.id = payment_attempts.restaurant_id
    )
);

DROP POLICY IF EXISTS "System can insert payment attempts" ON public.payment_attempts;
CREATE POLICY "System can insert payment attempts" ON public.payment_attempts
FOR INSERT WITH CHECK (true);

-- IMUTABILIDADE: Prevenir UPDATE e DELETE
CREATE OR REPLACE FUNCTION public.fn_prevent_payment_attempt_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RAISE EXCEPTION 'payment_attempts é append-only. Registros não podem ser modificados ou deletados.';
END;
$$;

DROP TRIGGER IF EXISTS tr_prevent_payment_attempt_update ON public.payment_attempts;
CREATE TRIGGER tr_prevent_payment_attempt_update
BEFORE UPDATE ON public.payment_attempts
FOR EACH ROW
EXECUTE FUNCTION public.fn_prevent_payment_attempt_mutation();

DROP TRIGGER IF EXISTS tr_prevent_payment_attempt_delete ON public.payment_attempts;
CREATE TRIGGER tr_prevent_payment_attempt_delete
BEFORE DELETE ON public.payment_attempts
FOR EACH ROW
EXECUTE FUNCTION public.fn_prevent_payment_attempt_mutation();

COMMENT ON TABLE public.payment_attempts IS 
'Log append-only de todas as tentativas de pagamento. Imutável para auditoria.';

-- ============================================================
-- 2. FUNÇÃO: Registrar tentativa de pagamento
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_log_payment_attempt(
    p_order_id UUID,
    p_restaurant_id UUID,
    p_operator_id UUID,
    p_amount_cents INTEGER,
    p_method TEXT,
    p_result TEXT,
    p_error_code TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL,
    p_payment_id UUID DEFAULT NULL,
    p_duration_ms INTEGER DEFAULT NULL,
    p_client_info JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attempt_id UUID;
    v_cash_register_id UUID;
BEGIN
    -- Buscar caixa aberto atual
    SELECT id INTO v_cash_register_id
    FROM public.cash_registers
    WHERE restaurant_id = p_restaurant_id AND status = 'open'
    LIMIT 1;
    
    INSERT INTO public.payment_attempts (
        order_id,
        restaurant_id,
        operator_id,
        cash_register_id,
        amount_cents,
        method,
        result,
        error_code,
        error_message,
        idempotency_key,
        payment_id,
        duration_ms,
        completed_at,
        client_info
    ) VALUES (
        p_order_id,
        p_restaurant_id,
        p_operator_id,
        v_cash_register_id,
        p_amount_cents,
        p_method,
        p_result,
        p_error_code,
        p_error_message,
        p_idempotency_key,
        p_payment_id,
        p_duration_ms,
        NOW(),
        p_client_info
    )
    RETURNING id INTO v_attempt_id;
    
    RETURN v_attempt_id;
END;
$$;

COMMENT ON FUNCTION public.fn_log_payment_attempt IS 
'Registra tentativa de pagamento no log append-only. Usar sempre, sucesso ou falha.';

-- ============================================================
-- 3. VIEW: Métricas de saúde financeira
-- ============================================================

CREATE OR REPLACE VIEW public.v_payment_health_metrics AS
SELECT 
    restaurant_id,
    
    -- Últimas 24 horas
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') AS attempts_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours' AND result = 'success') AS success_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours' AND result = 'fail') AS fail_24h,
    
    -- Taxa de sucesso
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours' AND result = 'success') /
        NULLIF(COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours'), 0),
        2
    ) AS success_rate_24h,
    
    -- Tempo médio de processamento
    ROUND(AVG(duration_ms) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours'), 0) AS avg_duration_ms_24h,
    
    -- Erros mais comuns
    MODE() WITHIN GROUP (ORDER BY error_code) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours' AND result = 'fail') AS most_common_error_24h,
    
    -- Total processado (apenas sucesso)
    COALESCE(SUM(amount_cents) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours' AND result = 'success'), 0) AS total_processed_cents_24h

FROM public.payment_attempts
GROUP BY restaurant_id;

COMMENT ON VIEW public.v_payment_health_metrics IS 
'Métricas de saúde financeira por restaurante. Os 3 números que importam: taxa sucesso, tempo médio, erros.';

-- ============================================================
-- 4. VIEW: Alertas de saúde (para monitoramento)
-- ============================================================

CREATE OR REPLACE VIEW public.v_payment_health_alerts AS
SELECT 
    restaurant_id,
    CASE 
        WHEN success_rate_24h < 90 THEN 'CRITICAL'
        WHEN success_rate_24h < 95 THEN 'WARNING'
        ELSE 'OK'
    END AS health_status,
    success_rate_24h,
    fail_24h,
    avg_duration_ms_24h,
    most_common_error_24h,
    CASE 
        WHEN success_rate_24h < 90 THEN 'Taxa de sucesso abaixo de 90%. Verificar imediatamente.'
        WHEN success_rate_24h < 95 THEN 'Taxa de sucesso abaixo de 95%. Monitorar.'
        WHEN avg_duration_ms_24h > 5000 THEN 'Tempo médio de processamento alto (>5s). Verificar conexão.'
        WHEN fail_24h > 10 THEN 'Mais de 10 falhas nas últimas 24h. Revisar logs.'
        ELSE 'Sistema saudável.'
    END AS alert_message
FROM public.v_payment_health_metrics
WHERE attempts_24h > 0;

COMMENT ON VIEW public.v_payment_health_alerts IS 
'Alertas automáticos de saúde do sistema de pagamentos.';

-- ============================================================
-- 5. FUNÇÃO RPC: Obter métricas (para dashboard)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_payment_health(p_restaurant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'restaurant_id', restaurant_id,
        'attempts_24h', attempts_24h,
        'success_24h', success_24h,
        'fail_24h', fail_24h,
        'success_rate', success_rate_24h,
        'avg_duration_ms', avg_duration_ms_24h,
        'total_processed_cents', total_processed_cents_24h,
        'most_common_error', most_common_error_24h
    ) INTO v_result
    FROM public.v_payment_health_metrics
    WHERE restaurant_id = p_restaurant_id;
    
    -- Se não há dados, retornar defaults
    IF v_result IS NULL THEN
        v_result := jsonb_build_object(
            'restaurant_id', p_restaurant_id,
            'attempts_24h', 0,
            'success_24h', 0,
            'fail_24h', 0,
            'success_rate', 100,
            'avg_duration_ms', 0,
            'total_processed_cents', 0,
            'most_common_error', null
        );
    END IF;
    
    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_payment_health IS 
'Retorna métricas de saúde de pagamentos para um restaurante. Usar no dashboard.';
