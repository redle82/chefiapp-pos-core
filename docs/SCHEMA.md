# Chefiapp POS Core -- Canonical Schema Reference

> Single source of truth for the Supabase Postgres schema.
> Last updated: 2026-03-20

---

## Table of Contents

1. [Core / Tenancy](#1-core--tenancy)
2. [Orders](#2-orders)
3. [Menu / Catalog](#3-menu--catalog)
4. [Payments / Financial](#4-payments--financial)
5. [Staff / People](#5-staff--people)
6. [Inventory](#6-inventory)
7. [Tables / Map](#7-tables--map)
8. [Tasks](#8-tasks)
9. [Devices / Terminals](#9-devices--terminals)
10. [Event Store / Audit](#10-event-store--audit)
11. [Webhooks / Integrations](#11-webhooks--integrations)
12. [Onboarding / Settings](#12-onboarding--settings)
13. [Organizations](#13-organizations)
14. [Customers](#14-customers)
15. [Receipts / Printing](#15-receipts--printing)
16. [Billing / Subscriptions](#16-billing--subscriptions)
17. [Fiscal](#17-fiscal)
18. [Ops / Infrastructure](#18-ops--infrastructure)
19. [Reservations](#19-reservations)
20. [Data Retention Policies](#20-data-retention-policies)

---

## 1. Core / Tenancy

### `public.saas_tenants`

SaaS tenant isolation root. Each tenant can own multiple restaurants.

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| name | TEXT | NO | | |
| slug | TEXT | YES | | UNIQUE |
| created_at | TIMESTAMPTZ | YES | NOW() | |
| updated_at | TIMESTAMPTZ | YES | NOW() | |

- **RLS**: No (system table)
- **Indexes**: PK only

### `public.gm_restaurants`

The core entity. Every tenant-scoped table references this via `restaurant_id`.

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | YES | | FK -> saas_tenants(id) |
| name | TEXT | NO | | CHECK len 1..200 |
| slug | TEXT | YES | | UNIQUE |
| description | TEXT | YES | | |
| owner_id | UUID | YES | | |
| status | TEXT | NO | 'draft' | CHECK (draft, active, paused, suspended, archived) |
| logo_url | TEXT | YES | | |
| logo_print_url | TEXT | YES | | |
| tax_id | TEXT | YES | | |
| default_tax_rate_bps | INTEGER | YES | 2300 | |
| org_id | UUID | YES | | FK -> gm_organizations(id) |
| onboarding_completed_at | TIMESTAMPTZ | YES | | |
| trial_ends_at | TIMESTAMPTZ | YES | | |
| config_general | JSONB | YES | '{}' | |
| config_tpv | JSONB | YES | '{}' | |
| config_kds | JSONB | YES | '{}' | |
| created_at | TIMESTAMPTZ | YES | NOW() | |
| updated_at | TIMESTAMPTZ | YES | NOW() | |

- **RLS**: YES
- **Indexes**: `idx_gm_restaurants_owner_id`, `idx_gm_restaurants_active`, `idx_gm_restaurants_org`

### `public.gm_restaurant_members`

Maps users to restaurants with roles. Used by all RLS policies for tenant isolation.

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| restaurant_id | UUID | NO | | FK -> gm_restaurants(id) |
| user_id | UUID | NO | | FK -> auth.users(id) |
| role | TEXT | NO | 'member' | |
| created_at | TIMESTAMPTZ | YES | NOW() | |

- **RLS**: YES
- **Indexes**: `idx_gm_restaurant_members_restaurant_id`, `idx_gm_restaurant_members_user_restaurant`, `idx_gm_restaurant_members_user_id`

---

## 2. Orders

### `public.gm_orders`

Sovereign ledger. All orders flow through this table. Immutable state machine enforced via trigger.

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| restaurant_id | UUID | NO | | FK -> gm_restaurants(id) CASCADE |
| table_id | UUID | YES | | FK -> gm_tables(id) |
| table_number | INTEGER | YES | | |
| status | TEXT | NO | 'OPEN' | CHECK (OPEN, PREPARING, IN_PREP, READY, CLOSED, CANCELLED) |
| payment_status | TEXT | NO | 'PENDING' | CHECK (PENDING, PAID, PARTIALLY_PAID, FAILED, REFUNDED) |
| total_cents | INTEGER | YES | 0 | CHECK >= 0 |
| subtotal_cents | INTEGER | YES | 0 | CHECK >= 0 |
| tax_cents | INTEGER | YES | 0 | CHECK >= 0 |
| discount_cents | INTEGER | YES | 0 | CHECK >= 0 |
| source | TEXT | YES | 'tpv' | |
| operator_id | UUID | YES | | |
| cash_register_id | UUID | YES | | |
| notes | TEXT | YES | | CHECK len <= 2000 |
| metadata | JSONB | YES | '{}' | |
| sync_metadata | JSONB | YES | | |
| origin | TEXT | YES | | |
| idempotency_key | TEXT | YES | | |
| version | INTEGER | YES | 1 | |
| tip_cents | INTEGER | YES | 0 | |
| in_prep_at | TIMESTAMPTZ | YES | | |
| ready_at | TIMESTAMPTZ | YES | | |
| served_at | TIMESTAMPTZ | YES | | |
| last_payment_event | TEXT | YES | | |
| created_at | TIMESTAMPTZ | YES | NOW() | |
| updated_at | TIMESTAMPTZ | YES | NOW() | |

- **RLS**: YES
- **Indexes**: `idx_orders_restaurant_status`, `idx_orders_created_at`, `idx_orders_table_id`, `idx_gm_orders_restaurant_created`, `idx_gm_orders_restaurant_payment_status`, `idx_one_open_order_per_table` (UNIQUE, partial), `idx_gm_orders_idempotency_key`
- **Triggers**: `validate_order_status_transition` (state machine enforcement)
- **State Machine**: OPEN -> PREPARING/IN_PREP/CANCELLED -> IN_PREP/CANCELLED -> READY/CANCELLED -> CLOSED

### `public.gm_order_items`

Snapshot of items at order creation time. Immutable after creation.

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| order_id | UUID | NO | | FK -> gm_orders(id) CASCADE |
| product_id | UUID | YES | | FK -> gm_products(id) |
| name_snapshot | TEXT | NO | | |
| price_snapshot | INTEGER | NO | | CHECK >= 0 |
| quantity | INTEGER | NO | 1 | CHECK > 0 |
| subtotal_cents | INTEGER | NO | | CHECK >= 0 |
| modifiers | JSONB | YES | '[]' | |
| notes | TEXT | YES | | |
| prep_time_seconds | INTEGER | YES | | |
| prep_category | TEXT | YES | | |
| station | TEXT | YES | | |
| course | TEXT | YES | | |
| tax_rate_bps | INTEGER | YES | | |
| created_by_user_id | UUID | YES | | |
| created_by_role | TEXT | YES | | |
| device_id | TEXT | YES | | |
| item_ready_at | TIMESTAMPTZ | YES | | |
| created_at | TIMESTAMPTZ | YES | NOW() | |

- **RLS**: YES
- **Indexes**: `idx_order_items_order_id`, `idx_gm_order_items_product_id`, `idx_order_items_author`, `idx_order_items_device`

---

## 3. Menu / Catalog

### `public.gm_menu_categories`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | YES | FK -> gm_restaurants |
| name | TEXT | NO | |
| sort_order | INTEGER | YES | 0 |
| created_at | TIMESTAMPTZ | YES | NOW() |

### `public.gm_products`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | NO | PK | |
| restaurant_id | UUID | YES | | FK -> gm_restaurants CASCADE |
| category_id | UUID | YES | | FK -> gm_menu_categories |
| name | TEXT | NO | | CHECK len 1..300 |
| description | TEXT | YES | | |
| price_cents | INTEGER | NO | 0 | CHECK >= 0 |
| photo_url | TEXT | YES | | |
| available | BOOLEAN | YES | TRUE | |
| track_stock | BOOLEAN | YES | FALSE | |
| stock_quantity | NUMERIC | YES | 0 | |
| cost_price_cents | INTEGER | YES | 0 | CHECK >= 0 |
| prep_time_seconds | INTEGER | YES | | |
| prep_category | TEXT | YES | | |
| station | TEXT | YES | 'KITCHEN' | |
| tax_rate_bps | INTEGER | YES | | |
| asset_id | UUID | YES | | FK -> gm_product_assets |
| product_mode | TEXT | YES | | |
| created_at | TIMESTAMPTZ | YES | NOW() | |
| updated_at | TIMESTAMPTZ | YES | NOW() | |

- **RLS**: YES
- **Indexes**: `idx_products_restaurant`, `idx_products_restaurant_available`, `idx_products_category`, `idx_gm_products_asset_id`

### `public.gm_catalog_menus`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | FK -> gm_restaurants |
| name | TEXT | NO | |
| is_active | BOOLEAN | YES | TRUE |
| created_at | TIMESTAMPTZ | YES | NOW() |
| updated_at | TIMESTAMPTZ | YES | NOW() |

- **Indexes**: `idx_gm_catalog_menus_restaurant`, `idx_gm_catalog_menus_active`

### `public.gm_catalog_categories`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| menu_id | UUID | NO | FK -> gm_catalog_menus |
| name | TEXT | NO | |
| sort_order | INTEGER | YES | 0 |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **Indexes**: `idx_gm_catalog_categories_menu`

### `public.gm_catalog_items`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| category_id | UUID | NO | FK -> gm_catalog_categories |
| product_id | UUID | YES | FK -> gm_products |
| is_available | BOOLEAN | YES | TRUE |
| sort_order | INTEGER | YES | 0 |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **Indexes**: `idx_gm_catalog_items_category`, `idx_gm_catalog_items_available`

### `public.gm_product_assets`

Shared photo library for products.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| category | TEXT | NO | |
| url | TEXT | NO | |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **Indexes**: `idx_gm_product_assets_category`

### `public.gm_catalog_v2_state`

Menu editor state for catalog v2.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | FK -> gm_restaurants |
| state | JSONB | YES | '{}' |
| created_at | TIMESTAMPTZ | YES | NOW() |
| updated_at | TIMESTAMPTZ | YES | NOW() |

---

## 4. Payments / Financial

### `public.gm_cash_registers`

One open register per restaurant enforced via unique partial index.

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | NO | PK | |
| restaurant_id | UUID | NO | | FK -> gm_restaurants CASCADE |
| name | TEXT | NO | 'Caixa Principal' | |
| status | TEXT | NO | 'closed' | CHECK (open, closed) |
| opened_at | TIMESTAMPTZ | YES | | |
| closed_at | TIMESTAMPTZ | YES | | CHECK closed_at >= opened_at |
| opened_by | TEXT | YES | | |
| closed_by | TEXT | YES | | |
| opening_balance_cents | BIGINT | YES | 0 | CHECK >= 0 |
| closing_balance_cents | BIGINT | YES | | |
| total_sales_cents | BIGINT | YES | 0 | CHECK >= 0 |
| created_at | TIMESTAMPTZ | YES | NOW() | |
| updated_at | TIMESTAMPTZ | YES | NOW() | |

- **RLS**: YES
- **Indexes**: `idx_gm_cash_registers_one_open` (UNIQUE partial), `idx_gm_cash_registers_restaurant`, `idx_gm_cash_registers_restaurant_status`

### `public.gm_payments`

All payments recorded via RPC only.

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | NO | PK | |
| restaurant_id | UUID | NO | | FK -> gm_restaurants CASCADE |
| order_id | UUID | NO | | FK -> gm_orders CASCADE |
| cash_register_id | UUID | YES | | FK -> gm_cash_registers |
| operator_id | UUID | YES | | |
| amount_cents | BIGINT | NO | | CHECK > 0 |
| currency | TEXT | NO | 'EUR' | CHECK 3-letter ISO |
| payment_method | TEXT | NO | | |
| status | TEXT | NO | 'paid' | CHECK (paid, failed, refunded, pending) |
| idempotency_key | TEXT | YES | | |
| external_checkout_id | TEXT | YES | | |
| external_payment_id | TEXT | YES | | |
| provider | TEXT | YES | | |
| created_at | TIMESTAMPTZ | YES | NOW() | |
| updated_at | TIMESTAMPTZ | YES | NOW() | |

- **RLS**: YES
- **Indexes**: `idx_gm_payments_idempotency` (UNIQUE partial), `idx_gm_payments_order_id`, `idx_gm_payments_restaurant_created`, `idx_gm_payments_restaurant_method`, `idx_gm_payments_external_checkout`, `idx_gm_payments_external_payment`, `idx_gm_payments_provider`

### `public.gm_payment_audit_logs`

Immutable audit trail for every payment attempt.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | FK -> gm_restaurants CASCADE |
| order_id | UUID | YES | |
| operator_id | UUID | YES | |
| amount_cents | INTEGER | YES | |
| method | TEXT | YES | |
| result | TEXT | NO | |
| error_code | TEXT | YES | |
| error_message | TEXT | YES | |
| idempotency_key | TEXT | YES | |
| payment_id | UUID | YES | |
| duration_ms | INTEGER | YES | |
| client_info | JSONB | YES | |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **RLS**: YES
- **Indexes**: `idx_payment_audit_restaurant_date`, `idx_payment_audit_idempotency`

### `public.gm_refunds`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | NO | PK | |
| restaurant_id | UUID | NO | | FK -> gm_restaurants |
| order_id | UUID | NO | | FK -> gm_orders |
| payment_id | UUID | YES | | FK -> gm_payments |
| amount_cents | BIGINT | NO | | CHECK > 0 |
| reason | TEXT | YES | | |
| status | TEXT | NO | 'pending' | CHECK (pending, approved, rejected, processed, failed) |
| idempotency_key | TEXT | YES | | |
| created_at | TIMESTAMPTZ | YES | NOW() | |

- **RLS**: YES
- **Indexes**: `idx_gm_refunds_restaurant`, `idx_gm_refunds_order`, `idx_gm_refunds_payment`, `idx_gm_refunds_status`, `idx_gm_refunds_restaurant_created`, `idx_gm_refunds_idempotency`

### `public.gm_reconciliations`

Shift-close reconciliation records.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | FK -> gm_restaurants |
| shift_log_id | UUID | YES | FK -> shift_logs |
| expected_cents | BIGINT | YES | |
| declared_cents | BIGINT | YES | |
| variance_cents | BIGINT | YES | |
| breakdown | JSONB | YES | |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **RLS**: YES
- **Indexes**: `idx_gm_reconciliations_restaurant_created_at`, `idx_gm_reconciliations_shift`

---

## 5. Staff / People

### `public.gm_staff`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | FK -> gm_restaurants CASCADE |
| name | TEXT | NO | |
| role | TEXT | NO | CHECK (waiter, kitchen, manager) |
| active | BOOLEAN | NO | TRUE |
| created_at | TIMESTAMPTZ | YES | NOW() |
| updated_at | TIMESTAMPTZ | YES | NOW() |

- **RLS**: YES
- **Indexes**: `idx_gm_staff_restaurant`, `idx_gm_staff_active`

### `public.gm_restaurant_people`

Extended people records (contact info, photos).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | FK -> gm_restaurants |
| name | TEXT | NO | |
| role | TEXT | YES | |
| photo_url | TEXT | YES | |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **Indexes**: `idx_gm_restaurant_people_restaurant_id`

### `public.restaurant_users`

Auth-level user-to-restaurant mapping.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | |
| user_id | UUID | NO | |
| role | TEXT | NO | 'owner' |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **RLS**: YES
- **Indexes**: `idx_restaurant_users_restaurant_id`, `idx_restaurant_users_user_id`

### `public.shift_logs`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | FK -> gm_restaurants |
| employee_id | UUID | YES | |
| shift_type | TEXT | YES | |
| started_at | TIMESTAMPTZ | YES | |
| ended_at | TIMESTAMPTZ | YES | |
| idempotency_key | TEXT | YES | |
| expected_cents | BIGINT | YES | |
| declared_cents | BIGINT | YES | |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **RLS**: YES
- **Indexes**: `idx_shift_logs_restaurant_active`, `idx_shift_logs_restaurant_created`, `idx_shift_logs_employee`, `idx_shift_logs_idempotency_key`

---

## 6. Inventory

### `public.gm_locations`

Storage locations within a restaurant.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | FK -> gm_restaurants |
| name | TEXT | NO | |
| kind | TEXT | YES | |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **RLS**: YES
- **Indexes**: `idx_locations_restaurant`, `idx_locations_kind`

### `public.gm_ingredients`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | FK -> gm_restaurants |
| name | TEXT | NO | |
| unit | TEXT | NO | |
| barcode | TEXT | YES | |
| category | TEXT | YES | |
| par_level | NUMERIC | YES | |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **RLS**: YES
- **Indexes**: `idx_ingredients_restaurant`, `idx_ingredients_barcode`, `idx_ingredients_category`, `idx_ingredients_restaurant_name`
- **Unique**: `uq_gm_ingredients_restaurant_name` (restaurant_id, LOWER(name))

### `public.gm_stock_levels`

Current stock quantity per ingredient per location.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | FK -> gm_restaurants |
| ingredient_id | UUID | NO | FK -> gm_ingredients |
| location_id | UUID | NO | FK -> gm_locations |
| quantity | NUMERIC | NO | 0 |
| unit | TEXT | YES | |
| updated_at | TIMESTAMPTZ | YES | NOW() |

- **RLS**: YES
- **Indexes**: `idx_stock_restaurant`, `idx_stock_ingredient`, `idx_stock_location`, `idx_stock_low`, `idx_stock_levels_restaurant_location`
- **Unique**: (restaurant_id, ingredient_id, location_id)

### `public.gm_stock_ledger`

Immutable log of every stock movement.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | FK -> gm_restaurants |
| ingredient_id | UUID | NO | FK -> gm_ingredients |
| location_id | UUID | NO | FK -> gm_locations |
| quantity_delta | NUMERIC | NO | |
| movement_type | TEXT | YES | |
| order_id | UUID | YES | |
| order_item_id | UUID | YES | |
| cost_per_unit_cents | INTEGER | YES | |
| total_cost_cents | INTEGER | YES | |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **RLS**: YES
- **Indexes**: `idx_ledger_restaurant_time`, `idx_ledger_ingredient`, `idx_ledger_location`, `idx_ledger_order`, `idx_ledger_order_item`, `idx_ledger_movement_type`

### `public.gm_product_bom`

Bill of materials: maps products to ingredients.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| product_id | UUID | NO | FK -> gm_products |
| ingredient_id | UUID | NO | FK -> gm_ingredients |
| restaurant_id | UUID | NO | FK -> gm_restaurants |
| quantity | NUMERIC | NO | |
| unit | TEXT | YES | |

- **Indexes**: `idx_bom_product`, `idx_bom_ingredient`, `idx_bom_restaurant`

### `public.gm_equipment`

Kitchen/bar equipment.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | FK -> gm_restaurants |
| name | TEXT | NO | |
| location_id | UUID | YES | FK -> gm_locations |
| is_active | BOOLEAN | YES | TRUE |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **RLS**: YES
- **Indexes**: `idx_equipment_restaurant`, `idx_equipment_active`, `idx_equipment_location`

### `public.gm_stock_deduction_events`

Idempotency guard for stock deductions per order.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | |
| order_id | UUID | NO | |
| items_deducted | INTEGER | YES | |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **Indexes**: `idx_stock_deduction_order`

### `public.gm_ingredient_presets`

Preset ingredient templates.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| name | TEXT | NO | |
| unit | TEXT | NO | |
| category | TEXT | YES | |
| created_at | TIMESTAMPTZ | YES | NOW() |

---

## 7. Tables / Map

### `public.gm_tables`

Physical tables in a restaurant.

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | NO | PK | |
| restaurant_id | UUID | YES | | FK -> gm_restaurants CASCADE |
| number | INTEGER | NO | | |
| qr_code | TEXT | YES | | |
| status | TEXT | YES | 'closed' | CHECK (closed, open, occupied, reserved, blocked) |
| seated_at | TIMESTAMPTZ | YES | | |
| x | NUMERIC | YES | | |
| y | NUMERIC | YES | | |
| created_at | TIMESTAMPTZ | YES | NOW() | |

- **RLS**: YES
- **Indexes**: `idx_tables_restaurant`
- **Unique**: (restaurant_id, number)

### `public.gm_restaurant_zones`

Logical zones (Sala, Esplanada, Bar, etc.)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | FK -> gm_restaurants |
| name | TEXT | NO | |
| code | TEXT | YES | |
| is_active | BOOLEAN | YES | TRUE |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **Indexes**: `idx_restaurant_zones_restaurant`, `idx_restaurant_zones_code`

### `public.gm_restaurant_tables`

Tables assigned to zones.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | FK -> gm_restaurants |
| zone_id | UUID | YES | FK -> gm_restaurant_zones |
| label | TEXT | YES | |
| capacity | INTEGER | YES | |
| is_active | BOOLEAN | YES | TRUE |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **Indexes**: `idx_restaurant_tables_restaurant`, `idx_restaurant_tables_zone`, `idx_restaurant_tables_active`

---

## 8. Tasks

### `public.gm_tasks`

Operational tasks (auto-generated or manual).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | FK -> gm_restaurants |
| template_id | UUID | YES | FK -> gm_task_templates |
| order_id | UUID | YES | FK -> gm_orders |
| order_item_id | UUID | YES | FK -> gm_order_items |
| status | TEXT | NO | 'OPEN' |
| priority | INTEGER | YES | |
| station | TEXT | YES | |
| assigned_to | UUID | YES | |
| due_at | TIMESTAMPTZ | YES | |
| date_bucket | DATE | YES | |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **RLS**: YES
- **Indexes**: `idx_tasks_restaurant_status`, `idx_tasks_station_priority`, `idx_tasks_order`, `idx_tasks_order_item`, `idx_tasks_template`, `idx_tasks_date_bucket`, `idx_tasks_created_at`, `idx_gm_tasks_due_at`

### `public.gm_task_packs`

Predefined task bundles by operation type/country.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| code | TEXT | NO | |
| name | TEXT | NO | |
| org_mode | TEXT | YES | |
| operation_type | TEXT | YES | |
| country_code | TEXT | YES | |
| min_team_size | INTEGER | YES | |
| max_team_size | INTEGER | YES | |
| min_tables | INTEGER | YES | |
| max_tables | INTEGER | YES | |
| is_active | BOOLEAN | YES | TRUE |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **Indexes**: `idx_task_packs_code`, `idx_task_packs_active`, `idx_task_packs_org_mode`, `idx_task_packs_country`, `idx_task_packs_team_size`, `idx_task_packs_tables`

### `public.gm_task_templates`

Individual task definitions within a pack.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| pack_id | UUID | NO | FK -> gm_task_packs |
| name | TEXT | NO | |
| category | TEXT | YES | |
| department | TEXT | YES | |
| station | TEXT | YES | |
| event_trigger | TEXT | YES | |
| schedule_cron | TEXT | YES | |
| is_active | BOOLEAN | YES | TRUE |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **Indexes**: `idx_task_templates_pack`, `idx_task_templates_active`, `idx_task_templates_category`, `idx_task_templates_department`, `idx_task_templates_station`, `idx_task_templates_event`, `idx_task_templates_schedule`

### `public.gm_restaurant_packs`

Which packs are enabled per restaurant.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | FK -> gm_restaurants |
| pack_id | UUID | NO | FK -> gm_task_packs |
| enabled | BOOLEAN | YES | TRUE |

- **Indexes**: `idx_restaurant_packs_restaurant`, `idx_restaurant_packs_pack`, `idx_restaurant_packs_enabled`

---

## 9. Devices / Terminals

### `public.gm_terminals`

Registered POS terminals.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | FK -> gm_restaurants |
| type | TEXT | NO | |
| name | TEXT | YES | |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **RLS**: YES
- **Indexes**: `idx_gm_terminals_restaurant`, `idx_gm_terminals_restaurant_type`

### `public.gm_device_heartbeats`

Device health monitoring.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | FK -> gm_restaurants |
| device_id | TEXT | NO | |
| last_seen_at | TIMESTAMPTZ | YES | NOW() |
| metadata | JSONB | YES | |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **RLS**: YES
- **Indexes**: `idx_gm_device_heartbeats_restaurant`, `idx_gm_device_heartbeats_last_seen`, `idx_gm_device_heartbeats_stale`

### `public.gm_device_install_tokens`

One-time install tokens for device pairing.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | |
| token | TEXT | NO | |
| expires_at | TIMESTAMPTZ | NO | |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **Indexes**: `idx_dit_restaurant`, `idx_dit_token`

### `public.gm_mobile_activation_requests`

Staff mobile app activation requests.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | FK -> gm_restaurants |
| staff_id | UUID | NO | FK -> gm_staff |
| status | TEXT | NO | 'pending' |
| expires_at | TIMESTAMPTZ | YES | |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **Indexes**: `idx_gm_mobile_activation_requests_restaurant`, `idx_gm_mobile_activation_requests_staff`, `idx_gm_mobile_activation_requests_status_expires`

---

## 10. Event Store / Audit

### `public.event_store`

Event sourcing store with optimistic concurrency.

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| sequence_id | BIGSERIAL | NO | | |
| event_id | UUID | NO | | PK |
| stream_type | TEXT | NO | | |
| stream_id | TEXT | NO | | |
| stream_version | INTEGER | NO | | UNIQUE (stream_type, stream_id, stream_version) |
| event_type | TEXT | NO | | |
| payload | JSONB | NO | '{}' | |
| meta | JSONB | NO | '{}' | |
| restaurant_id | UUID | YES | | |
| actor_ref | TEXT | YES | | |
| causation_id | UUID | YES | | |
| correlation_id | UUID | YES | | |
| hash | TEXT | YES | | |
| idempotency_key | TEXT | YES | | |
| created_at | TIMESTAMPTZ | NO | NOW() | |

- **RLS**: YES
- **Indexes**: `idx_event_store_stream`, `idx_event_store_idempotency` (UNIQUE partial), `idx_event_store_restaurant_id`, `idx_event_store_created_at`, `idx_event_store_actor_ref`, `idx_event_store_causation_id`, `idx_event_store_correlation_id`

### `public.legal_seals`

Immutable legal seals per entity state transition.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| seal_id | TEXT | NO | PK |
| entity_type | TEXT | NO | |
| entity_id | TEXT | NO | |
| legal_state | TEXT | NO | |
| seal_event_id | UUID | NO | |
| stream_hash | TEXT | NO | |
| financial_state_snapshot | JSONB | NO | '{}' |
| sealed_at | TIMESTAMPTZ | NO | NOW() |
| legal_sequence_id | INTEGER | NO | nextval |
| restaurant_id | UUID | YES | |

- **RLS**: YES
- **Indexes**: `idx_legal_seals_entity`, `idx_legal_seals_restaurant_id`, `idx_legal_seals_legal_sequence`, `idx_legal_seals_seal_event`, `idx_legal_seals_sealed_at`
- **Unique**: (entity_type, entity_id, legal_state)

### `public.gm_audit_logs`

Partitioned audit log (by month).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | |
| event_type | TEXT | NO | |
| actor_id | UUID | YES | |
| resource_type | TEXT | YES | |
| resource_id | UUID | YES | |
| payload | JSONB | YES | |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **RLS**: YES
- **Partitioned**: RANGE by created_at (monthly partitions)
- **Indexes**: `idx_audit_restaurant_date`, `idx_audit_restaurant_event_type`, `idx_audit_restaurant_actor`, `idx_audit_restaurant_resource`, `idx_audit_logs_actor`

### `public.gm_audit_mode`

Flag table for audit mode per restaurant.

- **RLS**: YES
- **Indexes**: `idx_audit_mode_restaurant`, `idx_audit_mode_active`

### `public.core_event_log`

Lightweight event log for system-level events.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | YES | |
| event_type | TEXT | NO | |
| payload | JSONB | YES | |
| correlation_id | UUID | YES | |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **RLS**: YES
- **Indexes**: `idx_core_event_log_restaurant_created`, `idx_core_event_log_event_type_created`, `idx_core_event_log_correlation`, `idx_core_event_log_restaurant_type`

---

## 11. Webhooks / Integrations

### `public.webhook_events`

Inbound webhook events from payment providers.

- **RLS**: YES
- **Indexes**: `idx_webhook_events_event_id`, `idx_webhook_events_created_type`, `idx_webhook_events_order_id`, `idx_webhook_events_provider_status`, `idx_webhook_events_received_at`

### `public.webhook_deliveries`

Outbound webhook delivery attempts.

- **RLS**: No
- **Indexes**: `idx_webhook_deliveries_restaurant_id`, `idx_webhook_deliveries_restaurant_created`, `idx_webhook_deliveries_created_status`, `idx_webhook_deliveries_next_retry`, `idx_webhook_deliveries_pending`

### `public.webhook_secrets`

Provider webhook signing secrets.

### `public.webhook_out_config`

Outbound webhook configuration per restaurant.

- **RLS**: YES
- **Indexes**: `idx_webhook_out_config_restaurant_enabled`

### `public.webhook_out_delivery_log`

Outbound webhook delivery log.

- **RLS**: YES
- **Indexes**: `idx_webhook_out_delivery_log_config`, `idx_webhook_out_delivery_log_restaurant_attempted`, `idx_webhook_out_log_status`

### `public.integration_webhook_events`

Third-party integration events (Glovo, UberEats, etc.)

### `public.gm_integration_credentials`

Encrypted credentials for third-party integrations.

- **RLS**: YES
- **Indexes**: `idx_integration_credentials_restaurant_provider`

---

## 12. Onboarding / Settings

### `public.gm_onboarding_state`

Wizard state persistence.

- **RLS**: YES
- **Indexes**: `idx_gm_onboarding_state_restaurant_id`, `idx_gm_onboarding_state_user_id`, `idx_gm_onboarding_state_org_id`

### `public.restaurant_schedules`

Operating hours by day of week.

- **RLS**: YES
- **Indexes**: `idx_restaurant_schedules_restaurant`, `idx_restaurant_schedules_day`

### `public.restaurant_setup_status`

Setup completion tracking.

- **RLS**: YES
- **Indexes**: `idx_restaurant_setup_status_restaurant`

### `public.restaurant_zones`

Legacy zone configuration.

- **RLS**: YES
- **Indexes**: `idx_restaurant_zones_restaurant`, `idx_restaurant_zones_type`

### `public.gm_operation_versions`

Versioned operation configurations (menu versions, layout versions).

- **Indexes**: `idx_operation_versions_restaurant`, `idx_operation_versions_active`, `idx_operation_versions_draft`, `idx_operation_versions_unique_active`

---

## 13. Organizations

### `public.gm_organizations`

Multi-restaurant organization groups.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| name | TEXT | NO | |
| slug | TEXT | YES | UNIQUE |
| owner_id | UUID | NO | |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **RLS**: YES
- **Indexes**: `idx_gm_organizations_owner`, `idx_gm_organizations_slug`

### `public.gm_org_members`

Organization membership.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| org_id | UUID | NO | FK -> gm_organizations |
| user_id | UUID | NO | |
| role | TEXT | NO | 'member' |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **RLS**: YES
- **Indexes**: `idx_gm_org_members_org`, `idx_gm_org_members_user`

---

## 14. Customers

### `public.gm_customers`

Customer CRM records.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | PK |
| restaurant_id | UUID | NO | FK -> gm_restaurants |
| name | TEXT | YES | |
| email | TEXT | YES | |
| phone | TEXT | YES | |
| notes | TEXT | YES | |
| total_visits | INTEGER | YES | 0 |
| total_spent_cents | BIGINT | YES | 0 |
| created_at | TIMESTAMPTZ | YES | NOW() |

- **RLS**: YES
- **Indexes**: `idx_gm_customers_restaurant_id`, `idx_gm_customers_created_at`, `idx_gm_customers_email`, `idx_gm_customers_phone`

---

## 15. Receipts / Printing

### `public.gm_receipt_log`

Receipt generation and print history.

- **RLS**: YES
- **Indexes**: `idx_receipt_log_restaurant`, `idx_receipt_log_order`, `idx_receipt_log_created`, `idx_receipt_log_type`

### `public.gm_label_profiles`

Label printing profiles (kitchen labels, etc.)

- **Indexes**: `idx_label_profiles_restaurant_updated`, `idx_label_profiles_unique_scope`

### `public.gm_printer_assignments`

Printer routing rules (which printer handles which station/zone).

- **Indexes**: `idx_printer_assignments_restaurant`, `idx_printer_assignments_unique_scope`

---

## 16. Billing / Subscriptions

### `public.billing_plans`

Available subscription plans.

### `public.billing_plan_prices`

Multi-currency pricing per plan.

- **Indexes**: `idx_billing_plan_prices_plan_currency`

### `public.merchant_subscriptions`

Active subscriptions per restaurant.

- **Indexes**: `idx_merchant_subs_restaurant`, `idx_merchant_subs_status`, `idx_merchant_subs_stripe_cust`, `idx_merchant_subs_active`

### `public.billing_invoices`

Invoice records.

- **Indexes**: `idx_billing_invoices_restaurant`, `idx_billing_invoices_restaurant_created`

### `public.billing_configs`

Per-restaurant billing configuration.

- **RLS**: YES
- **Indexes**: `idx_billing_configs_restaurant_id`

### `public.billing_incidents`

Billing-related incidents (failed charges, etc.)

- **RLS**: YES (dynamic)
- **Indexes**: `billing_incidents_restaurant_created_idx`, `billing_incidents_event_id_idx`, `billing_incidents_unique_event_reason`

### `public.merchant_code_mapping`

Payment provider merchant code mappings.

- **RLS**: YES
- **Indexes**: `idx_merchant_code_mapping_restaurant`, `idx_merchant_code_mapping_provider_code`

---

## 17. Fiscal

### `public.gm_fiscal_documents`

Tax/fiscal document records (invoices, receipts, credit notes).

- **RLS**: YES
- **Indexes**: `idx_gm_fiscal_docs_restaurant`, `idx_gm_fiscal_docs_order`, `idx_gm_fiscal_docs_refund`, `idx_gm_fiscal_docs_status`, `idx_gm_fiscal_docs_jurisdiction`, `idx_gm_fiscal_docs_retry`, `idx_gm_fiscal_docs_idempotency`, `idx_gm_fiscal_docs_sequence`, `idx_gm_fiscal_docs_restaurant_created`

### `public.gm_fiscal_certifications`

Fiscal certification records per jurisdiction.

- **RLS**: YES
- **Indexes**: `idx_fiscal_cert_restaurant`, `idx_fiscal_cert_active`, `idx_fiscal_cert_idempotency`

### `public.gm_fiscal_snapshots`

End-of-day fiscal snapshots.

- **Indexes**: `idx_gm_fiscal_snapshots_restaurant_created_at`, `idx_gm_fiscal_snapshots_type`

---

## 18. Ops / Infrastructure

### `public.gm_backup_runs`

Backup execution history.

- **RLS**: YES
- **Indexes**: `idx_backup_runs_restaurant`, `idx_backup_runs_status`, `idx_backup_runs_scope`

### `public.gm_ops_integrity_snapshots`

System integrity check results.

- **Indexes**: `idx_ops_integrity_restaurant`, `idx_ops_integrity_type`

### `public.gm_export_jobs`

Data export job queue.

- **RLS**: YES
- **Indexes**: `idx_export_jobs_restaurant`, `idx_export_jobs_status`, `idx_export_jobs_type`, `idx_export_jobs_idempotency`

### `public.core_metrics`

System-level metrics.

### `public.gm_rate_limit_config`

Rate limiting configuration per endpoint.

- **RLS**: YES
- **Indexes**: `idx_gm_rate_limit_config_endpoint`

### `public.gm_rate_limit_buckets`

Rate limit token buckets.

- **RLS**: YES
- **Indexes**: `idx_gm_rate_limit_buckets_restaurant`, `idx_gm_rate_limit_buckets_endpoint`

### `public.api_keys`

API key management.

- **RLS**: YES
- **Indexes**: `idx_api_keys_restaurant`, `idx_api_keys_hash` (UNIQUE)

### `public.gm_tpv_handoffs`

TPV-to-TPV handoff requests.

- **Indexes**: `idx_tpv_handoffs_restaurant_status_requested`

---

## 19. Reservations

### `gm_reservations`

Restaurant reservation records.

- **RLS**: YES
- **Indexes**: `idx_reservations_restaurant_date`, `idx_reservations_status`, `idx_gm_reservations_restaurant_date`

### `gm_no_show_history`

No-show tracking per customer.

- **RLS**: YES
- **Indexes**: `idx_no_show_restaurant`, `idx_no_show_history_date`

### `gm_overbooking_config`

Overbooking configuration per restaurant.

- **RLS**: YES
- **Indexes**: `idx_overbooking_config_restaurant`

---

## 20. Data Retention Policies

| Table | Retention | Strategy | Notes |
|-------|-----------|----------|-------|
| `gm_orders` | Indefinite | None | Legal requirement: fiscal records must be kept |
| `gm_order_items` | Indefinite | None | Tied to orders |
| `gm_payments` | Indefinite | None | Financial records |
| `gm_payment_audit_logs` | 2 years | Archive to cold storage | High volume, needed for audits |
| `gm_refunds` | Indefinite | None | Financial records |
| `event_store` | Indefinite | None | Legal/audit requirement |
| `legal_seals` | Indefinite | None | Legal requirement |
| `gm_audit_logs` | 1 year | Partitioned by month, drop old partitions | Operational audit trail |
| `core_event_log` | 90 days | Periodic DELETE | System events |
| `gm_device_heartbeats` | 30 days | Periodic DELETE | High frequency, low value after 30d |
| `gm_rate_limit_buckets` | 24 hours | Periodic DELETE | Ephemeral rate limit state |
| `webhook_deliveries` | 90 days | Periodic DELETE | Retry state |
| `webhook_out_delivery_log` | 90 days | Periodic DELETE | Delivery history |
| `gm_stock_ledger` | 1 year | Archive to cold storage | High volume inventory movements |
| `gm_backup_runs` | 1 year | Periodic DELETE | Backup metadata |
| `billing_incidents` | 1 year | Periodic DELETE | Billing events |
| `gm_fiscal_documents` | 10 years | None | Portuguese/EU fiscal law requirement |
| `gm_fiscal_snapshots` | 10 years | None | Fiscal law |
| `gm_reconciliations` | 5 years | None | Financial audit |
| `shift_logs` | 2 years | Archive | Labour law compliance |

### Archive strategy

- **Cold storage**: Export to Parquet files in S3/GCS, remove from Postgres
- **Partitioned tables**: Drop old partitions (audit_logs)
- **Periodic DELETE**: Cron job via Supabase Edge Function or pg_cron

---

## Foreign Key Relationship Map

```
saas_tenants
  └── gm_restaurants (tenant_id)
        ├── gm_restaurant_members (restaurant_id)
        ├── gm_orders (restaurant_id)
        │     ├── gm_order_items (order_id)
        │     ├── gm_payments (order_id)
        │     ├── gm_refunds (order_id)
        │     └── gm_fiscal_documents (order_id)
        ├── gm_products (restaurant_id)
        │     ├── gm_order_items (product_id)
        │     └── gm_product_bom (product_id)
        ├── gm_menu_categories (restaurant_id)
        │     └── gm_products (category_id)
        ├── gm_tables (restaurant_id)
        │     └── gm_orders (table_id)
        ├── gm_cash_registers (restaurant_id)
        │     └── gm_payments (cash_register_id)
        ├── gm_staff (restaurant_id)
        ├── gm_terminals (restaurant_id)
        ├── gm_locations (restaurant_id)
        │     ├── gm_stock_levels (location_id)
        │     └── gm_stock_ledger (location_id)
        ├── gm_ingredients (restaurant_id)
        │     ├── gm_stock_levels (ingredient_id)
        │     ├── gm_stock_ledger (ingredient_id)
        │     └── gm_product_bom (ingredient_id)
        ├── gm_catalog_menus (restaurant_id)
        │     └── gm_catalog_categories (menu_id)
        │           └── gm_catalog_items (category_id)
        ├── gm_tasks (restaurant_id)
        ├── gm_customers (restaurant_id)
        ├── gm_receipt_log (restaurant_id)
        ├── gm_audit_logs (restaurant_id)
        ├── gm_device_heartbeats (restaurant_id)
        ├── gm_reconciliations (restaurant_id)
        ├── gm_fiscal_certifications (restaurant_id)
        ├── shift_logs (restaurant_id)
        └── billing_configs (restaurant_id)

gm_organizations
  ├── gm_org_members (org_id)
  └── gm_restaurants (org_id)

gm_task_packs
  ├── gm_task_templates (pack_id)
  └── gm_restaurant_packs (pack_id)
```
