/**
 * DOMAIN WRITE AUTHORITY CONTRACT - REGISTRY
 *
 * Defines the ALLOWED Transitional Exceptions (Law 2).
 * Any writer not in this registry is blocked in HYBRID mode.
 * In PURE mode, this registry is ignored for OPERATIONAL STATE.
 * System/Genesis state remains governed by the Gate.
 */

export type AllowedTable =
  | "gm_cash_registers"
  | "gm_orders"
  | "gm_order_items"
  | "gm_payments"
  | "gm_products"
  | "gm_menu_categories"
  | "gm_restaurant_members"
  | "gm_diagnostics"
  | "gm_restaurants"
  | "gm_tables"
  | "gm_order_requests"
  | "profiles";

export type AllowedOperation = "INSERT" | "UPDATE" | "DELETE" | "UPSERT";

interface ExceptionGrant {
  reason: string;
  allowedTables: AllowedTable[];
  allowedOperations: AllowedOperation[];
}

export type CallerTag =
  | "GenesisKernel"
  | "MenuAuthority"
  | "TableAuthority"
  | "BootstrapPage"
  | "OnboardingQuick"
  | "PublicPages"
  | "WebOrderingService"
  | "OrderIngestionPipeline"
  | "OrderContext"
  | "OrderProcessingService";

export const EXCEPTION_REGISTRY: Record<CallerTag, ExceptionGrant> =
  Object.freeze({
    // === SOVEREIGN KERNELS & AUTHORITIES (The Constitution) ===
    GenesisKernel: {
      reason: "Sovereign Genesis Authority",
      allowedTables: [
        "gm_restaurant_members",
        "gm_diagnostics",
        "gm_restaurants",
        "gm_menu_categories",
        "profiles",
      ],
      allowedOperations: ["INSERT", "UPDATE"],
    },
    MenuAuthority: {
      reason: "Sovereign Menu Authority",
      allowedTables: ["gm_menu_categories", "gm_products"],
      allowedOperations: ["INSERT", "UPDATE", "DELETE"],
    },
    TableAuthority: {
      reason: "Sovereign Table Authority",
      allowedTables: ["gm_tables"],
      allowedOperations: ["INSERT", "UPDATE", "DELETE"],
    },

    // === HYBRID / TRANSITIONAL (Authorized Airlocks) ===
    BootstrapPage: {
      reason: "Restaurant Genesis (Hybrid)",
      allowedTables: ["gm_restaurants", "gm_restaurant_members"],
      allowedOperations: ["INSERT"],
    },
    OnboardingQuick: {
      reason: "Onboarding Configuration (Hybrid) — Onda 4 A3: primeiro produto",
      allowedTables: ["gm_restaurants", "gm_menu_categories", "gm_products"],
      allowedOperations: ["UPDATE", "INSERT"],
    },
    PublicPages: {
      reason: "Public Airlock (Hybrid)",
      allowedTables: ["gm_order_requests"],
      allowedOperations: ["INSERT"],
    },
    WebOrderingService: {
      reason: "Web Order Ingestion (Hybrid)",
      allowedTables: ["gm_orders", "gm_order_items", "gm_order_requests"],
      allowedOperations: ["INSERT", "DELETE"],
    },
    OrderIngestionPipeline: {
      reason: "External Order Airlock (Hybrid)",
      allowedTables: ["gm_order_requests"],
      allowedOperations: ["INSERT"],
    },
    OrderContext: {
      reason: "Order Context (TPV/UI)",
      allowedTables: ["gm_orders", "gm_order_items"],
      allowedOperations: ["INSERT", "UPDATE"],
    },

    // === ARCHIVED (DORMANT — kept for registry compatibility) ===
    OrderProcessingService: {
      reason:
        "Archived — was Order Processing Service (DORMANT); write path is Core RPCs",
      allowedTables: ["gm_order_requests"],
      allowedOperations: ["UPDATE"],
    },
  });

export const isAuthorized = (
  callerTag: string,
  table: string,
  operation: AllowedOperation,
): boolean => {
  const grant = EXCEPTION_REGISTRY[callerTag as CallerTag];
  if (!grant) return false;

  return (
    (grant.allowedTables as string[]).includes(table) &&
    grant.allowedOperations.includes(operation)
  );
};
