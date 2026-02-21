/**
 * Rotas operacionais (public/:slug, RoleGate, op/, app/staff/, admin/, config/).
 * Exporta Fragment para usar como filho direto de <Routes> (React Router v6).
 * Uso: <Routes>{OperationalRoutesFragment}</Routes>
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * WORLD SEPARATION — CORPORATE SaaS vs OPERATIONAL POS
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * WORLD: CORPORATE SaaS (Web browser — login required via Keycloak)
 * ─────────────────────────────────────────────────────────────
 *   /welcome          → Landing / login
 *   /onboarding       → Onboarding wizard
 *   /bootstrap        → Initial restaurant creation
 *   /app/activation   → Activation center (post-onboarding)
 *   /app/select-tenant → Multi-tenant picker
 *   /app/billing      → Billing center (Stripe checkout/portal)
 *   /admin/*          → Restaurant admin (config, reports, catalog, devices…)
 *   /admin/organization → Organization management (company, restaurants, team)
 *
 * WORLD: OPERATIONAL POS (Device-provisioned — no external login)
 * ─────────────────────────────────────────────────────────────
 *   /app/staff/*      → AppStaff (mobile PWA — QR provisioned)
 *   /op/tpv           → Point of Sale (desktop terminal)
 *   /op/kds           → Kitchen Display System (desktop terminal)
 *   /app/waiter/*     → Waiter module (mobile)
 *   /install          → Device provisioning (token-based)
 *
 * WORLD: PUBLIC (No auth)
 * ─────────────────────────────────────────────────────────────
 *   /public/:slug/*   → Customer-facing web (menu, QR ordering, order status)
 *
 * Principle: "Liga → Funciona → Opera" — operational devices should work
 * without corporate login. They are provisioned via QR install tokens.
 * ══════════════════════════════════════════════════════════════════════════════
 */
// @ts-nocheck

