-- Migration: 019_analytics_rpc.sql
-- Purpose: analytics RPC for recording impressions
create or replace function public.record_impression(
        p_tenant_id uuid,
        p_placement_id uuid default null,
        p_event_type text default 'VIEW'
    ) returns void language plpgsql security definer as $$ begin
insert into public.analytics_impressions (tenant_id, placement_id, event_type)
values (p_tenant_id, p_placement_id, p_event_type);
end;
$$;