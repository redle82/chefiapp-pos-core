#!/usr/bin/env npx tsx
/**
 * Schema Audit Script
 *
 * Reads all migration SQL files from docker-core/schema/migrations/,
 * extracts CREATE TABLE, ALTER TABLE, CREATE INDEX statements,
 * compares against a canonical schema definition, and reports drift.
 *
 * Usage:
 *   npx tsx merchant-portal/scripts/schema-audit.ts
 *
 * Exit codes:
 *   0 = all checks pass
 *   1 = drift detected (tables/indexes missing or unexpected)
 */

import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ROOT = path.resolve(import.meta.dirname ?? __dirname, "../..");
const MIGRATIONS_DIR = path.join(ROOT, "docker-core/schema/migrations");
const SCHEMA_DIR = path.join(ROOT, "docker-core/schema");
const CORE_SCHEMA = path.join(ROOT, "docker-core/schema/core_schema.sql");

// ---------------------------------------------------------------------------
// Canonical schema definition
// ---------------------------------------------------------------------------

/**
 * Canonical tables grouped by bounded context.
 * Each entry: table name -> list of required columns.
 */
const CANONICAL_TABLES: Record<string, string[]> = {
  // ── Core ──────────────────────────────────────────────────────────────
  "public.saas_tenants": ["id", "name", "slug", "created_at", "updated_at"],
  "public.gm_restaurants": [
    "id", "tenant_id", "name", "slug", "description", "owner_id",
    "status", "logo_url", "created_at", "updated_at",
  ],
  "public.gm_restaurant_members": ["id", "restaurant_id", "user_id", "role", "created_at"],

  // ── Menu ──────────────────────────────────────────────────────────────
  "public.gm_menu_categories": ["id", "restaurant_id", "name", "sort_order", "created_at"],
  "public.gm_products": [
    "id", "restaurant_id", "category_id", "name", "description",
    "price_cents", "photo_url", "available", "track_stock",
    "stock_quantity", "cost_price_cents", "created_at", "updated_at",
  ],
  "public.gm_catalog_menus": ["id", "restaurant_id", "name", "is_active", "created_at", "updated_at"],
  "public.gm_catalog_categories": ["id", "menu_id", "name", "sort_order", "created_at"],
  "public.gm_catalog_items": ["id", "category_id", "product_id", "is_available", "sort_order", "created_at"],

  // ── Orders ────────────────────────────────────────────────────────────
  "public.gm_orders": [
    "id", "restaurant_id", "table_id", "table_number", "status",
    "payment_status", "total_cents", "subtotal_cents", "tax_cents",
    "discount_cents", "source", "operator_id", "cash_register_id",
    "notes", "metadata", "created_at", "updated_at",
  ],
  "public.gm_order_items": [
    "id", "order_id", "product_id", "name_snapshot", "price_snapshot",
    "quantity", "subtotal_cents", "modifiers", "notes", "created_at",
  ],

  // ── Payments / Financial ──────────────────────────────────────────────
  "public.gm_cash_registers": [
    "id", "restaurant_id", "name", "status", "opened_at", "closed_at",
    "opened_by", "closed_by", "opening_balance_cents", "closing_balance_cents",
    "total_sales_cents", "created_at", "updated_at",
  ],
  "public.gm_payments": [
    "id", "restaurant_id", "order_id", "cash_register_id", "operator_id",
    "amount_cents", "currency", "payment_method", "status",
    "idempotency_key", "created_at", "updated_at",
  ],
  "public.gm_payment_audit_logs": [
    "id", "restaurant_id", "order_id", "operator_id", "amount_cents",
    "method", "result", "error_code", "error_message", "idempotency_key",
    "payment_id", "duration_ms", "client_info", "created_at",
  ],
  "public.gm_refunds": [
    "id", "restaurant_id", "order_id", "payment_id", "amount_cents",
    "reason", "status", "created_at",
  ],
  "public.gm_reconciliations": [
    "id", "restaurant_id", "shift_log_id", "created_at",
  ],
  "public.gm_fiscal_documents": [
    "id", "restaurant_id", "order_id", "status", "created_at",
  ],
  "public.gm_fiscal_certifications": [
    "id", "restaurant_id", "created_at",
  ],
  "public.gm_fiscal_snapshots": [
    "id", "restaurant_id", "created_at",
  ],
  "public.billing_configs": ["id", "restaurant_id", "created_at"],
  "public.billing_plans": ["id", "name", "created_at"],
  "public.billing_plan_prices": ["id", "plan_id", "created_at"],
  "public.billing_invoices": ["id", "restaurant_id", "created_at"],
  "public.billing_incidents": ["id", "restaurant_id", "created_at"],
  "public.merchant_subscriptions": ["id", "restaurant_id", "status", "created_at"],
  "public.merchant_code_mapping": ["id", "restaurant_id", "created_at"],

  // ── Tables / Map ──────────────────────────────────────────────────────
  "public.gm_tables": ["id", "restaurant_id", "number", "qr_code", "status", "created_at"],
  "public.gm_restaurant_zones": ["id", "restaurant_id", "name", "created_at"],
  "public.gm_restaurant_tables": ["id", "restaurant_id", "zone_id", "created_at"],

  // ── Staff ─────────────────────────────────────────────────────────────
  "public.gm_staff": ["id", "restaurant_id", "name", "role", "created_at"],
  "public.gm_restaurant_people": ["id", "restaurant_id", "created_at"],
  "public.restaurant_users": ["id", "restaurant_id", "user_id", "role", "created_at"],
  "public.shift_logs": ["id", "restaurant_id", "created_at"],

  // ── Inventory ─────────────────────────────────────────────────────────
  "public.gm_locations": ["id", "restaurant_id", "name", "kind", "created_at"],
  "public.gm_equipment": ["id", "restaurant_id", "name", "created_at"],
  "public.gm_equipment_ingredients": ["id", "equipment_id", "ingredient_id", "restaurant_id"],
  "public.gm_ingredients": ["id", "restaurant_id", "name", "unit", "created_at"],
  "public.gm_ingredient_presets": ["id", "name", "created_at"],
  "public.gm_stock_levels": ["id", "restaurant_id", "ingredient_id", "location_id", "quantity"],
  "public.gm_stock_ledger": ["id", "restaurant_id", "ingredient_id", "location_id", "created_at"],
  "public.gm_product_bom": ["id", "product_id", "ingredient_id", "restaurant_id"],
  "public.gm_stock_deduction_events": ["id", "restaurant_id", "order_id", "created_at"],

  // ── Tasks ─────────────────────────────────────────────────────────────
  "public.gm_tasks": ["id", "restaurant_id", "status", "created_at"],
  "public.gm_task_packs": ["id", "code", "name", "created_at"],
  "public.gm_task_templates": ["id", "pack_id", "name", "created_at"],
  "public.gm_restaurant_packs": ["id", "restaurant_id", "pack_id", "enabled"],

  // ── Devices / Terminals ───────────────────────────────────────────────
  "public.gm_terminals": ["id", "restaurant_id", "type", "created_at"],
  "public.gm_device_heartbeats": ["id", "restaurant_id", "created_at"],
  "public.gm_device_install_tokens": ["id", "restaurant_id", "created_at"],
  "public.gm_mobile_activation_requests": ["id", "restaurant_id", "staff_id", "status", "created_at"],

  // ── Event Store / Audit ───────────────────────────────────────────────
  "public.event_store": [
    "sequence_id", "event_id", "stream_type", "stream_id",
    "stream_version", "event_type", "payload", "meta", "created_at",
  ],
  "public.legal_seals": [
    "seal_id", "entity_type", "entity_id", "legal_state",
    "seal_event_id", "stream_hash", "sealed_at",
  ],
  "public.gm_audit_logs": ["id", "restaurant_id", "event_type", "created_at"],
  "public.gm_audit_mode": ["id", "restaurant_id", "created_at"],
  "public.core_event_log": ["id", "restaurant_id", "event_type", "created_at"],

  // ── Webhooks / Integrations ───────────────────────────────────────────
  "public.webhook_events": ["id", "restaurant_id", "event_type", "created_at"],
  "public.webhook_deliveries": ["id", "restaurant_id", "created_at"],
  "public.webhook_secrets": ["id", "provider", "created_at"],
  "public.webhook_out_config": ["id", "restaurant_id", "created_at"],
  "public.webhook_out_delivery_log": ["id", "restaurant_id", "created_at"],
  "public.integration_webhook_events": ["id", "restaurant_id", "created_at"],
  "public.gm_integration_credentials": ["id", "restaurant_id", "provider", "created_at"],

  // ── Onboarding / Settings ─────────────────────────────────────────────
  "public.gm_onboarding_state": ["id", "restaurant_id", "created_at"],
  "public.restaurant_schedules": ["id", "restaurant_id", "day_of_week"],
  "public.restaurant_setup_status": ["id", "restaurant_id"],
  "public.restaurant_zones": ["id", "restaurant_id", "type"],
  "public.gm_operation_versions": ["id", "restaurant_id", "created_at"],

  // ── Organizations ─────────────────────────────────────────────────────
  "public.gm_organizations": ["id", "name", "slug", "owner_id", "created_at"],
  "public.gm_org_members": ["id", "org_id", "user_id", "role", "created_at"],

  // ── Customers ─────────────────────────────────────────────────────────
  "public.gm_customers": ["id", "restaurant_id", "created_at"],

  // ── Receipts / Printing ───────────────────────────────────────────────
  "public.gm_receipt_log": ["id", "restaurant_id", "order_id", "created_at"],
  "public.gm_label_profiles": ["id", "restaurant_id", "created_at"],
  "public.gm_printer_assignments": ["id", "restaurant_id", "created_at"],

  // ── Product Assets ────────────────────────────────────────────────────
  "public.gm_product_assets": ["id", "category", "created_at"],

  // ── Ops / Infra ───────────────────────────────────────────────────────
  "public.gm_backup_runs": ["id", "restaurant_id", "status", "created_at"],
  "public.gm_ops_integrity_snapshots": ["id", "restaurant_id", "created_at"],
  "public.gm_export_jobs": ["id", "restaurant_id", "status", "created_at"],
  "public.core_metrics": ["id", "restaurant_id", "created_at"],
  "public.gm_rate_limit_config": ["id", "endpoint_name", "created_at"],
  "public.gm_rate_limit_buckets": ["id", "restaurant_id", "endpoint_name"],

  // ── API ───────────────────────────────────────────────────────────────
  "public.api_keys": ["id", "restaurant_id", "key_hash", "created_at"],

  // ── TPV ───────────────────────────────────────────────────────────────
  "public.gm_tpv_handoffs": ["id", "restaurant_id", "status", "created_at"],

  // ── Catalog v2 ────────────────────────────────────────────────────────
  "public.gm_catalog_v2_state": ["id", "restaurant_id", "created_at"],

  // ── Reservations (gm_ prefixed) ───────────────────────────────────────
  "gm_reservations": ["id", "restaurant_id", "status", "created_at"],
  "gm_no_show_history": ["id", "restaurant_id", "created_at"],
  "gm_overbooking_config": ["id", "restaurant_id"],
};

