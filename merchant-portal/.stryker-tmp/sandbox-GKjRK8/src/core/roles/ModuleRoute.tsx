/**
 * ModuleRoute — guarda por módulo: redireciona para /admin/modules se o módulo não estiver ativo.
 * Uso: <ModuleRoute module="kds"><KDSPage /></ModuleRoute>
 * Módulos sempre permitidos (sem check): tpv, pos.
 * Ver NAVIGATION_CONTRACT.md
 */

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";

const ALWAYS_ALLOWED_MODULES = ["tpv", "pos"];

interface ModuleRouteProps {
  module: string;
  children: ReactNode;
}

export function ModuleRoute({ module: moduleKey, children }: ModuleRouteProps) {
  const { runtime } = useRestaurantRuntime();
  const key = moduleKey.toLowerCase();

  if (ALWAYS_ALLOWED_MODULES.includes(key)) {
    return <>{children}</>;
  }

  const active = runtime?.active_modules ?? [];
  const installed = runtime?.installed_modules ?? [];

  // Se temos lista de módulos e o módulo não está ativo nem instalado, redirecionar para Hub
  if (active.length > 0 || installed.length > 0) {
    const isActive = active.includes(key);
    const isInstalled = installed.includes(key);
    if (!isActive && !isInstalled) {
      return <Navigate to="/admin/modules" replace />;
    }
  }

  return <>{children}</>;
}
