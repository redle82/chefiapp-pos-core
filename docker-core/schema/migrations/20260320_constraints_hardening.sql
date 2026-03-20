-- =============================================================================
-- Migration: 20260320_constraints_hardening.sql
-- Purpose: Add CHECK constraints, NOT NULL enforcement, and UNIQUE constraints
--          across all tables to enforce data integrity at the database level.
--
-- All statements are idempotent: uses DROP CONSTRAINT IF EXISTS + ADD CONSTRAINT,
-- or ALTER TABLE IF EXISTS for safety.
--
-- Categories:
--   1. Status field validation (enum-like CHECK constraints)
--   2. Amount/financial field validation (non-negative)
--   3. Date logic validation (opened_at < closed_at, etc.)
--   4. NOT NULL enforcement for required fields
--   5. UNIQUE constraints for business rules
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. STATUS FIELD CONSTRAINTS
-- =============================================================================

-- gm_orders.status (already exists in core_schema, re-add idempotently)
ALTER TABLE public.gm_orders DROP CONSTRAINT IF EXISTS chk_orders_status_valid;
ALTER TABLE public.gm_orders ADD CONSTRAINT chk_orders_status_valid
  CHECK (status IN ('OPEN', 'PREPARING', 'IN_PREP', 'READY', 'CLOSED', 'CANCELLED'));

-- gm_orders.payment_status (already exists, re-add for completeness)
ALTER TABLE public.gm_orders DROP CONSTRAINT IF EXISTS chk_orders_payment_status_valid;
ALTER TABLE public.gm_orders ADD CONSTRAINT chk_orders_payment_status_valid
  CHECK (payment_status IN ('PENDING', 'PAID', 'PARTIALLY_PAID', 'FAILED', 'REFUNDED'));

-- gm_payments.status
ALTER TABLE public.gm_payments DROP CONSTRAINT IF EXISTS chk_payments_status_valid;
ALTER TABLE public.gm_payments ADD CONSTRAINT chk_payments_status_valid
  CHECK (status IN ('paid', 'failed', 'refunded', 'pending'));

-- gm_cash_registers.status
ALTER TABLE public.gm_cash_registers DROP CONSTRAINT IF EXISTS chk_cash_register_status_valid;
ALTER TABLE public.gm_cash_registers ADD CONSTRAINT chk_cash_register_status_valid
  CHECK (status IN ('open', 'closed'));

-- gm_refunds.status
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gm_refunds') THEN
    EXECUTE 'ALTER TABLE public.gm_refunds DROP CONSTRAINT IF EXISTS chk_refunds_status_valid';
    EXECUTE 'ALTER TABLE public.gm_refunds ADD CONSTRAINT chk_refunds_status_valid
      CHECK (status IN (''pending'', ''approved'', ''rejected'', ''processed'', ''failed''))';
  END IF;
END $$;

-- gm_fiscal_documents.status
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gm_fiscal_documents') THEN
    EXECUTE 'ALTER TABLE public.gm_fiscal_documents DROP CONSTRAINT IF EXISTS chk_fiscal_doc_status_valid';
    EXECUTE 'ALTER TABLE public.gm_fiscal_documents ADD CONSTRAINT chk_fiscal_doc_status_valid
      CHECK (status IN (''draft'', ''pending'', ''submitted'', ''accepted'', ''rejected'', ''cancelled'', ''error''))';
  END IF;
END $$;

-- gm_export_jobs.status
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gm_export_jobs') THEN
    EXECUTE 'ALTER TABLE public.gm_export_jobs DROP CONSTRAINT IF EXISTS chk_export_jobs_status_valid';
    EXECUTE 'ALTER TABLE public.gm_export_jobs ADD CONSTRAINT chk_export_jobs_status_valid
      CHECK (status IN (''pending'', ''processing'', ''completed'', ''failed'', ''expired''))';
  END IF;
END $$;

