/**
 * Time estimates for each setup section.
 * Used to show "approximately X minutes remaining" in the setup flow.
 *
 * Section IDs match SetupSection.id from setupStates.ts.
 */

const SECTION_TIME_ESTIMATES: Record<string, number> = {
  identity: 2,
  location: 3,
  schedule: 2,
  menu: 5,
  inventory: 3,
  staff: 3,
  payments: 2,
  integrations: 3,
  publish: 1,
};

/**
 * Get estimated minutes remaining based on incomplete section IDs.
 */
export function getRemainingTimeMinutes(incompleteSections: string[]): number {
  return incompleteSections.reduce((total, section) => {
    return total + (SECTION_TIME_ESTIMATES[section] ?? 2);
  }, 0);
}

/**
 * Get the time estimate for a specific section.
 */
export function getSectionTimeEstimate(sectionId: string): number {
  return SECTION_TIME_ESTIMATES[sectionId] ?? 2;
}

/**
 * Get total estimated setup time for all sections.
 */
export function getTotalEstimatedMinutes(): number {
  return Object.values(SECTION_TIME_ESTIMATES).reduce((a, b) => a + b, 0);
}

/**
 * Format minutes into a human-readable string (Portuguese).
 */
export function formatTimeEstimate(minutes: number): string {
  if (minutes <= 1) return "menos de 1 minuto";
  if (minutes < 60) return `~${minutes} minutos`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `~${hours}h`;
  return `~${hours}h ${mins}min`;
}
