-- 20260120000002_create_fiscal_queue.sql
-- SPRINT 1 - Tarefa 1.1: Fila Durável de Emissão Fiscal
-- 
-- Objetivo: Criar fila durável para processar emissões fiscais no backend
-- 
-- Características:
-- - Fila durável (sobrevive a restart)
-- - Retry automático com backoff exponencial
-- - Auditoria imutável de tentativas
-- - Status tracking (pending, processing, completed, failed)

-- 1. Criar tabela de fila fiscal
CREATE TABLE IF NOT EXISTS public.gm_fiscal_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.gm_orders(id) ON DELETE CASCADE,
    
    -- Dados do pedido (snapshot no momento da criação)
    order_data JSONB NOT NULL,
    payment_data JSONB NOT NULL,
    
    -- Status da fila
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
    
    -- Retry tracking
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 10, -- TASK-2.2.1: Máximo 10 tentativas
    next_retry_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    last_error_at TIMESTAMP WITH TIME ZONE,
    error_history JSONB DEFAULT '[]'::jsonb, -- TASK-2.2.2: Histórico de erros [{timestamp, error, attempt}]
    
    -- Resultado (após processamento)
    result JSONB,
    fiscal_document_id UUID,
    
    -- Idempotência
    idempotency_key TEXT UNIQUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_fiscal_queue_status ON public.gm_fiscal_queue(status, next_retry_at) WHERE status IN ('pending', 'retrying');
CREATE INDEX IF NOT EXISTS idx_fiscal_queue_restaurant ON public.gm_fiscal_queue(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fiscal_queue_order ON public.gm_fiscal_queue(order_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_queue_idempotency ON public.gm_fiscal_queue(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 3. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_fiscal_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_fiscal_queue_updated_at
    BEFORE UPDATE ON public.gm_fiscal_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_fiscal_queue_updated_at();

-- 4. RLS (Row Level Security)
ALTER TABLE public.gm_fiscal_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for internal users" ON public.gm_fiscal_queue
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id
            FROM public.gm_restaurant_members
            WHERE restaurant_id = gm_fiscal_queue.restaurant_id
        )
    );

CREATE POLICY "Enable insert access for internal users" ON public.gm_fiscal_queue
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id
            FROM public.gm_restaurant_members
            WHERE restaurant_id = gm_fiscal_queue.restaurant_id
        )
    );

CREATE POLICY "Enable update access for internal users" ON public.gm_fiscal_queue
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id
            FROM public.gm_restaurant_members
            WHERE restaurant_id = gm_fiscal_queue.restaurant_id
        )
    );

