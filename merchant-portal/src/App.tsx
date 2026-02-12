/**
 * APP.TSX — RESET CONTROLADO
 *
 * Esta é a versão limpa após remoção total de UI/UX legada.
 */

import { useEffect, type ReactNode } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import type { RestaurantRuntime } from "./context/RestaurantRuntimeContext";
import { RestaurantRuntimeContext } from "./context/RestaurantRuntimeContext";
import { deriveLifecycle } from "./core/lifecycle/Lifecycle";
import { ShiftContext } from "./core/shift/ShiftContext";
import { AppStaffMobileOnlyPage } from "./pages/AppStaff/AppStaffMobileOnlyPage";
import { AppStaffWrapper } from "./pages/AppStaff/AppStaffWrapper";
import { ManagerExcecoesPage } from "./pages/AppStaff/apps/alerts";
import { KitchenDisplay } from "./pages/AppStaff/apps/kds";
import { StaffProfilePage } from "./pages/AppStaff/apps/profile";
import { ManagerTarefasPage } from "./pages/AppStaff/apps/tasks";
import { ManagerEquipePage } from "./pages/AppStaff/apps/team";
import { StaffTpvPage } from "./pages/AppStaff/apps/tpv";
import {
  CleaningSectorDashboard,
  KitchenSectorDashboard,
  OperationSectorDashboard,
  OwnerGlobalDashboard,
  TasksSectorDashboard,
  TeamSectorDashboard,
} from "./pages/AppStaff/dashboards";
import { CleaningHome } from "./pages/AppStaff/homes/CleaningHome";
import { KitchenHome } from "./pages/AppStaff/homes/KitchenHome";
import { ManagerHome } from "./pages/AppStaff/homes/ManagerHome";
import { WaiterHome } from "./pages/AppStaff/homes/WaiterHome";
import { WorkerHome } from "./pages/AppStaff/homes/WorkerHome";
import { ManagerTurnoPage } from "./pages/AppStaff/pages/ManagerTurnoPage";
import { OperationModePage } from "./pages/AppStaff/pages/OperationModePage";
import { StaffAppGate } from "./pages/AppStaff/routing/StaffAppGate";
import { StaffAppShellLayout } from "./pages/AppStaff/routing/StaffAppShellLayout";
import { StaffHomeRedirect } from "./pages/AppStaff/routing/StaffHomeRedirect";
import { StaffIndexRedirect } from "./pages/AppStaff/routing/StaffIndexRedirect";
import { StaffRoleGuard } from "./pages/AppStaff/routing/StaffRoleGuard";
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
import { MenuCatalogPage } from "./pages/MenuCatalog/MenuCatalogPage";
import { MenuCatalogPageV2 } from "./pages/MenuCatalog/MenuCatalogPageV2";
import { OperacaoMinimal } from "./pages/Operacao/OperacaoMinimal";
import { CustomerOrderStatusView } from "./pages/Public/CustomerOrderStatusView";
import { PublicKDS } from "./pages/Public/PublicKDS";
import { PublicWebPage } from "./pages/PublicWeb/PublicWebPage";
import { TablePage } from "./pages/PublicWeb/TablePage";
import { ShoppingListMinimal } from "./pages/ShoppingList/ShoppingListMinimal";
import { TPVMinimal } from "./pages/TPVMinimal/TPVMinimal";
import { TPVTrialPage } from "./pages/TPVMinimal/TPVTrialPage";
import { TaskSystemMinimal } from "./pages/TaskSystem/TaskSystemMinimal";

