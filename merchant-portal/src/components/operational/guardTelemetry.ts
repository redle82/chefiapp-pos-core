/**
 * guardTelemetry — Production-grade telemetry for BrowserBlockGuard.
 *
 * DEV:  verbose console.log (existing [OP_GUARD] format).
 * PROD: emit only when decision=BLOCK or runtime=standalone-pwa,
 *       sampled at ≤10%, via Sentry breadcrumb → console.warn fallback.
 *
 * Payload is PII-free: pathname + decision + runtime + guard label.
 *
 * Ref: https://github.com/goldmonkey777/ChefIApp-POS-CORE/issues/14
 */

import { addBreadcrumb } from "@sentry/react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface GuardTelemetryPayload {
  pathname: string;
  decision: "ALLOW" | "BLOCK";
  runtime: "electron" | "tauri" | "standalone-pwa" | "browser";
  guard: "operational";
}

/* ------------------------------------------------------------------ */
/*  Main entry point                                                   */
/* ------------------------------------------------------------------ */

export function emitGuardTelemetry(payload: GuardTelemetryPayload): void {
  // ── DEV: keep verbose logging (same as original [OP_GUARD] format) ──
  if (import.meta.env.DEV) {
    console.log(
      `[OP_GUARD] pathname=${payload.pathname} decision=${payload.decision} ` +
        `runtime=${payload.runtime} guard=${payload.guard}`,
    );
    return;
  }

  // ── PROD: filter — only BLOCK or standalone-pwa ──
  if (payload.decision !== "BLOCK" && payload.runtime !== "standalone-pwa") {
    return;
  }

  // ── PROD: sampling ≤10% ──
  if (Math.random() >= 0.1) {
    return;
  }

  // ── Try Sentry breadcrumb ──
  try {
    addBreadcrumb({
      category: "op-guard",
      level: "info",
      data: payload,
    });
  } catch {
    // Sentry unavailable or threw — fall back to parseable console.warn
    console.warn(JSON.stringify(payload));
  }
}
