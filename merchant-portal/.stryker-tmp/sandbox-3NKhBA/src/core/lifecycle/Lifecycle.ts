/**
 * Restaurant Lifecycle Contract Logic
 *
 * Implements the GloriaFood Model:
 * 1. Configuring: Management Open, Operational Blocked.
 * 2. Published: Management Open, Operational Apps Accessible, Orders Require Open Shift.
 * 3. Operational: Management Open, Operational Apps Accessible, Shift Active.
 */
// @ts-nocheck


export interface RestaurantLifecycle {
  /**
   * Always true once a restaurant exists and user is bound.
   * If false, we are likely in a fatal error state or pre-identity.
   */
  configured: boolean;

  /**
   * True if the restaurant has been explicitly published.
   * Controls access to TPV/KDS.
   */
  published: boolean;

  /**
   * True if there is an active shift (Cash Register Open).
   * Controls ability to take orders/payments.
   */
  operational: boolean;
}

export function deriveLifecycle(
  id: string | null,
  isPublished: boolean,
  isShiftOpen: boolean,
): RestaurantLifecycle {
  return {
    configured: !!id,
    published: isPublished,
    operational: isShiftOpen,
  };
}
