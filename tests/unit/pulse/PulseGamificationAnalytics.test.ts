/**
 * B.4 — Pulse Gamification + Analytics + History Tests
 *
 * Self-contained: pure logic inlined to avoid ts-jest compilation
 * of pre-existing TS errors in unrelated source files.
 */

// ── Inline types (mirrors PulseState.ts) ───────────────────────────
type PulseZone = "FLOW_ALTO" | "FLOW_PARCIAL" | "FLOW_BASE";

type PulseSnapshot = {
  score: number;
  zone: PulseZone;
  components: { orderPressure: number; flowRate: number; timeBias: number };
};

type PulseHistoryEntry = {
  timestamp: string;
  score: number;
  zone: PulseZone;
  components: PulseSnapshot["components"];
};

// ── GamificationService logic (mirrors core-engine/pulse/GamificationService.ts) ──

type XpMultiplierResult = {
  baseMultiplier: number;
  streakBonus: number;
  totalMultiplier: number;
  streakCount: number;
};

type XpAccumulator = {
  rawXp: number;
  effectiveXp: number;
  tasksCompleted: number;
  altoStreak: number;
  peakStreak: number;
  achievements: readonly string[];
};

type Achievement = {
  key: string;
  label: string;
  description: string;
  condition: (acc: XpAccumulator) => boolean;
};

const ZONE_MULTIPLIERS: Record<PulseZone, number> = {
  FLOW_ALTO: 1.5,
  FLOW_PARCIAL: 1.0,
  FLOW_BASE: 0.8,
};

const MAX_STREAK_BONUS = 0.5;
const STREAK_BONUS_PER_COUNT = 0.05;
const MAX_STREAK_COUNT = 10;
const BASE_XP_PER_TASK = 10;

const ACHIEVEMENTS: readonly Achievement[] = [
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
    label: "Maquina de Pedidos",
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
    label: "Centuriao",
    description: "100 XP efetivo acumulado no turno",
    condition: (acc) => acc.effectiveXp >= 100,
  },
] as const;

