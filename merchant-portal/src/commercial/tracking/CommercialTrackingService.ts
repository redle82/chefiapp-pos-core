/**
 * CommercialTrackingService
 *
 * Centralised event tracker for the commercial funnel.
 *
 * Modes:
 *   DEV   → console.info + localStorage buffer
 *   PROD  → delegates to a pluggable provider (PostHog / GA4 / custom)
 *            When no provider is registered, events are buffered in localStorage.
 *
 * Feature-flagged: all public methods are no-ops when the flag is off.
 *
 * Ref: docs/commercial/TRACKING_EVENTS_SPEC.md
 */

import { CONFIG } from "../../config";
import {
  ActivationVelocityEvaluator,
  AutomationEngine,
  ChurnRiskEvaluator,
  createGatewayDispatchAdapter,
} from "../automation";
import {
  isActivationAutomationDispatchEnabled,
  isActivationAutomationEnabled,
  isChurnRiskAutomationEnabled,
  isCommercialTrackingEnabled,
} from "./flag";
import {
  buildCommercialFunnelSnapshotCsv,
  computeCommercialFunnelMetrics,
  computeCommercialFunnelSegmentation,
  type CommercialFunnelMetrics,
  type CommercialFunnelSegmentation,
} from "./funnelMetrics";
import { applyScore } from "./leadScoring";
import { persistCommercialEvent } from "./persistCommercialEvent";
import type { CommercialEvent, CommercialEventName } from "./types";

// ---------------------------------------------------------------------------
// Provider interface (pluggable — PostHog, GA4, etc.)
// ---------------------------------------------------------------------------

export interface TrackingProvider {
  /** Identify — optional alias for provider's track method */
  track(event: CommercialEvent): void;
}

// ---------------------------------------------------------------------------
// localStorage buffer
// ---------------------------------------------------------------------------

const BUFFER_KEY = "chefiapp_commercial_tracking_buffer";
const MAX_BUFFER = 500;
const AUTOMATION_DEDUPE_KEY = "chefiapp_activation_automation_dedupe";
const DEFAULT_INTERNAL_TOKEN = "chefiapp-internal-token-dev";

// ---------------------------------------------------------------------------
// Automation Engine v4 — lazy singleton
// ---------------------------------------------------------------------------

let _automationEngine: AutomationEngine | null = null;

function getAutomationEngine(): AutomationEngine {
  if (_automationEngine) return _automationEngine;

  const rawBase = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
  const apiBase = rawBase.replace(/\/+$/, "");
  const internalToken =
    (import.meta.env.VITE_INTERNAL_API_TOKEN as string | undefined) ??
    DEFAULT_INTERNAL_TOKEN;

  const adapter = createGatewayDispatchAdapter(apiBase, internalToken);

  _automationEngine = new AutomationEngine(adapter)
    .register(new ActivationVelocityEvaluator())
    .register(new ChurnRiskEvaluator());

  return _automationEngine;
}

/** Reset engine singleton (used in tests) */
export function resetAutomationEngine(): void {
  _automationEngine = null;
}

