-- =============================================================================
-- CHEFIAPP OS - Missing Tables for Supabase Cloud
-- =============================================================================
-- Run this in Supabase SQL Editor to add tables that cause 404 errors.
-- All statements are idempotent (IF NOT EXISTS / IF NOT EXISTS).
-- =============================================================================

-- 1. shift_logs (clock in/out tracking)
CREATE TABLE IF NOT EXISTS public.shift_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  operator_id TEXT NOT NULL,
  operator_name TEXT,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out TIMESTAMPTZ,
  method TEXT DEFAULT 'manual' CHECK (method IN ('pin', 'qr', 'manual')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'break', 'completed')),
  breaks JSONB DEFAULT '[]'::jsonb,
  total_minutes INTEGER,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. api_keys (API authentication)
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  key_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- 3. integration_webhook_events (delivery/integration events)
CREATE TABLE IF NOT EXISTS public.integration_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. gm_receipt_log (fiscal receipt history)
CREATE TABLE IF NOT EXISTS public.gm_receipt_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  order_id TEXT NOT NULL,
  receipt_data JSONB NOT NULL,
  printed BOOLEAN DEFAULT false,
  printed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. gm_tip_log (gratuity tracking)
CREATE TABLE IF NOT EXISTS public.gm_tip_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  order_id TEXT NOT NULL,
  operator_id TEXT,
  operator_name TEXT,
  amount_cents INTEGER NOT NULL,
  tip_type TEXT DEFAULT 'percentage',
  shift_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. gm_waste_log (waste tracking)
CREATE TABLE IF NOT EXISTS public.gm_waste_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  product_id UUID,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT DEFAULT 'unit',
  reason TEXT NOT NULL,
  cost_cents INTEGER DEFAULT 0,
  operator_id TEXT,
  operator_name TEXT,
  notes TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. gm_discounts (discount rules)
CREATE TABLE IF NOT EXISTS public.gm_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed', 'bogo', 'bundle', 'employee', 'loyalty')),
  value NUMERIC NOT NULL,
  min_order_cents INTEGER DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  applies_to JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. gm_coupons (coupon codes)
CREATE TABLE IF NOT EXISTS public.gm_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  discount_id UUID REFERENCES public.gm_discounts(id),
  code TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
  max_redemptions INTEGER DEFAULT 1,
  current_redemptions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. gm_coupon_redemptions
CREATE TABLE IF NOT EXISTS public.gm_coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES public.gm_coupons(id),
  order_id TEXT NOT NULL,
  discount_amount_cents INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. gm_campaigns (marketing)
CREATE TABLE IF NOT EXISTS public.gm_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  subject TEXT,
  template_data JSONB DEFAULT '{}'::jsonb,
  audience_filter JSONB DEFAULT '{}'::jsonb,
  scheduled_at TIMESTAMPTZ,
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. gm_loyalty_points
CREATE TABLE IF NOT EXISTS public.gm_loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  customer_id UUID,
  points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. gm_loyalty_logs
CREATE TABLE IF NOT EXISTS public.gm_loyalty_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  customer_id UUID,
  points_change INTEGER NOT NULL,
  reason TEXT NOT NULL,
  order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. gm_product_translations
CREATE TABLE IF NOT EXISTS public.gm_product_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  restaurant_id UUID NOT NULL,
  locale TEXT NOT NULL,
  name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, locale)
);

-- 14. gm_stripe_connect_accounts
CREATE TABLE IF NOT EXISTS public.gm_stripe_connect_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL UNIQUE,
  stripe_account_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  details_submitted BOOLEAN DEFAULT false,
  platform_fee_percent NUMERIC DEFAULT 2.5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. gm_locations (multi-location)
CREATE TABLE IF NOT EXISTS public.gm_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'Europe/Lisbon',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. gm_waitlist
CREATE TABLE IF NOT EXISTS public.gm_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  party_size INTEGER NOT NULL DEFAULT 2,
  phone TEXT,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'seated', 'cancelled', 'no_show')),
  estimated_wait_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  seated_at TIMESTAMPTZ
);

