/**
 * Tests for ui/errors.ts — toUserMessage
 *
 * Covers all branch paths: Core RPC prefixes, TypeError/fetch,
 * ApiError (status codes, HTTP_ prefix), generic objects, fallback.
 */
import { describe, expect, it, vi } from "vitest";

// Mock normalizeOrderError so we don't depend on its internal logic
vi.mock("../core/errors/normalizeOrderError", () => ({
  normalizeOrderError: (err: unknown) => ({
    userMessage: `[normalized] ${
      err instanceof Error ? err.message : String(err)
    }`,
  }),
}));

import { ApiError } from "../api";
import { toUserMessage } from "./errors";

const FALLBACK = "Algo correu mal.";

describe("toUserMessage", () => {
  // ── Core RPC prefix delegation ───────────────────────────────────
  describe("Core RPC prefixes → normalizeOrderError", () => {
    it.each([
      "UNAUTHORIZED: not allowed",
      "ACTOR_REQUIRED: missing actor",
      "INVALID_TRANSITION: pending→ready",
      "INVALID_STATUS: bad status",
      "ORDER_NOT_FOUND: abc123",
      "Invalid status transition from X to Y",
      "TABLE_HAS_ACTIVE_ORDER: table-1",
    ])("delegates '%s' to normalizeOrderError", (msg) => {
      const err = new Error(msg);
      const result = toUserMessage(err, FALLBACK);
      expect(result).toContain("[normalized]");
    });

    it("delegates object with message matching prefix", () => {
      const err = { message: "UNAUTHORIZED: no access" };
      const result = toUserMessage(err, FALLBACK);
      expect(result).toContain("[normalized]");
    });
  });

  // ── TypeError / network ──────────────────────────────────────────
  describe("TypeError (network)", () => {
    it("returns offline message for 'Failed to fetch'", () => {
      const err = new TypeError("Failed to fetch");
      const result = toUserMessage(err, FALLBACK);
      expect(result).toContain("Core Offline");
    });

    it("returns offline message for 'failed to fetch' (lowercase)", () => {
      const err = new TypeError("failed to fetch something");
      const result = toUserMessage(err, FALLBACK);
      expect(result).toContain("Core Offline");
    });

    it("returns fallback for TypeError without fetch message", () => {
      const err = new TypeError("Cannot read properties of null");
      // TypeError without "failed to fetch" — not a Core RPC prefix, so falls through
      // to the generic branch. TypeError is NOT an ApiError, so it goes to the object check.
      const result = toUserMessage(err, FALLBACK);
      // The message "Cannot read properties of null" doesn't match any leading patterns
      expect(result).toBe("Cannot read properties of null");
    });
  });

  // ── ApiError ─────────────────────────────────────────────────────
  describe("ApiError", () => {
    it("returns auth message for status 401", () => {
      const err = new ApiError("unauthorized", 401, {});
      const result = toUserMessage(err, FALLBACK);
      expect(result).toContain("sessão");
    });

    it("returns auth message for status 403", () => {
      const err = new ApiError("forbidden", 403, {});
      const result = toUserMessage(err, FALLBACK);
      expect(result).toContain("sessão");
    });

    it("returns temporary error message for HTTP_ prefix", () => {
      const err = new ApiError("HTTP_500", 500, {});
      const result = toUserMessage(err, FALLBACK);
      expect(result).toContain("erro temporário");
    });

    it("returns message for other ApiError", () => {
      const err = new ApiError("Pagamento recusado", 400, {});
      const result = toUserMessage(err, FALLBACK);
      expect(result).toBe("Pagamento recusado");
    });

    it("returns fallback when ApiError has empty message", () => {
      const err = new ApiError("", 500, {});
      const result = toUserMessage(err, FALLBACK);
      expect(result).toBe(FALLBACK);
    });
  });

  // ── Generic objects with .message ────────────────────────────────
  describe("generic object with message", () => {
    it("returns offline message for 'failed to fetch'", () => {
      const err = { message: "failed to fetch data" };
      const result = toUserMessage(err, FALLBACK);
      expect(result).toContain("Core Offline");
    });

    it("returns fallback for 'failed to read' prefix", () => {
      const err = { message: "Failed to read menu categories" };
      const result = toUserMessage(err, FALLBACK);
      expect(result).toBe(FALLBACK);
    });

    it("returns fallback for 'failed to ' prefix", () => {
      const err = { message: "Failed to write order" };
      const result = toUserMessage(err, FALLBACK);
      expect(result).toBe(FALLBACK);
    });

    it("returns fallback for pgrst errors", () => {
      const err = { message: "PGRST301: JWT expired" };
      const result = toUserMessage(err, FALLBACK);
      expect(result).toBe(FALLBACK);
    });

    it("returns fallback for status+response pattern", () => {
      const err = { message: "status 502 response timeout" };
      const result = toUserMessage(err, FALLBACK);
      expect(result).toBe(FALLBACK);
    });

    it("returns raw message if non-empty and no pattern match", () => {
      const err = { message: "Sem permissão" };
      const result = toUserMessage(err, FALLBACK);
      expect(result).toBe("Sem permissão");
    });

    it("returns fallback for empty message", () => {
      const err = { message: "" };
      const result = toUserMessage(err, FALLBACK);
      expect(result).toBe(FALLBACK);
    });
  });

  // ── Fallback ─────────────────────────────────────────────────────
  describe("fallback", () => {
    it("returns fallback for null", () => {
      expect(toUserMessage(null, FALLBACK)).toBe(FALLBACK);
    });

    it("returns fallback for undefined", () => {
      expect(toUserMessage(undefined, FALLBACK)).toBe(FALLBACK);
    });

    it("returns fallback for number", () => {
      expect(toUserMessage(42, FALLBACK)).toBe(FALLBACK);
    });

    it("returns fallback for string (non-error)", () => {
      // A plain string doesn't have a .message — should fallback
      expect(toUserMessage("boom", FALLBACK)).toBe(FALLBACK);
    });
  });
});
