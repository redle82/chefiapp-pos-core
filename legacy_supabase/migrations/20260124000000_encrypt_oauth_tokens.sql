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
