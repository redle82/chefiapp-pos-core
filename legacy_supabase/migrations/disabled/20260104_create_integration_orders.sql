-- Migration: Create integration_orders table
-- Stores orders received from external integrations (GloriaFood, iFood, etc.)

CREATE TABLE IF NOT EXISTS public.integration_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- External identifiers
    external_id TEXT NOT NULL,
    source TEXT NOT NULL, -- 'gloriafood', 'ifood', 'rappi', etc.
    reference TEXT, -- Short code for customer (e.g., "GF-1234")
    
    -- Restaurant linkage
    restaurant_id TEXT, -- External restaurant ID from source
    chefi_restaurant_id UUID REFERENCES restaurants(id), -- Our internal ID (optional)
    
    -- Event tracking
    event_type TEXT NOT NULL, -- 'order.placed', 'order.cancelled', etc.
    status TEXT NOT NULL, -- 'new', 'accepted', 'preparing', etc.
    
    -- Customer info
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    delivery_address TEXT,
    
    -- Order details
    delivery_type TEXT, -- 'delivery', 'pickup', 'dine_in'
    items JSONB NOT NULL DEFAULT '[]',
    total_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'BRL',
    
    -- Payment
    payment_method TEXT, -- 'online', 'cash', 'card_on_delivery'
    payment_status TEXT, -- 'paid', 'pending', 'failed'
    
    -- Extra
    instructions TEXT,
    raw_payload JSONB, -- Full original payload for debugging
    
    -- Timestamps
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    synced_to_pos_at TIMESTAMPTZ, -- When converted to internal order
    
    -- Constraints
    UNIQUE(external_id, source)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_integration_orders_source ON public.integration_orders(source);
CREATE INDEX IF NOT EXISTS idx_integration_orders_status ON public.integration_orders(status);
CREATE INDEX IF NOT EXISTS idx_integration_orders_restaurant ON public.integration_orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_integration_orders_received ON public.integration_orders(received_at DESC);

-- RLS
ALTER TABLE public.integration_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Restaurant owners can see their orders
CREATE POLICY "Restaurant owners can view their integration orders"
    ON public.integration_orders
    FOR SELECT
    USING (
        chefi_restaurant_id IN (
            SELECT id FROM restaurants WHERE owner_id = auth.uid()
        )
    );

-- Policy: Service role can do everything (for webhooks)
CREATE POLICY "Service role has full access to integration orders"
    ON public.integration_orders
    FOR ALL
    USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.integration_orders IS 'Orders received from external delivery integrations';
COMMENT ON COLUMN public.integration_orders.external_id IS 'Order ID from the external source (GloriaFood, etc.)';
COMMENT ON COLUMN public.integration_orders.source IS 'Integration source identifier (gloriafood, ifood, rappi)';
COMMENT ON COLUMN public.integration_orders.raw_payload IS 'Original webhook payload for debugging/audit';
