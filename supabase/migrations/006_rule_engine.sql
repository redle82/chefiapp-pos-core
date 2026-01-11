-- 006_rule_engine.sql
-- The Brain: Stores the logic for automated system responses.
create table if not exists public.rule_engine (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid not null,
    -- No foreign key constraint for now to avoid dependency hell, or could link to gm_restaurants(id)
    name text not null,
    description text,
    active boolean default true,
    condition jsonb not null,
    -- The "When"
    action jsonb not null,
    -- The "Then"
    created_at timestamptz default now()
);
-- Index for fast lookup by restaurant (The Engine will need this frequently)
create index if not exists idx_rule_engine_restaurant_id on public.rule_engine(restaurant_id);
-- RLS (Simple ownership)
alter table public.rule_engine enable row level security;
create policy "Owners can view their own rules" on public.rule_engine for
select using (
        restaurant_id in (
            select id
            from public.gm_restaurants
            where owner_id = auth.uid()
        )
    );
create policy "Owners can create their own rules" on public.rule_engine for
insert with check (
        restaurant_id in (
            select id
            from public.gm_restaurants
            where owner_id = auth.uid()
        )
    );
create policy "Owners can update their own rules" on public.rule_engine for
update using (
        restaurant_id in (
            select id
            from public.gm_restaurants
            where owner_id = auth.uid()
        )
    );