-- Migration: 028_sovereign_columns.sql
-- Purpose: Add columns required by the Sovereign System Blueprint
alter table public.gm_restaurants
add column if not exists team_size text default '1-5',
    add column if not exists operation_mode text default 'Gamified',
    add column if not exists menu_strategy text default 'Quick',
    add column if not exists blueprint_version text default '2.0.0-SOVEREIGN',
    add column if not exists sealed_at timestamptz;
-- Add comments for clarity
comment on column public.gm_restaurants.operation_mode is 'Gamified or Executive';
comment on column public.gm_restaurants.menu_strategy is 'Quick or Manual';