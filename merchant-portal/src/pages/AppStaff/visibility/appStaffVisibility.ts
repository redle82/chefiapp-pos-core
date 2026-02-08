import type { StaffRole } from "../context/StaffCoreTypes";
import type { StaffModeId } from "../routing/staffModeConfig";

// Modos do launcher que participam na grelha da Home.
export type AppStaffModeId =
  | "operation"
  | "turn"
  | "tpv"
  | "kds"
  | "tasks"
  | "alerts";

const APPSTAFF_VISIBILITY: Record<StaffRole, Record<AppStaffModeId, boolean>> =
  {
    owner: {
      operation: true,
      turn: true,
      tpv: true,
      kds: true,
      tasks: true,
      alerts: true,
    },
    manager: {
      operation: true,
      turn: true,
      tpv: true,
      kds: true,
      tasks: true,
      alerts: true,
    },
    waiter: {
      operation: true,
      turn: true,
      tpv: true,
      kds: false,
      tasks: true,
      alerts: false,
    },
    kitchen: {
      operation: true,
      turn: false,
      tpv: false,
      kds: true,
      tasks: true,
      alerts: false,
    },
    cleaning: {
      operation: false,
      turn: false,
      tpv: false,
      kds: false,
      tasks: true,
      alerts: false,
    },
    worker: {
      operation: true,
      turn: true,
      tpv: true,
      kds: false,
      tasks: true,
      alerts: false,
    },
  };

export function canSeeMode(
  role: StaffRole,
  modeId: AppStaffModeId | StaffModeId,
): boolean {
  const map = APPSTAFF_VISIBILITY[role];
  if (!map) return false;
  if (!(modeId in map)) return false;
  return map[modeId as AppStaffModeId] ?? false;
}

