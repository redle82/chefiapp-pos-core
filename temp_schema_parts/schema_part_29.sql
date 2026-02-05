-- Migration: Sistema de Tickets de Suporte
-- Data: 2026-01-22
-- Objetivo: Criar sistema básico de tickets de suporte

-- ============================================================================
-- TABELA: gm_support_tickets
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gm_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_support_tickets_restaurant 
ON public.gm_support_tickets(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user 
ON public.gm_support_tickets(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status 
ON public.gm_support_tickets(status, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned 
ON public.gm_support_tickets(assigned_to) 
WHERE assigned_to IS NOT NULL;

-- ============================================================================
-- TABELA: gm_support_ticket_comments
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gm_support_ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.gm_support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- Comentários internos (equipe) vs externos (cliente)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket 
ON public.gm_support_ticket_comments(ticket_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_user 
ON public.gm_support_ticket_comments(user_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.gm_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_support_ticket_comments ENABLE ROW LEVEL SECURITY;

-- Policies para tickets
CREATE POLICY "Users can view tickets from their restaurants"
ON public.gm_support_tickets
FOR SELECT
USING (
  restaurant_id IN (SELECT public.get_user_restaurants())
  OR user_id = auth.uid()
);

CREATE POLICY "Users can create tickets for their restaurants"
ON public.gm_support_tickets
FOR INSERT
WITH CHECK (
  restaurant_id IN (SELECT public.get_user_restaurants())
  AND user_id = auth.uid()
);

CREATE POLICY "Users can update their own tickets"
ON public.gm_support_tickets
FOR UPDATE
USING (
  user_id = auth.uid()
  OR restaurant_id IN (SELECT public.get_user_restaurants())
)
WITH CHECK (
  user_id = auth.uid()
  OR restaurant_id IN (SELECT public.get_user_restaurants())
);

-- Policies para comments
CREATE POLICY "Users can view comments from their restaurant tickets"
ON public.gm_support_ticket_comments
FOR SELECT
USING (
  ticket_id IN (
    SELECT id FROM public.gm_support_tickets
    WHERE restaurant_id IN (SELECT public.get_user_restaurants())
  )
);

CREATE POLICY "Users can create comments on their restaurant tickets"
ON public.gm_support_ticket_comments
FOR INSERT
WITH CHECK (
  ticket_id IN (
    SELECT id FROM public.gm_support_tickets
    WHERE restaurant_id IN (SELECT public.get_user_restaurants())
  )
  AND user_id = auth.uid()
);

-- ============================================================================
-- TRIGGER: Atualizar updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_support_ticket_updated_at
BEFORE UPDATE ON public.gm_support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_support_ticket_updated_at();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE public.gm_support_tickets IS 'Tickets de suporte por restaurante';
COMMENT ON TABLE public.gm_support_ticket_comments IS 'Comentários em tickets de suporte';
COMMENT ON COLUMN public.gm_support_tickets.restaurant_id IS 'Restaurante que abriu o ticket';
COMMENT ON COLUMN public.gm_support_tickets.user_id IS 'Usuário que abriu o ticket';
COMMENT ON COLUMN public.gm_support_ticket_comments.is_internal IS 'Comentário interno (equipe) ou externo (cliente)';
;
-- Migration: Add Stock Tracking Columns
-- Date: 2026-01-23

ALTER TABLE public.gm_products
ADD COLUMN IF NOT EXISTS track_stock BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC DEFAULT 0;

-- Optional: Add index if querying by stock becomes frequent (skipping for now)
;
-- Migration: Update create_order_atomic with Inventory Logic
-- Date: 2026-01-23

CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_restaurant_id UUID,
    p_items JSONB,
    p_payment_method TEXT DEFAULT 'cash',
    p_sync_metadata JSONB DEFAULT NULL
) RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE 
    v_order_id UUID;
    v_total_amount INTEGER := 0;
    v_item JSONB;
    v_item_total INTEGER;
    v_short_id TEXT;
    v_count INTEGER;
    v_prod_id UUID;
    v_qty INTEGER;
    v_new_stock NUMERIC;
    v_prod_name TEXT;
    v_is_offline_sync BOOLEAN;
BEGIN
    v_is_offline_sync := p_sync_metadata IS NOT NULL;

    -- 1. Calculate Total Amount & Prepare Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) 
    LOOP
        v_item_total := (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER;
        v_total_amount := v_total_amount + v_item_total;
    END LOOP;

    -- 2. Generate Short ID
    SELECT count(*) + 1 INTO v_count
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id;
    v_short_id := '#' || v_count::TEXT;

    -- 3. Insert Order
    INSERT INTO public.gm_orders (
        restaurant_id,
        short_id,
        status,
        total_cents,
        payment_status,
        payment_method,
        sync_metadata
    )
    VALUES (
        p_restaurant_id,
        v_short_id,
        'pending',
        v_total_amount,
        'pending',
        p_payment_method,
        p_sync_metadata
    )
    RETURNING id INTO v_order_id;

    -- 4. Insert Order Items & Handle Stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) 
    LOOP
        v_prod_id := (v_item->>'product_id')::UUID;
        v_prod_name := v_item->>'name';
        v_qty := (v_item->>'quantity')::INTEGER;

        -- Insert Item
        INSERT INTO public.gm_order_items (
            order_id,
            product_id,
            name_snapshot,
            quantity,
            price_snapshot,
            subtotal_cents
        )
        VALUES (
            v_order_id,
            v_prod_id,
            v_prod_name,
            v_qty,
            (v_item->>'unit_price')::INTEGER,
            v_qty * (v_item->>'unit_price')::INTEGER
        );

        -- Decrement Stock (if tracked)
        UPDATE public.gm_products
        SET stock_quantity = stock_quantity - v_qty
        WHERE id = v_prod_id AND track_stock = TRUE
        RETURNING stock_quantity INTO v_new_stock;

        -- Check Insufficient Stock (Only for online sales)
        IF FOUND AND v_new_stock < 0 AND NOT v_is_offline_sync THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK: % (Current: %)', v_prod_name, v_new_stock;
        END IF;

    END LOOP;

    -- 5. Return the created order
    RETURN jsonb_build_object(
        'id', v_order_id,
        'short_id', v_short_id,
        'total_amount', v_total_amount,
        'status', 'pending'
    );
END;
$$;
;
