-- Migration: Create restaurant_web_presence table
-- Date: 2026-01-30
-- Purpose: Enable web presence management for restaurants (3 types: simple, menu, site)
-- ==============================================================================
-- 1. CREATE RESTAURANT_WEB_PRESENCE TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.restaurant_web_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    -- Type: 'simple' | 'menu' | 'site'
    type TEXT NOT NULL CHECK (type IN ('simple', 'menu', 'site')),
    -- Status: 'draft' | 'provisioning' | 'live' | 'error'
    status TEXT NOT NULL DEFAULT 'draft' CHECK (
        status IN ('draft', 'provisioning', 'live', 'error')
    ),
    -- Configuration (JSONB for flexibility)
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Domain/URL (optional, can be auto-generated)
    domain TEXT,
    custom_domain TEXT,
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    provisioned_at TIMESTAMPTZ,
    error_message TEXT,
    -- Unique: one web presence per restaurant (can be extended later for multiple)
    CONSTRAINT restaurant_web_presence_unique_restaurant UNIQUE (restaurant_id)
);
-- ==============================================================================
-- 2. CREATE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_web_presence_restaurant_id ON public.restaurant_web_presence(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_web_presence_status ON public.restaurant_web_presence(status);
CREATE INDEX IF NOT EXISTS idx_web_presence_type ON public.restaurant_web_presence(type);
CREATE INDEX IF NOT EXISTS idx_web_presence_domain ON public.restaurant_web_presence(domain)
WHERE domain IS NOT NULL;
-- ==============================================================================
-- 3. ENABLE RLS
-- ==============================================================================
ALTER TABLE public.restaurant_web_presence ENABLE ROW LEVEL SECURITY;
-- ==============================================================================
-- 4. RLS POLICIES
-- ==============================================================================
-- Policy: Users can SELECT web presence from their restaurants
DROP POLICY IF EXISTS "Users can view web presence of their restaurants" ON public.restaurant_web_presence;
CREATE POLICY "Users can view web presence of their restaurants" ON public.restaurant_web_presence FOR
SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id
            FROM public.gm_restaurant_members
            WHERE user_id = auth.uid()
        )
        OR restaurant_id IN (
            SELECT id
            FROM public.gm_restaurants
            WHERE owner_id = auth.uid()
        )
    );
-- Policy: Owners and managers can INSERT web presence
DROP POLICY IF EXISTS "Owners and managers can create web presence" ON public.restaurant_web_presence;
CREATE POLICY "Owners and managers can create web presence" ON public.restaurant_web_presence FOR
INSERT WITH CHECK (
        restaurant_id IN (
            SELECT restaurant_id
            FROM public.gm_restaurant_members
            WHERE user_id = auth.uid()
                AND role IN ('owner', 'manager')
        )
        OR restaurant_id IN (
            SELECT id
            FROM public.gm_restaurants
            WHERE owner_id = auth.uid()
        )
    );
-- Policy: Owners and managers can UPDATE web presence
DROP POLICY IF EXISTS "Owners and managers can update web presence" ON public.restaurant_web_presence;
CREATE POLICY "Owners and managers can update web presence" ON public.restaurant_web_presence FOR
UPDATE USING (
        restaurant_id IN (
            SELECT restaurant_id
            FROM public.gm_restaurant_members
            WHERE user_id = auth.uid()
                AND role IN ('owner', 'manager')
        )
        OR restaurant_id IN (
            SELECT id
            FROM public.gm_restaurants
            WHERE owner_id = auth.uid()
        )
    ) WITH CHECK (
        restaurant_id IN (
            SELECT restaurant_id
            FROM public.gm_restaurant_members
            WHERE user_id = auth.uid()
                AND role IN ('owner', 'manager')
        )
        OR restaurant_id IN (
            SELECT id
            FROM public.gm_restaurants
            WHERE owner_id = auth.uid()
        )
    );
-- Policy: Owners and managers can DELETE web presence
DROP POLICY IF EXISTS "Owners and managers can delete web presence" ON public.restaurant_web_presence;
CREATE POLICY "Owners and managers can delete web presence" ON public.restaurant_web_presence FOR DELETE USING (
    restaurant_id IN (
        SELECT restaurant_id
        FROM public.gm_restaurant_members
        WHERE user_id = auth.uid()
            AND role IN ('owner', 'manager')
    )
    OR restaurant_id IN (
        SELECT id
        FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);
-- ==============================================================================
-- 5. TRIGGER: Update updated_at
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_web_presence_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_update_web_presence_updated_at ON public.restaurant_web_presence;
CREATE TRIGGER trigger_update_web_presence_updated_at BEFORE
UPDATE ON public.restaurant_web_presence FOR EACH ROW EXECUTE FUNCTION update_web_presence_updated_at();
-- ==============================================================================
-- 6. COMMENTS
-- ==============================================================================
COMMENT ON TABLE public.restaurant_web_presence IS 'Web presence management for restaurants - 3 types: simple (auto), menu (QR), site (full)';
COMMENT ON COLUMN public.restaurant_web_presence.type IS 'Type of web presence: simple (auto-generated), menu (QR/operational), site (full branding)';
COMMENT ON COLUMN public.restaurant_web_presence.status IS 'Status: draft (not provisioned), provisioning (in progress), live (active), error (failed)';
COMMENT ON COLUMN public.restaurant_web_presence.config IS 'JSONB configuration for the web presence (colors, layout, etc)';
COMMENT ON COLUMN public.restaurant_web_presence.domain IS 'Auto-generated domain (e.g., restaurant.chefiapp.com)';
COMMENT ON COLUMN public.restaurant_web_presence.custom_domain IS 'Custom domain if configured (e.g., meu-restaurante.com)';