/**
 * APP.TSX — RESET CONTROLADO
 *
 * Esta é a versão limpa após remoção total de UI/UX legada.
 */

import { useEffect, type ReactNode } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import "./App.css";
import { GlobalUIStateProvider } from "./context/GlobalUIStateContext";
import type { RestaurantRuntime } from "./context/RestaurantRuntimeContext";
import { RestaurantRuntimeContext } from "./context/RestaurantRuntimeContext";
import { deriveLifecycle } from "./core/lifecycle/Lifecycle";
import { ShiftContext } from "./core/shift/ShiftContext";
import { AppStaffMobileOnlyPage } from "./pages/AppStaff/AppStaffMobileOnlyPage";
import { BackofficePage } from "./pages/Backoffice/BackofficePage";
import { BillingPage } from "./pages/Billing/BillingPage";
import { BillingSuccessPage } from "./pages/Billing/BillingSuccessPage";
import { BootstrapPage } from "./pages/BootstrapPage";
import { CoreResetPage } from "./pages/CoreReset/CoreResetPage";
import { DebugTPV } from "./pages/DebugTPV";
import { HelpStartLocalPage } from "./pages/HelpStartLocalPage";
import { InventoryStockMinimal } from "./pages/InventoryStock/InventoryStockMinimal";
import { KDSMinimal } from "./pages/KDSMinimal/KDSMinimal";
import { MenuBuilderMinimal } from "./pages/MenuBuilder/MenuBuilderMinimal";
import { FirstProductPage } from "./pages/Onboarding/FirstProductPage";
import { OnboardingDayProfilePage } from "./pages/Onboarding/OnboardingDayProfilePage";
import { OnboardingIntroPage } from "./pages/Onboarding/OnboardingIntroPage";
import { OnboardingIdentityPage } from "./pages/Onboarding/OnboardingIdentityPage";
import { OnboardingLocationPage } from "./pages/Onboarding/OnboardingLocationPage";
import { OnboardingPlanTrialPage } from "./pages/Onboarding/OnboardingPlanTrialPage";
import { OnboardingProductsPage } from "./pages/Onboarding/OnboardingProductsPage";
import { OnboardingRitualPage } from "./pages/Onboarding/OnboardingRitualPage";
import { OnboardingShiftSetupPage } from "./pages/Onboarding/OnboardingShiftSetupPage";
import { OnboardingTpvPreviewPage } from "./pages/Onboarding/OnboardingTpvPreviewPage";
import { OperacaoMinimal } from "./pages/Operacao/OperacaoMinimal";
import { CustomerOrderStatusView } from "./pages/Public/CustomerOrderStatusView";
import { PublicKDS } from "./pages/Public/PublicKDS";
import { PublicWebPage } from "./pages/PublicWeb/PublicWebPage";
import { TablePage } from "./pages/PublicWeb/TablePage";
import { ShoppingListMinimal } from "./pages/ShoppingList/ShoppingListMinimal";
import { TPVDemoPage } from "./pages/TPVMinimal/TPVDemoPage";
import { TPVMinimal } from "./pages/TPVMinimal/TPVMinimal";
import { TaskSystemMinimal } from "./pages/TaskSystem/TaskSystemMinimal";

import { ManagementAdvisor } from "./components/onboarding/ManagementAdvisor";
import { OperationalFullscreenWrapper } from "./components/operational/OperationalFullscreenWrapper";
import { RequireOperational } from "./components/operational/RequireOperational";
import { ShiftGate } from "./components/operational/ShiftGate";
import { useGlobalUIState } from "./context/GlobalUIStateContext";
import { RoleGate } from "./core/roles";
import { ShiftGuard } from "./core/shift/ShiftGuard";
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
import { ProductFirstLandingPage } from "./pages/Landing/ProductFirstLandingPage";
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
import { DailyClosingReportPage } from "./pages/Reports/DailyClosingReportPage";
import { SalesByPeriodReportPage } from "./pages/Reports/SalesByPeriodReportPage";
import { ReservationsDashboardPage } from "./pages/Reservations/ReservationsDashboardPage";
import { RunbookCorePage } from "./pages/RunbookCorePage";
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
import { GlobalBlockedView } from "./ui/design-system/components/GlobalBlockedView";

