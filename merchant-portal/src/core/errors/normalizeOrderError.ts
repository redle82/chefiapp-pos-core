/**
 * normalizeOrderError — Semantic Order Error Parser
 *
 * Parses Core RPC error messages (same prefixes used by the gateway's HTTP
 * semantic mapping) into structured objects with user-facing messages in PT.
 *
 * Error sources:
 * - Postgres RPC: update_order_status, create_order_atomic
 * - DB triggers: validate_status_transition
 * - Gateway HTTP: PATCH /api/v1/orders/:id, POST /api/v1/orders
 *
 * Prefix → code mapping mirrors server/integration-gateway.ts exactly.
 */

export type OrderErrorCode =
  | "forbidden"
  | "actor_required"
  | "invalid_transition"
  | "invalid_status"
  | "not_found"
  | "conflict"
  | "network"
  | "unknown";

export interface NormalizedOrderError {
  /** Machine-readable error code (same as gateway error field). */
  code: OrderErrorCode;
  /** User-facing message in PT, ready for toast/banner. */
  userMessage: string;
  /** Raw error message from Core/gateway. */
  originalMessage: string;
  /** Can the user retry this action? */
  retryable: boolean;
  /** Suggested UX action the caller can use to react. */
  action?: "reload" | "reauth" | "contact_manager";
}

/**
 * Parse a Core RPC error (or gateway HTTP body) into a structured, actionable
 * error object. Accepts multiple shapes:
 * - `{ message: string; code?: string }` (CoreOrdersApi / dockerCoreFetchClient)
 * - `{ error: string; message: string }` (gateway JSON response)
 * - `Error` instance
 * - plain string
 */
export function normalizeOrderError(error: unknown): NormalizedOrderError {
  const msg = extractMessage(error);

  // ── Core RPC prefix: UNAUTHORIZED ─────────────────────────────────
  if (msg.startsWith("UNAUTHORIZED:")) {
    return {
      code: "forbidden",
      userMessage: "Sem permissão para esta ação. Contacte o gerente.",
      originalMessage: msg,
      retryable: false,
      action: "contact_manager",
    };
  }

  // ── Core RPC prefix: ACTOR_REQUIRED ───────────────────────────────
  if (
    msg.startsWith("ACTOR_REQUIRED:") ||
    msg.includes("actor_user_id is required")
  ) {
    return {
      code: "actor_required",
      userMessage: "Sessão inválida. Faça login novamente.",
      originalMessage: msg,
      retryable: false,
      action: "reauth",
    };
  }

  // ── Core RPC prefix: INVALID_STATUS ───────────────────────────────
  if (msg.startsWith("INVALID_STATUS:")) {
    return {
      code: "invalid_status",
      userMessage: "Estado do pedido inválido. Atualize a página.",
      originalMessage: msg,
      retryable: true,
      action: "reload",
    };
  }

  // ── Core RPC / trigger: INVALID_TRANSITION / Invalid status transition ──
  if (
    msg.startsWith("INVALID_TRANSITION:") ||
    msg.includes("Invalid status transition")
  ) {
    return {
      code: "invalid_transition",
      userMessage: "Pedido foi atualizado noutro dispositivo. A recarregar...",
      originalMessage: msg,
      retryable: true,
      action: "reload",
    };
  }

  // ── Core RPC prefix: ORDER_NOT_FOUND ──────────────────────────────
  if (msg.startsWith("ORDER_NOT_FOUND:")) {
    return {
      code: "not_found",
      userMessage:
        "Pedido não encontrado. Pode ter sido cancelado ou finalizado.",
      originalMessage: msg,
      retryable: false,
    };
  }

  // ── Core RPC / constraint: TABLE_HAS_ACTIVE_ORDER ─────────────────
  if (msg.includes("TABLE_HAS_ACTIVE_ORDER")) {
    return {
      code: "conflict",
      userMessage: "Esta mesa já tem um pedido aberto.",
      originalMessage: msg,
      retryable: false,
    };
  }

  // ── Network / offline ─────────────────────────────────────────────
  if (isNetworkLike(msg)) {
    return {
      code: "network",
      userMessage:
        "Sem ligação ao servidor. Verifique a rede e tente novamente.",
      originalMessage: msg,
      retryable: true,
    };
  }

  // ── Gateway structured error (HTTP body with `error` field) ───────
  const gatewayCode = extractGatewayCode(error);
  if (gatewayCode) {
    const mapped = normalizeByGatewayCode(gatewayCode, msg);
    if (mapped) return mapped;
  }

  // ── Fallback: unknown ─────────────────────────────────────────────
  return {
    code: "unknown",
    userMessage: "Erro inesperado. Tente novamente.",
    originalMessage: msg,
    retryable: true,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────

function extractMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>;
    if (typeof e.message === "string") return e.message;
    if (typeof e.error === "string" && typeof e.message !== "string")
      return String(e.error);
  }
  return String(error ?? "");
}

function extractGatewayCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "error" in error) {
    const code = (error as Record<string, unknown>).error;
    if (typeof code === "string") return code;
  }
  return undefined;
}

function isNetworkLike(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("timeout") ||
    lower.includes("offline") ||
    lower.includes("disconnected") ||
    lower.includes("backend_unavailable") ||
    lower.includes("backend indisponível")
  );
}

/** Map gateway JSON `error` field to NormalizedOrderError (for API consumers). */
function normalizeByGatewayCode(
  code: string,
  msg: string,
): NormalizedOrderError | undefined {
  switch (code) {
    case "forbidden":
      return {
        code: "forbidden",
        userMessage: "Sem permissão para esta ação. Contacte o gerente.",
        originalMessage: msg,
        retryable: false,
        action: "contact_manager",
      };
    case "actor_required":
      return {
        code: "actor_required",
        userMessage: "Sessão inválida. Faça login novamente.",
        originalMessage: msg,
        retryable: false,
        action: "reauth",
      };
    case "invalid_transition":
      return {
        code: "invalid_transition",
        userMessage:
          "Pedido foi atualizado noutro dispositivo. A recarregar...",
        originalMessage: msg,
        retryable: true,
        action: "reload",
      };
    case "validation_error":
      return {
        code: "invalid_status",
        userMessage: "Dados inválidos. Verifique e tente novamente.",
        originalMessage: msg,
        retryable: true,
      };
    case "upstream_error":
      return {
        code: "network",
        userMessage: "Servidor temporariamente indisponível. Tente novamente.",
        originalMessage: msg,
        retryable: true,
      };
    default:
      return undefined; // let caller fallback
  }
}
