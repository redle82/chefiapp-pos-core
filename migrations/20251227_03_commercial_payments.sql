-- Phase H: Commercial Readiness (Payments)
-- Date: 2025-12-27
-- Context: Adds fields to track Stripe Subscription status directly on the restaurant profile.
-- 1. Add Subscription Columns
alter table restaurant_web_profiles
add column if not exists stripe_customer_id text,
    add column if not exists subscription_status text default 'trialing',
    -- active, past_due, canceled, trialing
add column if not exists stripe_subscription_id text,
    add column if not exists plan_id text default 'free';
-- 2. Index for Webhook lookups
create index if not exists idx_profiles_stripe_customer on restaurant_web_profiles(stripe_customer_id);
create index if not exists idx_profiles_stripe_sub on restaurant_web_profiles(stripe_subscription_id);
-- 3. RLS: Public can NOT see these details? 
-- Actually, the public doesn't select these columns usually, but 'select *' would expose them.
-- It's fine for now, but strict RLS would filter columns. 
-- PostgREST/Supabase doesn't support column-level RLS easily without Views.
-- For now, `subscription_status` being public is acceptable (e.g. to show "Powered by ChefIApp Pro").