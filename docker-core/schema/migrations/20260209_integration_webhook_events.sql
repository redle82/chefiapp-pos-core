-- Migration: integration_webhook_events + UberEats ingestão

-- 1. Tabela para registrar webhooks recebidos (auditoria)
CREATE TABLE IF NOT EXISTS public.integration_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL, -- 'ubereats', 'glovo', etc
    event_type TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    payload JSONB NOT NULL,
    headers JSONB,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    processing_error TEXT
);

-- 2. Função para transformar e inserir pedido UberEats
CREATE OR REPLACE FUNCTION public.ingest_ubereats_order(
    webhook_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    event_record RECORD;
    order_payload JSONB;
    restaurant_id UUID;
    items JSONB;
    result JSONB;
BEGIN
    -- Busca o evento
    SELECT * INTO event_record FROM public.integration_webhook_events WHERE id = webhook_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Webhook event not found';
    END IF;
    order_payload := event_record.payload;
    -- TODO: Ajustar extração conforme payload real UberEats
    restaurant_id := (order_payload->>'restaurant_id')::UUID;
    items := (order_payload->'items');
    -- Chama o RPC oficial
    result := public.create_order_atomic(
        restaurant_id,
        items,
        'ubereats',
        jsonb_build_object('external_id', order_payload->>'id', 'origin', 'ubereats', 'raw', order_payload)
    );
    -- Marca como processado
    UPDATE public.integration_webhook_events SET processed = TRUE, processed_at = NOW() WHERE id = webhook_id;
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    UPDATE public.integration_webhook_events SET processed = FALSE, processing_error = SQLERRM WHERE id = webhook_id;
    RAISE;
END;
$$;

-- 3. Permissões
GRANT INSERT, SELECT ON public.integration_webhook_events TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ingest_ubereats_order(UUID) TO anon, authenticated, service_role;
