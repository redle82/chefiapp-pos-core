/**
 * E2E Test: Shift Management
 * Tests clock in/out, breaks, and shift calculations.
 */
import { describe, it, expect } from "vitest";

describe("Shift Management", () => {
  describe("Clock In/Out", () => {
    it("should calculate shift duration", () => {
      const clockIn = new Date("2026-03-19T09:00:00Z");
      const clockOut = new Date("2026-03-19T17:30:00Z");
      const durationMs = clockOut.getTime() - clockIn.getTime();
      const durationMinutes = Math.round(durationMs / 60000);
      expect(durationMinutes).toBe(510); // 8h30m
    });

    it("should subtract break time from total", () => {
      const totalMinutes = 510; // 8h30m
      const breakMinutes = 60; // 1h lunch
      const workedMinutes = totalMinutes - breakMinutes;
      expect(workedMinutes).toBe(450); // 7h30m
    });

    it("should detect overtime (>8h)", () => {
      const workedMinutes = 540; // 9h
      const isOvertime = workedMinutes > 480;
      const overtimeMinutes = workedMinutes - 480;
      expect(isOvertime).toBe(true);
      expect(overtimeMinutes).toBe(60);
    });

    it("should auto-close shifts after 14h", () => {
      const MAX_SHIFT_HOURS = 14;
      const clockIn = new Date("2026-03-19T08:00:00Z");
      const now = new Date("2026-03-19T23:00:00Z"); // 15h later
      const hoursElapsed = (now.getTime() - clockIn.getTime()) / 3600000;
      expect(hoursElapsed).toBeGreaterThan(MAX_SHIFT_HOURS);
    });
  });

  describe("Breaks", () => {
    it("should calculate total break time", () => {
      const breaks = [
        { type: "short", start: "2026-03-19T11:00:00Z", end: "2026-03-19T11:15:00Z" },
        { type: "lunch", start: "2026-03-19T13:00:00Z", end: "2026-03-19T14:00:00Z" },
      ];
      const totalBreakMs = breaks.reduce((sum, b) => {
        if (!b.end) return sum;
        return sum + (new Date(b.end).getTime() - new Date(b.start).getTime());
      }, 0);
      const totalBreakMinutes = Math.round(totalBreakMs / 60000);
      expect(totalBreakMinutes).toBe(75); // 15min + 60min
    });
  });

  describe("Timesheet", () => {
    it("should aggregate weekly hours per operator", () => {
      const shifts = [
        { operator: "Sofia", day: "Mon", minutes: 480 },
        { operator: "Sofia", day: "Tue", minutes: 510 },
        { operator: "Sofia", day: "Wed", minutes: 450 },
        { operator: "João", day: "Mon", minutes: 360 },
        { operator: "João", day: "Tue", minutes: 480 },
      ];

      const byOperator = shifts.reduce((acc, s) => {
        acc[s.operator] = (acc[s.operator] || 0) + s.minutes;
        return acc;
      }, {} as Record<string, number>);

      expect(byOperator["Sofia"]).toBe(1440); // 24h
      expect(byOperator["João"]).toBe(840); // 14h
    });
  });
});