import { ManagementAdvisor } from "./components/onboarding/ManagementAdvisor";
import { OperationalFullscreenWrapper } from "./components/operational/OperationalFullscreenWrapper";
import { RequireOperational } from "./components/operational/RequireOperational";
import { ShiftGate } from "./components/operational/ShiftGate";
import {
  GlobalUIStateProvider,
  useGlobalUIState,
} from "./context/GlobalUIStateContext";
import { OnboardingProvider } from "./context/OnboardingContext";
import { RoleGate } from "./core/roles";
import { ShiftGuard } from "./core/shift/ShiftGuard";
import { AlertsDashboardPage } from "./pages/Alerts/AlertsDashboardPage";
import { AuthPage } from "./pages/AuthPage";
import { PhoneLoginPage } from "./pages/AuthPhone/PhoneLoginPage";
import { VerifyCodePage } from "./pages/AuthPhone/VerifyCodePage";
import { ConfigGeneralPage } from "./pages/Config/ConfigGeneralPage";
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
import { UbicacionCreatePage } from "./pages/Config/UbicacionCreatePage";
import { UbicacionEditPage } from "./pages/Config/UbicacionEditPage";
import { UbicacionesPage } from "./pages/Config/UbicacionesPage";
import { EmployeeHomePage } from "./pages/Employee/HomePage";
import { EmployeeKDSIntelligentPage } from "./pages/Employee/KDSIntelligentPage";
import { EmployeeOperationPage } from "./pages/Employee/OperationPage";
import { EmployeeTasksPage } from "./pages/Employee/TasksPage";

import { HealthDashboardPage } from "./pages/Health/HealthDashboardPage";
import { InstallPage } from "./pages/InstallPage";
import { FeaturesPage } from "./pages/Landing/FeaturesPage";
import { LandingPage } from "./pages/Landing/LandingPage";
import { PricingPage } from "./pages/Landing/PricingPage";
import { ProductFirstLandingPage } from "./pages/Landing/ProductFirstLandingPage";
import { LandingV2Page } from "./pages/LandingV2/LandingV2Page";
import { LegalPrivacyPage } from "./pages/Legal/LegalPrivacyPage";
import { LegalTermsPage } from "./pages/Legal/LegalTermsPage";
import { ManagerAnalysisPage } from "./pages/Manager/AnalysisPage";
import { ManagerCentralPage } from "./pages/Manager/CentralPage";
import { ManagerDashboardPage } from "./pages/Manager/DashboardPage";
import { ManagerReservationsPage } from "./pages/Manager/ReservationsPage";
import { ManagerScheduleCreatePage } from "./pages/Manager/ScheduleCreatePage";
import { ManagerSchedulePage } from "./pages/Manager/SchedulePage";

import { OwnerPurchasesPage } from "./pages/Owner/PurchasesPage";
import { OwnerSimulationPage } from "./pages/Owner/SimulationPage";
import { OwnerStockRealPage } from "./pages/Owner/StockRealPage";
import { OwnerVisionPage } from "./pages/Owner/VisionPage";
import { PeopleDashboardPage } from "./pages/People/PeopleDashboardPage";
import { TimeTrackingPage } from "./pages/People/TimeTrackingPage";
import { PublishPage } from "./pages/PublishPage";
import { PurchasesDashboardPage } from "./pages/Purchases/PurchasesDashboardPage";
import { DailyClosingReportPage } from "./pages/Reports/DailyClosingReportPage";
import { GamificationImpactReportPage } from "./pages/Reports/GamificationImpactReportPage";
import { OperationalActivityReportPage } from "./pages/Reports/OperationalActivityReportPage";
import { SalesByPeriodReportPage } from "./pages/Reports/SalesByPeriodReportPage";
import { SalesSummaryReportPage } from "./pages/Reports/SalesSummaryReportPage";

import { RunbookCorePage } from "./pages/RunbookCorePage";
import { SelectTenantPage } from "./pages/SelectTenantPage";
import { RestaurantMinimalSetupPage } from "./pages/Setup/RestaurantMinimalSetupPage";
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

