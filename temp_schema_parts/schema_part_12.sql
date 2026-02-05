-- Create ENUM for operation status if it doesn't exist
DO $$ BEGIN CREATE TYPE operation_status AS ENUM ('active', 'paused', 'suspended');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
-- Add operation_status and operation_metadata to gm_restaurants
ALTER TABLE gm_restaurants
ADD COLUMN IF NOT EXISTS operation_status operation_status DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS operation_metadata JSONB DEFAULT '{}'::jsonb;
-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_operation_status ON gm_restaurants(operation_status);
-- Create function to safe update operation status
CREATE OR REPLACE FUNCTION update_operation_status(
        p_restaurant_id UUID,
        p_status operation_status,
        p_reason TEXT DEFAULT NULL,
        p_actor_id UUID DEFAULT NULL
    ) RETURNS VOID AS $$
DECLARE v_metadata JSONB;
BEGIN -- Get current metadata
SELECT operation_metadata INTO v_metadata
FROM gm_restaurants
WHERE id = p_restaurant_id;
-- Update metadata with audit trail (simple version)
v_metadata := v_metadata || jsonb_build_object(
    'last_update',
    now(),
    'reason',
    p_reason,
    'updated_by',
    p_actor_id,
    'previous_status',
    (
        SELECT operation_status
        FROM gm_restaurants
        WHERE id = p_restaurant_id
    )
);
-- Perform update
UPDATE gm_restaurants
SET operation_status = p_status,
    operation_metadata = v_metadata,
    updated_at = now()
WHERE id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql;;
-- 🔧 FIX URGENTE: Onboarding create_tenant_atomic
-- 
-- INSTRUÇÕES:
-- 1. Acesse: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl
-- 2. Vá em SQL Editor
-- 3. Cole TODO este arquivo
-- 4. Clique em RUN
--
-- Isso corrige o erro: "null value in column heartbeat of relation empire_pulses"
CREATE TABLE IF NOT EXISTS public.empire_pulses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_slug TEXT NOT NULL,
    tenant_slug TEXT NOT NULL,
    restaurant_id UUID REFERENCES public.gm_restaurants(id),
    heartbeat TIMESTAMPTZ NOT NULL DEFAULT now(),
    metrics JSONB DEFAULT '{}'::jsonb,
    events JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'healthy',
    type TEXT DEFAULT 'pulse',
    risk JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);
DROP VIEW IF EXISTS public.restaurant_members CASCADE;
CREATE TABLE IF NOT EXISTS public.restaurant_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.gm_restaurants(id),
    user_id UUID REFERENCES auth.users(id),
    role TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.gm_restaurants(id),
    name TEXT,
    sort_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- Agora cria a função corrigida
CREATE OR REPLACE FUNCTION public.create_tenant_atomic(
        p_restaurant_name text,
        p_city text default null,
        p_type text default 'Restaurante',
        p_country text default 'ES',
        p_team_size text default '1-5',
        p_operation_mode text default 'Gamified',
        p_menu_strategy text default 'Quick'
    ) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user_id uuid;
v_user_email text;
v_restaurant_id uuid;
v_slug text;
v_category_id uuid;
v_heartbeat timestamptz;
BEGIN -- Garantir que heartbeat sempre tem valor
v_heartbeat := CURRENT_TIMESTAMP;
-- 1. Get current user context
v_user_id := auth.uid();
v_user_email := auth.email();
IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
-- 2. Idempotency Check
SELECT id INTO v_restaurant_id
FROM public.gm_restaurants
WHERE owner_id = v_user_id
LIMIT 1;
IF v_restaurant_id IS NOT NULL THEN RETURN json_build_object(
    'tenant_id',
    v_restaurant_id,
    'slug',
    (
        SELECT slug
        FROM public.gm_restaurants
        WHERE id = v_restaurant_id
    ),
    'message',
    'Tenant already exists',
    'restored',
    true
);
END IF;
-- 3. Generate Slug
v_slug := lower(
    regexp_replace(p_restaurant_name, '[^a-zA-Z0-9]', '-', 'g')
);
v_slug := trim(
    both '-'
    FROM v_slug
);
v_slug := v_slug || '-' || substr(md5(random()::text), 1, 6);
-- 4. Create Restaurant
INSERT INTO public.gm_restaurants (
        name,
        slug,
        owner_id,
        status,
        country,
        plan,
        city,
        type,
        team_size,
        operation_mode,
        menu_strategy,
        blueprint_version,
        sealed_at,
        created_at,
        updated_at
    )
VALUES (
        p_restaurant_name,
        v_slug,
        v_user_id,
        'draft',
        p_country,
        'trial',
        p_city,
        p_type,
        p_team_size,
        p_operation_mode,
        p_menu_strategy,
        '2.0.0-SOVEREIGN',
        now(),
        now(),
        now()
    )
RETURNING id INTO v_restaurant_id;
-- 5. Upsert Profile
INSERT INTO public.profiles (id, full_name, role, email)
VALUES (v_user_id, 'Comandante', 'owner', v_user_email) ON CONFLICT (id) DO
UPDATE
SET role = 'owner';
-- 6. Create Membership
INSERT INTO public.restaurant_members (restaurant_id, user_id, role)
VALUES (v_restaurant_id, v_user_id, 'owner');
-- 7. Seed Category
INSERT INTO public.menu_categories (restaurant_id, name, sort_order)
VALUES (v_restaurant_id, 'Principais', 1)
RETURNING id INTO v_category_id;
-- 8. Seed Pulse - CRÍTICO: Todos os campos NOT NULL devem ser preenchidos
INSERT INTO public.empire_pulses (
        project_slug,
        tenant_slug,
        restaurant_id,
        heartbeat,
        metrics,
        events
    )
