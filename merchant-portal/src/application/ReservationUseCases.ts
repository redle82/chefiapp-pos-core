/**
 * Reservation Use Cases
 *
 * Application Layer facade for reservation-related operations.
 * Orchestrates: domain invariants -> ReservationEngine -> domain events -> metrics.
 *
 * NO React imports. Pure TypeScript orchestration.
 *
 * Bounded Context: Reservations & Table Management
 */

import {
  canCreateReservation,
  canCancelReservation,
  canMarkNoShow,
  type ReservationSnapshot,
  type CreateReservationData,
} from "../domain/invariants/ReservationInvariants";
import type { UserRole } from "../core/context/ContextTypes";
import {
  ReservationEngine,
  type ReservationSource,
} from "../core/reservations/ReservationEngine";
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

export interface CreateReservationParams {
  restaurantId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerNotes?: string;
  /** ISO date-time string */
  dateTime: string;
  partySize: number;
  source?: ReservationSource;
  tableId?: string;
  /** Whether the requested time slot has been pre-checked and is available. */
  slotAvailable: boolean;
  operatorId?: string;
}

export interface CancelReservationParams {
  reservationId: string;
  reservation: ReservationSnapshot;
  role: UserRole;
  reason?: string;
  restaurantId: string;
  operatorId?: string;
}

export interface MarkNoShowParams {
  reservationId: string;
  reservation: ReservationSnapshot;
  restaurantId: string;
  operatorId?: string;
}

export interface AddToWaitlistParams {
  restaurantId: string;
  customerName: string;
  customerPhone?: string;
  partySize: number;
  operatorId?: string;
}

// ---------------------------------------------------------------------------
// Engine singleton
// ---------------------------------------------------------------------------

const reservationEngine = new ReservationEngine();

// ---------------------------------------------------------------------------
// Use Cases
// ---------------------------------------------------------------------------

/**
 * Create a new reservation.
 *
 * 1. Validate canCreateReservation invariant.
 * 2. Create reservation via ReservationEngine.
 * 3. Emit RESERVATION_CREATED domain event.
 * 4. Track metrics.
 *
 * Note: Sending confirmation email is the responsibility of a domain event
 * subscriber (EmailService listens for RESERVATION_CREATED) to keep this
 * use case focused on the core write path.
 */
export async function createReservation(
  params: CreateReservationParams,
): Promise<Result<{ reservationId: string }>> {
  // 1. Validate
  const data: CreateReservationData = {
    dateTime: params.dateTime,
    partySize: params.partySize,
    slotAvailable: params.slotAvailable,
  };

  const check = canCreateReservation(data);
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  // 2. Execute
  try {
    const reservationDate = new Date(params.dateTime);
    const reservationTime = reservationDate.toTimeString().slice(0, 5); // "HH:MM"

    const reservationId = await reservationEngine.create({
      restaurantId: params.restaurantId,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      customerEmail: params.customerEmail,
      customerNotes: params.customerNotes,
      reservationDate,
      reservationTime,
      partySize: params.partySize,
      source: params.source ?? "internal",
      tableId: params.tableId,
    });

    // 3. Emit domain event
    emitDomainEvent(
      { type: "RESERVATION_CREATED", reservationId },
      params.restaurantId,
      params.operatorId,
    );

    // 4. Metrics
    track("reservation.created", {
      reservationId,
      restaurantId: params.restaurantId,
      partySize: params.partySize,
      source: params.source ?? "internal",
    });

    return { success: true, data: { reservationId } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error creating reservation";
    Logger.error("[ReservationUseCases.createReservation]", { error: message });
    return { success: false, error: message };
  }
}

/**
 * Cancel a reservation.
 *
 * 1. Validate canCancelReservation invariant.
 * 2. Update reservation status to "cancelled" via ReservationEngine.
 * 3. Track metrics.
 */
export async function cancelReservation(
  params: CancelReservationParams,
): Promise<Result<null>> {
  // 1. Validate
  const check = canCancelReservation(params.reservation, params.role);
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  // 2. Execute
  try {
    await reservationEngine.updateStatus(
      params.reservationId,
      "cancelled",
      params.reason,
    );

    // 3. Metrics
    track("reservation.cancelled", {
      reservationId: params.reservationId,
      restaurantId: params.restaurantId,
      reason: params.reason,
    });

    return { success: true, data: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error cancelling reservation";
    Logger.error("[ReservationUseCases.cancelReservation]", { error: message });
    return { success: false, error: message };
  }
}

/**
 * Mark a reservation as no-show.
 *
 * 1. Validate canMarkNoShow invariant.
 * 2. Update reservation status to "no_show" via ReservationEngine.
 * 3. Track metrics.
 */
export async function markNoShow(
  params: MarkNoShowParams,
): Promise<Result<null>> {
  // 1. Validate
  const check = canMarkNoShow(params.reservation);
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  // 2. Execute
  try {
    await reservationEngine.updateStatus(
      params.reservationId,
      "no_show",
    );

    // 3. Metrics
    track("reservation.no_show", {
      reservationId: params.reservationId,
      restaurantId: params.restaurantId,
    });

    return { success: true, data: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error marking no-show";
    Logger.error("[ReservationUseCases.markNoShow]", { error: message });
    return { success: false, error: message };
  }
}

/**
 * Add a walk-in to the waitlist.
 *
 * Creates a reservation with source "walk_in" and a date/time set to now.
 * The slot is always available for walk-ins (they are physically present).
 */
export async function addToWaitlist(
  params: AddToWaitlistParams,
): Promise<Result<{ reservationId: string }>> {
  try {
    const now = new Date();
    const reservationTime = now.toTimeString().slice(0, 5); // "HH:MM"

    const reservationId = await reservationEngine.create({
      restaurantId: params.restaurantId,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      reservationDate: now,
      reservationTime,
      partySize: params.partySize,
      source: "walk_in",
    });

    // Metrics
    track("reservation.waitlist_added", {
      reservationId,
      restaurantId: params.restaurantId,
      partySize: params.partySize,
    });

    return { success: true, data: { reservationId } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error adding to waitlist";
    Logger.error("[ReservationUseCases.addToWaitlist]", { error: message });
    return { success: false, error: message };
  }
}
