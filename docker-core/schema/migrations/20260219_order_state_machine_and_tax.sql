-- =============================================================================
-- Migration: Order State Machine + IVA (Tax) per Transaction
-- Date: 2026-02-19
-- Purpose:
--   1. Enforce valid order status transitions at DB level (Constitutional Law)
--   2. Add tax_rate_bps to gm_products (basis points: 2300 = 23% IVA)
--   3. Add tax_rate_bps to gm_order_items (snapshot at order time)
--   4. Add default_tax_rate_bps to gm_restaurants
--   5. Rewrite create_order_atomic to calculate tax_cents per item
--   6. Update update_order_status to enforce state machine
-- =============================================================================

-- =============================================================================
-- 1. ORDER STATE MACHINE — Transition Validation Function
-- =============================================================================
-- Allowed transitions:
--   OPEN       → PREPARING, IN_PREP, CANCELLED
--   PREPARING  → IN_PREP, CANCELLED
--   IN_PREP    → READY, CANCELLED
--   READY      → CLOSED
--   CLOSED     → (terminal — no transitions)
--   CANCELLED  → (terminal — no transitions)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.validate_order_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Allow same-status updates (idempotent)
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Terminal states: CLOSED and CANCELLED cannot transition
    IF OLD.status IN ('CLOSED', 'CANCELLED') THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: Cannot transition from terminal status %. Order: %',
            OLD.status, OLD.id;
    END IF;

    -- Validate allowed transitions
    CASE OLD.status
        WHEN 'OPEN' THEN
            IF NEW.status NOT IN ('PREPARING', 'IN_PREP', 'CANCELLED') THEN
                RAISE EXCEPTION 'INVALID_TRANSITION: OPEN can only go to PREPARING, IN_PREP, or CANCELLED. Got: %', NEW.status;
            END IF;
        WHEN 'PREPARING' THEN
            IF NEW.status NOT IN ('IN_PREP', 'CANCELLED') THEN
                RAISE EXCEPTION 'INVALID_TRANSITION: PREPARING can only go to IN_PREP or CANCELLED. Got: %', NEW.status;
            END IF;
        WHEN 'IN_PREP' THEN
            IF NEW.status NOT IN ('READY', 'CANCELLED') THEN
                RAISE EXCEPTION 'INVALID_TRANSITION: IN_PREP can only go to READY or CANCELLED. Got: %', NEW.status;
            END IF;
        WHEN 'READY' THEN
            IF NEW.status NOT IN ('CLOSED') THEN
                RAISE EXCEPTION 'INVALID_TRANSITION: READY can only go to CLOSED. Got: %', NEW.status;
            END IF;
        ELSE
            RAISE EXCEPTION 'INVALID_TRANSITION: Unknown status: %', OLD.status;
    END CASE;

    -- Auto-populate timestamp columns
    IF NEW.status = 'IN_PREP' AND NEW.in_prep_at IS NULL THEN
        NEW.in_prep_at := NOW();
    END IF;

    IF NEW.status = 'READY' AND NEW.ready_at IS NULL THEN
        NEW.ready_at := NOW();
    END IF;

    NEW.updated_at := NOW();

    RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS trg_validate_order_status ON public.gm_orders;

CREATE TRIGGER trg_validate_order_status
BEFORE UPDATE OF status ON public.gm_orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_status_transition();

COMMENT ON FUNCTION public.validate_order_status_transition IS
'Constitutional Law: Enforces valid order status transitions. Terminal states (CLOSED, CANCELLED) cannot transition.';

-- =============================================================================
-- 2. TAX COLUMNS — Products, Order Items, Restaurants
-- =============================================================================

-- 2a. Default tax rate on restaurants (per-restaurant override)
ALTER TABLE public.gm_restaurants
    ADD COLUMN IF NOT EXISTS default_tax_rate_bps INTEGER NOT NULL DEFAULT 2300;

COMMENT ON COLUMN public.gm_restaurants.default_tax_rate_bps IS
'Default IVA rate in basis points. 2300 = 23%. Used when product has no specific rate.';

