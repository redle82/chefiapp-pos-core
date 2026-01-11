-- Migration: 20260115000000_create_restaurant_groups.sql
-- Purpose: Multi-Location UI - Restaurant Groups (Q2 2026 Feature 2)
-- Date: 2026-01-15
-- Note: One owner can manage multiple restaurants as a group

-- 1. Restaurant Groups (Groups of restaurants owned by one user)
CREATE TABLE IF NOT EXISTS public.restaurant_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Group Identity
    name TEXT NOT NULL, -- e.g., "Sofia's Restaurant Group"
    
    -- Settings
    settings JSONB NOT NULL DEFAULT '{
        "sharedMenu": false,
        "sharedMarketplaceAccount": false,
        "consolidatedBilling": false,
        "allowLocationOverrides": true
    }'::jsonb,
    
    -- Billing
    primary_billing_restaurant_id UUID REFERENCES public.gm_restaurants(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 120)
);

-- 2. Restaurant Group Memberships (Which restaurants belong to which groups)
CREATE TABLE IF NOT EXISTS public.restaurant_group_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.restaurant_groups(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    
    -- Can this location customize menu?
    menu_overrides_allowed BOOLEAN NOT NULL DEFAULT true,
    
    -- Local settings for this location
    local_settings JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(group_id, restaurant_id) -- A restaurant can only be in a group once
);

-- 3. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_restaurant_groups_owner ON public.restaurant_groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_groups_created ON public.restaurant_groups(created_at);
CREATE INDEX IF NOT EXISTS idx_restaurant_group_memberships_group ON public.restaurant_group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_group_memberships_restaurant ON public.restaurant_group_memberships(restaurant_id);

-- 4. RLS Policies
ALTER TABLE public.restaurant_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_group_memberships ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view groups they own
DROP POLICY IF EXISTS "Users can view their own groups" ON public.restaurant_groups;
CREATE POLICY "Users can view their own groups" ON public.restaurant_groups
    FOR SELECT
    USING (owner_id = auth.uid());

-- Policy: Users can create groups
DROP POLICY IF EXISTS "Users can create groups" ON public.restaurant_groups;
CREATE POLICY "Users can create groups" ON public.restaurant_groups
    FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- Policy: Users can update their own groups
DROP POLICY IF EXISTS "Users can update their own groups" ON public.restaurant_groups;
CREATE POLICY "Users can update their own groups" ON public.restaurant_groups
    FOR UPDATE
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Policy: Users can delete their own groups
DROP POLICY IF EXISTS "Users can delete their own groups" ON public.restaurant_groups;
CREATE POLICY "Users can delete their own groups" ON public.restaurant_groups
    FOR DELETE
    USING (owner_id = auth.uid());

-- Policy: Users can view memberships for groups they own
DROP POLICY IF EXISTS "Users can view memberships of their groups" ON public.restaurant_group_memberships;
CREATE POLICY "Users can view memberships of their groups" ON public.restaurant_group_memberships
    FOR SELECT
    USING (
        group_id IN (
            SELECT id FROM public.restaurant_groups WHERE owner_id = auth.uid()
        )
    );

-- Policy: Users can add restaurants to their groups
DROP POLICY IF EXISTS "Users can add restaurants to their groups" ON public.restaurant_group_memberships;
CREATE POLICY "Users can add restaurants to their groups" ON public.restaurant_group_memberships
    FOR INSERT
    WITH CHECK (
        group_id IN (
            SELECT id FROM public.restaurant_groups WHERE owner_id = auth.uid()
        )
        AND restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
        )
    );

-- Policy: Users can update memberships of their groups
DROP POLICY IF EXISTS "Users can update memberships of their groups" ON public.restaurant_group_memberships;
CREATE POLICY "Users can update memberships of their groups" ON public.restaurant_group_memberships
    FOR UPDATE
    USING (
        group_id IN (
            SELECT id FROM public.restaurant_groups WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        group_id IN (
            SELECT id FROM public.restaurant_groups WHERE owner_id = auth.uid()
        )
    );

-- Policy: Users can remove restaurants from their groups
DROP POLICY IF EXISTS "Users can remove restaurants from their groups" ON public.restaurant_group_memberships;
CREATE POLICY "Users can remove restaurants from their groups" ON public.restaurant_group_memberships
    FOR DELETE
    USING (
        group_id IN (
            SELECT id FROM public.restaurant_groups WHERE owner_id = auth.uid()
        )
    );

-- 5. Helper Function: Get restaurants in a group
CREATE OR REPLACE FUNCTION public.get_restaurants_in_group(p_group_id UUID)
RETURNS TABLE (
    restaurant_id UUID,
    restaurant_name TEXT,
    joined_at TIMESTAMPTZ,
    menu_overrides_allowed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rgm.restaurant_id,
        r.name AS restaurant_name,
        rgm.joined_at,
        rgm.menu_overrides_allowed
    FROM public.restaurant_group_memberships rgm
    JOIN public.gm_restaurants r ON r.id = rgm.restaurant_id
    WHERE rgm.group_id = p_group_id
    ORDER BY rgm.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Helper Function: Get groups for a user
CREATE OR REPLACE FUNCTION public.get_groups_for_user(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    owner_id UUID,
    settings JSONB,
    primary_billing_restaurant_id UUID,
    restaurant_count BIGINT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rg.id,
        rg.name,
        rg.owner_id,
        rg.settings,
        rg.primary_billing_restaurant_id,
        COUNT(rgm.id) AS restaurant_count,
        rg.created_at,
        rg.updated_at
    FROM public.restaurant_groups rg
    LEFT JOIN public.restaurant_group_memberships rgm ON rgm.group_id = rg.id
    WHERE rg.owner_id = p_user_id
    GROUP BY rg.id, rg.name, rg.owner_id, rg.settings, rg.primary_billing_restaurant_id, rg.created_at, rg.updated_at
    ORDER BY rg.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Helper Function: Check if user owns restaurant
CREATE OR REPLACE FUNCTION public.user_owns_restaurant(p_user_id UUID, p_restaurant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.gm_restaurant_members
        WHERE user_id = p_user_id
        AND restaurant_id = p_restaurant_id
        AND role IN ('owner', 'manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
