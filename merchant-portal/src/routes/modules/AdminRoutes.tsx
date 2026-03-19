import type { ReactNode } from "react";
import { Navigate, Route } from "react-router-dom";
import { ManagementAdvisor } from "../../components/onboarding/ManagementAdvisor";
import { OnboardingProvider } from "../../context/OnboardingContext";
import { isMenuV2ShellEnabled } from "../../core/catalog/catalogFeatureFlags";
import { CatalogAssignmentsPage } from "../../features/admin/catalog/pages/CatalogAssignmentsPage";
import { CatalogCatalogsPage } from "../../features/admin/catalog/pages/CatalogCatalogsPage";
import { CatalogLibraryPage } from "../../features/admin/catalog/pages/CatalogLibraryPage";
import { CatalogListPage } from "../../features/admin/catalog/pages/CatalogListPage";
import { CatalogPublishPage } from "../../features/admin/catalog/pages/CatalogPublishPage";
import { CatalogQualityPage } from "../../features/admin/catalog/pages/CatalogQualityPage";
import { CatalogSetupPage } from "../../features/admin/catalog/pages/CatalogSetupPage";
import { CombosPage } from "../../features/admin/catalog/pages/CombosPage";
import { ModifiersPage } from "../../features/admin/catalog/pages/ModifiersPage";
import { ProductsPage } from "../../features/admin/catalog/pages/ProductsPage";
import { TranslationsPage } from "../../features/admin/catalog/pages/TranslationsPage";
import { ClosuresPage } from "../../features/admin/closures/pages/ClosuresPage";
import { AdminConfigLayout } from "../../features/admin/config/components/AdminConfigLayout";
import { IntegrationsHubLayout } from "../../features/admin/config/components/IntegrationsHubLayout";
import { DeliveryConfigPage } from "../../features/admin/config/pages/DeliveryConfigPage";
import { DispositivosConfigPage } from "../../features/admin/config/pages/DispositivosConfigPage";
import { EmpleadosConfigPage } from "../../features/admin/config/pages/EmpleadosConfigPage";
import { EntidadesLegalesConfigPage } from "../../features/admin/config/pages/EntidadesLegalesConfigPage";
import { GeneralConfigPage } from "../../features/admin/config/pages/GeneralConfigPage";
import { ImpresorasConfigPage } from "../../features/admin/config/pages/ImpresorasConfigPage";
import { IntegracionesConfigPage } from "../../features/admin/config/pages/IntegracionesConfigPage";
import { LabelsConfigPage } from "../../features/admin/config/pages/LabelsConfigPage";
import { MarcasConfigPage } from "../../features/admin/config/pages/MarcasConfigPage";
import { ReservasConfigPage } from "../../features/admin/config/pages/ReservasConfigPage";
import { SoftwareTpvConfigPage } from "../../features/admin/config/pages/SoftwareTpvConfigPage";
import { SuscripcionConfigPage } from "../../features/admin/config/pages/SuscripcionConfigPage";
import { TiendaOnlineConfigPage } from "../../features/admin/config/pages/TiendaOnlineConfigPage";
import { UbicacionesConfigPage } from "../../features/admin/config/pages/UbicacionesConfigPage";
import { UsuariosConfigPage } from "../../features/admin/config/pages/UsuariosConfigPage";
import {
  IntegrationsDeliveryPage,
  IntegrationsOtherPage,
  IntegrationsPaymentsPage,
  IntegrationsWebhooksPage,
  IntegrationsWhatsAppPage,
} from "../../features/admin/config/pages/integrations";
import { CustomerDetailPage } from "../../features/admin/customers/pages/CustomerDetailPage";
import { CustomerListPage } from "../../features/admin/customers/pages/CustomerListPage";
import { DashboardLayout } from "../../features/admin/dashboard/components/DashboardLayout";
import { DashboardHomePage } from "../../features/admin/dashboard/pages/DashboardHomePage";
import { AdminDesktopPage } from "../../features/admin/devices/AdminDesktopPage";
import { AdminDevicesPage } from "../../features/admin/devices/AdminDevicesPage";
import { AdminTPVTerminalsPage } from "../../features/admin/devices/AdminTPVTerminalsPage";
import { ModulesPage } from "../../features/admin/modules/pages/ModulesPage";
import { ObservabilityPage } from "../../features/admin/observability/pages/ObservabilityPage";
import { PrivacySettingsPage } from "../../features/admin/privacy/pages/PrivacySettingsPage";
import { PaymentsLayout } from "../../features/admin/payments/pages/PaymentsLayout";
import { PayoutsPage } from "../../features/admin/payments/pages/PayoutsPage";
import { ReconciliationPage } from "../../features/admin/payments/pages/ReconciliationPage";
import { TransactionsPage } from "../../features/admin/payments/pages/TransactionsPage";
import { DiscountsPage } from "../../features/admin/discounts/pages/DiscountsPage";
import { PromotionsPage } from "../../features/admin/promotions/pages/PromotionsPage";
import { ShiftDashboardPage } from "../../features/admin/shifts/pages/ShiftDashboardPage";
import { ReceiptHistoryPage } from "../../features/admin/receipts/pages/ReceiptHistoryPage";
import { TableManagementPage } from "../../features/admin/tables/pages/TableManagementPage";
import { TipsPage } from "../../features/admin/tips/TipsPage";
import { AdminReportsOverview } from "../../features/admin/reports/AdminReportsOverview";
import { MultiUnitOverviewReportPage } from "../../features/admin/reports/MultiUnitOverviewReportPage";
import { ReservationsOperationalPage } from "../../features/admin/reservas/pages/ReservationsOperationalPage";
import { WasteReportPage } from "../../features/admin/inventory/pages/WasteReportPage";
import { GamificationImpactReportPage } from "../../pages/Reports/GamificationImpactReportPage";
import { OperationalActivityReportPage } from "../../pages/Reports/OperationalActivityReportPage";
import { SalesByPeriodReportPage } from "../../pages/Reports/SalesByPeriodReportPage";
import { BusinessDashboardPage } from "../../features/admin/analytics/pages/BusinessDashboardPage";
import { MenuPerformancePage } from "../../features/admin/analytics/pages/MenuPerformancePage";
import { RevenueHeatmapPage } from "../../features/admin/analytics/pages/RevenueHeatmapPage";
import { ErrorBoundary } from "../../ui/design-system/ErrorBoundary";

