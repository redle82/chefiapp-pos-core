-- ALIGNMENT WITH MERCHANT PORTAL SCHEMA
-- Use this schema to ensure Mobile App and Merchant Portal share the same data structures.

-- Enable RLS
alter table auth.users enable row level security;

-- RESTAURANTS TABLE (Minimal Definition for Context)
create table if not exists public.gm_restaurants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.gm_restaurants enable row level security;
create policy "Public Read Restaurants" on public.gm_restaurants for select using (true);
create policy "Auth Insert Restaurants" on public.gm_restaurants for insert to authenticated with check (true);

-- PRODUCTS TABLE (gm_products)
create table if not exists public.gm_products (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.gm_restaurants(id), -- Optional constraint
  category text, -- Can be UUID or Text depending on Portal version
  name text not null,
  description text,
  price_cents integer not null default 0,
  available boolean default true,
  visibility jsonb default '{"tpv": true, "mobile": true}'::jsonb,
  track_stock boolean default false,
  stock_quantity integer default 0,
  image_url text, 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.gm_products enable row level security;
create policy "Enable all access for authenticated users" on public.gm_products for all to authenticated using (true) with check (true);


-- ORDERS TABLE (gm_orders)
create table if not exists public.gm_orders (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.gm_restaurants(id),
  table_id text, -- Identifier for Table entity
  table_number text, -- Human readable number
  status text not null default 'OPEN', -- 'OPEN', 'IN_PREP', 'READY', 'PAID', 'CANCELLED', or 'pending'
  total_amount integer not null default 0, -- Cents
  customer_id uuid, -- Optional link to CRM
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.gm_orders enable row level security;
create policy "Enable all access for authenticated users" on public.gm_orders for all to authenticated using (true) with check (true);
-- Realtime
alter publication supabase_realtime add table public.gm_orders;


-- ORDER ITEMS TABLE (gm_order_items)
create table if not exists public.gm_order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.gm_orders(id) on delete cascade not null,
  product_id uuid, -- Optional link to product
  product_name text not null, -- Renamed from name
  price_cents integer default 0, -- Legacy?
  unit_price integer not null default 0,
  total_price integer not null default 0, -- unit_price * quantity
  quantity integer default 1,
  notes text,
  category_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.gm_order_items enable row level security;
create policy "Enable all access for authenticated users" on public.gm_order_items for all to authenticated using (true) with check (true);
alter publication supabase_realtime add table public.gm_order_items;

-- SEED DATA HELP (Optional)
-- insert into public.gm_restaurants (name) values ('My Demo Restaurant');
-- Then use that ID to insert products.

-- Tasks Table (for Staff Sync)
create table if not exists public.gm_tasks (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid, -- references public.gm_restaurants(id),
  title text not null,
  priority text not null default 'attention',
  status text not null default 'pending',
  assigned_roles text[] not null default '{}',
  category text not null default 'adhoc',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for tasks
alter table public.gm_tasks enable row level security;
create policy "Allow all access for authenticated users to tasks" on public.gm_tasks for all using (true);
alter publication supabase_realtime add table public.gm_tasks;


-- SHIFTS TABLE (gm_shifts) - Added for Phase 4
create table if not exists public.gm_shifts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  restaurant_id uuid references public.gm_restaurants(id),
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone,
  cash_start integer default 0,
  cash_end integer default 0,
  opening_float integer default 0, -- Set by Manager at Open
  closing_cash_actual integer default 0, -- Counted by Manager at Close
  cash_difference integer default 0, -- Calculated discrepancy
  status text default 'open' -- 'open', 'closed'
);

alter table public.gm_shifts enable row level security;
create policy "Enable all access for authenticated users" on public.gm_shifts for all to authenticated using (true) with check (true);
alter publication supabase_realtime add table public.gm_shifts;

-- NOTE FOR DEPLOYMENT:
-- You must manually run:
-- alter table public.gm_orders add column shift_id uuid references public.gm_shifts(id);
-- alter table public.gm_orders add column user_id uuid references auth.users(id);
-- alter table public.gm_orders add column waiter_name text;


-- =============================================================================
-- PHASE 10: CUSTOMER CRM (The "Hospitality Brain")
-- =============================================================================

create table if not exists public.gm_customers (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.gm_restaurants(id),
  phone text not null,
  name text,
  total_visits integer default 0,
  total_spend integer default 0, -- in cents
  last_visit timestamp with time zone,
  loyalty_points integer default 0,
  loyalty_tier text default 'bronze', -- bronze, silver, gold, platinum
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(restaurant_id, phone)
);

alter table public.gm_customers enable row level security;
create policy "Enable all access for authenticated users" on public.gm_customers for all to authenticated using (true) with check (true);

-- RPC for Stats
create or replace function public.increment_customer_stats(p_customer_id uuid, p_amount int)
returns void as $$
begin
  update public.gm_customers
  set 
    total_visits = total_visits + 1,
    total_spend = total_spend + p_amount,
    last_visit = now()
  where id = p_customer_id;
end;
$$ language plpgsql security definer;

-- Add Foreign Key to Orders if not already present (manual run usually)
-- alter table public.gm_orders add constraint fk_customer foreign key (customer_id) references public.gm_customers(id);


-- =============================================================================
-- PHASE 6: INVENTORY SYSTEM (The "Ledger")
-- =============================================================================

-- 1. Inventory Log (Audit Trail)
-- Tracks every stock movement. 
-- "Who moved my cheese?"
create table if not exists public.gm_inventory_log (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.gm_restaurants(id),
  product_id uuid references public.gm_products(id),
  product_name text, -- Snapshot
  change_amount integer not null, -- negative for sales, positive for restock
  reason text, -- 'sale', 'restock', 'waste'
  reference_id uuid, -- link to order_id or correction_id
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.gm_inventory_log enable row level security;
create policy "Enable all access for authenticated users" on public.gm_inventory_log for all to authenticated using (true) with check (true);


-- 2. Deduct Inventory Function
-- "The Enforcer": Runs when an order is PAID.
create or replace function public.fn_deduct_inventory()
returns trigger as $$
declare
  item record;
begin
  -- Only run if payment_status changed to 'paid'
  -- OR if status changed to 'PAID' (depending on how the app updates it)
  if (new.payment_status = 'paid' and (old.payment_status is null or old.payment_status != 'paid')) then
    
    -- Loop through all items in this order
    for item in 
      select * from public.gm_order_items where order_id = new.id
    loop
      -- 1. Deduct Stock (only if product_id exists)
      if item.product_id is not null then
        update public.gm_products
        set stock_quantity = stock_quantity - item.quantity
        where id = item.product_id and track_stock = true;

        -- 2. Create Audit Log
        insert into public.gm_inventory_log (
          restaurant_id, 
          product_id, 
          product_name, 
          change_amount, 
          reason, 
          reference_id
        ) values (
          new.restaurant_id,
          item.product_id,
          item.product_name,
          -1 * item.quantity, -- Negative number for deduction
          'sale',
          new.id
        );
      end if;
    end loop;
  end if;
  return new;
end;
$$ language plpgsql security definer;


-- 3. Trigger Definition
-- "The Trap"
drop trigger if exists trg_deduct_inventory on public.gm_orders;
create trigger trg_deduct_inventory
after update on public.gm_orders
for each row
execute function public.fn_deduct_inventory();

-- =============================================================================
-- PHASE 20: CASH MANAGEMENT ("The Vault")
-- =============================================================================

create table if not exists public.gm_cash_movements (
  id uuid default gen_random_uuid() primary key,
  shift_id uuid references public.gm_shifts(id),
  type text not null, -- 'supply' (drop/in) or 'bleed' (out)
  amount integer not null, -- in cents
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.gm_cash_movements enable row level security;
create policy "Enable all access for authenticated users" on public.gm_cash_movements for all to authenticated using (true) with check (true);

-- =============================================================================
-- PHASE 35: FINANCIAL SHIFT ISOLATION ("The Vault") 🔐
-- =============================================================================

create table if not exists public.gm_financial_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  restaurant_id uuid references public.gm_restaurants(id),
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  closed_at timestamp with time zone,
  starting_float integer default 0,
  closing_cash_actual integer default 0,
  cash_difference integer default 0,
  status text default 'open', -- 'open', 'closed', 'verified'
  notes text
);

alter table public.gm_financial_sessions enable row level security;
create policy "Enable all access for authenticated users" on public.gm_financial_sessions for all to authenticated using (true) with check (true);
alter publication supabase_realtime add table public.gm_financial_sessions;

-- Add session_id to movements (manual run required for existing tables if using migration approach)
-- alter table public.gm_cash_movements add column session_id uuid references public.gm_financial_sessions(id);

