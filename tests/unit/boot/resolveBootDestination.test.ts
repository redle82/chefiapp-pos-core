/**
 * Unit tests for resolveBootDestination — Pure routing resolver
 *
 * This tests the thin wrapper around CoreFlow's resolveNextRoute.
 * No mocking needed: both resolveBootDestination and its dependencies
 * (deriveLifecycleState, deriveSystemState, resolveNextRoute) are pure.
 *
 * We DO need to handle `isMobileDevice()` which reads window.navigator.
 * Since tests run in JSDOM or Node, window.innerWidth defaults to 0 (<600),
 * which makes isMobileDevice() return true. We override window.innerWidth
 * (or mockUA) where needed.
 *
 * @tag BOOT-PIPELINE UNIT
 */

import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { resolveBootDestination } from "../../../merchant-portal/src/core/boot/resolveBootDestination";
import type { BootDestinationInput } from "../../../merchant-portal/src/core/boot/resolveBootDestination";
import type { AuthSnapshot, TenantSnapshot } from "../../../merchant-portal/src/core/boot/BootState";

// ── Test helpers ──────────────────────────────────────────────────────────

const AUTH_ANON: AuthSnapshot = { isAuthenticated: false, userId: null, loading: false };
const AUTH_USER: AuthSnapshot = { isAuthenticated: true, userId: "user-1", loading: false };

const TENANT_NONE: TenantSnapshot = {
  hasOrg: false,
  restaurantId: null,
  billingStatus: null,
  activated: false,
  sealed: false,
  isBootstrapComplete: false,
};

const TENANT_FULL: TenantSnapshot = {
  hasOrg: true,
  restaurantId: "r-1",
  billingStatus: "trial",
  activated: true,
  sealed: true,
  isBootstrapComplete: true,
};

function makeInput(overrides: Partial<BootDestinationInput> = {}): BootDestinationInput {
  return {
    auth: AUTH_USER,
    tenant: TENANT_FULL,
    pathname: "/app/dashboard",
    search: "",
    lastRoute: null,
    isDocker: false,
    uiMode: "OPERATIONAL_OS",
    ...overrides,
  };
}

// ── Window mock for isMobileDevice() ─────────────────────────────────────

let originalInnerWidth: number;

beforeEach(() => {
  originalInnerWidth = window.innerWidth;
  // Set desktop width so isMobileDevice() returns false by default
  Object.defineProperty(window, "innerWidth", { value: 1024, writable: true, configurable: true });
});

afterEach(() => {
  Object.defineProperty(window, "innerWidth", { value: originalInnerWidth, writable: true, configurable: true });
});

// ── Tests ─────────────────────────────────────────────────────────────────

describe("resolveBootDestination — public bypass", () => {
  it("/public/* returns ALLOW with ROUTE_PUBLIC_BYPASS", () => {
    const result = resolveBootDestination(
      makeInput({ pathname: "/public/menu/r-1", auth: AUTH_ANON, tenant: TENANT_NONE }),
    );
    expect(result.type).toBe("ALLOW");
    expect(result.reasonCode).toBe("ROUTE_PUBLIC_BYPASS");
    expect("to" in result).toBe(false);
  });
});

describe("resolveBootDestination — not authenticated", () => {
  it("anonymous on /auth/phone → ALLOW (visitor-allowed path)", () => {
    const result = resolveBootDestination(
      makeInput({ auth: AUTH_ANON, tenant: TENANT_NONE, pathname: "/auth/phone" }),
    );
    expect(result.type).toBe("ALLOW");
    expect(result.reasonCode).toBe("AUTH_ANONYMOUS_PUBLIC");
  });

  it("anonymous on / → ALLOW (visitor landing)", () => {
    const result = resolveBootDestination(
      makeInput({ auth: AUTH_ANON, tenant: TENANT_NONE, pathname: "/" }),
    );
    expect(result.type).toBe("ALLOW");
    expect(result.reasonCode).toBe("AUTH_ANONYMOUS_PUBLIC");
  });

  it("anonymous on /app/dashboard → REDIRECT to auth", () => {
    const result = resolveBootDestination(
      makeInput({ auth: AUTH_ANON, tenant: TENANT_NONE, pathname: "/app/dashboard" }),
    );
    expect(result.type).toBe("REDIRECT");
    expect(result.reasonCode).toBe("AUTH_NOT_AUTHENTICATED");
    expect("to" in result && result.to).toBeTruthy();
  });
});

