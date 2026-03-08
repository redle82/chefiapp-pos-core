import { Fragment } from "react";
import { Navigate, Outlet, Route } from "react-router-dom";
import { ManagementAdvisor } from "../../components/onboarding/ManagementAdvisor";
import { BrowserBlockGuard } from "../../components/operational/BrowserBlockGuard";
import { RequireOperational } from "../../components/operational/RequireOperational";
import { ContextEngineProvider } from "../../core/context";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { useTenant } from "../../core/tenant/TenantContext";
import { KDSMobilePage } from "../../features/kds-mobile";
import { TPVMobilePage } from "../../features/pv-mobile";
import { AppStaffWrapper } from "../../pages/AppStaff/AppStaffWrapper";
import { ManagerExcecoesPage } from "../../pages/AppStaff/apps/alerts";
import { KitchenDisplay } from "../../pages/AppStaff/apps/kds";
import { StaffProfilePage } from "../../pages/AppStaff/apps/profile";
import { ManagerTarefasPage } from "../../pages/AppStaff/apps/tasks";
import { ManagerEquipePage } from "../../pages/AppStaff/apps/team";
import { StaffTpvPage } from "../../pages/AppStaff/apps/tpv";
import {
  CleaningSectorDashboard,
  KitchenSectorDashboard,
  OperationSectorDashboard,
  OwnerGlobalDashboard,
  TasksSectorDashboard,
  TeamSectorDashboard,
} from "../../pages/AppStaff/dashboards";
import { CleaningHome } from "../../pages/AppStaff/homes/CleaningHome";
import { DeliveryHome } from "../../pages/AppStaff/homes/DeliveryHome";
import { KitchenHome } from "../../pages/AppStaff/homes/KitchenHome";
import { ManagerHome } from "../../pages/AppStaff/homes/ManagerHome";
import { WaiterHome } from "../../pages/AppStaff/homes/WaiterHome";
import { WorkerHome } from "../../pages/AppStaff/homes/WorkerHome";
import { ConfigDesktopOnlyPage } from "../../pages/AppStaff/pages/ConfigDesktopOnlyPage";
import { ManagerTurnoPage } from "../../pages/AppStaff/pages/ManagerTurnoPage";
import { OperationModePage } from "../../pages/AppStaff/pages/OperationModePage";
import { StaffAppGate } from "../../pages/AppStaff/routing/StaffAppGate";
import { StaffAppShellLayout } from "../../pages/AppStaff/routing/StaffAppShellLayout";
import { StaffHomeRedirect } from "../../pages/AppStaff/routing/StaffHomeRedirect";
import { StaffIndexRedirect } from "../../pages/AppStaff/routing/StaffIndexRedirect";
import { StaffRoleGuard } from "../../pages/AppStaff/routing/StaffRoleGuard";
import { BackofficePage } from "../../pages/Backoffice/BackofficePage";
import { OfflineOrderProvider } from "../../pages/TPV/context/OfflineOrderContext";
import { OrderProvider } from "../../pages/TPV/context/OrderContextReal";
import { TableProvider } from "../../pages/TPV/context/TableContext";
import { TablePanel } from "../../pages/Waiter/TablePanel";
import { WaiterHomePage } from "../../pages/Waiter/WaiterHomePage";
import { APP_ROUTES, OPERATIONAL_ROUTES } from "../constants/routeConstants";

/**
 * Wrapper for the legacy /app/waiter/table/:tableId route.
 * Provides the same provider stack that AppStaffWrapper and MiniPOS use.
 */
function WaiterTablePanelWrapper() {
  const { identity } = useRestaurantIdentity();
  const { tenantId } = useTenant();
  const restaurantId = identity.id || tenantId || undefined;

  return (
    <ContextEngineProvider userRole="waiter" hasTPV={true}>
      <OfflineOrderProvider>
        <OrderProvider restaurantId={restaurantId}>
          <TableProvider restaurantId={restaurantId}>
            <TablePanel />
          </TableProvider>
        </OrderProvider>
      </OfflineOrderProvider>
    </ContextEngineProvider>
  );
}

