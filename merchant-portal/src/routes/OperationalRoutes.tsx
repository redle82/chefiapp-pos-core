/**
 * Rotas operacionais (public/:slug, RoleGate, op/, app/staff/, admin/, config/).
 * Exporta Fragment para usar como filho direto de <Routes> (React Router v6).
 * Uso: <Routes>{OperationalRoutesFragment}</Routes>
 */
import { Fragment, lazy } from "react";
import { Navigate, Outlet, Route } from "react-router-dom";
import { ManagementAdvisor } from "../components/onboarding/ManagementAdvisor";
import { BrowserBlockGuard } from "../components/operational/BrowserBlockGuard";
import { ElectronAdminGuard } from "../components/operational/ElectronAdminGuard";
import { OperationalFullscreenWrapper } from "../components/operational/OperationalFullscreenWrapper";
import { RequireOperational } from "../components/operational/RequireOperational";
import { ShiftGate } from "../components/operational/ShiftGate";
import { OnboardingProvider } from "../context/OnboardingContext";
import { RoleGate } from "../core/roles";
import { AppStaffWrapper } from "../pages/AppStaff/AppStaffWrapper";
import { StaffAppGate } from "../pages/AppStaff/routing/StaffAppGate";
import { StaffAppShellLayout } from "../pages/AppStaff/routing/StaffAppShellLayout";
import { StaffHomeRedirect } from "../pages/AppStaff/routing/StaffHomeRedirect";
import { StaffIndexRedirect } from "../pages/AppStaff/routing/StaffIndexRedirect";
import { StaffRoleGuard } from "../pages/AppStaff/routing/StaffRoleGuard";
import { ErrorBoundary } from "../ui/design-system/ErrorBoundary";
import { GlobalBlockedView } from "../ui/design-system/components/GlobalBlockedView";

// ─── Lazy page imports — code splitting per route ─────────────────────────────

// catalog
const CatalogAssignmentsPage = lazy(() =>
  import("../features/admin/catalog/pages/CatalogAssignmentsPage").then(
    (m) => ({ default: m.CatalogAssignmentsPage }),
  ),
);
const CatalogListPage = lazy(() =>
  import("../features/admin/catalog/pages/CatalogListPage").then((m) => ({
    default: m.CatalogListPage,
  })),
);
const CombosPage = lazy(() =>
  import("../features/admin/catalog/pages/CombosPage").then((m) => ({
    default: m.CombosPage,
  })),
);
const ModifiersPage = lazy(() =>
  import("../features/admin/catalog/pages/ModifiersPage").then((m) => ({
    default: m.ModifiersPage,
  })),
);
const ProductsPage = lazy(() =>
  import("../features/admin/catalog/pages/ProductsPage").then((m) => ({
    default: m.ProductsPage,
  })),
);
const TranslationsPage = lazy(() =>
  import("../features/admin/catalog/pages/TranslationsPage").then((m) => ({
    default: m.TranslationsPage,
  })),
);

// closures
const ClosuresPage = lazy(() =>
  import("../features/admin/closures/pages/ClosuresPage").then((m) => ({
    default: m.ClosuresPage,
  })),
);

// config — layouts kept lazy (loaded once per section)
const AdminConfigLayout = lazy(() =>
  import("../features/admin/config/components/AdminConfigLayout").then((m) => ({
    default: m.AdminConfigLayout,
  })),
);
const IntegrationsHubLayout = lazy(() =>
  import("../features/admin/config/components/IntegrationsHubLayout").then(
    (m) => ({ default: m.IntegrationsHubLayout }),
  ),
);
const DeliveryConfigPage = lazy(() =>
  import("../features/admin/config/pages/DeliveryConfigPage").then((m) => ({
    default: m.DeliveryConfigPage,
  })),
);
const DispositivosConfigPage = lazy(() =>
  import("../features/admin/config/pages/DispositivosConfigPage").then((m) => ({
    default: m.DispositivosConfigPage,
  })),
);
const EmpleadosConfigPage = lazy(() =>
  import("../features/admin/config/pages/EmpleadosConfigPage").then((m) => ({
    default: m.EmpleadosConfigPage,
  })),
);
const EntidadesLegalesConfigPage = lazy(() =>
  import("../features/admin/config/pages/EntidadesLegalesConfigPage").then(
    (m) => ({ default: m.EntidadesLegalesConfigPage }),
  ),
);
const GeneralConfigPage = lazy(() =>
  import("../features/admin/config/pages/GeneralConfigPage").then((m) => ({
    default: m.GeneralConfigPage,
  })),
);
const ImpresorasConfigPage = lazy(() =>
  import("../features/admin/config/pages/ImpresorasConfigPage").then((m) => ({
    default: m.ImpresorasConfigPage,
  })),
);
const IntegracionesConfigPage = lazy(() =>
  import("../features/admin/config/pages/IntegracionesConfigPage").then(
    (m) => ({ default: m.IntegracionesConfigPage }),
  ),
);
const MarcasConfigPage = lazy(() =>
  import("../features/admin/config/pages/MarcasConfigPage").then((m) => ({
    default: m.MarcasConfigPage,
  })),
);
const ReservasConfigPage = lazy(() =>
  import("../features/admin/config/pages/ReservasConfigPage").then((m) => ({
    default: m.ReservasConfigPage,
  })),
);
const SoftwareTpvConfigPage = lazy(() =>
  import("../features/admin/config/pages/SoftwareTpvConfigPage").then((m) => ({
    default: m.SoftwareTpvConfigPage,
  })),
);
const SuscripcionConfigPage = lazy(() =>
  import("../features/admin/config/pages/SuscripcionConfigPage").then((m) => ({
    default: m.SuscripcionConfigPage,
  })),
);
const TiendaOnlineConfigPage = lazy(() =>
  import("../features/admin/config/pages/TiendaOnlineConfigPage").then((m) => ({
    default: m.TiendaOnlineConfigPage,
  })),
);
const UbicacionesConfigPage = lazy(() =>
  import("../features/admin/config/pages/UbicacionesConfigPage").then((m) => ({
    default: m.UbicacionesConfigPage,
  })),
);
const UsuariosConfigPage = lazy(() =>
  import("../features/admin/config/pages/UsuariosConfigPage").then((m) => ({
    default: m.UsuariosConfigPage,
  })),
);
const IntegrationsDeliveryPage = lazy(() =>
  import("../features/admin/config/pages/integrations").then((m) => ({
    default: m.IntegrationsDeliveryPage,
  })),
);
const IntegrationsOtherPage = lazy(() =>
  import("../features/admin/config/pages/integrations").then((m) => ({
    default: m.IntegrationsOtherPage,
  })),
);
const IntegrationsPaymentsPage = lazy(() =>
  import("../features/admin/config/pages/integrations").then((m) => ({
    default: m.IntegrationsPaymentsPage,
  })),
);
const IntegrationsWebhooksPage = lazy(() =>
  import("../features/admin/config/pages/integrations").then((m) => ({
    default: m.IntegrationsWebhooksPage,
  })),
);
const IntegrationsWhatsAppPage = lazy(() =>
  import("../features/admin/config/pages/integrations").then((m) => ({
    default: m.IntegrationsWhatsAppPage,
  })),
);

