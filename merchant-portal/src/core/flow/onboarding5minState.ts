/**
 * Onboarding 5 minutos — Estados das 9 telas
 *
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 * Estados do onboarding de 9 passos e regras de transição.
 * tpv_mode e shift_status na decisão de rota para /op/tpv.
 */

export type Onboarding5minStep =
  | "ONBOARDING_INTRO"
  | "ONBOARDING_IDENTITY"
  | "ONBOARDING_LOCATION"
  | "ONBOARDING_DAY_PROFILE"
  | "ONBOARDING_SHIFT_SETUP"
  | "ONBOARDING_PRODUCTS"
  | "ONBOARDING_TPV_PREVIEW"
  | "ONBOARDING_PLAN_TRIAL"
  | "ONBOARDING_RITUAL";

export type TpvMode = "preview" | "live";
export type ShiftStatus = "closed" | "open";

/** Rotas oficiais por passo (Tela 0–8). */
export const ONBOARDING_5MIN_ROUTES: Record<Onboarding5minStep, string> = {
  ONBOARDING_INTRO: "/onboarding/intro",
  ONBOARDING_IDENTITY: "/onboarding/identity",
  ONBOARDING_LOCATION: "/onboarding/location",
  ONBOARDING_DAY_PROFILE: "/onboarding/day-profile",
  ONBOARDING_SHIFT_SETUP: "/onboarding/shift-setup",
  ONBOARDING_PRODUCTS: "/onboarding/products",
  ONBOARDING_TPV_PREVIEW: "/onboarding/tpv-preview",
  ONBOARDING_PLAN_TRIAL: "/onboarding/plan-trial",
  ONBOARDING_RITUAL: "/onboarding/ritual-open",
};

const STEP_ORDER: Onboarding5minStep[] = [
  "ONBOARDING_INTRO",
  "ONBOARDING_IDENTITY",
  "ONBOARDING_LOCATION",
  "ONBOARDING_DAY_PROFILE",
  "ONBOARDING_SHIFT_SETUP",
  "ONBOARDING_PRODUCTS",
  "ONBOARDING_TPV_PREVIEW",
  "ONBOARDING_PLAN_TRIAL",
  "ONBOARDING_RITUAL",
];

/** Rota → passo. */
const ROUTE_TO_STEP = new Map<string, Onboarding5minStep>(
  STEP_ORDER.map((s) => [ONBOARDING_5MIN_ROUTES[s], s])
);

export function getOnboardingStepFromPath(pathname: string): Onboarding5minStep | null {
  return ROUTE_TO_STEP.get(pathname) ?? null;
}

export function getOnboardingStepIndex(step: Onboarding5minStep): number {
  const i = STEP_ORDER.indexOf(step);
  return i >= 0 ? i : 0;
}

export function getNextOnboardingRoute(currentPath: string): string | null {
  const step = getOnboardingStepFromPath(currentPath);
  if (!step) return null;
  const i = STEP_ORDER.indexOf(step);
  if (i < 0 || i >= STEP_ORDER.length - 1) return null;
  return ONBOARDING_5MIN_ROUTES[STEP_ORDER[i + 1]];
}

export function getPrevOnboardingRoute(currentPath: string): string | null {
  const step = getOnboardingStepFromPath(currentPath);
  if (!step) return null;
  const i = STEP_ORDER.indexOf(step);
  if (i <= 0) return null;
  return ONBOARDING_5MIN_ROUTES[STEP_ORDER[i - 1]];
}

/** Todas as rotas do onboarding 5min (para LifecycleState / FlowGate). */
export const ONBOARDING_5MIN_ALL_ROUTES: string[] = STEP_ORDER.map(
  (s) => ONBOARDING_5MIN_ROUTES[s]
);

/**
 * tpv_mode: preview durante onboarding; live após ritual (turno aberto).
 * Fonte de shift_status é Core (gm_cash_registers) via ShiftContext.
 */
export function deriveTpvMode(
  onboardingCompleted: boolean,
  _shiftStatus: ShiftStatus
): TpvMode {
  if (onboardingCompleted) return "live";
  return "preview";
}
