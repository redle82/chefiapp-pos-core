-- Phase I: Operational Monitoring (Heartbeat)
-- Date: 2026-02-01
-- Context: Tracking terminal liveness to ensure operational awareness.

-- 1. Terminals Table
create table if not exists gm_terminals (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid not null references restaurant_web_profiles(restaurant_id) on delete cascade,
    type text not null check (type in ('TPV', 'KDS', 'WAITER', 'BACKOFFICE', 'ADMIN')),
    name text not null,
    last_heartbeat_at timestamptz not null default now(),
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Index for liveness checks
create index if not exists idx_gm_terminals_restaurant_heartbeat on gm_terminals(restaurant_id, last_heartbeat_at desc);

-- 2. RLS
alter table gm_terminals enable row level security;

-- Members can view terminals in their restaurant
create policy "Members can view terminals" on gm_terminals for
select using (
    exists (
        select 1 from members
        where members.user_id = auth.uid()
        and members.restaurant_id = gm_terminals.restaurant_id
    )
);

-- Members can insert/update their own terminals (identified by ID in metadata or direct update)
-- For the pilot, we allow members to upsert any terminal in their restaurant.
create policy "Members can upsert terminals" on gm_terminals for
all using (
    exists (
        select 1 from members
        where members.user_id = auth.uid()
        and members.restaurant_id = gm_terminals.restaurant_id
    )
) with check (
    exists (
        select 1 from members
        where members.user_id = auth.uid()
        and members.restaurant_id = gm_terminals.restaurant_id
    )
);

-- 3. Trigger for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_gm_terminals_updated_at
    before update on gm_terminals
    for each row
    execute function update_updated_at_column();
