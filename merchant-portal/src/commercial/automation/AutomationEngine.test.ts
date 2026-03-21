/**
 * AutomationEngine v4 — unit tests
 *
 * Tests the core orchestrator: dedupe gate, evaluator failures,
 * dispatch adapter calls, and multi-trigger behaviour.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { AutomationEngine } from "./AutomationEngine";
import type {
  AutomationDispatchAdapter,
  AutomationDispatchPayload,
  TriggerEvaluationResult,
  TriggerEvaluator,
} from "./types";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const DEDUPE_KEY = "test_engine_dedupe";

function makeAdapter(): {
  adapter: AutomationDispatchAdapter;
  calls: AutomationDispatchPayload[];
} {
  const calls: AutomationDispatchPayload[] = [];
  return {
    adapter: {
      async dispatch(payload) {
        calls.push(payload);
      },
    },
    calls,
  };
}

function makeEvaluator(
  trigger: string,
  result: TriggerEvaluationResult,
): TriggerEvaluator<unknown> {
  return {
    trigger: trigger as never,
    evaluate: vi.fn(() => result),
  };
}

function makeFireResult(
  overrides?: Partial<{ dedupeKey: string; score: number }>,
) {
  return {
    shouldFire: true,
    dedupeKey: overrides?.dedupeKey ?? "fire:key:1",
    payload: {
      restaurant_id: "11111111-1111-4111-8111-111111111111",
      trigger: "activation_velocity_low" as const,
      score: overrides?.score ?? 25,
      classification: "Slow activators" as const,
      recommended_action: {
        title: "Test action",
        reason: "Test reason",
        automation: "test_automation",
      },
    },
  } satisfies TriggerEvaluationResult;
}

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

let store: Record<string, string> = {};
beforeEach(() => {
  store = {};
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AutomationEngine", () => {
  it("dispatches when evaluator says shouldFire=true", async () => {
    const { adapter, calls } = makeAdapter();
    const engine = new AutomationEngine(adapter, {
      dedupeStorageKey: DEDUPE_KEY,
      maxDedupeEntries: 100,
    });
    engine.register(makeEvaluator("activation_velocity_low", makeFireResult()));

    const dispatched = await engine.run({});
    expect(calls).toHaveLength(1);
    expect(calls[0].trigger).toBe("activation_velocity_low");
    expect(calls[0].idempotency_key).toBe("fire:key:1");
    expect(dispatched).toEqual(["fire:key:1"]);
  });

  it("does NOT dispatch when evaluator says shouldFire=false", async () => {
    const { adapter, calls } = makeAdapter();
    const engine = new AutomationEngine(adapter, {
      dedupeStorageKey: DEDUPE_KEY,
      maxDedupeEntries: 100,
    });
    engine.register(
      makeEvaluator("activation_velocity_low", { shouldFire: false }),
    );

    await engine.run({});
    expect(calls).toHaveLength(0);
  });

  it("deduplicates: same dedupeKey does NOT dispatch twice", async () => {
    const { adapter, calls } = makeAdapter();
    const engine = new AutomationEngine(adapter, {
      dedupeStorageKey: DEDUPE_KEY,
      maxDedupeEntries: 100,
    });
    engine.register(makeEvaluator("activation_velocity_low", makeFireResult()));

    await engine.run({});
    await engine.run({});

    expect(calls).toHaveLength(1);
  });

  it("dispatches different dedupeKeys independently", async () => {
    const { adapter, calls } = makeAdapter();
    const engine = new AutomationEngine(adapter, {
      dedupeStorageKey: DEDUPE_KEY,
      maxDedupeEntries: 100,
    });
    const ev1 = makeEvaluator(
      "activation_velocity_low",
      makeFireResult({ dedupeKey: "key1" }),
    );
    engine.register(ev1);

    await engine.run({});

    // Swap to a different dedupeKey
    (ev1.evaluate as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      makeFireResult({ dedupeKey: "key2" }),
    );
    await engine.run({});

    expect(calls).toHaveLength(2);
    expect(calls[0].idempotency_key).toBe("key1");
    expect(calls[1].idempotency_key).toBe("key2");
  });

  it("handles multiple registered evaluators, dispatching each once", async () => {
    const { adapter, calls } = makeAdapter();
    const engine = new AutomationEngine(adapter, {
      dedupeStorageKey: DEDUPE_KEY,
      maxDedupeEntries: 100,
    });
    engine
      .register(
        makeEvaluator(
          "activation_velocity_low",
          makeFireResult({ dedupeKey: "act:1" }),
        ),
      )
      .register(
        makeEvaluator("churn_risk", {
          shouldFire: true,
          dedupeKey: "churn:1",
          payload: {
            restaurant_id: "11111111-1111-4111-8111-111111111111",
            trigger: "churn_risk",
            score: 75,
            classification: "Stalled",
            recommended_action: {
              title: "Reactivação urgente",
              reason: "Stalled",
              automation: "churn_reactivation_urgent",
            },
          },
        }),
      );

    const dispatched = await engine.run({});
    expect(calls).toHaveLength(2);
    expect(dispatched).toContain("act:1");
    expect(dispatched).toContain("churn:1");
  });

  it("continues if an evaluator throws", async () => {
    const { adapter, calls } = makeAdapter();
    const engine = new AutomationEngine(adapter, {
      dedupeStorageKey: DEDUPE_KEY,
      maxDedupeEntries: 100,
    });
    const badEval: TriggerEvaluator<unknown> = {
      trigger: "activation_velocity_low",
      evaluate: vi.fn(() => {
        throw new Error("boom");
      }),
    };
    const goodEval = makeEvaluator("churn_risk", {
      shouldFire: true,
      dedupeKey: "good:1",
      payload: {
        restaurant_id: "11111111-1111-4111-8111-111111111111",
        trigger: "churn_risk",
        score: 80,
        classification: "Stalled",
        recommended_action: { title: "T", reason: "R", automation: "A" },
      },
    });
    engine.register(badEval).register(goodEval);

    const dispatched = await engine.run({});
    expect(dispatched).toEqual(["good:1"]);
    expect(calls).toHaveLength(1);
  });

  it("marks dedupeKey even when dispatch fails", async () => {
    let callCount = 0;
    const failingAdapter: AutomationDispatchAdapter = {
      async dispatch() {
        callCount++;
        throw new Error("network error");
      },
    };
    const engine = new AutomationEngine(failingAdapter, {
      dedupeStorageKey: DEDUPE_KEY,
      maxDedupeEntries: 100,
    });
    engine.register(makeEvaluator("activation_velocity_low", makeFireResult()));

    // First run — dispatch fails but key is written
    await engine.run({});
    expect(callCount).toBe(1);

    // Second run — key already in dedupe, dispatch NOT called again
    await engine.run({});
    expect(callCount).toBe(1);
  });

  it("supports chaining register()", () => {
    const { adapter } = makeAdapter();
    const engine = new AutomationEngine(adapter, {
      dedupeStorageKey: DEDUPE_KEY,
      maxDedupeEntries: 100,
    });
    const result = engine.register(
      makeEvaluator("activation_velocity_low", { shouldFire: false }),
    );
    expect(result).toBe(engine);
  });
});
