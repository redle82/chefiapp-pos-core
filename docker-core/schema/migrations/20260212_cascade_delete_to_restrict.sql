-- =============================================================================
-- PHASE 0 — TPV COMPLIANCE HOTFIX: CASCADE DELETE → RESTRICT
-- =============================================================================
-- Date: 2026-02-12
-- Priority: CRITICAL (data-loss prevention)
-- Context: Deleting a gm_restaurants row cascades through 20+ tables, destroying
--          orders, payments, audit logs, stock ledger, and all financial data.
--          For TPV compliance, sealed/fiscal data must NEVER be deletable.
--
-- Strategy:
--   1. Financial/audit tables → ON DELETE RESTRICT (block restaurant deletion)
--   2. gm_restaurants gets soft-delete (deleted_at column)
--   3. BEFORE DELETE trigger on gm_orders guards sealed entities
--   4. forbid_mutation() deployed to production for event_store + legal_seals
--   5. Non-fiscal config tables keep ON DELETE CASCADE (modules, locations, etc.)
--
-- Affected tables (changing CASCADE → RESTRICT):
--   gm_orders, gm_payments, gm_payment_audit_logs, gm_audit_logs,
--   gm_cash_registers, gm_stock_ledger, gm_customers, gm_terminals,
--   gm_restaurant_members, billing_configs
--
-- Tables keeping CASCADE (non-fiscal, config/operational):
--   gm_menu_categories, gm_tables, installed_modules, module_permissions,
--   gm_locations, gm_equipment, gm_ingredients, gm_stock_levels, gm_product_bom
-- =============================================================================

BEGIN;

-- =============================================================================
-- PART 1: SOFT-DELETE on gm_restaurants
-- =============================================================================
-- Application-level "delete" sets deleted_at instead of DELETE FROM.
-- All queries filter with WHERE deleted_at IS NULL.

ALTER TABLE public.gm_restaurants
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_gm_restaurants_active
    ON public.gm_restaurants (id)
    WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.gm_restaurants.deleted_at IS
    'Soft-delete timestamp. NULL = active. App must filter by deleted_at IS NULL. '
    'Hard DELETE blocked by RESTRICT FKs on fiscal tables.';

-- =============================================================================
-- PART 2: forbid_mutation() — Immutability enforcement (from design schema)
-- =============================================================================
-- Deploys structural protection to production event_store + legal_seals.
-- Already exists in schema.sql (design); missing in Docker Core production.

CREATE OR REPLACE FUNCTION public.forbid_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'IMMUTABLE_TABLE: % operations not allowed on %',
        TG_OP, TG_TABLE_NAME
    USING ERRCODE = '23514'; -- check_violation
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.forbid_mutation() IS
    'Hard-blocks UPDATE/DELETE on immutable tables (event_store, legal_seals). '
    'Executes at query plan level — stronger than application-level protection.';

-- Protect event_store
DROP TRIGGER IF EXISTS event_store_immutable ON public.event_store;
CREATE TRIGGER event_store_immutable
    BEFORE UPDATE OR DELETE ON public.event_store
    FOR EACH ROW EXECUTE FUNCTION public.forbid_mutation();

-- Protect legal_seals
DROP TRIGGER IF EXISTS legal_seals_immutable ON public.legal_seals;
CREATE TRIGGER legal_seals_immutable
    BEFORE UPDATE OR DELETE ON public.legal_seals
    FOR EACH ROW EXECUTE FUNCTION public.forbid_mutation();

-- =============================================================================
-- PART 3: CASCADE → RESTRICT on fiscal/financial tables
-- =============================================================================
-- Each ALTER drops the existing FK and recreates with ON DELETE RESTRICT.
-- This blocks restaurant deletion when financial data exists.

-- ----- gm_orders (sovereign ledger — NEVER deletable) -----
ALTER TABLE public.gm_orders
    DROP CONSTRAINT IF EXISTS gm_orders_restaurant_id_fkey;
ALTER TABLE public.gm_orders
    ADD CONSTRAINT gm_orders_restaurant_id_fkey
    FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id)
    ON DELETE RESTRICT;

-- ----- gm_payments (financial records) -----
ALTER TABLE public.gm_payments
    DROP CONSTRAINT IF EXISTS gm_payments_restaurant_id_fkey;
ALTER TABLE public.gm_payments
    ADD CONSTRAINT gm_payments_restaurant_id_fkey
    FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id)
    ON DELETE RESTRICT;

-- Also change gm_payments → gm_orders FK to RESTRICT
ALTER TABLE public.gm_payments
    DROP CONSTRAINT IF EXISTS gm_payments_order_id_fkey;
ALTER TABLE public.gm_payments
    ADD CONSTRAINT gm_payments_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.gm_orders(id)
    ON DELETE RESTRICT;

-- ----- gm_order_items (order line items — must survive with order) -----
ALTER TABLE public.gm_order_items
    DROP CONSTRAINT IF EXISTS gm_order_items_order_id_fkey;
