import { describe, expect, it } from "vitest";
import type { XpAccumulator } from "./GamificationService";
import {
  ACHIEVEMENTS,
  BASE_XP_PER_TASK,
  calculateXpMultiplier,
  checkAchievements,
  createEmptyAccumulator,
  recordPulseReading,
  recordTaskCompletion,
  updateStreak,
  ZONE_MULTIPLIERS,
} from "./GamificationService";

// ─── Constants ──────────────────────────────────────────

describe("constants", () => {
  it("ZONE_MULTIPLIERS has correct values", () => {
    expect(ZONE_MULTIPLIERS.FLOW_ALTO).toBe(1.5);
    expect(ZONE_MULTIPLIERS.FLOW_PARCIAL).toBe(1.0);
    expect(ZONE_MULTIPLIERS.FLOW_BASE).toBe(0.8);
  });

  it("BASE_XP_PER_TASK is 10", () => {
    expect(BASE_XP_PER_TASK).toBe(10);
  });

  it("ACHIEVEMENTS has 6 entries", () => {
    expect(ACHIEVEMENTS).toHaveLength(6);
    expect(ACHIEVEMENTS.map((a) => a.key)).toEqual([
      "first_flow_alto",
      "streak_5",
      "streak_10",
      "tasks_10",
      "tasks_25",
      "xp_100",
    ]);
  });
});

// ─── calculateXpMultiplier ──────────────────────────────

describe("calculateXpMultiplier", () => {
  it("FLOW_ALTO with streak 0 → base 1.5, no bonus", () => {
    const r = calculateXpMultiplier("FLOW_ALTO", 0);
    expect(r.baseMultiplier).toBe(1.5);
    expect(r.streakBonus).toBe(0);
    expect(r.totalMultiplier).toBe(1.5);
    expect(r.streakCount).toBe(0);
  });

  it("FLOW_ALTO with streak 5 → bonus 0.25", () => {
    const r = calculateXpMultiplier("FLOW_ALTO", 5);
    expect(r.baseMultiplier).toBe(1.5);
    expect(r.streakBonus).toBeCloseTo(0.25, 2);
    expect(r.totalMultiplier).toBeCloseTo(1.75, 2);
    expect(r.streakCount).toBe(5);
  });

  it("FLOW_ALTO with streak 10 → max bonus 0.5, total 2.0", () => {
    const r = calculateXpMultiplier("FLOW_ALTO", 10);
    expect(r.streakBonus).toBe(0.5);
    expect(r.totalMultiplier).toBe(2.0);
    expect(r.streakCount).toBe(10);
  });

  it("FLOW_ALTO with streak > 10 → capped at 10", () => {
    const r = calculateXpMultiplier("FLOW_ALTO", 20);
    expect(r.streakBonus).toBe(0.5);
    expect(r.totalMultiplier).toBe(2.0);
    expect(r.streakCount).toBe(10);
  });

  it("FLOW_PARCIAL → 1.0, no streak bonus regardless", () => {
    const r = calculateXpMultiplier("FLOW_PARCIAL", 5);
    expect(r.baseMultiplier).toBe(1.0);
    expect(r.streakBonus).toBe(0);
    expect(r.totalMultiplier).toBe(1.0);
    expect(r.streakCount).toBe(0);
  });

  it("FLOW_BASE → 0.8, no streak bonus regardless", () => {
    const r = calculateXpMultiplier("FLOW_BASE", 10);
    expect(r.baseMultiplier).toBe(0.8);
    expect(r.streakBonus).toBe(0);
    expect(r.totalMultiplier).toBe(0.8);
    expect(r.streakCount).toBe(0);
  });
});

// ─── updateStreak ───────────────────────────────────────

describe("updateStreak", () => {
  it("increments in FLOW_ALTO", () => {
    expect(updateStreak(3, "FLOW_ALTO")).toBe(4);
    expect(updateStreak(0, "FLOW_ALTO")).toBe(1);
  });

  it("resets to 0 in FLOW_PARCIAL", () => {
    expect(updateStreak(5, "FLOW_PARCIAL")).toBe(0);
  });

  it("resets to 0 in FLOW_BASE", () => {
    expect(updateStreak(10, "FLOW_BASE")).toBe(0);
  });
});

// ─── createEmptyAccumulator ─────────────────────────────

describe("createEmptyAccumulator", () => {
  it("returns zeroed accumulator", () => {
    const acc = createEmptyAccumulator();
    expect(acc).toEqual({
      rawXp: 0,
      effectiveXp: 0,
      tasksCompleted: 0,
      altoStreak: 0,
      peakStreak: 0,
      achievements: [],
    });
  });
});

// ─── recordTaskCompletion ───────────────────────────────

