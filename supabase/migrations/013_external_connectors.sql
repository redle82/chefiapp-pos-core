-- 013_external_connectors.sql
-- Purpose: Manage external destinations for stability signals.
CREATE TABLE IF NOT EXISTS public.external_connectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    connector_type TEXT NOT NULL,
    -- 'generic_webhook', 'marketing_api', 'review_bot'
    webhook_url TEXT NOT NULL,
    webhook_secret TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.external_connectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage their own connectors" ON public.external_connectors FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.restaurant_members
        WHERE restaurant_id = external_connectors.restaurant_id
            AND user_id = auth.uid()
            AND role = 'owner'
    )
);
CREATE INDEX IF NOT EXISTS idx_external_connectors_restaurant ON public.external_connectors(restaurant_id);