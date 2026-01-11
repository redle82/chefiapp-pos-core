-- Phase F: Backend Real Mínimo (Sovereign Identity)
-- Date: 2025-12-27
-- Context: Formally implements the "Sovereign Link" between Auth (Google/Apple) and Data.
-- 1. Members Table (The Link between Identity and Tenant)
create table if not exists members (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    restaurant_id uuid not null references restaurant_web_profiles(restaurant_id) on delete cascade,
    role text not null check (role in ('owner', 'manager', 'staff')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(user_id, restaurant_id)
);
-- Index for fast RLS lookups
create index if not exists idx_members_user on members(user_id);
create index if not exists idx_members_restaurant on members(restaurant_id);
-- 2. RLS: Enable on all critical tables
alter table members enable row level security;
alter table restaurant_web_profiles enable row level security;
alter table web_orders enable row level security;
-- 3. RLS Policies (Sovereign Identity)
-- Members: Users can see their own memberships
create policy "Users can view own memberships" on members for
select using (auth.uid() = user_id);
-- Restaurants:
-- Public Config: Public read for menu pages (public store)
create policy "Public can view restaurants" on restaurant_web_profiles for
select using (true);
-- Secure Write: Only owners can update restaurant details
create policy "Owners can update restaurant" on restaurant_web_profiles for
update using (
        exists (
            select 1
            from members
            where members.user_id = auth.uid()
                and members.restaurant_id = restaurant_web_profiles.restaurant_id
                and members.role = 'owner'
        )
    );
-- Orders:
-- Members can view orders for their restaurant (TPV / KDS / Staff)
create policy "Members can view orders" on web_orders for
select using (
        exists (
            select 1
            from members
            where members.user_id = auth.uid()
                and members.restaurant_id = web_orders.restaurant_id
        )
    );
-- Members can create orders (TPV/Staff)
create policy "Members can create orders" on web_orders for
insert with check (
        exists (
            select 1
            from members
            where members.user_id = auth.uid()
                and members.restaurant_id = web_orders.restaurant_id
        )
    );
-- Members can update orders (Kitchen / Staff statuses)
create policy "Members can update orders" on web_orders for
update using (
        exists (
            select 1
            from members
            where members.user_id = auth.uid()
                and members.restaurant_id = web_orders.restaurant_id
        )
    );