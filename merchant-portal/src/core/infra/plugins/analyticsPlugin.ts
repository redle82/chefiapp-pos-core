/**
 * Analytics Plugin — Envia eventos para InsForge (gm_events)
 *
 * Plugin critical: a sua falha determina retry/dead-letter no EventBus.
 */

import { analyticsClient } from "../analyticsClient";
import type { CoreEvent } from "../eventTypes";

export async function analyticsPlugin(event: CoreEvent): Promise<void> {
  const { error } = await analyticsClient.from("gm_events").insert({
    event_id: event.eventId,
    event_type: event.eventType,
    payload: event,
    restaurant_id: event.restaurantId,
    user_id: event.userId,
    created_at: event.timestamp,
  });

  if (error) {
    throw new Error(`InsForge insert failed: ${error.message}`);
  }
}
