-- Migration: 035_activation_rpc.sql
-- Purpose: Enable the transition from 'draft' to 'verified' status.
-- This unblocks the "Activation Gate" on the dashboard.
create or replace function public.activate_restaurant(p_restaurant_id uuid) returns void language plpgsql security definer as $$ begin -- Ensure the user owns the restaurant they are trying to activate
update public.gm_restaurants
set status = 'verified',
    -- In the future, we might distinguish 'verified' (identity check) vs 'active' (billing)
    -- For now, 'verified' releases the functionality.
    verified_at = now(),
    updated_at = now(),
    verification_status = 'verified' -- syncing explicit verification column
where id = p_restaurant_id
    and owner_id = auth.uid();
if not found then raise exception 'Restaurant not found or permission denied.';
end if;
end;
$$;