-- 007_onboarding_v2.sql
-- Adding behavioral fields for Onboarding v2 (Team & Mode)
alter table public.gm_restaurants
add column if not exists team_size text,
    add column if not exists operation_mode text;
-- Add comment to document values
comment on column public.gm_restaurants.team_size is 'Range: 1-5, 6-15, 15+';
comment on column public.gm_restaurants.operation_mode is 'Gamified, Executive, etc.';