VALUES (
        'chefiapp',
        -- project_slug: NOT NULL
        v_slug,
        -- tenant_slug: NOT NULL
        v_restaurant_id,
        -- restaurant_id: opcional
        v_heartbeat,
        -- heartbeat: NOT NULL (variável explícita)
        jsonb_build_object(
            'origin',
            'atomic_rpc_v2',
            'mode',
            p_operation_mode,
            'gate',
            'reality_check_pending'
        ),
        -- metrics: JSONB
        '[]'::jsonb -- events: JSONB
    );
RETURN json_build_object(
    'tenant_id',
    v_restaurant_id,
    'slug',
    v_slug,
    'message',
    'Tenant created successfully'
);
END;
$$;;
-- Create ENUMs
CREATE TYPE public.order_status AS ENUM (
    'pending',
    'preparing',
    'ready',
    'delivered',
    'canceled'
);
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'refunded');
-- Create gm_orders table
CREATE TABLE IF NOT EXISTS public.gm_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    short_id TEXT NOT NULL,
    -- e.g. "Order #123" or just "123"
    status public.order_status DEFAULT 'pending' NOT NULL,
    total_amount INTEGER NOT NULL DEFAULT 0,
    -- in cents
    payment_status public.payment_status DEFAULT 'pending' NOT NULL,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Indexes for gm_orders
CREATE INDEX idx_orders_restaurant_status ON public.gm_orders(restaurant_id, status);
CREATE INDEX idx_orders_created_at ON public.gm_orders(created_at DESC);
-- Enable RLS for gm_orders
ALTER TABLE public.gm_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for internal users" ON public.gm_orders FOR
SELECT USING (
        auth.uid() IN (
            SELECT user_id
            FROM public.restaurant_members
            WHERE restaurant_id = gm_orders.restaurant_id
        )
    );
CREATE POLICY "Enable insert access for internal users" ON public.gm_orders FOR
INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id
            FROM public.restaurant_members
            WHERE restaurant_id = gm_orders.restaurant_id
        )
    );
CREATE POLICY "Enable update access for internal users" ON public.gm_orders FOR
UPDATE USING (
        auth.uid() IN (
            SELECT user_id
            FROM public.restaurant_members
            WHERE restaurant_id = gm_orders.restaurant_id
        )
    );
-- Create gm_order_items table
CREATE TABLE IF NOT EXISTS public.gm_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.gm_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    -- Logical reference, avoiding FK for now if products table is flux
    product_name TEXT NOT NULL,
    -- Snapshot of name at time of order
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price INTEGER NOT NULL,
    -- Snapshot of price at time of order
    total_price INTEGER NOT NULL -- quantity * unit_price
);
-- Enable RLS for gm_order_items
ALTER TABLE public.gm_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for internal users" ON public.gm_order_items FOR
SELECT USING (
        auth.uid() IN (
            SELECT user_id
            FROM public.restaurant_members
            WHERE restaurant_id = (
                    SELECT restaurant_id
                    FROM public.gm_orders
                    WHERE id = gm_order_items.order_id
                )
        )
    );
-- RPC: create_order_atomic
-- This function handles the creation of an order and its items in a single transaction.
-- It ensures data integrity and simplifies the frontend logic.
CREATE OR REPLACE FUNCTION public.create_order_atomic(
        p_restaurant_id UUID,
        p_items JSONB,
        -- Array of {product_id, name, quantity, unit_price}
        p_payment_method TEXT DEFAULT 'cash'
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_order_id UUID;
v_total_amount INTEGER := 0;
v_item JSONB;
v_item_total INTEGER;
v_short_id TEXT;
v_count INTEGER;
BEGIN -- 1. Calculate Total Amount & Prepare Items
FOR v_item IN
SELECT *
FROM jsonb_array_elements(p_items) LOOP v_item_total := (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER;
v_total_amount := v_total_amount + v_item_total;
END LOOP;
-- 2. Generate Short ID (Simple Counter simulation for now, or Random 4 chars)
-- In a real scenario, use a sequence per restaurant. Here, using microsecond-based unique string.
-- Better: Count orders for today + 1
SELECT count(*) + 1 INTO v_count
FROM public.gm_orders
WHERE restaurant_id = p_restaurant_id;
v_short_id := '#' || v_count::TEXT;
-- 3. Insert Order
INSERT INTO public.gm_orders (
        restaurant_id,
        short_id,
        status,
        total_amount,
        payment_status,
        payment_method
    )
VALUES (
        p_restaurant_id,
        v_short_id,
        'pending',
        v_total_amount,
        'pending',
        -- Default to pending, update later if paid immediately
        p_payment_method
    )
RETURNING id INTO v_order_id;
-- 4. Insert Order Items
FOR v_item IN
SELECT *
FROM jsonb_array_elements(p_items) LOOP
INSERT INTO public.gm_order_items (
        order_id,
        product_id,
        product_name,
        quantity,
        unit_price,
        total_price
    )
VALUES (
        v_order_id,
        (v_item->>'product_id')::UUID,
        v_item->>'name',
        (v_item->>'quantity')::INTEGER,
        (v_item->>'unit_price')::INTEGER,
        (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER
    );
END LOOP;
-- 5. Return the created order
RETURN jsonb_build_object(
    'id',
    v_order_id,
    'short_id',
    v_short_id,
    'total_amount',
    v_total_amount,
    'status',
    'pending'
);
END;
$$;;
