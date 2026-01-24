
-- 1. APP TASKS (The Physical Task)
CREATE TABLE IF NOT EXISTS app_tasks (
    id TEXT PRIMARY KEY, -- "clean-table-5-abcd"
    restaurant_id UUID REFERENCES gm_restaurants(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, done, skipped
    priority TEXT NOT NULL DEFAULT 'normal', -- high, normal, low
    type TEXT NOT NULL DEFAULT 'general', -- maintenance, service, kitchen
    assignee_role TEXT, -- waiter, kitchen, manager
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES employees(id)
);

-- RLS for app_tasks
ALTER TABLE app_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view tasks" ON app_tasks
    FOR SELECT USING (restaurant_id = (SELECT restaurant_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "Staff can insert tasks" ON app_tasks
    FOR INSERT WITH CHECK (restaurant_id = (SELECT restaurant_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "Staff can update tasks" ON app_tasks
    FOR UPDATE USING (restaurant_id = (SELECT restaurant_id FROM employees WHERE id = auth.uid()));


-- 2. REFLEX FIRINGS (The Idempotency Log)
CREATE TABLE IF NOT EXISTS reflex_firings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES gm_restaurants(id) NOT NULL,
    reflex_key TEXT NOT NULL, -- "clean-table"
    target_id TEXT NOT NULL, -- order_id or table_id
    fired_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, reflex_key, target_id) -- The Idempotency Constraint
);

-- RLS for reflex_firings
ALTER TABLE reflex_firings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view firings" ON reflex_firings
    FOR SELECT USING (restaurant_id = (SELECT restaurant_id FROM employees WHERE id = auth.uid()));

CREATE POLICY "Staff can insert firings" ON reflex_firings
    FOR INSERT WITH CHECK (restaurant_id = (SELECT restaurant_id FROM employees WHERE id = auth.uid()));
