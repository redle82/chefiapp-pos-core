const WELCOME_KEY = "chefiapp_welcome_seen";

/** Check if the welcome overlay should be shown (first-time user). */
export function shouldShowWelcome(tenantId: string | null): boolean {
  try {
    const seen = localStorage.getItem(WELCOME_KEY);
    const hasRestaurant = tenantId;
    // Show if: has a restaurant (just created) and hasn't seen welcome yet
    return !!hasRestaurant && !seen;
  } catch {
    return false;
  }
}

/** Mark the welcome overlay as seen. */
export function markWelcomeSeen(): void {
  try {
    localStorage.setItem(WELCOME_KEY, "1");
  } catch {
    // ignore
  }
}
