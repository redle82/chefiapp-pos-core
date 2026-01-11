-- Migration: 021_fix_restaurants_schema.sql
-- Purpose: Add missing columns to gm_restaurants to support Atomic Onboarding RPC
alter table public.gm_restaurants
add column if not exists status text default 'active',
    add column if not exists country text default 'PT',
    add column if not exists plan text default 'free',
    add column if not exists city text,
    add column if not exists type text default 'Restaurante',
    add column if not exists updated_at timestamptz default now();
-- Optional: Add indexes if needed
create index if not exists idx_restaurants_owner on public.gm_restaurants(owner_id);
create index if not exists idx_restaurants_slug on public.gm_restaurants(slug);