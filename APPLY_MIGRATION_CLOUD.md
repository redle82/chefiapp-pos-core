# 🚀 Aplicar Migration no Supabase Cloud (ATUALIZADO)

**Erro Atual:** `null value in column "heartbeat" of relation "empire_pulses"`

**Solução:** Migration `031_fix_empire_pulses_insert.sql` atualizada - precisa ser aplicada no cloud.

---

## 📋 Opção 1: Via Supabase Dashboard (MAIS RÁPIDO)

1. Acesse: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl
2. Vá em **SQL Editor**
3. Cole e execute este SQL:

```sql
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

    -- 2. Idempotency Check
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

    -- 4. Create Restaurant
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

    -- 7. Seed Category
    insert into public.menu_categories (restaurant_id, name, sort_order)
    values (v_restaurant_id, 'Principais', 1)
    returning id into v_category_id;

    -- 8. Seed Pulse - FIXED: Use correct schema with explicit heartbeat
    insert into public.empire_pulses (
        project_slug,
        tenant_slug,
        restaurant_id,
        heartbeat,
        metrics,
        events
    ) values (
        'chefiapp',
        v_slug,
        v_restaurant_id,
        (now() at time zone 'utc'),  -- Explicit UTC timestamp
        jsonb_build_object(
            'origin', 'atomic_rpc_v2',
            'mode', p_operation_mode,
            'gate', 'reality_check_pending'
        ),
        '[]'::jsonb
    );

    return json_build_object(
        'tenant_id', v_restaurant_id,
        'slug', v_slug,
        'message', 'Tenant created successfully'
    );
end;
$$;
```

---

## 📋 Opção 2: Via Supabase CLI

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core
npx supabase login
npx supabase db push
```

---

**Após aplicar, teste o onboarding novamente. O erro de `heartbeat` deve ser resolvido.**
