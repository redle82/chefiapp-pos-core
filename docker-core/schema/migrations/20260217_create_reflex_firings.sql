-- Create reflex_firings table for the ReflexEngine
-- Tracks which reflexes have fired for idempotency (fire-once guard)

CREATE TABLE IF NOT EXISTS reflex_firings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL,
    reflex_key TEXT NOT NULL,   -- "clean-table", "finalize-order", etc.
    target_id TEXT NOT NULL,    -- order_id, table_id, etc.
    fired_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, reflex_key, target_id)
);

ALTER TABLE reflex_firings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can select reflex_firings"
    ON reflex_firings FOR SELECT USING (true);
CREATE POLICY "Everyone can insert reflex_firings"
    ON reflex_firings FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_reflex_firings_check
    ON reflex_firings(restaurant_id, reflex_key, target_id);

-- Explicit grants (belt-and-suspenders alongside DEFAULT PRIVILEGES)
GRANT SELECT, INSERT, UPDATE, DELETE ON reflex_firings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON reflex_firings TO authenticated;
