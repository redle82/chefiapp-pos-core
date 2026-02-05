-- P3 Fix: Create missing gm_restaurant_members table
-- Required for BootstrapPage and RLS policies
CREATE TABLE IF NOT EXISTS public.gm_restaurant_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.gm_restaurants(id),
    user_id UUID NOT NULL,
    -- References auth.users implicitly
    role TEXT DEFAULT 'staff',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast membership lookups
CREATE INDEX IF NOT EXISTS idx_gm_restaurant_members_user ON public.gm_restaurant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_gm_restaurant_members_restaurant ON public.gm_restaurant_members(restaurant_id);

-- Enable RLS
ALTER TABLE public.gm_restaurant_members ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for Docker/Dev)
CREATE POLICY "Public read for own membership" ON public.gm_restaurant_members
    FOR SELECT USING (true); -- Relaxed for dev, ideally (user_id = auth.uid())

CREATE POLICY "Public insert for bootstrap" ON public.gm_restaurant_members
    FOR INSERT WITH CHECK (true); -- Relaxed for dev bootstrap
