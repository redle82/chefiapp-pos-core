/**
 * StaffIndexRedirect — Redireciona /app/staff para o Launcher (home do app).
 * Mantém o utilizador em /app/staff/home para evitar cair em /app/dashboard (reports)
 * quando não existem rotas /app/manager, /app/waiter, etc.
 */

import { Navigate } from "react-router-dom";

const STAFF_HOME = "/app/staff/home";

export function StaffIndexRedirect() {
  return <Navigate to={STAFF_HOME} replace />;
}
