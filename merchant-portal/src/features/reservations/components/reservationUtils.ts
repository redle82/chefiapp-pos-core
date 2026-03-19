/**
 * Shared utilities for reservation feature components.
 */

/** Status-to-color mapping used across reservation views. */
export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  CONFIRMED: { bg: "rgba(34,197,94,0.15)", text: "#4ade80" },
  PENDING: { bg: "rgba(251,191,36,0.15)", text: "#fbbf24" },
  SEATED: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa" },
  COMPLETED: { bg: "rgba(107,114,128,0.15)", text: "#9ca3af" },
  NO_SHOW: { bg: "rgba(239,68,68,0.15)", text: "#f87171" },
  CANCELLED: { bg: "rgba(107,114,128,0.10)", text: "#6b7280" },
};

/** Format a Date to YYYY-MM-DD string. */
export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Get the Monday of the week containing the given date. */
export function getWeekStart(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Get array of 7 dates starting from the given date. */
export function getWeekDays(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/**
 * Estimate reservation duration in minutes based on party size.
 * 2 pax = 90 min, 4+ = 120 min, 8+ = 150 min.
 */
export function estimateDuration(partySize: number): number {
  if (partySize >= 8) return 150;
  if (partySize >= 4) return 120;
  return 90;
}
