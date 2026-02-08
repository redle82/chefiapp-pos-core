-- ==============================================================================
-- ChefIApp Test Database Initialization
-- ==============================================================================

-- Create required schemas for Supabase compatibility
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;

-- Create roles
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- ==============================================================================
-- CORE TABLES
-- ==============================================================================

-- Restaurants (Tenants)
CREATE TABLE IF NOT EXISTS gm_restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    tenant_id UUID,
    owner_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Categories
CREATE TABLE IF NOT EXISTS gm_menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES gm_restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS gm_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES gm_restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES gm_menu_categories(id),
    name TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL DEFAULT 0,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tables
CREATE TABLE IF NOT EXISTS gm_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES gm_restaurants(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    status TEXT DEFAULT 'closed',
    qr_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS gm_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES gm_restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES gm_tables(id),
    table_number INTEGER,
    status TEXT NOT NULL DEFAULT 'OPEN',
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    total_cents INTEGER DEFAULT 0,
    subtotal_cents INTEGER DEFAULT 0,
    tax_cents INTEGER DEFAULT 0,
    discount_cents INTEGER DEFAULT 0,
    source TEXT DEFAULT 'test',
    operator_id UUID,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS gm_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES gm_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES gm_products(id),
    name_snapshot TEXT NOT NULL,
    price_snapshot INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal_cents INTEGER NOT NULL,
    modifiers JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    station TEXT DEFAULT 'kitchen',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff/Employees
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES gm_restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'worker',
    position TEXT NOT NULL DEFAULT 'waiter',
    pin TEXT,
    email TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS gm_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES gm_restaurants(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES employees(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'normal',
    due_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test Metrics (for observability)
CREATE TABLE IF NOT EXISTS test_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES gm_restaurants(id),
    metric_type TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================

CREATE INDEX idx_orders_restaurant ON gm_orders(restaurant_id);
CREATE INDEX idx_orders_status ON gm_orders(status);
CREATE INDEX idx_orders_created ON gm_orders(created_at DESC);
CREATE INDEX idx_order_items_order ON gm_order_items(order_id);
CREATE INDEX idx_order_items_status ON gm_order_items(status);
CREATE INDEX idx_products_restaurant ON gm_products(restaurant_id);
CREATE INDEX idx_tables_restaurant ON gm_tables(restaurant_id);
CREATE INDEX idx_employees_restaurant ON employees(restaurant_id);
CREATE INDEX idx_tasks_restaurant ON gm_tasks(restaurant_id);
CREATE INDEX idx_tasks_status ON gm_tasks(status);
CREATE INDEX idx_metrics_restaurant ON test_metrics(restaurant_id);
CREATE INDEX idx_metrics_type ON test_metrics(metric_type);

-- ==============================================================================
-- RLS (Disabled for testing - service_role bypasses anyway)
-- ==============================================================================

ALTER TABLE gm_restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE gm_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE gm_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gm_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE gm_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE gm_tasks ENABLE ROW LEVEL SECURITY;

-- Allow all for service_role (test environment)
CREATE POLICY "service_role_all" ON gm_restaurants FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON gm_orders FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON gm_order_items FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON gm_products FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON gm_tables FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON employees FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON gm_tasks FOR ALL TO service_role USING (true);

-- ==============================================================================
-- REALTIME
-- ==============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE gm_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE gm_order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE gm_tasks;

-- Done
SELECT 'Database initialized successfully' AS status;
