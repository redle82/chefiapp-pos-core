-- Migration: Add version column to gm_orders for optimistic locking
-- Purpose: Prevent race conditions when multiple users modify the same order
-- Date: 2026-01-18

-- Add version column (starts at 1, increments on each update)
ALTER TABLE gm_orders
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

-- Add index for version lookups (used in WHERE clauses)
CREATE INDEX IF NOT EXISTS idx_gm_orders_version 
ON gm_orders(id, version);

-- Add comment
COMMENT ON COLUMN gm_orders.version IS 'Optimistic locking version - increments on each update to prevent race conditions';

-- Update trigger to auto-increment version on update
CREATE OR REPLACE FUNCTION increment_order_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version := OLD.version + 1;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_increment_order_version ON gm_orders;
CREATE TRIGGER trigger_increment_order_version
    BEFORE UPDATE ON gm_orders
    FOR EACH ROW
    EXECUTE FUNCTION increment_order_version();
;
-- SPONSORED CONTEXTUAL MENU SUPPORT
-- Ethical brand sponsorship integration with contextual visibility

-- Create product sponsorships table
CREATE TABLE IF NOT EXISTS product_sponsorships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES gm_restaurants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES gm_products(id) ON DELETE CASCADE,
    
    -- Campaign Identity
    brand_name TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    campaign_name TEXT,
    brand_logo TEXT,
    
    -- Customer Incentive
    incentive_type TEXT NOT NULL CHECK (incentive_type IN ('discount', 'combo', 'cashback', 'gift')),
    incentive_value JSONB NOT NULL,
    incentive_display TEXT NOT NULL,
    
    -- Visibility Rules
    visibility_rules JSONB DEFAULT '{
        "channels": ["web", "qr"],
        "time_slots": [],
        "days_of_week": [],
        "date_range": null
    }'::jsonb,
    
    -- Scoring Impact (subtle boost)
    score_boost FLOAT DEFAULT 5.0 CHECK (score_boost >= 0 AND score_boost <= 20),
    priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 10),
    
    -- Status & Control
    active BOOLEAN DEFAULT TRUE,
    owner_approved BOOLEAN DEFAULT FALSE,  -- Explicit owner consent required
    
    -- Business Metrics
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue_cents INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    
    UNIQUE(restaurant_id, product_id, campaign_id)
);

-- Create sponsorship events tracking table
CREATE TABLE IF NOT EXISTS sponsorship_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsorship_id UUID NOT NULL REFERENCES product_sponsorships(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click', 'conversion', 'sale')),
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sponsorships_active 
ON product_sponsorships(restaurant_id, active, owner_approved) 
WHERE active = TRUE AND owner_approved = TRUE;

CREATE INDEX idx_sponsorships_campaign 
ON product_sponsorships(campaign_id, brand_name);

CREATE INDEX idx_sponsorships_product 
ON product_sponsorships(product_id, active);

CREATE INDEX idx_sponsorship_events_lookup 
ON sponsorship_events(sponsorship_id, event_type, created_at DESC);

CREATE INDEX idx_sponsorship_events_timestamp 
ON sponsorship_events(created_at DESC);

-- Function: Update metrics on event
CREATE OR REPLACE FUNCTION update_sponsorship_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update corresponding metric counter in product_sponsorships
    IF NEW.event_type = 'impression' THEN
        UPDATE product_sponsorships 
        SET impressions = impressions + 1, updated_at = NOW()
        WHERE id = NEW.sponsorship_id;
    ELSIF NEW.event_type = 'click' THEN
        UPDATE product_sponsorships 
        SET clicks = clicks + 1, updated_at = NOW()
        WHERE id = NEW.sponsorship_id;
    ELSIF NEW.event_type = 'conversion' THEN
        UPDATE product_sponsorships 
        SET conversions = conversions + 1, updated_at = NOW()
        WHERE id = NEW.sponsorship_id;
    ELSIF NEW.event_type = 'sale' THEN
        UPDATE product_sponsorships 
        SET revenue_cents = revenue_cents + COALESCE((NEW.payload->>'revenue_cents')::int, 0),
            updated_at = NOW()
        WHERE id = NEW.sponsorship_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update metrics when events are logged
DROP TRIGGER IF EXISTS trigger_update_sponsorship_metrics ON sponsorship_events;
CREATE TRIGGER trigger_update_sponsorship_metrics
    AFTER INSERT ON sponsorship_events
    FOR EACH ROW
    EXECUTE FUNCTION update_sponsorship_metrics();

-- Add sponsorship settings to restaurants
ALTER TABLE gm_restaurants 
ADD COLUMN IF NOT EXISTS sponsorship_settings JSONB DEFAULT '{
    "auto_approve": false,
    "allowed_channels": ["web", "qr"],
    "max_score_boost": 10,
    "min_discount_percentage": 5
}'::jsonb;

-- Comments for documentation
COMMENT ON TABLE product_sponsorships IS 'Brand sponsorships for contextual menu amplification in customer-facing channels';
COMMENT ON COLUMN product_sponsorships.owner_approved IS 'Owner must explicitly approve each campaign before it goes live';
COMMENT ON COLUMN product_sponsorships.score_boost IS 'Subtle boost added to dynamic_score (max 20 points)';
COMMENT ON COLUMN product_sponsorships.visibility_rules IS 'JSON rules for when/where sponsorship appears';
COMMENT ON TABLE sponsorship_events IS 'Event tracking for sponsorship impressions, clicks, conversions, and sales';
;
-- Migration: Add RPC function to check open orders with FOR UPDATE lock
-- Purpose: Prevent cash register closure during payment processing
-- Date: 2026-01-18

-- Function to check open orders with row-level lock
CREATE OR REPLACE FUNCTION public.check_open_orders_with_lock(
    p_restaurant_id UUID
) RETURNS TABLE (
    id UUID,
    table_number INTEGER
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
    -- Lock rows to prevent concurrent modifications
    RETURN QUERY
    SELECT o.id, o.table_number
    FROM gm_orders o
    WHERE o.restaurant_id = p_restaurant_id
        AND o.status IN ('pending', 'preparing', 'ready')
        AND o.payment_status != 'PAID'
    FOR UPDATE OF o;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.check_open_orders_with_lock IS 'Checks for open orders with row-level lock to prevent race conditions during cash register closure';
;