export const AppStaffMobileRoutesFragment = (
  <Fragment>
    <Route
      element={
        <BrowserBlockGuard
          moduleId="waiter"
          requiredPlatform="mobile"
          moduleLabel="Comandeiro"
        />
      }
    >
      <Route path="/app/waiter" element={<WaiterHomePage />} />
      <Route
        path="/app/waiter/table/:tableId"
        element={<WaiterTablePanelWrapper />}
      />
      <Route
        path="/app/waiter/calls"
        element={<Navigate to="/app/waiter" replace />}
      />
      <Route
        path="/app/waiter/orders"
        element={<Navigate to="/app/waiter" replace />}
      />
      <Route
        path="/app/waiter/chat"
        element={<Navigate to="/app/waiter" replace />}
      />
      <Route
        path="/app/waiter/profile"
        element={<Navigate to={`${APP_ROUTES.STAFF}/profile`} replace />}
      />
    </Route>

    <Route
      path="/app/backoffice"
      element={
        <ManagementAdvisor>
          <BackofficePage />
        </ManagementAdvisor>
      }
    />

    <Route
      element={
        <BrowserBlockGuard
          moduleId="appstaff"
          requiredPlatform="mobile"
          moduleLabel="AppStaff"
        />
      }
    >
      <Route
        path={APP_ROUTES.STAFF}
        element={
          <RequireOperational surface="WEB">
            <AppStaffWrapper />
          </RequireOperational>
        }
      >
        <Route index element={<StaffIndexRedirect />} />
        <Route
          path="home"
          element={
            <StaffAppGate>
              <StaffAppShellLayout>
                <Outlet />
              </StaffAppShellLayout>
            </StaffAppGate>
          }
        >
          <Route index element={<StaffHomeRedirect />} />
          <Route path="owner" element={<OwnerGlobalDashboard />} />
          <Route path="manager" element={<ManagerHome />} />
          <Route path="waiter" element={<WaiterHome />} />
          <Route path="kitchen" element={<KitchenHome />} />
          <Route path="cleaning" element={<CleaningHome />} />
          <Route path="worker" element={<WorkerHome />} />
          <Route path="delivery" element={<DeliveryHome />} />
          <Route path="delivery/orders" element={<DeliveryHome />} />
          <Route path="delivery/map" element={<DeliveryHome />} />
          <Route path="delivery/drivers" element={<DeliveryHome />} />
          <Route path="delivery/reviews" element={<DeliveryHome />} />
          <Route
            path="sector/operation"
            element={<OperationSectorDashboard />}
          />
          <Route path="sector/tasks" element={<TasksSectorDashboard />} />
          <Route path="sector/team" element={<TeamSectorDashboard />} />
          <Route path="sector/kitchen" element={<KitchenSectorDashboard />} />
          <Route path="sector/cleaning" element={<CleaningSectorDashboard />} />
        </Route>
        <Route
          path="mode/operation"
          element={
            <StaffAppGate>
              <StaffRoleGuard modeId="operation">
                <StaffAppShellLayout>
                  <OperationModePage />
                </StaffAppShellLayout>
              </StaffRoleGuard>
            </StaffAppGate>
          }
        />
        <Route
          path="mode/turn"
          element={
            <StaffAppGate>
              <StaffRoleGuard modeId="turn">
                <StaffAppShellLayout>
                  <ManagerTurnoPage />
                </StaffAppShellLayout>
              </StaffRoleGuard>
            </StaffAppGate>
          }
        />
        <Route
          path="mode/team"
          element={
            <StaffAppGate>
              <StaffRoleGuard modeId="team">
                <StaffAppShellLayout>
                  <ManagerEquipePage />
                </StaffAppShellLayout>
              </StaffRoleGuard>
            </StaffAppGate>
          }
        />
        <Route
          path="mode/tpv"
          element={
            <StaffAppGate>
              <StaffRoleGuard modeId="tpv">
                <StaffAppShellLayout>
                  <StaffTpvPage />
                </StaffAppShellLayout>
              </StaffRoleGuard>
            </StaffAppGate>
          }
        />
        <Route
          path="mode/kds"
          element={
            <StaffAppGate>
              <StaffRoleGuard modeId="kds">
                <StaffAppShellLayout>
                  <KitchenDisplay />
                </StaffAppShellLayout>
              </StaffRoleGuard>
            </StaffAppGate>
          }
        />
        <Route
          path="pv"
          element={
            <StaffAppGate>
              <TPVMobilePage />
            </StaffAppGate>
          }
        />
        <Route
          path="kds"
          element={
            <StaffAppGate>
              <KDSMobilePage />
            </StaffAppGate>
          }
        />
        <Route
          path="mode/tasks"
          element={
            <StaffAppGate>
              <StaffRoleGuard modeId="tasks">
                <StaffAppShellLayout>
                  <ManagerTarefasPage />
                </StaffAppShellLayout>
              </StaffRoleGuard>
            </StaffAppGate>
          }
        />
        <Route
          path="mode/alerts"
          element={
            <StaffAppGate>
              <StaffRoleGuard modeId="alerts">
                <StaffAppShellLayout>
                  <ManagerExcecoesPage />
                </StaffAppShellLayout>
              </StaffRoleGuard>
            </StaffAppGate>
          }
        />
        <Route
          path="profile"
          element={
            <StaffAppGate>
              <StaffRoleGuard modeId="profile">
                <StaffAppShellLayout>
                  <StaffProfilePage />
                </StaffAppShellLayout>
              </StaffRoleGuard>
            </StaffAppGate>
          }
        />
        <Route
          path="config-desktop-only"
          element={
            <StaffAppGate>
              <StaffAppShellLayout>
                <ConfigDesktopOnlyPage />
              </StaffAppShellLayout>
            </StaffAppGate>
          }
        />
      </Route>
    </Route>

    <Route
      path="/app/control-room"
      element={<Navigate to={`${APP_ROUTES.STAFF}/mode/operation`} replace />}
    />
    <Route
      path="/app/setup/menu"
      element={<Navigate to="/menu-builder" replace />}
    />
    <Route
      path="/app/menu-builder"
      element={<Navigate to="/menu-builder" replace />}
    />
    <Route
      path="/app/setup/mesas"
      element={<Navigate to="/operacao" replace />}
    />
    <Route
      path="/app/setup/equipe"
      element={
        <Navigate to={`${APP_ROUTES.STAFF}/config-desktop-only`} replace />
      }
    />
    <Route
      path="/app/setup/horarios"
      element={
        <Navigate to={`${APP_ROUTES.STAFF}/config-desktop-only`} replace />
      }
    />
    <Route
      path="/app/setup/pagamentos"
      element={
        <Navigate to={`${APP_ROUTES.STAFF}/config-desktop-only`} replace />
      }
    />
    <Route
      path="/app/setup/tpv"
      element={<Navigate to={OPERATIONAL_ROUTES.TPV} replace />}
    />
    <Route
      path="/app/setup/kds"
      element={<Navigate to={OPERATIONAL_ROUTES.KDS} replace />}
    />
    <Route
      path="/app/setup/estoque"
      element={<Navigate to="/inventory-stock" replace />}
    />
    <Route
      path="/app/setup/preferencias"
      element={
        <Navigate to={`${APP_ROUTES.STAFF}/config-desktop-only`} replace />
      }
    />
  </Fragment>
);
