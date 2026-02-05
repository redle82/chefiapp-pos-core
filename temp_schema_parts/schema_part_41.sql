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
;
-- Create daily_closings table
CREATE TABLE IF NOT EXISTS public.daily_closings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    sales_gross INTEGER NOT NULL DEFAULT 0, -- Total orders amount
    sales_net INTEGER NOT NULL DEFAULT 0, -- Total after potential refunds (future)
    
    payment_methods JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "cash": 1000, "card": 2000 }
    
    cash_register_balance INTEGER NOT NULL DEFAULT 0, -- Expected cash
    cash_counted INTEGER NOT NULL DEFAULT 0, -- Physical count
    cash_difference INTEGER NOT NULL DEFAULT 0, -- Over/Short
    
    notes TEXT,
    
    created_by UUID REFERENCES auth.users(id), -- User who closed
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for internal users" ON public.daily_closings FOR
SELECT USING (
    auth.uid() IN (
        SELECT user_id
        FROM public.restaurant_members
        WHERE restaurant_id = daily_closings.restaurant_id
    )
);

CREATE POLICY "Enable insert access for internal users" ON public.daily_closings FOR
INSERT WITH CHECK (
    auth.uid() IN (
        SELECT user_id
        FROM public.restaurant_members
        WHERE restaurant_id = daily_closings.restaurant_id
    )
);

