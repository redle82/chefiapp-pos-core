/**
 * AppStaffWrapper — ENTRYPONT REAL do AppStaff (web).
 * Montado em App.tsx como element de Route path="/app/staff". Não usar o componente legado AppStaff.tsx.
 * Cadeia: AppStaffWrapper → StaffModule → StaffAppGate → StaffAppShellLayout → páginas (ex. StaffLauncherPage → AppStaffHome).
 * Fornece OfflineOrderProvider + OrderProvider + TableProvider para o StaffModule.
 */

import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { useTenant } from "../../core/tenant/TenantContext";
import { OfflineOrderProvider } from "../TPV/context/OfflineOrderContext";
import { OrderProvider } from "../TPV/context/OrderContextReal";
import { TableProvider } from "../TPV/context/TableContext";
import StaffModule from "./StaffModule";

export function AppStaffWrapper() {
  const { identity } = useRestaurantIdentity();
  const { tenantId } = useTenant();
  const restaurantId = identity.id || tenantId;

  // Se não houver restaurantId, StaffModule vai lidar com o loading
  return (
    <OfflineOrderProvider>
      <OrderProvider restaurantId={restaurantId || undefined}>
        <TableProvider restaurantId={restaurantId || undefined}>
          <StaffModule />
        </TableProvider>
      </OrderProvider>
    </OfflineOrderProvider>
  );
}