/**
 * Required indexes that must exist across the schema.
 * Pattern: index_name -> table(columns) description.
 */
const REQUIRED_INDEXES: string[] = [
  // Orders
  "idx_orders_restaurant_status",
  "idx_orders_created_at",
  "idx_orders_table_id",
  "idx_order_items_order_id",
  "idx_gm_orders_restaurant_created",
  "idx_one_open_order_per_table",
  // Products
  "idx_products_restaurant",
  // Tables
  "idx_tables_restaurant",
  // Payments
  "idx_gm_payments_idempotency",
  "idx_gm_payments_order_id",
  "idx_gm_payments_restaurant_created",
  "idx_gm_cash_registers_one_open",
  "idx_gm_cash_registers_restaurant",
  "idx_payment_audit_restaurant_date",
  // Event store
  "idx_event_store_idempotency",
  "idx_event_store_stream",
  "idx_event_store_restaurant_id",
  // Legal seals
  "idx_legal_seals_entity",
  "idx_legal_seals_restaurant_id",
  // Audit
  "idx_audit_restaurant_date",
  // Staff
  "idx_gm_staff_restaurant",
  // Terminals
  "idx_gm_terminals_restaurant",
  // Inventory
  "idx_ingredients_restaurant",
  "idx_stock_restaurant",
  "idx_ledger_restaurant_time",
  // Catalog
  "idx_gm_catalog_menus_restaurant",
  "idx_gm_catalog_items_category",
  // Webhooks
  "idx_webhook_events_event_id",
  // Restaurants
  "idx_gm_restaurants_owner_id",
  "idx_gm_restaurants_active",
  // Shift logs
  "idx_shift_logs_restaurant_active",
  // Customers
  "idx_gm_customers_restaurant_id",
  // Receipt log
  "idx_receipt_log_restaurant",
  // Refunds
  "idx_gm_refunds_restaurant",
  "idx_gm_refunds_order",
];

