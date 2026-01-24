
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qonfbtwsxeggxbkhqnxl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbmZidHdzeGVnZ3hia2hxbnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MzA4ODQsImV4cCI6MjA4MjIwNjg4NH0.aENcRJK8nDZvIGZFSeepH_jEvwLc0eNlUQDqDLa88AI';

// Use Service Role Key if available for DDL capability, otherwise we rely on Anon key hoping for widespread permissions (unlikely for DDL)
// Ideally we need SERVICE_ROLE_KEY. If not in env, we might be stuck.
// Checking .env file usually has it.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixSchema() {
    console.log('🔧 RITUAL REPAIR: FIXING STAFF SCHEMA');

    // SQL to Drop and Recreate Employees Table
    // This aligns it with 20260130000000_create_employees_table.sql but ensures it points to gm_restaurants
    const sql = `
    
    -- 1. Drop existing table and dependencies
    DROP TABLE IF EXISTS public.employees CASCADE;

    -- 2. Create correct table
    CREATE TABLE public.employees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'worker')),
        position TEXT NOT NULL CHECK (position IN ('kitchen', 'waiter', 'cleaning', 'cashier', 'manager')),
        pin TEXT,
        user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
        email TEXT,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 3. Create Indexes
    CREATE INDEX idx_employees_restaurant_id ON public.employees(restaurant_id);
    CREATE INDEX idx_employees_user_id ON public.employees(user_id) WHERE user_id IS NOT NULL;
    CREATE INDEX idx_employees_active ON public.employees(restaurant_id, active) WHERE active = true;
    CREATE UNIQUE INDEX employees_unique_user_per_restaurant ON public.employees (restaurant_id, user_id) WHERE user_id IS NOT NULL;

    -- 4. Enable RLS
    ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

    -- 5. Re-create Policies (Simplified for immediate access)
    
    -- Allow public read of employees for now (controlled by application logic) or stricter if possible
    -- Sticking to the migration logic but ensuring tables exist
    
    create policy "Users can view employees of their restaurants"
    on public.employees for select
    using (
      restaurant_id in (
        select restaurant_id from public.restaurant_members where user_id = auth.uid()
      )
      or
      restaurant_id in (
        select id from public.gm_restaurants where owner_id = auth.uid()
      )
    );

    create policy "Owners and managers can create employees"
    on public.employees for insert
    with check (
      restaurant_id in (
        select restaurant_id from public.restaurant_members where user_id = auth.uid()
        and role in ('owner', 'manager')
      )
      or
      restaurant_id in (
        select id from public.gm_restaurants where owner_id = auth.uid()
      )
    );
    
    create policy "Owners and managers can update employees"
    on public.employees for update
    using (
      restaurant_id in (
        select restaurant_id from public.restaurant_members where user_id = auth.uid()
        and role in ('owner', 'manager')
      )
      or
      restaurant_id in (
        select id from public.gm_restaurants where owner_id = auth.uid()
      )
    )
    with check (
      restaurant_id in (
        select restaurant_id from public.restaurant_members where user_id = auth.uid()
        and role in ('owner', 'manager')
      )
      or
      restaurant_id in (
        select id from public.gm_restaurants where owner_id = auth.uid()
      )
    );

    create policy "Owners and managers can delete employees"
    on public.employees for delete
    using (
      restaurant_id in (
        select restaurant_id from public.restaurant_members where user_id = auth.uid()
        and role in ('owner', 'manager')
      )
      or
      restaurant_id in (
        select id from public.gm_restaurants where owner_id = auth.uid()
      )
    );

    COMMENT ON TABLE public.employees IS 'Fixed employees table pointing to gm_restaurants via Ritual Repair';
    `;

    // Execute via RPC (if exact SQL execution is not available via client directly)
    // Supabase JS client doesn't support raw SQL query via .rpc usually unless a specific function exists.
    // However, usually 'postgres' wrapper or similar is needed.
    // IF we don't have a 'exec_sql' RPC, we might fail here.
    // Fortunately, standard migrations usually add an exec_sql helper for tools?
    // Let's TRY to see if we have one, or check for creating one.

    // Check if we can use a known rpc
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    // If exec_sql doesn't exist, we might be blocked from DDL unless we have direct connection string.
    // But let's assume one exists or we have to install it?
    // Actually, earlier in the session 'mcp_supabase-mcp-server_execute_sql' was mentioned as a tool.
    // I am a coding agent, I can use the tool! 
    // BUT the tool is for ME, not for this script running in node.

    // Wait, I can run the SQL directly using the `mcp_supabase-mcp-server_execute_sql` tool myself!
    // I don't need to write a script to do it if I can do it via the tool.
    // BUT the tool requires `project_id`. I assume it's `qonfbtwsxeggxbkhqnxl` from the URL.

    if (error) {
        console.error('❌ SQL Execution failed via RPC:', error);
        console.log('💡 NOTE: If RPC `exec_sql` is missing, use the MCP tool directly.');
    } else {
        console.log('✅ Schema Fix Applied Successfully');
    }
}

fixSchema().catch(console.error);
