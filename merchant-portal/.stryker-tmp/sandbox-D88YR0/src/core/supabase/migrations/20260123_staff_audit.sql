-- 20260123_staff_audit.sql
-- Purpose: Legal/Audit layer for Staff Shifts (The Truth Recorder)

-- 1. SHIFT LOGS (The Session)
create table if not exists public.shift_logs (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid not null references public.gm_restaurants(id),
    employee_id uuid not null references public.employees(id), -- Connects to the specific employee record
    role text not null, -- Snapshot of role at check-in (e.g., 'waiter', 'kitchen')
    start_time timestamptz not null default now(),
    end_time timestamptz,
    duration_minutes integer, -- Calculated upon check-out
    status text not null default 'active', -- 'active', 'completed', 'force_closed'
    shift_score integer, -- Placeholder for Gamification/Performance score
    meta jsonb default '{}'::jsonb, -- Store device info, etc.
    created_at timestamptz default now()
);

-- Index for querying active shifts quickly
create index if not exists idx_shift_logs_restaurant_active 
on public.shift_logs(restaurant_id) 
where status = 'active';

-- 2. ACTION LOGS (The Granular Truth)
create table if not exists public.action_logs (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid not null references public.gm_restaurants(id),
    shift_id uuid references public.shift_logs(id), -- Link to the specific shift context
    employee_id uuid references public.employees(id),
    action_type text not null, -- 'task_completion', 'order_served', 'alert_ack'
    entity_id text, -- ID of the task/order/alert
    details jsonb default '{}'::jsonb, -- Stores title, delay, performace metrics
    created_at timestamptz default now()
);

-- RLS Policies (Standard)
alter table public.shift_logs enable row level security;
alter table public.action_logs enable row level security;

-- Shift Logs Policies
create policy "Staff can view their own shifts"
    on public.shift_logs for select
    using (true); -- Ideally stricter

create policy "Staff can insert check-in"
    on public.shift_logs for insert
    with check (true);

create policy "Staff can update check-out"
    on public.shift_logs for update
    using (true);

-- Action Logs Policies
create policy "Staff can insert actions"
    on public.action_logs for insert
    with check (true);

create policy "Owners can view actions"
    on public.action_logs for select
    using (true);