import { FlowGate } from "./core/flow/FlowGate";
import { EventMonitorBootstrap } from "./core/tasks/EventMonitorBootstrap";

/** NAVIGATION_OPERATIONAL_CONTRACT: quando mode=demo, TPV sem RequireOperational; senão app normal. */
function TPVRouteHandler() {
  const [searchParams] = useSearchParams();
  if (searchParams.get("mode") === "demo") {
    return <TPVDemoPage />;
  }
  return <AppOperationalWrapper />;
}

// =============================================================================
// PUBLIC TREE (SEM AUTH) — providers mínimos para / e /op/tpv?mode=demo
// =============================================================================
const DEMO_RESTAURANT_ID = "00000000-0000-0000-0000-000000000100";
const demoRuntime: RestaurantRuntime = {
  restaurant_id: DEMO_RESTAURANT_ID,
  mode: "onboarding",
  productMode: "demo",
  installed_modules: [],
  active_modules: [],
  plan: "basic",
  status: "onboarding",
  billing_status: "trial",
  capabilities: {},
  setup_status: {},
  isPublished: false,
  lifecycle: deriveLifecycle(DEMO_RESTAURANT_ID, false, false),
  loading: false,
  error: null,
  coreReachable: true,
};
const demoRuntimeContextValue = {
  runtime: demoRuntime,
  refresh: async () => {},
  updateSetupStatus: async () => {},
  publishRestaurant: async () => {},
  installModule: async () => {},
  setProductMode: () => {},
};
const demoShiftValue = {
  isShiftOpen: true,
  isChecking: false,
  lastCheckedAt: new Date(),
  refreshShiftStatus: async () => {},
};

function PublicProviders({ children }: { children: ReactNode }) {
  return (
    <RestaurantRuntimeContext.Provider value={demoRuntimeContextValue}>
      <ShiftContext.Provider value={demoShiftValue}>
        <GlobalUIStateProvider>{children}</GlobalUIStateProvider>
      </ShiftContext.Provider>
    </RestaurantRuntimeContext.Provider>
  );
}

/** /op/tpv: se mode=demo → TPV demo (árvore pública); senão → redirect /auth (árvore de app). */
function TPVDemoGate() {
  const [searchParams] = useSearchParams();
  if (searchParams.get("mode") === "demo") {
    return (
      <PublicProviders>
        <TPVDemoPage />
      </PublicProviders>
    );
  }
  return <Navigate to="/auth" replace />;
}

