// @ts-nocheck
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";

/**
 * Hook que expõe apenas restaurantId e loading.
 * Usado por páginas que não precisam da identidade completa.
 */
export function useRestaurantId(): {
  restaurantId: string | null;
  loading: boolean;
} {
  const { identity } = useRestaurantIdentity();
  return {
    restaurantId: identity.id ?? null,
    loading: identity.loading,
  };
}
