-- 024_align_airlock_schema.sql
-- Fixes missing columns in gm_order_requests detected during Phase 19 Audit.
ALTER TABLE public.gm_order_requests
ADD COLUMN IF NOT EXISTS customer_name TEXT,
    ADD COLUMN IF NOT EXISTS origin TEXT,
    -- To match gm_orders.origin. We also have request_source, can use either.
ADD COLUMN IF NOT EXISTS table_number TEXT,
    -- To match gm_orders.table_number. Existing table_id is UUID.
ADD COLUMN IF NOT EXISTS restaurant_id UUID;
-- Direct link for easier querying (tenant_id exists, but restaurant_id is useful).
-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_requests_restaurant_status ON public.gm_order_requests(restaurant_id, status);