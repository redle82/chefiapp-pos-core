/**
 * AppStaffWrapper
 * 
 * Wrapper que fornece OrderProvider para o StaffModule.
 * Necessário porque StaffContext usa useOrders() que requer OrderProvider.
 */

import { OrderProvider } from '../TPV/context/OrderContextReal';
import { TableProvider } from '../TPV/context/TableContext';
import { useRestaurantIdentity } from '../../core/identity/useRestaurantIdentity';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';
import StaffModule from './StaffModule';

export function AppStaffWrapper() {
  const { identity } = useRestaurantIdentity();
  const restaurantId = identity.id || getTabIsolated('chefiapp_restaurant_id');

  // Se não houver restaurantId, StaffModule vai lidar com o loading
  return (
    <OrderProvider restaurantId={restaurantId || undefined}>
      <TableProvider restaurantId={restaurantId || undefined}>
        <StaffModule />
      </TableProvider>
    </OrderProvider>
  );
}
