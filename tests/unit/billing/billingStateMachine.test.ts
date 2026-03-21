import {
  ACTIVE_STATES,
  ALLOWED_TRANSITIONS,
  ALL_BILLING_STATES,
  BLOCKED_STATES,
  LIMITED_STATES,
  READONLY_STATES,
  SAFE_HARBOR_SURFACES,
  STRIPE_STATUS_MAP,
  WARNING_STATES,
  canTransition,
  getEnforcementLevel,
  isBillingState,
  isOperationAllowed,
  isOperationalAllowed,
  mapStripeStatus,
  normalizeLegacyStatus,
  type BillingState,
  type OperationType,
  type Surface,
} from "../../../billing-core/billingStateMachine";
import {
  SubscriptionBlockedError,
  assertOperationalAllowed,
  assertRpcAllowed,
  checkOperationalAllowed,
  getOperationForRpc,
} from "../../../server/billing/enforcementGuard";

describe("billingStateMachine", () => {
  it("contains all 9 canonical billing states", () => {
    const expected: BillingState[] = [
      "trial",
      "trial_expired",
      "active",
      "past_due",
      "past_due_limited",
      "past_due_readonly",
      "canceled",
      "incomplete",
      "paused",
    ];

    expect(ALL_BILLING_STATES).toHaveLength(9);
    expect(ALL_BILLING_STATES).toEqual(expect.arrayContaining(expected));
  });

  it("defines non-overlapping state groups", () => {
    const allGrouped = [
      ...ACTIVE_STATES,
      ...WARNING_STATES,
      ...LIMITED_STATES,
      ...READONLY_STATES,
      ...BLOCKED_STATES,
    ];

    expect(new Set(allGrouped).size).toBe(allGrouped.length);
    expect(new Set(allGrouped).size).toBe(ALL_BILLING_STATES.length);
  });

  it.each<[BillingState, string]>([
    ["trial", "full"],
    ["active", "full"],
    ["past_due", "warning"],
    ["past_due_limited", "limited"],
    ["past_due_readonly", "readonly"],
    ["trial_expired", "blocked"],
    ["canceled", "blocked"],
    ["incomplete", "blocked"],
    ["paused", "blocked"],
  ])("maps %s -> %s enforcement", (status, expected) => {
    expect(getEnforcementLevel(status)).toBe(expected);
  });

  it("allows identity transitions for all states (idempotency)", () => {
    for (const state of ALL_BILLING_STATES) {
      expect(canTransition(state, state)).toBe(true);
    }
  });

  it("allows all declared transitions", () => {
    for (const from of ALL_BILLING_STATES) {
      for (const to of ALLOWED_TRANSITIONS[from]) {
        expect(canTransition(from, to)).toBe(true);
      }
    }
  });

  it("rejects undeclared transitions", () => {
    expect(canTransition("trial", "paused")).toBe(false);
    expect(canTransition("paused", "past_due")).toBe(false);
    expect(canTransition("past_due_readonly", "past_due")).toBe(false);
    expect(canTransition("trial_expired", "paused")).toBe(false);
  });

  describe("surface enforcement", () => {
    const nonSafeHarborSurfaces: Surface[] = [
      "TPV",
      "KDS",
      "DASHBOARD",
      "WORKFORCE",
      "API",
    ];

    it("always allows safe-harbor surfaces", () => {
      for (const state of ALL_BILLING_STATES) {
        for (const surface of SAFE_HARBOR_SURFACES) {
          expect(isOperationalAllowed(state, surface)).toBe(true);
        }
      }
    });

    it("allows all non-safe-harbor surfaces in full and warning levels", () => {
      const fullOrWarning: BillingState[] = ["trial", "active", "past_due"];
      for (const state of fullOrWarning) {
        for (const surface of nonSafeHarborSurfaces) {
          expect(isOperationalAllowed(state, surface)).toBe(true);
        }
      }
    });

    it("allows only DASHBOARD in limited and readonly levels", () => {
      const constrained: BillingState[] = [
        "past_due_limited",
        "past_due_readonly",
      ];
      for (const state of constrained) {
        expect(isOperationalAllowed(state, "DASHBOARD")).toBe(true);
        expect(isOperationalAllowed(state, "TPV")).toBe(false);
        expect(isOperationalAllowed(state, "KDS")).toBe(false);
        expect(isOperationalAllowed(state, "WORKFORCE")).toBe(false);
        expect(isOperationalAllowed(state, "API")).toBe(false);
      }
    });

    it.each<BillingState>([
      "trial_expired",
      "canceled",
      "incomplete",
      "paused",
    ])("blocks operational surfaces in blocked state %s", (state) => {
      for (const surface of nonSafeHarborSurfaces) {
        expect(isOperationalAllowed(state, surface)).toBe(false);
      }
    });
  });

  describe("operation enforcement", () => {
    const writeOps: OperationType[] = [
      "create_order",
      "update_order",
      "close_register",
      "claim_task",
      "generate_tasks",
      "create_shift",
    ];

    it.each<BillingState>(["trial", "active", "past_due"])(
      "allows all operations in %s",
      (state) => {
        for (const op of writeOps) {
          expect(isOperationAllowed(state, op)).toBe(true);
        }
        expect(isOperationAllowed(state, "read_data")).toBe(true);
      },
    );

    it.each<BillingState>(["past_due_limited", "past_due_readonly"])(
      "allows only read_data in %s",
      (state) => {
        for (const op of writeOps) {
          expect(isOperationAllowed(state, op)).toBe(false);
        }
        expect(isOperationAllowed(state, "read_data")).toBe(true);
      },
    );

    it.each<BillingState>([
      "trial_expired",
      "canceled",
      "incomplete",
      "paused",
    ])("allows no operations in %s", (state) => {
      for (const op of [...writeOps, "read_data"] as OperationType[]) {
        expect(isOperationAllowed(state, op)).toBe(false);
      }
    });
  });

  describe("Stripe + legacy mapping", () => {
    it("keeps canonical Stripe mapping", () => {
      expect(STRIPE_STATUS_MAP.trialing).toBe("trial");
      expect(STRIPE_STATUS_MAP.active).toBe("active");
      expect(STRIPE_STATUS_MAP.past_due).toBe("past_due");
      expect(STRIPE_STATUS_MAP.unpaid).toBe("canceled");
      expect(STRIPE_STATUS_MAP.incomplete).toBe("incomplete");
      expect(STRIPE_STATUS_MAP.incomplete_expired).toBe("trial_expired");
      expect(STRIPE_STATUS_MAP.paused).toBe("paused");
      expect(STRIPE_STATUS_MAP.canceled).toBe("canceled");
      expect(STRIPE_STATUS_MAP.cancelled).toBe("canceled");
    });

    it("maps unknown Stripe statuses to trial", () => {
      expect(mapStripeStatus("UNKNOWN_STATUS")).toBe("trial");
    });

    it("normalizes legacy and uppercase statuses", () => {
      expect(normalizeLegacyStatus("trialing")).toBe("trial");
      expect(normalizeLegacyStatus("TRIAL")).toBe("trial");
      expect(normalizeLegacyStatus("ACTIVE")).toBe("active");
      expect(normalizeLegacyStatus("PAST_DUE")).toBe("past_due");
      expect(normalizeLegacyStatus("SUSPENDED")).toBe("paused");
      expect(normalizeLegacyStatus("CANCELLED")).toBe("canceled");
      expect(normalizeLegacyStatus("non-existent")).toBe("trial");
    });
  });

  describe("type guard", () => {
    it.each(ALL_BILLING_STATES)("accepts canonical state %s", (value) => {
      expect(isBillingState(value)).toBe(true);
    });

    it.each(["trialing", "suspended", "readonly", "", "TRIAL"])(
      "rejects invalid state %s",
      (value) => {
        expect(isBillingState(value)).toBe(false);
      },
    );
  });
});

