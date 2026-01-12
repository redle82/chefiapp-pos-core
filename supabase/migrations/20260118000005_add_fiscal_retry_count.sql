-- Migration: Add retry_count to fiscal_event_store
-- P0-4 FIX: Suporte para retry em background de faturas PENDING
-- Data: 2026-01-18

-- Adicionar coluna retry_count se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'fiscal_event_store' 
        AND column_name = 'retry_count'
    ) THEN
        ALTER TABLE public.fiscal_event_store
        ADD COLUMN retry_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Index para queries de retry (eficiente para buscar PENDING com retry_count baixo)
CREATE INDEX IF NOT EXISTS idx_fiscal_event_store_pending_retry
ON public.fiscal_event_store(fiscal_status, retry_count, created_at)
WHERE fiscal_status = 'PENDING' AND retry_count < 10;

COMMENT ON COLUMN public.fiscal_event_store.retry_count IS 'P0-4: Número de tentativas de retry para faturas PENDING. Máximo 10 tentativas.';