-- gm_backup_runs.status
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gm_backup_runs') THEN
    EXECUTE 'ALTER TABLE public.gm_backup_runs DROP CONSTRAINT IF EXISTS chk_backup_runs_status_valid';
    EXECUTE 'ALTER TABLE public.gm_backup_runs ADD CONSTRAINT chk_backup_runs_status_valid
      CHECK (status IN (''pending'', ''running'', ''completed'', ''failed''))';
  END IF;
END $$;

-- gm_tables.status
ALTER TABLE public.gm_tables DROP CONSTRAINT IF EXISTS chk_tables_status_valid;
ALTER TABLE public.gm_tables ADD CONSTRAINT chk_tables_status_valid
  CHECK (status IN ('closed', 'open', 'occupied', 'reserved', 'blocked'));

-- gm_restaurants.status
ALTER TABLE public.gm_restaurants DROP CONSTRAINT IF EXISTS chk_restaurants_status_valid;
ALTER TABLE public.gm_restaurants ADD CONSTRAINT chk_restaurants_status_valid
  CHECK (status IN ('draft', 'active', 'paused', 'suspended', 'archived'));

-- gm_tasks.status
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gm_tasks') THEN
    EXECUTE 'ALTER TABLE public.gm_tasks DROP CONSTRAINT IF EXISTS chk_tasks_status_valid';
    EXECUTE 'ALTER TABLE public.gm_tasks ADD CONSTRAINT chk_tasks_status_valid
      CHECK (status IN (''OPEN'', ''IN_PROGRESS'', ''DONE'', ''CANCELLED'', ''SKIPPED''))';
  END IF;
END $$;

-- merchant_subscriptions.status
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchant_subscriptions') THEN
    EXECUTE 'ALTER TABLE public.merchant_subscriptions DROP CONSTRAINT IF EXISTS chk_merchant_sub_status_valid';
    EXECUTE 'ALTER TABLE public.merchant_subscriptions ADD CONSTRAINT chk_merchant_sub_status_valid
      CHECK (status IN (''active'', ''past_due'', ''cancelled'', ''trialing'', ''paused'', ''incomplete''))';
  END IF;
END $$;

-- gm_mobile_activation_requests.status
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gm_mobile_activation_requests') THEN
    EXECUTE 'ALTER TABLE public.gm_mobile_activation_requests DROP CONSTRAINT IF EXISTS chk_activation_status_valid';
    EXECUTE 'ALTER TABLE public.gm_mobile_activation_requests ADD CONSTRAINT chk_activation_status_valid
      CHECK (status IN (''pending'', ''approved'', ''rejected'', ''expired'', ''used''))';
  END IF;
END $$;

-- gm_tpv_handoffs.status
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gm_tpv_handoffs') THEN
    EXECUTE 'ALTER TABLE public.gm_tpv_handoffs DROP CONSTRAINT IF EXISTS chk_tpv_handoff_status_valid';
    EXECUTE 'ALTER TABLE public.gm_tpv_handoffs ADD CONSTRAINT chk_tpv_handoff_status_valid
      CHECK (status IN (''requested'', ''accepted'', ''rejected'', ''completed'', ''expired''))';
  END IF;
END $$;

-- =============================================================================
-- 2. AMOUNT / FINANCIAL CONSTRAINTS (non-negative)
-- =============================================================================

-- gm_orders: totals must be non-negative
ALTER TABLE public.gm_orders DROP CONSTRAINT IF EXISTS chk_orders_total_non_negative;
ALTER TABLE public.gm_orders ADD CONSTRAINT chk_orders_total_non_negative
  CHECK (total_cents >= 0);

ALTER TABLE public.gm_orders DROP CONSTRAINT IF EXISTS chk_orders_subtotal_non_negative;
ALTER TABLE public.gm_orders ADD CONSTRAINT chk_orders_subtotal_non_negative
  CHECK (subtotal_cents >= 0);

ALTER TABLE public.gm_orders DROP CONSTRAINT IF EXISTS chk_orders_tax_non_negative;
ALTER TABLE public.gm_orders ADD CONSTRAINT chk_orders_tax_non_negative
  CHECK (tax_cents >= 0);