describe("enforcementGuard", () => {
  it("maps guarded RPCs to operation types", () => {
    expect(getOperationForRpc("create_order_atomic")).toBe("create_order");
    expect(getOperationForRpc("update_order_status")).toBe("update_order");
    expect(getOperationForRpc("close_cash_register_atomic")).toBe(
      "close_register",
    );
    expect(getOperationForRpc("claim_task")).toBe("claim_task");
    expect(getOperationForRpc("generate_tasks_if_idle")).toBe("generate_tasks");
    expect(getOperationForRpc("create_shift")).toBe("create_shift");
    expect(getOperationForRpc("non_guarded_rpc")).toBeNull();
  });

  it("allows write operation for active status", () => {
    expect(() =>
      assertOperationalAllowed("active", "create_order"),
    ).not.toThrow();
  });

  it("blocks write operation in readonly/limited states with readonly code", () => {
    expect(() =>
      assertOperationalAllowed("past_due_limited", "create_order"),
    ).toThrow(SubscriptionBlockedError);

    try {
      assertOperationalAllowed("past_due_readonly", "update_order");
      fail("expected SubscriptionBlockedError");
    } catch (error) {
      expect(error).toBeInstanceOf(SubscriptionBlockedError);
      const typed = error as SubscriptionBlockedError;
      expect(typed.code).toBe("SUBSCRIPTION_READONLY");
      expect(typed.status).toBe("past_due_readonly");
      expect(typed.enforcementLevel).toBe("readonly");
    }
  });

  it("blocks operations in blocked states with blocked code", () => {
    expect(() => assertOperationalAllowed("canceled", "read_data")).toThrow(
      SubscriptionBlockedError,
    );

    try {
      assertOperationalAllowed("paused", "create_shift");
      fail("expected SubscriptionBlockedError");
    } catch (error) {
      const typed = error as SubscriptionBlockedError;
      expect(typed.code).toBe("SUBSCRIPTION_BLOCKED");
      expect(typed.status).toBe("paused");
      expect(typed.enforcementLevel).toBe("blocked");
    }
  });

  it("fails closed on unknown status", () => {
    expect(() => assertOperationalAllowed("mystery", "create_order")).toThrow(
      SubscriptionBlockedError,
    );

    const result = checkOperationalAllowed("mystery", "create_order");
    expect(result).toMatchObject({
      code: "SUBSCRIPTION_BLOCKED",
      enforcementLevel: "blocked",
    });
  });

  it("assertRpcAllowed gates known RPCs and bypasses unknown RPCs", () => {
    expect(() =>
      assertRpcAllowed("active", "create_order_atomic"),
    ).not.toThrow();
    expect(() => assertRpcAllowed("active", "non_guarded_rpc")).not.toThrow();
    expect(() => assertRpcAllowed("canceled", "create_order_atomic")).toThrow(
      SubscriptionBlockedError,
    );
  });

  it("checkOperationalAllowed returns null when allowed and error object when blocked", () => {
    expect(checkOperationalAllowed("active", "create_order")).toBeNull();

    const result = checkOperationalAllowed("canceled", "create_order");
    expect(result).toEqual({
      code: "SUBSCRIPTION_BLOCKED",
      status: "canceled",
      enforcementLevel: "blocked",
      message:
        'Operation "create_order" is not allowed in billing state "canceled" (enforcement: blocked).',
    });
  });
});