function MenuV2ShellRoute({ children }: { children: ReactNode }) {
  if (!isMenuV2ShellEnabled()) {
    return <Navigate to="/admin/catalog/list" replace />;
  }

  return <>{children}</>;
}

export const AdminRoutesFragment = (
  <>
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
            <CustomerListPage />
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
      path="/admin/receipts"
      element={
        <ManagementAdvisor>
          <DashboardLayout>
            <ReceiptHistoryPage />
          </DashboardLayout>
        </ManagementAdvisor>
      }
    />
    <Route
      path="/admin/shifts"
      element={
        <ManagementAdvisor>
          <DashboardLayout>
            <ShiftDashboardPage />
          </DashboardLayout>
        </ManagementAdvisor>
      }
    />
    <Route
      path="/admin/tips"
      element={
        <ManagementAdvisor>
          <DashboardLayout>
            <TipsPage />
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
      <Route path="reconciliation" element={<ReconciliationPage />} />
    </Route>
    <Route
      path="/admin/discounts"
      element={
        <ManagementAdvisor>
          <DashboardLayout>
            <DiscountsPage />
          </DashboardLayout>
        </ManagementAdvisor>
      }
    />
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
    <Route
      path="/admin/catalog/setup"
      element={
        <MenuV2ShellRoute>
          <ManagementAdvisor>
            <DashboardLayout>
              <CatalogSetupPage />
            </DashboardLayout>
          </ManagementAdvisor>
        </MenuV2ShellRoute>
      }
    />
    <Route
      path="/admin/catalog/library"
      element={
        <MenuV2ShellRoute>
          <ManagementAdvisor>
            <DashboardLayout>
              <CatalogLibraryPage />
            </DashboardLayout>
          </ManagementAdvisor>
        </MenuV2ShellRoute>
      }
    />
    <Route
      path="/admin/catalog/catalogs"
      element={
        <MenuV2ShellRoute>
          <ManagementAdvisor>
            <DashboardLayout>
              <CatalogCatalogsPage />
            </DashboardLayout>
          </ManagementAdvisor>
        </MenuV2ShellRoute>
      }
    />
    <Route
      path="/admin/catalog/publish"
      element={
        <MenuV2ShellRoute>
          <ManagementAdvisor>
            <DashboardLayout>
              <CatalogPublishPage />
            </DashboardLayout>
          </ManagementAdvisor>
        </MenuV2ShellRoute>
      }
    />
    <Route
      path="/admin/catalog/quality"
      element={
        <MenuV2ShellRoute>
          <ManagementAdvisor>
            <DashboardLayout>
              <CatalogQualityPage />
            </DashboardLayout>
          </ManagementAdvisor>
        </MenuV2ShellRoute>
      }
    />
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
    <Route
      path="/admin/catalog"
      element={
        <Navigate
          to={
            isMenuV2ShellEnabled()
              ? "/admin/catalog/setup"
              : "/admin/catalog/list"
          }
          replace
        />
      }
    />
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
          <ErrorBoundary context="AdminModulesRoute">
            <DashboardLayout>
              <ModulesPage />
            </DashboardLayout>
          </ErrorBoundary>
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
      path="/admin/inventory/waste"
      element={
        <ManagementAdvisor>
          <DashboardLayout>
            <WasteReportPage />
          </DashboardLayout>
        </ManagementAdvisor>
      }
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
      path="/admin/analytics"
      element={
        <ManagementAdvisor>
          <DashboardLayout>
            <BusinessDashboardPage />
          </DashboardLayout>
        </ManagementAdvisor>
      }
    />
    <Route
      path="/admin/analytics/menu"
      element={
        <ManagementAdvisor>
          <DashboardLayout>
            <MenuPerformancePage />
          </DashboardLayout>
        </ManagementAdvisor>
      }
    />
    <Route
      path="/admin/analytics/heatmap"
      element={
        <ManagementAdvisor>
          <DashboardLayout>
            <RevenueHeatmapPage />
          </DashboardLayout>
        </ManagementAdvisor>
      }
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
      path="/admin/privacy"
      element={
        <ManagementAdvisor>
          <DashboardLayout>
            <PrivacySettingsPage />
          </DashboardLayout>
        </ManagementAdvisor>
      }
    />
    <Route
      path="/admin/desktop"
      element={
        <ManagementAdvisor>
          <DashboardLayout>
            <AdminDesktopPage />
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
      path="/admin/devices/tpv"
      element={
        <ManagementAdvisor>
          <DashboardLayout>
            <AdminTPVTerminalsPage />
          </DashboardLayout>
        </ManagementAdvisor>
      }
    />
    <Route
      path="/admin/settings"
      element={<Navigate to="/admin/config" replace />}
    />
    <Route
      path="/admin/tables"
      element={
        <ManagementAdvisor>
          <DashboardLayout>
            <TableManagementPage />
          </DashboardLayout>
        </ManagementAdvisor>
      }
    />
    <Route
      path="/admin/printers"
      element={<Navigate to="/admin/config/impresoras" replace />}
    />
    <Route
      path="/admin/labels"
      element={<Navigate to="/admin/config/etiquetas" replace />}
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
      <Route path="etiquetas" element={<LabelsConfigPage />} />
      <Route path="integrations" element={<IntegrationsHubLayout />}>
        <Route index element={<IntegracionesConfigPage />} />
        <Route path="payments" element={<IntegrationsPaymentsPage />} />
        <Route path="whatsapp" element={<IntegrationsWhatsAppPage />} />
        <Route path="webhooks" element={<IntegrationsWebhooksPage />} />
        <Route path="delivery" element={<IntegrationsDeliveryPage />} />
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
      <Route path="reservas/disponibilidad" element={<ReservasConfigPage />} />
      <Route path="reservas/garantia" element={<ReservasConfigPage />} />
      <Route path="reservas/turnos" element={<ReservasConfigPage />} />
      <Route path="reservas/mensajes" element={<ReservasConfigPage />} />
      <Route path="tienda-online" element={<TiendaOnlineConfigPage />} />
    </Route>
    <Route
      path="/admin"
      element={<Navigate to="/admin/reports/overview" replace />}
    />
    <Route path="/config" element={<Navigate to="/admin/config" replace />} />
    <Route path="/config/*" element={<Navigate to="/admin/config" replace />} />
  </>
);
