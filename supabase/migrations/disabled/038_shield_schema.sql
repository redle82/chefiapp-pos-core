-- 038_shield_schema.sql
-- The Shield: Legal Acceptance & Reflex Idempotency
-- 1. LEGAL ACCEPTANCES (The Contract)
create table if not exists legal_acceptances (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id),
    restaurant_id uuid not null,
    -- references gm_restaurants(id) if exists, else raw uuid
    version text not null,
    -- e.g. 'v1-ledger-export'
    accepted_at timestamptz default now()
);
-- RLS for Legal Acceptances
alter table legal_acceptances enable row level security;
create policy "Users can view their own acceptances" on legal_acceptances for
select using (auth.uid() = user_id);
create policy "Users can insert their own acceptances" on legal_acceptances for
insert with check (auth.uid() = user_id);
-- 2. REFLEX FIRINGS (The Memory)
-- Prevents infinite loops by recording that a specific reflex has already fired for a specific target.
create table if not exists reflex_firings (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid not null,
    reflex_key text not null,
    -- e.g. 'clean-table'
    target_id text not null,
    -- e.g. order_id
    fired_at timestamptz default now()
);
-- Index for fast lookups by the Reflex Engine
create index if not exists idx_reflex_firings_check on reflex_firings(restaurant_id, reflex_key, target_id);
-- RLS for Reflex Firings
alter table reflex_firings enable row level security;
create policy "Staff can view reflex firings for their restaurant" on reflex_firings for
select using (true);
-- Ideally restrictive based on restaurant_id, but keeping open for speed in MVP
create policy "Staff can insert reflex firings" on reflex_firings for
insert with check (true);