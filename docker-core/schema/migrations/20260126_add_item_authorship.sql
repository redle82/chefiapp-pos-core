-- Migration: Add authorship fields to gm_order_items for bill splitting
-- Date: 2026-01-26
-- Purpose: Enable division of bills by item authorship (Pedido da MESA, Itens das PESSOAS)

-- Add authorship columns to gm_order_items
ALTER TABLE public.gm_order_items
ADD COLUMN IF NOT EXISTS created_by_user_id UUID,
ADD COLUMN IF NOT EXISTS created_by_role TEXT,
ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Add index for efficient queries by authorship
CREATE INDEX IF NOT EXISTS idx_order_items_author
ON public.gm_order_items(order_id, created_by_user_id, created_by_role);

-- Add index for device_id (QR Mesa)
CREATE INDEX IF NOT EXISTS idx_order_items_device
ON public.gm_order_items(device_id) WHERE device_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN public.gm_order_items.created_by_user_id IS 'ID do usuário que criou o item (para divisão de conta)';
COMMENT ON COLUMN public.gm_order_items.created_by_role IS 'Role do criador: waiter, manager, owner, QR_MESA, etc.';
COMMENT ON COLUMN public.gm_order_items.device_id IS 'Identificador do dispositivo (opcional, usado para QR Mesa)';