import { AuthProvider } from "./core/auth/AuthProvider";
import { FlowGate } from "./core/flow/FlowGate";
import { EventMonitorBootstrap } from "./core/tasks/EventMonitorBootstrap";
import { CatalogAssignmentsPage } from "./features/admin/catalog/pages/CatalogAssignmentsPage";
import { CatalogListPage } from "./features/admin/catalog/pages/CatalogListPage";
import { CombosPage } from "./features/admin/catalog/pages/CombosPage";
import { ModifiersPage } from "./features/admin/catalog/pages/ModifiersPage";
import { ProductsPage } from "./features/admin/catalog/pages/ProductsPage";
import { TranslationsPage } from "./features/admin/catalog/pages/TranslationsPage";
import { ClosuresPage } from "./features/admin/closures/pages/ClosuresPage";
import { AdminConfigLayout } from "./features/admin/config/components/AdminConfigLayout";
import { DeliveryConfigPage } from "./features/admin/config/pages/DeliveryConfigPage";
import { DispositivosConfigPage } from "./features/admin/config/pages/DispositivosConfigPage";
import { EmpleadosConfigPage } from "./features/admin/config/pages/EmpleadosConfigPage";
import { EntidadesLegalesConfigPage } from "./features/admin/config/pages/EntidadesLegalesConfigPage";
import { GeneralConfigPage } from "./features/admin/config/pages/GeneralConfigPage";
import { ImpresorasConfigPage } from "./features/admin/config/pages/ImpresorasConfigPage";
import { IntegracionesConfigPage } from "./features/admin/config/pages/IntegracionesConfigPage";
import { MarcasConfigPage } from "./features/admin/config/pages/MarcasConfigPage";
import { ProductosConfigPage } from "./features/admin/config/pages/ProductosConfigPage";
import { ReservasConfigPage } from "./features/admin/config/pages/ReservasConfigPage";
import { SoftwareTpvConfigPage } from "./features/admin/config/pages/SoftwareTpvConfigPage";
import { SuscripcionConfigPage } from "./features/admin/config/pages/SuscripcionConfigPage";
import { UbicacionesConfigPage } from "./features/admin/config/pages/UbicacionesConfigPage";
import { UsuariosConfigPage } from "./features/admin/config/pages/UsuariosConfigPage";
import { CustomerDetailPage } from "./features/admin/customers/pages/CustomerDetailPage";
import { CustomersPage } from "./features/admin/customers/pages/CustomersPage";
import { DashboardLayout } from "./features/admin/dashboard/components/DashboardLayout";
import { AdminPlaceholderPage } from "./features/admin/dashboard/pages/AdminPlaceholderPage";
import { DashboardHomePage } from "./features/admin/dashboard/pages/DashboardHomePage";
import { ModulesPage } from "./features/admin/modules/pages/ModulesPage";
import { ObservabilityPage } from "./features/admin/observability/pages/ObservabilityPage";
import { PaymentsLayout } from "./features/admin/payments/pages/PaymentsLayout";
import { PayoutsPage } from "./features/admin/payments/pages/PayoutsPage";
import { TransactionsPage } from "./features/admin/payments/pages/TransactionsPage";
import { PromotionsPage } from "./features/admin/promotions/pages/PromotionsPage";
import { AdminReportsOverview } from "./features/admin/reports/AdminReportsOverview";
import { ReservationsOperationalPage } from "./features/admin/reservas/pages/ReservationsOperationalPage";

// Mentorship feature
import { isTrialModeParam } from "./core/routing/TrialMode";
import { MentorPage } from "./features/mentorship";

/** NAVIGATION_OPERATIONAL_CONTRACT: quando mode=trial, TPV sem RequireOperational; senão app normal. */
function TPVRouteHandler() {
  const [searchParams] = useSearchParams();
  if (isTrialModeParam(searchParams)) {
    return <TPVTrialPage />;
  }
  return <AppOperationalWrapper />;
}

// =============================================================================
// PUBLIC TREE (SEM AUTH) — providers mínimos para / e /op/tpv?mode=trial
// =============================================================================
const TRIAL_RESTAURANT_ID = "00000000-0000-0000-0000-000000000100";
const trialRuntime: RestaurantRuntime = {
  restaurant_id: TRIAL_RESTAURANT_ID,
  mode: "onboarding",
  productMode: "trial",
  dataMode: "trial",
  installed_modules: [],
  active_modules: [],
  plan: "basic",
  status: "onboarding",
  billing_status: "trial",
  capabilities: {},
  setup_status: {},
  isPublished: false,
  lifecycle: deriveLifecycle(TRIAL_RESTAURANT_ID, false, false),
  loading: false,
  error: null,
  coreReachable: true,
  systemState: "TRIAL",
  coreMode: "online",
};
const trialRuntimeContextValue = {
  runtime: trialRuntime,
  refresh: async () => {},
  updateSetupStatus: async () => {},
  publishRestaurant: async () => {},
  installModule: async () => {},
  setProductMode: (_mode: any) => {},
};
const trialShiftValue = {
  isShiftOpen: true,
  isChecking: false,
  lastCheckedAt: new Date(),
  refreshShiftStatus: async () => {},
  markShiftOpen: () => {},
};