ALTER TABLE public.gm_orders DROP CONSTRAINT IF EXISTS chk_orders_discount_non_negative;
ALTER TABLE public.gm_orders ADD CONSTRAINT chk_orders_discount_non_negative
  CHECK (discount_cents >= 0);

-- gm_payments: amount must be positive
ALTER TABLE public.gm_payments DROP CONSTRAINT IF EXISTS chk_payments_amount_positive;
ALTER TABLE public.gm_payments ADD CONSTRAINT chk_payments_amount_positive
  CHECK (amount_cents > 0);

-- gm_products: price must be non-negative
ALTER TABLE public.gm_products DROP CONSTRAINT IF EXISTS chk_products_price_non_negative;
ALTER TABLE public.gm_products ADD CONSTRAINT chk_products_price_non_negative
  CHECK (price_cents >= 0);

ALTER TABLE public.gm_products DROP CONSTRAINT IF EXISTS chk_products_cost_non_negative;
ALTER TABLE public.gm_products ADD CONSTRAINT chk_products_cost_non_negative
  CHECK (cost_price_cents >= 0);

-- gm_order_items: price and subtotal must be non-negative
ALTER TABLE public.gm_order_items DROP CONSTRAINT IF EXISTS chk_order_items_price_non_negative;
ALTER TABLE public.gm_order_items ADD CONSTRAINT chk_order_items_price_non_negative
  CHECK (price_snapshot >= 0);

ALTER TABLE public.gm_order_items DROP CONSTRAINT IF EXISTS chk_order_items_subtotal_non_negative;
ALTER TABLE public.gm_order_items ADD CONSTRAINT chk_order_items_subtotal_non_negative
  CHECK (subtotal_cents >= 0);

-- gm_cash_registers: balances must be non-negative
ALTER TABLE public.gm_cash_registers DROP CONSTRAINT IF EXISTS chk_cash_register_opening_non_negative;
ALTER TABLE public.gm_cash_registers ADD CONSTRAINT chk_cash_register_opening_non_negative
  CHECK (opening_balance_cents >= 0);

ALTER TABLE public.gm_cash_registers DROP CONSTRAINT IF EXISTS chk_cash_register_sales_non_negative;
ALTER TABLE public.gm_cash_registers ADD CONSTRAINT chk_cash_register_sales_non_negative
  CHECK (total_sales_cents >= 0);

-- gm_refunds: amount must be positive
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gm_refunds') THEN
    EXECUTE 'ALTER TABLE public.gm_refunds DROP CONSTRAINT IF EXISTS chk_refunds_amount_positive';
    EXECUTE 'ALTER TABLE public.gm_refunds ADD CONSTRAINT chk_refunds_amount_positive
      CHECK (amount_cents > 0)';
  END IF;
END $$;

-- =============================================================================
-- 3. DATE LOGIC CONSTRAINTS
-- =============================================================================

-- gm_cash_registers: opened_at must precede closed_at
ALTER TABLE public.gm_cash_registers DROP CONSTRAINT IF EXISTS chk_cash_register_date_order;
ALTER TABLE public.gm_cash_registers ADD CONSTRAINT chk_cash_register_date_order
  CHECK (closed_at IS NULL OR opened_at IS NULL OR closed_at >= opened_at);

-- gm_orders: in_prep_at, ready_at, served_at must follow chronological order
ALTER TABLE public.gm_orders DROP CONSTRAINT IF EXISTS chk_orders_date_progression;
ALTER TABLE public.gm_orders ADD CONSTRAINT chk_orders_date_progression
  CHECK (
    (ready_at IS NULL OR in_prep_at IS NULL OR ready_at >= in_prep_at)
    AND (served_at IS NULL OR ready_at IS NULL OR served_at >= ready_at)
  );

-- =============================================================================
-- 4. NOT NULL ENFORCEMENT
-- =============================================================================

-- gm_orders: restaurant_id is already NOT NULL in core_schema
-- gm_payments: ensure critical fields are NOT NULL
-- (These are already defined as NOT NULL in the CREATE TABLE, but we verify)

