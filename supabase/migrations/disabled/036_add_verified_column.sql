-- Migration: 036_add_verified_column.sql
-- Purpose: Support the activation flow by adding tracking columns to gm_restaurants.
alter table public.gm_restaurants
add column if not exists verified_at timestamp with time zone,
    add column if not exists verification_status text default 'draft',
    -- 'draft', 'verified'
add column if not exists verification_method text;
-- 'google', 'manual'
-- Index for faster lookups on status
create index if not exists idx_gm_restaurants_status on public.gm_restaurants(status);