function readBuffer(): CommercialEvent[] {
  try {
    const raw = localStorage.getItem(BUFFER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBuffer(events: CommercialEvent[]): void {
  try {
    localStorage.setItem(BUFFER_KEY, JSON.stringify(events.slice(-MAX_BUFFER)));
  } catch {
    // Quota exceeded or private mode — ignore
  }
}

function readAutomationDedupe(): string[] {
  try {
    const raw = localStorage.getItem(AUTOMATION_DEDUPE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function writeAutomationDedupe(values: string[]): void {
  try {
    localStorage.setItem(
      AUTOMATION_DEDUPE_KEY,
      JSON.stringify(values.slice(-100)),
    );
  } catch {
    // ignore
  }
}

function findRestaurantId(events: CommercialEvent[]): string | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (
      "restaurant_id" in event &&
      typeof event.restaurant_id === "string" &&
      event.restaurant_id.trim().length > 0
    ) {
      return event.restaurant_id;
    }
  }
  return null;
}

function toIdempotencyPart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .slice(0, 48);
}

// ---------------------------------------------------------------------------
// Service singleton
// ---------------------------------------------------------------------------

class CommercialTrackingService {
  private provider: TrackingProvider | null = null;
  private listeners = new Set<(event: CommercialEvent) => void>();

  // -----------------------------------------------------------------------
  // Provider management
  // -----------------------------------------------------------------------

  /** Register a production provider (PostHog, GA4 adapter, etc.) */
  registerProvider(p: TrackingProvider): void {
    this.provider = p;
  }

  /** Remove the current provider. */
  clearProvider(): void {
    this.provider = null;
  }

  // -----------------------------------------------------------------------
  // Core tracking
  // -----------------------------------------------------------------------

  /** Track a commercial event. No-op when flag is off. */
  track(event: CommercialEvent): void {
    if (!isCommercialTrackingEnabled()) return;

    // 1) Console (dev only)
    if (import.meta.env.DEV) {
      console.info(
        `%c[commercial:${event.event}]`,
        "color:#10b981;font-weight:bold",
        event,
      );
    }

    // 2) Buffer to localStorage (always — useful for debug page)
    const buf = readBuffer();
    buf.push(event);
    writeBuffer(buf);

    // 2.1) Persist growth-critical events (best-effort, fire-and-forget)
    persistCommercialEvent(
      event,
      CONFIG.API_BASE ?? "",
      CONFIG.INTERNAL_API_TOKEN ?? DEFAULT_INTERNAL_TOKEN,
    );

    // 2.2) Automation triggers (feature-flagged, v4 engine)
    if (event.event !== "activation_automation_triggered") {
      this.maybeTriggerAutomations(buf);
    }

    // 3) Provider (prod)
    if (this.provider) {
      try {
        this.provider.track(event);
      } catch {
        // Provider failure must never break UX
      }
    }

    // 4) Lead scoring (frontend-only)
    try {
      applyScore(event.event);
    } catch {
      // Don't break UX on scoring failure
    }

    // 5) Notify listeners (debug UI)
    this.listeners.forEach((fn) => {
      try {
        fn(event);
      } catch {
        // Don't let listener errors propagate
      }
    });
  }

  /**
   * v4 Platform Automation Engine — unified trigger evaluation.
   * Replaces the old maybeTriggerActivationAutomation (V1.1).
   * Runs ActivationVelocityEvaluator + ChurnRiskEvaluator.
   */
  private maybeTriggerAutomations(events: CommercialEvent[]): void {
    const activationEnabled = isActivationAutomationEnabled();
    const churnEnabled = isChurnRiskAutomationEnabled();
    if (!activationEnabled && !churnEnabled) return;
    if (!isActivationAutomationDispatchEnabled()) return;

    // Engine handles dedupe/dispatch for all registered triggers
    void getAutomationEngine()
      .run({ events })
      .catch(() => {
        // Best-effort — never break UX
      });
  }

  // -----------------------------------------------------------------------
  // Subscriptions (for debug page)
  // -----------------------------------------------------------------------

  /**
   * Subscribe to events as they arrive.
   * Returns unsubscribe function.
   */
  subscribe(fn: (event: CommercialEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // -----------------------------------------------------------------------
  // Buffer read / clear (debug)
  // -----------------------------------------------------------------------

  /** Read all buffered events from localStorage */
  getBuffer(): CommercialEvent[] {
    return readBuffer();
  }

  /** Clear the localStorage buffer */
  clearBuffer(): void {
    try {
      localStorage.removeItem(BUFFER_KEY);
      localStorage.removeItem(AUTOMATION_DEDUPE_KEY);
    } catch {
      // ignore
    }
  }

  /** Get events filtered by name */
  getBufferByEvent(name: CommercialEventName): CommercialEvent[] {
    return readBuffer().filter((e) => e.event === name);
  }

  /** Count events in buffer */
  getBufferCount(): number {
    return readBuffer().length;
  }

  /** Compute baseline funnel KPIs from buffered events. */
  getFunnelMetrics(): CommercialFunnelMetrics {
    return computeCommercialFunnelMetrics(readBuffer());
  }

  /** Compute segmented funnel snapshot by country/device/source/campaign. */
  getFunnelSegmentation(): CommercialFunnelSegmentation {
    return computeCommercialFunnelSegmentation(readBuffer());
  }

  /** Build CSV snapshot for funnel segmentation. */
  getFunnelSnapshotCsv(): string {
    return buildCommercialFunnelSnapshotCsv(this.getFunnelSegmentation());
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const commercialTracking = new CommercialTrackingService();
