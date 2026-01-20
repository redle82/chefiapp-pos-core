-- 🔧 FIX URGENTE: Onboarding create_tenant_atomic
-- 
-- INSTRUÇÕES:
-- 1. Acesse: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl
-- 2. Vá em SQL Editor
-- 3. Cole TODO este arquivo
-- 4. Clique em RUN
--
-- Isso corrige o erro: "null value in column heartbeat of relation empire_pulses"

-- Primeiro, vamos garantir que a função antiga não existe
DROP FUNCTION IF EXISTS public.create_tenant_atomic(text, text, text, text, text, text, text);

-- Agora cria a função corrigida
CREATE OR REPLACE FUNCTION public.create_tenant_atomic(
    p_restaurant_name text,
    p_city text default null,
    p_type text default 'Restaurante',
    p_country text default 'ES',
    p_team_size text default '1-5',
    p_operation_mode text default 'Gamified',
    p_menu_strategy text default 'Quick'
) 
RETURNS json 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE 
    v_user_id uuid;
    v_user_email text;
    v_restaurant_id uuid;
    v_slug text;
    v_category_id uuid;
    v_heartbeat timestamptz;
BEGIN 
    -- Garantir que heartbeat sempre tem valor
    v_heartbeat := CURRENT_TIMESTAMP;
    
    -- 1. Get current user context
    v_user_id := auth.uid();
    v_user_email := auth.email();
    
    IF v_user_id IS NULL THEN 
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Idempotency Check
    SELECT id INTO v_restaurant_id
    FROM public.gm_restaurants
    WHERE owner_id = v_user_id
    LIMIT 1;

    IF v_restaurant_id IS NOT NULL THEN 
        RETURN json_build_object(
            'tenant_id', v_restaurant_id,
            'slug', (SELECT slug FROM public.gm_restaurants WHERE id = v_restaurant_id),
            'message', 'Tenant already exists',
            'restored', true
        );
    END IF;

    -- 3. Generate Slug
    v_slug := lower(regexp_replace(p_restaurant_name, '[^a-zA-Z0-9]', '-', 'g'));
    v_slug := trim(both '-' FROM v_slug);
    v_slug := v_slug || '-' || substr(md5(random()::text), 1, 6);

    -- 4. Create Restaurant
    INSERT INTO public.gm_restaurants (
        name, slug, owner_id, status, country, plan, city, type,
        team_size, operation_mode, menu_strategy, blueprint_version,
        sealed_at, created_at, updated_at
    ) VALUES (
        p_restaurant_name, v_slug, v_user_id, 'draft', p_country, 'trial',
        p_city, p_type, p_team_size, p_operation_mode, p_menu_strategy,
        '2.0.0-SOVEREIGN', now(), now(), now()
    ) RETURNING id INTO v_restaurant_id;

    -- 5. Upsert Profile
    INSERT INTO public.profiles (id, full_name, role, email)
    VALUES (v_user_id, 'Comandante', 'owner', v_user_email)
    ON CONFLICT (id) DO UPDATE SET role = 'owner';

    -- 6. Create Membership
    INSERT INTO public.restaurant_members (restaurant_id, user_id, role)
    VALUES (v_restaurant_id, v_user_id, 'owner');

    -- 7. Seed Category
    INSERT INTO public.menu_categories (restaurant_id, name, sort_order)
    VALUES (v_restaurant_id, 'Principais', 1)
    RETURNING id INTO v_category_id;

    -- 8. Seed Pulse - CRÍTICO: Todos os campos NOT NULL devem ser preenchidos
    INSERT INTO public.empire_pulses (
        project_slug,
        tenant_slug,
        restaurant_id,
        heartbeat,
        metrics,
        events
    ) VALUES (
        'chefiapp',                    -- project_slug: NOT NULL
        v_slug,                         -- tenant_slug: NOT NULL
        v_restaurant_id,               -- restaurant_id: opcional
        v_heartbeat,                    -- heartbeat: NOT NULL (variável explícita)
        jsonb_build_object(
            'origin', 'atomic_rpc_v2',
            'mode', p_operation_mode,
            'gate', 'reality_check_pending'
        ),                              -- metrics: JSONB
        '[]'::jsonb                     -- events: JSONB
    );

    RETURN json_build_object(
        'tenant_id', v_restaurant_id,
        'slug', v_slug,
        'message', 'Tenant created successfully'
    );
END;
$$;

-- Verificar se a função foi criada corretamente
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'create_tenant_atomic';
