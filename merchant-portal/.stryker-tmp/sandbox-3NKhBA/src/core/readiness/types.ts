/**
 * Operational Readiness Engine (ORE) — tipos canónicos
 *
 * Uma única fonte de verdade para "este restaurante pode operar nesta superfície?"
 * Ver docs/bootstrap/OPERATIONAL_READINESS_ENGINE.md
 */
// @ts-nocheck


/** Motivo explícito que bloqueia a operação (primeiro que falhar ganha). */
export type BlockingReason =
  | "CORE_OFFLINE"
  | "BOOTSTRAP_INCOMPLETE"
  | "MANDATORY_RITUAL_INCOMPLETE"
  | "NO_OPEN_CASH_REGISTER"
  | "SHIFT_NOT_STARTED"
  | "PERMISSION_DENIED"
  | "MODE_NOT_ALLOWED"
  | "MODULE_NOT_ENABLED"
  | "NOT_PUBLISHED"
  | "RESTAURANT_NOT_FOUND"
  | "BILLING_PAST_DUE"
  | "BILLING_SUSPENDED";

/** Superfície que consulta a prontidão (TPV, KDS, Dashboard, Web pública). */
export type Surface = "TPV" | "KDS" | "DASHBOARD" | "WEB";

/** Directiva de UI: o que a superfície deve mostrar. */
export type UiDirective =
  | "RENDER_APP"
  | "SHOW_BLOCKING_SCREEN"
  | "SHOW_INFO_ONLY"
  | "REDIRECT";

/** Estado canónico de prontidão operacional para uma superfície. */
export interface OperationalReadiness {
  ready: boolean;
  blockingReason?: BlockingReason;
  surface: Surface;
  allowedActions?: string[];
  uiDirective: UiDirective;
  redirectTo?: string;
}
