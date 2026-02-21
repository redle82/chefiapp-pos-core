// @ts-nocheck
import type { CoreHealthStatus } from "./useCoreHealth";

/**
 * Core Gating Utilities
 *
 * TRUTH LOCK: Critical actions are BLOCKED when backend is down.
 * No silent degradation. No fake success. Explicit user feedback.
 *
 * Gated actions:
 * - Creating restaurant
 * - Publishing
 * - Processing payments
 * - Saving menu changes
 * - Any POST/PUT/DELETE to backend
 */

export interface GatingResult {
  allowed: boolean;
  reason: string | null;
  fallbackAction?: "retry" | "trial_consent" | "wait" | "offline_queue";
}

export interface GatingOptions {
  /** Action being attempted */
  action:
    | "create"
    | "publish"
    | "payment"
    | "save"
    | "critical"
    | "non_critical";
  /** Current health status */
  health: CoreHealthStatus;
  /** Whether user has explicitly consented to trial exploration */
  trialConsent?: boolean;
  /** Custom block message */
  customMessage?: string;
}

/**
 * Core gating function - determines if action should proceed
 */
export function coreGating(options: GatingOptions): GatingResult {
  const { action, health, trialConsent = false, customMessage } = options;

  // UP: All actions allowed
  if (health === "UP") {
    return { allowed: true, reason: null };
  }

  // DEGRADED: Allow with warning (non-critical) or block (critical)
  if (health === "DEGRADED") {
    if (action === "payment") {
      return {
        allowed: false,
        reason:
          customMessage ||
          "Sistema lento. Pagamentos bloqueados por seguranca. Tenta em breve.",
        fallbackAction: "wait",
      };
    }
    // Allow other actions with implicit warning
    return { allowed: true, reason: null };
  }

  // UNKNOWN: Block critical, allow reads
  if (health === "UNKNOWN") {
    if (action === "non_critical") {
      return { allowed: true, reason: null };
    }
    return {
      allowed: false,
      reason: customMessage || "A verificar disponibilidade do sistema...",
      fallbackAction: "wait",
    };
  }

  // DOWN: Block all critical actions unless trial consent given
  // action === 'create' with trial consent can proceed to trial mode

  if (action === "create" && trialConsent) {
    return {
      allowed: true,
      reason: "Exploração ativa. Dados não serão guardados.",
      fallbackAction: "trial_consent",
    };
  }

  if (action === "non_critical") {
    return { allowed: true, reason: null };
  }

  // Block critical actions when DOWN
  const blockReasons: Record<string, string> = {
    create: "Sistema indisponivel. Nao e possivel criar o teu espaco agora.",
    publish: "Sistema indisponivel. Publicacao bloqueada.",
    payment: "Sistema indisponivel. Pagamentos bloqueados por seguranca.",
    save: "Sistema indisponivel. Alteracoes nao podem ser guardadas.",
    critical: "Sistema indisponivel. Acao bloqueada.",
  };

  return {
    allowed: false,
    reason: customMessage || blockReasons[action] || "Sistema indisponivel.",
    fallbackAction: action === "create" ? "trial_consent" : "retry",
  };
}

/**
 * Quick check - is this action safe to proceed?
 */
export function isActionAllowed(
  health: CoreHealthStatus,
  action: GatingOptions["action"],
): boolean {
  return coreGating({ health, action }).allowed;
}

/**
 * Get blocking reason for display
 */
export function getBlockReason(
  health: CoreHealthStatus,
  action: GatingOptions["action"],
): string | null {
  const result = coreGating({ health, action });
  return result.reason;
}

/**
 * Wrapper for async actions with gating
 */
export async function withGating<T>(
  options: GatingOptions,
  action: () => Promise<T>,
  onBlocked?: (result: GatingResult) => void,
): Promise<T | null> {
  const gating = coreGating(options);

  if (!gating.allowed) {
    if (onBlocked) {
      onBlocked(gating);
    }
    return null;
  }

  return action();
}
