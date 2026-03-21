/**
 * persistCommercialEvent — Growth Data Layer
 *
 * Best-effort POST to /internal/commercial/event.
 * Never blocks UX. Never throws. Fire-and-forget.
 *
 * Only persists growth-critical events (activation, onboarding, billing).
 * Does NOT persist: page_view, scroll, pricing_hover, etc.
 */

import type { CommercialEvent } from "./types";

const PERSIST_EVENT_TYPES = new Set([
  "trial_start",
  "trial_started",
  "first_login",
  "first_menu_created",
  "first_shift_opened",
  "first_order_created",
  "first_payment_received",
  "onboarding_completed",
  "billing_started",
  "billing_converted",
]);

function getRestaurantId(event: CommercialEvent): string | null {
  if (!("restaurant_id" in event) || typeof event.restaurant_id !== "string") {
    return null;
  }
  const id = event.restaurant_id.trim();
  return id.length > 0 ? id : null;
}

function buildPayload(event: CommercialEvent): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if ("order_id" in event && event.order_id) payload.order_id = event.order_id;
  if ("amount_cents" in event && event.amount_cents != null)
    payload.amount_cents = event.amount_cents;
  if ("shift_id" in event && event.shift_id) payload.shift_id = event.shift_id;
  return Object.keys(payload).length > 0 ? payload : {};
}

/**
 * Persist event to gm_commercial_events via gateway.
 * Best-effort: ignores errors, never blocks.
 */
export function persistCommercialEvent(
  event: CommercialEvent,
  apiBase: string,
  internalToken: string,
): void {
  if (!PERSIST_EVENT_TYPES.has(event.event)) return;
  const restaurantId = getRestaurantId(event);
  if (!restaurantId) return;
  if (!apiBase || !internalToken) return;

  const base = apiBase.replace(/\/+$/, "");
  const url = `${base}/internal/commercial/event`;

  const body = {
    restaurant_id: restaurantId,
    event_type: event.event,
    country: event.country ?? null,
    segment: event.segment ?? null,
    device: event.device ?? null,
    utm_source: event.utm_source ?? null,
    utm_campaign: event.utm_campaign ?? null,
    payload_json: buildPayload(event),
  };

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Token": internalToken,
    },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    // Best-effort: silent fail. Never impact UX.
  });
}
