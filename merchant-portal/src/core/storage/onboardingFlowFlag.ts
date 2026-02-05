/**
 * Flag "onboarding acabou de ser completado" (ex.: skip no primeiro produto).
 * FlowGate usa para permitir TPV/dashboard imediatamente após skip, sem depender de refetch.
 * Sequência Canônica v1.0: passo 4 pulável → TPV (Aha Moment).
 */

const ONBOARDING_JUST_COMPLETED_KEY = "chefiapp_onboarding_just_completed";

export function setOnboardingJustCompletedFlag(): void {
  try {
    sessionStorage.setItem(ONBOARDING_JUST_COMPLETED_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Retorna true se a flag estava setada (e remove-a). */
export function consumeOnboardingJustCompletedFlag(): boolean {
  try {
    const v = sessionStorage.getItem(ONBOARDING_JUST_COMPLETED_KEY);
    if (v === "1") {
      sessionStorage.removeItem(ONBOARDING_JUST_COMPLETED_KEY);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
