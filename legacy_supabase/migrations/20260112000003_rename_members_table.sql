-- Definitive Fix for Restaurant Members
-- 1. Drop conflicting views (Legacy & Renamed)
DROP VIEW IF EXISTS public.restaurant_members CASCADE;
DROP VIEW IF EXISTS public.gm_restaurant_members CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.gm_restaurant_members CASCADE;
-- 2. Create the Table (Sovereign Architecture)
CREATE TABLE IF NOT EXISTS public.gm_restaurant_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.gm_restaurants(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    role TEXT CHECK (role IN ('owner', 'manager', 'staff')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- 3. Migrate Data from Legacy SaaS table (if exists and table is empty)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'saas_tenants_members'
)
AND NOT EXISTS (
    SELECT 1
    FROM public.gm_restaurant_members
    LIMIT 1
) THEN
INSERT INTO public.gm_restaurant_members (user_id, role, restaurant_id, created_at)
SELECT stm.user_id,
    stm.role,
    r.id as restaurant_id,
    stm.created_at
FROM public.saas_tenants_members stm
    JOIN public.gm_restaurants r ON r.tenant_id = stm.tenant_id ON CONFLICT DO NOTHING;
END IF;
EXCEPTION
WHEN OTHERS THEN NULL;
-- Ignore migration errors if source doesn't exist
END $$;
-- 4. Enable RLS
ALTER TABLE public.gm_restaurant_members ENABLE ROW LEVEL SECURITY;
-- 5. Policies (Recreated from original files for safety)
DROP POLICY IF EXISTS "Users can view members of their restaurants" ON public.gm_restaurant_members;
CREATE POLICY "Users can view members of their restaurants" ON public.gm_restaurant_members FOR
SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id
            FROM public.gm_restaurant_members
            WHERE user_id = auth.uid()
        )
    );
DROP POLICY IF EXISTS "Owners can manage members" ON public.gm_restaurant_members;
CREATE POLICY "Owners can manage members" ON public.gm_restaurant_members FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.gm_restaurant_members
        WHERE restaurant_id = gm_restaurant_members.restaurant_id
            AND user_id = auth.uid()
            AND role = 'owner'
    )
);