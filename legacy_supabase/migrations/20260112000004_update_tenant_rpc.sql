-- Recreate the 4-arg function
CREATE OR REPLACE FUNCTION public.create_tenant_atomic(
        p_restaurant_name text,
        p_city text DEFAULT NULL::text,
        p_type text DEFAULT 'Restaurante'::text,
        p_country text DEFAULT 'ES'::text
    ) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $function$
declare v_user_id uuid;
v_user_email text;
v_restaurant_id uuid;
v_slug text;
begin v_user_id := auth.uid();
if v_user_id is null then raise exception 'Not authenticated';
end if;
select id into v_restaurant_id
from public.gm_restaurants
where owner_id = v_user_id
limit 1;
if v_restaurant_id is not null then return json_build_object(
    'tenant_id',
    v_restaurant_id,
    'message',
    'Tenant already exists'
);
end if;
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
insert into public.gm_restaurants (
        name,
        slug,
        owner_id,
        status,
        country,
        plan,
        city,
        type,
        created_at,
        updated_at,
        operation_mode
    )
values (
        p_restaurant_name,
        v_slug,
        v_user_id,
        'active',
        p_country,
        'trial',
        p_city,
        p_type,
        now(),
        now(),
        'Gamified'
    )
returning id into v_restaurant_id;
insert into public.gm_restaurant_members (restaurant_id, user_id, role, created_at)
values (v_restaurant_id, v_user_id, 'owner', now());
return json_build_object('tenant_id', v_restaurant_id, 'slug', v_slug);
end;
$function$;