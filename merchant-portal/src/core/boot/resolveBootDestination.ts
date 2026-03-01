/**
 * Boot Pipeline — Destination Resolver
 *
 * Pure function that wraps `resolveNextRoute` (CoreFlow) and annotates
 * the decision with a structured `BootReasonCode`.
 *
 * This module does NOT rewrite routing logic — it delegates to CoreFlow
 * and maps the result to a typed `BootDestination`. CoreFlow remains
 * the single authority for navigation decisions.
 *
 * @module core/boot/resolveBootDestination
 */

import type { UserState } from "../flow/CoreFlow";
import { resolveNextRoute } from "../flow/CoreFlow";
import type { RestaurantLifecycleState } from "../lifecycle/LifecycleState";
import {
  deriveLifecycleState,
  deriveSystemState,
  getCanonicalDestination,
  isPathAllowedForState,
} from "../lifecycle/LifecycleState";
import type {
  AuthSnapshot,
  BootDestination,
  BootReasonCode,
  TenantSnapshot,
} from "./BootState";

// ─── Input ────────────────────────────────────────────────────────────────

export interface BootDestinationInput {
  /** Auth data from the pipeline */
  auth: AuthSnapshot;
  /** Tenant data from the pipeline */
  tenant: TenantSnapshot;
  /** Current pathname (location.pathname) */
  pathname: string;
  /** Current search string (location.search) */
  search: string;
  /** Last stored route from session/localStorage */
  lastRoute: string | null;
  /** Whether the current environment is Docker */
  isDocker: boolean;
  /** UI_MODE from CONFIG */
  uiMode?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Map CoreFlow's `reason` string to a structured BootReasonCode.
 * CoreFlow reasons are free-text; we pattern-match to codes.
 */
function mapReasonToCode(
  decision: { type: "ALLOW" | "REDIRECT"; reason?: string },
  input: BootDestinationInput,
): BootReasonCode {
  if (decision.type === "ALLOW") {
    if (input.pathname.startsWith("/public")) return "ROUTE_PUBLIC_BYPASS";
    return "ROUTE_ALLOW";
  }

  const reason = (decision as { reason?: string }).reason ?? "";
  const lower = reason.toLowerCase();

  if (lower.includes("auth required")) return "AUTH_NOT_AUTHENTICATED";
  if (lower.includes("no org")) return "TENANT_NONE";
  if (lower.includes("centro de ativação") || lower.includes("activation"))
    return "ROUTE_REDIRECT";
  if (lower.includes("última área") || lower.includes("default dashboard"))
    return "ROUTE_REDIRECT";
  if (lower.includes("setup") || lower.includes("tpv/kds"))
    return "ROUTE_REDIRECT";
  if (lower.includes("portal central")) return "ROUTE_REDIRECT";

  return "ROUTE_REDIRECT";
}

// ─── Main resolver ────────────────────────────────────────────────────────

/**
 * Resolve the boot destination for the current pipeline state.
 *
 * Steps:
 * 1. Check public bypass (no auth/tenant needed)
 * 2. If not authenticated → derive lifecycle for anonymous user
 * 3. If no org → derive lifecycle for bootstrapping user
 * 4. Otherwise → build UserState, delegate to resolveNextRoute
 *
 * Returns a BootDestination with structured reasonCode.
 */
export function resolveBootDestination(
  input: BootDestinationInput,
): BootDestination {
  const { auth, tenant, pathname, search, lastRoute, isDocker, uiMode } = input;

  // ── 0. Public bypass ──
  if (pathname.startsWith("/public")) {
    return {
      type: "ALLOW",
      reasonCode: "ROUTE_PUBLIC_BYPASS",
      reason: "Public route — no gate",
    };
  }

  // ── 1. Not authenticated ──
  if (!auth.isAuthenticated) {
    const lifecycle = deriveLifecycleState({
      pathname,
      isAuthenticated: false,
      hasOrganization: tenant.hasOrg,
    });

    if (isPathAllowedForState(pathname, lifecycle)) {
      return {
        type: "ALLOW",
        reasonCode: "AUTH_ANONYMOUS_PUBLIC",
        reason: `Anonymous on allowed path (${lifecycle})`,
      };
    }

    const dest = resolveCanonicalDestination(lifecycle, uiMode);
    return {
      type: "REDIRECT",
      to: dest,
      reasonCode: "AUTH_NOT_AUTHENTICATED",
      reason: "Not authenticated → canonical destination",
    };
  }

  // ── 2. Authenticated but no org ──
  if (!tenant.hasOrg) {
    const lifecycle = deriveLifecycleState({
      pathname,
      isAuthenticated: true,
      hasOrganization: false,
    });

    if (isPathAllowedForState(pathname, lifecycle)) {
      return {
        type: "ALLOW",
        reasonCode: "LIFECYCLE_BOOTSTRAP_REQUIRED",
        reason: `Bootstrap phase — allowed path (${lifecycle})`,
      };
    }

    const dest = resolveCanonicalDestination(lifecycle, uiMode);
    return {
      type: "REDIRECT",
      to: dest,
      reasonCode: "TENANT_NONE",
      reason: "No org → bootstrap",
    };
  }

  // ── 3. Full state — delegate to CoreFlow ──
  const systemState = deriveSystemState({
    hasOrganization: tenant.hasOrg,
    billingStatus: tenant.billingStatus,
    isBootstrapComplete: tenant.isBootstrapComplete,
  });

  const userState: UserState = {
    isAuthenticated: true,
    hasOrganization: tenant.hasOrg,
    hasRestaurant: tenant.hasOrg,
    currentPath: pathname,
    systemState,
    activated: tenant.activated,
    lastRoute,
    currentSearch: search,
  };

  const decision = resolveNextRoute(userState);
  const reasonCode = mapReasonToCode(decision, input);

  if (decision.type === "ALLOW") {
    return {
      type: "ALLOW",
      reasonCode,
      reason: "CoreFlow ALLOW",
    };
  }

  return {
    type: "REDIRECT",
    to: decision.to,
    reasonCode,
    reason: decision.reason,
  };
}

// ─── Internals ────────────────────────────────────────────────────────────

/**
 * Adjust canonical destination for OPERATIONAL_OS mode
 * (never redirect to "/" — use /app/dashboard instead).
 */
function resolveCanonicalDestination(
  lifecycle: RestaurantLifecycleState,
  uiMode?: string,
): string {
  const dest = getCanonicalDestination(lifecycle);
  if (uiMode === "OPERATIONAL_OS" && dest === "/") return "/app/dashboard";
  return dest;
}
