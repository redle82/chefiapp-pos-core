// extractMentorshipEvents.ts
// Utility to extract mentorship events from analytics buffer
import type { MentorshipEvent } from "../../core/intelligence/MentorEngine";
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";

const STORAGE_KEY = "chefiapp_analytics_queue";

// Map analytics event names to MentorshipEvent types
const EVENT_MAP: Record<string, MentorshipEvent["type"]> = {
  order_created: "ORDER_CREATED",
  sla_violation: "SLA_VIOLATION",
  stockout: "STOCKOUT",
  order_delayed: "DELAY",
};

export function extractMentorshipEvents(): MentorshipEvent[] {
  try {
    const raw = getTabIsolated(STORAGE_KEY);
    if (!raw) return [];
    const events = JSON.parse(raw);
    if (!Array.isArray(events)) return [];
    return events
      .filter((evt): evt is Record<string, unknown> => evt != null && typeof evt === "object")
      .map((evt: any) => {
        const type = EVENT_MAP[evt.name];
        if (!type) return null;
        return {
          type,
          timestamp: new Date(evt.ts).toISOString(),
          details: evt?.payload ?? {},
        } as MentorshipEvent;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}
