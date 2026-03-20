/**
 * Contract Tests — StaffUseCases
 *
 * Validates the application layer's orchestration of domain invariants,
 * ShiftClockService calls, domain events, and metrics for staff operations.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockShift } from "./helpers";

// ---------------------------------------------------------------------------
// Mock all external dependencies
// ---------------------------------------------------------------------------

vi.mock("../../core/shift/ShiftService", () => ({
  ShiftClockService: {
    getActiveShift: vi.fn(),
    getShiftById: vi.fn(),
    clockIn: vi.fn(),
    clockOut: vi.fn(),
    startBreak: vi.fn(),
    endBreak: vi.fn(),
  },
}));

vi.mock("../../domain/events/DomainEvents", () => ({
  emitDomainEvent: vi.fn(),
}));

vi.mock("../../analytics/track", () => ({
  track: vi.fn(),
}));

vi.mock("../../core/logger", () => ({
  Logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// Import after mocks
import { clockIn, clockOut, startBreak, endBreak } from "../StaffUseCases";
import { ShiftClockService } from "../../core/shift/ShiftService";

const mockedGetActiveShift = vi.mocked(ShiftClockService.getActiveShift);
const mockedGetShiftById = vi.mocked(ShiftClockService.getShiftById);
const mockedClockIn = vi.mocked(ShiftClockService.clockIn);
const mockedClockOut = vi.mocked(ShiftClockService.clockOut);
const mockedStartBreak = vi.mocked(ShiftClockService.startBreak);
const mockedEndBreak = vi.mocked(ShiftClockService.endBreak);

// ---------------------------------------------------------------------------
// clockIn
// ---------------------------------------------------------------------------

describe("clockIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates canClockIn — succeeds when no active shift", async () => {
    mockedGetActiveShift.mockResolvedValue(null);
    mockedClockIn.mockResolvedValue({ success: true, shiftId: "shift_new" } as any);

    const result = await clockIn({
      operatorId: "op_1",
      operatorName: "John",
      restaurantId: "rest_1",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ shiftId: "shift_new" });
  });

  it("fails when already clocked in (active shift exists)", async () => {
    mockedGetActiveShift.mockResolvedValue({
      id: "shift_1",
      operator_id: "op_1",
      status: "active",
      clock_in: "2026-01-01T08:00:00Z",
      clock_out: null,
      breaks: [],
    } as any);

    const result = await clockIn({
      operatorId: "op_1",
      operatorName: "John",
      restaurantId: "rest_1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already has an active shift/i);
    expect(mockedClockIn).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// clockOut
// ---------------------------------------------------------------------------

describe("clockOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates canClockOut — succeeds for active shift without open breaks", async () => {
    mockedGetShiftById.mockResolvedValue({
      id: "shift_1",
      operator_id: "op_1",
      status: "active",
      clock_in: "2026-01-01T08:00:00Z",
      clock_out: null,
      breaks: [],
    } as any);
    mockedClockOut.mockResolvedValue({ success: true, totalMinutes: 480 } as any);

    const result = await clockOut({
      operatorId: "op_1",
      shiftId: "shift_1",
      restaurantId: "rest_1",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ totalMinutes: 480 });
  });

  it("calculates hours correctly (returns totalMinutes from service)", async () => {
    mockedGetShiftById.mockResolvedValue({
      id: "shift_1",
      operator_id: "op_1",
      status: "active",
      clock_in: "2026-01-01T08:00:00Z",
      clock_out: null,
      breaks: [{ end: "2026-01-01T12:30:00Z" }],
    } as any);
    mockedClockOut.mockResolvedValue({ success: true, totalMinutes: 120 } as any);

    const result = await clockOut({
      operatorId: "op_1",
      shiftId: "shift_1",
      restaurantId: "rest_1",
    });

    expect(result.success).toBe(true);
    expect(result.data?.totalMinutes).toBe(120);
  });

  it("fails when shift has an active break (end === null)", async () => {
    mockedGetShiftById.mockResolvedValue({
      id: "shift_1",
      operator_id: "op_1",
      status: "active",
      clock_in: "2026-01-01T08:00:00Z",
      clock_out: null,
      breaks: [{ end: null }],
    } as any);

    const result = await clockOut({
      operatorId: "op_1",
      shiftId: "shift_1",
      restaurantId: "rest_1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/break must be ended/i);
    expect(mockedClockOut).not.toHaveBeenCalled();
  });

  it("fails when shift is already completed", async () => {
    mockedGetShiftById.mockResolvedValue({
      id: "shift_1",
      operator_id: "op_1",
      status: "completed",
      clock_in: "2026-01-01T08:00:00Z",
      clock_out: "2026-01-01T16:00:00Z",
      breaks: [],
    } as any);

    const result = await clockOut({
      operatorId: "op_1",
      shiftId: "shift_1",
      restaurantId: "rest_1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already ended/i);
  });
});

// ---------------------------------------------------------------------------
// startBreak
// ---------------------------------------------------------------------------

describe("startBreak", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates canStartBreak — succeeds for active shift without open break", async () => {
    mockedGetShiftById.mockResolvedValue({
      id: "shift_1",
      operator_id: "op_1",
      status: "active",
      clock_in: "2026-01-01T08:00:00Z",
      clock_out: null,
      breaks: [],
    } as any);
    mockedStartBreak.mockResolvedValue({ success: true } as any);

    const result = await startBreak({
      shiftId: "shift_1",
      breakType: "lunch",
      restaurantId: "rest_1",
      operatorId: "op_1",
    });

    expect(result.success).toBe(true);
  });

  it("fails when shift is on_break already", async () => {
    mockedGetShiftById.mockResolvedValue({
      id: "shift_1",
      operator_id: "op_1",
      status: "on_break",
      clock_in: "2026-01-01T08:00:00Z",
      clock_out: null,
      breaks: [{ end: null }],
    } as any);

    const result = await startBreak({
      shiftId: "shift_1",
      breakType: "lunch",
      restaurantId: "rest_1",
      operatorId: "op_1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/must be "active"/i);
  });
});

// ---------------------------------------------------------------------------
// endBreak
// ---------------------------------------------------------------------------

describe("endBreak", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("works correctly — delegates to ShiftClockService", async () => {
    mockedEndBreak.mockResolvedValue({ success: true } as any);

    const result = await endBreak({
      shiftId: "shift_1",
      restaurantId: "rest_1",
      operatorId: "op_1",
    });

    expect(result.success).toBe(true);
    expect(mockedEndBreak).toHaveBeenCalledWith("shift_1");
  });

  it("propagates service errors", async () => {
    mockedEndBreak.mockResolvedValue({
      success: false,
      error: "No active break to end.",
    } as any);

    const result = await endBreak({
      shiftId: "shift_1",
      restaurantId: "rest_1",
      operatorId: "op_1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/no active break/i);
  });
});
