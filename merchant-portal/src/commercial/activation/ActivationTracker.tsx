/**
 * ActivationTracker — Emits first_login when user with restaurant lands in app.
 * Mounts inside app tree (RestaurantRuntimeContext available).
 */
import { useEffect } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { emitFirstLogin } from "./activationTracking";

export function ActivationTracker() {
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime?.restaurant_id;

  useEffect(() => {
    if (restaurantId && !runtime?.loading) {
      emitFirstLogin(restaurantId);
    }
  }, [restaurantId, runtime?.loading]);

  return null;
}
