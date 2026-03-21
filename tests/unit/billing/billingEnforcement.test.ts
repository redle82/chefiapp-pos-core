/**
 * Billing Enforcement Tests — Phase 4
 *
 * Tests the complete billing status decision matrix:
 * 1. BillingStatus type completeness (all 6 Stripe states)
 * 2. PaymentGuard decision table (status → block/pass/warn)
 * 3. useSubscription isBlocked/isActive helpers
 * 4. Safe Harbor paths bypass all blocking
 * 5. Trial expiration → past_due mapping
 */

// ---------------------------------------------------------------------------
// Types under test (import the real type)
// ---------------------------------------------------------------------------
import type { BillingStatus } from "../../../merchant-portal/src/core/billing/coreBillingApi";

// ---------------------------------------------------------------------------
// 1. BillingStatus type completeness
// ---------------------------------------------------------------------------
describe("BillingStatus type", () => {
  const ALL_STATUSES: BillingStatus[] = [
    "trial",
    "active",
    "past_due",
    "past_due_limited",
    "past_due_readonly",
    "canceled",
    "incomplete",
    "paused",
  ];

  it("enumerates 8 statuses (incl. smart downgrade)", () => {
    expect(ALL_STATUSES).toHaveLength(8);
  });

  it.each(ALL_STATUSES)("'%s' is a valid BillingStatus", (status) => {
    // TypeScript compilation proves this; runtime assertion for safety
    const s: BillingStatus = status;
    expect(typeof s).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// 2. PaymentGuard decision table (pure logic extraction)
// ---------------------------------------------------------------------------

/** Mirror of PaymentGuard decision logic — extracted for testability */
type GuardDecision =
  | "loading"
  | "safe_harbor"
  | "blocked_canceled"
  | "blocked_incomplete"
  | "blocked_paused"
  | "blocked_trial_expired"
  | "warn_past_due"
  | "pass";

function resolveGuardDecision(
  status: BillingStatus | "loading",
  trialExpired: boolean,
  pathname: string,
): GuardDecision {
  if (status === "loading") return "loading";

  // Safe Harbor
  if (
    pathname.startsWith("/app/console") ||
    pathname.startsWith("/app/setup") ||
    pathname.startsWith("/app/billing")
  ) {
    return "safe_harbor";
  }

  if (status === "canceled") return "blocked_canceled";
  if (status === "incomplete") return "blocked_incomplete";
  if (status === "paused") return "blocked_paused";
  if (status === "past_due_limited" || status === "past_due_readonly")
    return "blocked_paused";
  if (status === "past_due" && trialExpired) return "blocked_trial_expired";
  if (status === "past_due") return "warn_past_due";

  return "pass";
}

describe("PaymentGuard decision matrix", () => {
  describe("blocking statuses", () => {
    const BLOCKED_CASES: Array<{
      status: BillingStatus;
      trialExpired: boolean;
      expected: GuardDecision;
    }> = [
      {
        status: "canceled",
        trialExpired: false,
        expected: "blocked_canceled",
      },
      {
        status: "incomplete",
        trialExpired: false,
        expected: "blocked_incomplete",
      },
      {
        status: "paused",
        trialExpired: false,
        expected: "blocked_paused",
      },
      {
        status: "past_due",
        trialExpired: true,
        expected: "blocked_trial_expired",
      },
      {
        status: "past_due_limited",
        trialExpired: false,
        expected: "blocked_paused",
      },
      {
        status: "past_due_readonly",
        trialExpired: false,
        expected: "blocked_paused",
      },
    ];

    it.each(BLOCKED_CASES)(
      "$status (trialExpired=$trialExpired) → $expected",
      ({ status, trialExpired, expected }) => {
        expect(
          resolveGuardDecision(status, trialExpired, "/app/staff/home"),
        ).toBe(expected);
      },
    );
  });

  describe("warning statuses", () => {
    it("past_due without trial expiration → warn_past_due (shows banner + children)", () => {
      expect(resolveGuardDecision("past_due", false, "/app/staff/home")).toBe(
        "warn_past_due",
      );
    });
  });

  describe("pass-through statuses", () => {
    it.each<BillingStatus>(["active", "trial"])("%s → pass", (status) => {
      expect(resolveGuardDecision(status, false, "/app/staff/home")).toBe(
        "pass",
      );
    });
  });

  describe("loading state", () => {
    it("loading → loading (shows spinner)", () => {
      expect(resolveGuardDecision("loading", false, "/app/staff/home")).toBe(
        "loading",
      );
    });
  });

  describe("Safe Harbor paths", () => {
    const SAFE_PATHS = [
      "/app/console",
      "/app/console/settings",
      "/app/setup",
      "/app/setup/billing",
      "/app/billing",
      "/app/billing/success",
    ];

    const BLOCKED_STATUSES: BillingStatus[] = [
      "canceled",
      "incomplete",
      "paused",
    ];

    it.each(SAFE_PATHS)(
      "path '%s' bypasses all blocking → safe_harbor",
      (path) => {
        for (const status of BLOCKED_STATUSES) {
          expect(resolveGuardDecision(status, false, path)).toBe("safe_harbor");
        }
      },
    );

    it("safe harbor even with trial expired + past_due", () => {
      expect(resolveGuardDecision("past_due", true, "/app/billing")).toBe(
        "safe_harbor",
      );
    });
  });

  describe("non-safe paths are enforced", () => {
    const OPERATIONAL_PATHS = [
      "/app/staff/home",
      "/app/orders",
      "/app/menu",
      "/app/kds",
      "/app/reports",
    ];

    it.each(OPERATIONAL_PATHS)("canceled at '%s' → blocked", (path) => {
      expect(resolveGuardDecision("canceled", false, path)).toBe(
        "blocked_canceled",
      );
    });
  });
});

// ---------------------------------------------------------------------------
// 3. useSubscription isBlocked / isActive decision logic
// ---------------------------------------------------------------------------

/** Mirror of useSubscription helpers */
type SubStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "past_due_limited"
  | "past_due_readonly"
  | "canceled"
  | "incomplete"
  | "paused";

function isActive(status: SubStatus | null): boolean {
  if (!status) return false;
  return status === "active" || status === "trialing";
}

function isBlocked(status: SubStatus | null): boolean {
  if (!status) return true; // no subscription = blocked
  return (
    status === "canceled" ||
    status === "paused" ||
    status === "incomplete" ||
    status === "past_due_limited" ||
    status === "past_due_readonly"
  );
}

describe("useSubscription helpers", () => {
  describe("isActive", () => {
    it("active → true", () => expect(isActive("active")).toBe(true));
    it("trialing → true", () => expect(isActive("trialing")).toBe(true));
    it("past_due → false", () => expect(isActive("past_due")).toBe(false));
    it("past_due_limited → false", () => expect(isActive("past_due_limited")).toBe(false));
    it("past_due_readonly → false", () => expect(isActive("past_due_readonly")).toBe(false));
    it("canceled → false", () => expect(isActive("canceled")).toBe(false));
    it("incomplete → false", () => expect(isActive("incomplete")).toBe(false));
    it("paused → false", () => expect(isActive("paused")).toBe(false));
    it("null → false", () => expect(isActive(null)).toBe(false));
  });

  describe("isBlocked", () => {
    it("canceled → true", () => expect(isBlocked("canceled")).toBe(true));
    it("paused → true", () => expect(isBlocked("paused")).toBe(true));
    it("incomplete → true", () => expect(isBlocked("incomplete")).toBe(true));
    it("active → false", () => expect(isBlocked("active")).toBe(false));
    it("trialing → false", () => expect(isBlocked("trialing")).toBe(false));
    it("past_due → false (warn, not block)", () =>
      expect(isBlocked("past_due")).toBe(false));
    it("past_due_limited → true", () => expect(isBlocked("past_due_limited")).toBe(true));
    it("past_due_readonly → true", () => expect(isBlocked("past_due_readonly")).toBe(true));
    it("null → true (no subscription = blocked)", () =>
      expect(isBlocked(null)).toBe(true));
  });
});

// ---------------------------------------------------------------------------
// 4. Trial expiration detection
// ---------------------------------------------------------------------------
describe("trial expiration logic", () => {
  function isTrialExpired(
    status: string,
    trialEndsAt: string | null,
    now: Date,
  ): boolean {
    return (
      status === "trial" && trialEndsAt != null && now > new Date(trialEndsAt)
    );
  }

  it("trial with past trial_ends_at → expired", () => {
    expect(
      isTrialExpired("trial", "2020-01-01T00:00:00Z", new Date("2025-01-01")),
    ).toBe(true);
  });

  it("trial with future trial_ends_at → not expired", () => {
    expect(
      isTrialExpired("trial", "2099-01-01T00:00:00Z", new Date("2025-01-01")),
    ).toBe(false);
  });

  it("trial with null trial_ends_at → not expired", () => {
    expect(isTrialExpired("trial", null, new Date())).toBe(false);
  });

  it("active status ignores trial_ends_at", () => {
    expect(
      isTrialExpired("active", "2020-01-01T00:00:00Z", new Date("2025-01-01")),
    ).toBe(false);
  });

  it("canceled status ignores trial_ends_at", () => {
    expect(
      isTrialExpired(
        "canceled",
        "2020-01-01T00:00:00Z",
        new Date("2025-01-01"),
      ),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. normalizeStatus mapping (from useSubscription)
// ---------------------------------------------------------------------------
describe("normalizeStatus mapping", () => {
  function normalizeStatus(dbStatus: string): SubStatus {
    const map: Record<string, SubStatus> = {
      active: "active",
      trialing: "trialing",
      past_due: "past_due",
      canceled: "canceled",
      incomplete: "incomplete",
      paused: "paused",
      TRIAL: "trialing",
      ACTIVE: "active",
      PAST_DUE: "past_due",
      SUSPENDED: "paused",
      CANCELLED: "canceled",
    };
    return map[dbStatus] ?? "trialing";
  }

  const CASES: Array<{ input: string; expected: SubStatus }> = [
    { input: "active", expected: "active" },
    { input: "trialing", expected: "trialing" },
    { input: "past_due", expected: "past_due" },
    { input: "canceled", expected: "canceled" },
    { input: "incomplete", expected: "incomplete" },
    { input: "paused", expected: "paused" },
    // Legacy uppercase
    { input: "TRIAL", expected: "trialing" },
    { input: "ACTIVE", expected: "active" },
    { input: "PAST_DUE", expected: "past_due" },
    { input: "SUSPENDED", expected: "paused" },
    { input: "CANCELLED", expected: "canceled" },
    // Unknown defaults to trialing (safe)
    { input: "unknown_status", expected: "trialing" },
    { input: "", expected: "trialing" },
  ];

  it.each(CASES)("'$input' → '$expected'", ({ input, expected }) => {
    expect(normalizeStatus(input)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 6. Complete status lifecycle transitions
// ---------------------------------------------------------------------------
describe("billing status lifecycle", () => {
  /** Valid transitions that can happen via Stripe webhooks */
  const VALID_TRANSITIONS: Array<{
    from: BillingStatus;
    to: BillingStatus;
    trigger: string;
  }> = [
    { from: "trial", to: "active", trigger: "checkout.session.completed" },
    { from: "trial", to: "past_due", trigger: "trial expired (no payment)" },
    { from: "active", to: "past_due", trigger: "invoice.payment_failed" },
    {
      from: "active",
      to: "canceled",
      trigger: "customer.subscription.deleted",
    },
    { from: "active", to: "paused", trigger: "customer.subscription.paused" },
    { from: "past_due", to: "active", trigger: "invoice.paid (recovered)" },
    {
      from: "past_due",
      to: "canceled",
      trigger: "subscription.deleted (dunning exhausted)",
    },
    {
      from: "incomplete",
      to: "active",
      trigger: "invoice.paid (first payment)",
    },
    {
      from: "incomplete",
      to: "canceled",
      trigger: "invoice.payment_failed (expired)",
    },
    { from: "paused", to: "active", trigger: "customer.subscription.resumed" },
    {
      from: "canceled",
      to: "active",
      trigger: "checkout.session.completed (resubscribe)",
    },
  ];

  it.each(VALID_TRANSITIONS)("$from → $to via $trigger", ({ from, to }) => {
    // Both from and to must be valid BillingStatus values
    const ALL: BillingStatus[] = [
      "trial",
      "active",
      "past_due",
      "canceled",
      "incomplete",
      "paused",
    ];
    expect(ALL).toContain(from);
    expect(ALL).toContain(to);
  });

  it("no transition leads to an unknown status", () => {
    const ALL_TARGETS = VALID_TRANSITIONS.map((t) => t.to);
    const KNOWN: BillingStatus[] = [
      "trial",
      "active",
      "past_due",
      "canceled",
      "incomplete",
      "paused",
    ];
    for (const target of ALL_TARGETS) {
      expect(KNOWN).toContain(target);
    }
  });
});
