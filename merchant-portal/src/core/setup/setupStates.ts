/**
 * Setup States — Máquina de estados central do restaurante.
 *
 * Fonte única de verdade para "em que ponto da implantação estamos".
 * Cada estado desbloqueia o próximo. O cliente nunca deve adivinhar
 * "o que fazer agora".
 *
 * Ref: Blueprint ChefiApp — Ordem-Mãe Única (Sprint 1)
 */

// ---------------------------------------------------------------------------
// States (ordered progression)
// ---------------------------------------------------------------------------

export const SETUP_STATES = [
  "lead",
  "authenticated",
  "restaurant_created",
  "identity_completed",
  "hours_completed",
  "catalog_completed",
  "staff_completed",
  "payments_completed",
  "setup_reviewed",
  "activated",
  "tpv_installed",
  "tpv_paired",
  "shift_opened",
  "kds_connected",
  "staff_app_connected",
  "test_passed",
  "operational",
] as const;

export type SetupState = (typeof SETUP_STATES)[number];

// ---------------------------------------------------------------------------
// State → Route mapping
// ---------------------------------------------------------------------------

export const STATE_TO_ROUTE: Record<SetupState, string> = {
  lead: "/",
  authenticated: "/setup/start",
  restaurant_created: "/setup/location",
  identity_completed: "/setup/hours",
  hours_completed: "/setup/catalog",
  catalog_completed: "/setup/staff",
  staff_completed: "/setup/payments",
  payments_completed: "/setup/review",
  setup_reviewed: "/setup/activate",
  activated: "/install/tpv",
  tpv_installed: "/install/pair",
  tpv_paired: "/install/check",
  shift_opened: "/op/tpv",
  kds_connected: "/op/tpv",
  staff_app_connected: "/op/tpv",
  test_passed: "/op/tpv",
  operational: "/admin/home",
};

// ---------------------------------------------------------------------------
// State → Phase label (for macro progress bar)
// ---------------------------------------------------------------------------

export const SETUP_PHASES = [
  "Identidade",
  "Restaurante",
  "Menu",
  "Operação",
  "Activação",
  "Dispositivos",
  "Teste",
  "Ao Vivo",
] as const;

export type SetupPhase = (typeof SETUP_PHASES)[number];

export const STATE_TO_PHASE: Record<SetupState, SetupPhase> = {
  lead: "Identidade",
  authenticated: "Identidade",
  restaurant_created: "Identidade",
  identity_completed: "Restaurante",
  hours_completed: "Menu",
  catalog_completed: "Operação",
  staff_completed: "Operação",
  payments_completed: "Operação",
  setup_reviewed: "Activação",
  activated: "Dispositivos",
  tpv_installed: "Dispositivos",
  tpv_paired: "Dispositivos",
  shift_opened: "Teste",
  kds_connected: "Teste",
  staff_app_connected: "Teste",
  test_passed: "Ao Vivo",
  operational: "Ao Vivo",
};

// ---------------------------------------------------------------------------
// Setup sections (sidebar items within /setup/*)
// ---------------------------------------------------------------------------

export interface SetupSection {
  id: string;
  label: string;
  route: string;
  /** The setup_status flag key that marks this section as complete */
  statusKey: string | null;
  /** Whether this section is required for activation */
  required: boolean;
}

export const SETUP_SECTIONS: SetupSection[] = [
  {
    id: "start",
    label: "Início",
    route: "/setup/start",
    statusKey: null,
    required: true,
  },
  {
    id: "identity",
    label: "Identidade",
    route: "/setup/identity",
    statusKey: "identity",
    required: true,
  },
  {
    id: "location",
    label: "Localização",
    route: "/setup/location",
    statusKey: "location",
    required: true,
  },
  {
    id: "hours",
    label: "Horários",
    route: "/setup/hours",
    statusKey: "schedule",
    required: true,
  },
  {
    id: "catalog",
    label: "Menu",
    route: "/setup/catalog",
    statusKey: "menu",
    required: true,
  },
  {
    id: "inventory",
    label: "Inventário",
    route: "/setup/inventory",
    statusKey: "inventory",
    required: false, // Optional — not required for activation
  },
  {
    id: "staff",
    label: "Equipa",
    route: "/setup/staff",
    statusKey: "people",
    required: true,
  },
  {
    id: "payments",
    label: "Pagamentos",
    route: "/setup/payments",
    statusKey: "payments",
    required: true,
  },
  {
    id: "integrations",
    label: "Integrações",
    route: "/setup/integrations",
    statusKey: "integrations",
    required: false, // Optional — not required for activation
  },
  {
    id: "review",
    label: "Revisão",
    route: "/setup/review",
    statusKey: null,
    required: true,
  },
  {
    id: "activate",
    label: "Activar",
    route: "/setup/activate",
    statusKey: null,
    required: true,
  },
];
