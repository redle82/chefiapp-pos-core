-- =============================================================================
-- CHEFIAPP CORE - SCHEMA OFICIAL LIMPO
-- =============================================================================
-- Este é o schema oficial do Core, sem resíduos de Supabase ou decisões antigas.
-- Gerado a partir do Core congelado e validado.
--
-- Data: 2026-01-25
-- Objetivo: Banco limpo para sistema novo
-- =============================================================================

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- SCHEMAS
-- =============================================================================

-- Schema para Realtime (Supabase)
CREATE SCHEMA IF NOT EXISTS _realtime;
GRANT ALL ON SCHEMA _realtime TO postgres;

-- =============================================================================
-- CORE TABLES (Sovereign Ledger)
-- =============================================================================

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
    -- Status de lifecycle do restaurante, alinhado com RestaurantRuntimeContext
    -- Valores esperados no app: 'draft', 'active', 'paused'
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Menu System
CREATE TABLE IF NOT EXISTS public.gm_menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gm_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.gm_menu_categories(id),
    name TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL DEFAULT 0,
    photo_url TEXT,
    available BOOLEAN DEFAULT TRUE,
    track_stock BOOLEAN DEFAULT FALSE,
    stock_quantity NUMERIC DEFAULT 0,
    cost_price_cents INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tables (Physical)
CREATE TABLE IF NOT EXISTS public.gm_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    qr_code TEXT,
    status TEXT DEFAULT 'closed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, number)
);

-- 5. Orders (Sovereign Ledger) - Schema Oficial
CREATE TABLE IF NOT EXISTS public.gm_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
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
    sync_metadata JSONB,
    origin TEXT,
    in_prep_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    served_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT orders_status_check CHECK (status IN ('OPEN', 'PREPARING', 'IN_PREP', 'READY', 'CLOSED', 'CANCELLED')),
    CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED'))
);

-- FASE 1 — Fluxo de Pedido Operacional (docs/contracts/FLUXO_DE_PEDIDO_OPERACIONAL.md):
-- gm_orders.status mapeamento conceptual:
--   OPEN     ≈ pedido CONFIRMADO, pronto para cozinha (TPV confirmou; não confundir com "rascunho").
--   IN_PREP  ≈ EM_PREPARO (KDS iniciou preparo).
--   READY    ≈ PRONTO (KDS marcou pronto).
--   CLOSED   ≈ pedido fechado/entregue.
-- Transições esperadas: OPEN → IN_PREP → READY → CLOSED. CANCELLED em qualquer momento.
-- Apenas KDS altera estados de cozinha (IN_PREP, READY); criação vem do TPV (OPEN).

-- 6. Order Items
CREATE TABLE IF NOT EXISTS public.gm_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.gm_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.gm_products(id),
    name_snapshot TEXT NOT NULL,
    price_snapshot INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal_cents INTEGER NOT NULL,
    modifiers JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    -- Autoria do item (para divisão de conta)
    created_by_user_id UUID,
    created_by_role TEXT, -- 'waiter', 'manager', 'owner', 'QR_MESA', etc.
    device_id TEXT, -- Opcional: identificador do dispositivo (QR Mesa)
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT order_items_quantity_check CHECK (quantity > 0)
);

-- =============================================================================
-- CONSTITUTIONAL CONSTRAINTS (Core Rules)
-- =============================================================================

-- Constraint: Uma mesa = um pedido aberto (Constitutional Law)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_order_per_table
ON public.gm_orders (table_id)
WHERE status = 'OPEN' AND table_id IS NOT NULL;