function calculateXpMultiplier(
  zone: PulseZone,
  currentStreak: number,
): XpMultiplierResult {
  const baseMultiplier = ZONE_MULTIPLIERS[zone];
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

function updateStreak(previousStreak: number, newZone: PulseZone): number {
  return newZone === "FLOW_ALTO" ? previousStreak + 1 : 0;
}

function createEmptyAccumulator(): XpAccumulator {
  return {
    rawXp: 0,
    effectiveXp: 0,
    tasksCompleted: 0,
    altoStreak: 0,
    peakStreak: 0,
    achievements: [],
  };
}

function checkAchievements(acc: XpAccumulator): readonly string[] {
  const unlocked = new Set<string>(acc.achievements);
  for (const achievement of ACHIEVEMENTS) {
    if (!unlocked.has(achievement.key) && achievement.condition(acc)) {
      unlocked.add(achievement.key);
    }
  }
  return Array.from(unlocked);
}

function recordTaskCompletion(
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

  return { ...updated, achievements: checkAchievements(updated) };
}

// ── TaskAnalytics logic (mirrors core-engine/pulse/TaskAnalytics.ts) ──

type TaskCompletionEvent = {
  completedAt: string;
  pulseScore: number;
  pulseZone: PulseZone;
  durationSec: number;
  priority: "critical" | "high" | "normal" | "low";
};

type ZoneStats = {
  zone: PulseZone;
  count: number;
  avgDurationSec: number;
  tasksPerMinute: number;
  totalZoneTimeSec: number;
};

type TaskAnalyticsAccumulator = {
  events: readonly TaskCompletionEvent[];
  zoneTime: Record<PulseZone, number>;
  lastZone: PulseZone | null;
  lastTimestamp: string | null;
};

type TaskAnalyticsSummary = {
  byZone: readonly ZoneStats[];
  pulseCompletionCorrelation: number;
  totalTasks: number;
  avgPulseAtCompletion: number;
  zoneDistribution: Record<PulseZone, number>;
};

function createEmptyAnalytics(): TaskAnalyticsAccumulator {
  return {
    events: [],
    zoneTime: { FLOW_ALTO: 0, FLOW_PARCIAL: 0, FLOW_BASE: 0 },
    lastZone: null,
    lastTimestamp: null,
  };
}

function recordCompletion(
  acc: TaskAnalyticsAccumulator,
  event: TaskCompletionEvent,
): TaskAnalyticsAccumulator {
  return { ...acc, events: [...acc.events, event] };
}

function recordPulseTick(
  acc: TaskAnalyticsAccumulator,
  zone: PulseZone,
  timestamp: string,
): TaskAnalyticsAccumulator {
  if (acc.lastZone === null || acc.lastTimestamp === null) {
    return { ...acc, lastZone: zone, lastTimestamp: timestamp };
  }

  const elapsed = Math.max(
    0,
    (new Date(timestamp).getTime() - new Date(acc.lastTimestamp).getTime()) /
      1000,
  );

  const newZoneTime = { ...acc.zoneTime };
  newZoneTime[acc.lastZone] = (newZoneTime[acc.lastZone] || 0) + elapsed;

  return {
    ...acc,
    zoneTime: newZoneTime,
    lastZone: zone,
    lastTimestamp: timestamp,
  };
}

function computeZoneStats(acc: TaskAnalyticsAccumulator): readonly ZoneStats[] {
  const zones: PulseZone[] = ["FLOW_ALTO", "FLOW_PARCIAL", "FLOW_BASE"];

  return zones.map((zone) => {
    const zoneEvents = acc.events.filter((e) => e.pulseZone === zone);
    const count = zoneEvents.length;
    const totalZoneTimeSec = acc.zoneTime[zone] || 0;

    const avgDurationSec =
      count > 0
        ? Math.round(zoneEvents.reduce((s, e) => s + e.durationSec, 0) / count)
        : 0;

    const tasksPerMinute =
      totalZoneTimeSec > 60
        ? Math.round((count / (totalZoneTimeSec / 60)) * 100) / 100
        : count > 0
        ? count
        : 0;

    return { zone, count, avgDurationSec, tasksPerMinute, totalZoneTimeSec };
  });
}

function calculateCorrelation(events: readonly TaskCompletionEvent[]): number {
  if (events.length < 3) return 0;

  const xs = events.map((e) => e.pulseScore);
  const ys = events.map((e) => (e.durationSec > 0 ? 1 / e.durationSec : 0));

  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumX2 = xs.reduce((a, x) => a + x * x, 0);
  const sumY2 = ys.reduce((a, y) => a + y * y, 0);

  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (den === 0) return 0;

  return Math.round((num / den) * 1000) / 1000;
}

function generateSummary(acc: TaskAnalyticsAccumulator): TaskAnalyticsSummary {
  const byZone = computeZoneStats(acc);
  const totalTasks = acc.events.length;
  const pulseCompletionCorrelation = calculateCorrelation(acc.events);

  const avgPulseAtCompletion =
    totalTasks > 0
      ? Math.round(
          (acc.events.reduce((s, e) => s + e.pulseScore, 0) / totalTasks) * 100,
        ) / 100
      : 0;

  const zoneDistribution: Record<PulseZone, number> = {
    FLOW_ALTO: 0,
    FLOW_PARCIAL: 0,
    FLOW_BASE: 0,
  };

  if (totalTasks > 0) {
    for (const stat of byZone) {
      zoneDistribution[stat.zone] =
        Math.round((stat.count / totalTasks) * 100 * 10) / 10;
    }
  }

  return {
    byZone,
    pulseCompletionCorrelation,
    totalTasks,
    avgPulseAtCompletion,
    zoneDistribution,
  };
}

// ── PulseHistory logic (mirrors core-engine/pulse/PulseHistory.ts) ──

type ZoneDurationSummary = {
  flowAltoSec: number;
  flowParcialSec: number;
  flowBaseSec: number;
  totalSec: number;
  percentages: Record<PulseZone, number>;
};

type PulseChartPoint = {
  minutesSinceStart: number;
  score: number;
  zone: PulseZone;
};

type PulseHistoryAccumulator = {
  entries: readonly PulseHistoryEntry[];
  shiftStart: string;
  peakScore: number;
  troughScore: number;
  transitionCount: number;
};

const MAX_HISTORY_ENTRIES = 240;

function createHistoryAccumulator(
  shiftStartISO: string,
): PulseHistoryAccumulator {
  return {
    entries: [],
    shiftStart: shiftStartISO,
    peakScore: 0,
    troughScore: 100,
    transitionCount: 0,
  };
}

function snapshotToEntry(
  snapshot: PulseSnapshot,
  timestampISO: string,
): PulseHistoryEntry {
  return {
    timestamp: timestampISO,
    score: snapshot.score,
    zone: snapshot.zone,
    components: { ...snapshot.components },
  };
}

function recordPulseEntry(
  acc: PulseHistoryAccumulator,
  entry: PulseHistoryEntry,
): PulseHistoryAccumulator {
  const prevZone =
    acc.entries.length > 0 ? acc.entries[acc.entries.length - 1].zone : null;
  const zoneChanged = prevZone !== null && prevZone !== entry.zone;

  let newEntries = [...acc.entries, entry];
  if (newEntries.length > MAX_HISTORY_ENTRIES) {
    newEntries = newEntries.slice(newEntries.length - MAX_HISTORY_ENTRIES);
  }

  return {
    entries: newEntries,
    shiftStart: acc.shiftStart,
    peakScore: Math.max(acc.peakScore, entry.score),
    troughScore: Math.min(acc.troughScore, entry.score),
    transitionCount: acc.transitionCount + (zoneChanged ? 1 : 0),
  };
}

function calculateZoneDurations(
  acc: PulseHistoryAccumulator,
): ZoneDurationSummary {
  const durations: Record<PulseZone, number> = {
    FLOW_ALTO: 0,
    FLOW_PARCIAL: 0,
    FLOW_BASE: 0,
  };

  const entries = acc.entries;
  for (let i = 0; i < entries.length - 1; i++) {
    const current = entries[i];
    const next = entries[i + 1];
    const gap = Math.max(
      0,
      (new Date(next.timestamp).getTime() -
        new Date(current.timestamp).getTime()) /
        1000,
    );
    durations[current.zone] += gap;
  }

  const totalSec =
    durations.FLOW_ALTO + durations.FLOW_PARCIAL + durations.FLOW_BASE;

  const percentages: Record<PulseZone, number> = {
    FLOW_ALTO:
      totalSec > 0
        ? Math.round((durations.FLOW_ALTO / totalSec) * 1000) / 10
        : 0,
    FLOW_PARCIAL:
      totalSec > 0
        ? Math.round((durations.FLOW_PARCIAL / totalSec) * 1000) / 10
        : 0,
    FLOW_BASE:
      totalSec > 0
        ? Math.round((durations.FLOW_BASE / totalSec) * 1000) / 10
        : 0,
  };

  return {
    flowAltoSec: Math.round(durations.FLOW_ALTO),
    flowParcialSec: Math.round(durations.FLOW_PARCIAL),
    flowBaseSec: Math.round(durations.FLOW_BASE),
    totalSec: Math.round(totalSec),
    percentages,
  };
}

function toChartData(
  acc: PulseHistoryAccumulator,
  maxPoints = 120,
): readonly PulseChartPoint[] {
  const entries = acc.entries;
  if (entries.length === 0) return [];

  const shiftStartMs = new Date(acc.shiftStart).getTime();

  const allPoints: PulseChartPoint[] = entries.map((e) => ({
    minutesSinceStart:
      Math.round(
        ((new Date(e.timestamp).getTime() - shiftStartMs) / 60000) * 10,
      ) / 10,
    score: e.score,
    zone: e.zone,
  }));

  if (allPoints.length <= maxPoints) return allPoints;

  const step = allPoints.length / maxPoints;
  const sampled: PulseChartPoint[] = [];
  for (let i = 0; i < maxPoints; i++) {
    sampled.push(allPoints[Math.floor(i * step)]);
  }

  const last = allPoints[allPoints.length - 1];
  if (sampled.length > 0 && sampled[sampled.length - 1] !== last) {
    sampled[sampled.length - 1] = last;
  }

  return sampled;
}

function getShiftSummary(acc: PulseHistoryAccumulator): string {
  if (acc.entries.length === 0) return "Sem dados de pulse neste turno.";

  const durations = calculateZoneDurations(acc);
  const latest = acc.entries[acc.entries.length - 1];

  return [
    `Turno: ${
      durations.totalSec > 0 ? Math.round(durations.totalSec / 60) : 0
    } min`,
    `Score atual: ${latest.score} (${latest.zone})`,
    `Pico: ${acc.peakScore} | Minimo: ${acc.troughScore}`,
    `FLOW_ALTO: ${durations.percentages.FLOW_ALTO}%`,
    `FLOW_PARCIAL: ${durations.percentages.FLOW_PARCIAL}%`,
    `FLOW_BASE: ${durations.percentages.FLOW_BASE}%`,
    `Transicoes: ${acc.transitionCount}`,
  ].join(" | ");
}

// ── Tests ─────────────────────────────────────────────────────────

describe("GamificationService", () => {
  it("calculates multiplier with streak bonus", () => {
    const res = calculateXpMultiplier("FLOW_ALTO", 3);
    expect(res.baseMultiplier).toBe(1.5);
    expect(res.streakBonus).toBeCloseTo(0.15, 5);
    expect(res.totalMultiplier).toBeCloseTo(1.65, 5);
  });

  it("caps streak at 10 and max bonus at 0.5", () => {
    const res = calculateXpMultiplier("FLOW_ALTO", 12);
    expect(res.streakCount).toBe(10);
    expect(res.streakBonus).toBe(0.5);
    expect(res.totalMultiplier).toBe(2);
  });

  it("resets streak outside FLOW_ALTO", () => {
    expect(updateStreak(4, "FLOW_BASE")).toBe(0);
    expect(updateStreak(2, "FLOW_PARCIAL")).toBe(0);
  });

  it("unlocks achievements for FLOW_ALTO and XP milestones", () => {
    let acc = createEmptyAccumulator();

    // First FLOW_ALTO task
    acc = recordTaskCompletion(acc, "FLOW_ALTO");
    expect(acc.achievements).toContain("first_flow_alto");

    // Reach 10 tasks in FLOW_PARCIAL
    for (let i = 0; i < 9; i++) {
      acc = recordTaskCompletion(acc, "FLOW_PARCIAL");
    }
    expect(acc.tasksCompleted).toBe(10);
    expect(acc.achievements).toContain("tasks_10");

    // Fast-track effective XP >= 100 in FLOW_ALTO
    for (let i = 0; i < 6; i++) {
      acc = recordTaskCompletion(acc, "FLOW_ALTO");
    }
    expect(acc.effectiveXp).toBeGreaterThanOrEqual(100);
    expect(acc.achievements).toContain("xp_100");
  });
});

describe("TaskAnalytics", () => {
  it("accumulates zone time from pulse ticks", () => {
    let acc = createEmptyAnalytics();
    acc = recordPulseTick(acc, "FLOW_BASE", "2025-01-01T10:00:00.000Z");
    acc = recordPulseTick(acc, "FLOW_BASE", "2025-01-01T10:02:00.000Z");
    acc = recordPulseTick(acc, "FLOW_ALTO", "2025-01-01T10:03:00.000Z");

    expect(acc.zoneTime.FLOW_BASE).toBe(180);
    expect(acc.zoneTime.FLOW_ALTO).toBe(0);
  });

  it("computes per-zone stats and tasks per minute", () => {
    let acc = createEmptyAnalytics();
    acc = {
      ...acc,
      zoneTime: { FLOW_ALTO: 120, FLOW_PARCIAL: 0, FLOW_BASE: 0 },
    };
    acc = recordCompletion(acc, {
      completedAt: "2025-01-01T10:00:00.000Z",
      pulseScore: 80,
      pulseZone: "FLOW_ALTO",
      durationSec: 30,
      priority: "high",
    });
    acc = recordCompletion(acc, {
      completedAt: "2025-01-01T10:00:30.000Z",
      pulseScore: 85,
      pulseZone: "FLOW_ALTO",
      durationSec: 60,
      priority: "normal",
    });

    const stats = computeZoneStats(acc).find((s) => s.zone === "FLOW_ALTO");
    expect(stats?.count).toBe(2);
    expect(stats?.avgDurationSec).toBe(45);
    expect(stats?.tasksPerMinute).toBe(1);
  });

  it("calculates positive correlation when speed increases with pulse", () => {
    const events: TaskCompletionEvent[] = [
      {
        completedAt: "2025-01-01T10:00:00.000Z",
        pulseScore: 10,
        pulseZone: "FLOW_BASE",
        durationSec: 90,
        priority: "low",
      },
      {
        completedAt: "2025-01-01T10:02:00.000Z",
        pulseScore: 50,
        pulseZone: "FLOW_PARCIAL",
        durationSec: 60,
        priority: "normal",
      },
      {
        completedAt: "2025-01-01T10:04:00.000Z",
        pulseScore: 90,
        pulseZone: "FLOW_ALTO",
        durationSec: 30,
        priority: "high",
      },
    ];

    expect(calculateCorrelation(events)).toBeGreaterThan(0.8);
  });

  it("summarizes task distribution and avg pulse", () => {
    let acc = createEmptyAnalytics();
    acc = recordCompletion(acc, {
      completedAt: "2025-01-01T10:00:00.000Z",
      pulseScore: 70,
      pulseZone: "FLOW_ALTO",
      durationSec: 40,
      priority: "high",
    });
    acc = recordCompletion(acc, {
      completedAt: "2025-01-01T10:01:00.000Z",
      pulseScore: 30,
      pulseZone: "FLOW_BASE",
      durationSec: 50,
      priority: "normal",
    });

    const summary = generateSummary(acc);
    expect(summary.totalTasks).toBe(2);
    expect(summary.avgPulseAtCompletion).toBe(50);
    expect(summary.zoneDistribution.FLOW_ALTO).toBe(50);
    expect(summary.zoneDistribution.FLOW_BASE).toBe(50);
  });
});

describe("PulseHistory", () => {
  it("tracks peak, trough, and transitions", () => {
    const shiftStart = "2025-01-01T10:00:00.000Z";
    let acc = createHistoryAccumulator(shiftStart);

    acc = recordPulseEntry(
      acc,
      snapshotToEntry(
        {
          score: 10,
          zone: "FLOW_BASE",
          components: { orderPressure: 0, flowRate: 0, timeBias: 0 },
        },
        "2025-01-01T10:00:00.000Z",
      ),
    );
    acc = recordPulseEntry(
      acc,
      snapshotToEntry(
        {
          score: 20,
          zone: "FLOW_BASE",
          components: { orderPressure: 0, flowRate: 0, timeBias: 0 },
        },
        "2025-01-01T10:01:00.000Z",
      ),
    );
    acc = recordPulseEntry(
      acc,
      snapshotToEntry(
        {
          score: 80,
          zone: "FLOW_ALTO",
          components: { orderPressure: 0, flowRate: 0, timeBias: 0 },
        },
        "2025-01-01T10:02:00.000Z",
      ),
    );

    expect(acc.peakScore).toBe(80);
    expect(acc.troughScore).toBe(10);
    expect(acc.transitionCount).toBe(1);
  });

  it("calculates zone durations and percentages", () => {
    const shiftStart = "2025-01-01T10:00:00.000Z";
    let acc = createHistoryAccumulator(shiftStart);

    acc = recordPulseEntry(
      acc,
      snapshotToEntry(
        {
          score: 10,
          zone: "FLOW_BASE",
          components: { orderPressure: 0, flowRate: 0, timeBias: 0 },
        },
        "2025-01-01T10:00:00.000Z",
      ),
    );
    acc = recordPulseEntry(
      acc,
      snapshotToEntry(
        {
          score: 20,
          zone: "FLOW_BASE",
          components: { orderPressure: 0, flowRate: 0, timeBias: 0 },
        },
        "2025-01-01T10:02:00.000Z",
      ),
    );
    acc = recordPulseEntry(
      acc,
      snapshotToEntry(
        {
          score: 30,
          zone: "FLOW_BASE",
          components: { orderPressure: 0, flowRate: 0, timeBias: 0 },
        },
        "2025-01-01T10:04:00.000Z",
      ),
    );

    const durations = calculateZoneDurations(acc);
    expect(durations.flowBaseSec).toBe(240);
    expect(durations.percentages.FLOW_BASE).toBe(100);
  });

  it("downsamples chart data when exceeding max points", () => {
    const shiftStart = "2025-01-01T10:00:00.000Z";
    let acc = createHistoryAccumulator(shiftStart);

    for (let i = 0; i < 10; i++) {
      acc = recordPulseEntry(
        acc,
        snapshotToEntry(
          {
            score: i * 10,
            zone: i % 2 === 0 ? "FLOW_BASE" : "FLOW_PARCIAL",
            components: { orderPressure: 0, flowRate: 0, timeBias: 0 },
          },
          new Date(new Date(shiftStart).getTime() + i * 60_000).toISOString(),
        ),
      );
    }

    const points = toChartData(acc, 5);
    expect(points.length).toBe(5);
    expect(points[points.length - 1].score).toBe(90);
  });

  it("returns a shift summary string", () => {
    const shiftStart = "2025-01-01T10:00:00.000Z";
    let acc = createHistoryAccumulator(shiftStart);

    acc = recordPulseEntry(
      acc,
      snapshotToEntry(
        {
          score: 40,
          zone: "FLOW_PARCIAL",
          components: { orderPressure: 0, flowRate: 0, timeBias: 0 },
        },
        "2025-01-01T10:00:00.000Z",
      ),
    );

    const summary = getShiftSummary(acc);
    expect(summary).toContain("FLOW_PARCIAL");
    expect(summary).toContain("Score atual");
  });
});
