-- Phase H: Commercial Readiness (Observability)
-- Date: 2025-12-27
-- Context: Basic centralized logging for debugging production issues.
-- 1. Logs Table
create table if not exists app_logs (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid references restaurant_web_profiles(restaurant_id),
    -- Optional (might happen before auth)
    level text not null,
    -- 'info', 'warn', 'error'
    message text not null,
    details jsonb,
    -- Stack trace, context
    url text,
    -- Where it happened
    user_agent text,
    created_at timestamptz not null default now()
);
-- 2. RLS
-- Staff can INSERT logs (even anon maybe? for crash reports before login?)
-- Let's allow authenticated insert.
alter table app_logs enable row level security;
create policy "Authenticated users can insert logs" on app_logs for
insert with check (auth.role() = 'authenticated');
-- Also allow Anon to insert logs? (For login failures)
-- create policy "Anon can insert logs" on app_logs for insert with check (true);
-- Let's stick to authenticated for now to avoid spam, unless specified.
-- Requirement: "Centralized error logging". Usually implies catching crashes.
-- I'll enable anon insert for robust error tracking.
create policy "Anon can insert logs" on app_logs for
insert with check (true);
-- Only Admins (service_role) can SELECT logs. 
-- No public select policy.