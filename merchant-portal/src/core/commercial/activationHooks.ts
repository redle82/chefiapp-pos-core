/**
 * Activation Hooks — CRM/automation triggers for commercial lifecycle.
 *
 * Abstract hook placeholders. No external CRM integration.
 * Wire these to HubSpot, Pipedrive, WhatsApp, email in Phase 3.
 *
 * Contract:
 *   - onTrialStarted(restaurantId) → tag CRM
 *   - onTrialExpired(restaurantId) → trigger email
 *   - onPaymentFailed(restaurantId) → notify WhatsApp
 *   - onConversion(restaurantId, plan) → tag Paid
 */

export type ActivationHookEvent =
  | { type: "trial_started"; restaurantId: string }
  | { type: "trial_expired"; restaurantId: string }
  | { type: "payment_failed"; restaurantId: string }
  | { type: "conversion"; restaurantId: string; plan: string };

export type ActivationHookHandler = (event: ActivationHookEvent) => void | Promise<void>;

let _handler: ActivationHookHandler | null = null;

/**
 * Register a handler for activation events.
 * Pass null to clear. Called once at app bootstrap.
 */
export function setActivationHookHandler(handler: ActivationHookHandler | null): void {
  _handler = handler;
}

async function emit(event: ActivationHookEvent): Promise<void> {
  if (_handler) {
    await _handler(event);
  }
}

/**
 * Emit when trial has started. Wire to: CRM tag "trial_started".
 */
export async function onTrialStarted(restaurantId: string): Promise<void> {
  await emit({ type: "trial_started", restaurantId });
}

/**
 * Emit when trial has expired. Wire to: email sequence "trial_expired".
 */
export async function onTrialExpired(restaurantId: string): Promise<void> {
  await emit({ type: "trial_expired", restaurantId });
}

/**
 * Emit when payment has failed. Wire to: WhatsApp notify, email dunning.
 */
export async function onPaymentFailed(restaurantId: string): Promise<void> {
  await emit({ type: "payment_failed", restaurantId });
}

/**
 * Emit when trial converted to paid. Wire to: CRM tag "Paid", plan.
 */
export async function onConversion(restaurantId: string, plan: string): Promise<void> {
  await emit({ type: "conversion", restaurantId, plan });
}
