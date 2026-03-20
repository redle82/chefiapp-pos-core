/**
 * useRBAC — React hook for role-based access control.
 *
 * Reads the current operator's role from OperatorContext and exposes
 * memoized permission-checking helpers.
 *
 * Usage:
 *   const { can, cannot, requireCan } = useRBAC();
 *   if (can("refund", "payments")) { ... }
 *   if (cannot("delete", "products")) { ... }
 */

import { useCallback, useMemo } from "react";
import { useOperator } from "../pages/TPVMinimal/context/OperatorContext";
import {
  hasPermission,
  requirePermission,
  type RBACAction,
  type RBACResource,
  type Role,
} from "../core/security/RBACService";

export interface UseRBACResult {
  /** Current operator role (or "waiter" as fallback). */
  role: Role;
  /** Returns true if the current role can perform action on resource. */
  can: (action: RBACAction, resource: RBACResource) => boolean;
  /** Returns true if the current role CANNOT perform action on resource. */
  cannot: (action: RBACAction, resource: RBACResource) => boolean;
  /** Throws PermissionDeniedError if the current role lacks permission. */
  requireCan: (action: RBACAction, resource: RBACResource) => void;
}

export function useRBAC(): UseRBACResult {
  const { operator } = useOperator();
  const role: Role = operator?.role ?? "waiter";

  const can = useCallback(
    (action: RBACAction, resource: RBACResource): boolean => {
      return hasPermission(role, action, resource);
    },
    [role],
  );

  const cannot = useCallback(
    (action: RBACAction, resource: RBACResource): boolean => {
      return !hasPermission(role, action, resource);
    },
    [role],
  );

  const requireCan = useCallback(
    (action: RBACAction, resource: RBACResource): void => {
      requirePermission(role, action, resource);
    },
    [role],
  );

  return useMemo(
    () => ({ role, can, cannot, requireCan }),
    [role, can, cannot, requireCan],
  );
}
