import { Navigate, Route } from "react-router-dom";
import { ManagementAdvisor } from "../../components/onboarding/ManagementAdvisor";
import { AlertsDashboardPage } from "../../pages/Alerts/AlertsDashboardPage";
import { BillingPage } from "../../pages/Billing/BillingPage";
import { HealthDashboardPage } from "../../pages/Health/HealthDashboardPage";
import { HelpPage } from "../../pages/Help/HelpPage";
import { InstallAppsPage } from "../../pages/InstallAppsPage";
import { InstallPage } from "../../pages/InstallPage";
import { PeopleDashboardPage } from "../../pages/People/PeopleDashboardPage";
import { TimeTrackingPage } from "../../pages/People/TimeTrackingPage";
import { PublishPage } from "../../pages/PublishPage";
import { PurchasesDashboardPage } from "../../pages/Purchases/PurchasesDashboardPage";
import { DailyClosingReportPage } from "../../pages/Reports/DailyClosingReportPage";
import { SaftExportPage } from "../../pages/Reports/SaftExportPage";
import { SalesByPeriodReportPage } from "../../pages/Reports/SalesByPeriodReportPage";
import { SalesSummaryReportPage } from "../../pages/Reports/SalesSummaryReportPage";
import { SystemTreePage } from "../../pages/SystemTree/SystemTreePage";
import { RecurringTasksPage } from "../../pages/Tasks/RecurringTasksPage";
import { TaskDashboardPage } from "../../pages/Tasks/TaskDashboardPage";
import { TaskDetailPage } from "../../pages/Tasks/TaskDetailPage";

export const UtilityRoutesFragment = (
  <>
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
    <Route
      path="/app/install"
      element={<Navigate to="/admin/devices" replace />}
    />
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
    <Route
      path="/app/web/preview"
      element={<Navigate to="/dashboard" replace />}
    />
  </>
);
