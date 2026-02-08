
-- 1. Restaurant Groups
CREATE TABLE IF NOT EXISTS gm_restaurant_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb, -- shared_menu, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Group Members (Junction Table)
CREATE TABLE IF NOT EXISTS gm_restaurant_group_members (
    group_id UUID REFERENCES gm_restaurant_groups(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES gm_restaurants(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- primary (HQ), member (Branch)
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, restaurant_id)
);

-- RLS POLICIES

-- Groups
ALTER TABLE gm_restaurant_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their groups" ON gm_restaurant_groups
    FOR ALL
    USING (auth.uid() = owner_id);

-- Group Members
ALTER TABLE gm_restaurant_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage group members" ON gm_restaurant_group_members
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM gm_restaurant_groups
            WHERE id = gm_restaurant_group_members.group_id
            AND owner_id = auth.uid()
        )
    );

-- Allow reading members if you are a member of the restaurant? 
-- This is tricky. For now, strict Owner control is safer for Phase 1.
