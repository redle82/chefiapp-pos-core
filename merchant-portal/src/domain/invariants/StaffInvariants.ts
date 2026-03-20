/**
 * Staff / Shift Invariants
 *
 * Pure business rules for clock-in/out, breaks, and shift editing.
 * No side effects, no DB calls, no React dependencies.
 *
 * Bounded Context: Staff & Attendance
 * - Guards for shift lifecycle operations.
 */

import type { UserRole } from "../../core/context/ContextTypes";
import type { InvariantResult } from "./OrderInvariants";

// ---------------------------------------------------------------------------
// Lightweight types consumed by invariants
// (Mirrors ShiftLog from ShiftService without coupling to it)
// ---------------------------------------------------------------------------

export interface ShiftSnapshot {
  id: string;
  operator_id: string;
  status: "active" | "on_break" | "completed" | "auto_closed";
  clock_in: string;
  clock_out: string | null;
  breaks: ReadonlyArray<{ end: string | null }>;
}

// ---------------------------------------------------------------------------
// Elevated roles
// ---------------------------------------------------------------------------

const ELEVATED_ROLES: ReadonlySet<UserRole> = new Set<UserRole>([
  "manager",
  "owner",
]);

// ---------------------------------------------------------------------------
// Invariants
// ---------------------------------------------------------------------------

/**
 * An operator can clock in only if they do not already have an active shift.
 *
 * @param activeShift - The operator's current active shift, or null/undefined.
 */
export function canClockIn(
  _operatorId: string,
  activeShift: ShiftSnapshot | null | undefined,
): InvariantResult {
  if (activeShift) {
    return {
      allowed: false,
      reason: "Operator already has an active shift — cannot double clock-in.",
    };
  }

  return { allowed: true };
}

/**
 * Clock-out requires that any active break be ended first.
 * The shift must be in an "active" or "on_break" status.
 */
export function canClockOut(shift: ShiftSnapshot): InvariantResult {
  if (shift.status === "completed" || shift.status === "auto_closed") {
    return { allowed: false, reason: "Shift is already ended." };
  }

  const hasActiveBreak = shift.breaks.some((b) => b.end === null);
  if (hasActiveBreak) {
    return {
      allowed: false,
      reason: "Active break must be ended before clocking out.",
    };
  }

  return { allowed: true };
}

/**
 * A break can only be started if the operator is currently clocked in
 * (status "active") and does not already have an open break.
 */
export function canStartBreak(shift: ShiftSnapshot): InvariantResult {
  if (shift.status !== "active") {
    return {
      allowed: false,
      reason: `Shift status is "${shift.status}" — must be "active" to start a break.`,
    };
  }

  const hasActiveBreak = shift.breaks.some((b) => b.end === null);
  if (hasActiveBreak) {
    return { allowed: false, reason: "Operator is already on a break." };
  }

  return { allowed: true };
}

/**
 * Only managers and owners can manually edit shift records
 * (e.g., correcting clock-in/out times).
 */
export function canEditShift(role: UserRole): InvariantResult {
  if (!ELEVATED_ROLES.has(role)) {
    return {
      allowed: false,
      reason: "Only managers or owners can edit shift records.",
    };
  }

  return { allowed: true };
}
