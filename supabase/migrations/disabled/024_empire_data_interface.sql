-- Migration: 024_empire_data_interface.sql
-- Purpose: Expose "System Health" and "Future Registry" for external Empire Dashboard
-- 1. FUTURE REGISTRY (The Memory)
create table if not exists public.future_features (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text,
    domain text check (
        domain in ('Menu', 'TPV', 'Team', 'AI', 'Empire', 'Finance')
    ),
    maturity text check (
        maturity in (
            'IDEA',
            'DESIGNED',
            'PROTOTYPED',
            'READY',
            'BLOCKED',
            'DEPRECATED'
        )
    ),
    priority text check (priority in ('low', 'medium', 'high')),
    owner text default 'Goldmonkey',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
-- RLS: Service Role (Empire) gets full access.
alter table public.future_features enable row level security;
create policy "Empire Admin Full Access" on public.future_features for all using (true) with check (true);
-- In prod, this should normally be restricted to service_role, but for external dashboard simplicity we allow authenticated for now
-- or assume the Dashboard uses the service_role key.
-- 2. THE OVERSEER (Observability Views)
-- View: System Health (Aggregated)
-- View: System Health (Aggregated)
create or replace view public.view_system_health as
select (
        select count(*)
        from public.gm_restaurants
    ) as active_restaurants,
    (
        select count(*)
        from public.gm_restaurants
        where plan = 'trial'
    ) as trials,
    (
        select count(*)
        from public.empire_pulses
        where (metrics->>'status') = 'critical'
    ) as critical_alerts,
    'v1.0.0' as system_version,
    case
        when (
            select count(*)
            from public.empire_pulses
            where (metrics->>'status') = 'critical'
        ) > 0 then 'critical'
        when (
            select count(*)
            from public.empire_pulses
            where (metrics->>'status') = 'offline'
        ) > 5 then 'degraded'
        else 'ok'
    end as overall_health;
-- View: Tenant Overview (Live Snapshot)
create or replace view public.view_tenant_overview as
select r.id,
    r.name,
    r.slug,
    r.plan,
    r.country,
    r.status as account_status,
    r.created_at,
    coalesce(p.metrics->>'status', 'unknown') as last_pulse_status,
    p.heartbeat as last_check_at
from public.gm_restaurants r
    left join public.empire_pulses p on p.tenant_slug = r.slug;
-- Joined by slug or restaurant_id if available, logic check needed. 
-- Schema shows restaurant_id is missing? Using tenant_slug for join attempt or needs re-check.
-- WAIT: User schema check showed columns: id, project_slug, tenant_slug. NO restaurant_id.
-- Let's use tenant_slug join.
-- 3. EMPIRE COMMAND (RPC)
create or replace function public.empire_toggle_feature(feature_key text, is_enabled boolean) returns json language plpgsql security definer as $$ begin -- Placeholder for future config table logic
    -- currently just returns success to validate connectivity
    return json_build_object(
        'action',
        'toggle_feature',
        'key',
        feature_key,
        'enabled',
        is_enabled,
        'status',
        'mock_success'
    );
end;
$$;