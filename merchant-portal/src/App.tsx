/**
 * APP.TSX — RESET CONTROLADO
 *
 * Esta é a versão limpa após remoção total de UI/UX legada.
 *
 * REGRAS:
 * - Nenhuma rota antiga
 * - Nenhum redirecionamento automático
 * - Nenhum uso de Supabase fora do Core
 * - Apenas tela neutra de reset
 *
 * FASE 0: BLOQUEIO DE CONTAMINAÇÃO — CONCLUÍDA
 * FASE 1: ISOLAMENTO DO CORE — CONCLUÍDA
 * FASE 2: RESET TOTAL DA UI — CONCLUÍDA
 * FASE 3: RECONSTRUÇÃO GUIADA — AGUARDANDO
 */

import { useEffect } from "react";
import { Link, Navigate, Route, Routes, useLocation, useSearchParams } from "react-router-dom";
import "./App.css";
import { GlobalUIStateProvider } from "./context/GlobalUIStateContext";
import { RestaurantRuntimeProvider } from "./context/RestaurantRuntimeContext";
import { ShiftProvider } from "./core/shift/ShiftContext";
import { AppStaffMobileOnlyPage } from "./pages/AppStaff/AppStaffMobileOnlyPage";
import { BackofficePage } from "./pages/Backoffice/BackofficePage";
import { BillingPage } from "./pages/Billing/BillingPage";
import { BillingSuccessPage } from "./pages/Billing/BillingSuccessPage";
import { BootstrapPage } from "./pages/BootstrapPage";
import { FirstProductPage } from "./pages/Onboarding/FirstProductPage";
import { CoreResetPage } from "./pages/CoreReset/CoreResetPage";
import { DebugTPV } from "./pages/DebugTPV";
import { InventoryStockMinimal } from "./pages/InventoryStock/InventoryStockMinimal";
import { KDSMinimal } from "./pages/KDSMinimal/KDSMinimal";
import { MenuBuilderMinimal } from "./pages/MenuBuilder/MenuBuilderMinimal";
import { OperacaoMinimal } from "./pages/Operacao/OperacaoMinimal";
import { CustomerOrderStatusView } from "./pages/Public/CustomerOrderStatusView";
import { PublicKDS } from "./pages/Public/PublicKDS";
import { PublicWebPage } from "./pages/PublicWeb/PublicWebPage";
import { TablePage } from "./pages/PublicWeb/TablePage";
import { ShoppingListMinimal } from "./pages/ShoppingList/ShoppingListMinimal";
import { TPVMinimal } from "./pages/TPVMinimal/TPVMinimal";
import { TPVDemoPage } from "./pages/TPVMinimal/TPVDemoPage";
import { TaskSystemMinimal } from "./pages/TaskSystem/TaskSystemMinimal";

