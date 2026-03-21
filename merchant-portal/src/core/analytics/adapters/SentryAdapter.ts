import { FunnelTracker } from "../FunnelTracker";
import type { FunnelEvent } from "../funnelEvents";

interface SentryClient {
  addBreadcrumb: (breadcrumb: {
    category: string;
    message: string;
    level: "info" | "warning" | "error";
    data?: Record<string, unknown>;
  }) => void;
  setTag: (key: string, value: string) => void;
  setContext: (name: string, context: Record<string, unknown> | null) => void;
}

// Events that indicate errors or warnings
const ERROR_EVENTS = new Set(["commissioning_failed"]);
const WARNING_EVENTS = new Set(["activation_skipped"]);

// Events that should update Sentry tags for better error grouping
const TAG_EVENTS: Record<string, string> = {
  auth_completed: "funnel_stage",
  setup_started: "funnel_stage",
  setup_activated: "funnel_stage",
  install_started: "funnel_stage",
  tpv_first_open: "funnel_stage",
  commissioning_passed: "funnel_stage",
  restaurant_operational: "funnel_stage",
};

let unsubscribe: (() => void) | null = null;

/**
 * Connect FunnelTracker to Sentry for breadcrumbs and context.
 * Call once at app boot after Sentry is initialized.
 *
 * Usage:
 *   import * as Sentry from "@sentry/react";
 *   connectSentry(Sentry);
 */
export function connectSentry(client: SentryClient): () => void {
  if (unsubscribe) unsubscribe();

  unsubscribe = FunnelTracker.subscribe((event: FunnelEvent) => {
    const level = ERROR_EVENTS.has(event.name)
      ? "error"
      : WARNING_EVENTS.has(event.name)
        ? "warning"
        : "info";

    // Add breadcrumb for every event
    client.addBreadcrumb({
      category: "funnel",
      message: event.name,
      level,
      data:
        "properties" in event
          ? (event.properties as Record<string, unknown>)
          : undefined,
    });

    // Update tag if this is a stage-changing event
    if (event.name in TAG_EVENTS) {
      const stageName = event.name
        .replace("_completed", "")
        .replace("_started", "")
        .replace("_passed", "")
        .replace("_operational", "");
      client.setTag("funnel_stage", stageName);
    }

    // Update funnel context periodically
    const summary = FunnelTracker.getFunnelSummary();
    client.setContext("funnel", {
      events_count: summary.eventsCount,
      session_duration_ms: summary.sessionDurationMs,
      last_event: summary.lastEvent,
      reached_stages: summary.reachedStages.join(", "),
    });
  });

  return () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  };
}
