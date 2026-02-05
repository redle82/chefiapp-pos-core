-- GENESIS RECOVERY V2
-- Recreating missing core tables inferred from codebase usage.
-- 1. Tenants (SaaS Foundation)
CREATE TABLE IF NOT EXISTS public.saas_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. Restaurants (The Core Entity)
CREATE TABLE IF NOT EXISTS public.gm_restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.saas_tenants(id),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    owner_id UUID,
    -- References auth.users implicitly or explicitly
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 3. Users/Members (Simplified)
CREATE TABLE IF NOT EXISTS public.saas_tenants_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.saas_tenants(id),
    user_id UUID NOT NULL,
    -- References auth.users implicitly
    role TEXT DEFAULT 'staff',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 4. Menu System
CREATE TABLE IF NOT EXISTS public.gm_menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.gm_restaurants(id),
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.gm_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.gm_restaurants(id),
    category_id UUID REFERENCES public.gm_menu_categories(id),
    name TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL DEFAULT 0,
    photo_url TEXT,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 5. Tables (Physical)
CREATE TABLE IF NOT EXISTS public.gm_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.gm_restaurants(id),
    number INTEGER NOT NULL,
    qr_code TEXT,
    status TEXT DEFAULT 'closed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 6. Orders (Sovereign Ledger)
CREATE TABLE IF NOT EXISTS public.gm_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.gm_restaurants(id),
    table_id UUID REFERENCES public.gm_tables(id),
    table_number INTEGER,
    status TEXT NOT NULL DEFAULT 'OPEN',
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    total_cents INTEGER DEFAULT 0,
    subtotal_cents INTEGER DEFAULT 0,
    tax_cents INTEGER DEFAULT 0,
    discount_cents INTEGER DEFAULT 0,
    source TEXT DEFAULT 'tpv',
    operator_id UUID,
    cash_register_id UUID,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.gm_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.gm_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.gm_products(id),
    name_snapshot TEXT NOT NULL,
    price_snapshot INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal_cents INTEGER NOT NULL,
    modifiers JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 7. Empire Telemetry (The Eye)
CREATE TABLE IF NOT EXISTS public.empire_pulses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_slug TEXT NOT NULL,
    tenant_slug TEXT NOT NULL,
    restaurant_id UUID,
    -- For legacy indexing compatibility
    heartbeat TIMESTAMPTZ NOT NULL,
    metrics JSONB DEFAULT '{}'::jsonb,
    events JSONB DEFAULT '[]'::jsonb,
    risk JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 8. Onboarding Telemetry (The Path)
CREATE TABLE IF NOT EXISTS public.onboarding_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    -- References auth.users implicitly
    restaurant_id UUID,
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 9. Legacy Views (Compatibility Layer)
CREATE OR REPLACE VIEW public.restaurant_members AS
SELECT *
FROM public.saas_tenants_members;