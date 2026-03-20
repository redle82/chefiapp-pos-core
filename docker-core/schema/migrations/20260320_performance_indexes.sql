-- =============================================================================
-- Migration: 20260320_performance_indexes.sql
-- Purpose: Add missing performance indexes across all tenant-scoped tables.
--
-- Guidelines:
--   - Every tenant table must have an index on restaurant_id
--   - Date-range queries need (restaurant_id, created_at DESC) composites
--   - Status fields used in WHERE clauses need indexes
--   - Foreign keys used in JOINs need indexes
--   - All statements are idempotent (IF NOT EXISTS)
--   - CONCURRENTLY cannot be used inside a transaction block;
--     Supabase migrations run inside transactions, so we use regular CREATE INDEX.
--     For production hot-deploys, run these manually with CONCURRENTLY.
-- =============================================================================

-- =============================================================================
-- 1. ORDERS CONTEXT
-- =============================================================================

-- Composite for "orders by restaurant filtered by payment status" (dashboard, reports)
CREATE INDEX IF NOT EXISTS idx_gm_orders_restaurant_payment_status
  ON public.gm_orders(restaurant_id, payment_status);
COMMENT ON INDEX idx_gm_orders_restaurant_payment_status IS
  'Dashboard: filter orders by payment status within a restaurant.';

-- Orders by status alone (global admin queries, background jobs)
CREATE INDEX IF NOT EXISTS idx_gm_orders_status
  ON public.gm_orders(status);
COMMENT ON INDEX idx_gm_orders_status IS
  'Background jobs: find orders in a specific status across all restaurants.';

-- Order items: restaurant_id for tenant-scoped queries via JOIN
CREATE INDEX IF NOT EXISTS idx_gm_order_items_product_id
  ON public.gm_order_items(product_id) WHERE product_id IS NOT NULL;
COMMENT ON INDEX idx_gm_order_items_product_id IS
  'Product sales analysis: find all order items for a given product.';

-- =============================================================================
-- 2. PAYMENTS CONTEXT
-- =============================================================================

-- Payments by method (reporting: "how much was paid by card vs cash")
CREATE INDEX IF NOT EXISTS idx_gm_payments_restaurant_method
  ON public.gm_payments(restaurant_id, payment_method);
COMMENT ON INDEX idx_gm_payments_restaurant_method IS
  'Reports: payment method breakdown per restaurant.';

-- Payments by status (find failed payments for retry/alerting)
CREATE INDEX IF NOT EXISTS idx_gm_payments_status
  ON public.gm_payments(status);
COMMENT ON INDEX idx_gm_payments_status IS
  'Alerting: find failed or pending payments across all restaurants.';

-- Cash register transactions: restaurant + created_at for shift reports
CREATE INDEX IF NOT EXISTS idx_gm_cash_registers_restaurant_status
  ON public.gm_cash_registers(restaurant_id, status);
COMMENT ON INDEX idx_gm_cash_registers_restaurant_status IS
  'Shift management: find open/closed registers per restaurant.';

-- Payment audit logs: idempotency key lookup
CREATE INDEX IF NOT EXISTS idx_payment_audit_idempotency
  ON public.gm_payment_audit_logs(idempotency_key)
  WHERE idempotency_key IS NOT NULL;
COMMENT ON INDEX idx_payment_audit_idempotency IS
  'Idempotency: fast duplicate detection for payment audit logs.';

-- =============================================================================
-- 3. REFUNDS
-- =============================================================================

-- Refunds by created_at for date-range reports
CREATE INDEX IF NOT EXISTS idx_gm_refunds_restaurant_created
  ON public.gm_refunds(restaurant_id, created_at DESC);
COMMENT ON INDEX idx_gm_refunds_restaurant_created IS
  'Reports: refunds by restaurant ordered by date.';

-- =============================================================================
-- 4. INVENTORY CONTEXT
-- =============================================================================

-- Stock levels: composite for low-stock alerts per location
CREATE INDEX IF NOT EXISTS idx_stock_levels_restaurant_location
  ON public.gm_stock_levels(restaurant_id, location_id, ingredient_id);
COMMENT ON INDEX idx_stock_levels_restaurant_location IS
  'Inventory: fast lookup of stock at a specific location.';

