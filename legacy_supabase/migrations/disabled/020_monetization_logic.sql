-- Migration: 020_monetization_logic.sql
-- Purpose: Allow one-click activation of supplier monetization
create or replace function public.enable_monetization(p_tenant_id uuid) returns json language plpgsql security definer as $$
declare v_campaign_id uuid;
v_placement_id uuid;
v_supplier_id uuid;
begin -- 1. Sentinel: Find or Create 'Estrella Galicia' (Demo Partner)
-- In prod, this would look for "Global" campaigns.
select id into v_supplier_id
from public.suppliers
where slug = 'estrella-galicia'
limit 1;
if v_supplier_id is null then
insert into public.suppliers (name, slug, is_active)
values ('Estrella Galicia', 'estrella-galicia', true)
returning id into v_supplier_id;
end if;
-- 2. Find Active Campaign
select id into v_campaign_id
from public.campaigns
where supplier_id = v_supplier_id
    and type = 'BRANDING'
limit 1;
if v_campaign_id is null then
insert into public.campaigns (supplier_id, name, type, is_active)
values (v_supplier_id, 'Verão 2025', 'BRANDING', true)
returning id into v_campaign_id;
end if;
-- 3. Create Placement (Idempotent)
-- 3. Create Placement (Idempotent)
if not exists (
    select 1
    from public.campaign_placements
    where campaign_id = v_campaign_id
        and tenant_id = p_tenant_id
        and location = 'MENU_HEADER'
) then
insert into public.campaign_placements (campaign_id, tenant_id, location, status)
values (
        v_campaign_id,
        p_tenant_id,
        'MENU_HEADER',
        'ACTIVE'
    );
end if;
-- Assuming we might add specific unique constraint later, but strictly this table doesn't have one in 017. 
-- Re-query to be sure we return a valid ID even if conflict assumed (though 017 logic allowed multiples, we just add one here)
select id into v_placement_id
from public.campaign_placements
where campaign_id = v_campaign_id
    and tenant_id = p_tenant_id
    and location = 'MENU_HEADER'
limit 1;
return json_build_object(
    'status',
    'activated',
    'placement_id',
    v_placement_id,
    'message',
    'Monetization active. Campaign: Verão 2025'
);
end;
$$;