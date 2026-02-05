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
;
-- Migration: add_missing_columns_to_gm_orders
-- Description: Adds customer_name, table_number, notes to gm_orders to match application logic.

ALTER TABLE gm_orders 
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS table_number integer,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS origin text;

-- Also unblock RLS for these columns if needed? RLS is row-based.
-- The policy "kds_anon_select_orders" I created covers the whole table.
;
-- Migration: auto_generate_short_id
-- Description: Auto-generates short_id for orders if not provided.

CREATE OR REPLACE FUNCTION generate_order_short_id()
RETURNS TRIGGER AS $$
DECLARE
  next_id INTEGER;
BEGIN
  IF NEW.short_id IS NULL THEN
    -- Simple count-based ID (Note: not concurrency safe for high scale, but fine for single restaurant POS)
    -- Better: use a per-restaurant sequence, but for now:
    SELECT count(*) + 1 INTO next_id FROM gm_orders WHERE restaurant_id = NEW.restaurant_id;
    NEW.short_id := '#' || next_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_short_id ON gm_orders;

CREATE TRIGGER trigger_set_short_id
BEFORE INSERT ON gm_orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_short_id();
;
