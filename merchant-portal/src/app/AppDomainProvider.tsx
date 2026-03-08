import type { ReactNode } from "react";
import { useRestaurantIdentity } from "../core/identity/useRestaurantIdentity";
import { getTabIsolated } from "../core/storage/TabIsolatedStorage";
import { OrderProvider } from "../pages/TPV/context/OrderContextReal";
import { TableProvider } from "../pages/TPV/context/TableContext";

interface Props {
  children: ReactNode;
}

/**
 * AppDomainProvider
 *
 * The Single Source of Truth for the "Order Domain".
 * Wraps TPV, Staff, and KDS to ensure they share the exact same state instance.
 *
 * Hierarchy:
 * - OfflineOrderProvider (Network Queue)
 *   - OrderProvider (Order State & Realtime)
 *     - TableProvider (Table Configuration)
 *
 * Usage:
 * Wrap this around the Routes that need access to Orders/Tables.
 */
export function AppDomainProvider({ children }: Props) {
  const { identity } = useRestaurantIdentity();
  // Fallback to storage if identity hook hasn't loaded (though FlowGate should handle this)
  const restaurantId = identity.id || getTabIsolated("chefiapp_restaurant_id");

  return (
    <OrderProvider restaurantId={restaurantId || undefined}>
      <TableProvider restaurantId={restaurantId || undefined}>
        {children}
      </TableProvider>
    </OrderProvider>
  );
}
