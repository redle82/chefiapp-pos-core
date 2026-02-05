-- Enable Realtime for integration_orders
-- Date: 2026-01-28

-- Add table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.integration_orders;

-- Comment
COMMENT ON TABLE public.integration_orders IS 'Realtime enabled for Delivery Integration monitoring';