-- RPC: Close Day
-- Calculates totals, closes turns, saves snapshot.
CREATE OR REPLACE FUNCTION public.close_day(
    p_restaurant_id UUID,
    p_counted_cash INTEGER,
    p_notes TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_last_closing TIMESTAMPTZ;
    v_start_period TIMESTAMPTZ;
    v_now TIMESTAMPTZ := now();
    v_gross INTEGER := 0;
    v_cash_balance INTEGER := 0;
    v_payment_methods JSONB := '{}'::jsonb;
    v_closing_id UUID;
    v_record RECORD;
BEGIN
    -- 1. Determine Start of Period (Last closing time or genesis)
    SELECT closed_at INTO v_last_closing
    FROM public.daily_closings
    WHERE restaurant_id = p_restaurant_id
    ORDER BY closed_at DESC
    LIMIT 1;

    IF v_last_closing IS NULL THEN
        -- Fallback to first order ever or 24h ago? Let's use 2000-01-01 for genesis
        v_start_period := '2000-01-01 00:00:00+00';
    ELSE
        v_start_period := v_last_closing;
    END IF;

    -- 2. Calculate Totals from Orders (Completed/Paid)
    -- We assume 'completed' status means paid in this simplified model.
    -- Or we check payment_status = 'paid'.
    
    FOR v_record IN 
        SELECT 
            payment_method, 
            SUM(total_amount) as method_total
        FROM public.gm_orders
        WHERE restaurant_id = p_restaurant_id
          AND created_at > v_start_period
          AND (status = 'completed' OR status = 'delivered' OR status = 'ready') 
          -- Ideally check payment_status = 'paid' if robust, but let's stick to status for now or assume all non-cancelled are valid sales for Z-Report logic
          AND status != 'canceled'
        GROUP BY payment_method
    LOOP
        -- Accumulate Gross
        v_gross := v_gross + COALESCE(v_record.method_total, 0);
        
        -- Build Payment Methods JSON
        v_payment_methods := jsonb_set(
            v_payment_methods, 
            ARRAY[COALESCE(v_record.payment_method, 'unknown')], 
            to_jsonb(COALESCE(v_record.method_total, 0))
        );
        
        -- Accumulate System Cash
        IF v_record.payment_method = 'cash' THEN
            v_cash_balance := v_cash_balance + COALESCE(v_record.method_total, 0);
        END IF;
    END LOOP;

    -- 3. Close Active Turn Sessions
    UPDATE public.turn_sessions
    SET 
        ended_at = v_now,
        status = 'closed'
    WHERE restaurant_id = p_restaurant_id
      AND status = 'active';

    -- 4. Insert Closing Record
    INSERT INTO public.daily_closings (
        restaurant_id,
        opened_at,
        closed_at,
        sales_gross,
        sales_net,
        payment_methods,
        cash_register_balance,
        cash_counted,
        cash_difference,
        notes,
        created_by
    ) VALUES (
        p_restaurant_id,
        v_start_period,
        v_now,
        v_gross,
        v_gross, -- Net = Gross for now (no tax/discount logic yet)
        v_payment_methods,
        v_cash_balance,
        p_counted_cash,
        p_counted_cash - v_cash_balance,
        p_notes,
        auth.uid()
    ) RETURNING id INTO v_closing_id;

    -- 5. Return Summary
    RETURN jsonb_build_object(
        'id', v_closing_id,
        'gross', v_gross,
        'cash_diff', p_counted_cash - v_cash_balance
    );
END;
$$;
;
-- Migration: 20260222000000_hardening_audit.sql
-- Description: Closes critical security gaps identified in Audit (Jan 2026)
-- 1. Revokes ANON access to financial tables.
-- 2. Enforces Role-Base Delete protection.
-- 3. Fixes Lazy Policies on Cash Registers.

-- ==============================================================================
-- 1. REVOCATION PROTOCOL (Close Open Doors)
-- ==============================================================================

REVOKE ALL ON public.gm_cash_registers FROM anon;
REVOKE ALL ON public.gm_payments FROM anon;
REVOKE ALL ON public.gm_cash_register_transactions FROM anon;
REVOKE ALL ON public.gm_orders FROM anon;

-- Drop Lazy Policies (Wildcard Access)
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.gm_cash_registers;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.gm_payments;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.gm_cash_register_transactions;

-- ==============================================================================
-- 2. HARDENING CASH REGISTER (Money Table)
-- ==============================================================================

-- Ensure strict RLS exists (Re-asserting if dropped)
ALTER TABLE public.gm_cash_registers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_restaurant_cash_registers" ON public.gm_cash_registers;
CREATE POLICY "users_select_own_restaurant_cash_registers"
    ON public.gm_cash_registers FOR SELECT
    USING (restaurant_id IN (SELECT public.user_restaurant_ids()));

-- ONLY MANAGERS/OWNERS can OPEN/CLOSE (Insert/Update)
DROP POLICY IF EXISTS "users_modify_own_restaurant_cash_registers" ON public.gm_cash_registers;
CREATE POLICY "users_modify_own_restaurant_cash_registers"
    ON public.gm_cash_registers FOR ALL
    USING (
        restaurant_id IN (SELECT public.user_restaurant_ids())
        AND EXISTS (
             SELECT 1 FROM public.gm_restaurant_members 
             WHERE user_id = auth.uid() 
             AND restaurant_id = public.gm_cash_registers.restaurant_id
             AND role IN ('owner', 'manager')
        )
    );

-- ==============================================================================
-- 3. HARDENING ORDERS (Data Integrity)
-- ==============================================================================

-- Restrict DELETE to Managers Only
DROP POLICY IF EXISTS "users_delete_own_restaurant_orders" ON public.gm_orders;
CREATE POLICY "managers_delete_own_restaurant_orders"
    ON public.gm_orders FOR DELETE
    USING (
        restaurant_id IN (SELECT public.user_restaurant_ids())
        AND EXISTS (
             SELECT 1 FROM public.gm_restaurant_members 
             WHERE user_id = auth.uid() 
             AND restaurant_id = public.gm_orders.restaurant_id
             AND role IN ('owner', 'manager')
        )
    );

-- ==============================================================================
-- 4. HARDENING TURN SESSIONS (Session Integrity)
-- ==============================================================================

-- Fix "System can insert sessions" (Wildcard check(true))
DROP POLICY IF EXISTS "System can insert sessions" ON public.turn_sessions;

CREATE POLICY "users_insert_own_sessions"
    ON public.turn_sessions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND restaurant_id IN (SELECT public.user_restaurant_ids())
    );
;
