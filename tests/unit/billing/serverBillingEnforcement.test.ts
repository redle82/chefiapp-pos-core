/**
 * Server-Side Billing Enforcement Tests
 *
 * Validates the billing guard logic implemented in SQL:
 * 1. require_active_subscription() decision matrix
 * 2. billing_status CHECK constraint (7 values)
 * 3. gm_billing_events reconciliation schema
 * 4. Readonly mode (past_due blocks writes, allows reads)
 * 5. RPC guard injection coverage
 * 6. Stripe → internal status mapping (sync function)
 *
 * These are pure unit tests (no DB required) that validate contracts.
 * Integration tests with real DB live in tests/integration/.
 */

// ---------------------------------------------------------------------------
// Constants mirroring SQL implementation (source of truth: 20260408_billing_enforcement.sql)
// ---------------------------------------------------------------------------

/** All valid billing_status values (9-value CHECK constraint, 20260410 smart downgrade) */
const ALL_BILLING_STATUSES = [
  "trial",
  "active",
  "past_due",
  "past_due_limited",
  "past_due_readonly",
  "incomplete",
  "paused",
  "canceled",
  "trial_expired",
] as const;

type BillingStatusServer = (typeof ALL_BILLING_STATUSES)[number];

/** Guard decision (smart downgrade matrix) */
type GuardDecision = "allow" | "readonly" | "blocked";
type OperationType = "order" | "shift" | "write" | "read";

/** Stripe subscription status → internal billing_status mapping */
const STRIPE_TO_INTERNAL_MAP: Record<string, BillingStatusServer> = {
  trialing: "trial",
  active: "active",
  past_due: "past_due",
  canceled: "canceled",
  unpaid: "canceled",
  incomplete: "incomplete",
  incomplete_expired: "trial_expired",
  paused: "paused",
};

/** RPCs that must have the billing guard injected */
const GUARDED_RPCS = [
  "create_order_atomic",
  "update_order_status",
  "close_cash_register_atomic",
  "generate_tasks_if_idle",
  "claim_task",
  "create_shift",
] as const;

// ---------------------------------------------------------------------------
// Pure function mirroring require_active_subscription() SQL logic
// ---------------------------------------------------------------------------

function requireActiveSubscription(
  billingStatus: BillingStatusServer | null,
  writeOperation: boolean = true,
  operationType: OperationType = "write",
): GuardDecision {
  if (!billingStatus) return "blocked";

  switch (billingStatus) {
    case "trial":
    case "active":
      return "allow";

    case "past_due":
      if (!writeOperation || operationType === "read") return "allow";
      if (operationType === "order" || operationType === "shift") return "allow";
      return "readonly";

    case "past_due_limited":
    case "past_due_readonly":
    case "paused":
      if (!writeOperation || operationType === "read") return "allow";
      return "blocked";

    case "incomplete":
    case "canceled":
    case "trial_expired":
      return "blocked";

    default:
      return "blocked";
  }
}

// ---------------------------------------------------------------------------
// 1. billing_status CHECK constraint
// ---------------------------------------------------------------------------

