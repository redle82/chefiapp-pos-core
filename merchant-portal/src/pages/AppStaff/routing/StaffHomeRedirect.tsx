/**
 * StaffHomeRedirect — Redireciona /app/staff/home para a home do activeRole.
 * Rotas obrigatórias: /app/staff/home/owner | manager | waiter | kitchen | cleaning.
 * Contrato: APPSTAFF_MAPA_TELAS_POR_TRABALHADOR.md
 */

import { Navigate } from "react-router-dom";
import { useStaff } from "../context/StaffContext";

const HOME_BASE = "/app/staff/home";

export function StaffHomeRedirect() {
  const { activeRole } = useStaff();
  const role = activeRole === "worker" ? "waiter" : activeRole ?? "manager";
  const path = `${HOME_BASE}/${role}`;
  return <Navigate to={path} replace />;
}
