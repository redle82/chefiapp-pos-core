-- =============================================================================
-- ADD ready_at TO ORDER ITEMS
-- =============================================================================
-- Data: 2026-01-26
-- Objetivo: Permitir marcar item individual como pronto
-- 
-- Regra: Item pode ser marcado como pronto independente do pedido.
-- Pedido fica READY quando TODOS os itens estão prontos.
-- =============================================================================

-- Adicionar ready_at ao gm_order_items
ALTER TABLE public.gm_order_items
ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ;

-- Comentário
COMMENT ON COLUMN public.gm_order_items.ready_at IS 'Timestamp quando o item foi marcado como pronto (independente do pedido)';
