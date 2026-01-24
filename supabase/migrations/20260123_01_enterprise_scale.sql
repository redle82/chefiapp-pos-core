-- Migration: 20260123_01_enterprise_scale.sql
-- Purpose: Implement Organization Layer for Multi-Location Support
-- Strategic Gap: Addresses "Gap 1: Multi-Location" vs Toast/Market

-- ==============================================================================
-- 1. Create Organizations Table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.gm_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.gm_organizations ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. Update Restaurants for Hierarchy
-- ==============================================================================

ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.gm_organizations(id);

ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS is_headquarters BOOLEAN DEFAULT false;

-- ==============================================================================
-- 3. Migration: Backfill Organizations for Existing Restaurants
-- Strategy: Create one Org per Restaurant (Safe default for current single-tenant model)
-- ==============================================================================

DO $$
DECLARE
    r RECORD;
    new_org_id UUID;
    base_slug TEXT;
    slug_suffix INT;
    final_slug TEXT;
BEGIN
    FOR r IN SELECT * FROM public.gm_restaurants WHERE organization_id IS NULL LOOP
        -- Simple slug generation
        base_slug := r.slug || '-org';
        final_slug := base_slug;
        slug_suffix := 1;

        -- Conflict resolution for slug
        WHILE EXISTS (SELECT 1 FROM public.gm_organizations WHERE slug = final_slug) LOOP
            final_slug := base_slug || '-' || slug_suffix;
            slug_suffix := slug_suffix + 1;
        END LOOP;

        INSERT INTO public.gm_organizations (name, slug, owner_id)
        VALUES (r.name || ' Org', final_slug, r.owner_id)
        RETURNING id INTO new_org_id;

        UPDATE public.gm_restaurants
        SET organization_id = new_org_id, is_headquarters = true
        WHERE id = r.id;

        RAISE NOTICE 'Created Organization % for Restaurant %', new_org_id, r.name;
    END LOOP;
END $$;

-- ==============================================================================
-- 4. RLS Policies for Organizations
-- ==============================================================================

-- Select: Owner can see their Org
CREATE POLICY "Owners can view their organizations"
ON public.gm_organizations FOR SELECT
USING (auth.uid() = owner_id);

-- Select: Members can see their Org (via restaurants)
-- Performance Note: This join might be expensive if not indexed.
-- Optimization: CREATE INDEX idx_restaurants_org ON gm_restaurants(organization_id);

CREATE OR REPLACE FUNCTION public.get_user_organization_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    -- Direct ownership OR membership in a restaurant belonging to the org
    SELECT id FROM public.gm_organizations WHERE owner_id = auth.uid()
    UNION
    SELECT r.organization_id
    FROM public.gm_restaurants r
    JOIN public.gm_restaurant_members m ON m.restaurant_id = r.id
    WHERE m.user_id = auth.uid() AND r.organization_id IS NOT NULL
$$;

CREATE POLICY "Members can view their organizations"
ON public.gm_organizations FOR SELECT
USING (id IN (SELECT public.get_user_organization_ids()));

-- Update: Owner only (for now)
CREATE POLICY "Owners can update their organizations"
ON public.gm_organizations FOR UPDATE
USING (auth.uid() = owner_id);

-- Insert: Authenticated users can create Orgs (e.g. signup)
CREATE POLICY "Users can create organizations"
ON public.gm_organizations FOR INSERT
WITH CHECK (auth.uid() = owner_id);


-- ==============================================================================
-- 5. Indexes for Performance
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_gm_restaurants_organization_id
    ON public.gm_restaurants(organization_id);

CREATE INDEX IF NOT EXISTS idx_gm_organizations_owner_id
    ON public.gm_organizations(owner_id);
