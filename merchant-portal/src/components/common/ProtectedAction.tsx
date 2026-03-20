/**
 * ProtectedAction — RBAC gate component for UI elements.
 *
 * Wraps children (buttons, actions, etc.) and hides or disables them
 * based on the current operator's role permissions.
 *
 * Usage:
 *   <ProtectedAction action="refund" resource="payments">
 *     <RefundButton />
 *   </ProtectedAction>
 *
 *   <ProtectedAction action="delete" resource="products" fallback={<span>No access</span>}>
 *     <DeleteButton />
 *   </ProtectedAction>
 *
 *   <ProtectedAction action="admin" resource="settings" behavior="disable">
 *     <SettingsButton />
 *   </ProtectedAction>
 */

import type { ReactElement, ReactNode } from "react";
import { useRBAC } from "../../hooks/useRBAC";
import type { RBACAction, RBACResource } from "../../core/security/RBACService";

export interface ProtectedActionProps {
  /** The action being performed (e.g., "refund", "delete", "admin"). */
  action: RBACAction;
  /** The resource being acted upon (e.g., "payments", "products"). */
  resource: RBACResource;
  /** Content to render when the user has permission. */
  children: ReactNode;
  /**
   * Optional fallback to render when the user lacks permission.
   * If not provided, nothing is rendered (hidden).
   */
  fallback?: ReactNode;
  /**
   * Behavior when the user lacks permission:
   *   - "hide" (default): renders nothing (or fallback).
   *   - "disable": renders children wrapped in a disabled container.
   */
  behavior?: "hide" | "disable";
}

export function ProtectedAction({
  action,
  resource,
  children,
  fallback = null,
  behavior = "hide",
}: ProtectedActionProps): ReactElement | null {
  const { can } = useRBAC();

  if (can(action, resource)) {
    return <>{children}</>;
  }

  if (behavior === "disable") {
    return (
      <div
        style={{ opacity: 0.4, pointerEvents: "none", cursor: "not-allowed" }}
        aria-disabled="true"
        title={`Requires ${action} permission on ${resource}`}
      >
        {children}
      </div>
    );
  }

  // behavior === "hide"
  return <>{fallback}</>;
}