// customers
const CustomerDetailPage = lazy(() =>
  import("../features/admin/customers/pages/CustomerDetailPage").then((m) => ({
    default: m.CustomerDetailPage,
  })),
);
const CustomersPage = lazy(() =>
  import("../features/admin/customers/pages/CustomersPage").then((m) => ({
    default: m.CustomersPage,
  })),
);

// dashboard
const DashboardLayout = lazy(() =>
  import("../features/admin/dashboard/components/DashboardLayout").then(
    (m) => ({ default: m.DashboardLayout }),
  ),
);
const DashboardHomePage = lazy(() =>
  import("../features/admin/dashboard/pages/DashboardHomePage").then((m) => ({
    default: m.DashboardHomePage,
  })),
);

// devices / modules / observability
const AdminDevicesPage = lazy(() =>
  import("../features/admin/devices/AdminDevicesPage").then((m) => ({
    default: m.AdminDevicesPage,
  })),
);
const AdminTPVTerminalsPage = lazy(() =>
  import("../features/admin/devices/AdminTPVTerminalsPage").then((m) => ({
    default: m.AdminTPVTerminalsPage,
  })),
);
const ModulesPage = lazy(() =>
  import("../features/admin/modules/pages/ModulesPage").then((m) => ({
    default: m.ModulesPage,
  })),
);
const ObservabilityPage = lazy(() =>
  import("../features/admin/observability/pages/ObservabilityPage").then(
    (m) => ({ default: m.ObservabilityPage }),
  ),
);

// payments
const PaymentsLayout = lazy(() =>
  import("../features/admin/payments/pages/PaymentsLayout").then((m) => ({
    default: m.PaymentsLayout,
  })),
);
const PayoutsPage = lazy(() =>
  import("../features/admin/payments/pages/PayoutsPage").then((m) => ({
    default: m.PayoutsPage,
  })),
);
const TransactionsPage = lazy(() =>
  import("../features/admin/payments/pages/TransactionsPage").then((m) => ({
    default: m.TransactionsPage,
  })),
);

// promotions
const PromotionsPage = lazy(() =>
  import("../features/admin/promotions/pages/PromotionsPage").then((m) => ({
    default: m.PromotionsPage,
  })),
);

// reports
const AdminReportsOverview = lazy(() =>
  import("../features/admin/reports/AdminReportsOverview").then((m) => ({
    default: m.AdminReportsOverview,
  })),
);
const MultiUnitOverviewReportPage = lazy(() =>
  import("../features/admin/reports/MultiUnitOverviewReportPage").then((m) => ({
    default: m.MultiUnitOverviewReportPage,
  })),
);

// reservations
const ReservationsOperationalPage = lazy(() =>
  import("../features/admin/reservas/pages/ReservationsOperationalPage").then(
    (m) => ({ default: m.ReservationsOperationalPage }),
  ),
);

// KDS + TPV mobile features
const KDSMobilePage = lazy(() =>
  import("../features/kds-mobile").then((m) => ({ default: m.KDSMobilePage })),
);
const TPVMobilePage = lazy(() =>
  import("../features/pv-mobile").then((m) => ({ default: m.TPVMobilePage })),
);

// pages — Activation / Alerts
const ActivationCenterPage = lazy(() =>
  import("../pages/Activation/ActivationCenterPage").then((m) => ({
    default: m.ActivationCenterPage,
  })),
);
const AlertsDashboardPage = lazy(() =>
  import("../pages/Alerts/AlertsDashboardPage").then((m) => ({
    default: m.AlertsDashboardPage,
  })),
);

