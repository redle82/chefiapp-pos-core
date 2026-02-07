/**
 * Barrel export for core-engine/pulse
 */

// ── B.0 Core ────────────────────────────────────────────
export {
  calculateComponents,
  calculatePulse,
  deriveZone,
  hasZoneChanged,
} from "./OperationalPulse";
export { DEFAULT_PULSE_CONFIG, mergePulseConfig } from "./PulseConfig";
export type { PulseConfig } from "./PulseConfig";
export type {
  PulseComponents,
  PulseHistoryEntry,
  PulseInput,
  PulseSnapshot,
  PulseThresholds,
  PulseZone,
} from "./PulseState";

// ── B.4 Gamification ────────────────────────────────────
export {
  BASE_XP_PER_TASK,
  ZONE_MULTIPLIERS,
  calculateXpMultiplier,
  checkAchievements,
  createEmptyAccumulator as createEmptyXpAccumulator,
  recordPulseReading as recordXpPulseReading,
  recordTaskCompletion as recordXpTaskCompletion,
  updateStreak,
} from "./GamificationService";
export type {
  Achievement,
  XpAccumulator,
  XpMultiplierResult,
} from "./GamificationService";

// ── B.4 Task Analytics ──────────────────────────────────
export {
  calculateCorrelation,
  computeZoneStats,
  createEmptyAnalytics,
  generateSummary,
  recordCompletion,
  recordPulseTick,
} from "./TaskAnalytics";
export type {
  TaskAnalyticsAccumulator,
  TaskAnalyticsSummary,
  TaskCompletionEvent,
  ZoneStats,
} from "./TaskAnalytics";

// ── B.4 Pulse History ───────────────────────────────────
export {
  MAX_HISTORY_ENTRIES,
  calculateZoneDurations,
  createHistoryAccumulator,
  getShiftSummary,
  recordPulseEntry,
  snapshotToEntry,
  toChartData,
} from "./PulseHistory";
export type {
  PulseChartPoint,
  PulseHistoryAccumulator,
  ZoneDurationSummary,
} from "./PulseHistory";
