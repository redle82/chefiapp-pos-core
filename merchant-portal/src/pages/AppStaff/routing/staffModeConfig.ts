/**
 * Modos do AppStaff — navegação por MODO (app), não por menu lateral.
 * Cada modo = uma rota = um ecrã full-screen com um foco.
 * PROIBIDO: sidebar, listas de links como navegação principal.
 */

export type StaffModeId =
  | "operation"
  | "turn"
  | "team"
  | "tpv"
  | "kds"
  | "tasks"
  | "alerts"
  | "profile";

export interface StaffMode {
  id: StaffModeId;
  path: string;
  label: string;
  shortLabel?: string;
  icon: string;
  /** Modos full-screen sem padding (TPV, KDS, Tasks como apps internos) */
  fullScreen?: boolean;
}

const BASE = "/app/staff";

export const STAFF_MODES: StaffMode[] = [
  {
    id: "operation",
    path: `${BASE}/mode/operation`,
    label: "Visão operacional",
    shortLabel: "Operação",
    icon: "🎛️",
  },
  { id: "turn", path: `${BASE}/mode/turn`, label: "Turno", icon: "⏱️" },
  { id: "team", path: `${BASE}/mode/team`, label: "Equipe", icon: "👥" },
  {
    id: "tpv",
    path: `${BASE}/pv`,
    label: "TPV Mobile",
    shortLabel: "TPV",
    icon: "💳",
    fullScreen: true,
  },
  {
    id: "kds",
    path: `${BASE}/kds`,
    label: "KDS Mobile",
    icon: "🍳",
    fullScreen: true,
  },
  {
    id: "tasks",
    path: `${BASE}/mode/tasks`,
    label: "Tarefas",
    icon: "✅",
    fullScreen: true,
  },
  {
    id: "alerts",
    path: `${BASE}/mode/alerts`,
    label: "Chamados",
    shortLabel: "Chamados",
    icon: "⚠️",
  },
  // Perfil é rota de topo: /app/staff/profile
  { id: "profile", path: `${BASE}/profile`, label: "Perfil", icon: "👤" },
];

// Launcher canónico: /app/staff/home
export const STAFF_LAUNCHER_PATH = `${BASE}/home`;
export const getModeByPath = (pathname: string): StaffMode | undefined =>
  STAFF_MODES.find(
    (m) => pathname === m.path || pathname.startsWith(m.path + "/"),
  );
export const getModeById = (id: StaffModeId): StaffMode =>
  STAFF_MODES.find((m) => m.id === id)!;
export const isFullScreenMode = (pathname: string): boolean =>
  STAFF_MODES.some(
    (m) =>
      m.fullScreen &&
      (pathname === m.path || pathname.startsWith(m.path + "/")),
  );
