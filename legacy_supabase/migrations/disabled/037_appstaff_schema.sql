-- 037_appstaff_schema.sql
-- ESTABLISHES THE HUMAN INTERFACE LAYER (SATELLITE)
-- Table: appstaff_presence
-- Tracks WHO is physically operating the system and in WHAT capacity.
-- This is the "Human Session" layer, separate from the "Auth Session".
CREATE TABLE IF NOT EXISTS public.appstaff_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    -- Operational Context
    role TEXT NOT NULL,
    -- 'kitchen', 'waiter', 'manager', 'runner'
    device_id TEXT,
    -- Fingerprint of the device used
    -- Time Context
    checkin_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checkout_at TIMESTAMPTZ,
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS
ALTER TABLE public.appstaff_presence ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Staff can view same-restaurant presence'
) THEN CREATE POLICY "Staff can view same-restaurant presence" ON public.appstaff_presence FOR
SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id
            FROM public.restaurant_members
            WHERE user_id = auth.uid()
        )
    );
END IF;
-- Allow users to close their own session if needed via direct update, or rely on RPC
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Staff can update own active presence'
) THEN CREATE POLICY "Staff can update own active presence" ON public.appstaff_presence FOR
UPDATE USING (user_id = auth.uid());
END IF;
END $$;
-- INDEXES
CREATE INDEX IF NOT EXISTS idx_presence_restaurant_status ON public.appstaff_presence(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_presence_user ON public.appstaff_presence(user_id);
-- RPC: Check-in
CREATE OR REPLACE FUNCTION public.fn_appstaff_checkin(
        p_restaurant_id UUID,
        p_role TEXT,
        p_device_id TEXT DEFAULT NULL
    ) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_presence_id UUID;
v_is_member BOOLEAN;
BEGIN -- 1. Validate Membership
SELECT EXISTS (
        SELECT 1
        FROM public.restaurant_members
        WHERE restaurant_id = p_restaurant_id
            AND user_id = auth.uid()
    ) INTO v_is_member;
IF NOT v_is_member THEN -- Fallback: Check if owner
SELECT EXISTS (
        SELECT 1
        FROM public.gm_restaurants
        WHERE id = p_restaurant_id
            AND owner_id = auth.uid()
    ) INTO v_is_member;
IF NOT v_is_member THEN RAISE EXCEPTION 'User is not a member of this restaurant';
END IF;
END IF;
-- 2. Close previous active sessions for this user (Single presence policy)
UPDATE public.appstaff_presence
SET status = 'closed',
    checkout_at = NOW()
WHERE user_id = auth.uid()
    AND restaurant_id = p_restaurant_id
    AND status = 'active';
-- 3. Create new session
INSERT INTO public.appstaff_presence (restaurant_id, user_id, role, device_id)
VALUES (p_restaurant_id, auth.uid(), p_role, p_device_id)
RETURNING id INTO v_presence_id;
RETURN v_presence_id;
END;
$$;