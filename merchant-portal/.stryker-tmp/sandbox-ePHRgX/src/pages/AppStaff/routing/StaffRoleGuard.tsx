/**
 * StaffRoleGuard — Impede acesso a modos não permitidos pelo papel.
 * Usa canSeeMode() da visibility matrix como fonte de verdade.
 * Se o papel activo NÃO tem permissão, redireciona para a home do staff.
 */
// @ts-nocheck


import React from "react";
import { Navigate } from "react-router-dom";
import { useStaff } from "../context/StaffContext";
import type { AppStaffModeId } from "../visibility/appStaffVisibility";
import { canSeeMode } from "../visibility/appStaffVisibility";
import { STAFF_LAUNCHER_PATH } from "./staffModeConfig";

interface StaffRoleGuardProps {
  modeId: AppStaffModeId;
  children: React.ReactNode;
}

/** Deduplica warnings para evitar spam no console (StrictMode + re-renders). */
const _warnedSet = new Set<string>();

export function StaffRoleGuard({ modeId, children }: StaffRoleGuardProps) {
  const { activeRole } = useStaff();

  if (!activeRole) {
    return <Navigate to={STAFF_LAUNCHER_PATH} replace />;
  }

  if (!canSeeMode(activeRole, modeId)) {
    if (import.meta.env.DEV) {
      const key = `${activeRole}:${modeId}`;
      if (!_warnedSet.has(key)) {
        _warnedSet.add(key);
        console.warn(
          `[StaffRoleGuard] Bloqueado: role="${activeRole}" não pode aceder mode="${modeId}"`,
        );
      }
    }
    return <Navigate to={STAFF_LAUNCHER_PATH} replace />;
  }

  return <>{children}</>;
}