describe("resolveBootDestination — authenticated, no org", () => {
  it("user on /welcome → ALLOW (bootstrap path)", () => {
    const result = resolveBootDestination(
      makeInput({ auth: AUTH_USER, tenant: TENANT_NONE, pathname: "/welcome" }),
    );
    expect(result.type).toBe("ALLOW");
    expect(result.reasonCode).toBe("LIFECYCLE_BOOTSTRAP_REQUIRED");
  });

  it("user on /onboarding → ALLOW (bootstrap path)", () => {
    const result = resolveBootDestination(
      makeInput({ auth: AUTH_USER, tenant: TENANT_NONE, pathname: "/onboarding" }),
    );
    expect(result.type).toBe("ALLOW");
    expect(result.reasonCode).toBe("LIFECYCLE_BOOTSTRAP_REQUIRED");
  });

  it("user on /app/dashboard → REDIRECT to /welcome (no org)", () => {
    const result = resolveBootDestination(
      makeInput({ auth: AUTH_USER, tenant: TENANT_NONE, pathname: "/app/dashboard" }),
    );
    expect(result.type).toBe("REDIRECT");
    expect(result.reasonCode).toBe("TENANT_NONE");
    expect("to" in result && result.to).toBe("/welcome");
  });
});

describe("resolveBootDestination — full state (desktop)", () => {
  it("activated user on /app/dashboard → ALLOW", () => {
    const result = resolveBootDestination(
      makeInput({ pathname: "/app/dashboard" }),
    );
    expect(result.type).toBe("ALLOW");
    expect(result.reasonCode).toBe("ROUTE_ALLOW");
  });

  it("not-activated user on /menu-builder → REDIRECT to activation", () => {
    const result = resolveBootDestination(
      makeInput({
        tenant: { ...TENANT_FULL, activated: false },
        pathname: "/menu-builder",
      }),
    );
    expect(result.type).toBe("REDIRECT");
    expect(result.reasonCode).toBe("ROUTE_REDIRECT");
    expect("to" in result && result.to).toBe("/app/activation");
  });

  it("activated user on entry path / with OPERATIONAL_OS → REDIRECT to /app/dashboard", () => {
    const result = resolveBootDestination(
      makeInput({ pathname: "/", uiMode: "OPERATIONAL_OS" }),
    );
    // CoreFlow: auth entry redirect when activated → /app/dashboard or lastRoute
    expect(result.type).toBe("REDIRECT");
    expect("to" in result && result.to).toBe("/app/dashboard");
  });

  it("activated user on entry path / with valid lastRoute → REDIRECT to lastRoute", () => {
    const result = resolveBootDestination(
      makeInput({ pathname: "/", lastRoute: "/op/tpv", uiMode: "OPERATIONAL_OS" }),
    );
    expect(result.type).toBe("REDIRECT");
    expect("to" in result && result.to).toBe("/op/tpv");
  });

  it("SETUP + /op/tpv → REDIRECT (operational blocked in SETUP)", () => {
    const result = resolveBootDestination(
      makeInput({
        pathname: "/op/tpv",
        tenant: { ...TENANT_FULL, billingStatus: null, isBootstrapComplete: false, activated: true },
      }),
    );
    // systemState = SETUP, operational path → redirect
    expect(result.type).toBe("REDIRECT");
    expect("to" in result && result.to).toBe("/app/activation");
  });

  it("SETUP + /op/tpv?mode=trial → ALLOW (trial exception)", () => {
    const result = resolveBootDestination(
      makeInput({
        pathname: "/op/tpv",
        search: "?mode=trial",
        tenant: { ...TENANT_FULL, billingStatus: null, isBootstrapComplete: false, activated: true },
      }),
    );
    expect(result.type).toBe("ALLOW");
  });
});

describe("resolveBootDestination — reasonCode mapping", () => {
  it("ALLOW on non-public path maps to ROUTE_ALLOW", () => {
    const result = resolveBootDestination(
      makeInput({ pathname: "/admin/config" }),
    );
    expect(result.type).toBe("ALLOW");
    expect(result.reasonCode).toBe("ROUTE_ALLOW");
  });

  it("ALLOW on /public maps to ROUTE_PUBLIC_BYPASS", () => {
    const result = resolveBootDestination(
      makeInput({ pathname: "/public/something" }),
    );
    expect(result.reasonCode).toBe("ROUTE_PUBLIC_BYPASS");
  });
});
