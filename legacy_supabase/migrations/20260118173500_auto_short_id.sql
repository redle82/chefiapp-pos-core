-- Migration: auto_generate_short_id
-- Description: Auto-generates short_id for orders if not provided.

CREATE OR REPLACE FUNCTION generate_order_short_id()
RETURNS TRIGGER AS $$
DECLARE
  next_id INTEGER;
BEGIN
  IF NEW.short_id IS NULL THEN
    -- Simple count-based ID (Note: not concurrency safe for high scale, but fine for single restaurant POS)
    -- Better: use a per-restaurant sequence, but for now:
    SELECT count(*) + 1 INTO next_id FROM gm_orders WHERE restaurant_id = NEW.restaurant_id;
    NEW.short_id := '#' || next_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_short_id ON gm_orders;

CREATE TRIGGER trigger_set_short_id
BEFORE INSERT ON gm_orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_short_id();