function PublicProviders({ children }: { children: ReactNode }) {
  return (
    <RestaurantRuntimeContext.Provider value={trialRuntimeContextValue}>
      <ShiftContext.Provider value={trialShiftValue}>
        <GlobalUIStateProvider>{children}</GlobalUIStateProvider>
      </ShiftContext.Provider>
    </RestaurantRuntimeContext.Provider>
  );
}

/** /op/tpv: se mode=trial → TPV trial (árvore pública); senão → redirect /auth (árvore de app). */
function TPVTrialGate() {
  const [searchParams] = useSearchParams();
  if (isTrialModeParam(searchParams)) {
    return (
      <PublicProviders>
        <TPVTrialPage />
      </PublicProviders>
    );
  }
  return <Navigate to="/auth" replace />;
}

function App() {
  return (
    <ErrorBoundary context="Root">
      <AuthProvider>
        {/* <PublicLifecycleSync /> */}
        <BillingsPreloader />
        <Routes>
          {/* Public / Landing — canónica: / e /landing = mesma Landing Operacional */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<Navigate to="/" replace />} />
          <Route path="/v2" element={<LandingV2Page />} />
          <Route path="/app/trial-tpv" element={<ProductFirstLandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/legal/terms" element={<LegalTermsPage />} />
          <Route path="/legal/privacy" element={<LegalPrivacyPage />} />
          {/* Demo Guide: entrada pública para o TPV em modo Free Trial. */}
          <Route
            path="/trial"
            element={<Navigate to="/op/tpv?mode=trial" replace />}
          />
          <Route
            path="/trial-guide"
            element={<Navigate to="/op/tpv?mode=trial" replace />}
          />

          {/* Auth / Onboarding Redirects */}
          <Route
            path="/login"
            element={<Navigate to="/auth/phone" replace />}
          />
          <Route
            path="/signup"
            element={<Navigate to="/auth/phone" replace />}
          />
          <Route
            path="/forgot-password"
            element={<Navigate to="/auth/email" replace />}
          />
          <Route path="/auth" element={<Navigate to="/auth/phone" replace />} />
          <Route path="/auth/phone" element={<PhoneLoginPage />} />
          <Route path="/auth/verify" element={<VerifyCodePage />} />
          <Route path="/auth/email" element={<AuthPage />} />
          <Route path="/bootstrap" element={<BootstrapPage />} />
          <Route
            path="/setup/restaurant-minimal"
            element={<RestaurantMinimalSetupPage />}
          />

          {/* Core Operations */}
          <Route path="/billing/success" element={<BillingSuccessPage />} />
          <Route path="/help/start-local" element={<HelpStartLocalPage />} />

          {/* Menu: catálogo visual de decisão (spec MENU_CATALOG_VISUAL_SPEC) */}
          <Route path="/menu" element={<MenuCatalogPage />} />
          <Route path="/menu-v2" element={<MenuCatalogPageV2 />} />

          {/* Mentoria — acessível sem auth para dev/teste */}
          <Route path="/mentor" element={<MentorPage />} />

          {/* App Content (Management/Operational) */}
          <Route path="/*" element={<AppOperationalWrapper />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
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
  const isStaffLauncher =
    location.pathname === "/app/staff/home" ||
    location.pathname.startsWith("/app/staff/home/") ||
    location.pathname === "/app/staff" ||
    location.pathname === "/app/staff/";
  const isStaffMore = location.pathname.startsWith("/app/staff/profile");
  const shouldShowBillingBanner = isStaffLauncher || isStaffMore;
  return (
    <>
      <EventMonitorBootstrap />
      {!isDashboard && !isOperationalSurface && shouldShowBillingBanner && (
        <BillingBanner />
      )}
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
        {/* App operacional único: /app → home do shell (Home | Operação | TPV | KDS | Mais) */}
        <Route
          path="/app"
          element={<Navigate to="/app/staff/home" replace />}
        />

        <Route element={<RoleGate />}>
          <Route
            path="/op/tpv/*"
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

          <Route
            path="/dashboard"
            element={<Navigate to="/admin/reports/overview" replace />}
          />
          <Route
            path="/app/dashboard"
            element={<Navigate to="/admin/reports/overview" replace />}
          />
          <Route path="/app/runbook-core" element={<RunbookCorePage />} />
          <Route path="/menu-builder" element={<MenuBuilderMinimal />} />
          <Route
            path="/operacao"
            element={
              <ErrorBoundary
                context="Pedidos"
                fallback={
                  <GlobalBlockedView
                    title="Pedidos indisponíveis"
                    description="O módulo de pedidos encontrou um erro. Recarregue a tela para continuar o atendimento."
                    action={{
                      label: "Recarregar",
                      onClick: () => window.location.reload(),
                    }}
                  />
                }
              >
                <RequireOperational>
                  <OperacaoMinimal />
                </RequireOperational>
              </ErrorBoundary>
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
          {/* AppStaff: /app/staff → redirect para /app/staff/home; rotas do shell para evitar cair em /app/dashboard (reports). */}
          <Route path="/app/staff" element={<AppStaffWrapper />}>
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
              {/* Dashboards de Setor (nível 2): OwnerHome → Sector → Ferramenta */}
              <Route
                path="sector/operation"
                element={<OperationSectorDashboard />}
              />
              <Route path="sector/tasks" element={<TasksSectorDashboard />} />
              <Route path="sector/team" element={<TeamSectorDashboard />} />
              <Route
                path="sector/kitchen"
                element={<KitchenSectorDashboard />}
              />
              <Route
                path="sector/cleaning"
                element={<CleaningSectorDashboard />}
              />
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
          </Route>
          {/* Control Room não é app separado: visão dono/gerente vive em Home/Operação */}
          <Route
            path="/app/control-room"
            element={<Navigate to="/app/staff/mode/operation" replace />}
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
                {/* <EmployeeMentorPage /> */}
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
          <Route
            path="/admin"
            element={<Navigate to="/admin/reports/overview" replace />}
          />
          <Route
            path="/admin/home"
            element={
              <ManagementAdvisor>
                <DashboardHomePage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/admin/clients"
            element={<Navigate to="/admin/customers" replace />}
          />
          <Route
            path="/admin/customers"
            element={
              <ManagementAdvisor>
                <DashboardLayout>
                  <CustomersPage />
                </DashboardLayout>
              </ManagementAdvisor>
            }
          />
          <Route
            path="/admin/customers/:id"
            element={
              <ManagementAdvisor>
                <DashboardLayout>
                  <CustomerDetailPage />
                </DashboardLayout>
              </ManagementAdvisor>
            }
          />
          <Route
            path="/admin/closures"
            element={
              <ManagementAdvisor>
                <DashboardLayout>
                  <ClosuresPage />
                </DashboardLayout>
              </ManagementAdvisor>
            }
          />
          <Route
            path="/admin/reservations"
            element={
              <ManagementAdvisor>
                <DashboardLayout>
                  <ReservationsOperationalPage />
                </DashboardLayout>
              </ManagementAdvisor>
            }
          />
          <Route
            path="/admin/payments/list"
            element={<Navigate to="/admin/payments/transactions" replace />}
          />
          <Route
            path="/admin/payments/refunds"
            element={
              <ManagementAdvisor>
                <AdminPlaceholderPage
                  title="Pagos eliminados / Reembolsos"
                  message="Em breve."
                />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/admin/payments/pending"
            element={
              <ManagementAdvisor>
                <AdminPlaceholderPage
                  title="Pagos pendentes"
                  message="Em breve."
                />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ManagementAdvisor>
                <DashboardLayout>
                  <PaymentsLayout />
                </DashboardLayout>
              </ManagementAdvisor>
            }
          >
            <Route index element={<Navigate to="transactions" replace />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="payouts" element={<PayoutsPage />} />
          </Route>
          <Route
            path="/admin/promotions"
            element={
              <ManagementAdvisor>
                <DashboardLayout>
                  <PromotionsPage />
                </DashboardLayout>
              </ManagementAdvisor>
            }
          />
          {/* ── Catalog domain (nested under /admin/catalog/*) ── */}
          <Route
            path="/admin/catalog/list"
            element={
              <ManagementAdvisor>
                <DashboardLayout>
                  <CatalogListPage />
                </DashboardLayout>
              </ManagementAdvisor>
            }
          />
          <Route
            path="/admin/catalog/assignments"
            element={
              <ManagementAdvisor>
                <DashboardLayout>
                  <CatalogAssignmentsPage />
                </DashboardLayout>
              </ManagementAdvisor>
            }
          />
          <Route
            path="/admin/catalog/products"
            element={
              <ManagementAdvisor>
                <DashboardLayout>
                  <ProductsPage />
                </DashboardLayout>
              </ManagementAdvisor>
            }
          />
          <Route
            path="/admin/catalog/modules"
            element={
              <ManagementAdvisor>
                <DashboardLayout>
                  <ModulesPage />
                </DashboardLayout>
              </ManagementAdvisor>
            }
          />
          <Route
            path="/admin/catalog/modifiers"
            element={
              <ManagementAdvisor>
                <DashboardLayout>
                  <ModifiersPage />
                </DashboardLayout>
              </ManagementAdvisor>
            }
          />
          <Route
            path="/admin/catalog/combos"
            element={
              <ManagementAdvisor>
                <DashboardLayout>
                  <CombosPage />
                </DashboardLayout>
              </ManagementAdvisor>
            }
          />
          <Route
            path="/admin/catalog/translations"
            element={
              <ManagementAdvisor>
                <DashboardLayout>
                  <TranslationsPage />
                </DashboardLayout>
              </ManagementAdvisor>
            }
          />
          {/* Default: /admin/catalog → /admin/catalog/products */}
          <Route
            path="/admin/catalog"
            element={<Navigate to="/admin/catalog/products" replace />}
          />
          {/* ── Backward-compat redirects (old flat routes) ── */}
          <Route
            path="/admin/catalogs"
            element={<Navigate to="/admin/catalog/list" replace />}
          />
          <Route
            path="/admin/catalog-assignments"
            element={<Navigate to="/admin/catalog/assignments" replace />}
          />
          <Route
            path="/admin/products"
            element={<Navigate to="/admin/catalog/products" replace />}
          />
          <Route
            path="/admin/modules"
            element={<Navigate to="/admin/catalog/modules" replace />}
          />
          <Route
            path="/admin/modifiers"
            element={<Navigate to="/admin/catalog/modifiers" replace />}
          />
          <Route
            path="/admin/combos"
            element={<Navigate to="/admin/catalog/combos" replace />}
          />
          <Route
            path="/admin/translations"
            element={<Navigate to="/admin/catalog/translations" replace />}
          />
          <Route
            path="/admin/reports/overview"
            element={
              <ManagementAdvisor>
                <DashboardLayout>
                  <AdminReportsOverview />
                </DashboardLayout>
              </ManagementAdvisor>
            }
          />
          <Route
            path="/admin/reports/sales"
            element={
              <ManagementAdvisor>
                <DashboardLayout>
                  <SalesByPeriodReportPage />
                </DashboardLayout>
              </ManagementAdvisor>
            }
          />
          <Route
            path="/admin/reports/staff"
            element={
              <ManagementAdvisor>
                <AdminPlaceholderPage
                  title="Reportes — Staff"
                  message="Em breve."
                />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/admin/reports/operations"
            element={
              <ManagementAdvisor>
                <DashboardLayout>
                  <OperationalActivityReportPage />
                </DashboardLayout>
              </ManagementAdvisor>
            }
          />
          <Route
            path="/admin/reports/human-performance"
            element={
              <ManagementAdvisor>
                <DashboardLayout>
                  <GamificationImpactReportPage />
                </DashboardLayout>
              </ManagementAdvisor>
            }
          />
          <Route
            path="/admin/reports"
            element={<Navigate to="/admin/reports/overview" replace />}
          />
          <Route
            path="/admin/observability"
            element={
              <ManagementAdvisor>
                <DashboardLayout>
                  <ObservabilityPage />
                </DashboardLayout>
              </ManagementAdvisor>
            }
          />
          <Route
            path="/admin/devices"
            element={
              <ManagementAdvisor>
                <DashboardLayout>
                  <InstallPage />
                </DashboardLayout>
              </ManagementAdvisor>
            }
          />
          <Route
            path="/admin/settings"
            element={<Navigate to="/admin/config" replace />}
          />
          <Route
            path="/admin/config"
            element={
              <ManagementAdvisor>
                <OnboardingProvider>
                  <DashboardLayout>
                    <AdminConfigLayout />
                  </DashboardLayout>
                </OnboardingProvider>
              </ManagementAdvisor>
            }
          >
            <Route index element={<Navigate to="general" replace />} />
            <Route path="general" element={<GeneralConfigPage />} />
            <Route path="productos" element={<ProductosConfigPage />} />
            <Route path="suscripcion" element={<SuscripcionConfigPage />} />
            <Route path="ubicaciones" element={<UbicacionesConfigPage />} />
            <Route
              path="ubicaciones/address"
              element={<UbicacionesConfigPage />}
            />
            <Route
              path="ubicaciones/tables"
              element={<UbicacionesConfigPage />}
            />
            <Route
              path="entidades-legales"
              element={<EntidadesLegalesConfigPage />}
            />
            <Route path="marcas" element={<MarcasConfigPage />} />
            <Route path="usuarios" element={<UsuariosConfigPage />} />
            <Route path="dispositivos" element={<DispositivosConfigPage />} />
            <Route path="impresoras" element={<ImpresorasConfigPage />} />
            <Route path="integrations" element={<IntegracionesConfigPage />} />
            <Route path="delivery" element={<DeliveryConfigPage />} />
            <Route
              path="delivery/plano-mesas"
              element={<DeliveryConfigPage />}
            />
            <Route path="delivery/horarios" element={<DeliveryConfigPage />} />
            <Route path="delivery/qr" element={<DeliveryConfigPage />} />
            <Route path="empleados" element={<EmpleadosConfigPage />} />
            <Route
              path="empleados/employees"
              element={<EmpleadosConfigPage />}
            />
            <Route path="empleados/roles" element={<EmpleadosConfigPage />} />
            <Route path="software-tpv" element={<SoftwareTpvConfigPage />} />
            <Route
              path="software-tpv/config"
              element={<SoftwareTpvConfigPage />}
            />
            <Route
              path="software-tpv/modo-rapido"
              element={<SoftwareTpvConfigPage />}
            />
            <Route path="reservas" element={<ReservasConfigPage />} />
            <Route
              path="reservas/disponibilidad"
              element={<ReservasConfigPage />}
            />
            <Route path="reservas/garantia" element={<ReservasConfigPage />} />
            <Route path="reservas/turnos" element={<ReservasConfigPage />} />
            <Route path="reservas/mensajes" element={<ReservasConfigPage />} />
          </Route>
          <Route path="/config" element={<ConfigLayout />}>
            <Route index element={<Navigate to="/config/general" replace />} />
            <Route path="general" element={<ConfigGeneralPage />} />
            <Route path="identity" element={<ConfigIdentityPage />} />
            <Route path="location" element={<ConfigLocationPage />} />
            <Route path="ubicaciones" element={<UbicacionesPage />} />
            <Route path="ubicaciones/nova" element={<UbicacionCreatePage />} />
            <Route path="ubicaciones/:id" element={<UbicacionEditPage />} />
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
            path="/purchases"
            element={
              <ManagementAdvisor>
                <PurchasesDashboardPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/financial"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/reservations"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/groups"
            element={<Navigate to="/dashboard" replace />}
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
            path="/app/reports/sales-summary"
            element={
              <ManagementAdvisor>
                <SalesSummaryReportPage />
              </ManagementAdvisor>
            }
          />
          <Route
            path="/app/reports/finance"
            element={<Navigate to="/dashboard" replace />}
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
