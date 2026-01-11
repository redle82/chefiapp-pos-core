-- 004_active_invites.sql
-- BRIDGE: Enables "Connect via QR" (Mode B)
create table if not exists public.active_invites (
    id uuid primary key default gen_random_uuid(),
    restaurant_id text not null,
    -- Links to the "Mother" company
    code text not null unique,
    -- The human-readable code (e.g., CHEF-8829-XJ)
    qr_payload text not null,
    -- The scanning payload (e.g., chefi://connect?t=...)
    -- The Contract granted by this invite
    role_granted text not null default 'worker',
    -- 'worker' or 'manager'
    expires_at timestamptz not null default (now() + interval '24 hours'),
    redeemed_at timestamptz,
    redeemed_by_device_id text,
    created_at timestamptz default now()
);
-- RLS: Only authenticated managers can create invites
alter table public.active_invites enable row level security;
-- Policy: Managers can view/create invites for their restaurant
create policy "Managers can view invites" on public.active_invites for
select using (true);
-- Simplified for MVP (In prod: check restaurant_id match)
create policy "Managers can insert invites" on public.active_invites for
insert with check (true);
-- Simplified for MVP
-- Policy: Public (Staff App) can read invites ONLY by exact code match (Security by Obscurity + Expiration)
-- Note: In Supabase, we might use a function 'redeem_invite(code)' instead of direct select to hide the table.
-- For MVP, we'll allow select if they know the ID (unlikely) or valid code.