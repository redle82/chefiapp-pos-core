-- =============================================================================
-- FASE 6 — Fila de impressão no Core (CORE_PRINT_CONTRACT)
-- =============================================================================
-- Core manda: fila, formato, retry, timeout. UI pede e mostra estado.
-- Ref: docs/architecture/CORE_PRINT_CONTRACT.md, docs/strategy/IMPLEMENTATION_CHECKLIST_FASE_6_PRINT.md
-- =============================================================================

-- Tabela: pedidos de impressão (fonte de verdade no Core)
CREATE TABLE IF NOT EXISTS public.gm_print_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'kitchen_ticket' | 'receipt' | 'z_report'
    order_id UUID REFERENCES public.gm_orders(id) ON DELETE SET NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'sent' | 'failed'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT print_jobs_type_check CHECK (type IN ('kitchen_ticket', 'receipt', 'z_report')),
    CONSTRAINT print_jobs_status_check CHECK (status IN ('pending', 'sent', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_print_jobs_restaurant_created
ON public.gm_print_jobs(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_print_jobs_status
ON public.gm_print_jobs(restaurant_id, status) WHERE status = 'pending';

COMMENT ON TABLE public.gm_print_jobs IS 'FASE 6: Fila de impressão. Core é fonte de verdade. UI pede e mostra estado.';

-- =============================================================================
-- RPC: request_print — UI chama para pedir impressão; Core valida e enfileira
-- =============================================================================
CREATE OR REPLACE FUNCTION public.request_print(
    p_restaurant_id UUID,
    p_type TEXT,
    p_order_id UUID DEFAULT NULL,
    p_payload JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_job_id UUID;
    v_status TEXT := 'pending';
BEGIN
    -- Validar tipo
    IF p_type NOT IN ('kitchen_ticket', 'receipt', 'z_report') THEN
        RAISE EXCEPTION 'INVALID_TYPE: Tipo de impressão inválido: %', p_type;
    END IF;

    -- Inserir na fila
    INSERT INTO public.gm_print_jobs (restaurant_id, type, order_id, payload, status, updated_at)
    VALUES (p_restaurant_id, p_type, p_order_id, p_payload, v_status, NOW())
    RETURNING id, status INTO v_job_id, v_status;

    -- Sem driver real: kitchen_ticket fica como 'sent' para a UI poder acionar browser print
    -- Quando houver driver (6.5), um worker processa e actualiza status
    IF p_type = 'kitchen_ticket' THEN
        UPDATE public.gm_print_jobs SET status = 'sent', updated_at = NOW() WHERE id = v_job_id;
        v_status := 'sent';
    END IF;

    RETURN jsonb_build_object(
        'job_id', v_job_id,
        'status', v_status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_print TO postgres;
COMMENT ON FUNCTION public.request_print IS 'FASE 6: Pedido de impressão. Core valida e enfileira. Retorna job_id e status.';

-- =============================================================================
-- RPC: get_print_job_status — UI consulta estado do job
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_print_job_status(p_job_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rec RECORD;
BEGIN
    SELECT id, status, error_message, created_at, updated_at
    INTO v_rec
    FROM public.gm_print_jobs
    WHERE id = p_job_id;

    IF v_rec.id IS NULL THEN
        RETURN jsonb_build_object('job_id', p_job_id, 'status', 'not_found');
    END IF;

    RETURN jsonb_build_object(
        'job_id', v_rec.id,
        'status', v_rec.status,
        'error_message', v_rec.error_message,
        'created_at', v_rec.created_at,
        'updated_at', v_rec.updated_at
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_print_job_status TO postgres;
COMMENT ON FUNCTION public.get_print_job_status IS 'FASE 6: Consulta estado do job de impressão.';
