/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import {
  ADMIN_ROUTES,
  APP_ROUTES,
  OPERATIONAL_ROUTES,
} from "../constants/routeConstants";
import { OperationalDesktopRoutesFragment } from "./OperationalDesktopRoutes";

vi.mock("../../components/operational/BrowserBlockGuard", () => ({
  BrowserBlockGuard: () => <Outlet />,
}));

vi.mock("../../components/operational/OperationalFullscreenWrapper", () => ({
  OperationalFullscreenWrapper: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("../../components/operational/RequireOperational", () => ({
  RequireOperational: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("../../components/operational/ShiftGate", () => ({
  ShiftGate: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("../../pages/AppStaff/AppStaffMobileOnlyPage", () => ({
  AppStaffMobileOnlyPage: () => <div>staff-mobile-only</div>,
}));

vi.mock("../../pages/KDSMinimal/KDSMinimal", () => ({
  KDSMinimal: () => <div>kds-minimal</div>,
}));

vi.mock("../../pages/TPVMinimal/TPVLayout", () => ({
  TPVLayout: () => <Outlet />,
}));

vi.mock("../../pages/TPVMinimal/TPVPOSView", () => ({
  TPVPOSView: () => <div>tpv-pos-view</div>,
}));

vi.mock("../../pages/TPVMinimal/TPVShiftPage", () => ({
  TPVShiftPage: () => <div>tpv-shift-page</div>,
}));

vi.mock("../../pages/TPVMinimal/TPVOrdersPage", () => ({
  TPVOrdersPage: () => <div>tpv-orders-page</div>,
}));

vi.mock("../../pages/TPVMinimal/TPVTablesPage", () => ({
  TPVTablesPage: () => <div>tpv-tables-page</div>,
}));

vi.mock("../../pages/TPVMinimal/TPVKitchenPage", () => ({
  TPVKitchenPage: () => <div>tpv-kitchen-page</div>,
}));

vi.mock("../../pages/TPVMinimal/TPVHandoffPage", () => ({
  TPVHandoffPage: () => <div>tpv-handoff-page</div>,
}));

vi.mock("../../pages/TPVMinimal/TPVProductionPage", () => ({
  TPVProductionPage: () => <div>tpv-production-page</div>,
}));

vi.mock("../../pages/TPVMinimal/TPVTasksPage", () => ({
  TPVTasksPage: () => <div>tpv-tasks-page</div>,
}));

vi.mock("../../pages/TPVMinimal/TPVReservationsPage", () => ({
  TPVReservationsPage: () => <div>tpv-reservations-page</div>,
}));

vi.mock("../../pages/TPVMinimal/TPVWebEditorPage", () => ({
  TPVWebEditorPage: () => <div>tpv-web-editor-page</div>,
}));

vi.mock("../../pages/TPVMinimal/TPVSettingsPage", () => ({
  TPVSettingsPage: () => <div>tpv-settings-page</div>,
}));

vi.mock("../../ui/design-system/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("OperationalDesktopRoutesFragment", () => {
  it("redirects cash surface to TPV shift", () => {
    render(
      <MemoryRouter initialEntries={[OPERATIONAL_ROUTES.CASH]}>
        <Routes>{OperationalDesktopRoutesFragment}</Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("tpv-shift-page")).toBeTruthy();
  });

  it("redirects legacy TPV alias to operational TPV", () => {
    render(
      <MemoryRouter initialEntries={["/tpv"]}>
        <Routes>{OperationalDesktopRoutesFragment}</Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("tpv-pos-view")).toBeTruthy();
  });

  it("redirects dashboard root to reports overview", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          {OperationalDesktopRoutesFragment}
          <Route
            path={ADMIN_ROUTES.REPORTS_OVERVIEW}
            element={<div>reports-overview-target</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("reports-overview-target")).toBeTruthy();
  });

  it("redirects operational owner path to staff owner home", () => {
    render(
      <MemoryRouter initialEntries={["/op/owner"]}>
        <Routes>
          {OperationalDesktopRoutesFragment}
          <Route
            path={`${APP_ROUTES.STAFF_HOME}/owner`}
            element={<div>staff-owner-target</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("staff-owner-target")).toBeTruthy();
  });
});
