/**
 * Lightweight singleton service that records funnel events in-memory
 * and notifies subscribers. No external dependencies -- plug Sentry,
 * PostHog, or any other provider via `subscribe()`.
 */

import type { FunnelEvent } from "./funnelEvents";

type EventListener = (event: FunnelEvent) => void;

interface TimestampedEvent extends FunnelEvent {
  timestamp: number;
}

interface FunnelSummary {
  eventsCount: number;
  sessionDurationMs: number;
  lastEvent: string | null;
  reachedStages: string[];
}

/** Map of event names that mark reaching a specific funnel stage. */
const STAGE_MARKERS: Record<string, string> = {
  landing_viewed: "marketing",
  auth_completed: "auth",
  setup_started: "setup",
  setup_activated: "activated",
  install_started: "install",
  tpv_first_open: "tpv",
  commissioning_passed: "commissioned",
  restaurant_operational: "operational",
} as const;

class FunnelTrackerService {
  private listeners: EventListener[] = [];
  private eventLog: TimestampedEvent[] = [];
  private sessionStart: number = Date.now();

  /** Record a funnel event and notify all subscribers. */
  track(event: FunnelEvent): void {
    const entry: TimestampedEvent = { ...event, timestamp: Date.now() };
    this.eventLog.push(entry);

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(`[Funnel] ${event.name}`, event.properties ?? {});
    }

    for (const fn of this.listeners) {
      fn(event);
    }
  }

  /** Subscribe to every tracked event. Returns an unsubscribe function. */
  subscribe(listener: EventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /** Return the full immutable event log. */
  getLog(): ReadonlyArray<TimestampedEvent> {
    return this.eventLog;
  }

  /** Milliseconds since the tracker was created or last reset. */
  getSessionDuration(): number {
    return Date.now() - this.sessionStart;
  }

  /** High-level snapshot of funnel progress for debugging / dashboards. */
  getFunnelSummary(): FunnelSummary {
    const stages = new Set<string>();

    for (const e of this.eventLog) {
      const stage = STAGE_MARKERS[e.name];
      if (stage) {
        stages.add(stage);
      }
    }

    return {
      eventsCount: this.eventLog.length,
      sessionDurationMs: this.getSessionDuration(),
      lastEvent:
        this.eventLog.length > 0
          ? this.eventLog[this.eventLog.length - 1].name
          : null,
      reachedStages: Array.from(stages),
    };
  }

  /** Clear all recorded events and reset the session clock. */
  reset(): void {
    this.eventLog = [];
    this.sessionStart = Date.now();
  }
}

export const FunnelTracker = new FunnelTrackerService();
