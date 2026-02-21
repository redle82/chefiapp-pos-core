-- 🚨 REPAIR SCRIPT V5 FOR CHEFIAPP SOVEREIGN GENESIS 🚨
-- ATOMIC MEMBERSHIP & RLS FIX
-- 1. Ensure Table Structure (Self-Healing)
ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS team_size text DEFAULT '1-5';
ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS operation_mode text DEFAULT 'Gamified';
ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS menu_strategy text DEFAULT 'Quick';
-- 2. Ensure RLS Policies for gm_restaurants
ALTER TABLE public.gm_restaurants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can update their own restaurants" ON public.gm_restaurants;
CREATE POLICY "Owners can update their own restaurants" ON public.gm_restaurants FOR
UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owners can view their own restaurants" ON public.gm_restaurants;
CREATE POLICY "Owners can view their own restaurants" ON public.gm_restaurants FOR
SELECT USING (auth.uid() = owner_id);
-- 3. Ensure RLS Policies for restaurant_members (CRITICAL FIX)
ALTER TABLE public.restaurant_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.restaurant_members;
CREATE POLICY "Users can view their own memberships" ON public.restaurant_members FOR
SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Anyone can insert their own membership during genesis" ON public.restaurant_members;
CREATE POLICY "Anyone can insert their own membership during genesis" ON public.restaurant_members FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- 4. Redefine the Atomic Function (with ATOMIC MEMBERSHIP)
DROP FUNCTION IF EXISTS public.create_tenant_atomic(text, text, text, text, text, text, text);
CREATE OR REPLACE FUNCTION public.create_tenant_atomic(
        p_restaurant_name text,
        p_city text,
        p_type text,
        p_country text,
        p_team_size text,
        p_operation_mode text,
        p_menu_strategy text
    ) RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $function$
DECLARE v_tenant_id uuid;
v_heartbeat timestamptz;
v_user_id uuid;
v_slug text;
BEGIN v_heartbeat := CURRENT_TIMESTAMP;
v_user_id := auth.uid();
IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required for Genesis';
END IF;
-- GENERATE SLUG
v_slug := lower(
    regexp_replace(p_restaurant_name, '[^a-zA-Z0-9]+', '-', 'g')
);
v_slug := trim(
    both '-'
    from v_slug
);
v_slug := v_slug || '-' || lower(
    substring(replace(gen_random_uuid()::text, '-', ''), 1, 6)
);
-- A. Create Sovereign Entity
INSERT INTO public.gm_restaurants (
        name,
        slug,
        city,
        type,
        country,
        owner_id,
        team_size,
        operation_mode,
        menu_strategy,
        created_at,
        updated_at,
        setup_status,
        onboarding_level,
        status,
        blueprint_version,
        sealed_at
    )
VALUES (
        p_restaurant_name,
        v_slug,
        p_city,
        p_type,
        p_country,
        v_user_id,
        p_team_size,
        p_operation_mode,
        p_menu_strategy,
        v_heartbeat,
        v_heartbeat,
        'pending',
        '1',
        'setup',
        '2.0.0-SOVEREIGN',
        v_heartbeat
    )
RETURNING id INTO v_tenant_id;
-- B. ATOMIC MEMBERSHIP (CRITICAL: Insert user as Owner)
INSERT INTO public.restaurant_members (
        restaurant_id,
        user_id,
        role,
        created_at
    )
VALUES (
        v_tenant_id,
        v_user_id,
        'owner',
        v_heartbeat
    );
-- C. Emit Genesis Pulse
INSERT INTO public.empire_pulses (
        tenant_slug,
        project_slug,
        heartbeat,
        status,
        type,
        metrics,
        events,
        risk,
        metadata
    )
VALUES (
        v_tenant_id::text,
        'chefiapp',
        v_heartbeat,
        'healthy',
        'genesis',
        '{}'::jsonb,
        '[]'::jsonb,
        '{"level": "low"}'::jsonb,
        jsonb_build_object(
            'event',
            'genesis_complete',
            'sovereign_id',
            v_tenant_id
        )
    );
-- D. Return Result
RETURN json_build_object('tenant_id', v_tenant_id);
END;
$function$;