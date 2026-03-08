/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Outlet, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setCatalogFeatureFlagsForTests } from "../../core/catalog/catalogFeatureFlags";
import { ADMIN_ROUTES } from "../constants/routeConstants";

afterEach(() => {
  setCatalogFeatureFlagsForTests({
    menuV2Shell: true,
    menuV2QuickBuild: true,
    menuV2CatalogModel: false,
    menuV2Publication: false,
    menuV2Quality: false,
    menuV2ImportAI: false,
  });
});

async function renderAdminRoutes(initialEntry: string) {
  const { AdminRoutesFragment } = await import("./AdminRoutes");

  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>{AdminRoutesFragment}</Routes>
    </MemoryRouter>,
  );
}

vi.mock("../../components/onboarding/ManagementAdvisor", () => ({
  ManagementAdvisor: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("../../context/OnboardingContext", () => ({
  OnboardingProvider: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("../../features/admin/dashboard/components/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("../../features/admin/config/components/AdminConfigLayout", () => ({
  AdminConfigLayout: () => <Outlet />,
}));

vi.mock("../../features/admin/config/components/IntegrationsHubLayout", () => ({
  IntegrationsHubLayout: () => <Outlet />,
}));

vi.mock("../../ui/design-system/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("../../features/admin/modules/pages/ModulesPage", () => ({
  ModulesPage: () => <div>modules-page</div>,
}));

vi.mock("@/core/i18n/regionLocaleConfig", () => ({
  getFormatLocale: () => "pt-PT",
}));

vi.mock("../../features/admin/reports/AdminReportsOverview", () => ({
  AdminReportsOverview: () => <div>admin-reports-overview</div>,
}));

vi.mock("../../features/admin/config/pages/GeneralConfigPage", () => ({
  GeneralConfigPage: () => <div>general-config-page</div>,
}));

vi.mock("../../features/admin/catalog/pages/CatalogListPage", () => ({
  CatalogListPage: () => <div>catalog-list-page</div>,
}));

vi.mock("../../features/admin/catalog/pages/CatalogAssignmentsPage", () => ({
  CatalogAssignmentsPage: () => <div>catalog-assignments-page</div>,
}));

vi.mock("../../features/admin/catalog/pages/CatalogSetupPage", () => ({
  CatalogSetupPage: () => <div>catalog-setup-page</div>,
}));

vi.mock("../../features/admin/catalog/pages/CatalogLibraryPage", () => ({
  CatalogLibraryPage: () => <div>catalog-library-page</div>,
}));

vi.mock("../../features/admin/catalog/pages/CatalogCatalogsPage", () => ({
  CatalogCatalogsPage: () => <div>catalog-catalogs-page</div>,
}));

vi.mock("../../features/admin/catalog/pages/CatalogPublishPage", () => ({
  CatalogPublishPage: () => <div>catalog-publish-page</div>,
}));

vi.mock("../../features/admin/catalog/pages/CatalogQualityPage", () => ({
  CatalogQualityPage: () => <div>catalog-quality-page</div>,
}));

vi.mock("../../features/admin/catalog/pages/ProductsPage", () => ({
  ProductsPage: () => <div>products-page</div>,
}));

vi.mock("../../features/admin/catalog/pages/ModifiersPage", () => ({
  ModifiersPage: () => <div>modifiers-page</div>,
}));

vi.mock("../../features/admin/catalog/pages/CombosPage", () => ({
  CombosPage: () => <div>combos-page</div>,
}));

vi.mock("../../features/admin/catalog/pages/TranslationsPage", () => ({
  TranslationsPage: () => <div>translations-page</div>,
}));

vi.mock("../../features/admin/observability/pages/ObservabilityPage", () => ({
  ObservabilityPage: () => <div>observability-page</div>,
}));

vi.mock("../../features/admin/devices/AdminDesktopPage", () => ({
  AdminDesktopPage: () => <div>admin-desktop-page</div>,
}));

vi.mock("../../features/admin/devices/AdminDevicesPage", () => ({
  AdminDevicesPage: () => <div>admin-devices-page</div>,
}));

vi.mock("../../features/admin/reports/MultiUnitOverviewReportPage", () => ({
  MultiUnitOverviewReportPage: () => <div>multiunit-overview-page</div>,
}));

vi.mock("../../pages/Reports/OperationalActivityReportPage", () => ({
  OperationalActivityReportPage: () => (
    <div>operational-activity-report-page</div>
  ),
}));

vi.mock("../../pages/Reports/GamificationImpactReportPage", () => ({
  GamificationImpactReportPage: () => (
    <div>gamification-impact-report-page</div>
  ),
}));

vi.mock("../../pages/Reports/SalesByPeriodReportPage", () => ({
  SalesByPeriodReportPage: () => <div>sales-by-period-report-page</div>,
}));

vi.mock("../../features/admin/config/pages/DeliveryConfigPage", () => ({
  DeliveryConfigPage: () => <div>delivery-config-page</div>,
}));

vi.mock("../../features/admin/config/pages/DispositivosConfigPage", () => ({
  DispositivosConfigPage: () => <div>dispositivos-config-page</div>,
}));

vi.mock("../../features/admin/config/pages/EmpleadosConfigPage", () => ({
  EmpleadosConfigPage: () => <div>empleados-config-page</div>,
}));

vi.mock("../../features/admin/config/pages/EntidadesLegalesConfigPage", () => ({
  EntidadesLegalesConfigPage: () => <div>entidades-legales-config-page</div>,
}));

vi.mock("../../features/admin/config/pages/ImpresorasConfigPage", () => ({
  ImpresorasConfigPage: () => <div>impresoras-config-page</div>,
}));

vi.mock("../../features/admin/config/pages/IntegracionesConfigPage", () => ({
  IntegracionesConfigPage: () => <div>integraciones-config-page</div>,
}));

vi.mock("../../features/admin/config/pages/LabelsConfigPage", () => ({
  LabelsConfigPage: () => <div>labels-config-page</div>,
}));

vi.mock("../../features/admin/config/pages/MarcasConfigPage", () => ({
  MarcasConfigPage: () => <div>marcas-config-page</div>,
}));

vi.mock("../../features/admin/config/pages/ReservasConfigPage", () => ({
  ReservasConfigPage: () => <div>reservas-config-page</div>,
}));

vi.mock("../../features/admin/config/pages/SoftwareTpvConfigPage", () => ({
  SoftwareTpvConfigPage: () => <div>software-tpv-config-page</div>,
}));

vi.mock("../../features/admin/config/pages/SuscripcionConfigPage", () => ({
  SuscripcionConfigPage: () => <div>suscripcion-config-page</div>,
}));

vi.mock("../../features/admin/config/pages/TiendaOnlineConfigPage", () => ({
  TiendaOnlineConfigPage: () => <div>tienda-online-config-page</div>,
}));

vi.mock("../../features/admin/config/pages/UbicacionesConfigPage", () => ({
  UbicacionesConfigPage: () => <div>ubicaciones-config-page</div>,
}));

vi.mock("../../features/admin/config/pages/UsuariosConfigPage", () => ({
  UsuariosConfigPage: () => <div>usuarios-config-page</div>,
}));

vi.mock("../../features/admin/config/pages/integrations", () => ({
  IntegrationsDeliveryPage: () => <div>integrations-delivery-page</div>,
  IntegrationsOtherPage: () => <div>integrations-other-page</div>,
  IntegrationsPaymentsPage: () => <div>integrations-payments-page</div>,
  IntegrationsWebhooksPage: () => <div>integrations-webhooks-page</div>,
  IntegrationsWhatsAppPage: () => <div>integrations-whatsapp-page</div>,
}));

describe("AdminRoutesFragment", () => {
  it("redirects /admin/catalog to setup when menu v2 shell is enabled", async () => {
    setCatalogFeatureFlagsForTests({ menuV2Shell: true });
    await renderAdminRoutes("/admin/catalog");

    expect(screen.getByText("catalog-setup-page")).toBeTruthy();
  });

  it("redirects /admin/catalog to legacy list when menu v2 shell is disabled", async () => {
    setCatalogFeatureFlagsForTests({ menuV2Shell: false });
    await renderAdminRoutes("/admin/catalog");

    expect(screen.getByText("catalog-list-page")).toBeTruthy();
  });

  it("redirects /admin/catalog/setup to legacy list when menu v2 shell is disabled", async () => {
    setCatalogFeatureFlagsForTests({ menuV2Shell: false });
    await renderAdminRoutes("/admin/catalog/setup");

    expect(screen.getByText("catalog-list-page")).toBeTruthy();
  });

  it("renders the admin modules route", async () => {
    await renderAdminRoutes("/admin/modules");

    expect(screen.getByText("modules-page")).toBeTruthy();
  });

  it("redirects /admin/reports to reports overview", async () => {
    await renderAdminRoutes("/admin/reports");

    expect(screen.getByText("admin-reports-overview")).toBeTruthy();
  });

  it("redirects /admin to reports overview", async () => {
    await renderAdminRoutes("/admin");

    expect(screen.getByText("admin-reports-overview")).toBeTruthy();
  });

  it("redirects legacy /config to admin config general", async () => {
    await renderAdminRoutes("/config");

    expect(screen.getByText("general-config-page")).toBeTruthy();
  });

  it("renders admin devices through the dashboard layout", async () => {
    await renderAdminRoutes(ADMIN_ROUTES.DEVICES);

    expect(screen.getByText("admin-devices-page")).toBeTruthy();
  });
});
