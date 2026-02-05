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