function App() {
  return (
    <>
      {/* <PublicLifecycleSync /> */}
      <BillingsPreloader />
      <Routes>
        {/* Public / Landing — canónica: / e /landing = mesma Landing Operacional */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<Navigate to="/" replace />} />
        <Route path="/app/demo-tpv" element={<ProductFirstLandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        {/* Demo: redireccionado para auth (demo-guiado removido em refactor pós-freeze). */}
        <Route path="/demo" element={<Navigate to="/auth" replace />} />
        <Route path="/demo-guiado" element={<Navigate to="/auth" replace />} />

        {/* Auth / Onboarding Redirects */}
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
        <Route path="/bootstrap" element={<BootstrapPage />} />

        {/* Core Operations */}
        <Route path="/billing/success" element={<BillingSuccessPage />} />
        <Route path="/help/start-local" element={<HelpStartLocalPage />} />

        {/* App Content (Management/Operational) */}
        <Route path="/*" element={<AppOperationalWrapper />} />
      </Routes>
    </>
  );
}

function BillingsPreloader() {
  // Se precisarmos pré-carregar algo globalmente
  return (
    <>
      <ModeIndicator />
      <CoreUnavailableBanner />
    </>
  );
}

/** APPLICATION_BOOT_CONTRACT: MANAGEMENT/OPERATIONAL — Apenas Guards para rotas que precisam de Core. */
function AppOperationalWrapper() {
  return (
    <FlowGate>
      <ShiftGuard>
        <AppContentWithBilling />
      </ShiftGuard>
    </FlowGate>
  );
}

const LAST_ROUTE_KEY = "chefiapp_lastRoute";
const LAST_ROUTE_ALLOWED = [
  "/dashboard",
  "/app/dashboard",
  "/config",
  "/op/tpv",
  "/op/kds",
  "/op/cash",
];
const CRITICAL_BILLING_ROUTES = ["/op/tpv", "/op/kds", "/op/cash"];

function AppContentWithBilling() {
  const { isBillingBlocked, billingStatus } = useGlobalUIState();
  const location = useLocation();

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

  if (
    billingStatus === "past_due" &&
    CRITICAL_BILLING_ROUTES.includes(location.pathname) &&
    !isBillingManagement
  ) {
    return (
      <GlobalBlockedView
        title="Pagamento pendente"
        description="Regularize a faturação para continuar a usar o TPV e o KDS."
        action={{ label: "Ir à Faturação", to: "/app/billing" }}
      />
    );
  }

  const isDashboard =
    location.pathname === "/dashboard" ||
    location.pathname === "/app/dashboard";
  const isOperationalSurface =
    location.pathname.startsWith("/op/tpv") ||
    location.pathname.startsWith("/op/kds");
  return (
    <>
      <EventMonitorBootstrap />
      {!isDashboard && !isOperationalSurface && <BillingBanner />}
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
        {/* Onboarding 5min — 9 telas (docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md) */}
        <Route path="/onboarding" element={<Navigate to="/onboarding/intro" replace />} />
        <Route path="/onboarding/intro" element={<OnboardingIntroPage />} />
        <Route path="/onboarding/identity" element={<OnboardingIdentityPage />} />
        <Route path="/onboarding/location" element={<OnboardingLocationPage />} />
        <Route path="/onboarding/day-profile" element={<OnboardingDayProfilePage />} />
        <Route path="/onboarding/shift-setup" element={<OnboardingShiftSetupPage />} />
        <Route path="/onboarding/products" element={<OnboardingProductsPage />} />
        <Route path="/onboarding/tpv-preview" element={<OnboardingTpvPreviewPage />} />
        <Route path="/onboarding/plan-trial" element={<OnboardingPlanTrialPage />} />
        <Route path="/onboarding/ritual-open" element={<OnboardingRitualPage />} />
        <Route path="/app/select-tenant" element={<SelectTenantPage />} />
        <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />

        <Route element={<RoleGate />}>
          <Route
            path="/op/tpv/*"
            element={
              <ErrorBoundary context="TPV">
                <ShiftGate>
                  <OperationalFullscreenWrapper>
                    <TPVMinimal />
                  </OperationalFullscreenWrapper>
                </ShiftGate>
              </ErrorBoundary>
            }
          />
          <Route
            path="/op/kds"
            element={
              <ErrorBoundary context="KDS">
                <OperationalFullscreenWrapper>
                  <KDSMinimal />
                </OperationalFullscreenWrapper>
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
          <Route path="/kds" element={<Navigate to="/op/kds" replace />} />
          <Route
            path="/tpv-minimal"
            element={<Navigate to="/op/tpv" replace />}
          />

          <Route path="/dashboard" element={<DashboardPortal />} />
          <Route
            path="/app/dashboard"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route path="/app/runbook-core" element={<RunbookCorePage />} />
          <Route
            path="/onboarding/first-product"
            element={<FirstProductPage />}
          />
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
              <RequireOperational surface="TPV">
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
          {/* /app/menu-builder: destino final direto (sem tela intermédia "Core Conectado"). */}
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
          <Route
            path="/app/reports/daily-closing"
            element={
              <ManagementAdvisor>
                <DailyClosingReportPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/app/reports/sales-by-period"
            element={
              <ManagementAdvisor>
                <SalesByPeriodReportPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/app/reports/finance"
            element={<Navigate to="/financial" replace />}
          />
          {/* Página Web (sidebar) → Dashboard (comando central; em SETUP mostra "Complete o setup"). Não usar /config (onboarding antigo morto). */}
          <Route
            path="/app/web/preview"
            element={<Navigate to="/dashboard" replace />}
          />

          {/* Tela neutra de reset (padrão) */}
          <Route path="*" element={<CoreResetPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
