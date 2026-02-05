-- Migration: 030_anti_ghost_columns.sql
-- Purpose: Add Anti gHost Restaurant columns to support Reality Gate
alter table public.gm_restaurants
add column if not exists verification_status text default 'draft',
    -- draft | verified | rejected
add column if not exists verified_at timestamptz,
    add column if not exists verification_method text,
    -- places | doc | ip | payment | qr_local
add column if not exists menu_publish_enabled boolean default false;
comment on column public.gm_restaurants.verification_status is 'draft: onboarding done but unverified. verified: verified existence.';
comment on column public.gm_restaurants.menu_publish_enabled is 'Only true if verification_status is verified or active.';