-- 🔄 SYNC LOCAL DB
-- Purpose: Aligns local 'chefiapp_core_test' with Production Supabase Schema (P0 Hardening)
-- Date: 2026-01-13
BEGIN;
-- 1. Create gm_products (Missing locally)
-- Schema verified from Supabase 2026-01-13
CREATE TABLE IF NOT EXISTS public.gm_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id),
    name TEXT NOT NULL,
    price_cents INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'permanent',
    origin TEXT DEFAULT 'manual',
    usage_count INTEGER DEFAULT 0,
    first_used_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 1.1 Seed Base Restaurant (ID 000...001)
INSERT INTO public.gm_restaurants (id, name, slug)
VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Sofia Gastrobar',
        'sofia-gastrobar'
    ) ON CONFLICT (id) DO NOTHING;
-- 2. Apply Order Engine 2.0 Schema (from 20260112000000_create_orders_schema.sql)
-- Drops existing if necessary (safety)
DROP FUNCTION IF EXISTS public.create_order_atomic(UUID, JSONB, TEXT);
DROP FUNCTION IF EXISTS public.create_order_atomic(UUID, JSONB, TEXT, JSONB);
-- Create ENUMs if not exist
DO $$ BEGIN CREATE TYPE public.order_status AS ENUM (
    'pending',
    'preparing',
    'ready',
    'delivered',
    'canceled'
);
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'refunded');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
-- Create gm_orders
CREATE TABLE IF NOT EXISTS public.gm_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    short_id TEXT NOT NULL,
    status public.order_status DEFAULT 'pending' NOT NULL,
    total_amount INTEGER NOT NULL DEFAULT 0,
    payment_status public.payment_status DEFAULT 'pending' NOT NULL,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON public.gm_orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.gm_orders(created_at DESC);
-- Create gm_order_items
CREATE TABLE IF NOT EXISTS public.gm_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.gm_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price INTEGER NOT NULL,
    total_price INTEGER NOT NULL
);
-- 3. Apply P0 Migrations (Consolidated Logic)
-- Add sync_metadata
ALTER TABLE public.gm_orders
ADD COLUMN IF NOT EXISTS sync_metadata JSONB;
CREATE INDEX IF NOT EXISTS idx_gm_orders_sync_local_id ON public.gm_orders ((sync_metadata->>'localId'));
-- Add version
ALTER TABLE public.gm_orders
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_gm_orders_version ON public.gm_orders(version);
-- 4. Create create_order_atomic (Fixed Signature)
CREATE OR REPLACE FUNCTION public.create_order_atomic(
        p_restaurant_id UUID,
        p_items JSONB,
        p_payment_method TEXT DEFAULT 'cash',
        p_sync_metadata JSONB DEFAULT NULL
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_order_id UUID;
v_total_amount INTEGER := 0;
v_item JSONB;
v_item_total INTEGER;
v_short_id TEXT;
v_count INTEGER;
BEGIN FOR v_item IN
SELECT *
FROM jsonb_array_elements(p_items) LOOP v_item_total := (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER;
v_total_amount := v_total_amount + v_item_total;
END LOOP;
SELECT count(*) + 1 INTO v_count
FROM public.gm_orders
WHERE restaurant_id = p_restaurant_id;
v_short_id := '#' || v_count::TEXT;
INSERT INTO public.gm_orders (
        restaurant_id,
        short_id,
        status,
        total_amount,
        payment_status,
        payment_method,
        sync_metadata
    )
VALUES (
        p_restaurant_id,
        v_short_id,
        'pending',
        v_total_amount,
        'pending',
        p_payment_method,
        p_sync_metadata
    )
RETURNING id INTO v_order_id;
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
$$;
COMMIT;