ALTER TABLE public.gm_order_items
    ADD CONSTRAINT gm_order_items_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.gm_orders(id)
    ON DELETE RESTRICT;

-- ----- gm_payment_audit_logs (payment audit trail) -----
ALTER TABLE public.gm_payment_audit_logs
    DROP CONSTRAINT IF EXISTS gm_payment_audit_logs_restaurant_id_fkey;
ALTER TABLE public.gm_payment_audit_logs
    ADD CONSTRAINT gm_payment_audit_logs_restaurant_id_fkey
    FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id)
    ON DELETE RESTRICT;

-- ----- gm_audit_logs (central audit trail — partitioned) -----
-- Note: Partitioned tables require constraint on parent.
ALTER TABLE public.gm_audit_logs
    DROP CONSTRAINT IF EXISTS gm_audit_logs_restaurant_id_fkey;
ALTER TABLE public.gm_audit_logs
    ADD CONSTRAINT gm_audit_logs_restaurant_id_fkey
    FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id)
    ON DELETE RESTRICT;

-- ----- gm_cash_registers (shift/financial records) -----
ALTER TABLE public.gm_cash_registers
    DROP CONSTRAINT IF EXISTS gm_cash_registers_restaurant_id_fkey;
ALTER TABLE public.gm_cash_registers
    ADD CONSTRAINT gm_cash_registers_restaurant_id_fkey
    FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id)
    ON DELETE RESTRICT;

-- ----- gm_stock_ledger (append-only inventory movements) -----
ALTER TABLE public.gm_stock_ledger
    DROP CONSTRAINT IF EXISTS gm_stock_ledger_restaurant_id_fkey;
ALTER TABLE public.gm_stock_ledger
    ADD CONSTRAINT gm_stock_ledger_restaurant_id_fkey
    FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id)
    ON DELETE RESTRICT;

-- ----- gm_customers (GDPR — needs controlled erasure, not cascade) -----
ALTER TABLE public.gm_customers
    DROP CONSTRAINT IF EXISTS gm_customers_restaurant_id_fkey;
ALTER TABLE public.gm_customers
    ADD CONSTRAINT gm_customers_restaurant_id_fkey
    FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id)
    ON DELETE RESTRICT;

-- ----- gm_terminals (device registry — audit trail) -----
ALTER TABLE public.gm_terminals
    DROP CONSTRAINT IF EXISTS gm_terminals_restaurant_id_fkey;
ALTER TABLE public.gm_terminals
    ADD CONSTRAINT gm_terminals_restaurant_id_fkey
    FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id)
    ON DELETE RESTRICT;

-- ----- gm_restaurant_members (identity/access records) -----
ALTER TABLE public.gm_restaurant_members
    DROP CONSTRAINT IF EXISTS gm_restaurant_members_restaurant_id_fkey;
ALTER TABLE public.gm_restaurant_members
    ADD CONSTRAINT gm_restaurant_members_restaurant_id_fkey
    FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id)
    ON DELETE RESTRICT;

-- ----- billing_configs (financial configuration) -----
ALTER TABLE public.billing_configs
    DROP CONSTRAINT IF EXISTS billing_configs_restaurant_id_fkey;
ALTER TABLE public.billing_configs
    ADD CONSTRAINT billing_configs_restaurant_id_fkey
    FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id)
    ON DELETE RESTRICT;

-- ----- gm_tasks (operational tasks linked to orders) -----
ALTER TABLE public.gm_tasks
    DROP CONSTRAINT IF EXISTS gm_tasks_restaurant_id_fkey;
ALTER TABLE public.gm_tasks
    ADD CONSTRAINT gm_tasks_restaurant_id_fkey
    FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id)
    ON DELETE RESTRICT;

-- =============================================================================
-- PART 4: BEFORE DELETE guard on gm_orders (sealed entity protection)
-- =============================================================================
-- Even with RESTRICT, this adds defense-in-depth: rejects deletion of orders
-- that have legal seals, payments, or are in terminal states.

CREATE OR REPLACE FUNCTION public.guard_order_delete()
RETURNS TRIGGER AS $$
DECLARE
    v_sealed BOOLEAN;
    v_has_payments BOOLEAN;
BEGIN
    -- Check if entity has legal seal
    SELECT EXISTS(
        SELECT 1 FROM public.legal_seals
        WHERE entity_type = 'ORDER' AND entity_id = OLD.id::TEXT
    ) INTO v_sealed;

    IF v_sealed THEN
        RAISE EXCEPTION 'SEALED_ENTITY: Cannot delete sealed order %', OLD.id
        USING ERRCODE = '23514';
    END IF;

    -- Check if order has payments
    SELECT EXISTS(
        SELECT 1 FROM public.gm_payments
        WHERE order_id = OLD.id
    ) INTO v_has_payments;

    IF v_has_payments THEN
        RAISE EXCEPTION 'HAS_PAYMENTS: Cannot delete order % with payment records', OLD.id
        USING ERRCODE = '23514';
    END IF;

    -- Block deletion of terminal-state orders (CLOSED, CANCELLED)
    IF OLD.status IN ('CLOSED', 'CANCELLED') THEN
        RAISE EXCEPTION 'TERMINAL_STATE: Cannot delete % order %', OLD.status, OLD.id
        USING ERRCODE = '23514';
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guard_order_delete ON public.gm_orders;
CREATE TRIGGER guard_order_delete
    BEFORE DELETE ON public.gm_orders
    FOR EACH ROW EXECUTE FUNCTION public.guard_order_delete();