/**
 * Tables that MUST have RLS enabled.
 * Every tenant-scoped table should be on this list.
 */
const TABLES_REQUIRING_RLS: string[] = [
  "public.gm_restaurants",
  "public.gm_orders",
  "public.gm_order_items",
  "public.gm_payments",
  "public.gm_cash_registers",
  "public.gm_payment_audit_logs",
  "public.gm_products",
  "public.gm_staff",
  "public.gm_terminals",
  "public.gm_tasks",
  "public.gm_restaurant_members",
  "public.gm_audit_logs",
  "public.gm_customers",
  "public.gm_equipment",
  "public.gm_ingredients",
  "public.gm_stock_levels",
  "public.gm_stock_ledger",
  "public.gm_reconciliations",
  "public.gm_refunds",
  "public.gm_fiscal_documents",
  "public.gm_receipt_log",
  "public.gm_onboarding_state",
  "public.gm_organizations",
  "public.gm_org_members",
  "public.event_store",
  "public.legal_seals",
  "public.shift_logs",
  "public.webhook_events",
  "public.gm_device_heartbeats",
  "public.gm_export_jobs",
  "public.gm_backup_runs",
  "public.billing_configs",
  "public.core_event_log",
  "public.api_keys",
  "public.gm_locations",
  "public.gm_fiscal_certifications",
  "public.restaurant_users",
  "public.restaurant_schedules",
  "public.restaurant_setup_status",
];

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

