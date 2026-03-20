/**
 * Contract Tests — ReservationUseCases
 *
 * Validates the application layer's orchestration of domain invariants,
 * ReservationEngine calls, domain events, and metrics for reservation operations.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockReservation, ROLES } from "./helpers";

// ---------------------------------------------------------------------------
// Mock all external dependencies
// ---------------------------------------------------------------------------

const { mockCreate, mockUpdateStatus } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockUpdateStatus: vi.fn(),
}));

vi.mock("../../core/reservations/ReservationEngine", () => ({
  ReservationEngine: class {
    create = mockCreate;
    updateStatus = mockUpdateStatus;
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
import {
  createReservation,
  cancelReservation,
  markNoShow,
  addToWaitlist,
} from "../ReservationUseCases";

// ---------------------------------------------------------------------------
// createReservation
// ---------------------------------------------------------------------------

describe("createReservation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates canCreateReservation — succeeds for future date with valid data", async () => {
    mockCreate.mockResolvedValue("res_new");

    const futureDate = new Date(Date.now() + 86400000).toISOString(); // tomorrow
    const result = await createReservation({
      restaurantId: "rest_1",
      customerName: "Maria Silva",
      dateTime: futureDate,
      partySize: 4,
      slotAvailable: true,
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ reservationId: "res_new" });
    expect(mockCreate).toHaveBeenCalled();
  });

  it("fails for past date", async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString(); // yesterday
    const result = await createReservation({
      restaurantId: "rest_1",
      customerName: "Maria Silva",
      dateTime: pastDate,
      partySize: 4,
      slotAvailable: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/future/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("fails when slot is not available", async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const result = await createReservation({
      restaurantId: "rest_1",
      customerName: "Maria Silva",
      dateTime: futureDate,
      partySize: 4,
      slotAvailable: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not available/i);
  });

  it("fails with party size of zero", async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const result = await createReservation({
      restaurantId: "rest_1",
      customerName: "Maria Silva",
      dateTime: futureDate,
      partySize: 0,
      slotAvailable: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/party size/i);
  });
});

// ---------------------------------------------------------------------------
// cancelReservation
// ---------------------------------------------------------------------------

describe("cancelReservation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates canCancelReservation — succeeds for confirmed reservation", async () => {
    mockUpdateStatus.mockResolvedValue(undefined);

    const reservation = createMockReservation({ status: "confirmed" });
    const result = await cancelReservation({
      reservationId: "res_1",
      reservation,
      role: ROLES.manager,
      reason: "Customer called",
      restaurantId: "rest_1",
    });

    expect(result.success).toBe(true);
    expect(mockUpdateStatus).toHaveBeenCalledWith("res_1", "cancelled", "Customer called");
  });

  it("fails for already cancelled reservation", async () => {
    const reservation = createMockReservation({ status: "cancelled" });
    const result = await cancelReservation({
      reservationId: "res_1",
      reservation,
      role: ROLES.manager,
      restaurantId: "rest_1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already cancelled/i);
  });

  it("fails for seated reservation", async () => {
    const reservation = createMockReservation({ status: "seated" });
    const result = await cancelReservation({
      reservationId: "res_1",
      reservation,
      role: ROLES.manager,
      restaurantId: "rest_1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/seated/i);
  });
});

// ---------------------------------------------------------------------------
// markNoShow
// ---------------------------------------------------------------------------

describe("markNoShow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates canMarkNoShow — succeeds for confirmed reservation past its time", async () => {
    mockUpdateStatus.mockResolvedValue(undefined);

    const pastDateTime = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    const reservation = createMockReservation({
      status: "confirmed",
      dateTime: pastDateTime,
    });

    const result = await markNoShow({
      reservationId: "res_1",
      reservation,
      restaurantId: "rest_1",
    });

    expect(result.success).toBe(true);
    expect(mockUpdateStatus).toHaveBeenCalledWith("res_1", "no_show");
  });

  it("fails for non-confirmed reservation (e.g. cancelled)", async () => {
    const reservation = createMockReservation({ status: "cancelled" });
    const result = await markNoShow({
      reservationId: "res_1",
      reservation,
      restaurantId: "rest_1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/confirmed/i);
  });

  it("fails when reservation time has not passed yet", async () => {
    const futureDateTime = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
    const reservation = createMockReservation({
      status: "confirmed",
      dateTime: futureDateTime,
    });

    const result = await markNoShow({
      reservationId: "res_1",
      reservation,
      restaurantId: "rest_1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/before the reservation time/i);
  });
});

// ---------------------------------------------------------------------------
// addToWaitlist
// ---------------------------------------------------------------------------

describe("addToWaitlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates walk-in entry successfully", async () => {
    mockCreate.mockResolvedValue("res_walkin");

    const result = await addToWaitlist({
      restaurantId: "rest_1",
      customerName: "Walk-in Guest",
      partySize: 2,
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ reservationId: "res_walkin" });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        restaurantId: "rest_1",
        customerName: "Walk-in Guest",
        partySize: 2,
        source: "walk_in",
      }),
    );
  });

  it("propagates engine errors", async () => {
    mockCreate.mockRejectedValue(new Error("Database unavailable"));

    const result = await addToWaitlist({
      restaurantId: "rest_1",
      customerName: "Walk-in Guest",
      partySize: 2,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/database unavailable/i);
  });
});
