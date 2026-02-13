/// <reference lib="dom" />
/**
 * DEV_STABLE_MODE (SSOT)
 *
 * Policy goal:
 * - DEV on localhost should be deterministic and quiet (transport subsystems can be frozen by callers).
 * - Production MUST NOT be affected.
 *
 * Contract:
 * - Base: import.meta.env.DEV && isLocalhost(window.location.hostname)
 * - Overrides (query):
 *   - ?devStable=0 disables (even on localhost)
 *   - ?devStable=1 forces (even if not localhost) BUT still DEV-only (never in production builds)
 *
 * IMPORTANT:
 * - Pure module: no side effects, safe to import from anywhere.
 * - If window is not available (SSR/tests), returns false (fail-closed).
 */
export function isDevStableMode(): boolean {
  // Never enable outside DEV builds (non-negotiable: production unaffected)
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') return false;

  if (typeof window === 'undefined' || !window.location) return false;

  const qp = new URLSearchParams(window.location.search);
  const flag = qp.get('devStable');

  // Explicit disable wins
  if (flag === '0') return false;

  // Explicit force (still DEV-only because of the check above)
  if (flag === '1') return true;

  const host = window.location.hostname;
  if (!host || typeof host.endsWith !== 'function') return false;
  const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');

  return isLocalhost;
}

export function devStableReason(): string {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') return 'prod_build';
  if (typeof window === 'undefined' || !window.location) return 'no_window';

  const qp = new URLSearchParams(window.location.search);
  const flag = qp.get('devStable');

  if (flag === '0') return 'forced_off_query';
  if (flag === '1') return 'forced_on_query';

  const host = window.location.hostname;
  if (!host || typeof host.endsWith !== 'function') return 'no_host';
  const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
  return isLocalhost ? 'localhost_default_on' : 'non_localhost_default_off';
}

/**
 * Local debug verbosity toggle (DEV-only behavior is enforced by callers).
 * Contract: ?debug=1 enables verbose local logs.
 */
export function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('debug') === '1';
}