// pages — AppStaff (leaf pages only; routing shells kept static above)
const AppStaffHome = lazy(() =>
  import("../pages/AppStaff/AppStaffHome").then((m) => ({
    default: m.AppStaffHome,
  })),
);
const AppStaffMobileOnlyPage = lazy(() =>
  import("../pages/AppStaff/AppStaffMobileOnlyPage").then((m) => ({
    default: m.AppStaffMobileOnlyPage,
  })),
);
const ManagerExcecoesPage = lazy(() =>
  import("../pages/AppStaff/apps/alerts").then((m) => ({
    default: m.ManagerExcecoesPage,
  })),
);
const KitchenDisplay = lazy(() =>
  import("../pages/AppStaff/apps/kds").then((m) => ({
    default: m.KitchenDisplay,
  })),
);
const StaffProfilePage = lazy(() =>
  import("../pages/AppStaff/apps/profile").then((m) => ({
    default: m.StaffProfilePage,
  })),
);
const ManagerTarefasPage = lazy(() =>
  import("../pages/AppStaff/apps/tasks").then((m) => ({
    default: m.ManagerTarefasPage,
  })),
);
const ManagerEquipePage = lazy(() =>
  import("../pages/AppStaff/apps/team").then((m) => ({
    default: m.ManagerEquipePage,
  })),
);
const StaffTpvPage = lazy(() =>
  import("../pages/AppStaff/apps/tpv").then((m) => ({
    default: m.StaffTpvPage,
  })),
);
const CleaningSectorDashboard = lazy(() =>
  import("../pages/AppStaff/dashboards").then((m) => ({
    default: m.CleaningSectorDashboard,
  })),
);
const KitchenSectorDashboard = lazy(() =>
  import("../pages/AppStaff/dashboards").then((m) => ({
    default: m.KitchenSectorDashboard,
  })),
);
const OperationSectorDashboard = lazy(() =>
  import("../pages/AppStaff/dashboards").then((m) => ({
    default: m.OperationSectorDashboard,
  })),
);
const OwnerGlobalDashboard = lazy(() =>
  import("../pages/AppStaff/dashboards").then((m) => ({
    default: m.OwnerGlobalDashboard,
  })),
);
const TasksSectorDashboard = lazy(() =>
  import("../pages/AppStaff/dashboards").then((m) => ({
    default: m.TasksSectorDashboard,
  })),
);
const TeamSectorDashboard = lazy(() =>
  import("../pages/AppStaff/dashboards").then((m) => ({
    default: m.TeamSectorDashboard,
  })),
);
const CleaningHome = lazy(() =>
  import("../pages/AppStaff/homes/CleaningHome").then((m) => ({
    default: m.CleaningHome,
  })),
);
const KitchenHome = lazy(() =>
  import("../pages/AppStaff/homes/KitchenHome").then((m) => ({
    default: m.KitchenHome,
  })),
);
const ManagerHome = lazy(() =>
  import("../pages/AppStaff/homes/ManagerHome").then((m) => ({
    default: m.ManagerHome,
  })),
);
const WorkerHome = lazy(() =>
  import("../pages/AppStaff/homes/WorkerHome").then((m) => ({
    default: m.WorkerHome,
  })),
);
const ConfigDesktopOnlyPage = lazy(() =>
  import("../pages/AppStaff/pages/ConfigDesktopOnlyPage").then((m) => ({
    default: m.ConfigDesktopOnlyPage,
  })),
);
const ManagerTurnoPage = lazy(() =>
  import("../pages/AppStaff/pages/ManagerTurnoPage").then((m) => ({
    default: m.ManagerTurnoPage,
  })),
);
const OperationModePage = lazy(() =>
  import("../pages/AppStaff/pages/OperationModePage").then((m) => ({
    default: m.OperationModePage,
  })),
);

// pages — Backoffice / Billing / Bootstrap / CoreReset / Debug
const BackofficePage = lazy(() =>
  import("../pages/Backoffice/BackofficePage").then((m) => ({
    default: m.BackofficePage,
  })),
);
const BillingPage = lazy(() =>
  import("../pages/Billing/BillingPage").then((m) => ({
    default: m.BillingPage,
  })),
);
const BootstrapPage = lazy(() =>
  import("../pages/BootstrapPage").then((m) => ({ default: m.BootstrapPage })),
);
const CoreResetPage = lazy(() =>
  import("../pages/CoreReset/CoreResetPage").then((m) => ({
    default: m.CoreResetPage,
  })),
);
const DebugTPV = lazy(() =>
  import("../pages/DebugTPV").then((m) => ({ default: m.DebugTPV })),
);

// pages — Employee
const EmployeeHomePage = lazy(() =>
  import("../pages/Employee/HomePage").then((m) => ({
    default: m.EmployeeHomePage,
  })),
);
const EmployeeKDSIntelligentPage = lazy(() =>
  import("../pages/Employee/KDSIntelligentPage").then((m) => ({
    default: m.EmployeeKDSIntelligentPage,
  })),
);
const EmployeeOperationPage = lazy(() =>
  import("../pages/Employee/OperationPage").then((m) => ({
    default: m.EmployeeOperationPage,
  })),
);
const EmployeeTasksPage = lazy(() =>
  import("../pages/Employee/TasksPage").then((m) => ({
    default: m.EmployeeTasksPage,
  })),
);

