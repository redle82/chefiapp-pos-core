import { Fragment } from "react";
import { Navigate, Route } from "react-router-dom";
import { BrowserBlockGuard } from "../../components/operational/BrowserBlockGuard";
import { OperationalFullscreenWrapper } from "../../components/operational/OperationalFullscreenWrapper";
import { RequireOperational } from "../../components/operational/RequireOperational";
import { ShiftGate } from "../../components/operational/ShiftGate";
import { AppStaffMobileOnlyPage } from "../../pages/AppStaff/AppStaffMobileOnlyPage";
import { KDSMinimal } from "../../pages/KDSMinimal/KDSMinimal";
import { TPVHandoffPage } from "../../pages/TPVMinimal/TPVHandoffPage";
import { TPVKitchenPage } from "../../pages/TPVMinimal/TPVKitchenPage";
import { TPVLayout } from "../../pages/TPVMinimal/TPVLayout";
import { TPVOrdersPage } from "../../pages/TPVMinimal/TPVOrdersPage";
import { TPVPOSView } from "../../pages/TPVMinimal/TPVPOSView";
import { TPVProductionPage } from "../../pages/TPVMinimal/TPVProductionPage";
import { TPVReservationsPage } from "../../pages/TPVMinimal/TPVReservationsPage";
import { TPVSettingsPage } from "../../pages/TPVMinimal/TPVSettingsPage";
import { TPVShiftPage } from "../../pages/TPVMinimal/TPVShiftPage";
import { TPVTablesPage } from "../../pages/TPVMinimal/TPVTablesPage";
import { TPVTasksPage } from "../../pages/TPVMinimal/TPVTasksPage";
import { TPVScreensPage } from "../../pages/TPVMinimal/TPVScreensPage";
import { TPVExpoPage } from "../../pages/TPVMinimal/TPVExpoPage";
import { TPVCustomerDisplayPage } from "../../pages/TPVMinimal/TPVCustomerDisplayPage";
import { TPVDeliveryPage } from "../../pages/TPVMinimal/TPVDeliveryPage";
import { TPVWebEditorPage } from "../../pages/TPVMinimal/TPVWebEditorPage";
import { ScreenKitchenPage } from "../../pages/TPVMinimal/screens/ScreenKitchenPage";
import { ScreenBarPage } from "../../pages/TPVMinimal/screens/ScreenBarPage";
import { ScreenExpoPage } from "../../pages/TPVMinimal/screens/ScreenExpoPage";
import { ScreenDeliveryPage } from "../../pages/TPVMinimal/screens/ScreenDeliveryPage";
import { ScreenCustomerDisplayPage } from "../../pages/TPVMinimal/screens/ScreenCustomerDisplayPage";
import { ErrorBoundary } from "../../ui/design-system/ErrorBoundary";
import { GlobalBlockedView } from "../../ui/design-system/components/GlobalBlockedView";
import {
  ADMIN_ROUTES,
  APP_ROUTES,
  DASHBOARD_ROUTES,
  OPERATIONAL_ROUTES,
  SCREEN_ROUTES,
} from "../constants/routeConstants";