describe("recordTaskCompletion", () => {
  it("adds raw XP and effective XP for FLOW_ALTO", () => {
    const acc = createEmptyAccumulator();
    const next = recordTaskCompletion(acc, "FLOW_ALTO");
    expect(next.rawXp).toBe(10);
    // streak goes from 0 → 1, multiplier: calculateXpMultiplier("FLOW_ALTO", 1)
    // base 1.5 + streak 0.05 = 1.55
    expect(next.effectiveXp).toBeCloseTo(15.5, 2);
    expect(next.tasksCompleted).toBe(1);
    expect(next.altoStreak).toBe(1);
  });

  it("adds raw XP with 0.8x for FLOW_BASE and resets streak", () => {
    const acc: XpAccumulator = {
      rawXp: 10,
      effectiveXp: 15,
      tasksCompleted: 1,
      altoStreak: 3,
      peakStreak: 3,
      achievements: [],
    };
    const next = recordTaskCompletion(acc, "FLOW_BASE");
    expect(next.rawXp).toBe(20);
    // streak resets to 0, multiplier = 0.8
    expect(next.effectiveXp).toBeCloseTo(23, 2); // 15 + 10 * 0.8
    expect(next.altoStreak).toBe(0);
    expect(next.peakStreak).toBe(3); // preserved from before
  });

  it("allows custom xpPerTask", () => {
    const acc = createEmptyAccumulator();
    const next = recordTaskCompletion(acc, "FLOW_PARCIAL", 20);
    expect(next.rawXp).toBe(20);
    // FLOW_PARCIAL: 1.0x, streak 0
    expect(next.effectiveXp).toBe(20);
  });

  it("peakStreak tracks highest streak achieved", () => {
    let acc = createEmptyAccumulator();
    // 3 consecutive FLOW_ALTO tasks
    acc = recordTaskCompletion(acc, "FLOW_ALTO");
    acc = recordTaskCompletion(acc, "FLOW_ALTO");
    acc = recordTaskCompletion(acc, "FLOW_ALTO");
    expect(acc.peakStreak).toBe(3);

    // Break streak
    acc = recordTaskCompletion(acc, "FLOW_BASE");
    expect(acc.altoStreak).toBe(0);
    expect(acc.peakStreak).toBe(3); // preserved

    // Build again but shorter
    acc = recordTaskCompletion(acc, "FLOW_ALTO");
    expect(acc.altoStreak).toBe(1);
    expect(acc.peakStreak).toBe(3); // still the old peak
  });

  it("is immutable (does not mutate input)", () => {
    const acc = createEmptyAccumulator();
    const next = recordTaskCompletion(acc, "FLOW_ALTO");
    expect(acc.rawXp).toBe(0);
    expect(next.rawXp).toBe(10);
  });

  it("unlocks achievements when conditions met", () => {
    let acc = createEmptyAccumulator();
    // Complete 1 task in FLOW_ALTO → should unlock first_flow_alto
    acc = recordTaskCompletion(acc, "FLOW_ALTO");
    expect(acc.achievements).toContain("first_flow_alto");
  });
});

// ─── recordPulseReading ─────────────────────────────────

describe("recordPulseReading", () => {
  it("updates streak without adding XP", () => {
    const acc = createEmptyAccumulator();
    const next = recordPulseReading(acc, "FLOW_ALTO");
    expect(next.altoStreak).toBe(1);
    expect(next.rawXp).toBe(0);
    expect(next.effectiveXp).toBe(0);
    expect(next.tasksCompleted).toBe(0);
  });

  it("resets streak on non-ALTO zone", () => {
    const acc: XpAccumulator = {
      rawXp: 0,
      effectiveXp: 0,
      tasksCompleted: 0,
      altoStreak: 5,
      peakStreak: 5,
      achievements: [],
    };
    const next = recordPulseReading(acc, "FLOW_PARCIAL");
    expect(next.altoStreak).toBe(0);
    expect(next.peakStreak).toBe(5);
  });

  it("tracks peakStreak across readings", () => {
    let acc = createEmptyAccumulator();
    for (let i = 0; i < 7; i++) {
      acc = recordPulseReading(acc, "FLOW_ALTO");
    }
    expect(acc.altoStreak).toBe(7);
    expect(acc.peakStreak).toBe(7);
  });

  it("can unlock streak_5 achievement via pulse readings alone", () => {
    let acc = createEmptyAccumulator();
    for (let i = 0; i < 5; i++) {
      acc = recordPulseReading(acc, "FLOW_ALTO");
    }
    expect(acc.achievements).toContain("streak_5");
  });
});

// ─── checkAchievements ──────────────────────────────────

describe("checkAchievements", () => {
  it("returns empty for fresh accumulator", () => {
    const acc = createEmptyAccumulator();
    expect(checkAchievements(acc)).toEqual([]);
  });

  it("does not duplicate already-unlocked achievements", () => {
    const acc: XpAccumulator = {
      rawXp: 0,
      effectiveXp: 0,
      tasksCompleted: 0,
      altoStreak: 1,
      peakStreak: 1,
      achievements: ["first_flow_alto"],
    };
    // Condition for first_flow_alto: altoStreak >= 1 && tasksCompleted >= 1
    // tasksCompleted is 0, so condition is false — but already unlocked, should keep it
    const result = checkAchievements(acc);
    expect(result.filter((a) => a === "first_flow_alto")).toHaveLength(1);
  });

  it("unlocks tasks_10 at 10 tasks", () => {
    const acc: XpAccumulator = {
      rawXp: 100,
      effectiveXp: 100,
      tasksCompleted: 10,
      altoStreak: 0,
      peakStreak: 0,
      achievements: [],
    };
    const result = checkAchievements(acc);
    expect(result).toContain("tasks_10");
    expect(result).toContain("xp_100");
  });

  it("unlocks tasks_25 at 25 tasks", () => {
    const acc: XpAccumulator = {
      rawXp: 250,
      effectiveXp: 250,
      tasksCompleted: 25,
      altoStreak: 0,
      peakStreak: 10,
      achievements: [],
    };
    const result = checkAchievements(acc);
    expect(result).toContain("tasks_25");
    expect(result).toContain("tasks_10");
    expect(result).toContain("streak_10");
    expect(result).toContain("xp_100");
  });

  it("unlocks streak_10 at peakStreak 10", () => {
    const acc: XpAccumulator = {
      rawXp: 0,
      effectiveXp: 0,
      tasksCompleted: 0,
      altoStreak: 10,
      peakStreak: 10,
      achievements: [],
    };
    const result = checkAchievements(acc);
    expect(result).toContain("streak_10");
    expect(result).toContain("streak_5");
  });
});