-- 2b. Tax rate on products (nullable → falls back to restaurant default)
ALTER TABLE public.gm_products
    ADD COLUMN IF NOT EXISTS tax_rate_bps INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.gm_products.tax_rate_bps IS
'IVA rate in basis points for this product. NULL = use restaurant default. 2300 = 23%, 1300 = 13%, 600 = 6%.';

-- 2c. Tax rate snapshot on order items (set at order creation, immutable)
ALTER TABLE public.gm_order_items
    ADD COLUMN IF NOT EXISTS tax_rate_bps INTEGER NOT NULL DEFAULT 2300;

ALTER TABLE public.gm_order_items
    ADD COLUMN IF NOT EXISTS tax_cents INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.gm_order_items.tax_rate_bps IS
'IVA rate snapshot in basis points at time of order. Immutable after creation.';

COMMENT ON COLUMN public.gm_order_items.tax_cents IS
'Tax amount in cents for this line item (tax-inclusive calculation from subtotal_cents).';

-- =============================================================================
-- 3. REWRITE create_order_atomic — Now calculates tax per item
-- =============================================================================
-- Tax calculation: Price is TAX-INCLUSIVE (standard EU menu pricing).
-- net_cents = subtotal_cents * 10000 / (10000 + tax_rate_bps)
-- tax_cents = subtotal_cents - net_cents
-- Example: 1000 cents at 23% → net = 1000 * 10000 / 12300 = 813 → tax = 187

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
    v_total_tax_cents INTEGER := 0;
    v_item JSONB;
    v_item_total INTEGER;
    v_item_tax INTEGER;
    v_prod_id UUID;
    v_qty INTEGER;
    v_prod_name TEXT;
    v_unit_price INTEGER;
    v_table_id UUID;
    v_table_number INTEGER;
    v_prep_time_seconds INTEGER;
    v_prep_category TEXT;
    v_station TEXT;
    v_product_tax_rate_bps INTEGER;
    v_restaurant_default_tax INTEGER;
    v_effective_tax_rate INTEGER;
