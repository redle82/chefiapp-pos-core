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
$function$;;
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
$function$;;
-- 🔱 GM AUDIT LOGS (Opus 6.0)
-- Immutable audit trail for system actions.
create table if not exists gm_audit_logs (
    id uuid default gen_random_uuid() primary key,
    tenant_id uuid references gm_restaurants(id) on delete cascade not null,
    actor_id uuid references auth.users(id) on delete
    set null not null,
        action text not null,
        -- e.g. 'ORDER_CREATED', 'SYSTEM_PAUSED'
        resource_entity text not null,
        -- e.g. 'order', 'restaurant'
        resource_id text not null,
        -- ID of the resource
        metadata jsonb default '{}'::jsonb,
        -- Contextual data (diffs, reasons)
        ip_address text,
        user_agent text,
        created_at timestamptz default now() not null
);
-- Indexes for performance
create index if not exists idx_audit_logs_tenant_created on gm_audit_logs(tenant_id, created_at desc);
create index if not exists idx_audit_logs_actor on gm_audit_logs(actor_id);
create index if not exists idx_audit_logs_resource on gm_audit_logs(resource_entity, resource_id);
-- 🛡️ SECURITY (RLS)
alter table gm_audit_logs enable row level security;
-- 1. INSERT: Authenticated users can log actions.
-- We trust the application to set the correct tenant_id (validated by FK).
create policy "Enable insert for authenticated users" on gm_audit_logs for
insert with check (auth.role() = 'authenticated');
-- 2. SELECT: Only Tenant Members can view logs for their restaurant.
create policy "Enable select for tenant members" on gm_audit_logs for
select using (
        exists (
            select 1
            from gm_restaurant_members
            where restaurant_id = gm_audit_logs.tenant_id
                and user_id = auth.uid()
        )
    );
-- 3. IMMUTABILITY: No UPDATE or DELETE policies defined.
-- This ensures logs cannot be tampered with via the API.;