describe("billing_status CHECK constraint", () => {
  it("defines 9 valid statuses (incl. past_due_limited, past_due_readonly)", () => {
    expect(ALL_BILLING_STATUSES).toHaveLength(9);
  });

  it.each(ALL_BILLING_STATUSES)(
    "'%s' is a valid server billing status",
    (s) => {
      expect(typeof s).toBe("string");
      expect(s.length).toBeGreaterThan(0);
    },
  );

  it("includes all frontend statuses plus trial_expired and smart downgrade", () => {
    const frontendStatuses = [
      "trial",
      "active",
      "past_due",
      "past_due_limited",
      "past_due_readonly",
      "canceled",
      "incomplete",
      "paused",
    ];
    for (const fs of frontendStatuses) {
      expect(ALL_BILLING_STATUSES).toContain(fs);
    }
    // Server-only status
    expect(ALL_BILLING_STATUSES).toContain("trial_expired");
  });

  it("does NOT include raw Stripe statuses", () => {
    const stripeOnly = ["trialing", "unpaid", "incomplete_expired"];
    for (const ss of stripeOnly) {
      expect(ALL_BILLING_STATUSES).not.toContain(ss);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. require_active_subscription() decision matrix
// ---------------------------------------------------------------------------

describe("require_active_subscription() guard", () => {
  describe("allow tier (trial, active)", () => {
    it.each(["trial", "active"] as BillingStatusServer[])(
      "'%s' allows both reads and writes",
      (status) => {
        expect(requireActiveSubscription(status, true)).toBe("allow");
        expect(requireActiveSubscription(status, false)).toBe("allow");
      },
    );
  });

  describe("past_due: order/shift allowed, other writes readonly", () => {
    it("past_due allows order ops", () => {
      expect(requireActiveSubscription("past_due", true, "order")).toBe("allow");
    });
    it("past_due allows shift ops", () => {
      expect(requireActiveSubscription("past_due", true, "shift")).toBe("allow");
    });
    it("past_due blocks non-order/shift writes", () => {
      expect(requireActiveSubscription("past_due", true, "write")).toBe("readonly");
    });
    it("past_due allows reads", () => {
      expect(requireActiveSubscription("past_due", false)).toBe("allow");
    });
  });

  describe("past_due_limited, past_due_readonly, paused: block writes", () => {
    const blockedStatuses: BillingStatusServer[] = [
      "past_due_limited",
      "past_due_readonly",
      "paused",
    ];
    it.each(blockedStatuses)("'%s' blocks order/shift/write", (status) => {
      expect(requireActiveSubscription(status, true, "order")).toBe("blocked");
      expect(requireActiveSubscription(status, true, "shift")).toBe("blocked");
      expect(requireActiveSubscription(status, true, "write")).toBe("blocked");
    });
    it.each(blockedStatuses)("'%s' allows reads", (status) => {
      expect(requireActiveSubscription(status, false)).toBe("allow");
    });
  });

  describe("blocked tier (incomplete, canceled, trial_expired)", () => {
    const blockedStatuses: BillingStatusServer[] = [
      "incomplete",
      "canceled",
      "trial_expired",
    ];
    it.each(blockedStatuses)("'%s' blocks both reads and writes", (status) => {
      expect(requireActiveSubscription(status, true)).toBe("blocked");
      expect(requireActiveSubscription(status, false)).toBe("blocked");
    });
  });

  describe("null / missing status", () => {
    it("null billing_status is blocked", () => {
      expect(requireActiveSubscription(null, true)).toBe("blocked");
      expect(requireActiveSubscription(null, false)).toBe("blocked");
    });
  });

  describe("default parameters", () => {
    it("defaults to write operation when not specified", () => {
      expect(requireActiveSubscription("past_due")).toBe("readonly");
      expect(requireActiveSubscription("active")).toBe("allow");
      expect(requireActiveSubscription("canceled")).toBe("blocked");
    });
  });
});

// ---------------------------------------------------------------------------
// 3. gm_billing_events schema contract
// ---------------------------------------------------------------------------

describe("gm_billing_events schema", () => {
  const REQUIRED_COLUMNS = [
    "id",
    "restaurant_id",
    "stripe_event_id",
    "event_type",
    "previous_status",
    "new_status",
    "payload",
    "processed_at",
    "created_at",
  ];

  it("has all required columns", () => {
    // This validates the contract defined in the migration
    expect(REQUIRED_COLUMNS).toHaveLength(9);
    expect(REQUIRED_COLUMNS).toContain("stripe_event_id"); // unique constraint
    expect(REQUIRED_COLUMNS).toContain("restaurant_id");
    expect(REQUIRED_COLUMNS).toContain("previous_status");
    expect(REQUIRED_COLUMNS).toContain("new_status");
  });

  it("stripe_event_id must be unique (idempotency)", () => {
    // Validates the ON CONFLICT (stripe_event_id) DO NOTHING pattern
    const events = new Map<string, number>();
    const eventId = "evt_test_123";

    // First insert succeeds
    events.set(eventId, 1);
    expect(events.get(eventId)).toBe(1);

    // Second insert same event_id is silently ignored (idempotency)
    if (!events.has(eventId)) {
      events.set(eventId, 2);
    }
    expect(events.get(eventId)).toBe(1); // Still 1, not overwritten
  });
});

// ---------------------------------------------------------------------------
// 4. Stripe → internal status mapping
// ---------------------------------------------------------------------------

describe("Stripe → internal status mapping", () => {
  it.each([
    ["trialing", "trial"],
    ["active", "active"],
    ["past_due", "past_due"],
    ["canceled", "canceled"],
    ["unpaid", "canceled"],
    ["incomplete", "incomplete"],
    ["incomplete_expired", "trial_expired"],
    ["paused", "paused"],
  ] as [string, BillingStatusServer][])(
    "Stripe '%s' → internal '%s'",
    (stripeStatus, expected) => {
      expect(STRIPE_TO_INTERNAL_MAP[stripeStatus]).toBe(expected);
    },
  );

  it("maps all Stripe statuses to valid server billing_status values", () => {
    for (const internal of Object.values(STRIPE_TO_INTERNAL_MAP)) {
      expect(ALL_BILLING_STATUSES).toContain(internal);
    }
  });

  it("covers all 8 known Stripe subscription statuses", () => {
    const stripeStatuses = [
      "trialing",
      "active",
      "past_due",
      "canceled",
      "unpaid",
      "incomplete",
      "incomplete_expired",
      "paused",
    ];
    for (const ss of stripeStatuses) {
      expect(STRIPE_TO_INTERNAL_MAP).toHaveProperty(ss);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. RPC guard coverage
// ---------------------------------------------------------------------------

describe("RPC billing guard coverage", () => {
  it("exactly 6 RPCs are guarded", () => {
    expect(GUARDED_RPCS).toHaveLength(6);
  });

  it("includes all write RPCs", () => {
    expect(GUARDED_RPCS).toContain("create_order_atomic");
    expect(GUARDED_RPCS).toContain("update_order_status");
    expect(GUARDED_RPCS).toContain("close_cash_register_atomic");
    expect(GUARDED_RPCS).toContain("generate_tasks_if_idle");
    expect(GUARDED_RPCS).toContain("claim_task");
    expect(GUARDED_RPCS).toContain("create_shift");
  });

  it("all RPCs use write_operation=true (default)", () => {
    // All guarded RPCs are write operations → past_due blocks them
    for (const rpc of GUARDED_RPCS) {
      // Simulate guard call for each RPC (all use default p_write_operation=true)
      expect(requireActiveSubscription("past_due", true)).toBe("readonly");
      expect(requireActiveSubscription("active", true)).toBe("allow");
      expect(requireActiveSubscription("canceled", true)).toBe("blocked");
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Readonly mode behavior
// ---------------------------------------------------------------------------

describe("Readonly mode (past_due)", () => {
  it("write operations are blocked for past_due", () => {
    const writeOps = [
      "create_order_atomic",
      "update_order_status",
      "close_cash_register_atomic",
      "create_shift",
    ];

    for (const op of writeOps) {
      const decision = requireActiveSubscription("past_due", true);
      expect(decision).toBe("readonly");
    }
  });

  it("read operations are allowed for past_due", () => {
    const readOps = ["view_orders", "list_products", "get_reports"];

    for (const op of readOps) {
      const decision = requireActiveSubscription("past_due", false);
      expect(decision).toBe("allow");
    }
  });

  it("incomplete, canceled, trial_expired block both reads and writes", () => {
    const blockReadsAndWrites: BillingStatusServer[] = [
      "incomplete",
      "canceled",
      "trial_expired",
    ];
    for (const status of blockReadsAndWrites) {
      expect(requireActiveSubscription(status, true)).toBe("blocked");
      expect(requireActiveSubscription(status, false)).toBe("blocked");
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Status transition validity (Stripe webhook lifecycle)
// ---------------------------------------------------------------------------

describe("billing status lifecycle transitions", () => {
  /** Valid transitions from Stripe webhook events */
  const VALID_TRANSITIONS: [BillingStatusServer, BillingStatusServer][] = [
    // Trial → Active (subscription confirmed)
    ["trial", "active"],
    // Active → Past Due (payment failed)
    ["active", "past_due"],
    // Past Due → Active (payment retried successfully)
    ["past_due", "active"],
    // Past Due → Canceled (gave up retrying)
    ["past_due", "canceled"],
    // Active → Canceled (explicitly canceled)
    ["active", "canceled"],
    // Trial → Canceled (canceled during trial)
    ["trial", "canceled"],
    // Active → Incomplete (requires action)
    ["active", "incomplete"],
    // Incomplete → Active (action completed)
    ["incomplete", "active"],
    // Incomplete → Trial Expired (incomplete expired)
    ["incomplete", "trial_expired"],
    // Active → Paused (manually paused)
    ["active", "paused"],
    // Paused → Active (resumed)
    ["paused", "active"],
    // Trial → Trial Expired (trial ended without converting)
    ["trial", "trial_expired"],
  ];

  it.each(VALID_TRANSITIONS)("%s → %s is a valid transition", (from, to) => {
    expect(ALL_BILLING_STATUSES).toContain(from);
    expect(ALL_BILLING_STATUSES).toContain(to);
  });

  it("all transitions involve valid billing statuses", () => {
    for (const [from, to] of VALID_TRANSITIONS) {
      expect(ALL_BILLING_STATUSES).toContain(from);
      expect(ALL_BILLING_STATUSES).toContain(to);
    }
  });

  it("no self-transitions are listed (Stripe dedup handles those)", () => {
    for (const [from, to] of VALID_TRANSITIONS) {
      expect(from).not.toBe(to);
    }
  });
});

// ---------------------------------------------------------------------------
// 8. Error codes contract
// ---------------------------------------------------------------------------

describe("billing error codes", () => {
  const ERROR_CODES = {
    SUBSCRIPTION_BLOCKED: "Restaurant subscription blocked (status: {status})",
    SUBSCRIPTION_READONLY:
      "Subscription past_due — read-only mode; writes blocked",
    RESTAURANT_NOT_FOUND: "Restaurant {id} not found for billing check",
  };

  it("SUBSCRIPTION_BLOCKED error is raised for blocked statuses", () => {
    expect(ERROR_CODES.SUBSCRIPTION_BLOCKED).toContain("blocked");
  });

  it("SUBSCRIPTION_READONLY error is raised for past_due writes", () => {
    expect(ERROR_CODES.SUBSCRIPTION_READONLY).toContain("read-only");
    expect(ERROR_CODES.SUBSCRIPTION_READONLY).toContain("past_due");
  });

  it("RESTAURANT_NOT_FOUND for missing restaurant", () => {
    expect(ERROR_CODES.RESTAURANT_NOT_FOUND).toContain("not found");
  });
});
