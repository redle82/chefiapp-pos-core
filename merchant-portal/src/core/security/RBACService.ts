/**
 * RBACService — Role-Based Access Control for ChefIApp POS.
 *
 * Defines a permission matrix mapping each operator role to allowed
 * (action, resource) pairs. Used by the useRBAC hook and ProtectedAction
 * component to gate sensitive operations in the UI.
 *
 * Roles align with UserRole from core/context/ContextTypes:
 *   owner, manager, waiter, kitchen
 *
 * Additionally supports "cashier" as a future role (currently mapped
 * to the same permissions as waiter for forward compatibility).
 */

import type { UserRole } from "../context/ContextTypes";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Actions that can be performed on resources. */
export type RBACAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "refund"
  | "reopen"
  | "export"
  | "admin";

/** Resources that can be acted upon. */
export type RBACResource =
  | "orders"
  | "payments"
  | "products"
  | "tables"
  | "staff"
  | "reports"
  | "settings"
  | "discounts"
  | "customers"
  | "shifts"
  | "billing";

export interface Permission {
  action: RBACAction;
  resource: RBACResource;
}

/**
 * Extended role type that includes "cashier" for future use.
 * Maps to UserRole plus the cashier alias.
 */
export type Role = UserRole | "cashier";

// ---------------------------------------------------------------------------
// Permission Matrix
// ---------------------------------------------------------------------------

