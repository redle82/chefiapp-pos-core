/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { APP_ROUTES, OPERATIONAL_ROUTES } from "../constants/routeConstants";
import { AppStaffMobileRoutesFragment } from "./AppStaffMobileRoutes";

vi.mock("../../components/onboarding/ManagementAdvisor", () => ({
  ManagementAdvisor: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("../../components/operational/BrowserBlockGuard", () => ({
  BrowserBlockGuard: () => <Outlet />,
}));

vi.mock("../../components/operational/RequireOperational", () => ({
  RequireOperational: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("../../pages/AppStaff/AppStaffWrapper", () => ({
  AppStaffWrapper: () => <Outlet />,
}));

vi.mock("../../pages/AppStaff/AppStaffHome", () => ({
  AppStaffHome: () => <div>appstaff-home</div>,
}));

vi.mock("../../pages/AppStaff/AppStaffMobileOnlyPage", () => ({
  AppStaffMobileOnlyPage: () => <div>appstaff-mobile-only</div>,
}));

vi.mock("../../pages/AppStaff/routing/StaffAppGate", () => ({
  StaffAppGate: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("../../pages/AppStaff/routing/StaffAppShellLayout", () => ({
  StaffAppShellLayout: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("../../pages/AppStaff/routing/StaffHomeRedirect", () => ({
  StaffHomeRedirect: () => <div>staff-home-redirect</div>,
}));

vi.mock("../../pages/AppStaff/routing/StaffIndexRedirect", () => ({
  StaffIndexRedirect: () => <div>staff-index-redirect</div>,
}));

vi.mock("../../pages/AppStaff/routing/StaffRoleGuard", () => ({
  StaffRoleGuard: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("../../pages/AppStaff/apps/profile", () => ({
  StaffProfilePage: () => <div>staff-profile-page</div>,
}));

vi.mock("../../pages/AppStaff/apps/tpv", () => ({
  StaffTpvPage: () => <div>staff-tpv-page</div>,
}));

vi.mock("../../pages/AppStaff/apps/kds", () => ({
  KitchenDisplay: () => <div>kitchen-display</div>,
}));

vi.mock("../../pages/AppStaff/apps/tasks", () => ({
  ManagerTarefasPage: () => <div>manager-tarefas-page</div>,
}));

vi.mock("../../pages/AppStaff/apps/alerts", () => ({
  ManagerExcecoesPage: () => <div>manager-excecoes-page</div>,
}));

vi.mock("../../pages/AppStaff/apps/team", () => ({
  ManagerEquipePage: () => <div>manager-equipe-page</div>,
}));

vi.mock("../../pages/AppStaff/pages/ManagerTurnoPage", () => ({
  ManagerTurnoPage: () => <div>manager-turno-page</div>,
}));

vi.mock("../../pages/AppStaff/pages/OperationModePage", () => ({
  OperationModePage: () => <div>operation-mode-page</div>,
}));

vi.mock("../../pages/AppStaff/pages/ConfigDesktopOnlyPage", () => ({
  ConfigDesktopOnlyPage: () => <div>config-desktop-only-page</div>,
}));

vi.mock("../../pages/AppStaff/homes/ManagerHome", () => ({
  ManagerHome: () => <div>manager-home</div>,
}));

vi.mock("../../pages/AppStaff/homes/KitchenHome", () => ({
  KitchenHome: () => <div>kitchen-home</div>,
}));

vi.mock("../../pages/AppStaff/homes/CleaningHome", () => ({
  CleaningHome: () => <div>cleaning-home</div>,
}));

vi.mock("../../pages/AppStaff/homes/WorkerHome", () => ({
  WorkerHome: () => <div>worker-home</div>,
}));

vi.mock("../../pages/AppStaff/homes/DeliveryHome", () => ({
  DeliveryHome: () => <div>delivery-home</div>,
}));

vi.mock("../../pages/AppStaff/dashboards", () => ({
  OwnerGlobalDashboard: () => <div>owner-global-dashboard</div>,
  OperationSectorDashboard: () => <div>operation-sector-dashboard</div>,
  TasksSectorDashboard: () => <div>tasks-sector-dashboard</div>,
  TeamSectorDashboard: () => <div>team-sector-dashboard</div>,
  KitchenSectorDashboard: () => <div>kitchen-sector-dashboard</div>,
  CleaningSectorDashboard: () => <div>cleaning-sector-dashboard</div>,
}));

vi.mock("../../features/pv-mobile", () => ({
  TPVMobilePage: () => <div>tpv-mobile-page</div>,
}));

vi.mock("../../features/kds-mobile", () => ({
  KDSMobilePage: () => <div>kds-mobile-page</div>,
}));

vi.mock("../../pages/Backoffice/BackofficePage", () => ({
  BackofficePage: () => <div>backoffice-page</div>,
}));

vi.mock("../../pages/Waiter/WaiterHomePage", () => ({
  WaiterHomePage: () => <div>waiter-home-page</div>,
}));

vi.mock("../../pages/Waiter/TablePanel", () => ({
  TablePanel: () => <div>table-panel</div>,
}));

describe("AppStaffMobileRoutesFragment", () => {
  it("redirects waiter profile to the shared staff profile page", () => {
    render(
      <MemoryRouter initialEntries={["/app/waiter/profile"]}>
        <Routes>{AppStaffMobileRoutesFragment}</Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("staff-profile-page")).toBeTruthy();
  });

  it("renders the backoffice route through the management advisor wrapper", () => {
    render(
      <MemoryRouter initialEntries={["/app/backoffice"]}>
        <Routes>{AppStaffMobileRoutesFragment}</Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("backoffice-page")).toBeTruthy();
  });

  it("redirects control room to the staff operation mode", () => {
    render(
      <MemoryRouter initialEntries={["/app/control-room"]}>
        <Routes>{AppStaffMobileRoutesFragment}</Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("operation-mode-page")).toBeTruthy();
  });

  it("redirects setup tpv to the operational tpv route", () => {
    render(
      <MemoryRouter initialEntries={["/app/setup/tpv"]}>
        <Routes>
          {AppStaffMobileRoutesFragment}
          <Route
            path={OPERATIONAL_ROUTES.TPV}
            element={<div>tpv-target</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("tpv-target")).toBeTruthy();
  });

  it("renders the staff index redirect shell on the app staff root", () => {
    render(
      <MemoryRouter initialEntries={[APP_ROUTES.STAFF]}>
        <Routes>{AppStaffMobileRoutesFragment}</Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("staff-index-redirect")).toBeTruthy();
  });

  it("renders delivery subroutes inside the staff home shell", () => {
    render(
      <MemoryRouter initialEntries={["/app/staff/home/delivery/orders"]}>
        <Routes>{AppStaffMobileRoutesFragment}</Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("delivery-home")).toBeTruthy();
  });
});
