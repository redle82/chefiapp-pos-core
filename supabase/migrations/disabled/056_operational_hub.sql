-- Migration: 056_operational_hub.sql
-- Purpose: OperationalHub module - Complete restaurant operations (inspired by Last.app)
-- Date: 2025-01-02
-- Note: Using "OperationalHub" name to avoid conflict with competitor "Last.app"

-- 1. Fast Mode Configuration (Venda Ultrarrápida)
CREATE TABLE IF NOT EXISTS public.operational_hub_fast_mode (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT false,
    quick_products JSONB DEFAULT '[]'::jsonb, -- Top 20 produtos mais vendidos
    default_payment_method TEXT CHECK (default_payment_method IN ('cash', 'card', 'qr')),
    auto_confirm BOOLEAN DEFAULT false, -- Auto-confirmar pedidos
    skip_modifications BOOLEAN DEFAULT true, -- Pular modificações
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id)
);

-- 2. Stock Management (Gestão de Estoque)
CREATE TABLE IF NOT EXISTS public.operational_hub_stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    product_id UUID, -- Reference to menu item (external)
    product_name TEXT NOT NULL,
    unit TEXT DEFAULT 'unit' CHECK (unit IN ('unit', 'kg', 'g', 'l', 'ml', 'piece')),
    current_stock DECIMAL(10,3) DEFAULT 0,
    min_stock DECIMAL(10,3) DEFAULT 0, -- Stock mínimo (alerta)
    max_stock DECIMAL(10,3),
    cost_per_unit DECIMAL(10,2),
    supplier TEXT,
    last_restocked_at TIMESTAMPTZ,
    auto_deduct BOOLEAN DEFAULT true, -- Deduzir automaticamente ao vender
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Stock Movements (Movimentações de Estoque)
CREATE TABLE IF NOT EXISTS public.operational_hub_stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    stock_item_id UUID NOT NULL REFERENCES public.operational_hub_stock_items(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('sale', 'restock', 'adjustment', 'waste', 'transfer')),
    quantity DECIMAL(10,3) NOT NULL,
    order_id UUID, -- If movement_type = 'sale', link to order
    reason TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Employee Time Tracking (Fichaje)
CREATE TABLE IF NOT EXISTS public.operational_hub_time_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    shift_date DATE NOT NULL,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    break_start TIMESTAMPTZ,
    break_end TIMESTAMPTZ,
    total_hours DECIMAL(5,2), -- Calculated
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Delivery Integrations (Integrador Delivery)
CREATE TABLE IF NOT EXISTS public.operational_hub_delivery_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    channel_name TEXT NOT NULL CHECK (channel_name IN ('glovo', 'uber_eats', 'just_eat', 'deliveroo', 'rappi', 'ifood', 'custom')),
    channel_type TEXT NOT NULL CHECK (channel_type IN ('api', 'webhook', 'manual')),
    api_credentials_enc BYTEA, -- Encrypted credentials
    webhook_url TEXT,
    webhook_secret TEXT,
    enabled BOOLEAN DEFAULT true,
    auto_accept BOOLEAN DEFAULT false, -- Aceitar pedidos automaticamente
    last_sync_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, channel_name)
);

-- 6. Ticket Customization (Personalização de Tickets)
CREATE TABLE IF NOT EXISTS public.operational_hub_ticket_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK (template_type IN ('receipt', 'kitchen', 'bar', 'delivery')),
    header_html TEXT, -- HTML para cabeçalho
    footer_html TEXT, -- HTML para rodapé
    logo_url TEXT,
    show_qr BOOLEAN DEFAULT false,
    show_tax_info BOOLEAN DEFAULT true,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Advanced Analytics (Reportes Avançados)
CREATE TABLE IF NOT EXISTS public.operational_hub_analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    total_sales DECIMAL(10,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    average_ticket DECIMAL(10,2) DEFAULT 0,
    top_products JSONB DEFAULT '[]'::jsonb, -- [{product_id, name, quantity, revenue}]
    peak_hours JSONB DEFAULT '{}'::jsonb, -- {hour: count}
    payment_methods JSONB DEFAULT '{}'::jsonb, -- {method: amount}
    table_turnover DECIMAL(5,2), -- Average table turnover
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, snapshot_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_operational_hub_stock_restaurant ON public.operational_hub_stock_items(restaurant_id, current_stock);
CREATE INDEX IF NOT EXISTS idx_operational_hub_stock_movements_item ON public.operational_hub_stock_movements(stock_item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operational_hub_time_tracking_user_date ON public.operational_hub_time_tracking(user_id, shift_date DESC);
CREATE INDEX IF NOT EXISTS idx_operational_hub_delivery_restaurant ON public.operational_hub_delivery_channels(restaurant_id, enabled);
CREATE INDEX IF NOT EXISTS idx_operational_hub_analytics_date ON public.operational_hub_analytics_snapshots(restaurant_id, snapshot_date DESC);

-- RLS Policies
ALTER TABLE public.operational_hub_fast_mode ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_hub_stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_hub_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_hub_time_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_hub_delivery_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_hub_ticket_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_hub_analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- Members can view all OperationalHub data
CREATE POLICY "Members can view fast mode" ON public.operational_hub_fast_mode
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = operational_hub_fast_mode.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view stock" ON public.operational_hub_stock_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = operational_hub_stock_items.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view stock movements" ON public.operational_hub_stock_movements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = operational_hub_stock_movements.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view time tracking" ON public.operational_hub_time_tracking
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = operational_hub_time_tracking.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view delivery channels" ON public.operational_hub_delivery_channels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = operational_hub_delivery_channels.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view ticket templates" ON public.operational_hub_ticket_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = operational_hub_ticket_templates.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view analytics" ON public.operational_hub_analytics_snapshots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = operational_hub_analytics_snapshots.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

-- Owners/Managers can manage all OperationalHub data
CREATE POLICY "Owners can manage fast mode" ON public.operational_hub_fast_mode
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = operational_hub_fast_mode.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Owners can manage stock" ON public.operational_hub_stock_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = operational_hub_stock_items.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager', 'stock')
        )
    );

CREATE POLICY "Owners can manage stock movements" ON public.operational_hub_stock_movements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = operational_hub_stock_movements.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager', 'stock')
        )
    );

CREATE POLICY "Owners can manage time tracking" ON public.operational_hub_time_tracking
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = operational_hub_time_tracking.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Owners can manage delivery channels" ON public.operational_hub_delivery_channels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = operational_hub_delivery_channels.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Owners can manage ticket templates" ON public.operational_hub_ticket_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = operational_hub_ticket_templates.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

-- Comments
COMMENT ON TABLE public.operational_hub_fast_mode IS 'Fast Mode configuration for ultra-fast sales (Fast Service)';
COMMENT ON TABLE public.operational_hub_stock_items IS 'Stock management for menu items';
COMMENT ON TABLE public.operational_hub_stock_movements IS 'Stock movements (sales, restock, adjustments)';
COMMENT ON TABLE public.operational_hub_time_tracking IS 'Employee time tracking (Fichaje) - shift management';
COMMENT ON TABLE public.operational_hub_delivery_channels IS 'Delivery platform integrations (Glovo, Uber Eats, etc.)';
COMMENT ON TABLE public.operational_hub_ticket_templates IS 'Custom ticket/receipt templates';
COMMENT ON TABLE public.operational_hub_analytics_snapshots IS 'Daily analytics snapshots for reporting';

