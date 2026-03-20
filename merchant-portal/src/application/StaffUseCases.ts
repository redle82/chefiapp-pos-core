/**
 * Staff Use Cases
 *
 * Application Layer facade for staff/shift-related operations.
 * Orchestrates: domain invariants -> ShiftClockService -> domain events -> metrics.
 *
 * NO React imports. Pure TypeScript orchestration.
 *
 * Bounded Context: Staff & Attendance
 */

import {
  canClockIn,
  canClockOut,
  canStartBreak,
  type ShiftSnapshot,
} from "../domain/invariants/StaffInvariants";
import {
  ShiftClockService,
  type ClockInMethod,
  type BreakType,
} from "../core/shift/ShiftService";
import { emitDomainEvent } from "../domain/events/DomainEvents";
import { track } from "../analytics/track";
import { Logger } from "../core/logger";

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ---------------------------------------------------------------------------
// Param types
// ---------------------------------------------------------------------------

export interface ClockInParams {
  operatorId: string;
  operatorName: string;
  restaurantId: string;
  method?: ClockInMethod;
}

export interface ClockOutParams {
  operatorId: string;
  shiftId: string;
  restaurantId: string;
}

export interface StartBreakParams {
  shiftId: string;
  breakType: BreakType;
  restaurantId: string;
  operatorId: string;
}

export interface EndBreakParams {
  shiftId: string;
  restaurantId: string;
  operatorId: string;
}

// ---------------------------------------------------------------------------
// Use Cases
// ---------------------------------------------------------------------------

/**
 * Clock in an operator.
 *
 * 1. Fetch any active shift to validate canClockIn invariant.
 * 2. Create shift via ShiftClockService.
 * 3. Emit SHIFT_STARTED domain event.
 * 4. Track metrics.
 */
export async function clockIn(
  params: ClockInParams,
): Promise<Result<{ shiftId: string }>> {
  try {
    // 1. Check for existing active shift (invariant check happens inside service,
    //    but we also do an app-layer check for fail-fast with better messaging)
    const activeShift = await ShiftClockService.getActiveShift(
      params.operatorId,
      params.restaurantId,
    );

    const snapshot: ShiftSnapshot | null = activeShift
      ? {
          id: activeShift.id,
          operator_id: activeShift.operator_id,
          status: activeShift.status,
          clock_in: activeShift.clock_in,
          clock_out: activeShift.clock_out,
          breaks: activeShift.breaks.map((b) => ({ end: b.end })),
        }
      : null;

    const check = canClockIn(params.operatorId, snapshot);
    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    // 2. Execute
    const result = await ShiftClockService.clockIn(
      params.operatorId,
      params.operatorName,
      params.restaurantId,
      params.method ?? "manual",
    );

    if (!result.success || !result.shiftId) {
      return {
        success: false,
        error: result.error ?? "Failed to clock in.",
      };
    }

    // 3. Emit domain event
    emitDomainEvent(
      {
        type: "SHIFT_STARTED",
        operatorId: params.operatorId,
        shiftId: result.shiftId,
      },
      params.restaurantId,
      params.operatorId,
    );

    // 4. Metrics
    track("staff.clock_in", {
      operatorId: params.operatorId,
      restaurantId: params.restaurantId,
      method: params.method ?? "manual",
    });

    return { success: true, data: { shiftId: result.shiftId } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error during clock-in";
    Logger.error("[StaffUseCases.clockIn]", { error: message });
    return { success: false, error: message };
  }
}

/**
 * Clock out an operator.
 *
 * 1. Fetch shift and validate canClockOut invariant.
 * 2. End shift via ShiftClockService.
 * 3. Emit SHIFT_ENDED domain event with total minutes.
 * 4. Track metrics.
 */
export async function clockOut(
  params: ClockOutParams,
): Promise<Result<{ totalMinutes: number }>> {
  try {
    // 1. Fetch shift for invariant check
    const shift = await ShiftClockService.getShiftById(params.shiftId);
    if (!shift) {
      return { success: false, error: "Shift not found." };
    }

    const snapshot: ShiftSnapshot = {
      id: shift.id,
      operator_id: shift.operator_id,
      status: shift.status,
      clock_in: shift.clock_in,
      clock_out: shift.clock_out,
      breaks: shift.breaks.map((b) => ({ end: b.end })),
    };

    const check = canClockOut(snapshot);
    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    // 2. Execute
    const result = await ShiftClockService.clockOut(
      params.operatorId,
      params.shiftId,
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error ?? "Failed to clock out.",
      };
    }

    const totalMinutes = result.totalMinutes ?? 0;

    // 3. Emit domain event
    emitDomainEvent(
      {
        type: "SHIFT_ENDED",
        operatorId: params.operatorId,
        totalMinutes,
      },
      params.restaurantId,
      params.operatorId,
    );

    // 4. Metrics
    track("staff.clock_out", {
      operatorId: params.operatorId,
      shiftId: params.shiftId,
      totalMinutes,
    });

    return { success: true, data: { totalMinutes } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error during clock-out";
    Logger.error("[StaffUseCases.clockOut]", { error: message });
    return { success: false, error: message };
  }
}

/**
 * Start a break for an operator currently on shift.
 *
 * 1. Fetch shift and validate canStartBreak invariant.
 * 2. Start break via ShiftClockService.
 * 3. Track metrics.
 */
export async function startBreak(
  params: StartBreakParams,
): Promise<Result<null>> {
  try {
    // 1. Fetch shift for invariant check
    const shift = await ShiftClockService.getShiftById(params.shiftId);
    if (!shift) {
      return { success: false, error: "Shift not found." };
    }

    const snapshot: ShiftSnapshot = {
      id: shift.id,
      operator_id: shift.operator_id,
      status: shift.status,
      clock_in: shift.clock_in,
      clock_out: shift.clock_out,
      breaks: shift.breaks.map((b) => ({ end: b.end })),
    };

    const check = canStartBreak(snapshot);
    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    // 2. Execute
    const result = await ShiftClockService.startBreak(
      params.shiftId,
      params.breakType,
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error ?? "Failed to start break.",
      };
    }

    // 3. Metrics
    track("staff.break_started", {
      shiftId: params.shiftId,
      breakType: params.breakType,
      operatorId: params.operatorId,
    });

    return { success: true, data: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error starting break";
    Logger.error("[StaffUseCases.startBreak]", { error: message });
    return { success: false, error: message };
  }
}

/**
 * End the current break for an operator.
 *
 * 1. End break via ShiftClockService (service handles validation).
 * 2. Track metrics.
 */
export async function endBreak(
  params: EndBreakParams,
): Promise<Result<null>> {
  try {
    const result = await ShiftClockService.endBreak(params.shiftId);

    if (!result.success) {
      return {
        success: false,
        error: result.error ?? "Failed to end break.",
      };
    }

    // Metrics
    track("staff.break_ended", {
      shiftId: params.shiftId,
      operatorId: params.operatorId,
    });

    return { success: true, data: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error ending break";
    Logger.error("[StaffUseCases.endBreak]", { error: message });
    return { success: false, error: message };
  }
}