export const OperationalDesktopRoutesFragment = (
  <Fragment>
    <Route
      element={
        <BrowserBlockGuard
          moduleId="tpv"
          requiredPlatform="desktop"
          moduleLabel="TPV"
        />
      }
    >
      <Route
        path={OPERATIONAL_ROUTES.TPV}
        element={
          <ErrorBoundary
            context="TPV"
            fallback={
              <GlobalBlockedView
                title="TPV indisponível"
                description="O módulo de caixa encontrou um erro. Recarregue a tela para retomar as vendas."
                action={{
                  label: "Recarregar",
                  onClick: () => window.location.reload(),
                }}
              />
            }
          >
            <RequireOperational surface="TPV">
              <ShiftGate>
                <OperationalFullscreenWrapper>
                  <TPVLayout />
                </OperationalFullscreenWrapper>
              </ShiftGate>
            </RequireOperational>
          </ErrorBoundary>
        }
      >
        <Route index element={<TPVPOSView />} />
        <Route path="orders" element={<TPVOrdersPage />} />
        <Route path="tables" element={<TPVTablesPage />} />
        <Route path="shift" element={<TPVShiftPage />} />
        <Route
          path="cashier"
          element={<Navigate to={`${OPERATIONAL_ROUTES.TPV}/shift`} replace />}
        />
        <Route path="kitchen" element={<TPVKitchenPage />} />
        <Route path="handoff" element={<TPVHandoffPage />} />
        <Route path="production" element={<TPVProductionPage />} />
        <Route path="tasks" element={<TPVTasksPage />} />
        <Route path="reservations" element={<TPVReservationsPage />} />
        <Route path="web-editor" element={<TPVWebEditorPage />} />
        <Route path="expo" element={<TPVExpoPage />} />
        <Route path="customer-display" element={<TPVCustomerDisplayPage />} />
        <Route path="delivery" element={<TPVDeliveryPage />} />
        <Route path="screens" element={<TPVScreensPage />} />
        <Route path="settings" element={<TPVSettingsPage />} />
      </Route>
    </Route>

    <Route
      element={
        <BrowserBlockGuard
          moduleId="kds"
          requiredPlatform="desktop"
          moduleLabel="KDS"
        />
      }
    >
      <Route
        path={OPERATIONAL_ROUTES.KDS}
        element={
          <ErrorBoundary
            context="KDS"
            fallback={
              <GlobalBlockedView
                title="KDS indisponível"
                description="O módulo de cozinha encontrou um erro. Recarregue a tela para continuar o preparo."
                action={{
                  label: "Recarregar",
                  onClick: () => window.location.reload(),
                }}
              />
            }
          >
            <OperationalFullscreenWrapper>
              <KDSMinimal />
            </OperationalFullscreenWrapper>
          </ErrorBoundary>
        }
      />
    </Route>

    {/* ── Dedicated Screen Routes (/screen/*) ──────────────────────────
         Isolated surfaces: no TPV sidebar/header. ScreenLayout provides
         a minimal header with station label, clock, and back button.
         Each screen opens in a new window from the TPV Screens Hub.
    */}
    <Route
      path={SCREEN_ROUTES.KITCHEN}
      element={
        <ErrorBoundary context="Screen:Kitchen" fallback={<GlobalBlockedView title="Erro na tela" description="Recarregue para continuar." action={{ label: "Recarregar", onClick: () => window.location.reload() }} />}>
          <OperationalFullscreenWrapper>
            <ScreenKitchenPage />
          </OperationalFullscreenWrapper>
        </ErrorBoundary>
      }
    />
    <Route
      path={SCREEN_ROUTES.BAR}
      element={
        <ErrorBoundary context="Screen:Bar" fallback={<GlobalBlockedView title="Erro na tela" description="Recarregue para continuar." action={{ label: "Recarregar", onClick: () => window.location.reload() }} />}>
          <OperationalFullscreenWrapper>
            <ScreenBarPage />
          </OperationalFullscreenWrapper>
        </ErrorBoundary>
      }
    />
    <Route
      path={SCREEN_ROUTES.EXPO}
      element={
        <ErrorBoundary context="Screen:Expo" fallback={<GlobalBlockedView title="Erro na tela" description="Recarregue para continuar." action={{ label: "Recarregar", onClick: () => window.location.reload() }} />}>
          <OperationalFullscreenWrapper>
            <ScreenExpoPage />
          </OperationalFullscreenWrapper>
        </ErrorBoundary>
      }
    />
    <Route
      path={SCREEN_ROUTES.DELIVERY}
      element={
        <ErrorBoundary context="Screen:Delivery" fallback={<GlobalBlockedView title="Erro na tela" description="Recarregue para continuar." action={{ label: "Recarregar", onClick: () => window.location.reload() }} />}>
          <OperationalFullscreenWrapper>
            <ScreenDeliveryPage />
          </OperationalFullscreenWrapper>
        </ErrorBoundary>
      }
    />
    <Route
      path={SCREEN_ROUTES.CUSTOMER_DISPLAY}
      element={
        <ErrorBoundary context="Screen:CustomerDisplay" fallback={<GlobalBlockedView title="Erro na tela" description="Recarregue para continuar." action={{ label: "Recarregar", onClick: () => window.location.reload() }} />}>
          <OperationalFullscreenWrapper>
            <ScreenCustomerDisplayPage />
          </OperationalFullscreenWrapper>
        </ErrorBoundary>
      }
    />

    <Route
      path={OPERATIONAL_ROUTES.CASH}
      element={<Navigate to={`${OPERATIONAL_ROUTES.TPV}/shift`} replace />}
    />
    <Route
      path="/op/cashier"
      element={<Navigate to={`${OPERATIONAL_ROUTES.TPV}/shift`} replace />}
    />
    <Route
      path={OPERATIONAL_ROUTES.POS_ALIAS}
      element={<Navigate to={OPERATIONAL_ROUTES.TPV} replace />}
    />
    <Route
      path={`${OPERATIONAL_ROUTES.POS_ALIAS}/*`}
      element={<Navigate to={OPERATIONAL_ROUTES.TPV} replace />}
    />
    <Route path="/op/staff" element={<AppStaffMobileOnlyPage />} />
    <Route
      path="/op/owner"
      element={<Navigate to={`${APP_ROUTES.STAFF_HOME}/owner`} replace />}
    />
    <Route
      path="/tpv"
      element={<Navigate to={OPERATIONAL_ROUTES.TPV} replace />}
    />
    <Route
      path="/kds-minimal"
      element={<Navigate to={OPERATIONAL_ROUTES.KDS} replace />}
    />
    <Route
      path="/kds"
      element={<Navigate to={OPERATIONAL_ROUTES.KDS} replace />}
    />
    <Route
      path="/tpv-minimal"
      element={<Navigate to={OPERATIONAL_ROUTES.TPV} replace />}
    />

    <Route
      path={DASHBOARD_ROUTES.ROOT}
      element={<Navigate to={ADMIN_ROUTES.REPORTS_OVERVIEW} replace />}
    />
    <Route
      path={DASHBOARD_ROUTES.APP}
      element={<Navigate to={ADMIN_ROUTES.REPORTS_OVERVIEW} replace />}
    />
  </Fragment>
);
