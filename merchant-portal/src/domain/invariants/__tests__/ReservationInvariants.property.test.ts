/**
 * Property Tests for Reservation Invariants
 *
 * Validates reservation domain rules across randomly generated inputs.
 */

import { describe, it, expect } from "vitest";
import {
  canCreateReservation,
  canCancelReservation,
  canMarkNoShow,
} from "../ReservationInvariants";
import type {
  ReservationSnapshot,
  ReservationStatus,
  CreateReservationData,
} from "../ReservationInvariants";
import type { UserRole } from "../../../core/context/ContextTypes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RESERVATION_STATUSES: ReservationStatus[] = [
  "confirmed",
  "seated",
  "completed",
  "cancelled",
  "no_show",
];

const USER_ROLES: UserRole[] = ["waiter", "kitchen", "manager", "owner"];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Generate a date N minutes from now (positive = future, negative = past) */
function dateOffset(minutesFromNow: number): string {
  return new Date(Date.now() + minutesFromNow * 60_000).toISOString();
}

function randomReservation(
  overrides: Partial<ReservationSnapshot> = {},
): ReservationSnapshot {
  return {
    id: `res-${randomInt(1, 99999)}`,
    status: "confirmed",
    dateTime: dateOffset(randomInt(30, 1440)),
    partySize: randomInt(1, 50),
    ...overrides,
  };
}

const ITERATIONS = 200;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ReservationInvariants — property tests", () => {
  describe("canCreateReservation — cannot create reservation in the past", () => {
    it("property: past date/time is always rejected", () => {
      const now = new Date().toISOString();
      for (let i = 0; i < ITERATIONS; i++) {
        const pastMinutes = randomInt(1, 10000);
        const pastDate = dateOffset(-pastMinutes);
        const data: CreateReservationData = {
          dateTime: pastDate,
          partySize: randomInt(1, 50),
          slotAvailable: true,
        };
        const result = canCreateReservation(data, now);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("future");
      }
    });

    it("property: future date with valid party size and available slot is accepted", () => {
      const now = new Date().toISOString();
      for (let i = 0; i < ITERATIONS; i++) {
        const futureMinutes = randomInt(30, 10000);
        const futureDate = dateOffset(futureMinutes);
        const data: CreateReservationData = {
          dateTime: futureDate,
          partySize: randomInt(1, 50),
          slotAvailable: true,
        };
        const result = canCreateReservation(data, now);
        expect(result.allowed).toBe(true);
      }
    });
  });

  describe("canCreateReservation — party size must be positive", () => {
    it("property: zero party size is always rejected", () => {
      const now = new Date().toISOString();
      for (let i = 0; i < ITERATIONS; i++) {
        const data: CreateReservationData = {
          dateTime: dateOffset(randomInt(30, 1440)),
          partySize: 0,
          slotAvailable: true,
        };
        const result = canCreateReservation(data, now);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("Party size");
      }
    });

    it("property: negative party size is always rejected", () => {
      const now = new Date().toISOString();
      for (let i = 0; i < ITERATIONS; i++) {
        const data: CreateReservationData = {
          dateTime: dateOffset(randomInt(30, 1440)),
          partySize: -(randomInt(1, 100)),
          slotAvailable: true,
        };
        const result = canCreateReservation(data, now);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("Party size");
      }
    });

    it("property: party size exceeding max (50) is rejected", () => {
      const now = new Date().toISOString();
      for (let i = 0; i < ITERATIONS; i++) {
        const data: CreateReservationData = {
          dateTime: dateOffset(randomInt(30, 1440)),
          partySize: randomInt(51, 200),
          slotAvailable: true,
        };
        const result = canCreateReservation(data, now);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("Party size");
      }
    });

    it("property: non-integer party size is rejected", () => {
      const now = new Date().toISOString();
      for (let i = 0; i < ITERATIONS; i++) {
        const data: CreateReservationData = {
          dateTime: dateOffset(randomInt(30, 1440)),
          partySize: randomInt(1, 49) + 0.5,
          slotAvailable: true,
        };
        const result = canCreateReservation(data, now);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("whole number");
      }
    });
  });

  describe("canCreateReservation — slot availability", () => {
    it("property: unavailable slot is always rejected", () => {
      const now = new Date().toISOString();
      for (let i = 0; i < ITERATIONS; i++) {
        const data: CreateReservationData = {
          dateTime: dateOffset(randomInt(30, 1440)),
          partySize: randomInt(1, 50),
          slotAvailable: false,
        };
        const result = canCreateReservation(data, now);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("not available");
      }
    });
  });

  describe("canMarkNoShow — only valid for past reservations", () => {
    it("property: no-show before reservation time is always rejected", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const futureDate = dateOffset(randomInt(30, 1440));
        const reservation = randomReservation({
          status: "confirmed",
          dateTime: futureDate,
        });
        const now = new Date().toISOString();
        const result = canMarkNoShow(reservation, now);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("before the reservation time");
      }
    });

    it("property: no-show after reservation time for confirmed reservation is accepted", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const pastDate = dateOffset(-(randomInt(30, 1440)));
        const reservation = randomReservation({
          status: "confirmed",
          dateTime: pastDate,
        });
        const now = new Date().toISOString();
        const result = canMarkNoShow(reservation, now);
        expect(result.allowed).toBe(true);
      }
    });

    it("property: non-confirmed reservations cannot be marked as no-show", () => {
      const nonConfirmed: ReservationStatus[] = [
        "seated",
        "completed",
        "cancelled",
        "no_show",
      ];
      for (let i = 0; i < ITERATIONS; i++) {
        const status = randomChoice(nonConfirmed);
        const pastDate = dateOffset(-(randomInt(30, 1440)));
        const reservation = randomReservation({
          status,
          dateTime: pastDate,
        });
        const now = new Date().toISOString();
        const result = canMarkNoShow(reservation, now);
        expect(result.allowed).toBe(false);
      }
    });
  });

  describe("canCancelReservation", () => {
    it("property: seated reservations cannot be cancelled", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const reservation = randomReservation({ status: "seated" });
        const role = randomChoice(USER_ROLES);
        const result = canCancelReservation(reservation, role);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("seated");
      }
    });

    it("property: already cancelled reservations cannot be cancelled again", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const reservation = randomReservation({ status: "cancelled" });
        const role = randomChoice(USER_ROLES);
        const result = canCancelReservation(reservation, role);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("already cancelled");
      }
    });

    it("property: confirmed reservations can always be cancelled", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const reservation = randomReservation({ status: "confirmed" });
        const role = randomChoice(USER_ROLES);
        const result = canCancelReservation(reservation, role);
        expect(result.allowed).toBe(true);
      }
    });

    it("property: completed reservations cannot be cancelled", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const reservation = randomReservation({ status: "completed" });
        const role = randomChoice(USER_ROLES);
        const result = canCancelReservation(reservation, role);
        expect(result.allowed).toBe(false);
      }
    });

    it("property: no-show reservations cannot be cancelled", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const reservation = randomReservation({ status: "no_show" });
        const role = randomChoice(USER_ROLES);
        const result = canCancelReservation(reservation, role);
        expect(result.allowed).toBe(false);
      }
    });
  });
});
