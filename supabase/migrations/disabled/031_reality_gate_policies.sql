-- Migration: 031_reality_gate_policies.sql
-- Purpose: Enforce Reality Gate - No Menu for Ghosts.
-- 1. Enable RLS on Menu Tables (if not already enabled)
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
-- 2. Create Policy Function to check Reality Status
-- This function checks if the user's restaurant is verified.
create or replace function public.check_reality_gate(p_restaurant_id uuid) returns boolean language plpgsql security definer as $$
declare v_status text;
begin
select verification_status into v_status
from public.gm_restaurants
where id = p_restaurant_id;
-- Allow if verified OR active. Block if draft or null.
-- (Adjust 'active' if your schema uses 'active' as a legacy status, verify alignment with Migration 030)
return v_status in ('verified', 'active');
end;
$$;
-- 3. Policy for MENU CATEGORIES (Insert/Update)
create policy "Reality Gate: Categories require Verification" on public.menu_categories for
insert with check (
        -- User must be a member AND restaurant must be verified
        public.check_restaurant_access(restaurant_id) -- Existing check assumed or we can rely on RLS if user is owner
        AND public.check_reality_gate(restaurant_id)
    );
create policy "Reality Gate: Update Categories" on public.menu_categories for
update using (
        public.check_restaurant_access(restaurant_id)
        AND public.check_reality_gate(restaurant_id)
    );
-- 4. Policy for MENU ITEMS (Insert/Update)
create policy "Reality Gate: Items require Verification" on public.menu_items for
insert with check (
        public.check_restaurant_access(restaurant_id)
        AND public.check_reality_gate(restaurant_id)
    );
create policy "Reality Gate: Update Items" on public.menu_items for
update using (
        public.check_restaurant_access(restaurant_id)
        AND public.check_reality_gate(restaurant_id)
    );
-- Note: We allow SELECT (viewing) even in draft, maybe? 
-- Or strict block? 
-- Let's allowed SELECT so the Owner can see "Empty State".
-- READ policies usually just check membership.