COMMENT ON INDEX idx_one_open_order_per_table IS
'Constitutional constraint: One OPEN order per table. Prevents race condition (TPV + Web simultaneous order creation).';

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status
ON public.gm_orders(restaurant_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_created_at
ON public.gm_orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_table_id
ON public.gm_orders(table_id) WHERE table_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
ON public.gm_order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_products_restaurant
ON public.gm_products(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_tables_restaurant
ON public.gm_tables(restaurant_id);

-- =============================================================================
-- RPC: create_order_atomic (Official Core Function)
-- =============================================================================
-- Versão oficial do Core, baseada na versão validada e testada.
-- Suporta sync_metadata para offline sync e respeita constraint idx_one_open_order_per_table.

CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_restaurant_id UUID,
    p_items JSONB,
    p_payment_method TEXT DEFAULT 'cash',
    p_sync_metadata JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_total_cents INTEGER := 0;
    v_item JSONB;
    v_item_total INTEGER;
    v_prod_id UUID;
    v_qty INTEGER;
    v_prod_name TEXT;
    v_unit_price INTEGER;
    v_table_id UUID;
    v_table_number INTEGER;
    v_prep_time_seconds INTEGER;
    v_prep_category TEXT;
    v_station TEXT;
BEGIN
    -- Extract table info from sync_metadata if provided
    IF p_sync_metadata IS NOT NULL THEN
        v_table_id := (p_sync_metadata->>'table_id')::UUID;
        v_table_number := (p_sync_metadata->>'table_number')::INTEGER;
    END IF;

    -- 1. Calculate Total Amount
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_total := (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER;
        v_total_cents := v_total_cents + v_item_total;
    END LOOP;

    -- 2. Insert Order (Atomic) - Constraint idx_one_open_order_per_table será aplicada automaticamente
    INSERT INTO public.gm_orders (
        restaurant_id,
        table_id,
        table_number,
        status,
        total_cents,
        subtotal_cents,
        payment_status,
        sync_metadata,
        origin,
        metadata
    )
    VALUES (
        p_restaurant_id,
        v_table_id,
        v_table_number,
        'OPEN',
        v_total_cents,
        v_total_cents,
        'PENDING',
        p_sync_metadata,
        COALESCE((p_sync_metadata->>'origin')::TEXT, 'CAIXA'),
        jsonb_build_object('payment_method', p_payment_method)
    )
    RETURNING id INTO v_order_id;

    -- 3. Insert Order Items (com autoria para divisão de conta + prep_time snapshot)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_prod_id := (v_item->>'product_id')::UUID;
        v_prod_name := v_item->>'name';
        v_qty := (v_item->>'quantity')::INTEGER;
        v_unit_price := (v_item->>'unit_price')::INTEGER;

        -- Buscar prep_time e station do produto (snapshot no momento do pedido)
        SELECT prep_time_seconds, prep_category, station
        INTO v_prep_time_seconds, v_prep_category, v_station
        FROM public.gm_products
        WHERE id = v_prod_id;

        -- Valores padrão se produto não encontrado ou sem prep_time
        v_prep_time_seconds := COALESCE(v_prep_time_seconds, 300); -- 5 min padrão
        v_prep_category := COALESCE(v_prep_category, 'main');
        v_station := COALESCE(v_station, 'KITCHEN');

        INSERT INTO public.gm_order_items (
            order_id,
            product_id,
            name_snapshot,
            price_snapshot,
            quantity,
            subtotal_cents,
            -- Prep time snapshot (para timer por item)
            prep_time_seconds,
            prep_category,
            -- Station snapshot (BAR vs KITCHEN)
            station,
            -- Autoria do item (para divisão de conta)
            created_by_user_id,
            created_by_role,
            device_id
        )
        VALUES (
            v_order_id,
            v_prod_id,
            v_prod_name,
            v_unit_price,
            v_qty,
            v_unit_price * v_qty,
            -- Prep time snapshot (para timer por item)
            v_prep_time_seconds,
            v_prep_category,
            -- Station snapshot (BAR vs KITCHEN)
            v_station,
            -- Extrair autoria do item (se presente)
            (v_item->>'created_by_user_id')::UUID,
            v_item->>'created_by_role',
            v_item->>'device_id'
        );
    END LOOP;

    -- 4. Return Created Order
    RETURN jsonb_build_object(
        'id', v_order_id,
        'total_cents', v_total_cents,
        'status', 'OPEN'
    );
EXCEPTION
    WHEN unique_violation THEN
        -- Constraint idx_one_open_order_per_table violada
        RAISE EXCEPTION 'TABLE_HAS_ACTIVE_ORDER: Esta mesa já possui um pedido aberto';
END;
$$;

-- =============================================================================
-- GRANTS (Minimal - No RLS for now, Core is authoritative)
-- =============================================================================

-- Allow service role to do everything (Core is authoritative)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- =============================================================================
-- COMMENTS (Documentation)
-- =============================================================================

COMMENT ON TABLE public.gm_orders IS 'Sovereign Ledger: All orders go through this table. Core is authoritative.';
COMMENT ON TABLE public.gm_order_items IS 'Order items snapshot at time of creation. Immutable after creation.';
COMMENT ON FUNCTION public.create_order_atomic IS 'Official Core RPC: Creates order atomically. Enforces constitutional constraints.';
