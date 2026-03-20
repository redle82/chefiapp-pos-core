/**
 * DEV_STABLE_MODE (core-engine stub)
 *
 * Mirrors merchant-portal/src/core/runtime/devStableMode.ts
 * for core-engine Logger.ts lazy import resolution.
 */
export function isDevStableMode(): boolean {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "production")
    return false;
  if (typeof window === "undefined" || !window.location) return false;

  const qp = new URLSearchParams(window.location.search);
  const flag = qp.get("devStable");

  if (flag === "0") return false;
  if (flag === "1") return true;

  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
}
