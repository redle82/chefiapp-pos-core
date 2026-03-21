/**
 * Recovery Engine — diagnoses failed/stalled states and suggests actions.
 * Pure functions, no side effects.
 */

export type RecoveryAction =
  | "retry_install"
  | "retry_commissioning"
  | "resume_setup"
  | "reconfigure"
  | "contact_support"
  | "none";

export interface RecoveryInput {
  setupCompleted: boolean;
  activated: boolean;
  tpvInstalled: boolean;
  tpvPaired: boolean;
  commissioningStatus: "pending" | "running" | "passed" | "failed" | null;
  commissioningFailedTests?: string[];
  lastActivityAt: number; // timestamp ms
  createdAt: number; // timestamp ms
  setupProgress: number; // 0-100
}

export interface RecoveryDiagnosis {
  isRecoveryNeeded: boolean;
  action: RecoveryAction;
  reason: string;
  severity: "info" | "warning" | "critical";
  retryable: boolean;
  suggestedMessage: string;
}

/**
 * Diagnose the recovery state of a restaurant.
 */
export function diagnoseRecovery(input: RecoveryInput): RecoveryDiagnosis {
  const now = Date.now();
  const hoursSinceActivity = (now - input.lastActivityAt) / (1000 * 60 * 60);
  const hoursSinceCreation = (now - input.createdAt) / (1000 * 60 * 60);

  // 1. Commissioning failed — most actionable
  if (input.commissioningStatus === "failed") {
    return {
      isRecoveryNeeded: true,
      action: "retry_commissioning",
      reason: `Commissioning failed: ${input.commissioningFailedTests?.join(", ") ?? "unknown tests"}`,
      severity: "warning",
      retryable: true,
      suggestedMessage: "O teste de comissionamento falhou. Tenta novamente ou salta os testes opcionais.",
    };
  }

  // 2. Activated but TPV not installed (stuck between setup and install)
  if (input.activated && !input.tpvInstalled && hoursSinceActivity > 2) {
    return {
      isRecoveryNeeded: true,
      action: "retry_install",
      reason: "Activated but TPV never installed",
      severity: hoursSinceActivity > 24 ? "critical" : "warning",
      retryable: true,
      suggestedMessage: "O teu restaurante esta activado mas o TPV ainda nao foi instalado. Continua a instalacao.",
    };
  }

  // 3. TPV installed but not paired
  if (input.tpvInstalled && !input.tpvPaired && hoursSinceActivity > 1) {
    return {
      isRecoveryNeeded: true,
      action: "retry_install",
      reason: "TPV installed but never paired",
      severity: "warning",
      retryable: true,
      suggestedMessage: "O TPV foi instalado mas nao foi pareado. Abre o TPV e completa o pareamento.",
    };
  }

  // 4. Setup incomplete and stalled
  if (!input.setupCompleted && input.setupProgress > 0 && input.setupProgress < 100) {
    if (hoursSinceActivity > 72) {
      return {
        isRecoveryNeeded: true,
        action: "resume_setup",
        reason: `Setup ${input.setupProgress}% complete, stalled for ${Math.round(hoursSinceActivity)}h`,
        severity: "critical",
        retryable: true,
        suggestedMessage: "O setup do teu restaurante esta incompleto. Retoma onde paraste.",
      };
    }
    if (hoursSinceActivity > 24) {
      return {
        isRecoveryNeeded: true,
        action: "resume_setup",
        reason: `Setup ${input.setupProgress}% complete, inactive for ${Math.round(hoursSinceActivity)}h`,
        severity: "warning",
        retryable: true,
        suggestedMessage: "Faltam alguns passos para completar o setup. Continua a configuracao.",
      };
    }
  }

  // 5. Created but never started setup
  if (!input.setupCompleted && input.setupProgress === 0 && hoursSinceCreation > 48) {
    return {
      isRecoveryNeeded: true,
      action: "resume_setup",
      reason: "Account created but setup never started",
      severity: hoursSinceCreation > 168 ? "critical" : "info",
      retryable: true,
      suggestedMessage: "Ainda nao comecaste a configurar o teu restaurante. Comeca agora!",
    };
  }

  // No recovery needed
  return {
    isRecoveryNeeded: false,
    action: "none",
    reason: "No recovery needed",
    severity: "info",
    retryable: false,
    suggestedMessage: "",
  };
}
