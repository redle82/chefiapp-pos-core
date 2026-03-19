/**
 * Screen type definitions for the TPV Screens Hub.
 *
 * Each entry describes an operational screen surface that can be
 * launched from the hub at /op/tpv/screens.
 *
 * Screens open in /screen/* routes — dedicated layout without TPV shell.
 * TASKS and WEB_EDITOR stay in /op/tpv/* because they are TPV sub-views.
 */

export type ScreenTypeId =
  | "KDS_KITCHEN"
  | "KDS_BAR"
  | "KDS_EXPO"
  | "CUSTOMER_DISPLAY"
  | "DELIVERY"
  | "TASKS"
  | "WEB_EDITOR";

export interface ScreenTypeDefinition {
  id: ScreenTypeId;
  label: string;
  description: string;
  /** URL path to open. null = not yet available. */
  url: string | null;
  available: boolean;
  openMode: "new_window" | "navigate";
}

export const SCREEN_REGISTRY: ScreenTypeDefinition[] = [
  {
    id: "KDS_KITCHEN",
    label: "Cozinha KDS",
    description: "Ecrã dedicado de execução para a cozinha. Sem navegação TPV.",
    url: "/screen/kitchen",
    available: true,
    openMode: "new_window",
  },
  {
    id: "KDS_BAR",
    label: "Bar KDS",
    description: "Ecrã dedicado de execução para o bar. Sem navegação TPV.",
    url: "/screen/bar",
    available: true,
    openMode: "new_window",
  },
  {
    id: "KDS_EXPO",
    label: "Expo",
    description: "Ecrã de expedição — conferência antes de servir.",
    url: "/screen/expo",
    available: true,
    openMode: "new_window",
  },
  {
    id: "CUSTOMER_DISPLAY",
    label: "Display Cliente",
    description: "Ecrã virado para o cliente. Sem controlos operacionais.",
    url: "/screen/customer-display",
    available: true,
    openMode: "new_window",
  },
  {
    id: "DELIVERY",
    label: "Tela Delivery",
    description: "Gestão de entregas e estado dos pedidos em trânsito.",
    url: "/screen/delivery",
    available: true,
    openMode: "new_window",
  },
  {
    id: "TASKS",
    label: "Tarefas",
    description: "Lista de tarefas operacionais do turno.",
    url: "/op/tpv/tasks",
    available: true,
    openMode: "new_window",
  },
  {
    id: "WEB_EDITOR",
    label: "Página Web",
    description: "Editor rápido da página pública do restaurante.",
    url: "/op/tpv/web-editor",
    available: true,
    openMode: "navigate",
  },
];
