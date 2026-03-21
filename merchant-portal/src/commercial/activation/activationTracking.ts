/**
 * Activation Tracking — Emit activation milestones (first_login, first_menu, etc.)
 * Idempotent: each event fires at most once per restaurant (localStorage guard).
 * Ref: Activation Engine — trial_start → first_order_created = activation.
 */

import {
  commercialTracking,
  detectDevice,
  isCommercialTrackingEnabled,
} from "../tracking";

const PREFIX = "chefiapp_activation_";

function wasEmitted(restaurantId: string, event: string): boolean {
  try {
    return localStorage.getItem(`${PREFIX}${event}_${restaurantId}`) === "1";
  } catch {
    return false;
  }
}

function markEmitted(restaurantId: string, event: string): void {
  try {
    localStorage.setItem(`${PREFIX}${event}_${restaurantId}`, "1");
  } catch {
    /* ignore */
  }
}

const BASE = {
  timestamp: () => new Date().toISOString(),
  country: "gb" as const,
  segment: "small" as const,
  landing_version: "onboarding-v1",
  device: () => detectDevice(),
  path: () =>
    typeof window !== "undefined" ? window.location.pathname : "",
};

/** Emit first_login — call when user with restaurant lands on app. */
export function emitFirstLogin(restaurantId: string): void {
  if (!isCommercialTrackingEnabled() || !restaurantId) return;
  if (wasEmitted(restaurantId, "first_login")) return;
  commercialTracking.track({
    ...BASE,
    timestamp: BASE.timestamp(),
    device: BASE.device(),
    path: BASE.path(),
    event: "first_login",
    restaurant_id: restaurantId,
  });
  markEmitted(restaurantId, "first_login");
}

/** Emit first_menu_created — call when first product is created for restaurant. */
export function emitFirstMenuCreated(restaurantId: string): void {
  if (!isCommercialTrackingEnabled() || !restaurantId) return;
  if (wasEmitted(restaurantId, "first_menu_created")) return;
  commercialTracking.track({
    ...BASE,
    timestamp: BASE.timestamp(),
    device: BASE.device(),
    path: BASE.path(),
    event: "first_menu_created",
    restaurant_id: restaurantId,
  });
  markEmitted(restaurantId, "first_menu_created");
}

/** Emit first_shift_opened — call when first cash register is opened. */
export function emitFirstShiftOpened(
  restaurantId: string,
  shiftId?: string,
): void {
  if (!isCommercialTrackingEnabled() || !restaurantId) return;
  if (wasEmitted(restaurantId, "first_shift_opened")) return;
  commercialTracking.track({
    ...BASE,
    timestamp: BASE.timestamp(),
    device: BASE.device(),
    path: BASE.path(),
    event: "first_shift_opened",
    restaurant_id: restaurantId,
    shift_id: shiftId,
  });
  markEmitted(restaurantId, "first_shift_opened");
}

/** Emit first_payment_received — call when first payment is recorded for restaurant. */
export function emitFirstPaymentReceived(
  restaurantId: string,
  orderId: string,
  amountCents?: number,
): void {
  if (!isCommercialTrackingEnabled() || !restaurantId) return;
  if (wasEmitted(restaurantId, "first_payment_received")) return;
  commercialTracking.track({
    ...BASE,
    timestamp: BASE.timestamp(),
    device: BASE.device(),
    path: BASE.path(),
    event: "first_payment_received",
    restaurant_id: restaurantId,
    order_id: orderId,
    amount_cents: amountCents,
  });
  markEmitted(restaurantId, "first_payment_received");
}
