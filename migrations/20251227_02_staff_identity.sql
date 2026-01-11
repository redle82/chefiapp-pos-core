-- Phase H: Commercial Readiness (Identity)
-- Date: 2025-12-27
-- Context: Adds human-readable fields to 'members' to allow staff listing without complex auth.users joins.
-- 1. Add Identity Columns
alter table members
add column if not exists email text,
    add column if not exists full_name text;
-- 2. Update Policies (Ensure visibility)
-- (Existing policies already allow members to view other members of the same restaurant?
-- Let's check: "Users can view own memberships" is restrictive: `using (auth.uid() = user_id)`.
-- ERROR: This prevents an Owner from listing their Staff!
-- FIX: We need a policy that says "Members can view ALL members of their restaurant".
drop policy "Users can view own memberships" on members;
create policy "Members can view coworkers" on members for
select using (
        exists (
            -- Select all memberships where the restaurant_id matches one of MY memberships
            select 1
            from members as my_membership
            where my_membership.user_id = auth.uid()
                and my_membership.restaurant_id = members.restaurant_id
        )
    );
-- 3. Update Policy for Operations (Owner can delete/update staff)
create policy "Owners can manage staff" on members for all using (
    exists (
        select 1
        from members as my_membership
        where my_membership.user_id = auth.uid()
            and my_membership.restaurant_id = members.restaurant_id
            and my_membership.role = 'owner'
    )
);
-- 4. Invites System (Simple Link/Code)
create table if not exists invites (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid not null references restaurant_web_profiles(restaurant_id) on delete cascade,
    code text not null unique,
    -- "CHEF-1234" or UUID
    role text not null check (role in ('owner', 'manager', 'staff')),
    created_by uuid references auth.users(id),
    expires_at timestamptz not null default (now() + interval '24 hours'),
    created_at timestamptz not null default now()
);
-- RLS:
alter table invites enable row level security;
-- Owners can create/view invites for their restaurant
create policy "Owners can manage invites" on invites for all using (
    exists (
        select 1
        from members
        where members.user_id = auth.uid()
            and members.restaurant_id = invites.restaurant_id
            and members.role = 'owner'
    )
);
-- Public can Read invite by Code (for joining)
create policy "Public can read invites by code" on invites for
select using (true);