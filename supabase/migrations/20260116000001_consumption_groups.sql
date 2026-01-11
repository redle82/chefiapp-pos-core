-- Migration: 20260116000001_consumption_groups.sql
-- Purpose: Consumption Groups - Dividir contas durante o consumo, não no final
-- Date: 2026-01-16
-- Note: "Conta dividida não é uma ação. É um estado da mesa."

-- 1. Consumption Groups (Grupos de Consumo)
CREATE TABLE IF NOT EXISTS public.consumption_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.gm_orders(id) ON DELETE CASCADE,
    
    -- Group Identity
    label TEXT NOT NULL, -- Ex: "Casal", "Amigos", "Empresa", "Grupo A"
    color TEXT DEFAULT '#3B82F6', -- Cor para identificação visual (hex)
    position INTEGER NOT NULL DEFAULT 1, -- Ordem de exibição
    
    -- Optional Participants (opcional, para CRM futuro)
    participants JSONB DEFAULT '[]'::jsonb, -- [{name: "João", email: "..."}]
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid', 'cancelled')),
    paid_at TIMESTAMPTZ,
    paid_by UUID REFERENCES auth.users(id), -- Quem pagou
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(order_id, position) -- Garante ordem única dentro do pedido
);

-- 2. Add consumption_group_id to gm_order_items
ALTER TABLE public.gm_order_items
ADD COLUMN IF NOT EXISTS consumption_group_id UUID REFERENCES public.consumption_groups(id) ON DELETE SET NULL;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_consumption_groups_order ON public.consumption_groups(order_id);
CREATE INDEX IF NOT EXISTS idx_consumption_groups_restaurant ON public.consumption_groups(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_consumption_groups_status ON public.consumption_groups(status);
CREATE INDEX IF NOT EXISTS idx_order_items_consumption_group ON public.gm_order_items(consumption_group_id);

-- 4. RLS Policies
ALTER TABLE public.consumption_groups ENABLE ROW LEVEL SECURITY;

-- Policy: Restaurant members can view consumption groups
CREATE POLICY "Restaurant members can view consumption groups"
ON public.consumption_groups FOR SELECT
USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_members
        WHERE user_id = auth.uid()
    )
    OR
    restaurant_id IN (
        SELECT id FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Restaurant members can create consumption groups
CREATE POLICY "Restaurant members can create consumption groups"
ON public.consumption_groups FOR INSERT
WITH CHECK (
    restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_members
        WHERE user_id = auth.uid()
    )
    OR
    restaurant_id IN (
        SELECT id FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Restaurant members can update consumption groups
CREATE POLICY "Restaurant members can update consumption groups"
ON public.consumption_groups FOR UPDATE
USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_members
        WHERE user_id = auth.uid()
    )
    OR
    restaurant_id IN (
        SELECT id FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);

-- 5. Function: Create default group for new order
CREATE OR REPLACE FUNCTION public.create_default_consumption_group()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o pedido não tem grupos, cria um padrão
    IF NOT EXISTS (
        SELECT 1 FROM public.consumption_groups
        WHERE order_id = NEW.id
    ) THEN
        INSERT INTO public.consumption_groups (
            restaurant_id,
            order_id,
            label,
            color,
            position
        ) VALUES (
            NEW.restaurant_id,
            NEW.id,
            'Mesa Inteira',
            '#3B82F6',
            1
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create default group on order creation
DROP TRIGGER IF EXISTS trigger_create_default_consumption_group ON public.gm_orders;
CREATE TRIGGER trigger_create_default_consumption_group
AFTER INSERT ON public.gm_orders
FOR EACH ROW
EXECUTE FUNCTION public.create_default_consumption_group();

-- 6. Function: Calculate group total
CREATE OR REPLACE FUNCTION public.get_consumption_group_total(group_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM((oi.price_snapshot / 100.0) * oi.quantity), 0)
    INTO total
    FROM public.gm_order_items oi
    WHERE oi.consumption_group_id = group_id;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. View: Consumption Groups with Totals
CREATE OR REPLACE VIEW public.consumption_groups_with_totals AS
SELECT 
    cg.*,
    COALESCE(SUM((oi.price_snapshot / 100.0) * oi.quantity), 0) AS total_amount,
    COUNT(oi.id) AS items_count
FROM public.consumption_groups cg
LEFT JOIN public.gm_order_items oi ON oi.consumption_group_id = cg.id
WHERE cg.status = 'active'
GROUP BY cg.id;

-- 8. Comments (Documentação)
COMMENT ON TABLE public.consumption_groups IS 'Grupos de consumo dentro de um pedido. Permite dividir contas durante o consumo, não no final.';
COMMENT ON COLUMN public.consumption_groups.label IS 'Nome do grupo (ex: "Casal", "Amigos", "Empresa")';
COMMENT ON COLUMN public.consumption_groups.color IS 'Cor hex para identificação visual no AppStaff e TPV';
COMMENT ON COLUMN public.consumption_groups.position IS 'Ordem de exibição dos grupos (1, 2, 3...)';
COMMENT ON COLUMN public.consumption_groups.participants IS 'Participantes do grupo (opcional, para CRM futuro)';
COMMENT ON COLUMN public.gm_order_items.consumption_group_id IS 'Grupo de consumo ao qual o item pertence. NULL = grupo padrão (Mesa Inteira)';
