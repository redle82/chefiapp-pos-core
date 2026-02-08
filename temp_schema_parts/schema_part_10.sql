-- WEB ORDERING: Auto-Accept Configuration
-- Allows restaurants to automatically accept web orders without manual approval.

-- 1. Add auto_accept_web_orders column to restaurants
ALTER TABLE public.gm_restaurants 
ADD COLUMN IF NOT EXISTS auto_accept_web_orders BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.gm_restaurants.auto_accept_web_orders IS 
'When true, web orders bypass the Airlock approval queue and go directly to gm_orders';

-- 2. Add web_ordering_enabled column (kill switch)
ALTER TABLE public.gm_restaurants 
ADD COLUMN IF NOT EXISTS web_ordering_enabled BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.gm_restaurants.web_ordering_enabled IS 
'Master switch for web ordering. When false, public menu shows but orders are disabled.';

-- 3. Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_restaurants_web_ordering 
ON public.gm_restaurants(web_ordering_enabled) 
WHERE web_ordering_enabled = true;

-- 4. Add origin column to gm_orders if not exists (to track where order came from)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'gm_orders' 
        AND column_name = 'origin'
    ) THEN
        ALTER TABLE public.gm_orders ADD COLUMN origin TEXT DEFAULT 'TPV';
    END IF;
END $$;

COMMENT ON COLUMN public.gm_orders.origin IS 
'Source of order: TPV (point of sale), WEB_PUBLIC (public website), WEB_QR (QR code at table), APP (mobile app), MARKETPLACE (third party)';

-- 5. RLS: Public can read restaurant web ordering config
DROP POLICY IF EXISTS "Public can read web config" ON public.gm_restaurants;
CREATE POLICY "Public can read web config" ON public.gm_restaurants 
FOR SELECT TO anon 
USING (web_ordering_enabled = true);
;
-- Migration: 031_fix_empire_pulses_insert.sql
-- Purpose: Fix create_tenant_atomic to use correct empire_pulses schema
-- Issue: Function was inserting with old columns (type, status, metadata) 
--        but table requires (project_slug, tenant_slug, heartbeat)

create or replace function public.create_tenant_atomic(
    p_restaurant_name text,
    p_city text default null,
    p_type text default 'Restaurante',
    p_country text default 'ES',
    p_team_size text default '1-5',
    p_operation_mode text default 'Gamified',
    p_menu_strategy text default 'Quick'
) returns json language plpgsql security definer as $$
declare 
    v_user_id uuid;
    v_user_email text;
    v_restaurant_id uuid;
    v_slug text;
    v_category_id uuid;
begin 
    -- 1. Get current user context
    v_user_id := auth.uid();
    v_user_email := auth.email();
    if v_user_id is null then 
        raise exception 'Not authenticated';
    end if;

    -- 2. Idempotency Check: User already owns a restaurant?
    select id into v_restaurant_id
    from public.gm_restaurants
    where owner_id = v_user_id
    limit 1;

    if v_restaurant_id is not null then 
        return json_build_object(
            'tenant_id', v_restaurant_id,
            'slug', (select slug from public.gm_restaurants where id = v_restaurant_id),
            'message', 'Tenant already exists',
            'restored', true
        );
    end if;

    -- 3. Generate Slug
    v_slug := lower(regexp_replace(p_restaurant_name, '[^a-zA-Z0-9]', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    v_slug := v_slug || '-' || substr(md5(random()::text), 1, 6);

    -- 4. Create Restaurant (Status: DRAFT)
    insert into public.gm_restaurants (
        name, slug, owner_id, status, country, plan, city, type,
        team_size, operation_mode, menu_strategy, blueprint_version,
        sealed_at, created_at, updated_at
    ) values (
        p_restaurant_name, v_slug, v_user_id, 'draft', p_country, 'trial',
        p_city, p_type, p_team_size, p_operation_mode, p_menu_strategy,
        '2.0.0-SOVEREIGN', now(), now(), now()
    ) returning id into v_restaurant_id;

    -- 5. Upsert Profile
    insert into public.profiles (id, full_name, role, email)
    values (v_user_id, 'Comandante', 'owner', v_user_email)
    on conflict (id) do update set role = 'owner';

    -- 6. Create Membership
    insert into public.restaurant_members (restaurant_id, user_id, role)
    values (v_restaurant_id, v_user_id, 'owner');

    -- 7. Seed Data: Category (Empty)
    insert into public.menu_categories (restaurant_id, name, sort_order)
    values (v_restaurant_id, 'Principais', 1)
    returning id into v_category_id;

    -- 8. Seed Data: Pulse (Birth) - FIXED: Use correct schema
    insert into public.empire_pulses (
        project_slug,
        tenant_slug,
        restaurant_id,
        heartbeat,
        metrics,
        events
    ) values (
        'chefiapp',  -- project_slug: required NOT NULL
        v_slug,      -- tenant_slug: required NOT NULL
        v_restaurant_id,  -- restaurant_id: optional (for legacy compatibility)
        CURRENT_TIMESTAMP,  -- heartbeat: required NOT NULL (explicit timestamp)
        jsonb_build_object(
            'origin', 'atomic_rpc_v2',
            'mode', p_operation_mode,
            'gate', 'reality_check_pending'
        ),  -- metrics: JSONB
        '[]'::jsonb  -- events: JSONB array
    );

    return json_build_object(
        'tenant_id', v_restaurant_id,
        'slug', v_slug,
        'message', 'Tenant created successfully'
    );
end;
$$;
;
-- 082: Constitutional Law - One Open Order Per Table
-- Date: 2025-01-08
-- Purpose: Prevent race condition when TPV and Web create orders simultaneously
-- Risk Mitigated: T3 (Garçom + Web mesmo instante)

-- This is a PARTIAL UNIQUE INDEX - only enforces uniqueness for OPEN orders
-- Multiple CLOSED/PAID orders for same table are allowed (historical data)

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_order_per_table
ON public.gm_orders (table_id)
WHERE status = 'OPEN' AND table_id IS NOT NULL;

-- Expected error when violated:
-- ERROR: duplicate key value violates unique constraint "idx_one_open_order_per_table"
-- 
-- Client/Backend should catch this and show:
-- "Já existe um pedido ativo para esta mesa"

COMMENT ON INDEX idx_one_open_order_per_table IS 
'Constitutional constraint: One OPEN order per table. Prevents T3 race condition (TPV + Web simultaneous order creation).';
;
