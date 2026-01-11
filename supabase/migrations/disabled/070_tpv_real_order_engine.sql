-- Migration: 070_tpv_real_order_engine.sql
-- Purpose: Garantir schema completo para TPV Real (Idempotent Upgrade)
-- Date: 2025-01-27
-- 1. Upgrade gm_orders
CREATE TABLE IF NOT EXISTS public.gm_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    -- Basic columns if created from scratch
    total_cents INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Schema Evolution: Add missing columns safely
DO $$ BEGIN -- Table Info
BEGIN
ALTER TABLE public.gm_orders
ADD COLUMN table_number INTEGER;
EXCEPTION
WHEN duplicate_column THEN NULL;
END;
BEGIN
ALTER TABLE public.gm_orders
ADD COLUMN table_id UUID;
EXCEPTION
WHEN duplicate_column THEN NULL;
END;
-- State
BEGIN
ALTER TABLE public.gm_orders
ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED'));
EXCEPTION
WHEN duplicate_column THEN NULL;
END;
-- Financial
BEGIN
ALTER TABLE public.gm_orders
ADD COLUMN subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0);
EXCEPTION
WHEN duplicate_column THEN NULL;
END;
BEGIN
ALTER TABLE public.gm_orders
ADD COLUMN tax_cents INTEGER NOT NULL DEFAULT 0 CHECK (tax_cents >= 0);
EXCEPTION
WHEN duplicate_column THEN NULL;
END;
BEGIN
ALTER TABLE public.gm_orders
ADD COLUMN discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0);
EXCEPTION
WHEN duplicate_column THEN NULL;
END;
-- Source & Ops
BEGIN
ALTER TABLE public.gm_orders
ADD COLUMN source TEXT NOT NULL DEFAULT 'tpv' CHECK (source IN ('tpv', 'web', 'app'));
EXCEPTION
WHEN duplicate_column THEN NULL;
END;
BEGIN
ALTER TABLE public.gm_orders
ADD COLUMN operator_id UUID REFERENCES auth.users(id);
EXCEPTION
WHEN duplicate_column THEN NULL;
END;
BEGIN
ALTER TABLE public.gm_orders
ADD COLUMN cash_register_id UUID;
EXCEPTION
WHEN duplicate_column THEN NULL;
END;
BEGIN
ALTER TABLE public.gm_orders
ADD COLUMN notes TEXT;
EXCEPTION
WHEN duplicate_column THEN NULL;
END;
END $$;
-- 2. Upgrade gm_order_items
CREATE TABLE IF NOT EXISTS public.gm_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.gm_orders(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DO $$ BEGIN BEGIN
ALTER TABLE public.gm_order_items
ADD COLUMN product_id UUID REFERENCES public.menu_items(id);
EXCEPTION
WHEN duplicate_column THEN NULL;
END;
BEGIN
ALTER TABLE public.gm_order_items
ADD COLUMN name_snapshot TEXT NOT NULL DEFAULT '';
EXCEPTION
WHEN duplicate_column THEN NULL;
END;
BEGIN
ALTER TABLE public.gm_order_items
ADD COLUMN price_snapshot INTEGER NOT NULL DEFAULT 0 CHECK (price_snapshot >= 0);
EXCEPTION
WHEN duplicate_column THEN NULL;
END;
BEGIN
ALTER TABLE public.gm_order_items
ADD COLUMN subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0);
EXCEPTION
WHEN duplicate_column THEN NULL;
END;
BEGIN
ALTER TABLE public.gm_order_items
ADD COLUMN modifiers JSONB DEFAULT '[]'::jsonb;
EXCEPTION
WHEN duplicate_column THEN NULL;
END;
BEGIN
ALTER TABLE public.gm_order_items
ADD COLUMN notes TEXT;
EXCEPTION
WHEN duplicate_column THEN NULL;
END;
BEGIN -- Removed FK to consumption_groups as table might not exist in Phase 0
ALTER TABLE public.gm_order_items
ADD COLUMN consumption_group_id UUID;
EXCEPTION
WHEN duplicate_column THEN NULL;
END;
END $$;
-- 3. Create cash_registers (New table)
CREATE TABLE IF NOT EXISTS public.cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Caixa Principal',
    status TEXT NOT NULL DEFAULT 'closed' CHECK (status IN ('open', 'closed')),
    opened_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    opened_by UUID REFERENCES auth.users(id),
    closed_by UUID REFERENCES auth.users(id),
    opening_balance_cents INTEGER NOT NULL DEFAULT 0,
    closing_balance_cents INTEGER,
    total_sales_cents INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- 4. Indexes (Safe creation)
CREATE INDEX IF NOT EXISTS idx_gm_orders_restaurant ON public.gm_orders(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gm_orders_status ON public.gm_orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_gm_orders_table ON public.gm_orders(table_id)
WHERE table_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gm_orders_cash_register ON public.gm_orders(cash_register_id)
WHERE cash_register_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gm_order_items_order ON public.gm_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_gm_order_items_product ON public.gm_order_items(product_id)
WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cash_registers_restaurant ON public.cash_registers(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_registers_status ON public.cash_registers(restaurant_id, status);
-- 5. Enable RLS and Policies (Restored)
ALTER TABLE public.gm_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Owners can manage orders" ON public.gm_orders;
CREATE POLICY "Owners can manage orders" ON public.gm_orders FOR ALL USING (
    auth.uid() IN (
        SELECT p.id
        FROM public.profiles p
            JOIN public.gm_restaurants r ON r.owner_id = p.id
        WHERE r.id = gm_orders.restaurant_id
    )
);
EXCEPTION
WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Owners can manage order items" ON public.gm_order_items;
CREATE POLICY "Owners can manage order items" ON public.gm_order_items FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.gm_orders o
            JOIN public.gm_restaurants r ON r.id = o.restaurant_id
            JOIN public.profiles p ON p.id = r.owner_id
        WHERE o.id = gm_order_items.order_id
            AND p.id = auth.uid()
    )
);
EXCEPTION
WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Owners can manage cash registers" ON public.cash_registers;
CREATE POLICY "Owners can manage cash registers" ON public.cash_registers FOR ALL USING (
    auth.uid() IN (
        SELECT p.id
        FROM public.profiles p
            JOIN public.gm_restaurants r ON r.owner_id = p.id
        WHERE r.id = cash_registers.restaurant_id
    )
);
EXCEPTION
WHEN OTHERS THEN NULL;
END $$;
-- 6. Trigger for Updated At
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS update_gm_orders_updated_at ON public.gm_orders;
CREATE TRIGGER update_gm_orders_updated_at BEFORE
UPDATE ON public.gm_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_cash_registers_updated_at ON public.cash_registers;
CREATE TRIGGER update_cash_registers_updated_at BEFORE
UPDATE ON public.cash_registers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- 7. Trigger for Order Total Calculation
CREATE OR REPLACE FUNCTION public.calculate_order_total() RETURNS TRIGGER AS $$ BEGIN
UPDATE public.gm_orders
SET subtotal_cents = (
        SELECT COALESCE(SUM(subtotal_cents), 0)
        FROM public.gm_order_items
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    ),
    total_cents = (
        SELECT COALESCE(SUM(subtotal_cents), 0)
        FROM public.gm_order_items
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    ) - discount_cents + tax_cents,
    updated_at = NOW()
WHERE id = COALESCE(NEW.order_id, OLD.order_id);
RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS calculate_order_total_on_items_change ON public.gm_order_items;
CREATE TRIGGER calculate_order_total_on_items_change
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON public.gm_order_items FOR EACH ROW EXECUTE FUNCTION public.calculate_order_total();