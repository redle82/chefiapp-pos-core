/**
 * @vitest-environment jsdom
 */

import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { UtilityRoutesFragment } from "./UtilityRoutes";

vi.mock("../../components/onboarding/ManagementAdvisor", () => ({
  ManagementAdvisor: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("../../pages/SystemTree/SystemTreePage", () => ({
  SystemTreePage: () => <div>system-tree-page</div>,
}));

vi.mock("../../pages/Tasks/TaskDashboardPage", () => ({
  TaskDashboardPage: () => <div>task-dashboard-page</div>,
}));

vi.mock("../../pages/Tasks/TaskDetailPage", () => ({
  TaskDetailPage: () => <div>task-detail-page</div>,
}));

vi.mock("../../pages/Tasks/RecurringTasksPage", () => ({
  RecurringTasksPage: () => <div>recurring-tasks-page</div>,
}));

vi.mock("../../pages/People/PeopleDashboardPage", () => ({
  PeopleDashboardPage: () => <div>people-dashboard-page</div>,
}));

vi.mock("../../pages/People/TimeTrackingPage", () => ({
  TimeTrackingPage: () => <div>time-tracking-page</div>,
}));

vi.mock("../../pages/Health/HealthDashboardPage", () => ({
  HealthDashboardPage: () => <div>health-dashboard-page</div>,
}));

vi.mock("../../pages/Alerts/AlertsDashboardPage", () => ({
  AlertsDashboardPage: () => <div>alerts-dashboard-page</div>,
}));

vi.mock("../../pages/Purchases/PurchasesDashboardPage", () => ({
  PurchasesDashboardPage: () => <div>purchases-dashboard-page</div>,
}));

vi.mock("../../pages/Billing/BillingPage", () => ({
  BillingPage: () => <div>billing-page</div>,
}));

vi.mock("../../pages/PublishPage", () => ({
  PublishPage: () => <div>publish-page</div>,
}));

vi.mock("../../pages/InstallPage", () => ({
  InstallPage: () => <div>install-page</div>,
}));

vi.mock("../../pages/InstallAppsPage", () => ({
  InstallAppsPage: () => <div>install-apps-page</div>,
}));

vi.mock("../../pages/Help/HelpPage", () => ({
  HelpPage: () => <div>help-page</div>,
}));

vi.mock("../../pages/Reports/DailyClosingReportPage", () => ({
  DailyClosingReportPage: () => <div>daily-closing-report-page</div>,
}));

vi.mock("../../pages/Reports/SaftExportPage", () => ({
  SaftExportPage: () => <div>saft-export-page</div>,
}));

vi.mock("../../pages/Reports/SalesByPeriodReportPage", () => ({
  SalesByPeriodReportPage: () => <div>sales-by-period-report-page</div>,
}));

vi.mock("../../pages/Reports/SalesSummaryReportPage", () => ({
  SalesSummaryReportPage: () => <div>sales-summary-report-page</div>,
}));

describe("UtilityRoutesFragment", () => {
  it("renders the task dashboard route", () => {
    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <Routes>{UtilityRoutesFragment}</Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("task-dashboard-page")).toBeTruthy();
  });

  it("renders the app billing route", () => {
    render(
      <MemoryRouter initialEntries={["/app/billing"]}>
        <Routes>{UtilityRoutesFragment}</Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("billing-page")).toBeTruthy();
  });

  it("redirects app install to admin devices", () => {
    render(
      <MemoryRouter initialEntries={["/app/install"]}>
        <Routes>
          {UtilityRoutesFragment}
          <Route
            path="/admin/devices"
            element={<div>admin-devices-target</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("admin-devices-target")).toBeTruthy();
  });

  it("redirects finance reports to dashboard", () => {
    render(
      <MemoryRouter initialEntries={["/app/reports/finance"]}>
        <Routes>
          {UtilityRoutesFragment}
          <Route path="/dashboard" element={<div>dashboard-target</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("dashboard-target")).toBeTruthy();
  });

  it("renders the install apps route", () => {
    render(
      <MemoryRouter initialEntries={["/install/apps"]}>
        <Routes>{UtilityRoutesFragment}</Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("install-apps-page")).toBeTruthy();
  });
});
