/**
 * Unit tests for LifecycleState — Mutation Hardening
 *
 * These tests exercise EVERY branch of deriveLifecycleState to ensure
 * mutation testing kills all mutants. The Docker E2E environment always
 * auto-assigns a restaurant, making the isAuthenticated+!hasOrganization
 * branch unreachable by Playwright. Pure unit tests fill that gap.
 *
 * @tag MUTATION-HARDENING LIFECYCLE-STATE
 */

import { describe, expect, it } from "vitest";
import {
  deriveLifecycleState,
  deriveSystemState,
  getCanonicalDestination,
  isPathAllowedForState,
} from "./LifecycleState";

/* ------------------------------------------------------------------ */
/*  deriveLifecycleState                                               */
/* ------------------------------------------------------------------ */

describe("deriveLifecycleState", () => {
  // ── Priority 1: hasOrganization overrides everything ──

  it("returns READY_TO_OPERATE when hasOrganization is true", () => {
    const result = deriveLifecycleState({
      pathname: "/dashboard",
      isAuthenticated: true,
      hasOrganization: true,
    });
    expect(result).toBe("READY_TO_OPERATE");
  });

  it("returns READY_TO_OPERATE even if NOT authenticated but has org", () => {
    const result = deriveLifecycleState({
      pathname: "/",
      isAuthenticated: false,
      hasOrganization: true,
    });
    expect(result).toBe("READY_TO_OPERATE");
  });

  it("does NOT return READY_TO_OPERATE when hasOrganization is false", () => {
    const result = deriveLifecycleState({
      pathname: "/dashboard",
      isAuthenticated: false,
      hasOrganization: false,
    });
    expect(result).not.toBe("READY_TO_OPERATE");
  });

  // ── Priority 2: isAuthenticated without organization → BOOTSTRAP_* ──

  it("returns BOOTSTRAP_IN_PROGRESS when on /bootstrap", () => {
    const result = deriveLifecycleState({
      pathname: "/bootstrap",
      isAuthenticated: true,
      hasOrganization: false,
    });
    expect(result).toBe("BOOTSTRAP_IN_PROGRESS");
  });

  it("returns BOOTSTRAP_IN_PROGRESS when on /setup/restaurant-minimal", () => {
    const result = deriveLifecycleState({
      pathname: "/setup/restaurant-minimal",
      isAuthenticated: true,
      hasOrganization: false,
    });
    expect(result).toBe("BOOTSTRAP_IN_PROGRESS");
  });

  it("/bootstrap and /setup/restaurant-minimal are treated INDEPENDENTLY (|| not &&)", () => {
    // If || is mutated to &&, only BOTH paths matching would trigger.
    // Each path alone must trigger BOOTSTRAP_IN_PROGRESS.
    const bootstrapOnly = deriveLifecycleState({
      pathname: "/bootstrap",
      isAuthenticated: true,
      hasOrganization: false,
    });
    const setupOnly = deriveLifecycleState({
      pathname: "/setup/restaurant-minimal",
      isAuthenticated: true,
      hasOrganization: false,
    });
    expect(bootstrapOnly).toBe("BOOTSTRAP_IN_PROGRESS");
    expect(setupOnly).toBe("BOOTSTRAP_IN_PROGRESS");
  });

  it("returns BOOTSTRAP_REQUIRED on other paths when authenticated without org", () => {
    const result = deriveLifecycleState({
      pathname: "/dashboard",
      isAuthenticated: true,
      hasOrganization: false,
    });
    expect(result).toBe("BOOTSTRAP_REQUIRED");
  });

  it("returns BOOTSTRAP_REQUIRED (exact string) — not empty", () => {
    const result = deriveLifecycleState({
      pathname: "/welcome",
      isAuthenticated: true,
      hasOrganization: false,
    });
    expect(result).toBe("BOOTSTRAP_REQUIRED");
    expect(result.length).toBeGreaterThan(0);
  });

  it("the BOOTSTRAP_IN_PROGRESS block MUST execute (not be empty)", () => {
    // If BlockStatement is mutated to {}, the function falls through to BOOTSTRAP_REQUIRED.
    const result = deriveLifecycleState({
      pathname: "/bootstrap",
      isAuthenticated: true,
      hasOrganization: false,
    });
    // Must be BOOTSTRAP_IN_PROGRESS, NOT BOOTSTRAP_REQUIRED
    expect(result).toBe("BOOTSTRAP_IN_PROGRESS");
    expect(result).not.toBe("BOOTSTRAP_REQUIRED");
  });

  it("/setup/restaurant-minimal must match exactly (not empty string)", () => {
    // If StringLiteral is mutated to "", pathname === "" would only match empty pathname.
    const exact = deriveLifecycleState({
      pathname: "/setup/restaurant-minimal",
      isAuthenticated: true,
      hasOrganization: false,
    });
    expect(exact).toBe("BOOTSTRAP_IN_PROGRESS");

    // A different path must NOT match
    const different = deriveLifecycleState({
      pathname: "/setup/restaurant-full",
      isAuthenticated: true,
      hasOrganization: false,
    });
    expect(different).toBe("BOOTSTRAP_REQUIRED");
  });

  it("equality operator matters: !== would invert the /setup/restaurant-minimal check", () => {
    // If === is mutated to !==, then /setup/restaurant-minimal would NOT match
    // but every OTHER path would match.
    const onSetup = deriveLifecycleState({
      pathname: "/setup/restaurant-minimal",
      isAuthenticated: true,
      hasOrganization: false,
    });
    const onOther = deriveLifecycleState({
      pathname: "/other",
      isAuthenticated: true,
      hasOrganization: false,
    });
    // /setup/restaurant-minimal MUST be BOOTSTRAP_IN_PROGRESS
    expect(onSetup).toBe("BOOTSTRAP_IN_PROGRESS");
    // /other MUST NOT be BOOTSTRAP_IN_PROGRESS
    expect(onOther).not.toBe("BOOTSTRAP_IN_PROGRESS");
    expect(onOther).toBe("BOOTSTRAP_REQUIRED");
  });

  // ── Priority 3: Not authenticated → VISITOR ──

  it("returns VISITOR when not authenticated and no org", () => {
    const result = deriveLifecycleState({
      pathname: "/",
      isAuthenticated: false,
      hasOrganization: false,
    });
    expect(result).toBe("VISITOR");
  });

  // ── Exhaustive: ConditionalExpression boundary (if → true/false) ──

  it("hasOrganization=false + isAuthenticated=true → NOT READY_TO_OPERATE", () => {
    // Kills: ConditionalExpression L88 → true
    const result = deriveLifecycleState({
      pathname: "/dashboard",
      isAuthenticated: true,
      hasOrganization: false,
    });
    expect(result).not.toBe("READY_TO_OPERATE");
  });

  it("isAuthenticated=false → NOT BOOTSTRAP_* (even on /bootstrap)", () => {
    // Kills: ConditionalExpression isAuthenticated → true
    const result = deriveLifecycleState({
      pathname: "/bootstrap",
      isAuthenticated: false,
      hasOrganization: false,
    });
    expect(result).toBe("VISITOR");
    expect(result).not.toBe("BOOTSTRAP_IN_PROGRESS");
    expect(result).not.toBe("BOOTSTRAP_REQUIRED");
  });

  it("isAuthenticated=true on non-bootstrap path → BOOTSTRAP_REQUIRED not VISITOR", () => {
    // Kills: ConditionalExpression isAuthenticated → false
    const result = deriveLifecycleState({
      pathname: "/foo",
      isAuthenticated: true,
      hasOrganization: false,
    });
    expect(result).toBe("BOOTSTRAP_REQUIRED");
    expect(result).not.toBe("VISITOR");
  });
});

