-- Migration: Restaurant Groups & Multi-location
-- Tables: gm_restaurant_groups, gm_restaurant_group_members
-- Supports: franchise, chain, corporate, custom group types

-- 1. Restaurant Groups
CREATE TABLE IF NOT EXISTS public.gm_restaurant_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    group_type TEXT NOT NULL DEFAULT 'franchise',
    parent_group_id UUID REFERENCES public.gm_restaurant_groups(id),
    master_restaurant_id UUID REFERENCES public.gm_restaurants(id),
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Group Members (junction table)
CREATE TABLE IF NOT EXISTS public.gm_restaurant_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.gm_restaurant_groups(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    inherits_config BOOLEAN DEFAULT TRUE,
    inherits_menu BOOLEAN DEFAULT FALSE,
    inherits_pricing BOOLEAN DEFAULT FALSE,
    inherits_schedule BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, restaurant_id)
);

-- Enable RLS
ALTER TABLE public.gm_restaurant_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_restaurant_group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gm_restaurant_groups
CREATE POLICY "Staff can view groups" ON public.gm_restaurant_groups
    FOR SELECT USING (true);

CREATE POLICY "Staff can insert groups" ON public.gm_restaurant_groups
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can update groups" ON public.gm_restaurant_groups
    FOR UPDATE USING (true);

CREATE POLICY "Staff can delete groups" ON public.gm_restaurant_groups
    FOR DELETE USING (true);

-- RLS Policies for gm_restaurant_group_members
CREATE POLICY "Staff can view group members" ON public.gm_restaurant_group_members
    FOR SELECT USING (true);

CREATE POLICY "Staff can insert group members" ON public.gm_restaurant_group_members
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can update group members" ON public.gm_restaurant_group_members
    FOR UPDATE USING (true);

CREATE POLICY "Staff can delete group members" ON public.gm_restaurant_group_members
    FOR DELETE USING (true);

-- Add to Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.gm_restaurant_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gm_restaurant_group_members;