// pages — Health / Help / Install
const HealthDashboardPage = lazy(() =>
  import("../pages/Health/HealthDashboardPage").then((m) => ({
    default: m.HealthDashboardPage,
  })),
);
const HelpPage = lazy(() =>
  import("../pages/Help/HelpPage").then((m) => ({ default: m.HelpPage })),
);
const InstallAppsPage = lazy(() =>
  import("../pages/InstallAppsPage").then((m) => ({
    default: m.InstallAppsPage,
  })),
);
const InstallPage = lazy(() =>
  import("../pages/InstallPage").then((m) => ({ default: m.InstallPage })),
);

// pages — Inventory / KDS
const InventoryStockMinimal = lazy(() =>
  import("../pages/InventoryStock/InventoryStockMinimal").then((m) => ({
    default: m.InventoryStockMinimal,
  })),
);
// KDSMinimal standalone removed — KDS now lives inside TPV at /op/tpv/kitchen

// pages — Manager
const ManagerAnalysisPage = lazy(() =>
  import("../pages/Manager/AnalysisPage").then((m) => ({
    default: m.ManagerAnalysisPage,
  })),
);
const ManagerCentralPage = lazy(() =>
  import("../pages/Manager/CentralPage").then((m) => ({
    default: m.ManagerCentralPage,
  })),
);
const ManagerDashboardPage = lazy(() =>
  import("../pages/Manager/DashboardPage").then((m) => ({
    default: m.ManagerDashboardPage,
  })),
);
const ManagerReservationsPage = lazy(() =>
  import("../pages/Manager/ReservationsPage").then((m) => ({
    default: m.ManagerReservationsPage,
  })),
);
const ManagerScheduleCreatePage = lazy(() =>
  import("../pages/Manager/ScheduleCreatePage").then((m) => ({
    default: m.ManagerScheduleCreatePage,
  })),
);
const ManagerSchedulePage = lazy(() =>
  import("../pages/Manager/SchedulePage").then((m) => ({
    default: m.ManagerSchedulePage,
  })),
);

// pages — Menu / Onboarding / Operacao
const MenuBuilderMinimal = lazy(() =>
  import("../pages/MenuBuilder/MenuBuilderMinimal").then((m) => ({
    default: m.MenuBuilderMinimal,
  })),
);
const OnboardingAssistantPage = lazy(() =>
  import("../pages/Onboarding/OnboardingAssistantPage").then((m) => ({
    default: m.OnboardingAssistantPage,
  })),
);
const MenuDemo = lazy(() =>
  import("../features/admin/onboarding/pages/MenuDemo").then((m) => ({
    default: m.MenuDemo,
  })),
);
const FirstSaleGuide = lazy(() =>
  import("../features/admin/onboarding/pages/FirstSaleGuide").then((m) => ({
    default: m.FirstSaleGuide,
  })),
);
const OperacaoMinimal = lazy(() =>
  import("../pages/Operacao/OperacaoMinimal").then((m) => ({
    default: m.OperacaoMinimal,
  })),
);

// pages — Owner
const OwnerPurchasesPage = lazy(() =>
  import("../pages/Owner/PurchasesPage").then((m) => ({
    default: m.OwnerPurchasesPage,
  })),
);
const OwnerSimulationPage = lazy(() =>
  import("../pages/Owner/SimulationPage").then((m) => ({
    default: m.OwnerSimulationPage,
  })),
);
const OwnerStockRealPage = lazy(() =>
  import("../pages/Owner/StockRealPage").then((m) => ({
    default: m.OwnerStockRealPage,
  })),
);
const OwnerVisionPage = lazy(() =>
  import("../pages/Owner/VisionPage").then((m) => ({
    default: m.OwnerVisionPage,
  })),
);

// pages — People
const PeopleDashboardPage = lazy(() =>
  import("../pages/People/PeopleDashboardPage").then((m) => ({
    default: m.PeopleDashboardPage,
  })),
);
const TimeTrackingPage = lazy(() =>
  import("../pages/People/TimeTrackingPage").then((m) => ({
    default: m.TimeTrackingPage,
  })),
);

// pages — Public
const CustomerOrderStatusView = lazy(() =>
  import("../pages/Public/CustomerOrderStatusView").then((m) => ({
    default: m.CustomerOrderStatusView,
  })),
);
const PublicKDS = lazy(() =>
  import("../pages/Public/PublicKDS").then((m) => ({ default: m.PublicKDS })),
);
const PublicWebPage = lazy(() =>
  import("../pages/PublicWeb/PublicWebPage").then((m) => ({
    default: m.PublicWebPage,
  })),
);
const TablePage = lazy(() =>
  import("../pages/PublicWeb/TablePage").then((m) => ({
    default: m.TablePage,
  })),
);
const TrackOrderPage = lazy(() =>
  import("../pages/PublicWeb/TrackOrderPage").then((m) => ({
    default: m.TrackOrderPage,
  })),
);