/**
 * Canonical permission matrix. Each role maps to an array of allowed
 * (action, resource) pairs. If a pair is NOT listed, the role is denied.
 *
 * Design principles:
 *   - Owner: full access to everything including billing and admin.
 *   - Manager: full operational access, no billing.
 *   - Cashier: orders, payments, receipts, tables, discounts.
 *   - Waiter: orders, tables, reservations, customers.
 *   - Kitchen: read-only orders, update order status.
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    // Orders
    { action: "create", resource: "orders" },
    { action: "read", resource: "orders" },
    { action: "update", resource: "orders" },
    { action: "delete", resource: "orders" },
    { action: "reopen", resource: "orders" },
    // Payments
    { action: "create", resource: "payments" },
    { action: "read", resource: "payments" },
    { action: "update", resource: "payments" },
    { action: "refund", resource: "payments" },
    // Products
    { action: "create", resource: "products" },
    { action: "read", resource: "products" },
    { action: "update", resource: "products" },
    { action: "delete", resource: "products" },
    // Tables
    { action: "create", resource: "tables" },
    { action: "read", resource: "tables" },
    { action: "update", resource: "tables" },
    { action: "delete", resource: "tables" },
    // Staff
    { action: "create", resource: "staff" },
    { action: "read", resource: "staff" },
    { action: "update", resource: "staff" },
    { action: "delete", resource: "staff" },
    // Reports
    { action: "read", resource: "reports" },
    { action: "export", resource: "reports" },
    // Settings
    { action: "read", resource: "settings" },
    { action: "update", resource: "settings" },
    { action: "admin", resource: "settings" },
    // Discounts
    { action: "create", resource: "discounts" },
    { action: "read", resource: "discounts" },
    { action: "update", resource: "discounts" },
    { action: "delete", resource: "discounts" },
    // Customers
    { action: "create", resource: "customers" },
    { action: "read", resource: "customers" },
    { action: "update", resource: "customers" },
    { action: "delete", resource: "customers" },
    // Shifts
    { action: "create", resource: "shifts" },
    { action: "read", resource: "shifts" },
    { action: "update", resource: "shifts" },
    { action: "delete", resource: "shifts" },
    // Billing (owner-only)
    { action: "read", resource: "billing" },
    { action: "update", resource: "billing" },
    { action: "admin", resource: "billing" },
  ],

  manager: [
    // Orders
    { action: "create", resource: "orders" },
    { action: "read", resource: "orders" },
    { action: "update", resource: "orders" },
    { action: "delete", resource: "orders" },
    { action: "reopen", resource: "orders" },
    // Payments
    { action: "create", resource: "payments" },
    { action: "read", resource: "payments" },
    { action: "update", resource: "payments" },
    { action: "refund", resource: "payments" },
    // Products
    { action: "create", resource: "products" },
    { action: "read", resource: "products" },
    { action: "update", resource: "products" },
    { action: "delete", resource: "products" },
    // Tables
    { action: "create", resource: "tables" },
    { action: "read", resource: "tables" },
    { action: "update", resource: "tables" },
    { action: "delete", resource: "tables" },
    // Staff
    { action: "create", resource: "staff" },
    { action: "read", resource: "staff" },
    { action: "update", resource: "staff" },
    { action: "delete", resource: "staff" },
    // Reports
    { action: "read", resource: "reports" },
    { action: "export", resource: "reports" },
    // Settings
    { action: "read", resource: "settings" },
    { action: "update", resource: "settings" },
    // Discounts
    { action: "create", resource: "discounts" },
    { action: "read", resource: "discounts" },
    { action: "update", resource: "discounts" },
    { action: "delete", resource: "discounts" },
    // Customers
    { action: "create", resource: "customers" },
    { action: "read", resource: "customers" },
    { action: "update", resource: "customers" },
    { action: "delete", resource: "customers" },
    // Shifts
    { action: "create", resource: "shifts" },
    { action: "read", resource: "shifts" },
    { action: "update", resource: "shifts" },
    { action: "delete", resource: "shifts" },
    // No billing access for managers
  ],

  cashier: [
    // Orders
    { action: "create", resource: "orders" },
    { action: "read", resource: "orders" },
    { action: "update", resource: "orders" },
    // Payments
    { action: "create", resource: "payments" },
    { action: "read", resource: "payments" },
    // Products (read-only)
    { action: "read", resource: "products" },
    // Tables
    { action: "read", resource: "tables" },
    { action: "update", resource: "tables" },
    // Discounts (apply only, no create/delete)
    { action: "read", resource: "discounts" },
    // Customers
    { action: "read", resource: "customers" },
    // Shifts (own shifts only)
    { action: "create", resource: "shifts" },
    { action: "read", resource: "shifts" },
  ],

  waiter: [
    // Orders
    { action: "create", resource: "orders" },
    { action: "read", resource: "orders" },
    { action: "update", resource: "orders" },
    // Payments (can process, not refund)
    { action: "create", resource: "payments" },
    { action: "read", resource: "payments" },
    // Products (read-only)
    { action: "read", resource: "products" },
    // Tables
    { action: "read", resource: "tables" },
    { action: "update", resource: "tables" },
    // Discounts (apply only)
    { action: "read", resource: "discounts" },
    // Customers
    { action: "read", resource: "customers" },
    { action: "create", resource: "customers" },
    // Shifts (own shifts only)
    { action: "create", resource: "shifts" },
    { action: "read", resource: "shifts" },
  ],

  kitchen: [
    // Orders (read + update status only)
    { action: "read", resource: "orders" },
    { action: "update", resource: "orders" },
    // Products (read-only, for ingredient info)
    { action: "read", resource: "products" },
    // Shifts (own shifts only)
    { action: "create", resource: "shifts" },
    { action: "read", resource: "shifts" },
  ],
};

// ---------------------------------------------------------------------------
// Lookup cache for O(1) permission checks
// ---------------------------------------------------------------------------

const permissionCache = new Map<string, boolean>();

function cacheKey(role: Role, action: RBACAction, resource: RBACResource): string {
  return `${role}:${action}:${resource}`;
}

// Pre-populate cache
for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
  for (const perm of permissions) {
    permissionCache.set(cacheKey(role as Role, perm.action, perm.resource), true);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether a role has permission to perform an action on a resource.
 * Returns true if the role is allowed, false otherwise.
 */
export function hasPermission(
  role: Role,
  action: RBACAction,
  resource: RBACResource,
): boolean {
  return permissionCache.get(cacheKey(role, action, resource)) === true;
}

/**
 * Throws a PermissionDeniedError if the role cannot perform the action.
 * Use in service functions that must gate access imperatively.
 */
export function requirePermission(
  role: Role,
  action: RBACAction,
  resource: RBACResource,
): void {
  if (!hasPermission(role, action, resource)) {
    throw new PermissionDeniedError(role, action, resource);
  }
}

/**
 * Return all permissions granted to a given role.
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class PermissionDeniedError extends Error {
  public readonly role: Role;
  public readonly action: RBACAction;
  public readonly resource: RBACResource;

  constructor(role: Role, action: RBACAction, resource: RBACResource) {
    super(`PERMISSION_DENIED: Role "${role}" cannot "${action}" on "${resource}".`);
    this.name = "PermissionDeniedError";
    this.role = role;
    this.action = action;
    this.resource = resource;
  }
}