function readAllMigrations(): string {
  const sources: string[] = [];

  // Top-level schema SQL files (core_schema.sql, patch files, etc.)
  if (fs.existsSync(SCHEMA_DIR)) {
    const topLevelFiles = fs.readdirSync(SCHEMA_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const file of topLevelFiles) {
      sources.push(fs.readFileSync(path.join(SCHEMA_DIR, file), "utf-8"));
    }
  }

  // All migration files
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`ERROR: Migrations directory not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    sources.push(fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8"));
  }

  return sources.join("\n");
}

function extractTables(sql: string): Set<string> {
  const tables = new Set<string>();
  const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(sql)) !== null) {
    const name = match[1].replace(/"/g, "");
    // Skip partition tables
    if (name.includes("PARTITION")) continue;
    tables.add(name);
  }
  return tables;
}

function extractIndexes(sql: string): Set<string> {
  const indexes = new Set<string>();
  const regex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(sql)) !== null) {
    indexes.add(match[1]);
  }
  return indexes;
}

function extractRLSTables(sql: string): Set<string> {
  const tables = new Set<string>();
  const regex = /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?([^\s]+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(sql)) !== null) {
    const name = match[1].replace(/"/g, "").replace(/;$/, "");
    tables.add(name);
  }
  return tables;
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

interface AuditResult {
  missingTables: string[];
  unexpectedTables: string[];
  missingIndexes: string[];
  missingRLS: string[];
  totalTablesFound: number;
  totalIndexesFound: number;
  totalRLSTables: number;
}

function runAudit(): AuditResult {
  const sql = readAllMigrations();
  const foundTables = extractTables(sql);
  const foundIndexes = extractIndexes(sql);
  const rlsTables = extractRLSTables(sql);

  // Normalize table names for comparison
  const normalize = (name: string) => {
    if (!name.startsWith("public.") && !name.includes(".")) {
      return name; // non-public schema tables keep as-is
    }
    return name;
  };

  // Check missing canonical tables
  const missingTables: string[] = [];
  for (const canonicalTable of Object.keys(CANONICAL_TABLES)) {
    const found = foundTables.has(canonicalTable) ||
      foundTables.has(canonicalTable.replace("public.", ""));
    if (!found) {
      missingTables.push(canonicalTable);
    }
  }

  // Check for tables found but not in canonical definition
  const canonicalSet = new Set(Object.keys(CANONICAL_TABLES));
  const unexpectedTables: string[] = [];
  for (const table of foundTables) {
    const normalized = normalize(table);
    const isCanonical = canonicalSet.has(normalized) ||
      canonicalSet.has(`public.${normalized}`) ||
      canonicalSet.has(normalized.replace("public.", ""));
    // Skip partition tables
    if (table.includes("PARTITION") || table.includes("partition")) continue;
    if (!isCanonical) {
      unexpectedTables.push(table);
    }
  }

  // Check missing indexes
  const missingIndexes: string[] = [];
  for (const idx of REQUIRED_INDEXES) {
    if (!foundIndexes.has(idx)) {
      missingIndexes.push(idx);
    }
  }

  // Check missing RLS
  const missingRLS: string[] = [];
  for (const table of TABLES_REQUIRING_RLS) {
    const found = rlsTables.has(table) ||
      rlsTables.has(table.replace("public.", ""));
    if (!found) {
      missingRLS.push(table);
    }
  }

  return {
    missingTables,
    unexpectedTables,
    missingIndexes,
    missingRLS,
    totalTablesFound: foundTables.size,
    totalIndexesFound: foundIndexes.size,
    totalRLSTables: rlsTables.size,
  };
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function printReport(result: AuditResult): boolean {
  let hasErrors = false;

  console.log("=".repeat(72));
  console.log("  CHEFIAPP SCHEMA AUDIT REPORT");
  console.log("=".repeat(72));
  console.log();
  console.log(`  Tables found in migrations:   ${result.totalTablesFound}`);
  console.log(`  Canonical tables defined:      ${Object.keys(CANONICAL_TABLES).length}`);
  console.log(`  Indexes found in migrations:   ${result.totalIndexesFound}`);
  console.log(`  Required indexes defined:      ${REQUIRED_INDEXES.length}`);
  console.log(`  RLS-enabled tables found:      ${result.totalRLSTables}`);
  console.log(`  Tables requiring RLS:          ${TABLES_REQUIRING_RLS.length}`);
  console.log();

  if (result.missingTables.length > 0) {
    hasErrors = true;
    console.log("  MISSING TABLES (in canonical but not in migrations):");
    for (const t of result.missingTables) {
      console.log(`    - ${t}`);
    }
    console.log();
  }

  if (result.unexpectedTables.length > 0) {
    // Unexpected tables are warnings, not errors
    console.log("  UNTRACKED TABLES (in migrations but not in canonical schema):");
    for (const t of result.unexpectedTables.sort()) {
      console.log(`    ~ ${t}`);
    }
    console.log("  (These may be legacy, module-specific, or need adding to canonical)");
    console.log();
  }

  if (result.missingIndexes.length > 0) {
    hasErrors = true;
    console.log("  MISSING INDEXES:");
    for (const idx of result.missingIndexes) {
      console.log(`    - ${idx}`);
    }
    console.log();
  }

  if (result.missingRLS.length > 0) {
    hasErrors = true;
    console.log("  TABLES MISSING RLS:");
    for (const t of result.missingRLS) {
      console.log(`    - ${t}`);
    }
    console.log();
  }

  if (!hasErrors) {
    console.log("  All checks passed. Schema is consistent with canonical definition.");
  }

  console.log();
  console.log("=".repeat(72));

  return hasErrors;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const result = runAudit();
const hasErrors = printReport(result);

if (hasErrors) {
  console.log("  RESULT: DRIFT DETECTED -- fix issues above before merging.");
  process.exit(1);
} else {
  console.log("  RESULT: PASS");
  process.exit(0);
}
