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
$$;