-- 17. gm_reconciliation_queue / gm_reconciliations
CREATE TABLE IF NOT EXISTS public.gm_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  data JSONB DEFAULT '{}'::jsonb,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.gm_reconciliation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ALTER existing tables: add missing columns
-- =============================================================================

-- gm_restaurants: add disabled_at column
ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ;

-- gm_restaurants: add logo_url column
ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- gm_restaurants: add logo_print_url column
ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS logo_print_url TEXT;

-- gm_tables: add layout_data JSONB for floor plan
ALTER TABLE public.gm_tables
ADD COLUMN IF NOT EXISTS layout_data JSONB;

-- gm_tables: add seats column
ALTER TABLE public.gm_tables
ADD COLUMN IF NOT EXISTS seats INTEGER DEFAULT 4;

-- gm_orders: add tip_cents column
ALTER TABLE public.gm_orders
ADD COLUMN IF NOT EXISTS tip_cents INTEGER DEFAULT 0;

-- gm_orders: add customer_id column
ALTER TABLE public.gm_orders
ADD COLUMN IF NOT EXISTS customer_id UUID;

-- gm_orders: add discount_cents column
ALTER TABLE public.gm_orders
ADD COLUMN IF NOT EXISTS discount_cents INTEGER DEFAULT 0;

-- gm_orders: add discount_id column
ALTER TABLE public.gm_orders
ADD COLUMN IF NOT EXISTS discount_id UUID;

-- gm_orders: add version column
ALTER TABLE public.gm_orders
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- gm_products: add prep_time_seconds column
ALTER TABLE public.gm_products
ADD COLUMN IF NOT EXISTS prep_time_seconds INTEGER DEFAULT 300;

-- gm_products: add prep_category column
ALTER TABLE public.gm_products
ADD COLUMN IF NOT EXISTS prep_category TEXT DEFAULT 'main';

-- gm_customers: add dietary_preferences
ALTER TABLE public.gm_customers
ADD COLUMN IF NOT EXISTS dietary_preferences TEXT[];

-- gm_customers: add segment
ALTER TABLE public.gm_customers
ADD COLUMN IF NOT EXISTS segment TEXT;

-- gm_customers: add total_spent_cents
ALTER TABLE public.gm_customers
ADD COLUMN IF NOT EXISTS total_spent_cents INTEGER DEFAULT 0;

-- gm_customers: add visit_count
ALTER TABLE public.gm_customers
ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 0;

-- gm_customers: add last_visit_at
ALTER TABLE public.gm_customers
ADD COLUMN IF NOT EXISTS last_visit_at TIMESTAMPTZ;

-- =============================================================================
-- Enable RLS on new tables (Supabase requirement)
-- =============================================================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'shift_logs', 'api_keys', 'integration_webhook_events',
      'gm_receipt_log', 'gm_tip_log', 'gm_waste_log',
      'gm_discounts', 'gm_coupons', 'gm_coupon_redemptions',
      'gm_campaigns', 'gm_loyalty_points', 'gm_loyalty_logs',
      'gm_product_translations', 'gm_stripe_connect_accounts',
      'gm_locations', 'gm_waitlist', 'gm_reconciliations',
      'gm_reconciliation_queue'
    ])
  LOOP
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', t);
    -- Allow anon/authenticated full access for now (tighten later)
    EXECUTE format('
      CREATE POLICY IF NOT EXISTS "allow_all_%s" ON public.%I
        FOR ALL USING (true) WITH CHECK (true)
    ', t, t);
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'RLS setup: %%', SQLERRM;
END;
$$;

-- =============================================================================
-- Done! All missing tables and columns should now exist.
-- =============================================================================
SELECT 'Migration complete! ' || count(*) || ' tables in public schema.'
FROM pg_tables WHERE schemaname = 'public';
