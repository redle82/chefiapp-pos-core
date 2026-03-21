/**
 * SetupProgressEngine — Motor de progressão central do restaurante.
 *
 * Função pura e determinística. Recebe o estado actual do restaurante
 * e devolve:
 *   - o SetupState derivado
 *   - a rota do próximo passo
 *   - a percentagem de progresso
 *   - a fase macro actual
 *
 * Nunca depende de localStorage. Sempre DB-first.
 * Nunca cria lógica de fluxo — apenas classifica.
 *
 * Ref: Blueprint ChefiApp — Ordem-Mãe Única (Sprint 1)
 */

import {
  SETUP_PHASES,
  SETUP_STATES,
  STATE_TO_PHASE,
  STATE_TO_ROUTE,
  type SetupPhase,
  type SetupState,
} from "./setupStates";

// ---------------------------------------------------------------------------
// Input contract
// ---------------------------------------------------------------------------

export interface SetupStatusFlags {
  identity?: boolean;
  location?: boolean;
  schedule?: boolean;
  menu?: boolean;
  inventory?: boolean;
  people?: boolean;
  payments?: boolean;
  integrations?: boolean;
  publish?: boolean;
}

export interface SetupProgressInput {
  isAuthenticated: boolean;
  hasRestaurant: boolean;
  setupStatus: SetupStatusFlags;
  onboardingCompletedAt: string | null;
  tpvInstalled: boolean;
  tpvPaired: boolean;
  shiftOpen: boolean;
  kdsConnected: boolean;
  staffAppConnected: boolean;
  testPassed: boolean;
}

// ---------------------------------------------------------------------------
// Output contract
// ---------------------------------------------------------------------------

export interface SetupProgressResult {
  state: SetupState;
  nextRoute: string;
  progress: number; // 0-100
  phase: SetupPhase;
  phaseIndex: number;
  totalPhases: number;
  isSetupComplete: boolean;
  isOperational: boolean;
}

// ---------------------------------------------------------------------------
// Core derivation (pure function)
// ---------------------------------------------------------------------------

export function deriveSetupState(input: SetupProgressInput): SetupState {
  if (!input.isAuthenticated) return "lead";
  if (!input.hasRestaurant) return "authenticated";

  const s = input.setupStatus;

  // Identity: restaurant name + type + country are set at creation.
  // Location/contact details complete the identity phase.
  if (!s.identity) return "restaurant_created";

  // Operational base (required for activation)
  if (!s.schedule) return "identity_completed";
  if (!s.menu) return "hours_completed";
  if (!s.people) return "catalog_completed";
  if (!s.payments) return "staff_completed";

  // Activation gate
  if (!input.onboardingCompletedAt) return "payments_completed";

  // Post-activation: TPV installation
  if (!input.tpvInstalled) return "activated";
  if (!input.tpvPaired) return "tpv_installed";

  // Operational expansion
  if (!input.shiftOpen) return "tpv_paired";
  if (!input.kdsConnected) return "shift_opened";
  if (!input.staffAppConnected) return "kds_connected";
  if (!input.testPassed) return "staff_app_connected";

  return "operational";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getNextRoute(state: SetupState): string {
  return STATE_TO_ROUTE[state];
}

export function getProgress(state: SetupState): number {
  const idx = SETUP_STATES.indexOf(state);
  return Math.round((idx / (SETUP_STATES.length - 1)) * 100);
}

export function getPhase(state: SetupState): SetupPhase {
  return STATE_TO_PHASE[state];
}

export function getPhaseIndex(state: SetupState): number {
  const phase = STATE_TO_PHASE[state];
  return SETUP_PHASES.indexOf(phase);
}

export function isSetupComplete(state: SetupState): boolean {
  const idx = SETUP_STATES.indexOf(state);
  const activatedIdx = SETUP_STATES.indexOf("activated");
  return idx >= activatedIdx;
}

export function isOperational(state: SetupState): boolean {
  return state === "operational";
}

// ---------------------------------------------------------------------------
// Full result (convenience)
// ---------------------------------------------------------------------------

export function getSetupProgress(input: SetupProgressInput): SetupProgressResult {
  const state = deriveSetupState(input);
  return {
    state,
    nextRoute: getNextRoute(state),
    progress: getProgress(state),
    phase: getPhase(state),
    phaseIndex: getPhaseIndex(state),
    totalPhases: SETUP_PHASES.length,
    isSetupComplete: isSetupComplete(state),
    isOperational: isOperational(state),
  };
}

// ---------------------------------------------------------------------------
// Post-login destination resolver
// ---------------------------------------------------------------------------

/**
 * Resolves where an authenticated user should land after login.
 *
 * Rules:
 * - No restaurant → /setup/start
 * - Restaurant incomplete → next pending setup step
 * - Restaurant active + shift open → /op/tpv
 * - Restaurant active + shift closed → /admin/home
 */
export function resolvePostLoginDestination(input: SetupProgressInput): string {
  const state = deriveSetupState(input);

  // Not yet activated → go to the next setup step
  if (!isSetupComplete(state)) {
    return getNextRoute(state);
  }

  // Activated: decide between TPV and Admin based on shift state
  if (input.shiftOpen) {
    return "/op/tpv";
  }

  return "/admin/home";
}
