-- Create ENUMs for Operational Modes and Status
create type operational_mode as enum ('tower', 'rush', 'training');
create type turn_status as enum ('active', 'closed', 'force_closed');

-- Create Turn Sessions Table
create table public.turn_sessions (
    id uuid not null default gen_random_uuid(),
    restaurant_id uuid not null references public.gm_restaurants(id),
    user_id uuid not null references auth.users(id),
    
    role_at_turn text not null, -- Snapshot of role permissions
    operational_mode operational_mode not null default 'rush',
    
    device_id text not null, -- Unique identifier for the device
    device_name text,
    
    started_at timestamptz not null default now(),
    ended_at timestamptz,
    status turn_status not null default 'active',
    
    permissions_snapshot jsonb not null default '{}'::jsonb,
    metadata jsonb default '{}'::jsonb,

    constraint turn_sessions_pkey primary key (id),
    -- Ensure only one active turn per user per device
    constraint one_active_turn_per_device_unique unique (user_id, device_id, status)
);

-- Index for "Guardians" (Quick lookup for active sessions)
create index idx_turn_sessions_active on public.turn_sessions(restaurant_id, device_id) where status = 'active';

-- Enable RLS
alter table public.turn_sessions enable row level security;

-- RLS Policies
create policy "Users can view their own sessions" on public.turn_sessions
    for select using (auth.uid() = user_id);

create policy "Managers can view all sessions for their restaurant" on public.turn_sessions
    for select using (
        exists (
            select 1 from public.gm_restaurant_members
            where user_id = auth.uid()
            and restaurant_id = public.turn_sessions.restaurant_id
            and role in ('owner', 'manager')
        )
    );

create policy "System can insert sessions" on public.turn_sessions
    for insert with check (true); -- Controlled via RPC, but allow insert for authenticated users

create policy "Users can update their own sessions" on public.turn_sessions
    for update using (auth.uid() = user_id);

-- RPC: Start Turn (Guardian Logic)
create or replace function public.start_turn(
    p_restaurant_id uuid,
    p_operational_mode operational_mode,
    p_device_id text,
    p_device_name text,
    p_role_at_turn text,
    p_permissions_snapshot jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_existing_session_id uuid;
    v_user_role text; -- Real role from DB check
    v_new_session_id uuid;
begin
    -- Guardian 1: Check if "Tower" mode is requested, ensure user is Manager/Owner
    if p_operational_mode = 'tower' then
        select role into v_user_role
        from public.gm_restaurant_members
        where user_id = auth.uid() and restaurant_id = p_restaurant_id;

        if v_user_role not in ('owner', 'manager') then
            return jsonb_build_object('success', false, 'error', 'TOWER_MODE_FORBIDDEN');
        end if;
    end if;

    -- Guardian 2: Check for existing active session for THIS user on THIS device
    select id into v_existing_session_id
    from public.turn_sessions
    where user_id = auth.uid()
    and device_id = p_device_id
    and status = 'active'
    limit 1;

    if v_existing_session_id is not null then
        -- Auto-resume: Return the existing session
        return jsonb_build_object(
            'success', true, 
            'session_id', v_existing_session_id, 
            'resumed', true
        );
    end if;

    -- Guardian 3: Check for active session for OTHER users on THIS device
    -- (Optional: For now, we allow multi-user login on same device if different browser context, 
    -- but usually we want to warn. Here we just proceed as we are creating a new session).

    -- Create New Session
    insert into public.turn_sessions (
        restaurant_id, user_id, role_at_turn, operational_mode, 
        device_id, device_name, permissions_snapshot, status
    ) values (
        p_restaurant_id, auth.uid(), p_role_at_turn, p_operational_mode,
        p_device_id, p_device_name, p_permissions_snapshot, 'active'
    ) returning id into v_new_session_id;

    return jsonb_build_object(
        'success', true, 
        'session_id', v_new_session_id, 
        'resumed', false
    );
end;
$$;