// Novas rotas - Perfis (Employee, Manager, Owner)
import { ManagementAdvisor } from "./components/onboarding/ManagementAdvisor";
import { OperationalFullscreenWrapper } from "./components/operational/OperationalFullscreenWrapper";
import { RequireOperational } from "./components/operational/RequireOperational";
import { useGlobalUIState } from "./context/GlobalUIStateContext";
import { RoleGate, RoleProvider } from "./core/roles";
import { ShiftGuard } from "./core/shift/ShiftGuard";
import { TenantProvider } from "./core/tenant/TenantContext";
import { AlertsDashboardPage } from "./pages/Alerts/AlertsDashboardPage";
import { AuthPage } from "./pages/AuthPage";
import { ConfigIdentityPage } from "./pages/Config/ConfigIdentityPage";
import { ConfigIntegrationsPage } from "./pages/Config/ConfigIntegrationsPage";
import { ConfigLayout } from "./pages/Config/ConfigLayout";
import { ConfigLocationPage } from "./pages/Config/ConfigLocationPage";
import { ConfigModulesPage } from "./pages/Config/ConfigModulesPage";
import { ConfigPaymentsPage } from "./pages/Config/ConfigPaymentsPage";
import { ConfigPeoplePage } from "./pages/Config/ConfigPeoplePage";
import { ConfigPerceptionPage } from "./pages/Config/ConfigPerceptionPage";
import { ConfigSchedulePage } from "./pages/Config/ConfigSchedulePage";
import { ConfigStatusPage } from "./pages/Config/ConfigStatusPage";
import { DashboardPortal } from "./pages/Dashboard/DashboardPortal";
import { DemoTourPage } from "./pages/Demo/DemoTourPage";
import { EmployeeHomePage } from "./pages/Employee/HomePage";
import { EmployeeKDSIntelligentPage } from "./pages/Employee/KDSIntelligentPage";
import { EmployeeMentorPage } from "./pages/Employee/MentorPage";
import { EmployeeOperationPage } from "./pages/Employee/OperationPage";
import { EmployeeTasksPage } from "./pages/Employee/TasksPage";
import { FinancialDashboardPage } from "./pages/Financial/FinancialDashboardPage";
import { GroupsDashboardPage } from "./pages/Groups/GroupsDashboardPage";
import { HealthDashboardPage } from "./pages/Health/HealthDashboardPage";
import { InstallPage } from "./pages/InstallPage";
import { FeaturesPage } from "./pages/Landing/FeaturesPage";
import { LandingPage } from "./pages/Landing/LandingPage";
import { PricingPage } from "./pages/Landing/PricingPage";
import { ManagerAnalysisPage } from "./pages/Manager/AnalysisPage";
import { ManagerCentralPage } from "./pages/Manager/CentralPage";
import { ManagerDashboardPage } from "./pages/Manager/DashboardPage";
import { ManagerReservationsPage } from "./pages/Manager/ReservationsPage";
import { ManagerScheduleCreatePage } from "./pages/Manager/ScheduleCreatePage";
import { ManagerSchedulePage } from "./pages/Manager/SchedulePage";
import { MentorDashboardPage } from "./pages/Mentor/MentorDashboardPage";
import { OwnerPurchasesPage } from "./pages/Owner/PurchasesPage";
import { OwnerSimulationPage } from "./pages/Owner/SimulationPage";
import { OwnerStockRealPage } from "./pages/Owner/StockRealPage";
import { OwnerVisionPage } from "./pages/Owner/VisionPage";
import { PeopleDashboardPage } from "./pages/People/PeopleDashboardPage";
import { TimeTrackingPage } from "./pages/People/TimeTrackingPage";
import { PublishPage } from "./pages/PublishPage";
import { PurchasesDashboardPage } from "./pages/Purchases/PurchasesDashboardPage";
import { ReservationsDashboardPage } from "./pages/Reservations/ReservationsDashboardPage";
import { SelectTenantPage } from "./pages/SelectTenantPage";
import { SystemTreePage } from "./pages/SystemTree/SystemTreePage";
import { RecurringTasksPage } from "./pages/Tasks/RecurringTasksPage";
import { TaskDashboardPage } from "./pages/Tasks/TaskDashboardPage";
import { TaskDetailPage } from "./pages/Tasks/TaskDetailPage";
import { BillingBanner } from "./ui/billing/BillingBanner";
import { BillingBlockedView } from "./ui/billing/BillingBlockedView";
import { CoreUnavailableBanner } from "./ui/design-system/CoreUnavailableBanner";
import { ErrorBoundary } from "./ui/design-system/ErrorBoundary";
import { ModeIndicator } from "./ui/design-system/ModeIndicator";

import { FlowGate } from "./core/flow/FlowGate";

/** NAVIGATION_OPERATIONAL_CONTRACT: quando mode=demo, TPV sem RequireOperational; senão app normal. */
function TPVRouteHandler() {
  const [searchParams] = useSearchParams();
  if (searchParams.get("mode") === "demo") {
    return <TPVDemoPage />;
  }
  return <AppWithRuntime />;
}

