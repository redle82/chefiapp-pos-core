// @ts-nocheck
import { useMemo } from "react";
import {
  getAppStaffPermissions,
  type AppStaffPermissions,
} from "../../../core/roles/appStaffPermissions";
import { useStaff } from "../context/StaffContext";

/**
 * Hook: permissões AppStaff do utilizador actual (baseado em activeRole do StaffContext).
 * Usar para mostrar/esconder acções (ex.: Fechar caixa, Criar/atribuir tarefa).
 */
export function useAppStaffPermissions(): AppStaffPermissions {
  const { activeRole } = useStaff();
  return useMemo(
    () => getAppStaffPermissions(activeRole ?? undefined),
    [activeRole]
  );
}
