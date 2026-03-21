/**
 * Automation Engine v4 — Platform Core
 *
 * Generic, trigger-agnostic orchestrator.
 * Responsibilities:
 *   1. Deduplicate: check localStorage before evaluating
 *   2. Evaluate: run all registered TriggerEvaluators
 *   3. Dispatch: call the adapter for each payload that should fire
 *   4. Record: write dedupe keys to storage to prevent re-dispatch
 *
 * Usage:
 *   const engine = new AutomationEngine(adapter, config);
 *   engine.register(new ActivationVelocityEvaluator());
 *   engine.register(new ChurnRiskEvaluator());
 *
 *   // on every commercial event:
 *   await engine.run({ events });
 */

import type {
  AutomationDispatchAdapter,
  AutomationEngineConfig,
  TriggerEvaluator,
} from "./types";
import { DEFAULT_ENGINE_CONFIG } from "./types";

// ---------------------------------------------------------------------------
// localStorage storage (thin wrapper — never throws)
// ---------------------------------------------------------------------------

function readDedupeSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === "string"));
  } catch {
    return new Set();
  }
}

function writeDedupeSet(key: string, values: Set<string>, max: number): void {
  try {
    const arr = Array.from(values).slice(-max);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {
    // Quota exceeded or private mode — ignore
  }
}

// ---------------------------------------------------------------------------
// Gateway dispatch adapter (default production implementation)
// ---------------------------------------------------------------------------

const DEFAULT_INTERNAL_TOKEN = "chefiapp-internal-token-dev";

function resolveDispatchUrl(apiBase: string): string {
  const base = apiBase.replace(/\/+$/, "");
  const isEdge = base.includes("supabase.co/functions/v1");
  const isLocal =
    base === "http://localhost:4320" || base === "http://127.0.0.1:4320";
  const path = isEdge ? "automation-dispatch" : "internal/automation/dispatch";
  return isLocal ? `/${path}` : `${base}/${path}`;
}

export function createGatewayDispatchAdapter(
  apiBase: string,
  internalToken: string,
): AutomationDispatchAdapter {
  const url = resolveDispatchUrl(apiBase);
  return {
    async dispatch(payload) {
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": internalToken,
          "X-Idempotency-Key": payload.idempotency_key,
        },
        body: JSON.stringify(payload),
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEvaluator = TriggerEvaluator<any>;

export class AutomationEngine {
  private evaluators: AnyEvaluator[] = [];
  private readonly adapter: AutomationDispatchAdapter;
  private readonly config: AutomationEngineConfig;

  constructor(
    adapter: AutomationDispatchAdapter,
    config: AutomationEngineConfig = DEFAULT_ENGINE_CONFIG,
  ) {
    this.adapter = adapter;
    this.config = config;
  }

  /** Register a trigger evaluator. Call once per trigger type. */
  register(evaluator: AnyEvaluator): this {
    this.evaluators.push(evaluator);
    return this;
  }

  /**
   * Run all evaluators against the given context.
   * Context is passed as-is to each evaluator — each evaluator
   * extracts what it needs (duck-typing).
   *
   * Returns the list of dedupeKeys that were dispatched this run.
   */
  async run(context: unknown): Promise<string[]> {
    const dedupe = readDedupeSet(this.config.dedupeStorageKey);
    const dispatched: string[] = [];

    for (const evaluator of this.evaluators) {
      let result;
      try {
        result = evaluator.evaluate(context);
      } catch {
        // Evaluator errors must never break UX
        continue;
      }

      if (!result.shouldFire) continue;
      if (dedupe.has(result.dedupeKey)) continue;

      // Mark dedupe immediately (before dispatch) to prevent race
      dedupe.add(result.dedupeKey);
      writeDedupeSet(
        this.config.dedupeStorageKey,
        dedupe,
        this.config.maxDedupeEntries,
      );

      try {
        await this.adapter.dispatch({
          ...result.payload,
          idempotency_key: result.dedupeKey,
        });
        dispatched.push(result.dedupeKey);
      } catch {
        // Dispatch failure is best-effort — dedupe still recorded
      }
    }

    return dispatched;
  }
}
