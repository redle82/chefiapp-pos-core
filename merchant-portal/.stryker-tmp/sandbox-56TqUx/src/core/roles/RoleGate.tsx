/**
 * RoleGate — bloqueia acesso à rota atual se o papel não tiver permissão
 * Redireciona staff para /garcom, outros para /dashboard
 * Ver docs/CHEFIAPP_ROLE_SYSTEM_SPEC.md
 */
// @ts-nocheck


import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isMobileDevice } from "../flow/CoreFlow";
import { normalizePath } from "./normalizePath";
import { useRole } from "./RoleContext";
import { canAccessPath } from "./rolePermissions";

export function RoleGate() {
  const location = useLocation();
  const { role } = useRole();
  const pathname = normalizePath(location.pathname);

  if (!canAccessPath(role, pathname)) {
    // REDIRECT CONTRACT 2026:
    // Staff always goes to /garcom.
    // Owner/Manager goes to /dashboard (WEB) or /garcom (MOBILE OPS).
    const isMobile = isMobileDevice();
    const to = isMobile ? "/garcom" : "/dashboard";

    return (
      <Navigate
        to={to}
        replace
        state={{ from: location.pathname, reason: "role_denied" }}
      />
    );
  }

  return <Outlet />;
}
