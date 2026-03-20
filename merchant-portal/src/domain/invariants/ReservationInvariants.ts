/**
 * Reservation Invariants
 *
 * Pure business rules for reservation lifecycle.
 * No side effects, no DB calls, no React dependencies.
 *
 * Bounded Context: Reservations & Table Management
 */

import type { UserRole } from "../../core/context/ContextTypes";
import type { InvariantResult } from "./OrderInvariants";

// ---------------------------------------------------------------------------
// Lightweight types consumed by invariants
// ---------------------------------------------------------------------------

export type ReservationStatus =
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled"
  | "no_show";

export interface ReservationSnapshot {
  id: string;
  status: ReservationStatus;
  /** ISO date-time of the reservation */
  dateTime: string;
  partySize: number;
}

export interface CreateReservationData {
  /** ISO date-time of the reservation */
  dateTime: string;
  /** Number of guests */
  partySize: number;
  /** Whether the requested slot is available (pre-checked by caller) */
  slotAvailable: boolean;
}

// ---------------------------------------------------------------------------
// Constraints
// ---------------------------------------------------------------------------

const MIN_PARTY_SIZE = 1;
const MAX_PARTY_SIZE = 50;

// ---------------------------------------------------------------------------
// Invariants
// ---------------------------------------------------------------------------

/**
 * A reservation can be created when:
 *  - The date/time is in the future.
 *  - The party size is within the allowed range.
 *  - The requested time slot is available.
 */
export function canCreateReservation(
  data: CreateReservationData,
  now: string = new Date().toISOString(),
): InvariantResult {
  const reservationTime = new Date(data.dateTime).getTime();
  const currentTime = new Date(now).getTime();

  if (reservationTime <= currentTime) {
    return {
      allowed: false,
      reason: "Reservation date/time must be in the future.",
    };
  }

  if (data.partySize < MIN_PARTY_SIZE || data.partySize > MAX_PARTY_SIZE) {
    return {
      allowed: false,
      reason: `Party size must be between ${MIN_PARTY_SIZE} and ${MAX_PARTY_SIZE}.`,
    };
  }

  if (!Number.isInteger(data.partySize)) {
    return {
      allowed: false,
      reason: "Party size must be a whole number.",
    };
  }

  if (!data.slotAvailable) {
    return {
      allowed: false,
      reason: "The requested time slot is not available.",
    };
  }

  return { allowed: true };
}

/**
 * A reservation can be cancelled when:
 *  - The guest has not already been seated.
 *  - The reservation is not already cancelled or marked as no-show.
 */
export function canCancelReservation(
  reservation: ReservationSnapshot,
  _role: UserRole,
): InvariantResult {
  if (reservation.status === "seated") {
    return {
      allowed: false,
      reason: "Cannot cancel a reservation after the guest has been seated.",
    };
  }

  if (reservation.status === "cancelled") {
    return { allowed: false, reason: "Reservation is already cancelled." };
  }

  if (reservation.status === "no_show") {
    return {
      allowed: false,
      reason: "Cannot cancel a reservation already marked as no-show.",
    };
  }

  if (reservation.status === "completed") {
    return {
      allowed: false,
      reason: "Cannot cancel a completed reservation.",
    };
  }

  return { allowed: true };
}

/**
 * A reservation can be marked as no-show when:
 *  - The reservation time has passed.
 *  - The guest was never seated.
 *  - The reservation is still in "confirmed" status.
 */
export function canMarkNoShow(
  reservation: ReservationSnapshot,
  now: string = new Date().toISOString(),
): InvariantResult {
  if (reservation.status !== "confirmed") {
    return {
      allowed: false,
      reason: `Reservation status is "${reservation.status}" — only confirmed reservations can be marked as no-show.`,
    };
  }

  const reservationTime = new Date(reservation.dateTime).getTime();
  const currentTime = new Date(now).getTime();

  if (currentTime <= reservationTime) {
    return {
      allowed: false,
      reason: "Cannot mark as no-show before the reservation time has passed.",
    };
  }

  return { allowed: true };
}