-- gm_order_items: quantity must be at least 1 (already has CHECK > 0 in core)
-- Just verify the constraint exists
ALTER TABLE public.gm_order_items DROP CONSTRAINT IF EXISTS chk_order_items_quantity_positive;
ALTER TABLE public.gm_order_items ADD CONSTRAINT chk_order_items_quantity_positive
  CHECK (quantity > 0);

-- =============================================================================
-- 5. UNIQUE CONSTRAINTS
-- =============================================================================

-- gm_restaurants: slug must be unique (already exists in core_schema via UNIQUE on column)
-- Verify with explicit constraint name for clarity
-- (Skip if column-level UNIQUE already covers this)

-- gm_organizations: slug must be unique
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gm_organizations') THEN
    -- Check if unique constraint already exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'uq_gm_organizations_slug'
      AND conrelid = 'public.gm_organizations'::regclass
    ) THEN
      -- Only add if no unique index/constraint on slug exists
      BEGIN
        EXECUTE 'ALTER TABLE public.gm_organizations ADD CONSTRAINT uq_gm_organizations_slug UNIQUE (slug)';
      EXCEPTION
        WHEN duplicate_table THEN NULL; -- unique index already exists
        WHEN duplicate_object THEN NULL;
      END;
    END IF;
  END IF;
END $$;

-- gm_staff: unique name per restaurant (prevent duplicate staff entries)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gm_staff') THEN
    BEGIN
      CREATE UNIQUE INDEX IF NOT EXISTS uq_gm_staff_restaurant_name
        ON public.gm_staff(restaurant_id, LOWER(name)) WHERE active = true;
    EXCEPTION
      WHEN duplicate_table THEN NULL;
    END;
  END IF;
END $$;

-- gm_ingredients: unique name per restaurant
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gm_ingredients') THEN
    BEGIN
      CREATE UNIQUE INDEX IF NOT EXISTS uq_gm_ingredients_restaurant_name
        ON public.gm_ingredients(restaurant_id, LOWER(name));
    EXCEPTION
      WHEN duplicate_table THEN NULL;
    END;
  END IF;
END $$;

-- gm_restaurant_members: unique membership per user+restaurant
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gm_restaurant_members') THEN
    BEGIN
      CREATE UNIQUE INDEX IF NOT EXISTS uq_gm_restaurant_members_user_restaurant
        ON public.gm_restaurant_members(user_id, restaurant_id);
    EXCEPTION
      WHEN duplicate_table THEN NULL;
    END;
  END IF;
END $$;

-- api_keys: key_hash must be unique (already exists via idx_api_keys_hash)
-- No action needed.

-- =============================================================================
-- 6. CURRENCY VALIDATION
-- =============================================================================

-- gm_payments: currency must be a valid 3-letter ISO code
ALTER TABLE public.gm_payments DROP CONSTRAINT IF EXISTS chk_payments_currency_format;
ALTER TABLE public.gm_payments ADD CONSTRAINT chk_payments_currency_format
  CHECK (currency ~ '^[A-Z]{3}$');

-- =============================================================================
-- 7. TEXT LENGTH GUARDS (prevent accidental huge payloads)
-- =============================================================================

-- gm_orders.notes: reasonable max length
ALTER TABLE public.gm_orders DROP CONSTRAINT IF EXISTS chk_orders_notes_length;
ALTER TABLE public.gm_orders ADD CONSTRAINT chk_orders_notes_length
  CHECK (notes IS NULL OR length(notes) <= 2000);

-- gm_restaurants.name: reasonable length
ALTER TABLE public.gm_restaurants DROP CONSTRAINT IF EXISTS chk_restaurants_name_length;
ALTER TABLE public.gm_restaurants ADD CONSTRAINT chk_restaurants_name_length
  CHECK (length(name) >= 1 AND length(name) <= 200);

-- gm_products.name: reasonable length
ALTER TABLE public.gm_products DROP CONSTRAINT IF EXISTS chk_products_name_length;
ALTER TABLE public.gm_products ADD CONSTRAINT chk_products_name_length
  CHECK (length(name) >= 1 AND length(name) <= 300);

COMMIT;
