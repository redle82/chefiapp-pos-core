-- Migration: 025_diagnostics_and_flags.sql
-- Purpose: Support "Global No-Support Hardening" via Diagnostics Log and Remote Feature Flags
-- 1. DIAGNOSTICS LOG (The Black Box)
-- Stores high-level error events for DevSolver analysis.
create table if not exists public.gm_diagnostics (
    id uuid default gen_random_uuid() primary key,
    code text not null,
    -- e.g., 'GM-1001'
    title text,
    metric_type text check (
        metric_type in ('error', 'warning', 'info', 'security')
    ),
    details jsonb default '{}'::jsonb,
    -- Technical context (sanitized)
    tenant_id uuid references public.gm_restaurants(id),
    user_id uuid references auth.users(id),
    created_at timestamp with time zone default now()
);
-- RLS: Authenticated users can insert logs (their own failures).
alter table public.gm_diagnostics enable row level security;
create policy "Users can insert diagnostics" on public.gm_diagnostics for
insert to authenticated with check (true);
create policy "Service Role full access diagnostics" on public.gm_diagnostics for all to service_role using (true) with check (true);
-- 2. SYSTEM CONFIG (The Control Plane)
-- Stores Feature Flags and Kill Switch states.
create table if not exists public.system_config (
    id uuid default gen_random_uuid() primary key,
    scope text not null check (scope in ('global', 'tenant', 'user')),
    target_id text,
    -- e.g., 'global' or tenant_uuid or user_uuid
    key text not null,
    -- e.g., 'disable_monetization'
    value jsonb not null,
    -- e.g., true, false, {"limit": 100}
    description text,
    updated_at timestamp with time zone default now(),
    unique(scope, target_id, key)
);
-- Index for fast flag lookups
create index idx_system_config_target_key on public.system_config(target_id, key);
-- RLS: Read-only for authenticated, Full access for Service Role.
alter table public.system_config enable row level security;
create policy "Authenticated read config" on public.system_config for
select to authenticated using (true);
create policy "Anon read global config" on public.system_config for
select to anon using (scope = 'global');
create policy "Service Role full access config" on public.system_config for all to service_role using (true) with check (true);
-- 3. SEED DEFAULT FLAGS
insert into public.system_config (scope, target_id, key, value, description)
values (
        'global',
        'global',
        'disable_monetization',
        'false'::jsonb,
        'Kill switch for payment processing'
    ),
    (
        'global',
        'global',
        'safe_mode',
        'false'::jsonb,
        'Enable simplified UI for stability'
    ),
    (
        'global',
        'global',
        'verbose_diagnostics',
        'false'::jsonb,
        'Enable detailed logging in console'
    ) on conflict (scope, target_id, key) do nothing;