COMMENT ON FUNCTION public.guard_order_delete() IS
    'Defense-in-depth: blocks deletion of sealed, paid, or terminal-state orders. '
    'Even if FK RESTRICT is bypassed, this trigger catches it.';

-- =============================================================================
-- PART 5: SOFT-DELETE helper function for gm_restaurants
-- =============================================================================
-- Application MUST use this instead of DELETE FROM gm_restaurants.

CREATE OR REPLACE FUNCTION public.soft_delete_restaurant(p_restaurant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_open_orders INTEGER;
    v_open_registers INTEGER;
BEGIN
    -- Block if restaurant has open orders
    SELECT COUNT(*) INTO v_open_orders
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id AND status = 'OPEN';

    IF v_open_orders > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'OPEN_ORDERS',
            'message', format('Cannot deactivate: %s open orders', v_open_orders)
        );
    END IF;

    -- Block if restaurant has open cash registers
    SELECT COUNT(*) INTO v_open_registers
    FROM public.gm_cash_registers
    WHERE restaurant_id = p_restaurant_id AND status = 'open';

    IF v_open_registers > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'OPEN_REGISTERS',
            'message', format('Cannot deactivate: %s open cash registers', v_open_registers)
        );
    END IF;

    -- Soft-delete (set deleted_at + status)
    UPDATE public.gm_restaurants
    SET deleted_at = NOW(),
        status = 'deleted',
        updated_at = NOW()
    WHERE id = p_restaurant_id
      AND deleted_at IS NULL;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'NOT_FOUND_OR_ALREADY_DELETED',
            'message', 'Restaurant not found or already deleted'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'restaurant_id', p_restaurant_id,
        'deleted_at', NOW()
    );
END;
$$;

COMMENT ON FUNCTION public.soft_delete_restaurant(UUID) IS
    'Soft-deletes a restaurant (sets deleted_at). Rejects if open orders or cash registers exist. '
    'All financial data is preserved for fiscal compliance (7-10 year retention).';

-- =============================================================================
-- PART 6: PREVENT hard DELETE on gm_restaurants
-- =============================================================================
-- Final safety net: blocks hard DELETE entirely via trigger.

CREATE OR REPLACE FUNCTION public.guard_restaurant_delete()
RETURNS TRIGGER AS $$
DECLARE
    v_has_orders BOOLEAN;
    v_has_payments BOOLEAN;
    v_has_seals BOOLEAN;
BEGIN
    -- Check for any orders
    SELECT EXISTS(
        SELECT 1 FROM public.gm_orders WHERE restaurant_id = OLD.id
    ) INTO v_has_orders;

    -- Check for any payments
    SELECT EXISTS(
        SELECT 1 FROM public.gm_payments WHERE restaurant_id = OLD.id
    ) INTO v_has_payments;

    -- Check for any legal seals
    SELECT EXISTS(
        SELECT 1 FROM public.legal_seals WHERE entity_id = OLD.id::TEXT
    ) INTO v_has_seals;

    IF v_has_orders OR v_has_payments OR v_has_seals THEN
        RAISE EXCEPTION
            'RESTAURANT_HAS_FISCAL_DATA: Cannot DELETE restaurant %. '
            'Use soft_delete_restaurant() instead. '
            'Orders=%, Payments=%, Seals=%',
            OLD.id, v_has_orders, v_has_payments, v_has_seals
        USING ERRCODE = '23514';
    END IF;

    -- Allow deletion only for restaurants with zero financial footprint
    -- (e.g., draft restaurants never used)
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guard_restaurant_delete ON public.gm_restaurants;
CREATE TRIGGER guard_restaurant_delete
    BEFORE DELETE ON public.gm_restaurants
    FOR EACH ROW EXECUTE FUNCTION public.guard_restaurant_delete();

COMMENT ON FUNCTION public.guard_restaurant_delete() IS
    'Blocks hard DELETE on restaurants with any orders, payments, or legal seals. '
    'Only draft/unused restaurants can be hard-deleted.';

-- =============================================================================
-- VERIFICATION QUERIES (run after migration)
-- =============================================================================
-- SELECT conname, confdeltype FROM pg_constraint
-- WHERE confrelid = 'gm_restaurants'::regclass AND contype = 'f';
-- Expected: fiscal tables show 'r' (RESTRICT), config tables show 'c' (CASCADE)
--
-- DELETE FROM gm_restaurants WHERE id = '<test_id>';
-- Expected: ERROR "RESTAURANT_HAS_FISCAL_DATA" or FK violation

COMMIT;
