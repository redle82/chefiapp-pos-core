-- BEVERAGE CANON SUPPORT
-- Adds columns to gm_products to support the Universal Beverage Canon system

-- Add canon support columns
ALTER TABLE gm_products 
ADD COLUMN IF NOT EXISTS system_provided BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS canon_id TEXT,
ADD COLUMN IF NOT EXISTS default_visibility BOOLEAN DEFAULT TRUE;

-- Add index for filtering system-provided items
CREATE INDEX IF NOT EXISTS idx_gm_products_system_provided 
ON gm_products(system_provided) WHERE system_provided = TRUE;

-- Add index for canon_id lookups
CREATE INDEX IF NOT EXISTS idx_gm_products_canon_id 
ON gm_products(canon_id) WHERE canon_id IS NOT NULL;

-- RLS Policy: Prevent deletion of canon items (system_provided = true)
-- Users can only delete their own custom products
DROP POLICY IF EXISTS "Users can delete only custom products" ON gm_products;
CREATE POLICY "Users can delete only custom products"
ON gm_products FOR DELETE
USING (
    system_provided = FALSE 
    AND restaurant_id IN (
        SELECT id FROM gm_restaurants WHERE owner_id = auth.uid()
    )
);

-- Comment for documentation
COMMENT ON COLUMN gm_products.system_provided IS 'True if product is from Beverage Canon (cannot be deleted, only deactivated)';
COMMENT ON COLUMN gm_products.canon_id IS 'Reference to canon template (e.g., ES:coca-cola-33cl)';
COMMENT ON COLUMN gm_products.default_visibility IS 'Default visibility state for canon items (false = requires activation)';
;
-- DYNAMIC CONTEXTUAL MENU SUPPORT
-- Adds intelligent product prioritization based on time, usage, and favorites

-- Create product dynamics tracking table
CREATE TABLE IF NOT EXISTS product_dynamics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES gm_restaurants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES gm_products(id) ON DELETE CASCADE,
    
    -- Manual Controls
    is_favorite BOOLEAN DEFAULT FALSE,
    favorite_order INTEGER,
    
    -- Time-Based Statistics (24-hour buckets: "00" to "23")
    hour_stats JSONB DEFAULT '{}'::jsonb,
    
    -- Recent Activity Tracking
    last_ordered_at TIMESTAMPTZ,
    last_clicked_at TIMESTAMPTZ,
    recent_order_count INTEGER DEFAULT 0,
    
    -- Score Cache (refreshed periodically)
    cached_score FLOAT DEFAULT 0,
    score_updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(restaurant_id, product_id)
);

-- Indexes for performance
CREATE INDEX idx_product_dynamics_score 
ON product_dynamics(restaurant_id, cached_score DESC) 
WHERE cached_score > 0;

CREATE INDEX idx_product_dynamics_favorite 
ON product_dynamics(restaurant_id, is_favorite, favorite_order) 
WHERE is_favorite = TRUE;

CREATE INDEX idx_product_dynamics_restaurant 
ON product_dynamics(restaurant_id);

-- Add menu settings to restaurants
ALTER TABLE gm_restaurants 
ADD COLUMN IF NOT EXISTS menu_settings JSONB DEFAULT '{
    "dynamic_menu_enabled": true,
    "score_weights": {
        "time_match": 0.4,
        "recent_frequency": 0.3,
        "click_recency": 0.2,
        "favorite_bonus": 0.1
    },
    "time_slots": {
        "morning": [6, 11],
        "lunch": [12, 16],
        "afternoon": [17, 19],
        "night": [20, 23]
    }
}'::jsonb;

-- Trigger: Update product dynamics when order is created
CREATE OR REPLACE FUNCTION update_product_dynamics_on_order()
RETURNS TRIGGER AS $$
DECLARE
    order_hour TEXT;
    item RECORD;
