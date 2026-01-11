-- Migration: P2 Critical Indexes for 1000 Restaurant Scalability
-- Date: 2026-01-04
-- Description: Add missing indexes for optimal query performance

BEGIN;

-- ============================================================================
-- P2.1: RESTAURANT QUERIES
-- ============================================================================

-- Index for "get my restaurants" queries
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id_created 
ON restaurants(owner_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Index for restaurant profile updates
CREATE INDEX IF NOT EXISTS idx_restaurants_slug 
ON restaurants(slug)
WHERE deleted_at IS NULL;

-- ============================================================================
-- P2.2: ORDER QUERIES
-- ============================================================================

-- Index for "get my orders today" (common in dashboard)
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created 
ON orders(restaurant_id, created_at DESC)
WHERE status NOT IN ('cancelled');

-- Index for payment status tracking
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_payment 
ON orders(restaurant_id, payment_status, created_at DESC);

-- Index for kitchen display (recent orders)
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_state 
ON orders(restaurant_id, state, created_at DESC)
WHERE state IN ('pending', 'preparing', 'ready');

-- ============================================================================
-- P2.3: EVENT LOG QUERIES (Event Sourcing)
-- ============================================================================

-- Index for "get events for restaurant" (rebuilding state)
CREATE INDEX IF NOT EXISTS idx_event_store_restaurant_type 
ON event_store(restaurant_id, event_type, created_at DESC);

-- Index for temporal queries
CREATE INDEX IF NOT EXISTS idx_event_store_restaurant_time 
ON event_store(restaurant_id, created_at DESC)
WHERE created_at >= NOW() - INTERVAL '7 days';

-- ============================================================================
-- P2.4: MENU / CATEGORIES
-- ============================================================================

-- Index for menu display
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_available 
ON menu_items(restaurant_id, is_available DESC, position);

-- Index for category queries
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant 
ON menu_categories(restaurant_id, position);

-- ============================================================================
-- P2.5: ANALYTICS / REPORTING
-- ============================================================================

-- Index for revenue reports
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_amount 
ON orders(restaurant_id, created_at DESC, total_amount_cents)
WHERE status NOT IN ('cancelled');

-- Index for time-based analytics
CREATE INDEX IF NOT EXISTS idx_orders_created_restaurant 
ON orders(created_at DESC, restaurant_id)
WHERE created_at >= NOW() - INTERVAL '30 days';

-- ============================================================================
-- VERIFY INDEXES
-- ============================================================================

-- List all indexes on critical tables
\d restaurants
\d orders
\d event_store
\d menu_items
\d menu_categories

COMMIT;
