-- =============================================================================
-- PHASE 35: FINANCIAL SHIFT ISOLATION ("The Vault") 🔐
-- =============================================================================

-- 1. Financial Sessions Application (Tracks Drawer Usage)
-- Decouples "Attendance" from "Money Handling"
create table if not exists public.gm_financial_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  restaurant_id uuid references public.gm_restaurants(id),
  
  -- Timing
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  closed_at timestamp with time zone,
  
  -- Money (in cents)
  starting_float integer default 0,
  closing_cash_actual integer default 0,
  cash_difference integer default 0,
  
  -- State
  status text default 'open', -- 'open', 'closed', 'verified'
  notes text
);

alter table public.gm_financial_sessions enable row level security;
create policy "Enable all access for authenticated users" on public.gm_financial_sessions for all to authenticated using (true) with check (true);
alter publication supabase_realtime add table public.gm_financial_sessions;

-- 2. Update Cash Movements to link to Session
-- We add 'session_id' as a FK. Eventually we deprecate 'shift_id'.
-- For now, allow both to accept migration.

do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_name='gm_cash_movements' and column_name='session_id') then
        alter table public.gm_cash_movements add column session_id uuid references public.gm_financial_sessions(id);
    end if;
end $$;