function App() {
  return (
    <Routes>
      {/* APPLICATION_BOOT_CONTRACT: PUBLIC/AUTH — sem Runtime/Shift (landing 100% desacoplada do Core) */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/demo" element={<DemoTourPage />} />
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route
        path="/signup"
        element={<Navigate to="/auth?mode=signup" replace />}
      />
      <Route
        path="/forgot-password"
        element={<Navigate to="/auth" replace />}
      />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/billing/success" element={<BillingSuccessPage />} />
      <Route
        path="/onboarding"
        element={<Navigate to="/app/dashboard" replace />}
      />
      <Route
        path="/onboarding/:section"
        element={<Navigate to="/app/dashboard" replace />}
      />
      {/* NAVIGATION_OPERATIONAL_CONTRACT: /op/tpv?mode=demo sem RequireOperational */}
      <Route path="/op/tpv" element={<TPVRouteHandler />} />
      <Route path="*" element={<AppWithRuntime />} />
    </Routes>
  );
}

/** APPLICATION_BOOT_CONTRACT: MANAGEMENT/OPERATIONAL — Runtime + Shift só para rotas que precisam de Core. */
function AppWithRuntime() {
  return (
    <RestaurantRuntimeProvider>
      <ShiftProvider>
        <GlobalUIStateProvider>
          <RoleProvider>
            <TenantProvider>
              <FlowGate>
                <ShiftGuard>
                  <AppContentWithBilling />
                </ShiftGuard>
              </FlowGate>
            </TenantProvider>
          </RoleProvider>
        </GlobalUIStateProvider>
      </ShiftProvider>
    </RestaurantRuntimeProvider>
  );
}

const LAST_ROUTE_KEY = "chefiapp_lastRoute";
const LAST_ROUTE_ALLOWED = ["/dashboard", "/app/dashboard", "/op/tpv", "/op/kds", "/op/cash"];

function AppContentWithBilling() {
  const { isBillingBlocked } = useGlobalUIState();
  const location = useLocation();

  // LANDING_STATE_ROUTING_CONTRACT: persistir último contexto para "Já tenho acesso" → retomar modo/rota
  useEffect(() => {
    const path = location.pathname;
    if (LAST_ROUTE_ALLOWED.includes(path)) {
      try {
        sessionStorage.setItem(LAST_ROUTE_KEY, path);
      } catch {
        // ignore
      }
    }
  }, [location.pathname]);

  const isBillingManagement = location.pathname.startsWith("/app/billing");

  if (isBillingBlocked && !isBillingManagement) {
    return <BillingBlockedView />;
  }

  return (
    <>
      <BillingBanner />
      <ModeIndicator />
      <CoreUnavailableBanner />
      <Routes>
        <Route path="/public/:slug" element={<PublicWebPage />} />
        <Route path="/public/:slug/mesa/:number" element={<TablePage />} />
        <Route
          path="/public/:slug/order/:orderId"
          element={<CustomerOrderStatusView />}
        />
        <Route path="/public/:slug/kds" element={<PublicKDS />} />

        <Route path="/bootstrap" element={<BootstrapPage />} />
        <Route path="/app/select-tenant" element={<SelectTenantPage />} />
        <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />

        <Route element={<RoleGate />}>
          <Route
            path="/op/tpv"
            element={
              <ErrorBoundary
                context="TPV"
                fallback={
                  <div
                    style={{
                      minHeight: "100vh",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 24,
                      background: "#0a0a0a",
                      color: "#e2e8f0",
                      fontFamily: "Inter, system-ui, sans-serif",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 18,
                        marginBottom: 16,
                        maxWidth: 400,
                        color: "#a3a3a3",
                      }}
                    >
                      TPV temporariamente indisponível. Tente novamente ou volte
                      ao portal.
                    </p>
                    <Link
                      to="/dashboard"
                      style={{
                        padding: "12px 24px",
                        background: "#fff",
                        color: "#0a0a0a",
                        borderRadius: 8,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      Ir para o Portal
                    </Link>
                  </div>
                }
              >
                <RequireOperational>
                  <OperationalFullscreenWrapper>
                    <TPVMinimal />
                  </OperationalFullscreenWrapper>
                </RequireOperational>
              </ErrorBoundary>
            }
          />
          <Route
            path="/op/kds"
            element={
              <ErrorBoundary
                context="KDS"
                fallback={
                  <div
                    style={{
                      minHeight: "100vh",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 24,
                      background: "#0f172a",
                      color: "#e2e8f0",
                      fontFamily: "system-ui, sans-serif",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 18,
                        marginBottom: 16,
                        maxWidth: 400,
                      }}
                    >
                      KDS temporariamente indisponível. Tente novamente ou volte
                      ao portal.
                    </p>
                    <Link
                      to="/dashboard"
                      style={{
                        padding: "12px 24px",
                        background: "#f8fafc",
                        color: "#0f172a",
                        borderRadius: 8,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      Ir para o Portal
                    </Link>
                  </div>
                }
              >
                <RequireOperational>
                  <OperationalFullscreenWrapper>
                    <KDSMinimal />
                  </OperationalFullscreenWrapper>
                </RequireOperational>
              </ErrorBoundary>
            }
          />
          <Route path="/op/cash" element={<Navigate to="/op/tpv" replace />} />
          <Route path="/op/staff" element={<AppStaffMobileOnlyPage />} />
          <Route path="/tpv" element={<Navigate to="/op/tpv" replace />} />
          <Route
            path="/kds-minimal"
            element={<Navigate to="/op/kds" replace />}
          />

          <Route path="/dashboard" element={<DashboardPortal />} />
          <Route
            path="/app/dashboard"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route path="/onboarding/first-product" element={<FirstProductPage />} />
          <Route path="/menu-builder" element={<MenuBuilderMinimal />} />
          <Route
            path="/operacao"
            element={
              <RequireOperational>
                <OperacaoMinimal />
              </RequireOperational>
            }
          />
          <Route path="/inventory-stock" element={<InventoryStockMinimal />} />
          <Route path="/task-system" element={<TaskSystemMinimal />} />
          <Route path="/shopping-list" element={<ShoppingListMinimal />} />
          <Route
            path="/tpv-test"
            element={
              <RequireOperational>
                <DebugTPV />
              </RequireOperational>
            }
          />
          <Route path="/garcom" element={<AppStaffMobileOnlyPage />} />
          <Route
            path="/garcom/mesa/:tableId"
            element={<AppStaffMobileOnlyPage />}
          />
          <Route
            path="/app/backoffice"
            element={
              <ManagementAdvisor>
                <BackofficePage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/app/setup/menu"
            element={<Navigate to="/menu-builder" replace />}
          />
          <Route
            path="/app/setup/mesas"
            element={<Navigate to="/operacao" replace />}
          />
          <Route
            path="/app/setup/equipe"
            element={<Navigate to="/config/people" replace />}
          />
          <Route
            path="/app/setup/horarios"
            element={<Navigate to="/config/schedule" replace />}
          />
          <Route
            path="/app/setup/pagamentos"
            element={<Navigate to="/config/payments" replace />}
          />
          <Route
            path="/app/setup/tpv"
            element={<Navigate to="/op/tpv" replace />}
          />
          <Route
            path="/app/setup/kds"
            element={<Navigate to="/op/kds" replace />}
          />
          <Route
            path="/app/setup/estoque"
            element={<Navigate to="/inventory-stock" replace />}
          />
          <Route
            path="/app/setup/preferencias"
            element={<Navigate to="/config" replace />}
          />
          <Route
            path="/employee/home"
            element={
              <ManagementAdvisor>
                <EmployeeHomePage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/employee/tasks"
            element={
              <ManagementAdvisor>
                <EmployeeTasksPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/employee/operation"
            element={
              <ManagementAdvisor>
                <EmployeeOperationPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/employee/operation/kitchen"
            element={
              <ManagementAdvisor>
                <EmployeeKDSIntelligentPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/employee/mentor"
            element={
              <ManagementAdvisor>
                <EmployeeMentorPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/manager/dashboard"
            element={
              <ManagementAdvisor>
                <ManagerDashboardPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/manager/central"
            element={
              <ManagementAdvisor>
                <ManagerCentralPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/manager/analysis"
            element={
              <ManagementAdvisor>
                <ManagerAnalysisPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/manager/schedule"
            element={
              <ManagementAdvisor>
                <ManagerSchedulePage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/manager/schedule/create"
            element={
              <ManagementAdvisor>
                <ManagerScheduleCreatePage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/manager/reservations"
            element={
              <ManagementAdvisor>
                <ManagerReservationsPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/owner/vision"
            element={
              <ManagementAdvisor>
                <OwnerVisionPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/owner/stock"
            element={
              <ManagementAdvisor>
                <OwnerStockRealPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/owner/simulation"
            element={
              <ManagementAdvisor>
                <OwnerSimulationPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/owner/purchases"
            element={
              <ManagementAdvisor>
                <OwnerPurchasesPage />
              </ManagementAdvisor>
            }
          />
          <Route path="/config" element={<ConfigLayout />}>
            <Route index element={<Navigate to="/config/identity" replace />} />
            <Route path="identity" element={<ConfigIdentityPage />} />
            <Route path="location" element={<ConfigLocationPage />} />
            <Route path="location/address" element={<ConfigLocationPage />} />
            <Route path="location/tables" element={<ConfigLocationPage />} />
            <Route path="schedule" element={<ConfigSchedulePage />} />
            <Route path="schedule/hours" element={<ConfigSchedulePage />} />
            <Route path="people" element={<ConfigPeoplePage />} />
            <Route path="people/employees" element={<ConfigPeoplePage />} />
            <Route path="people/roles" element={<ConfigPeoplePage />} />
            <Route path="payments" element={<ConfigPaymentsPage />} />
            <Route path="integrations" element={<ConfigIntegrationsPage />} />
            <Route path="modules" element={<ConfigModulesPage />} />
            <Route path="perception" element={<ConfigPerceptionPage />} />
            <Route path="status" element={<ConfigStatusPage />} />
          </Route>
          <Route path="/system-tree" element={<SystemTreePage />} />
          <Route
            path="/tasks"
            element={
              <ManagementAdvisor>
                <TaskDashboardPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/tasks/:taskId"
            element={
              <ManagementAdvisor>
                <TaskDetailPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/tasks/recurring"
            element={
              <ManagementAdvisor>
                <RecurringTasksPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/people"
            element={
              <ManagementAdvisor>
                <PeopleDashboardPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/people/time"
            element={
              <ManagementAdvisor>
                <TimeTrackingPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/health"
            element={
              <ManagementAdvisor>
                <HealthDashboardPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/alerts"
            element={
              <ManagementAdvisor>
                <AlertsDashboardPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/mentor"
            element={
              <ManagementAdvisor>
                <MentorDashboardPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/purchases"
            element={
              <ManagementAdvisor>
                <PurchasesDashboardPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/financial"
            element={
              <ManagementAdvisor>
                <FinancialDashboardPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/reservations"
            element={
              <ManagementAdvisor>
                <ReservationsDashboardPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/groups"
            element={
              <ManagementAdvisor>
                <GroupsDashboardPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/app/billing"
            element={
              <ManagementAdvisor>
                <BillingPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/app/publish"
            element={
              <ManagementAdvisor>
                <PublishPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/app/install"
            element={
              <ManagementAdvisor>
                <InstallPage />
              </ManagementAdvisor>
            }
          />

          {/* Tela neutra de reset (padrão) */}
          <Route path="*" element={<CoreResetPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
