-- 20260124000000_add_marketing_fields.sql
-- 📣 MARKETING: Add Pixel support
-- Adds fields to store Facebook Pixel and Google Tag IDs for each restaurant.

ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT,
  ADD COLUMN IF NOT EXISTS google_tag_id TEXT;

COMMENT ON COLUMN public.gm_restaurants.facebook_pixel_id IS 'Meta Pixel ID (e.g., 1234567890).';
COMMENT ON COLUMN public.gm_restaurants.google_tag_id IS 'Google Tag Manager or Analytics ID (e.g., G-XXXXXX).';
;
-- Migration: Encrypt OAuth Tokens in integration_credentials
-- Date: 2026-01-24
-- TASK-3.1.2: Alterar campos access_token e refresh_token para BYTEA para suportar criptografia

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.integration_credentials (
    restaurant_id UUID NOT NULL,
    integration_type TEXT NOT NULL,
    access_token BYTEA,
    refresh_token BYTEA,
    expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (restaurant_id, integration_type)
);

-- Se a tabela já existir com campos TEXT, alterar para BYTEA
-- Nota: Esta migration é idempotente - pode ser executada múltiplas vezes
DO $$
BEGIN
    -- Verificar se access_token existe e é TEXT, então alterar para BYTEA
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'integration_credentials' 
        AND column_name = 'access_token'
        AND data_type = 'text'
    ) THEN
        -- Converter dados existentes: se houver dados em texto, precisamos migrá-los
        -- Por segurança, vamos apenas alterar o tipo (dados antigos serão perdidos se não estiverem criptografados)
        ALTER TABLE public.integration_credentials 
        ALTER COLUMN access_token TYPE BYTEA USING access_token::bytea;
    END IF;

    -- Verificar se refresh_token existe e é TEXT, então alterar para BYTEA
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'integration_credentials' 
        AND column_name = 'refresh_token'
        AND data_type = 'text'
    ) THEN
        ALTER TABLE public.integration_credentials 
        ALTER COLUMN refresh_token TYPE BYTEA USING refresh_token::bytea;
    END IF;

    -- Se os campos não existem, adicionar como BYTEA
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'integration_credentials' 
        AND column_name = 'access_token'
    ) THEN
        ALTER TABLE public.integration_credentials 
        ADD COLUMN access_token BYTEA;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'integration_credentials' 
        AND column_name = 'refresh_token'
    ) THEN
        ALTER TABLE public.integration_credentials 
        ADD COLUMN refresh_token BYTEA;
    END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_integration_credentials_restaurant 
ON public.integration_credentials(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_integration_credentials_type 
ON public.integration_credentials(integration_type);

-- Comentários
COMMENT ON TABLE public.integration_credentials IS 
'TASK-3.1.2: OAuth tokens criptografados (AES-256-GCM) armazenados como BYTEA';

COMMENT ON COLUMN public.integration_credentials.access_token IS 
'TASK-3.1.2: Access token criptografado (iv + tag + ciphertext)';

COMMENT ON COLUMN public.integration_credentials.refresh_token IS 
'TASK-3.1.2: Refresh token criptografado (iv + tag + ciphertext)';
;
-- 20260124000001_add_external_id_status.sql
-- Adiciona estados explícitos para External ID tracking
-- 
-- Estados válidos:
-- - PENDING_EXTERNAL_ID: Aguardando External ID do provedor
-- - CONFIRMED_EXTERNAL_ID: External ID recebido e confirmado
-- - FAILED_EXTERNAL_ID: Falhou após max retries (alerta necessário)

-- 1. Adicionar coluna external_id_status na fila fiscal
ALTER TABLE public.gm_fiscal_queue
ADD COLUMN IF NOT EXISTS external_id_status TEXT DEFAULT 'PENDING_EXTERNAL_ID'
CHECK (external_id_status IN ('PENDING_EXTERNAL_ID', 'CONFIRMED_EXTERNAL_ID', 'FAILED_EXTERNAL_ID'));

-- 2. Adicionar coluna external_id (gov_protocol) se não existir
ALTER TABLE public.gm_fiscal_queue
ADD COLUMN IF NOT EXISTS external_id TEXT;

-- 3. Índice para queries rápidas de pedidos sem External ID
CREATE INDEX IF NOT EXISTS idx_fiscal_queue_external_id_status 
ON public.gm_fiscal_queue(external_id_status, created_at DESC) 
WHERE external_id_status IN ('PENDING_EXTERNAL_ID', 'FAILED_EXTERNAL_ID');

-- 4. Função para atualizar estado de External ID
CREATE OR REPLACE FUNCTION public.update_external_id_status(
  p_queue_id UUID,
  p_external_id TEXT,
  p_status TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE public.gm_fiscal_queue
  SET 
    external_id = p_external_id,
    external_id_status = p_status,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_queue_id;
END;
$$ LANGUAGE plpgsql;

-- 5. View para pedidos sem External ID (alerta gerente)
CREATE OR REPLACE VIEW public.v_fiscal_pending_external_ids AS
SELECT 
  fq.id,
  fq.order_id,
  fq.restaurant_id,
  fq.status,
  fq.external_id_status,
  fq.retry_count,
  fq.max_retries,
  fq.last_error,
  fq.last_error_at,
  fq.created_at,
  EXTRACT(EPOCH FROM (timezone('utc'::text, now()) - fq.created_at)) / 60 AS minutes_since_created,
  o.table_number,
  o.total_cents
FROM public.gm_fiscal_queue fq
LEFT JOIN public.gm_orders o ON o.id = fq.order_id
WHERE fq.external_id_status IN ('PENDING_EXTERNAL_ID', 'FAILED_EXTERNAL_ID')
  AND fq.status != 'completed'
ORDER BY fq.created_at DESC;

COMMENT ON VIEW public.v_fiscal_pending_external_ids IS 
'Pedidos fiscais aguardando External ID ou que falharam. Usado para alertas no dashboard.';

-- 6. Função para marcar External ID como confirmado
CREATE OR REPLACE FUNCTION public.confirm_external_id(
  p_queue_id UUID,
  p_external_id TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE public.gm_fiscal_queue
  SET 
    external_id = p_external_id,
    external_id_status = 'CONFIRMED_EXTERNAL_ID',
    updated_at = timezone('utc'::text, now())
  WHERE id = p_queue_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Função para marcar External ID como falhado (após max retries)
CREATE OR REPLACE FUNCTION public.fail_external_id(
  p_queue_id UUID,
  p_error TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE public.gm_fiscal_queue
  SET 
    external_id_status = 'FAILED_EXTERNAL_ID',
    last_error = p_error,
    last_error_at = timezone('utc'::text, now()),
    status = 'failed',
    updated_at = timezone('utc'::text, now())
  WHERE id = p_queue_id;
END;
$$ LANGUAGE plpgsql;
;