// pages — Publish / Purchases / Reports
const PublishPage = lazy(() =>
  import("../pages/PublishPage").then((m) => ({ default: m.PublishPage })),
);
const PurchasesDashboardPage = lazy(() =>
  import("../pages/Purchases/PurchasesDashboardPage").then((m) => ({
    default: m.PurchasesDashboardPage,
  })),
);
const DailyClosingReportPage = lazy(() =>
  import("../pages/Reports/DailyClosingReportPage").then((m) => ({
    default: m.DailyClosingReportPage,
  })),
);
const GamificationImpactReportPage = lazy(() =>
  import("../pages/Reports/GamificationImpactReportPage").then((m) => ({
    default: m.GamificationImpactReportPage,
  })),
);
const OperationalActivityReportPage = lazy(() =>
  import("../pages/Reports/OperationalActivityReportPage").then((m) => ({
    default: m.OperationalActivityReportPage,
  })),
);
const SaftExportPage = lazy(() =>
  import("../pages/Reports/SaftExportPage").then((m) => ({
    default: m.SaftExportPage,
  })),
);
const SalesByPeriodReportPage = lazy(() =>
  import("../pages/Reports/SalesByPeriodReportPage").then((m) => ({
    default: m.SalesByPeriodReportPage,
  })),
);
const SalesSummaryReportPage = lazy(() =>
  import("../pages/Reports/SalesSummaryReportPage").then((m) => ({
    default: m.SalesSummaryReportPage,
  })),
);

// pages — Runbook / Tenant / Shopping / SystemTree
const RunbookCorePage = lazy(() =>
  import("../pages/RunbookCorePage").then((m) => ({
    default: m.RunbookCorePage,
  })),
);
const SelectTenantPage = lazy(() =>
  import("../pages/SelectTenantPage").then((m) => ({
    default: m.SelectTenantPage,
  })),
);
const ShoppingListMinimal = lazy(() =>
  import("../pages/ShoppingList/ShoppingListMinimal").then((m) => ({
    default: m.ShoppingListMinimal,
  })),
);
const SystemTreePage = lazy(() =>
  import("../pages/SystemTree/SystemTreePage").then((m) => ({
    default: m.SystemTreePage,
  })),
);

// pages — TPV (Point of Sale)
const TPVKitchenPage = lazy(() =>
  import("../pages/TPVMinimal/TPVKitchenPage").then((m) => ({
    default: m.TPVKitchenPage,
  })),
);
const TPVLayout = lazy(() =>
  import("../pages/TPVMinimal/TPVLayout").then((m) => ({
    default: m.TPVLayout,
  })),
);
const TPVOrdersPage = lazy(() =>
  import("../pages/TPVMinimal/TPVOrdersPage").then((m) => ({
    default: m.TPVOrdersPage,
  })),
);
const TPVPOSView = lazy(() =>
  import("../pages/TPVMinimal/TPVPOSView").then((m) => ({
    default: m.TPVPOSView,
  })),
);
const TPVReservationsPage = lazy(() =>
  import("../pages/TPVMinimal/TPVReservationsPage").then((m) => ({
    default: m.TPVReservationsPage,
  })),
);
const TPVSettingsPage = lazy(() =>
  import("../pages/TPVMinimal/TPVSettingsPage").then((m) => ({
    default: m.TPVSettingsPage,
  })),
);
const TPVWebEditorPage = lazy(() =>
  import("../pages/TPVMinimal/TPVWebEditorPage").then((m) => ({
    default: m.TPVWebEditorPage,
  })),
);
const TPVScreensPage = lazy(() =>
  import("../pages/TPVMinimal/TPVScreensPage").then((m) => ({
    default: m.TPVScreensPage,
  })),
);
const TPVExpoPage = lazy(() =>
  import("../pages/TPVMinimal/TPVExpoPage").then((m) => ({
    default: m.TPVExpoPage,
  })),
);
const TPVCustomerDisplayPage = lazy(() =>
  import("../pages/TPVMinimal/TPVCustomerDisplayPage").then((m) => ({
    default: m.TPVCustomerDisplayPage,
  })),
);
const TPVDeliveryPage = lazy(() =>
  import("../pages/TPVMinimal/TPVDeliveryPage").then((m) => ({
    default: m.TPVDeliveryPage,
  })),
);
const TPVShiftPage = lazy(() =>
  import("../pages/TPVMinimal/TPVShiftPage").then((m) => ({
    default: m.TPVShiftPage,
  })),
);
const TPVTablesPage = lazy(() =>
  import("../pages/TPVMinimal/TPVTablesPage").then((m) => ({
    default: m.TPVTablesPage,
  })),
);
const TPVTasksPage = lazy(() =>
  import("../pages/TPVMinimal/TPVTasksPage").then((m) => ({
    default: m.TPVTasksPage,
  })),
);
const TPVReadyPage = lazy(() =>
  import("../pages/TPVReadyPage").then((m) => ({ default: m.TPVReadyPage })),
);

// pages — Dedicated Screens (isolated from TPV shell)
const ScreenKitchenPage = lazy(() =>
  import("../pages/TPVMinimal/screens/ScreenKitchenPage").then((m) => ({
    default: m.ScreenKitchenPage,
  })),
);
const ScreenBarPage = lazy(() =>
  import("../pages/TPVMinimal/screens/ScreenBarPage").then((m) => ({
    default: m.ScreenBarPage,
  })),
);
const ScreenExpoPage = lazy(() =>
  import("../pages/TPVMinimal/screens/ScreenExpoPage").then((m) => ({
    default: m.ScreenExpoPage,
  })),
);
const ScreenDeliveryPage = lazy(() =>
  import("../pages/TPVMinimal/screens/ScreenDeliveryPage").then((m) => ({
    default: m.ScreenDeliveryPage,
  })),
);
const ScreenCustomerDisplayPage = lazy(() =>
  import("../pages/TPVMinimal/screens/ScreenCustomerDisplayPage").then((m) => ({
    default: m.ScreenCustomerDisplayPage,
  })),
);

