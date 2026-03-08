/**
 * @vitest-environment jsdom
 */

import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LegacyManagementRoutesFragment } from "./LegacyManagementRoutes";

vi.mock("../../components/onboarding/ManagementAdvisor", () => ({
  ManagementAdvisor: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("../../pages/Employee/HomePage", () => ({
  EmployeeHomePage: () => <div>employee-home-page</div>,
}));

vi.mock("../../pages/Employee/TasksPage", () => ({
  EmployeeTasksPage: () => <div>employee-tasks-page</div>,
}));

vi.mock("../../pages/Employee/OperationPage", () => ({
  EmployeeOperationPage: () => <div>employee-operation-page</div>,
}));

vi.mock("../../pages/Employee/KDSIntelligentPage", () => ({
  EmployeeKDSIntelligentPage: () => <div>employee-kds-page</div>,
}));

vi.mock("../../pages/Manager/DashboardPage", () => ({
  ManagerDashboardPage: () => <div>manager-dashboard-page</div>,
}));

vi.mock("../../pages/Manager/CentralPage", () => ({
  ManagerCentralPage: () => <div>manager-central-page</div>,
}));

vi.mock("../../pages/Manager/AnalysisPage", () => ({
  ManagerAnalysisPage: () => <div>manager-analysis-page</div>,
}));

vi.mock("../../pages/Manager/SchedulePage", () => ({
  ManagerSchedulePage: () => <div>manager-schedule-page</div>,
}));

vi.mock("../../pages/Manager/ScheduleCreatePage", () => ({
  ManagerScheduleCreatePage: () => <div>manager-schedule-create-page</div>,
}));

vi.mock("../../pages/Manager/ReservationsPage", () => ({
  ManagerReservationsPage: () => <div>manager-reservations-page</div>,
}));

vi.mock("../../pages/Owner/VisionPage", () => ({
  OwnerVisionPage: () => <div>owner-vision-page</div>,
}));

vi.mock("../../pages/Owner/StockRealPage", () => ({
  OwnerStockRealPage: () => <div>owner-stock-page</div>,
}));

vi.mock("../../pages/Owner/SimulationPage", () => ({
  OwnerSimulationPage: () => <div>owner-simulation-page</div>,
}));

vi.mock("../../pages/Owner/PurchasesPage", () => ({
  OwnerPurchasesPage: () => <div>owner-purchases-page</div>,
}));

describe("LegacyManagementRoutesFragment", () => {
  it("renders the employee home route", () => {
    render(
      <MemoryRouter initialEntries={["/employee/home"]}>
        <Routes>{LegacyManagementRoutesFragment}</Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("employee-home-page")).toBeTruthy();
  });

  it("redirects employee mentor to the mentor route", () => {
    render(
      <MemoryRouter initialEntries={["/employee/mentor"]}>
        <Routes>
          {LegacyManagementRoutesFragment}
          <Route path="/mentor" element={<div>mentor-target</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("mentor-target")).toBeTruthy();
  });

  it("renders the manager dashboard route", () => {
    render(
      <MemoryRouter initialEntries={["/manager/dashboard"]}>
        <Routes>{LegacyManagementRoutesFragment}</Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("manager-dashboard-page")).toBeTruthy();
  });

  it("renders the owner purchases route", () => {
    render(
      <MemoryRouter initialEntries={["/owner/purchases"]}>
        <Routes>{LegacyManagementRoutesFragment}</Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("owner-purchases-page")).toBeTruthy();
  });
});
