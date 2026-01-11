-- Recreate the 7-arg function (Sovereign Architecture)
CREATE OR REPLACE FUNCTION public.create_tenant_atomic(
        p_restaurant_name text,
        p_city text DEFAULT NULL::text,
        p_type text DEFAULT 'Restaurante'::text,
        p_country text DEFAULT 'ES'::text,
        p_team_size text DEFAULT NULL::text,
        p_operation_mode text DEFAULT NULL::text,
        p_menu_strategy text DEFAULT NULL::text
    ) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $function$
DECLARE v_user_id uuid;
v_tenant_id uuid;
v_slug text;
v_heartbeat timestamptz := now();
BEGIN v_user_id := auth.uid();
IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
SELECT id INTO v_tenant_id
FROM public.gm_restaurants
WHERE owner_id = v_user_id
LIMIT 1;
IF v_tenant_id IS NOT NULL THEN RETURN json_build_object(
    'tenant_id',
    v_tenant_id,
    'message',
    'Tenant already exists'
);
END IF;
v_slug := lower(
    regexp_replace(
        translate(
            p_restaurant_name,
            'áàâãäåāăąèééêëēĕėęěìíîïìĩīĭįòóôõöøōŏőùúûüũūŭůűųñç',
            'aaaaaaaaaaaaaaaaeeeeeeeeeeeeiiiiiiiiioooooooooouuuuuuuuuuuuuuunc'
        ),
        '[^a-z0-9]',
        '-',
        'g'
    )
);
v_slug := trim(
    both '-'
    from v_slug
) || '-' || substr(md5(random()::text), 1, 6);
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
INSERT INTO public.gm_restaurant_members (restaurant_id, user_id, role, created_at)
VALUES (v_tenant_id, v_user_id, 'owner', v_heartbeat);
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
RETURN json_build_object('tenant_id', v_tenant_id);
END;
$function$;