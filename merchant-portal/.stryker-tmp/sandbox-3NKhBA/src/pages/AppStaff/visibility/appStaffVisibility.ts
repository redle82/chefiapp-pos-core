// @ts-nocheck
import type { StaffRole } from "../context/StaffCoreTypes";
import type { StaffModeId } from "../routing/staffModeConfig";

// Modos do launcher que participam na grelha da Home.
// Alinhado com StaffModeId de staffModeConfig.ts (team + profile incluídos).
export type AppStaffModeId =
  | "operation"
  | "turn"
  | "team"
  | "tpv"
  | "kds"
  | "tasks"
  | "alerts"
  | "scanner"
  | "profile";

const APPSTAFF_VISIBILITY: Record<
  StaffRole,
  Record<AppStaffModeId, boolean>
> = {
  owner: {
    operation: true,
    turn: true,
    team: true,
    tpv: true,
    kds: true,
    tasks: true,
    alerts: true,
    scanner: true,
    profile: true,
  },
  manager: {
    operation: true,
    turn: true,
    team: true,
    tpv: true,
    kds: true,
    tasks: true,
    alerts: true,
    scanner: true,
    profile: true,
  },
  waiter: {
    operation: false,
    turn: true,
    team: false,
    tpv: true,
    kds: false,
    tasks: true,
    alerts: true,
    scanner: false,
    profile: true,
  },
  kitchen: {
    operation: false,
    turn: true,
    team: false,
    tpv: false,
    kds: true,
    tasks: true,
    alerts: false,
    scanner: false,
    profile: true,
  },
  cleaning: {
    operation: false,
    turn: true,
    team: false,
    tpv: false,
    kds: false,
    tasks: true,
    alerts: false,
    scanner: false,
    profile: true,
  },
  worker: {
    operation: true,
    turn: true,
    team: false,
    tpv: true,
    kds: false,
    tasks: true,
    alerts: false,
    scanner: false,
    profile: true,
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

// ---------------------------------------------------------------------------
// Rodapé por papel — painel de ação imediata, max 4-5 itens.
// "home" = link para a home do papel. Os demais são StaffModeId.
// "Mais" aparece automaticamente se houver modos visíveis fora desta lista.
// ---------------------------------------------------------------------------
export type BottomNavItem = StaffModeId | "home";

export const BOTTOM_NAV_BY_ROLE: Record<StaffRole, readonly BottomNavItem[]> = {
  owner: ["home", "operation", "alerts"],
  manager: ["home", "operation", "team", "alerts"],
  waiter: ["home", "tpv", "tasks", "turn"],
  kitchen: ["kds", "tasks", "turn"],
  cleaning: ["home", "tasks", "turn", "profile"],
  worker: ["home", "tpv", "tasks", "turn"],
};
