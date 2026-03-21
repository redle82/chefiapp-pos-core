/**
 * normalizeOrderError — unit tests
 *
 * Validates that the same Core RPC error prefixes used by the gateway's
 * HTTP semantic mapping are also correctly parsed on the frontend,
 * producing the right error codes and user-facing PT messages.
 */
import { normalizeOrderError } from "./normalizeOrderError";

describe("normalizeOrderError", () => {
  // ── UNAUTHORIZED ──────────────────────────────────────────────────
  it("maps UNAUTHORIZED prefix to forbidden with contact_manager action", () => {
    const err = {
      message:
        "UNAUTHORIZED: actor lacks required role for order status transitions",
      code: "P0001",
    };
    const result = normalizeOrderError(err);
    expect(result.code).toBe("forbidden");
    expect(result.userMessage).toContain("permissão");
    expect(result.userMessage).toContain("gerente");
    expect(result.retryable).toBe(false);
    expect(result.action).toBe("contact_manager");
    expect(result.originalMessage).toContain("UNAUTHORIZED:");
  });

  // ── ACTOR_REQUIRED ────────────────────────────────────────────────
  it("maps ACTOR_REQUIRED prefix to actor_required with reauth action", () => {
    const err = new Error("ACTOR_REQUIRED: p_actor_user_id is null or empty");
    const result = normalizeOrderError(err);
    expect(result.code).toBe("actor_required");
    expect(result.userMessage).toContain("login");
    expect(result.retryable).toBe(false);
    expect(result.action).toBe("reauth");
  });

  it("maps actor_user_id validation message to actor_required", () => {
    const err = {
      message:
        "actor_user_id is required for updateOrderStatus (ACTOR_REQUIRED)",
    };
    const result = normalizeOrderError(err);
    expect(result.code).toBe("actor_required");
    expect(result.action).toBe("reauth");
  });

  // ── INVALID_TRANSITION ────────────────────────────────────────────
  it("maps INVALID_TRANSITION prefix to invalid_transition with reload", () => {
    const err = new Error(
      "INVALID_TRANSITION: OPEN can only go to PREPARING, IN_PREP, or CANCELLED. Got: CLOSED",
    );
    const result = normalizeOrderError(err);
    expect(result.code).toBe("invalid_transition");
    expect(result.userMessage).toContain("dispositivo");
    expect(result.retryable).toBe(true);
    expect(result.action).toBe("reload");
  });

  it("maps 'Invalid status transition' variant to invalid_transition", () => {
    const err = new Error("Invalid status transition from OPEN to CLOSED");
    const result = normalizeOrderError(err);
    expect(result.code).toBe("invalid_transition");
    expect(result.action).toBe("reload");
  });

  // ── INVALID_STATUS ────────────────────────────────────────────────
  it("maps INVALID_STATUS prefix to invalid_status with reload", () => {
    const err = {
      message: "INVALID_STATUS: FOOBAR is not a valid order status",
    };
    const result = normalizeOrderError(err);
    expect(result.code).toBe("invalid_status");
    expect(result.userMessage).toContain("inválido");
    expect(result.retryable).toBe(true);
    expect(result.action).toBe("reload");
  });

  // ── ORDER_NOT_FOUND ───────────────────────────────────────────────
  it("maps ORDER_NOT_FOUND prefix to not_found", () => {
    const err = {
      message:
        "ORDER_NOT_FOUND: Pedido não encontrado ou não pertence ao restaurante",
    };
    const result = normalizeOrderError(err);
    expect(result.code).toBe("not_found");
    expect(result.userMessage).toContain("não encontrado");
    expect(result.retryable).toBe(false);
  });

  // ── TABLE_HAS_ACTIVE_ORDER ────────────────────────────────────────
  it("maps TABLE_HAS_ACTIVE_ORDER to conflict", () => {
    const err = new Error(
      "TABLE_HAS_ACTIVE_ORDER: Mesa 5 já tem pedido aberto",
    );
    const result = normalizeOrderError(err);
    expect(result.code).toBe("conflict");
    expect(result.userMessage).toContain("pedido aberto");
    expect(result.retryable).toBe(false);
  });

  // ── Network errors ────────────────────────────────────────────────
  it("maps fetch failures to network", () => {
    const err = new TypeError("Failed to fetch");
    const result = normalizeOrderError(err);
    expect(result.code).toBe("network");
    expect(result.userMessage).toContain("rede");
    expect(result.retryable).toBe(true);
  });

  it("maps BACKEND_UNAVAILABLE to network", () => {
    const err = {
      message: "Backend indisponível",
      code: "BACKEND_UNAVAILABLE",
    };
    const result = normalizeOrderError(err);
    expect(result.code).toBe("network");
    expect(result.retryable).toBe(true);
  });

  // ── Gateway structured error body ─────────────────────────────────
  it("maps gateway { error: 'forbidden', message: ... } to forbidden", () => {
    const body = {
      error: "forbidden",
      message: "UNAUTHORIZED: actor lacks required role",
      details: { orderId: "ord_1" },
    };
    // Message prefix takes priority over gateway code
    const result = normalizeOrderError(body);
    expect(result.code).toBe("forbidden");
  });

  it("maps gateway { error: 'invalid_transition' } without prefix to invalid_transition", () => {
    const body = {
      error: "invalid_transition",
      message: "Some future Core message without prefix",
    };
    const result = normalizeOrderError(body);
    expect(result.code).toBe("invalid_transition");
    expect(result.action).toBe("reload");
  });

  it("maps gateway { error: 'upstream_error' } to network", () => {
    const body = {
      error: "upstream_error",
      message: "Core 502",
    };
    const result = normalizeOrderError(body);
    expect(result.code).toBe("network");
    expect(result.retryable).toBe(true);
  });

  // ── Fallback ──────────────────────────────────────────────────────
  it("maps unknown errors to unknown with retryable true", () => {
    const err = new Error("Something completely unexpected");
    const result = normalizeOrderError(err);
    expect(result.code).toBe("unknown");
    expect(result.retryable).toBe(true);
    expect(result.originalMessage).toBe("Something completely unexpected");
  });

  it("handles plain string errors", () => {
    const result = normalizeOrderError("UNAUTHORIZED: denied");
    expect(result.code).toBe("forbidden");
  });

  it("handles null/undefined gracefully", () => {
    const result = normalizeOrderError(null);
    expect(result.code).toBe("unknown");
    expect(result.retryable).toBe(true);
  });
});