/* ------------------------------------------------------------------ */
/*  isPathAllowedForState                                              */
/* ------------------------------------------------------------------ */

describe("isPathAllowedForState", () => {
  it("READY_TO_OPERATE allows any path", () => {
    expect(isPathAllowedForState("/anything", "READY_TO_OPERATE")).toBe(true);
    expect(isPathAllowedForState("/dashboard", "READY_TO_OPERATE")).toBe(true);
  });

  it("VISITOR allows / but not /dashboard", () => {
    expect(isPathAllowedForState("/", "VISITOR")).toBe(true);
    expect(isPathAllowedForState("/dashboard", "VISITOR")).toBe(false);
  });

  it("BOOTSTRAP_REQUIRED allows /bootstrap and /welcome", () => {
    expect(isPathAllowedForState("/bootstrap", "BOOTSTRAP_REQUIRED")).toBe(
      true,
    );
    expect(isPathAllowedForState("/welcome", "BOOTSTRAP_REQUIRED")).toBe(true);
    expect(isPathAllowedForState("/dashboard", "BOOTSTRAP_REQUIRED")).toBe(
      false,
    );
  });
});

/* ------------------------------------------------------------------ */
/*  getCanonicalDestination                                            */
/* ------------------------------------------------------------------ */

describe("getCanonicalDestination", () => {
  it("VISITOR → /", () => {
    expect(getCanonicalDestination("VISITOR")).toBe("/");
  });

  it("BOOTSTRAP_REQUIRED → /welcome", () => {
    expect(getCanonicalDestination("BOOTSTRAP_REQUIRED")).toBe("/welcome");
  });

  it("BOOTSTRAP_IN_PROGRESS → /welcome", () => {
    expect(getCanonicalDestination("BOOTSTRAP_IN_PROGRESS")).toBe("/welcome");
  });

  it("READY_TO_OPERATE → /dashboard", () => {
    expect(getCanonicalDestination("READY_TO_OPERATE")).toBe("/dashboard");
  });
});

/* ------------------------------------------------------------------ */
/*  deriveSystemState                                                  */
/* ------------------------------------------------------------------ */

describe("deriveSystemState", () => {
  it("returns SETUP when no organization", () => {
    expect(
      deriveSystemState({
        hasOrganization: false,
        billingStatus: null,
        isBootstrapComplete: false,
      }),
    ).toBe("SETUP");
  });

  it("returns TRIAL for trial billing", () => {
    expect(
      deriveSystemState({
        hasOrganization: true,
        billingStatus: "trial",
        isBootstrapComplete: true,
      }),
    ).toBe("TRIAL");
  });

  it("returns ACTIVE for paid billing", () => {
    expect(
      deriveSystemState({
        hasOrganization: true,
        billingStatus: "active",
        isBootstrapComplete: true,
      }),
    ).toBe("ACTIVE");
  });

  it("returns SUSPENDED for unknown billing", () => {
    expect(
      deriveSystemState({
        hasOrganization: true,
        billingStatus: "suspended",
        isBootstrapComplete: true,
      }),
    ).toBe("SUSPENDED");
  });
});