import { Fragment } from "react";
import { Navigate, Outlet, Route } from "react-router-dom";
import { ManagementAdvisor } from "../components/onboarding/ManagementAdvisor";
import { BrowserBlockGuard } from "../components/operational/BrowserBlockGuard";
import { OperationalFullscreenWrapper } from "../components/operational/OperationalFullscreenWrapper";
import { RequireOperational } from "../components/operational/RequireOperational";
import { ShiftGate } from "../components/operational/ShiftGate";
import { OnboardingProvider } from "../context/OnboardingContext";
import { RoleGate } from "../core/roles";
import { CatalogAssignmentsPage } from "../features/admin/catalog/pages/CatalogAssignmentsPage";
import { CatalogListPage } from "../features/admin/catalog/pages/CatalogListPage";
import { CombosPage } from "../features/admin/catalog/pages/CombosPage";
import { ModifiersPage } from "../features/admin/catalog/pages/ModifiersPage";
import { ProductsPage } from "../features/admin/catalog/pages/ProductsPage";
import { TranslationsPage } from "../features/admin/catalog/pages/TranslationsPage";
import { ClosuresPage } from "../features/admin/closures/pages/ClosuresPage";
import { AdminConfigLayout } from "../features/admin/config/components/AdminConfigLayout";
import { IntegrationsHubLayout } from "../features/admin/config/components/IntegrationsHubLayout";
import { DeliveryConfigPage } from "../features/admin/config/pages/DeliveryConfigPage";
import { DispositivosConfigPage } from "../features/admin/config/pages/DispositivosConfigPage";
import { EmpleadosConfigPage } from "../features/admin/config/pages/EmpleadosConfigPage";
import { EntidadesLegalesConfigPage } from "../features/admin/config/pages/EntidadesLegalesConfigPage";
import { GeneralConfigPage } from "../features/admin/config/pages/GeneralConfigPage";
import { ImpresorasConfigPage } from "../features/admin/config/pages/ImpresorasConfigPage";
import { IntegracionesConfigPage } from "../features/admin/config/pages/IntegracionesConfigPage";
import { MarcasConfigPage } from "../features/admin/config/pages/MarcasConfigPage";
import { ReservasConfigPage } from "../features/admin/config/pages/ReservasConfigPage";
import { SoftwareTpvConfigPage } from "../features/admin/config/pages/SoftwareTpvConfigPage";
import { SuscripcionConfigPage } from "../features/admin/config/pages/SuscripcionConfigPage";
import { TiendaOnlineConfigPage } from "../features/admin/config/pages/TiendaOnlineConfigPage";
import { UbicacionesConfigPage } from "../features/admin/config/pages/UbicacionesConfigPage";
import { UsuariosConfigPage } from "../features/admin/config/pages/UsuariosConfigPage";
import {
  IntegrationsDeliveryPage,
  IntegrationsGoogleBusinessPage,
  IntegrationsInstagramPage,
  IntegrationsOtherPage,
  IntegrationsPaymentsPage,
  IntegrationsWebhooksPage,
  IntegrationsWhatsAppPage,
} from "../features/admin/config/pages/integrations";
import { CustomerDetailPage } from "../features/admin/customers/pages/CustomerDetailPage";
import { CustomersPage } from "../features/admin/customers/pages/CustomersPage";
import { DashboardLayout } from "../features/admin/dashboard/components/DashboardLayout";
import { DashboardHomePage } from "../features/admin/dashboard/pages/DashboardHomePage";
import { AdminDevicesPage } from "../features/admin/devices/AdminDevicesPage";
import { ModulesPage } from "../features/admin/modules/pages/ModulesPage";
import { ObservabilityPage } from "../features/admin/observability/pages/ObservabilityPage";
import { AdminOrganizationPage } from "../features/admin/organization/AdminOrganizationPage";
import { PaymentsLayout } from "../features/admin/payments/pages/PaymentsLayout";
import { PayoutsPage } from "../features/admin/payments/pages/PayoutsPage";
import { TransactionsPage } from "../features/admin/payments/pages/TransactionsPage";
import { PromotionsPage } from "../features/admin/promotions/pages/PromotionsPage";
import { AdminReportsOverview } from "../features/admin/reports/AdminReportsOverview";
import { MultiUnitOverviewReportPage } from "../features/admin/reports/MultiUnitOverviewReportPage";
import { ReservationsOperationalPage } from "../features/admin/reservas/pages/ReservationsOperationalPage";
import { KDSMobilePage } from "../features/kds-mobile";
import { TPVMobilePage } from "../features/pv-mobile";
import { ActivationCenterPage } from "../pages/Activation/ActivationCenterPage";
import { AlertsDashboardPage } from "../pages/Alerts/AlertsDashboardPage";
import { AppStaffHome } from "../pages/AppStaff/AppStaffHome";
import { AppStaffMobileOnlyPage } from "../pages/AppStaff/AppStaffMobileOnlyPage";
import { AppStaffWrapper } from "../pages/AppStaff/AppStaffWrapper";
import { ManagerExcecoesPage } from "../pages/AppStaff/apps/alerts";
import { KitchenDisplay } from "../pages/AppStaff/apps/kds";
import { StaffProfilePage } from "../pages/AppStaff/apps/profile";
import { ManagerTarefasPage } from "../pages/AppStaff/apps/tasks";
import { ManagerEquipePage } from "../pages/AppStaff/apps/team";
import { StaffTpvPage } from "../pages/AppStaff/apps/tpv";
import {
  CleaningSectorDashboard,
  KitchenSectorDashboard,
  OperationSectorDashboard,
  OwnerGlobalDashboard,
  TasksSectorDashboard,
  TeamSectorDashboard,
} from "../pages/AppStaff/dashboards";
import { CleaningHome } from "../pages/AppStaff/homes/CleaningHome";
import { KitchenHome } from "../pages/AppStaff/homes/KitchenHome";
import { ManagerHome } from "../pages/AppStaff/homes/ManagerHome";
import { WorkerHome } from "../pages/AppStaff/homes/WorkerHome";
import { ConfigDesktopOnlyPage } from "../pages/AppStaff/pages/ConfigDesktopOnlyPage";
import { ManagerTurnoPage } from "../pages/AppStaff/pages/ManagerTurnoPage";
import { OperationModePage } from "../pages/AppStaff/pages/OperationModePage";
import { ScannerModePage } from "../pages/AppStaff/pages/ScannerModePage";
import { StaffAppGate } from "../pages/AppStaff/routing/StaffAppGate";
import { StaffAppShellLayout } from "../pages/AppStaff/routing/StaffAppShellLayout";
import { StaffHomeRedirect } from "../pages/AppStaff/routing/StaffHomeRedirect";
import { StaffIndexRedirect } from "../pages/AppStaff/routing/StaffIndexRedirect";
import { StaffRoleGuard } from "../pages/AppStaff/routing/StaffRoleGuard";
import { BackofficePage } from "../pages/Backoffice/BackofficePage";
import { BillingPage } from "../pages/Billing/BillingPage";
import { BootstrapPage } from "../pages/BootstrapPage";
import { CoreResetPage } from "../pages/CoreReset/CoreResetPage";
import { DebugTPV } from "../pages/DebugTPV";
import { EmployeeHomePage } from "../pages/Employee/HomePage";
import { EmployeeKDSIntelligentPage } from "../pages/Employee/KDSIntelligentPage";
import { EmployeeOperationPage } from "../pages/Employee/OperationPage";
import { EmployeeTasksPage } from "../pages/Employee/TasksPage";
import { HealthDashboardPage } from "../pages/Health/HealthDashboardPage";
import { HelpPage } from "../pages/Help/HelpPage";
import { InstallAppsPage } from "../pages/InstallAppsPage";
import { InstallPage } from "../pages/InstallPage";
import { InventoryStockMinimal } from "../pages/InventoryStock/InventoryStockMinimal";
import { KDSMinimal } from "../pages/KDSMinimal/KDSMinimal";
import { ManagerAnalysisPage } from "../pages/Manager/AnalysisPage";
import { ManagerCentralPage } from "../pages/Manager/CentralPage";
import { ManagerDashboardPage } from "../pages/Manager/DashboardPage";
import { ManagerReservationsPage } from "../pages/Manager/ReservationsPage";
import { ManagerScheduleCreatePage } from "../pages/Manager/ScheduleCreatePage";
import { ManagerSchedulePage } from "../pages/Manager/SchedulePage";
import { MenuBuilderMinimal } from "../pages/MenuBuilder/MenuBuilderMinimal";
import { OnboardingAssistantPage } from "../pages/Onboarding/OnboardingAssistantPage";
import { OperacaoMinimal } from "../pages/Operacao/OperacaoMinimal";
import { OwnerPurchasesPage } from "../pages/Owner/PurchasesPage";
import { OwnerSimulationPage } from "../pages/Owner/SimulationPage";
import { OwnerStockRealPage } from "../pages/Owner/StockRealPage";
import { OwnerVisionPage } from "../pages/Owner/VisionPage";
import { PeopleDashboardPage } from "../pages/People/PeopleDashboardPage";
import { TimeTrackingPage } from "../pages/People/TimeTrackingPage";
import { CustomerOrderStatusView } from "../pages/Public/CustomerOrderStatusView";
import { PublicKDS } from "../pages/Public/PublicKDS";
import { PublicWebPage } from "../pages/PublicWeb/PublicWebPage";
import { TablePage } from "../pages/PublicWeb/TablePage";
import { PublishPage } from "../pages/PublishPage";
import { PurchasesDashboardPage } from "../pages/Purchases/PurchasesDashboardPage";
import { DailyClosingReportPage } from "../pages/Reports/DailyClosingReportPage";
import { GamificationImpactReportPage } from "../pages/Reports/GamificationImpactReportPage";
import { OperationalActivityReportPage } from "../pages/Reports/OperationalActivityReportPage";
import { SaftExportPage } from "../pages/Reports/SaftExportPage";
import { SalesByPeriodReportPage } from "../pages/Reports/SalesByPeriodReportPage";
import { SalesSummaryReportPage } from "../pages/Reports/SalesSummaryReportPage";
import { RunbookCorePage } from "../pages/RunbookCorePage";
import { SelectTenantPage } from "../pages/SelectTenantPage";
import { ShoppingListMinimal } from "../pages/ShoppingList/ShoppingListMinimal";
import { SystemTreePage } from "../pages/SystemTree/SystemTreePage";
import { TPVKitchenPage } from "../pages/TPVMinimal/TPVKitchenPage";
import { TPVLayout } from "../pages/TPVMinimal/TPVLayout";
import { TPVOrdersPage } from "../pages/TPVMinimal/TPVOrdersPage";
import { TPVPOSView } from "../pages/TPVMinimal/TPVPOSView";
import { TPVReservationsPage } from "../pages/TPVMinimal/TPVReservationsPage";
import { TPVSettingsPage } from "../pages/TPVMinimal/TPVSettingsPage";
import { TPVShiftPage } from "../pages/TPVMinimal/TPVShiftPage";
import { TPVTablesPage } from "../pages/TPVMinimal/TPVTablesPage";
import { TPVTasksPage } from "../pages/TPVMinimal/TPVTasksPage";
import { TaskSystemMinimal } from "../pages/TaskSystem/TaskSystemMinimal";
import { RecurringTasksPage } from "../pages/Tasks/RecurringTasksPage";
import { TaskDashboardPage } from "../pages/Tasks/TaskDashboardPage";
import { TaskDetailPage } from "../pages/Tasks/TaskDetailPage";
import { TablePanel } from "../pages/Waiter/TablePanel";
import { WaiterHomePage } from "../pages/Waiter/WaiterHomePage";
import { WelcomePage } from "../pages/Welcome/WelcomePage";
import { ErrorBoundary } from "../ui/design-system/ErrorBoundary";
import { GlobalBlockedView } from "../ui/design-system/components/GlobalBlockedView";
export const OperationalRoutesFragment = (
  <Fragment>
    <Route path="/public/:slug" element={<PublicWebPage />} />
    <Route path="/public/:slug/mesa/:number" element={<TablePage />} />
    <Route
      path="/public/:slug/order/:orderId"
      element={<CustomerOrderStatusView />}
    />
    <Route path="/public/:slug/kds" element={<PublicKDS />} />

    <Route path="/welcome" element={<WelcomePage />} />
    <Route path="/onboarding" element={<OnboardingAssistantPage />} />
    <Route
      path="/app/onboarding"
      element={<Navigate to="/onboarding" replace />}
    />
    <Route path="/app/activation" element={<ActivationCenterPage />} />
    <Route path="/bootstrap" element={<BootstrapPage />} />
    <Route path="/app/select-tenant" element={<SelectTenantPage />} />
    {/* App operacional único: /app → home do shell (Home | Operação | TPV | KDS | Mais) */}
    <Route path="/app" element={<Navigate to="/app/staff/home" replace />} />
    {/* NAVIGATION_CONTRACT: rota antiga no app → Centro de Ativação */}
    <Route
      path="/setup/restaurant-minimal"
      element={<Navigate to="/app/activation" replace />}
    />

    <Route element={<RoleGate />}>
      {/* ── BrowserBlockGuard: TPV (desktop only) ── */}
      <Route
        element={
          <BrowserBlockGuard requiredPlatform="desktop" moduleLabel="TPV" />
        }
      >
        <Route
          path="/op/tpv"
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
                  <TPVLayout />
                </OperationalFullscreenWrapper>
              </ShiftGate>
            </ErrorBoundary>
          }
        >
          <Route index element={<TPVPOSView />} />
          <Route path="orders" element={<TPVOrdersPage />} />
          <Route path="tables" element={<TPVTablesPage />} />
          <Route path="shift" element={<TPVShiftPage />} />
          <Route path="kitchen" element={<TPVKitchenPage />} />
          <Route path="tasks" element={<TPVTasksPage />} />
          <Route path="reservations" element={<TPVReservationsPage />} />
          <Route path="settings" element={<TPVSettingsPage />} />
        </Route>
      </Route>
      {/* ── BrowserBlockGuard: KDS (desktop only) ── */}
      <Route
        element={
          <BrowserBlockGuard requiredPlatform="desktop" moduleLabel="KDS" />
        }
      >
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
      </Route>
      <Route path="/op/cash" element={<Navigate to="/op/tpv" replace />} />
      <Route path="/op/pos" element={<Navigate to="/op/tpv" replace />} />
      <Route path="/op/pos/*" element={<Navigate to="/op/tpv" replace />} />
      <Route path="/op/staff" element={<AppStaffMobileOnlyPage />} />
      <Route
        path="/op/owner"
        element={<Navigate to="/app/staff/home/owner" replace />}
      />
      <Route path="/tpv" element={<Navigate to="/op/tpv" replace />} />
      <Route path="/kds-minimal" element={<Navigate to="/op/kds" replace />} />
      <Route path="/kds" element={<Navigate to="/op/kds" replace />} />
      <Route path="/tpv-minimal" element={<Navigate to="/op/tpv" replace />} />

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
      {/* ── BrowserBlockGuard: Waiter (mobile only) ── */}
      <Route
        element={
          <BrowserBlockGuard
            requiredPlatform="mobile"
            moduleLabel="Comandeiro"
          />
        }
      >
        <Route path="/app/waiter" element={<WaiterHomePage />} />
        <Route path="/app/waiter/table/:tableId" element={<TablePanel />} />
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
          element={<Navigate to="/app/staff/profile" replace />}
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
      {/* ── BrowserBlockGuard: AppStaff (mobile only) ── */}
      <Route
        element={
          <BrowserBlockGuard requiredPlatform="mobile" moduleLabel="AppStaff" />
        }
      >
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
            <Route path="waiter" element={<AppStaffHome />} />
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
            <Route path="sector/kitchen" element={<KitchenSectorDashboard />} />
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
          {/* ════════════════════════════════════════════════════════════════
              PV Mobile & KDS Mobile — 100% mobile-first, no desktop shell
              Contrato: docs/architecture/APPSTAFF_MOBILE_FIRST_CONTRACT.md
          ════════════════════════════════════════════════════════════════ */}
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
            path="mode/scanner"
            element={
              <StaffAppGate>
                <StaffRoleGuard modeId="scanner">
                  <StaffAppShellLayout>
                    <ScannerModePage />
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
          {/* Separação total: config/admin só no computador — contrato APPSTAFF_CONFIG_SEPARATION_CONTRACT.md */}
          <Route
            path="config-desktop-only"
            element={
              <StaffAppGate>
                <StaffAppShellLayout>
                  <ConfigDesktopOnlyPage />
                </StaffAppShellLayout>
              </StaffAppGate>
            }          />
        </Route>
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
        element={<Navigate to="/app/staff/config-desktop-only" replace />}
      />
      <Route
        path="/app/setup/horarios"
        element={<Navigate to="/app/staff/config-desktop-only" replace />}
      />
      <Route
        path="/app/setup/pagamentos"
        element={<Navigate to="/app/staff/config-desktop-only" replace />}
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
        element={<Navigate to="/app/staff/config-desktop-only" replace />}
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
        element={<Navigate to="/mentor" replace />}
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
        element={<Navigate to="/admin/payments/transactions" replace />}
      />
      <Route
        path="/admin/payments/pending"
        element={<Navigate to="/admin/payments/transactions" replace />}
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
        element={<Navigate to="/admin/modules" replace />}
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
        element={
          <ManagementAdvisor>
            <DashboardLayout>
              <ModulesPage />
            </DashboardLayout>
          </ManagementAdvisor>
        }
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
        path="/admin/reports/multiunit"
        element={
          <ManagementAdvisor>
            <DashboardLayout>
              <MultiUnitOverviewReportPage />
            </DashboardLayout>
          </ManagementAdvisor>
        }
      />
      <Route
        path="/admin/reports/staff"
        element={<Navigate to="/admin/reports/overview" replace />}
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
              <AdminDevicesPage />
            </DashboardLayout>
          </ManagementAdvisor>
        }
      />
      <Route
        path="/admin/organization"
        element={
          <ManagementAdvisor>
            <DashboardLayout>
              <AdminOrganizationPage />
            </DashboardLayout>
          </ManagementAdvisor>
        }      />
      <Route
        path="/admin/settings"
        element={<Navigate to="/admin/config" replace />}
      />
      {/* Admin aliases canónicos → config */}
      <Route
        path="/admin/tables"
        element={<Navigate to="/admin/config/ubicaciones" replace />}
      />
      <Route
        path="/admin/printers"
        element={<Navigate to="/admin/config/impresoras" replace />}
      />
      <Route
        path="/admin/users"
        element={<Navigate to="/admin/config/usuarios" replace />}
      />
      <Route
        path="/admin/integrations"
        element={<Navigate to="/admin/config/integrations" replace />}
      />
      <Route
        path="/admin/legal"
        element={<Navigate to="/admin/config/entidades-legales" replace />}
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
        <Route
          path="productos"
          element={<Navigate to="/admin/modules" replace />}
        />
        <Route path="suscripcion" element={<SuscripcionConfigPage />} />
        <Route path="ubicaciones" element={<UbicacionesConfigPage />} />
        <Route path="ubicaciones/address" element={<UbicacionesConfigPage />} />
        <Route path="ubicaciones/tables" element={<UbicacionesConfigPage />} />
        <Route
          path="entidades-legales"
          element={<EntidadesLegalesConfigPage />}
        />
        <Route path="marcas" element={<MarcasConfigPage />} />
        <Route path="usuarios" element={<UsuariosConfigPage />} />
        <Route path="dispositivos" element={<DispositivosConfigPage />} />
        <Route path="impresoras" element={<ImpresorasConfigPage />} />
        <Route path="integrations" element={<IntegrationsHubLayout />}>
          <Route index element={<IntegracionesConfigPage />} />
          <Route path="payments" element={<IntegrationsPaymentsPage />} />
          <Route path="whatsapp" element={<IntegrationsWhatsAppPage />} />
          <Route path="webhooks" element={<IntegrationsWebhooksPage />} />
          <Route path="delivery" element={<IntegrationsDeliveryPage />} />
          <Route
            path="google-business"
            element={<IntegrationsGoogleBusinessPage />}
          />
          <Route path="instagram" element={<IntegrationsInstagramPage />} />
          <Route path="other" element={<IntegrationsOtherPage />} />
        </Route>
        <Route
          path="integraciones"
          element={<Navigate to="integrations" replace />}
        />
        <Route path="delivery" element={<DeliveryConfigPage />} />
        <Route path="delivery/plano-mesas" element={<DeliveryConfigPage />} />
        <Route path="delivery/horarios" element={<DeliveryConfigPage />} />
        <Route path="delivery/qr" element={<DeliveryConfigPage />} />
        <Route path="empleados" element={<EmpleadosConfigPage />} />
        <Route path="empleados/employees" element={<EmpleadosConfigPage />} />
        <Route path="empleados/roles" element={<EmpleadosConfigPage />} />
        <Route path="software-tpv" element={<SoftwareTpvConfigPage />} />
        <Route path="software-tpv/config" element={<SoftwareTpvConfigPage />} />
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
        <Route path="tienda-online" element={<TiendaOnlineConfigPage />} />
      </Route>
      {/* Exact /admin → reports; deve vir depois de todas as rotas /admin/* para não capturar subcaminhos. */}
      <Route
        path="/admin"
        element={<Navigate to="/admin/reports/overview" replace />}
      />
      {/* Legacy /config eliminado: web de configuração canónica é /admin/config. */}
      <Route path="/config" element={<Navigate to="/admin/config" replace />} />
      <Route
        path="/config/*"
        element={<Navigate to="/admin/config" replace />}
      />
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
      <Route path="/financial" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/reservations"
        element={<Navigate to="/dashboard" replace />}
      />
      <Route path="/groups" element={<Navigate to="/dashboard" replace />} />
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
      <Route path="/install" element={<InstallPage />} />
      <Route path="/install/apps" element={<InstallAppsPage />} />
      <Route path="/app/install" element={<InstallPage />} />
      <Route
        path="/app/help"
        element={
          <ManagementAdvisor>
            <HelpPage />
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
        path="/app/reports/saft-export"
        element={
          <ManagementAdvisor>
            <SaftExportPage />
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
  </Fragment>
);
