import { Fragment } from "react";
import { Navigate, Route } from "react-router-dom";
import { ManagementAdvisor } from "../../components/onboarding/ManagementAdvisor";
import { EmployeeHomePage } from "../../pages/Employee/HomePage";
import { EmployeeKDSIntelligentPage } from "../../pages/Employee/KDSIntelligentPage";
import { EmployeeOperationPage } from "../../pages/Employee/OperationPage";
import { EmployeeTasksPage } from "../../pages/Employee/TasksPage";
import { ManagerAnalysisPage } from "../../pages/Manager/AnalysisPage";
import { ManagerCentralPage } from "../../pages/Manager/CentralPage";
import { ManagerDashboardPage } from "../../pages/Manager/DashboardPage";
import { ManagerReservationsPage } from "../../pages/Manager/ReservationsPage";
import { ManagerScheduleCreatePage } from "../../pages/Manager/ScheduleCreatePage";
import { ManagerSchedulePage } from "../../pages/Manager/SchedulePage";
import { OwnerPurchasesPage } from "../../pages/Owner/PurchasesPage";
import { OwnerSimulationPage } from "../../pages/Owner/SimulationPage";
import { OwnerStockRealPage } from "../../pages/Owner/StockRealPage";
import { OwnerVisionPage } from "../../pages/Owner/VisionPage";

export const LegacyManagementRoutesFragment = (
  <Fragment>
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
  </Fragment>
);