-- Ingredients: name search within restaurant
CREATE INDEX IF NOT EXISTS idx_ingredients_restaurant_name
  ON public.gm_ingredients(restaurant_id, name);
COMMENT ON INDEX idx_ingredients_restaurant_name IS
  'Search: find ingredients by name within a restaurant.';

-- Stock ledger: movement_type for filtering
CREATE INDEX IF NOT EXISTS idx_ledger_movement_type
  ON public.gm_stock_ledger(restaurant_id, movement_type)
  WHERE movement_type IS NOT NULL;
COMMENT ON INDEX idx_ledger_movement_type IS
  'Reports: filter stock movements by type (sale, waste, purchase, etc.).';

-- Stock deduction events: order_id for fast lookup
CREATE INDEX IF NOT EXISTS idx_stock_deduction_order
  ON public.gm_stock_deduction_events(order_id);
COMMENT ON INDEX idx_stock_deduction_order IS
  'Deduction idempotency: fast check if order already had stock deducted.';

-- =============================================================================
-- 5. CATALOG CONTEXT
-- =============================================================================

-- Catalog categories: restaurant_id for tenant queries
CREATE INDEX IF NOT EXISTS idx_gm_catalog_categories_restaurant
  ON public.gm_catalog_categories(menu_id);
COMMENT ON INDEX idx_gm_catalog_categories_restaurant IS
  'Catalog: list categories for a given menu.';

-- Products: available filter for active menu display
CREATE INDEX IF NOT EXISTS idx_products_restaurant_available
  ON public.gm_products(restaurant_id, available) WHERE available = true;
COMMENT ON INDEX idx_products_restaurant_available IS
  'Menu display: list only available products for a restaurant.';

-- Products: category_id for category-based listing
CREATE INDEX IF NOT EXISTS idx_products_category
  ON public.gm_products(category_id) WHERE category_id IS NOT NULL;
COMMENT ON INDEX idx_products_category IS
  'Menu: list products within a category.';

-- =============================================================================
-- 6. STAFF / SHIFT CONTEXT
-- =============================================================================

-- Staff: active members per restaurant
CREATE INDEX IF NOT EXISTS idx_gm_staff_active
  ON public.gm_staff(restaurant_id, active) WHERE active = true;
COMMENT ON INDEX idx_gm_staff_active IS
  'Staff: list only active staff members per restaurant.';

-- Shift logs: restaurant + created_at for shift history
CREATE INDEX IF NOT EXISTS idx_shift_logs_restaurant_created
  ON public.shift_logs(restaurant_id, created_at DESC);
COMMENT ON INDEX idx_shift_logs_restaurant_created IS
  'Shift history: list shifts by restaurant ordered by date.';

-- Restaurant members: fast membership check
CREATE INDEX IF NOT EXISTS idx_gm_restaurant_members_user_id
  ON public.gm_restaurant_members(user_id);
COMMENT ON INDEX idx_gm_restaurant_members_user_id IS
  'Auth: fast lookup of all restaurants a user belongs to.';

-- =============================================================================
-- 7. TASKS CONTEXT
-- =============================================================================

-- Tasks: due_at for overdue task alerts
CREATE INDEX IF NOT EXISTS idx_gm_tasks_due_at
  ON public.gm_tasks(due_at) WHERE due_at IS NOT NULL AND status = 'OPEN';
COMMENT ON INDEX idx_gm_tasks_due_at IS
  'Alerts: find overdue open tasks across all restaurants.';

-- =============================================================================
-- 8. DEVICES / TERMINALS
-- =============================================================================

-- Device heartbeats: find stale devices
CREATE INDEX IF NOT EXISTS idx_gm_device_heartbeats_stale
  ON public.gm_device_heartbeats(restaurant_id, last_seen_at DESC);
COMMENT ON INDEX idx_gm_device_heartbeats_stale IS
  'Monitoring: find devices ordered by last heartbeat for staleness check.';

-- =============================================================================
-- 9. CUSTOMERS
-- =============================================================================

-- Customers: email/phone lookup
CREATE INDEX IF NOT EXISTS idx_gm_customers_email
  ON public.gm_customers(restaurant_id, email)
  WHERE email IS NOT NULL;
COMMENT ON INDEX idx_gm_customers_email IS
  'CRM: find customer by email within a restaurant.';

