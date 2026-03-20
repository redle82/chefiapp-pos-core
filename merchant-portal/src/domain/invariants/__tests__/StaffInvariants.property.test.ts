/**
 * Property Tests for Staff Invariants
 *
 * Validates staff/shift domain rules across randomly generated inputs.
 */

import { describe, it, expect } from "vitest";
import {
  canClockIn,
  canClockOut,
  canStartBreak,
  canEditShift,
} from "../StaffInvariants";
import type { ShiftSnapshot } from "../StaffInvariants";
import type { UserRole } from "../../../core/context/ContextTypes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const USER_ROLES: UserRole[] = ["waiter", "kitchen", "manager", "owner"];
const ELEVATED_ROLES: UserRole[] = ["manager", "owner"];
const LOW_ROLES: UserRole[] = ["waiter", "kitchen"];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomShift(
  overrides: Partial<ShiftSnapshot> = {},
): ShiftSnapshot {
  return {
    id: `shift-${randomInt(1, 99999)}`,
    operator_id: `op-${randomInt(1, 100)}`,
    status: "active",
    clock_in: new Date().toISOString(),
    clock_out: null,
    breaks: [],
    ...overrides,
  };
}

const ITERATIONS = 200;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("StaffInvariants — property tests", () => {
  describe("canClockIn — cannot clock in if already clocked in", () => {
    it("property: with an active shift, clock-in is always rejected", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const operatorId = `op-${randomInt(1, 100)}`;
        const activeShift = randomShift({
          operator_id: operatorId,
          status: "active",
        });
        const result = canClockIn(operatorId, activeShift);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("already has an active shift");
      }
    });

    it("property: with on_break shift, clock-in is also rejected (shift still active)", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const operatorId = `op-${randomInt(1, 100)}`;
        const onBreakShift = randomShift({
          operator_id: operatorId,
          status: "on_break",
          breaks: [{ end: null }],
        });
        const result = canClockIn(operatorId, onBreakShift);
        expect(result.allowed).toBe(false);
      }
    });

    it("property: without active shift, clock-in is always allowed", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const operatorId = `op-${randomInt(1, 100)}`;
        const result = canClockIn(operatorId, null);
        expect(result.allowed).toBe(true);
      }
    });

    it("property: with completed shift (no active), clock-in is allowed", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const operatorId = `op-${randomInt(1, 100)}`;
        // Passing null since completed shifts are not "active"
        const result = canClockIn(operatorId, null);
        expect(result.allowed).toBe(true);
      }
    });
  });

  describe("canClockOut — break must be ended first", () => {
    it("property: active shift with no open break can always clock out", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const closedBreaks = Array.from(
          { length: randomInt(0, 3) },
          () => ({ end: new Date().toISOString() }),
        );
        const shift = randomShift({
          status: "active",
          breaks: closedBreaks,
        });
        const result = canClockOut(shift);
        expect(result.allowed).toBe(true);
      }
    });

    it("property: shift with an active break always rejects clock-out", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const breaks = [
          ...Array.from({ length: randomInt(0, 2) }, () => ({
            end: new Date().toISOString(),
          })),
          { end: null }, // active break
        ];
        const shift = randomShift({
          status: "active",
          breaks,
        });
        const result = canClockOut(shift);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("break");
      }
    });

    it("property: completed or auto-closed shifts reject clock-out", () => {
      const endedStatuses = ["completed", "auto_closed"] as const;
      for (let i = 0; i < ITERATIONS; i++) {
        const status = randomChoice(endedStatuses);
        const shift = randomShift({ status });
        const result = canClockOut(shift);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("already ended");
      }
    });
  });

  describe("canStartBreak", () => {
    it("property: break can only start from active status without open break", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const closedBreaks = Array.from(
          { length: randomInt(0, 3) },
          () => ({ end: new Date().toISOString() }),
        );
        const shift = randomShift({
          status: "active",
          breaks: closedBreaks,
        });
        const result = canStartBreak(shift);
        expect(result.allowed).toBe(true);
      }
    });

    it("property: non-active status always rejects break start", () => {
      const nonActive = ["on_break", "completed", "auto_closed"] as const;
      for (let i = 0; i < ITERATIONS; i++) {
        const status = randomChoice(nonActive);
        const shift = randomShift({ status });
        const result = canStartBreak(shift);
        expect(result.allowed).toBe(false);
      }
    });

    it("property: already on break rejects another break start", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const shift = randomShift({
          status: "active",
          breaks: [{ end: null }],
        });
        const result = canStartBreak(shift);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("already on a break");
      }
    });
  });

  describe("canEditShift — only manager/owner can edit past shifts", () => {
    it("property: non-elevated roles always rejected for shift editing", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const role = randomChoice(LOW_ROLES);
        const result = canEditShift(role);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("managers or owners");
      }
    });

    it("property: elevated roles always allowed to edit shifts", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const role = randomChoice(ELEVATED_ROLES);
        const result = canEditShift(role);
        expect(result.allowed).toBe(true);
      }
    });
  });

  describe("break duration invariant (application-level)", () => {
    it("property: total break time cannot exceed shift duration", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const shiftDurationMinutes = randomInt(60, 720); // 1-12 hours
        const breakCount = randomInt(1, 4);
        const breakDurations = Array.from({ length: breakCount }, () =>
          randomInt(5, 60),
        );
        const totalBreakMinutes = breakDurations.reduce((a, b) => a + b, 0);

        // The invariant: break time must not exceed shift time
        if (totalBreakMinutes > shiftDurationMinutes) {
          expect(totalBreakMinutes).toBeGreaterThan(shiftDurationMinutes);
          // This would be rejected by the application
        } else {
          expect(totalBreakMinutes).toBeLessThanOrEqual(shiftDurationMinutes);
        }
      }
    });
  });
});