// pages — Tasks
const TaskSystemMinimal = lazy(() =>
  import("../pages/TaskSystem/TaskSystemMinimal").then((m) => ({
    default: m.TaskSystemMinimal,
  })),
);
const RecurringTasksPage = lazy(() =>
  import("../pages/Tasks/RecurringTasksPage").then((m) => ({
    default: m.RecurringTasksPage,
  })),
);
const TaskDashboardPage = lazy(() =>
  import("../pages/Tasks/TaskDashboardPage").then((m) => ({
    default: m.TaskDashboardPage,
  })),
);
const TaskDetailPage = lazy(() =>
  import("../pages/Tasks/TaskDetailPage").then((m) => ({
    default: m.TaskDetailPage,
  })),
);

// pages — Waiter / Welcome
const TablePanel = lazy(() =>
  import("../pages/Waiter/TablePanel").then((m) => ({ default: m.TablePanel })),
);
const WaiterHomePage = lazy(() =>
  import("../pages/Waiter/WaiterHomePage").then((m) => ({
    default: m.WaiterHomePage,
  })),
);
const WelcomePage = lazy(() =>
  import("../pages/Welcome/WelcomePage").then((m) => ({
    default: m.WelcomePage,
  })),
);
const ElectronSetupPage = lazy(() =>
  import("../pages/ElectronSetup/ElectronSetupPage").then((m) => ({
    default: m.ElectronSetupPage,
  })),
);
export const OperationalRoutesFragment = (
  <Fragment>
    <Route path="/electron/setup" element={<ElectronSetupPage />} />
    <Route path="/public/:slug" element={<PublicWebPage />} />
    <Route path="/public/:slug/mesa/:number" element={<PublicWebPage />} />
    <Route
      path="/public/:slug/order/:orderId"
      element={<CustomerOrderStatusView />}
    />
    <Route path="/public/:slug/kds" element={<PublicKDS />} />
    <Route path="/track/:orderId" element={<TrackOrderPage />} />

    <Route path="/welcome" element={<WelcomePage />} />
    <Route path="/onboarding" element={<OnboardingAssistantPage />} />
    <Route
      path="/app/onboarding"
      element={<Navigate to="/onboarding" replace />}
    />
    <Route path="/app/onboarding/menu-demo" element={<MenuDemo />} />
    <Route path="/app/onboarding/first-sale" element={<FirstSaleGuide />} />
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
          <Route path="expo" element={<TPVExpoPage />} />
          <Route path="customer-display" element={<TPVCustomerDisplayPage />} />
          <Route path="delivery" element={<TPVDeliveryPage />} />
          <Route path="web-editor" element={<TPVWebEditorPage />} />
          <Route path="screens" element={<TPVScreensPage />} />
        </Route>
      </Route>
      {/* KDS lives inside TPV — redirect standalone route */}
      <Route path="/op/kds" element={<Navigate to="/op/tpv/kitchen" replace />} />

      {/* ── Dedicated Screen Routes (/screen/*) ──────────────────────────
           Isolated surfaces launched from TPV Screens Hub.
           No TPV sidebar/header — ScreenLayout provides minimal chrome.
      */}
      <Route path="/screen/kitchen" element={<ScreenKitchenPage />} />
      <Route path="/screen/bar" element={<ScreenBarPage />} />
      <Route path="/screen/expo" element={<ScreenExpoPage />} />
      <Route path="/screen/delivery" element={<ScreenDeliveryPage />} />
      <Route path="/screen/customer-display" element={<ScreenCustomerDisplayPage />} />

      <Route path="/op/cash" element={<Navigate to="/op/tpv" replace />} />
      <Route path="/op/pos" element={<Navigate to="/op/tpv" replace />} />
      <Route path="/op/pos/*" element={<Navigate to="/op/tpv" replace />} />
      <Route path="/op/staff" element={<AppStaffMobileOnlyPage />} />
      <Route
        path="/op/owner"
        element={<Navigate to="/app/staff/home/owner" replace />}
      />
      <Route path="/tpv" element={<Navigate to="/op/tpv" replace />} />
      <Route path="/kds-minimal" element={<Navigate to="/op/tpv/kitchen" replace />} />
      <Route path="/kds" element={<Navigate to="/op/tpv/kitchen" replace />} />
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
            }
          />
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
        element={<Navigate to="/op/tpv/kitchen" replace />}
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
      {/* ElectronAdminGuard: em desktop (Electron) /admin/* não renderiza — só setup e TPV/KDS. */}
      <Route path="/admin" element={<ElectronAdminGuard />}>
        <Route
          path="home"
          element={
            <ManagementAdvisor>
              <DashboardHomePage />
            </ManagementAdvisor>
          }
        />
        <Route
          path="clients"
          element={<Navigate to="/admin/customers" replace />}
        />
      <Route
        path="customers"
        element={
          <ManagementAdvisor>
            <DashboardLayout>
              <CustomersPage />
            </DashboardLayout>
          </ManagementAdvisor>
        }
      />
      <Route
        path="customers/:id"
        element={
          <ManagementAdvisor>
            <DashboardLayout>
              <CustomerDetailPage />
            </DashboardLayout>
          </ManagementAdvisor>
        }
      />
      <Route
        path="closures"
        element={
          <ManagementAdvisor>
            <DashboardLayout>
              <ClosuresPage />
            </DashboardLayout>
          </ManagementAdvisor>
        }
      />
      <Route
        path="reservations"
        element={
          <ManagementAdvisor>
            <DashboardLayout>
              <ReservationsOperationalPage />
            </DashboardLayout>
          </ManagementAdvisor>
        }
      />
      <Route
        path="payments/list"
        element={<Navigate to="/admin/payments/transactions" replace />}
      />
      <Route
        path="payments/refunds"
        element={<Navigate to="/admin/payments/transactions" replace />}
      />
      <Route
        path="payments/pending"
        element={<Navigate to="/admin/payments/transactions" replace />}
      />
      <Route
        path="payments"
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
        path="promotions"
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
        path="catalog/list"
        element={
          <ManagementAdvisor>
            <DashboardLayout>
              <CatalogListPage />
            </DashboardLayout>
          </ManagementAdvisor>
        }
      />
      <Route
        path="catalog/assignments"
        element={
          <ManagementAdvisor>
            <DashboardLayout>
              <CatalogAssignmentsPage />
            </DashboardLayout>
          </ManagementAdvisor>
        }
      />
      <Route
        path="catalog/products"
        element={
          <ManagementAdvisor>
            <DashboardLayout>
              <ProductsPage />
            </DashboardLayout>
          </ManagementAdvisor>
        }
      />
      <Route
        path="catalog/modules"
        element={<Navigate to="/admin/modules" replace />}
      />
      <Route
        path="catalog/modifiers"
        element={
          <ManagementAdvisor>
            <DashboardLayout>
              <ModifiersPage />
            </DashboardLayout>
          </ManagementAdvisor>
        }
      />
      <Route
        path="catalog/combos"
        element={
          <ManagementAdvisor>
            <DashboardLayout>
              <CombosPage />
            </DashboardLayout>
          </ManagementAdvisor>
        }
      />
      <Route
        path="catalog/translations"
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
        path="catalog"
        element={<Navigate to="/admin/catalog/products" replace />}
      />
      {/* ── Backward-compat redirects (old flat routes) ── */}
      <Route
        path="catalogs"
        element={<Navigate to="/admin/catalog/list" replace />}
      />
      <Route
        path="catalog-assignments"
        element={<Navigate to="/admin/catalog/assignments" replace />}
      />
      <Route
        path="products"
        element={<Navigate to="/admin/catalog/products" replace />}
      />
      <Route
        path="modules"
        element={
          <ManagementAdvisor>
            <DashboardLayout>
              <ModulesPage />
            </DashboardLayout>
          </ManagementAdvisor>
        }
      />
      <Route
        path="modifiers"
        element={<Navigate to="/admin/catalog/modifiers" replace />}
      />
      <Route
        path="combos"
        element={<Navigate to="/admin/catalog/combos" replace />}
      />
      <Route
        path="translations"
        element={<Navigate to="/admin/catalog/translations" replace />}
      />
      <Route
        path="reports/overview"
        element={
          <ManagementAdvisor>
            <DashboardLayout>
              <AdminReportsOverview />
            </DashboardLayout>
          </ManagementAdvisor>
        }
      />
      <Route
        path="reports/sales"
        element={
          <ManagementAdvisor>
            <DashboardLayout>
              <SalesByPeriodReportPage />
            </DashboardLayout>
          </ManagementAdvisor>
        }
      />
      <Route
        path="reports/multiunit"
        element={
          <ManagementAdvisor>
            <DashboardLayout>
              <MultiUnitOverviewReportPage />
            </DashboardLayout>
          </ManagementAdvisor>
        }
      />
      <Route
        path="reports/staff"
        element={<Navigate to="/admin/reports/overview" replace />}
      />
      <Route
        path="reports/operations"
        element={
          <ManagementAdvisor>
            <DashboardLayout>
              <OperationalActivityReportPage />
            </DashboardLayout>
          </ManagementAdvisor>
        }
      />
      <Route
        path="reports/human-performance"
        element={
          <ManagementAdvisor>
            <DashboardLayout>
              <GamificationImpactReportPage />
            </DashboardLayout>
          </ManagementAdvisor>
        }
      />
      <Route
        path="reports"
        element={<Navigate to="/admin/reports/overview" replace />}
      />
      <Route
        path="observability"
        element={
          <ManagementAdvisor>
            <DashboardLayout>
              <ObservabilityPage />
            </DashboardLayout>
          </ManagementAdvisor>
        }
      />
      <Route
        path="devices/tpv"
        element={
          <ManagementAdvisor>
            <DashboardLayout>
              <AdminTPVTerminalsPage />
            </DashboardLayout>
          </ManagementAdvisor>
        }
      />
      <Route
        path="devices"
        element={
          <ManagementAdvisor>
            <DashboardLayout>
              <AdminDevicesPage />
            </DashboardLayout>
          </ManagementAdvisor>
        }
      />
      <Route
        path="settings"
        element={<Navigate to="/admin/config" replace />}
      />
      {/* Admin aliases canónicos → config */}
      <Route
        path="tables"
        element={<Navigate to="/admin/config/locations" replace />}
      />
      <Route
        path="printers"
        element={<Navigate to="/admin/config/printers" replace />}
      />
      <Route
        path="users"
        element={<Navigate to="/admin/config/users" replace />}
      />
      <Route
        path="integrations"
        element={<Navigate to="/admin/config/integrations" replace />}
      />
      <Route
        path="desktop"
        element={<Navigate to="/admin/devices/tpv" replace />}
      />
      <Route
        path="legal"
        element={<Navigate to="/admin/config/legal-entities" replace />}
      />
      <Route
        path="config"
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
        {/* ── Semantic English routes ── */}
        <Route path="subscription" element={<SuscripcionConfigPage />} />
        <Route path="locations" element={<UbicacionesConfigPage />} />
        <Route path="locations/address" element={<UbicacionesConfigPage />} />
        <Route path="locations/tables" element={<UbicacionesConfigPage />} />
        <Route path="legal-entities" element={<EntidadesLegalesConfigPage />} />
        <Route path="brands" element={<MarcasConfigPage />} />
        <Route path="users" element={<UsuariosConfigPage />} />
        <Route path="devices" element={<DispositivosConfigPage />} />
        <Route path="printers" element={<ImpresorasConfigPage />} />
        <Route path="integrations" element={<IntegrationsHubLayout />}>
          <Route index element={<IntegracionesConfigPage />} />
          <Route path="payments" element={<IntegrationsPaymentsPage />} />
          <Route path="whatsapp" element={<IntegrationsWhatsAppPage />} />
          <Route path="webhooks" element={<IntegrationsWebhooksPage />} />
          <Route
            path="delivery"
            element={<Navigate to="/admin/config/delivery" replace />}
          />
          <Route path="other" element={<IntegrationsOtherPage />} />
        </Route>
        <Route path="delivery" element={<DeliveryConfigPage />} />
        <Route path="delivery/floor-plan" element={<DeliveryConfigPage />} />
        <Route path="delivery/schedule" element={<DeliveryConfigPage />} />
        <Route path="delivery/qr" element={<DeliveryConfigPage />} />
        <Route path="employees" element={<EmpleadosConfigPage />} />
        <Route path="employees/list" element={<EmpleadosConfigPage />} />
        <Route path="employees/roles" element={<EmpleadosConfigPage />} />
        <Route path="pos-software" element={<SoftwareTpvConfigPage />} />
        <Route path="pos-software/config" element={<SoftwareTpvConfigPage />} />
        <Route
          path="pos-software/quick-mode"
          element={<SoftwareTpvConfigPage />}
        />
        <Route path="reservations" element={<ReservasConfigPage />} />
        <Route
          path="reservations/availability"
          element={<ReservasConfigPage />}
        />
        <Route path="reservations/guarantee" element={<ReservasConfigPage />} />
        <Route path="reservations/shifts" element={<ReservasConfigPage />} />
        <Route path="reservations/messages" element={<ReservasConfigPage />} />
        <Route path="website" element={<TiendaOnlineConfigPage />} />
        {/* ── Legacy Spanish redirects → semantic English ── */}
        <Route
          path="suscripcion"
          element={<Navigate to="/admin/config/subscription" replace />}
        />
        <Route
          path="ubicaciones"
          element={<Navigate to="/admin/config/locations" replace />}
        />
        <Route
          path="ubicaciones/*"
          element={<Navigate to="/admin/config/locations" replace />}
        />
        <Route
          path="entidades-legales"
          element={<Navigate to="/admin/config/legal-entities" replace />}
        />
        <Route
          path="marcas"
          element={<Navigate to="/admin/config/brands" replace />}
        />
        <Route
          path="usuarios"
          element={<Navigate to="/admin/config/users" replace />}
        />
        <Route
          path="dispositivos"
          element={<Navigate to="/admin/config/devices" replace />}
        />
        <Route
          path="impresoras"
          element={<Navigate to="/admin/config/printers" replace />}
        />
        <Route
          path="integraciones"
          element={<Navigate to="/admin/config/integrations" replace />}
        />
        <Route
          path="empleados"
          element={<Navigate to="/admin/config/employees" replace />}
        />
        <Route
          path="empleados/*"
          element={<Navigate to="/admin/config/employees" replace />}
        />
        <Route
          path="software-tpv"
          element={<Navigate to="/admin/config/pos-software" replace />}
        />
        <Route
          path="software-tpv/*"
          element={<Navigate to="/admin/config/pos-software" replace />}
        />
        <Route
          path="reservas"
          element={<Navigate to="/admin/config/reservations" replace />}
        />
        <Route
          path="reservas/*"
          element={<Navigate to="/admin/config/reservations" replace />}
        />
        <Route
          path="tienda-online"
          element={<Navigate to="/admin/config/website" replace />}
        />
        <Route
          path="delivery/plano-mesas"
          element={<Navigate to="/admin/config/delivery/floor-plan" replace />}
        />
        <Route
          path="delivery/horarios"
          element={<Navigate to="/admin/config/delivery/schedule" replace />}
        />
      </Route>
        {/* Exact /admin → reports (index do wrapper). */}
        <Route
          index
          element={<Navigate to="/admin/reports/overview" replace />}
        />
      </Route>
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
      <Route
        path="/app/tpv-ready"
        element={
          <ManagementAdvisor>
            <TPVReadyPage />
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