CREATE INDEX IF NOT EXISTS idx_gm_customers_phone
  ON public.gm_customers(restaurant_id, phone)
  WHERE phone IS NOT NULL;
COMMENT ON INDEX idx_gm_customers_phone IS
  'CRM: find customer by phone within a restaurant.';

-- =============================================================================
-- 10. AUDIT / EVENT LOGS
-- =============================================================================

-- Core event log: event_type + restaurant for filtered views
CREATE INDEX IF NOT EXISTS idx_core_event_log_restaurant_type
  ON public.core_event_log(restaurant_id, event_type);
COMMENT ON INDEX idx_core_event_log_restaurant_type IS
  'Audit: filter events by type within a restaurant.';

-- Audit logs: actor_id for "who did what" queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
  ON public.gm_audit_logs(actor_id) WHERE actor_id IS NOT NULL;
COMMENT ON INDEX idx_audit_logs_actor IS
  'Audit: find all actions by a specific actor.';

-- =============================================================================
-- 11. BILLING / SUBSCRIPTIONS
-- =============================================================================

-- Merchant subscriptions: find active subscriptions
CREATE INDEX IF NOT EXISTS idx_merchant_subs_active
  ON public.merchant_subscriptions(restaurant_id, status)
  WHERE status = 'active';
COMMENT ON INDEX idx_merchant_subs_active IS
  'Billing: fast check if restaurant has active subscription.';

-- Billing invoices: date-range queries
CREATE INDEX IF NOT EXISTS idx_billing_invoices_restaurant_created
  ON public.billing_invoices(restaurant_id, created_at DESC);
COMMENT ON INDEX idx_billing_invoices_restaurant_created IS
  'Billing: list invoices by restaurant ordered by date.';

-- =============================================================================
-- 12. FISCAL
-- =============================================================================

-- Fiscal documents: date range for monthly reports
CREATE INDEX IF NOT EXISTS idx_gm_fiscal_docs_restaurant_created
  ON public.gm_fiscal_documents(restaurant_id, created_at DESC);
COMMENT ON INDEX idx_gm_fiscal_docs_restaurant_created IS
  'Fiscal: list fiscal documents by restaurant ordered by date.';

-- Fiscal snapshots: source-based lookup (API, UPLOAD, MANUAL)
CREATE INDEX IF NOT EXISTS idx_gm_fiscal_snapshots_source
  ON public.gm_fiscal_snapshots(restaurant_id, source);
COMMENT ON INDEX idx_gm_fiscal_snapshots_source IS
  'Fiscal: filter snapshots by source (API/UPLOAD/MANUAL) within a restaurant.';

-- =============================================================================
-- 13. WEBHOOKS
-- =============================================================================

-- Webhook deliveries: pending retries
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_pending
  ON public.webhook_deliveries(status, next_retry_at)
  WHERE status = 'pending';
COMMENT ON INDEX idx_webhook_deliveries_pending IS
  'Webhooks: find pending deliveries for retry processing.';

-- Webhook out delivery log: status_code filter for failed deliveries
CREATE INDEX IF NOT EXISTS idx_webhook_out_log_failed
  ON public.webhook_out_delivery_log(restaurant_id, status_code)
  WHERE status_code >= 400 OR status_code IS NULL;
COMMENT ON INDEX idx_webhook_out_log_failed IS
  'Webhooks: find failed outbound deliveries for retry/investigation.';

-- =============================================================================
-- 14. RESERVATIONS
-- =============================================================================

-- Reservations: restaurant + date composite for availability check
CREATE INDEX IF NOT EXISTS idx_gm_reservations_restaurant_date
  ON gm_reservations(restaurant_id, reservation_date);
COMMENT ON INDEX idx_gm_reservations_restaurant_date IS
  'Reservations: check availability for a restaurant on a specific date.';

-- =============================================================================
-- 15. RECEIPT LOG
-- =============================================================================

-- Receipt log: fiscal document number lookup for reprint
CREATE INDEX IF NOT EXISTS idx_receipt_log_fiscal_doc
  ON public.gm_receipt_log(restaurant_id, fiscal_document_number)
  WHERE fiscal_document_number IS NOT NULL;
COMMENT ON INDEX idx_receipt_log_fiscal_doc IS
  'Receipts: find receipt by fiscal document number for reprint.';
