/**
 * Lazy-load Stripe.js to avoid "Cannot access 'u' before initialization" (TDZ)
 * when bundled in a separate chunk. Only loads when first needed.
 */

import type { Stripe } from "@stripe/stripe-js";

let cached: Promise<Stripe | null> | null = null;

export function getStripePromise(publishableKey: string | null): Promise<Stripe | null> {
  if (!publishableKey) return Promise.resolve(null);
  if (cached) return cached;
  cached = import("@stripe/stripe-js").then((m) => m.loadStripe(publishableKey));
  return cached;
}
