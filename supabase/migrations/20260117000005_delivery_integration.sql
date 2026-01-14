-- Migration: Delivery Integration & External IDs
-- Date: 2026-01-12

-- 1. Modify gm_restaurants to support external mappings
ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS external_ids JSONB DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.gm_restaurants.external_ids IS 'Map of external provider IDs, e.g. {"glovo_store_id": "12345", "uber_uuid": "..."}';
-- Development: Reset table
DROP TABLE IF EXISTS public.integration_orders CASCADE;
-- 2. Create integration_orders table (Buffer)
CREATE TABLE public.integration_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- External identifiers
    external_id TEXT NOT NULL,
    source TEXT NOT NULL,
    -- 'glovo', 'ubereats', 'deliveroo'
    reference TEXT,
    -- Short code (e.g. "T543")
    -- Restaurant linkage
    source_restaurant_id TEXT,
    -- The ID sent by Glovo (e.g. store_id)
    restaurant_id UUID REFERENCES public.gm_restaurants(id),
    -- Resolved internal ID
    -- Event tracking
    event_type TEXT NOT NULL,
    -- 'order.created', 'order.cancelled'
    status TEXT NOT NULL,
    -- 'new', 'accepted', 'delivering', 'cancelled'
    -- Customer info
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    delivery_address TEXT,
    -- Order details
    delivery_type TEXT DEFAULT 'delivery',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'EUR',
    -- Payment
    payment_method TEXT,
    -- 'online', 'cash'
    payment_status TEXT,
    -- 'paid', 'pending'
    -- Metadata
    instructions TEXT,
    raw_payload JSONB,
    -- Timestamps
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    -- When it was moved to gm_orders
    -- Constraints
    UNIQUE(external_id, source)
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_integration_orders_source ON public.integration_orders(source);
CREATE INDEX IF NOT EXISTS idx_integration_orders_status ON public.integration_orders(status);
CREATE INDEX IF NOT EXISTS idx_integration_orders_restaurant ON public.integration_orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_integration_orders_received ON public.integration_orders(received_at DESC);
-- RLS
ALTER TABLE public.integration_orders ENABLE ROW LEVEL SECURITY;
-- Policy: Owners view their own orders
-- Assuming 'gm_restaurant_members' is the correct table locally.
-- Check if gm_restaurant_members exists first? No, SQL doesn't do "if table exists use it" easily in policy.
-- Using 'gm_restaurant_members' based on \dt output.
CREATE POLICY "Owners view integration orders" ON public.integration_orders FOR
SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id
            FROM public.gm_restaurant_members
            WHERE user_id = auth.uid()
                AND role IN ('owner', 'manager')
        )
    );
-- Policy: Service role full access
CREATE POLICY "Service role full access integration orders" ON public.integration_orders FOR ALL USING (auth.role() = 'service_role');