/**
 * StaffRoleContext — Role explícito no AppStaff (APPSTAFF_RUNTIME_MODEL).
 *
 * Expõe role, source e isSimulated a partir do StaffContext.
 * Fonte do role: query (?role=), tab storage (staff_role), login (joinRemoteOperation) ou debug (createLocalContract).
 */
// @ts-nocheck


import type { StaffRole } from "./StaffCoreTypes";
import { useStaff } from "./StaffContext";

export type StaffRoleSource = "tab" | "login" | "debug";

export interface StaffRoleContextValue {
  role: StaffRole;
  source: StaffRoleSource;
  isSimulated: boolean;
}

/**
 * Hook que devolve o role explícito da sessão Staff e a sua origem.
 * Deve ser usado dentro de StaffProvider.
 */
export function useStaffRole(): StaffRoleContextValue {
  const { activeRole, roleSource, isSimulated } = useStaff();
  return {
    role: activeRole,
    source: roleSource,
    isSimulated,
  };
}
