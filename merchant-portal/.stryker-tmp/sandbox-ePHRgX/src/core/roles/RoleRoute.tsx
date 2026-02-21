/**
 * RoleRoute — guarda por rota que restringe por papéis permitidos.
 * Uso: <RoleRoute allowed={["owner", "manager"]}><Page /></RoleRoute>
 * Ver NAVIGATION_CONTRACT.md e CHEFIAPP_ROLE_SYSTEM_SPEC.md
 */
// @ts-nocheck


import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isMobileDevice } from "../flow/CoreFlow";
import { useRole } from "./RoleContext";
import type { UserRole } from "./rolePermissions";

interface RoleRouteProps {
  allowed: UserRole[];
  children: ReactNode;
}

export function RoleRoute({ allowed, children }: RoleRouteProps) {
  const { role } = useRole();
  const location = useLocation();

  if (!role || !allowed.includes(role)) {
    const to = isMobileDevice() ? "/garcom" : "/dashboard";
    return (
      <Navigate
        to={to}
        replace
        state={{ from: location.pathname, reason: "role_denied" }}
      />
    );
  }

  return <>{children}</>;
}
