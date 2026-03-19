-- =============================================================================
-- RECEIPT LOG — Histórico de recibos emitidos
-- =============================================================================
-- Data: 2026-03-18
-- Objetivo: Registar todos os recibos emitidos para auditoria e reimpressão.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gm_receipt_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL,
  receipt_data JSONB NOT NULL,
  fiscal_document_number TEXT,
  operator_id UUID,
  printed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipt_log_restaurant
  ON public.gm_receipt_log(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_receipt_log_order
  ON public.gm_receipt_log(order_id);

CREATE INDEX IF NOT EXISTS idx_receipt_log_created
  ON public.gm_receipt_log(created_at DESC);

COMMENT ON TABLE public.gm_receipt_log
  IS 'Histórico de recibos fiscais emitidos. receipt_data contém o snapshot ReceiptData completo.';
