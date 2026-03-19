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
  | "profile"
  | "comms"
  | "notifications"
  | "schedule"
  | "tips";

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
    comms: true,
    notifications: true,
    schedule: true,
    tips: true,
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
    comms: true,
    notifications: true,
    schedule: true,
    tips: true,
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
    comms: true,
    notifications: true,
    schedule: false,
    tips: true,
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
    comms: true,
    notifications: true,
    schedule: false,
    tips: false,
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
    comms: true,
    notifications: true,
    schedule: false,
    tips: false,
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
    comms: true,
    notifications: true,
    schedule: false,
    tips: false,
  },
  delivery: {
    operation: false,
    turn: true,
    team: false,
    tpv: false,
    kds: false,
    tasks: true,
    alerts: true,
    scanner: false,
    profile: true,
    comms: true,
    notifications: true,
    schedule: true,
    tips: true,
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
// Bottom nav por papel — inspirado nos padrões de mercado (7shifts, Toast, Square):
//   • 4 tabs fixos + "Mais" automático
//   • Tab 1 = Home/ferramenta primária do role
//   • Tab 2 = Ferramenta principal de trabalho
//   • Tab 3 = Chat (comunicação é fundamental — padrão HotSchedules/7shifts)
//   • Tab 4 = Mais (acesso a todas as outras ferramentas)
// ---------------------------------------------------------------------------
export type BottomNavItem = StaffModeId | "home";

export const BOTTOM_NAV_BY_ROLE: Record<StaffRole, readonly BottomNavItem[]> = {
  // Dono: Dashboard → Operação → Chat → Mais
  owner: ["home", "operation", "comms"],
  // Gerente: Dashboard → Operação → Chat → Mais
  manager: ["home", "operation", "comms"],
  // Garçom: Início → TPV (ferramenta principal) → Chat → Mais
  waiter: ["home", "tpv", "comms"],
  // Cozinha: KDS (ferramenta principal) → Tarefas → Chat → Mais
  kitchen: ["kds", "tasks", "comms"],
  // Limpeza: Início → Tarefas (ferramenta principal) → Chat → Mais
  cleaning: ["home", "tasks", "comms"],
  // Trabalhador: Início → Tarefas (ferramenta principal) → Chat → Mais
  worker: ["home", "tasks", "comms"],
  // Delivery: Início (painel Shipday) → Tarefas → Chat → Mais
  delivery: ["home", "tasks", "comms"],
};
