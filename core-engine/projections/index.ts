/**
 * Projections (Stub)
 *
 * Rebuilds read-model state from event streams.
 * This is a minimal stub for type resolution.
 */
import type { CoreEvent } from "../event-log/types";

export interface ProjectedState {
  sessions: Map<string, Record<string, unknown>>;
  orders: Map<string, Record<string, unknown>>;
  orderItems: Map<string, Record<string, unknown>[]>;
  tables: Map<string, Record<string, unknown>>;
  payments: Map<string, Record<string, unknown>>;
}

/**
 * Rebuild state from a sequence of events.
 */
export function rebuildState(events: CoreEvent[]): ProjectedState {
  const state: ProjectedState = {
    sessions: new Map(),
    orders: new Map(),
    orderItems: new Map(),
    tables: new Map(),
    payments: new Map(),
  };

  for (const event of events) {
    // Apply each event to the projected state
    // Implementation would pattern-match on event.type
  }

  return state;
}
