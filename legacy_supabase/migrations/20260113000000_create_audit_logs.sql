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
-- This ensures logs cannot be tampered with via the API.