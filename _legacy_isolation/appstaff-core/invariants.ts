// AppStaff Core — Invariants (CRITICAL — was missing, now complete)
import type { Shift, UUID, Violation, Task } from "./types";
import type { LegalProfile } from "../src/lib/legal-types";

/**
 * Check if worker has an active shift (no endAt)
 */
export function hasActiveShift(shifts: Shift[], workerId: UUID): boolean {
  return shifts.some((s) => s.workerId === workerId && !s.endAt);
}

/**
 * Invariant: No overlapping shifts for same worker
 */
export function checkNoOverlappingShifts(shifts: Shift[], workerId: UUID): Violation[] {
  const active = shifts.filter((s) => s.workerId === workerId);
  const violations: Violation[] = [];

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      const aEnd = a.endAt ?? "9999-12-31T23:59:59Z";
      const bEnd = b.endAt ?? "9999-12-31T23:59:59Z";

      // Check overlap: a.start < b.end AND b.start < a.end
      if (a.startAt < bEnd && b.startAt < aEnd) {
        violations.push({
          code: "OVERLAP",
          message: `Overlapping shifts detected for worker ${workerId}`,
          context: { shiftA: a.id, shiftB: b.id },
        });
      }
    }
  }
  return violations;
}

/**
 * Invariant: Minimum rest between shifts enforced by legal profile
 */
export function checkMinRestBetweenShifts(
  shifts: Shift[],
  workerId: UUID,
  legal: LegalProfile,
): Violation[] {
  const minRest = legal.labor_laws.min_rest_between_shifts_hours ?? 11;
  const hoursToMs = (h: number) => h * 60 * 60 * 1000;

  const ordered = shifts
    .filter((s) => s.workerId === workerId && s.endAt)
    .sort((a, b) => (a.endAt! < b.endAt! ? -1 : 1));

  const violations: Violation[] = [];

  for (let i = 1; i < ordered.length; i++) {
    const prevEnd = new Date(ordered[i - 1].endAt!).getTime();
    const nextStart = new Date(ordered[i].startAt).getTime();
    const restMs = nextStart - prevEnd;

    if (restMs < hoursToMs(minRest)) {
      violations.push({
        code: "REST_MIN",
        message: `Rest between shifts (${Math.round(restMs / 1000 / 60 / 60)}h) below legal minimum (${minRest}h)`,
        context: {
          prevShift: ordered[i - 1].id,
          nextShift: ordered[i].id,
          country: legal.iso,
        },
      });
    }
  }
  return violations;
}

/**
 * Invariant: Daily hours limit enforced by legal profile
 */
export function checkMaxHoursPerDay(
  shifts: Shift[],
  workerId: UUID,
  legal: LegalProfile,
): Violation[] {
  const maxDaily = legal.labor_laws.max_hours_per_day ?? 8;
  const violations: Violation[] = [];

  // Group shifts by day (ISO date)
  const byDay = new Map<string, Shift[]>();
  shifts.filter((s) => s.workerId === workerId).forEach((s) => {
    const day = new Date(s.startAt).toISOString().split("T")[0];
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(s);
  });

  // Check each day
  byDay.forEach((dayShifts, day) => {
    let totalHours = 0;
    dayShifts.forEach((s) => {
      if (s.endAt) {
        const start = new Date(s.startAt).getTime();
        const end = new Date(s.endAt).getTime();
        totalHours += (end - start) / (1000 * 60 * 60);
      }
    });

    if (totalHours > maxDaily) {
      violations.push({
        code: "DAILY_MAX",
        message: `Daily hours (${totalHours.toFixed(1)}h) exceed legal maximum (${maxDaily}h)`,
        context: { day, country: legal.iso },
      });
    }
  });

  return violations;
}

/**
 * Invariant: Weekly hours limit enforced by legal profile
 */
export function checkMaxHoursPerWeek(
  shifts: Shift[],
  workerId: UUID,
  legal: LegalProfile,
): Violation[] {
  const maxWeekly = legal.labor_laws.max_hours_per_week ?? 40;
  const violations: Violation[] = [];

  // Get ISO week number
  const getWeek = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  };

  // Group by ISO week
  const byWeek = new Map<string, Shift[]>();
  shifts.filter((s) => s.workerId === workerId).forEach((s) => {
    const date = new Date(s.startAt);
    const year = date.getFullYear();
    const week = getWeek(date);
    const key = `${year}-W${week}`;
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key)!.push(s);
  });

  // Check each week
  byWeek.forEach((weekShifts, week) => {
    let totalHours = 0;
    weekShifts.forEach((s) => {
      if (s.endAt) {
        const start = new Date(s.startAt).getTime();
        const end = new Date(s.endAt).getTime();
        totalHours += (end - start) / (1000 * 60 * 60);
      }
    });

    if (totalHours > maxWeekly) {
      violations.push({
        code: "WEEKLY_MAX",
        message: `Weekly hours (${totalHours.toFixed(1)}h) exceed legal maximum (${maxWeekly}h)`,
        context: { week, country: legal.iso },
      });
    }
  });

  return violations;
}

/**
 * Invariant: Task requires valid context (e.g., HACCP check requires active shift)
 */
export function checkTaskContext(task: Task, shift?: Shift): Violation[] {
  const violations: Violation[] = [];

  if (task.type === "HACCP_CHECK" && !shift) {
    violations.push({
      code: "CTX_MISSING",
      message: "HACCP check must belong to an active shift",
      context: { taskId: task.id },
    });
  }

  if (task.riskLevel === "HIGH" && !shift) {
    violations.push({
      code: "HIGH_RISK_OOH",
      message: "High-risk task outside of shift is not allowed",
      context: { taskId: task.id, riskLevel: "HIGH" },
    });
  }

  return violations;
}

/**
 * Invariant: Fair scheduling — no worker gets all undesirable shifts
 *
 * Rule: A worker with score >= 2x average is in unfair situation.
 * Rationale: The benefit of doubt protects the worker, not the system.
 * A worker carrying exactly double the average load is already unfair.
 */
export function checkLoadFairness(
  workerTasks: Map<UUID, Task[]>,
  riskWeights: Map<string, number> = new Map([["HIGH", 3], ["MEDIUM", 1], ["LOW", 0]]),
): Violation[] {
  const violations: Violation[] = [];

  const scores = Array.from(workerTasks.entries()).map(([workerId, tasks]) => {
    const score = tasks.reduce((acc, t) => acc + (riskWeights.get(t.riskLevel ?? "LOW") ?? 0), 0);
    return { workerId, score, taskCount: tasks.length };
  });

  if (scores.length < 2) return violations;

  const avgScore = scores.reduce((a, s) => a + s.score, 0) / scores.length;

  // Flag unfair distribution: >= 2x average is unfair (not just >)
  scores.forEach((s) => {
    if (s.score >= avgScore * 2) {
      violations.push({
        code: "UNFAIR_LOAD",
        message: `Worker ${s.workerId} has disproportionate risk load`,
        context: { workerId: s.workerId, score: s.score, avgScore },
      });
    }
  });

  return violations;
}