-- 5. RPC: Adicionar item à fila fiscal
CREATE OR REPLACE FUNCTION public.add_to_fiscal_queue(
    p_restaurant_id UUID,
    p_order_id UUID,
    p_order_data JSONB,
    p_payment_data JSONB,
    p_idempotency_key TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_queue_id UUID;
    v_existing_id UUID;
BEGIN
    -- Verificar idempotência (se idempotency_key fornecido)
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_existing_id
        FROM public.gm_fiscal_queue
        WHERE idempotency_key = p_idempotency_key;
        
        IF v_existing_id IS NOT NULL THEN
            RETURN v_existing_id; -- Retornar ID existente (idempotência)
        END IF;
    END IF;
    
    -- Inserir na fila
    INSERT INTO public.gm_fiscal_queue (
        restaurant_id,
        order_id,
        order_data,
        payment_data,
        status,
        idempotency_key
    )
    VALUES (
        p_restaurant_id,
        p_order_id,
        p_order_data,
        p_payment_data,
        'pending',
        p_idempotency_key
    )
    RETURNING id INTO v_queue_id;
    
    RETURN v_queue_id;
END;
$$;

-- 6. RPC: Obter próximo item da fila para processar
CREATE OR REPLACE FUNCTION public.get_next_fiscal_queue_item()
RETURNS TABLE (
    id UUID,
    restaurant_id UUID,
    order_id UUID,
    order_data JSONB,
    payment_data JSONB,
    retry_count INTEGER,
    max_retries INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_item_id UUID;
BEGIN
    -- Selecionar próximo item (pending ou retrying com next_retry_at <= now())
    SELECT q.id INTO v_item_id
    FROM public.gm_fiscal_queue q
    WHERE q.status IN ('pending', 'retrying')
        AND (q.next_retry_at IS NULL OR q.next_retry_at <= timezone('utc'::text, now()))
        AND q.retry_count < q.max_retries
    ORDER BY q.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED; -- Evitar processamento duplicado
    
    -- Se encontrou item, marcar como processing e retornar
    IF v_item_id IS NOT NULL THEN
        UPDATE public.gm_fiscal_queue
        SET status = 'processing',
            updated_at = timezone('utc'::text, now())
        WHERE id = v_item_id;
        
        RETURN QUERY
        SELECT 
            q.id,
            q.restaurant_id,
            q.order_id,
            q.order_data,
            q.payment_data,
            q.retry_count,
            q.max_retries
        FROM public.gm_fiscal_queue q
        WHERE q.id = v_item_id;
    END IF;
END;
$$;

-- 7. RPC: Marcar item como completado
CREATE OR REPLACE FUNCTION public.mark_fiscal_queue_completed(
    p_queue_id UUID,
    p_result JSONB,
    p_fiscal_document_id UUID DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE public.gm_fiscal_queue
    SET status = 'completed',
        result = p_result,
        fiscal_document_id = p_fiscal_document_id,
        processed_at = timezone('utc'::text, now()),
        completed_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_queue_id;
END;
$$;

-- 8. RPC: Marcar item como falhou (com retry)
CREATE OR REPLACE FUNCTION public.mark_fiscal_queue_failed(
    p_queue_id UUID,
    p_error TEXT,
    p_retry_after_seconds INTEGER DEFAULT 60
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_retry_count INTEGER;
    v_max_retries INTEGER;
    v_next_retry_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Obter retry_count e max_retries
    SELECT retry_count, max_retries INTO v_retry_count, v_max_retries
    FROM public.gm_fiscal_queue
    WHERE id = p_queue_id;
    
    -- Calcular próximo retry (backoff exponencial: 60s, 120s, 240s, 480s, 960s)
    v_next_retry_at := timezone('utc'::text, now()) + (p_retry_after_seconds * POWER(2, v_retry_count) || ' seconds')::INTERVAL;
    
    -- TASK-2.2.2: Adicionar erro ao histórico
    UPDATE public.gm_fiscal_queue
    SET error_history = COALESCE(error_history, '[]'::jsonb) || jsonb_build_array(
        jsonb_build_object(
            'timestamp', timezone('utc'::text, now()),
            'error', p_error,
            'attempt', v_retry_count + 1
        )
    )
    WHERE id = p_queue_id;
    
    -- Se excedeu max_retries, marcar como failed permanentemente
    IF v_retry_count + 1 >= v_max_retries THEN
        UPDATE public.gm_fiscal_queue
        SET status = 'failed',
            last_error = p_error,
            last_error_at = timezone('utc'::text, now()),
            updated_at = timezone('utc'::text, now())
        WHERE id = p_queue_id;
        
        -- TASK-2.2.2: Notificar admin (log crítico - em produção, pode enviar email/webhook)
        RAISE WARNING 'Fiscal queue item % exceeded max retries (%) for order %. Last error: %', 
            p_queue_id, v_max_retries, 
            (SELECT order_id FROM public.gm_fiscal_queue WHERE id = p_queue_id),
            p_error;
    ELSE
        -- Caso contrário, marcar como retrying
        UPDATE public.gm_fiscal_queue
        SET status = 'retrying',
            retry_count = retry_count + 1,
            last_error = p_error,
            last_error_at = timezone('utc'::text, now()),
            next_retry_at = v_next_retry_at,
            updated_at = timezone('utc'::text, now())
        WHERE id = p_queue_id;
    END IF;
END;
$$;

COMMENT ON TABLE public.gm_fiscal_queue IS 
'SPRINT 1: Fila durável de emissão fiscal. Processa emissões fiscais no backend com retry automático e auditoria completa.';

COMMENT ON FUNCTION public.add_to_fiscal_queue IS 
'Adiciona item à fila fiscal com idempotência. Retorna ID do item (existente ou novo).';

COMMENT ON FUNCTION public.get_next_fiscal_queue_item IS 
'Obtém próximo item da fila para processar. Usa SKIP LOCKED para evitar processamento duplicado.';

COMMENT ON FUNCTION public.mark_fiscal_queue_completed IS 
'Marca item da fila como completado com resultado.';

COMMENT ON FUNCTION public.mark_fiscal_queue_failed IS 
'Marca item da fila como falhou. Se não excedeu max_retries, marca como retrying com backoff exponencial.';