BEGIN
    -- Get restaurant default tax rate
    SELECT default_tax_rate_bps INTO v_restaurant_default_tax
    FROM public.gm_restaurants
    WHERE id = p_restaurant_id;

    IF v_restaurant_default_tax IS NULL THEN
        v_restaurant_default_tax := 2300; -- 23% fallback
    END IF;

    -- Extract table info from sync_metadata if provided
    IF p_sync_metadata IS NOT NULL THEN
        v_table_id := (p_sync_metadata->>'table_id')::UUID;
        v_table_number := (p_sync_metadata->>'table_number')::INTEGER;
    END IF;

    -- 1. Calculate Total Amount + Tax
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_prod_id := (v_item->>'product_id')::UUID;
        v_qty := (v_item->>'quantity')::INTEGER;
        v_unit_price := (v_item->>'unit_price')::INTEGER;
        v_item_total := v_qty * v_unit_price;

        -- Get product-specific tax rate (or use restaurant default)
        SELECT tax_rate_bps INTO v_product_tax_rate_bps
        FROM public.gm_products WHERE id = v_prod_id;

        v_effective_tax_rate := COALESCE(v_product_tax_rate_bps, v_restaurant_default_tax);

        -- Tax-inclusive calculation: tax = total - (total * 10000 / (10000 + rate))
        v_item_tax := v_item_total - (v_item_total * 10000 / (10000 + v_effective_tax_rate));

        v_total_cents := v_total_cents + v_item_total;
        v_total_tax_cents := v_total_tax_cents + v_item_tax;
    END LOOP;

    -- 2. Insert Order (Atomic)
    INSERT INTO public.gm_orders (
        restaurant_id,
        table_id,
        table_number,
        status,
        total_cents,
        subtotal_cents,
        tax_cents,
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
        v_total_cents - v_total_tax_cents,
        v_total_tax_cents,
        'PENDING',
        p_sync_metadata,
        COALESCE((p_sync_metadata->>'origin')::TEXT, 'CAIXA'),
        jsonb_build_object('payment_method', p_payment_method)
    )
    RETURNING id INTO v_order_id;

    -- 3. Insert Order Items (with tax snapshot + prep time + authorship)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_prod_id := (v_item->>'product_id')::UUID;
        v_prod_name := v_item->>'name';
        v_qty := (v_item->>'quantity')::INTEGER;
        v_unit_price := (v_item->>'unit_price')::INTEGER;
        v_item_total := v_qty * v_unit_price;

        -- Fetch prep_time, station, and tax_rate from product
        SELECT prep_time_seconds, prep_category, station, tax_rate_bps
        INTO v_prep_time_seconds, v_prep_category, v_station, v_product_tax_rate_bps
        FROM public.gm_products
        WHERE id = v_prod_id;

        v_prep_time_seconds := COALESCE(v_prep_time_seconds, 300);
        v_prep_category := COALESCE(v_prep_category, 'main');
        v_station := COALESCE(v_station, 'KITCHEN');
        v_effective_tax_rate := COALESCE(v_product_tax_rate_bps, v_restaurant_default_tax);

        -- Tax per line item (tax-inclusive)
        v_item_tax := v_item_total - (v_item_total * 10000 / (10000 + v_effective_tax_rate));

        INSERT INTO public.gm_order_items (
            order_id,
            product_id,
            name_snapshot,
            price_snapshot,
            quantity,
            subtotal_cents,
            tax_rate_bps,
            tax_cents,
            prep_time_seconds,
            prep_category,
            station,
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
            v_item_total,
            v_effective_tax_rate,
            v_item_tax,
            v_prep_time_seconds,
            v_prep_category,
            v_station,
            (v_item->>'created_by_user_id')::UUID,
            v_item->>'created_by_role',
            v_item->>'device_id'
        );
    END LOOP;

    -- 4. Return Created Order
    RETURN jsonb_build_object(
        'id', v_order_id,
        'total_cents', v_total_cents,
        'subtotal_cents', v_total_cents - v_total_tax_cents,
        'tax_cents', v_total_tax_cents,
        'status', 'OPEN'
    );
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'TABLE_HAS_ACTIVE_ORDER: Esta mesa já possui um pedido aberto';
END;
$$;

COMMENT ON FUNCTION public.create_order_atomic IS
'Official Core RPC: Creates order atomically with IVA tax calculation. Tax-inclusive pricing (EU standard). Enforces constitutional constraints.';

-- =============================================================================
-- 4. REWRITE update_order_status — State machine enforced by trigger
-- =============================================================================
-- The trigger trg_validate_order_status now enforces transitions.
-- This RPC remains as the safe API for status changes.

CREATE OR REPLACE FUNCTION public.update_order_status(
    p_order_id UUID,
    p_restaurant_id UUID,
    p_new_status TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_id UUID;
    v_old_status TEXT;
BEGIN
    -- Validate status value
    IF p_new_status NOT IN ('OPEN', 'PREPARING', 'IN_PREP', 'READY', 'CLOSED', 'CANCELLED') THEN
        RAISE EXCEPTION 'INVALID_STATUS: Status inválido: %', p_new_status;
    END IF;

    -- Get current status for return info
    SELECT status INTO v_old_status
    FROM public.gm_orders
    WHERE id = p_order_id AND restaurant_id = p_restaurant_id;

    IF v_old_status IS NULL THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND: Pedido não encontrado ou não pertence ao restaurante';
    END IF;

    -- Update status (trigger will validate transition + set timestamps)
    UPDATE public.gm_orders
    SET status = p_new_status
    WHERE id = p_order_id
      AND restaurant_id = p_restaurant_id
    RETURNING id INTO v_updated_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_updated_id,
        'old_status', v_old_status,
        'new_status', p_new_status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_order_status TO postgres;

COMMENT ON FUNCTION public.update_order_status IS
'Core RPC: Updates order status. Transition validation enforced by trg_validate_order_status trigger.';

-- =============================================================================
-- 5. GRANTS
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.create_order_atomic TO postgres;
GRANT EXECUTE ON FUNCTION public.validate_order_status_transition TO postgres;
