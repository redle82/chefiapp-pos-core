-- 005_onboarding_persistence.sql
-- Purpose: Store identity details from the 3-Step Onboarding Flow due to new requirement.
-- Add columns to gm_restaurants (if they don't exist)
ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS type TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
-- Comment for documentation
COMMENT ON COLUMN public.gm_restaurants.type IS 'Operation Type (e.g., Restaurante, Bar, Café)';
COMMENT ON COLUMN public.gm_restaurants.city IS 'City of operation (Onboarding input)';
COMMENT ON COLUMN public.gm_restaurants.onboarding_completed_at IS 'Timestamp when the user finished the 3-step wizard';;
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
    );;
-- 007_onboarding_v2.sql
-- Adding behavioral fields for Onboarding v2 (Team & Mode)
alter table public.gm_restaurants
add column if not exists team_size text,
    add column if not exists operation_mode text;
-- Add comment to document values
comment on column public.gm_restaurants.team_size is 'Range: 1-5, 6-15, 15+';
comment on column public.gm_restaurants.operation_mode is 'Gamified, Executive, etc.';;
