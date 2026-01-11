-- WEB ORDERING: Auto-Accept Configuration
-- Allows restaurants to automatically accept web orders without manual approval.

-- 1. Add auto_accept_web_orders column to restaurants
ALTER TABLE public.gm_restaurants 
ADD COLUMN IF NOT EXISTS auto_accept_web_orders BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.gm_restaurants.auto_accept_web_orders IS 
'When true, web orders bypass the Airlock approval queue and go directly to gm_orders';

-- 2. Add web_ordering_enabled column (kill switch)
ALTER TABLE public.gm_restaurants 
ADD COLUMN IF NOT EXISTS web_ordering_enabled BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.gm_restaurants.web_ordering_enabled IS 
'Master switch for web ordering. When false, public menu shows but orders are disabled.';

-- 3. Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_restaurants_web_ordering 
ON public.gm_restaurants(web_ordering_enabled) 
WHERE web_ordering_enabled = true;

-- 4. Add origin column to gm_orders if not exists (to track where order came from)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'gm_orders' 
        AND column_name = 'origin'
    ) THEN
        ALTER TABLE public.gm_orders ADD COLUMN origin TEXT DEFAULT 'TPV';
    END IF;
END $$;

COMMENT ON COLUMN public.gm_orders.origin IS 
'Source of order: TPV (point of sale), WEB_PUBLIC (public website), WEB_QR (QR code at table), APP (mobile app), MARKETPLACE (third party)';

-- 5. RLS: Public can read restaurant web ordering config
DROP POLICY IF EXISTS "Public can read web config" ON public.gm_restaurants;
CREATE POLICY "Public can read web config" ON public.gm_restaurants 
FOR SELECT TO anon 
USING (web_ordering_enabled = true);