BEGIN
    -- Get hour from order creation time
    order_hour := LPAD(EXTRACT(HOUR FROM NEW.created_at)::TEXT, 2, '0');
    
    -- Update dynamics for each product in the order
    FOR item IN 
        SELECT product_id 
        FROM gm_order_items 
        WHERE order_id = NEW.id
    LOOP
        INSERT INTO product_dynamics (
            restaurant_id, 
            product_id, 
            hour_stats,
            last_ordered_at,
            recent_order_count
        )
        VALUES (
            NEW.restaurant_id,
            item.product_id,
            jsonb_build_object(order_hour, 1),
            NEW.created_at,
            1
        )
        ON CONFLICT (restaurant_id, product_id) 
        DO UPDATE SET
            hour_stats = jsonb_set(
                product_dynamics.hour_stats,
                ARRAY[order_hour],
                to_jsonb(COALESCE((product_dynamics.hour_stats->>order_hour)::int, 0) + 1)
            ),
            last_ordered_at = NEW.created_at,
            recent_order_count = product_dynamics.recent_order_count + 1,
            updated_at = NOW();
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to orders table
DROP TRIGGER IF EXISTS trigger_update_product_dynamics ON gm_orders;
CREATE TRIGGER trigger_update_product_dynamics
    AFTER INSERT ON gm_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_product_dynamics_on_order();

-- Function: Reset recent order counts (run daily via cron)
CREATE OR REPLACE FUNCTION reset_recent_order_counts()
RETURNS void AS $$
BEGIN
    UPDATE product_dynamics 
    SET recent_order_count = 0
    WHERE updated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE product_dynamics IS 'Tracks product usage patterns for dynamic menu prioritization';
COMMENT ON COLUMN product_dynamics.hour_stats IS 'JSON object with hour keys (00-23) and order counts';
COMMENT ON COLUMN product_dynamics.cached_score IS 'Pre-computed dynamic score (refreshed periodically)';
COMMENT ON COLUMN product_dynamics.recent_order_count IS 'Number of orders in last 7 days';
;
-- Migration: Update create_order_atomic to accept sync_metadata
-- Purpose: Support offline sync idempotency by storing localId
-- Date: 2026-01-18
-- Drop existing function with cascade to handle signature changes
DROP FUNCTION IF EXISTS public.create_order_atomic(UUID, JSONB, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_order_atomic(UUID, JSONB, TEXT, JSONB) CASCADE;
-- Recreate with sync_metadata parameter
CREATE OR REPLACE FUNCTION public.create_order_atomic(
        p_restaurant_id UUID,
        p_items JSONB,
        p_payment_method TEXT DEFAULT 'cash',
        p_sync_metadata JSONB DEFAULT NULL
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_order_id UUID;
v_total_cents INTEGER := 0;
v_item JSONB;
v_item_total INTEGER;
v_short_id TEXT;
v_count INTEGER;
BEGIN -- 1. Calculate Total Amount & Prepare Items
FOR v_item IN
SELECT *
FROM jsonb_array_elements(p_items) LOOP v_item_total := (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER;
v_total_cents := v_total_cents + v_item_total;
END LOOP;
-- 2. Generate Short ID
SELECT count(*) + 1 INTO v_count
FROM public.gm_orders
WHERE restaurant_id = p_restaurant_id;
v_short_id := '#' || v_count::TEXT;
-- 3. Insert Order (with sync_metadata if provided)
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
        v_total_cents,
        'pending',
        p_payment_method,
        p_sync_metadata
    )
RETURNING id INTO v_order_id;
-- 4. Insert Order Items
FOR v_item IN
SELECT *
FROM jsonb_array_elements(p_items) LOOP
INSERT INTO public.gm_order_items (
        order_id,
        product_id,
        product_name,
        quantity,
        unit_price,
        total_price
    )
VALUES (
        v_order_id,
        (v_item->>'product_id')::UUID,
        v_item->>'name',
        (v_item->>'quantity')::INTEGER,
        (v_item->>'unit_price')::INTEGER,
        (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER
    );
END LOOP;
-- 5. Return the created order
RETURN jsonb_build_object(
    'id',
    v_order_id,
    'short_id',
    v_short_id,
    'total_amount',
    v_total_cents,
    'status',
    'pending'
);
END;
$$;;
