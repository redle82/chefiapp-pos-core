-- Migration: 018_onboarding_atomic.sql
-- Purpose: encapsulating tenant creation in a single atomic transaction (RPC)
create or replace function public.create_tenant_atomic(
        p_restaurant_name text,
        p_city text default null,
        p_type text default 'Restaurante',
        p_country text default 'ES'
    ) returns json language plpgsql security definer -- runs as owner (postgres) to bypass RLS if needed, though usually standard user needs RLS
    as $$
declare v_user_id uuid;
v_user_email text;
v_restaurant_id uuid;
v_slug text;
v_category_id uuid;
begin -- 1. Get current user context
v_user_id := auth.uid();
v_user_email := auth.email();
if v_user_id is null then raise exception 'Not authenticated';
end if;
-- 2. Idempotency Check: User already owns a restaurant?
select id into v_restaurant_id
from public.gm_restaurants
where owner_id = v_user_id
limit 1;
if v_restaurant_id is not null then return json_build_object(
    'tenant_id',
    v_restaurant_id,
    'slug',
    (
        select slug
        from public.gm_restaurants
        where id = v_restaurant_id
    ),
    'message',
    'Tenant already exists'
);
end if;
-- 3. Generate Slug (Simple PL/PGSQL version)
v_slug := lower(
    regexp_replace(
        regexp_replace(
            translate(
                p_restaurant_name,
                'áàâãäåāăąèééêëēĕėęěìíîïìĩīĭįòóôõöøōŏőùúûüũūŭůűųñç',
                'aaaaaaaaaaaaaaaaeeeeeeeeeeeeiiiiiiiiioooooooooouuuuuuuuuuuuuuunc'
            ),
            '[^a-z0-9]',
            '-',
            'g'
        ),
        '-+',
        '-',
        'g'
    )
);
-- Trim dashes
v_slug := trim(
    both '-'
    from v_slug
);
-- Append random suffix to ensure uniqueness
v_slug := v_slug || '-' || substr(md5(random()::text), 1, 6);
-- 4. Create Restaurant
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
        updated_at
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
        now()
    )
returning id into v_restaurant_id;
-- 5. Upsert Profile
insert into public.profiles (id, full_name, role, email)
values (v_user_id, 'Comandante', 'owner', v_user_email) on conflict (id) do
update
set role = 'owner';
-- Force upgrade to owner if they were just a user
-- 6. Create Membership
insert into public.restaurant_members (restaurant_id, user_id, role)
values (v_restaurant_id, v_user_id, 'owner');
-- 7. Seed Data: Category
insert into public.menu_categories (restaurant_id, name, sort_order)
values (v_restaurant_id, 'Principais', 1)
returning id into v_category_id;
-- 8. Seed Data: Items (Chef Burger example)
insert into public.menu_items (
        restaurant_id,
        category_id,
        name,
        price_cents,
        currency,
        available
    )
values (
        v_restaurant_id,
        v_category_id,
        'Chef Burger (Exemplo)',
        1290,
        'EUR',
        true
    ),
    (
        v_restaurant_id,
        v_category_id,
        'Coca-Cola Zero',
        250,
        'EUR',
        true
    );
-- 9. Seed Data: Pulse
insert into public.empire_pulses (restaurant_id, type, status, metadata)
values (
        v_restaurant_id,
        'BIRTH',
        'online',
        json_build_object(
            'origin',
            'atomic_rpc',
            'message',
            'Restaurant system initialized via RPC'
        )
    );
return json_build_object(
    'tenant_id',
    v_restaurant_id,
    'slug',
    v_slug,
    'message',
    'Tenant created successfully'
);
end;
$$;