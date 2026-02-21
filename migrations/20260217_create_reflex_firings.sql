-- Create reflex_firings table (Idempotency Log)
-- This table tracks which reflexes have already fired to prevent duplicate execution

CREATE TABLE IF NOT EXISTS reflex_firings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES gm_restaurants(id) NOT NULL,
    reflex_key TEXT NOT NULL, -- "clean-table", "finalize-order", etc.
    target_id TEXT NOT NULL, -- order_id, table_id, etc.
    fired_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, reflex_key, target_id)
);

-- RLS for reflex_firings
ALTER TABLE reflex_firings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view firings" ON reflex_firings
    FOR SELECT USING (restaurant_id = (SELECT restaurant_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "Staff can insert firings" ON reflex_firings
    FOR INSERT WITH CHECK (restaurant_id = (SELECT restaurant_id FROM employees WHERE id = auth.uid()));

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_reflex_firings_check ON reflex_firings(restaurant_id, reflex_key, target_id);
