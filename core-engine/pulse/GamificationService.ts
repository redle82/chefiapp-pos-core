/**
 * GamificationService — XP multiplier based on operational pulse zone
 *
 * Pure deterministic logic, zero I/O, zero side effects.
 *
 * Rules:
 *   FLOW_ALTO:   1.5x XP multiplier (peak performance bonus)
 *   FLOW_PARCIAL: 1.0x (baseline)
 *   FLOW_BASE:   0.8x (low activity penalty)
 *
 * Streak bonus: consecutive snapshots in FLOW_ALTO grant
 * additional multiplier (capped at 2.0x after 10 consecutive).
 *
 * Achievements unlock at milestones (shift duration in FLOW_ALTO, etc.)
 */

import type { PulseZone } from "./PulseState";

// ─── Types ──────────────────────────────────────────────

/** XP multiplier result from a single pulse reading */
export interface XpMultiplierResult {
  /** Base zone multiplier (0.8, 1.0, or 1.5) */
  readonly baseMultiplier: number;
  /** Streak bonus (0.0 to 0.5 based on consecutive FLOW_ALTO) */
  readonly streakBonus: number;
  /** Final combined multiplier */
  readonly totalMultiplier: number;
  /** Current streak count */
  readonly streakCount: number;
}

/** Accumulated XP state across a shift */
export interface XpAccumulator {
  /** Total raw XP earned (before multipliers) */
  readonly rawXp: number;
  /** Total effective XP earned (after multipliers) */
  readonly effectiveXp: number;
  /** Number of tasks completed this shift */
  readonly tasksCompleted: number;
  /** Consecutive FLOW_ALTO snapshots */
  readonly altoStreak: number;
  /** Peak streak achieved this shift */
  readonly peakStreak: number;
  /** Unlocked achievement keys */
  readonly achievements: readonly string[];
}

/** Achievement definition */
export interface Achievement {
  readonly key: string;
  readonly label: string;
  readonly description: string;
  /** Predicate: should this achievement unlock? */
  readonly condition: (acc: XpAccumulator) => boolean;
}

// ─── Constants ──────────────────────────────────────────

const ZONE_MULTIPLIERS: Record<PulseZone, number> = {
  FLOW_ALTO: 1.5,
  FLOW_PARCIAL: 1.0,
  FLOW_BASE: 0.8,
};

/** Max streak bonus (reached at 10 consecutive FLOW_ALTO) */
const MAX_STREAK_BONUS = 0.5;
const STREAK_BONUS_PER_COUNT = 0.05;
const MAX_STREAK_COUNT = 10;

/** Base XP per completed task */
export const BASE_XP_PER_TASK = 10;

// ─── Achievements Registry ──────────────────────────────

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    key: "first_flow_alto",
    label: "Primeiro Pico",
    description: "Completou a primeira tarefa em FLOW_ALTO",
    condition: (acc) => acc.altoStreak >= 1 && acc.tasksCompleted >= 1,
  },
  {
    key: "streak_5",
    label: "Ritmo Quente",
    description: "5 leituras consecutivas em FLOW_ALTO",
    condition: (acc) => acc.peakStreak >= 5,
  },
  {
    key: "streak_10",
    label: "Máquina de Pedidos",
    description: "10 leituras consecutivas em FLOW_ALTO",
    condition: (acc) => acc.peakStreak >= 10,
  },
  {
    key: "tasks_10",
    label: "Dez na Conta",
    description: "10 tarefas completadas no turno",
    condition: (acc) => acc.tasksCompleted >= 10,
  },
  {
    key: "tasks_25",
    label: "Velocista",
    description: "25 tarefas completadas no turno",
    condition: (acc) => acc.tasksCompleted >= 25,
  },
  {
    key: "xp_100",
    label: "Centurião",
    description: "100 XP efetivo acumulado no turno",
    condition: (acc) => acc.effectiveXp >= 100,
  },
] as const;

// ─── Pure Functions ─────────────────────────────────────

/**
 * Calculate XP multiplier for a given zone and streak.
 * Pure function — no side effects.
 */
export function calculateXpMultiplier(
  zone: PulseZone,
  currentStreak: number,
): XpMultiplierResult {
  const baseMultiplier = ZONE_MULTIPLIERS[zone];

  // Streak only counts in FLOW_ALTO
  const effectiveStreak =
    zone === "FLOW_ALTO" ? Math.min(currentStreak, MAX_STREAK_COUNT) : 0;

  const streakBonus = Math.min(
    effectiveStreak * STREAK_BONUS_PER_COUNT,
    MAX_STREAK_BONUS,
  );

  const totalMultiplier =
    Math.round((baseMultiplier + streakBonus) * 100) / 100;

  return {
    baseMultiplier,
    streakBonus,
    totalMultiplier,
    streakCount: effectiveStreak,
  };
}

/**
 * Update streak count based on new zone.
 * Returns new streak: increments in FLOW_ALTO, resets otherwise.
 */
export function updateStreak(
  previousStreak: number,
  newZone: PulseZone,
): number {
  return newZone === "FLOW_ALTO" ? previousStreak + 1 : 0;
}

/**
 * Create an empty XP accumulator for shift start.
 */
export function createEmptyAccumulator(): XpAccumulator {
  return {
    rawXp: 0,
    effectiveXp: 0,
    tasksCompleted: 0,
    altoStreak: 0,
    peakStreak: 0,
    achievements: [],
  };
}

/**
 * Record a completed task and apply XP multiplier.
 * Returns a new accumulator (immutable update).
 */
export function recordTaskCompletion(
  acc: XpAccumulator,
  zone: PulseZone,
  xpPerTask: number = BASE_XP_PER_TASK,
): XpAccumulator {
  const newStreak = updateStreak(acc.altoStreak, zone);
  const multiplier = calculateXpMultiplier(zone, newStreak);

  const rawXp = acc.rawXp + xpPerTask;
  const effectiveXp =
    Math.round(
      (acc.effectiveXp + xpPerTask * multiplier.totalMultiplier) * 100,
    ) / 100;
  const tasksCompleted = acc.tasksCompleted + 1;
  const peakStreak = Math.max(acc.peakStreak, newStreak);

  const updated: XpAccumulator = {
    rawXp,
    effectiveXp,
    tasksCompleted,
    altoStreak: newStreak,
    peakStreak,
    achievements: acc.achievements,
  };

  // Check for new achievements
  const newAchievements = checkAchievements(updated);

  return { ...updated, achievements: newAchievements };
}

/**
 * Update streak from a pulse snapshot (no task completion).
 * Call this on every pulse reading to maintain streak tracking.
 */
export function recordPulseReading(
  acc: XpAccumulator,
  zone: PulseZone,
): XpAccumulator {
  const newStreak = updateStreak(acc.altoStreak, zone);
  const peakStreak = Math.max(acc.peakStreak, newStreak);

  const updated: XpAccumulator = {
    ...acc,
    altoStreak: newStreak,
    peakStreak,
  };

  return { ...updated, achievements: checkAchievements(updated) };
}

/**
 * Evaluate all achievements against current accumulator.
 * Returns de-duplicated list of unlocked achievement keys.
 */
export function checkAchievements(acc: XpAccumulator): readonly string[] {
  const unlocked = new Set<string>(acc.achievements);

  for (const achievement of ACHIEVEMENTS) {
    if (!unlocked.has(achievement.key) && achievement.condition(acc)) {
      unlocked.add(achievement.key);
    }
  }

  return Array.from(unlocked);
}
